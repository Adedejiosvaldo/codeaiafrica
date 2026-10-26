"""The AI and chunker proxy for interactive labs. The API key stays on the server."""
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import services
import hashlib
import json

from ..models import AICache, AIUsage, Learner
from ..security import get_db
from .learner import get_learner

router = APIRouter(prefix="/api/learner", tags=["ai"])
LAGOS = timezone(timedelta(hours=1))
CHUNK_DAILY_LIMIT = 300  # chunking is free to run; this only stops runaway loops


def today():
    return datetime.now(LAGOS).date().isoformat()


class ChatIn(BaseModel):
    messages: list[dict[str, Any]] = Field(min_length=1, max_length=40)
    model: str | None = None
    temperature: float = Field(0.7, ge=0, le=2)
    max_tokens: int | None = Field(None, ge=1)
    tools: list[dict[str, Any]] | None = Field(None, max_length=10)
    tool_choice: Any = None
    json_mode: bool = False


class EmbedIn(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=100)


class ChunkIn(BaseModel):
    text: str = Field(min_length=1, max_length=200_000)
    chunk_size: int = Field(500, ge=20, le=5000)
    overlap: int = Field(50, ge=0)
    recursive: bool = True
    separator: str | None = Field(None, max_length=10)


def calls_today(db, learner_id=None, kinds=("chat", "embed")):
    q = select(func.count(AIUsage.id)).where(AIUsage.day == today(), AIUsage.kind.in_(kinds))
    if learner_id is not None:
        q = q.where(AIUsage.learner_id == learner_id)
    return db.scalar(q) or 0


def guard_ai(request: Request, learner: Learner, db: Session):
    cfg = request.app.state.config
    if calls_today(db, learner.id) >= cfg.ai_daily_limit:
        raise HTTPException(429, f"You've used today's {cfg.ai_daily_limit} AI calls. They reset at midnight (Lagos time). "
                                 "Tip: store replies in variables instead of calling again.")
    if calls_today(db) >= cfg.ai_daily_budget:
        raise HTTPException(429, "The class has used today's AI budget. It resets at midnight (Lagos time).")


def record(db, learner, kind, model="", usage=None, ok=True):
    usage = usage or {}
    db.add(AIUsage(learner_id=learner.id, day=today(), kind=kind, model=model, ok=ok,
                   tokens_in=usage.get("prompt_tokens", 0) or 0, tokens_out=usage.get("completion_tokens", 0) or 0))
    db.commit()


def cache_key(kind, payload):
    return hashlib.sha256(f"{kind}|{json.dumps(payload, sort_keys=True)}".encode()).hexdigest()


def cached(db, learner, key):
    row = db.scalar(select(AICache).where(AICache.learner_id == learner.id, AICache.key == key))
    return row.response if row and row.day == today() else None


def save_cache(db, learner, key, response):
    row = db.scalar(select(AICache).where(AICache.learner_id == learner.id, AICache.key == key))
    if row:
        row.day, row.response = today(), response
    else:
        db.add(AICache(learner_id=learner.id, key=key, day=today(), response=response))
    db.commit()


def remaining(request, db, learner):
    cfg = request.app.state.config
    return max(0, cfg.ai_daily_limit - calls_today(db, learner.id))


@router.get("/{token}/ai/usage")
def usage(request: Request, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    cfg = request.app.state.config
    return {"used": calls_today(db, learner.id), "limit": cfg.ai_daily_limit, "remaining": remaining(request, db, learner),
            "chat": bool(cfg.ai_api_key), "embeddings": bool(cfg.embed_base_url and cfg.embed_model),
            "chunker": bool(cfg.chunker_url), "models": cfg.ai_models}


@router.post("/{token}/ai/chat")
def chat(body: ChatIn, request: Request, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    cfg = request.app.state.config
    if not cfg.ai_api_key:
        raise HTTPException(503, "AI isn't set up on this server yet. Please tell your TA.")
    model = body.model or cfg.ai_models[0]
    if model not in cfg.ai_models:
        raise HTTPException(400, f"Model {model!r} isn't allowed here. Use one of: {', '.join(cfg.ai_models)}.")
    if sum(len(str(m.get("content") or "")) for m in body.messages) > 24_000:
        raise HTTPException(400, "That's too much text for one call. Send less, for example only the most relevant chunks.")
    payload = {"model": model, "messages": body.messages, "temperature": body.temperature,
               "max_tokens": min(body.max_tokens or cfg.ai_max_tokens, cfg.ai_max_tokens)}
    if body.tools:
        payload["tools"] = body.tools
        if body.tool_choice is not None:
            payload["tool_choice"] = body.tool_choice
    if body.json_mode:
        payload["response_format"] = {"type": "json_object"}
    # The same request again today (a re-run, or the lab replaying earlier steps) gets the saved reply, free
    key = cache_key("chat", payload)
    hit = cached(db, learner, key)
    if hit:
        return {**hit, "cached": True, "remaining": remaining(request, db, learner)}
    guard_ai(request, learner, db)
    try:
        message, use = services.chat(request.app.state.http, cfg, payload)
    except HTTPException:
        record(db, learner, "chat", model, ok=False)
        raise
    record(db, learner, "chat", model, use)
    out = {"role": "assistant", "content": message.get("content")}
    if message.get("tool_calls"):
        out["tool_calls"] = message["tool_calls"]
    save_cache(db, learner, key, {"message": out, "usage": use})
    return {"message": out, "usage": use, "remaining": remaining(request, db, learner)}


@router.post("/{token}/ai/embed")
def embed(body: EmbedIn, request: Request, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    cfg = request.app.state.config
    if not (cfg.embed_base_url and cfg.embed_model):
        raise HTTPException(503, "Embeddings aren't set up on this server yet. Please tell your TA.")
    if any(len(t) > 8000 for t in body.texts):
        raise HTTPException(400, "Each text can be at most 8,000 characters. Chunk long documents first.")
    key = cache_key("embed", {"model": cfg.embed_model, "texts": body.texts})
    hit = cached(db, learner, key)
    if hit:
        return {**hit, "cached": True, "remaining": remaining(request, db, learner)}
    guard_ai(request, learner, db)
    try:
        vectors, use = services.embed(request.app.state.http, cfg, body.texts)
    except HTTPException:
        record(db, learner, "embed", cfg.embed_model, ok=False)
        raise
    record(db, learner, "embed", cfg.embed_model, use)
    save_cache(db, learner, key, {"embeddings": vectors})
    return {"embeddings": vectors, "remaining": remaining(request, db, learner)}


@router.post("/{token}/chunk")
def chunk(body: ChunkIn, request: Request, learner: Learner = Depends(get_learner), db: Session = Depends(get_db)):
    cfg = request.app.state.config
    if not cfg.chunker_url:
        raise HTTPException(503, "The chunker isn't set up on this server yet. Please tell your TA.")
    if body.overlap >= body.chunk_size:
        raise HTTPException(400, "overlap must be smaller than chunk_size.")
    if calls_today(db, learner.id, kinds=("chunk",)) >= CHUNK_DAILY_LIMIT:
        raise HTTPException(429, "You've chunked a lot today. Try again tomorrow, or reuse chunks you already have.")
    note = ""
    overlap = body.overlap
    if overlap == 0:  # the chunker's API requires overlap >= 1 for now
        overlap, note = 1, "The chunker needs an overlap of at least 1, so 1 was used."
    payload = {"text": body.text, "chunk_size": body.chunk_size, "overlap": overlap, "recursive": body.recursive}
    if body.separator:
        payload["separator"] = body.separator
    chunks = services.chunk(request.app.state.http, cfg, payload)
    record(db, learner, "chunk")
    return {"chunks": chunks, "count": len(chunks), "note": note}
