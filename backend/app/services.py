"""Calls to outside services: the AI provider and the document chunker.

Every call goes through one shared httpx client (app.state.http), so tests can swap in a fake transport.
"""
import time
from threading import BoundedSemaphore

import httpx
from fastapi import HTTPException

# At most this many provider calls at once; the rest wait their turn (smooths Saturday-session bursts)
_slots = BoundedSemaphore(8)


def make_client(transport=None):
    return httpx.Client(timeout=httpx.Timeout(60, connect=10), transport=transport)


def chunker_alive(cfg, client=None):
    client = client or httpx
    try:
        r = client.post(f"{cfg.chunker_url.rstrip('/')}/v1/chunk", timeout=3,
                        json={"text": "health check", "chunk_size": 50, "overlap": 1})
        return r.status_code == 200
    except httpx.HTTPError:
        return False


def _call(client, url, key, payload, retries=2):
    """POST JSON to a provider, retrying briefly if it says it's busy (429/5xx)."""
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    with _slots:
        for attempt in range(retries + 1):
            try:
                r = client.post(url, json=payload, headers=headers)
            except httpx.TimeoutException:
                raise HTTPException(504, "The AI service took too long to answer. Try again in a moment.")
            except httpx.HTTPError:
                raise HTTPException(502, "Couldn't reach the AI service. Try again in a moment.")
            if r.status_code in (429, 500, 502, 503) and attempt < retries:
                wait = min(float(r.headers.get("retry-after", 0) or 0) or 1.5 * (attempt + 1), 5)
                time.sleep(wait)
                continue
            return r
    return r


def provider_error(r):
    """Turn a provider's error into a message a learner can act on."""
    if r.status_code in (401, 403):
        return HTTPException(503, "The AI service isn't set up correctly on our side. Please tell your TA.")
    if r.status_code == 429:
        return HTTPException(429, "The AI service is busy right now. Wait a minute and try again.")
    if r.status_code == 404:
        return HTTPException(400, "That model isn't available. Use the default model.")
    if r.status_code == 400:
        try:
            msg = r.json().get("error", {}).get("message", "")
        except ValueError:
            msg = ""
        return HTTPException(400, f"The AI service didn't accept that request. {msg}".strip())
    return HTTPException(502, "The AI service had a problem. Try again in a moment.")


def chat(client, cfg, payload):
    r = _call(client, f"{cfg.ai_base_url.rstrip('/')}/chat/completions", cfg.ai_api_key, payload)
    if r.status_code != 200:
        raise provider_error(r)
    data = r.json()
    return data["choices"][0]["message"], data.get("usage") or {}


def embed(client, cfg, texts):
    r = _call(client, f"{cfg.embed_base_url.rstrip('/')}/embeddings", cfg.embed_api_key,
              {"model": cfg.embed_model, "input": texts})
    if r.status_code != 200:
        raise provider_error(r)
    data = r.json()
    rows = sorted(data["data"], key=lambda d: d.get("index", 0))
    return [row["embedding"] for row in rows], data.get("usage") or {}


def chunk(client, cfg, payload):
    try:
        r = client.post(f"{cfg.chunker_url.rstrip('/')}/v1/chunk", json=payload, timeout=30)
    except httpx.HTTPError:
        raise HTTPException(502, "The chunker isn't responding. Try again in a moment, or tell your TA.")
    data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code != 200 or not data.get("success"):
        raise HTTPException(400, f"The chunker couldn't split that text: {data.get('error', r.status_code)}")
    return data["chunks"]
