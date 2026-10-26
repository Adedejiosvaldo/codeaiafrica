"""A stand-in for an OpenAI-compatible AI provider (and the chunker), for tests and local demos.

Use in tests through httpx.MockTransport(handle), or run as a server:
    python tests/fake_provider.py 9000
then set AI_BASE_URL=http://127.0.0.1:9000/v1, EMBED_BASE_URL=http://127.0.0.1:9000/v1, EMBED_MODEL=fake-embed.
Replies are predictable so lab checks and browser tests can rely on them.
"""
import hashlib
import json
import math
import re
import sys

import httpx

SMS_JSON = {"name": "ADEBAYO OLUWASEUN", "amount": 15500, "date": "2026-03-12"}
TOOL_ARGS = {
    "get_food_price": {"commodity": "rice", "market": "Kano"},
    "calculator": {"expression": "(1200 - 800) / 800 * 100"},
}


def _vector(text, dims=64):
    vec = [0.0] * dims
    for word in re.findall(r"[a-z0-9]+", text.lower()):
        h = int(hashlib.md5(word.encode()).hexdigest(), 16)
        vec[h % dims] += 1.0 if (h >> 8) % 2 else -1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def chat_reply(body):
    messages = body["messages"]
    last_user = next((m for m in reversed(messages) if m.get("role") == "user"), {})
    text = str(last_user.get("content") or "")
    tools = body.get("tools") or []
    tool_results = [m for m in messages if m.get("role") == "tool"]
    if tools and not tool_results:
        fn = tools[0]["function"]["name"]
        return {"role": "assistant", "content": None, "tool_calls": [{
            "id": "call_1", "type": "function",
            "function": {"name": fn, "arguments": json.dumps(TOOL_ARGS.get(fn, {}))}}]}
    if tool_results:
        return {"role": "assistant", "content": f"Based on the tool: {tool_results[-1]['content']}"}
    if "Acct" in text or body.get("response_format"):
        return {"role": "assistant", "content": "```json\n" + json.dumps(SMS_JSON) + "\n```"}
    system = next((m["content"] for m in messages if m.get("role") == "system"), "")
    if "[chunk" in text or "[chunk" in system:
        cited = re.findall(r"\[chunk (\d+)\]", text + system)
        return {"role": "assistant", "content": f"From the handbook: classes are on Saturdays [chunk {cited[0] if cited else 1}]."}
    style = f" in the style of: {system[:40]}" if system and system != "You are a helpful assistant." else ""
    return {"role": "assistant", "content": f"(t={body.get('temperature')}) Practice reply{style} to: {text[:80]}"}


def handle(request: httpx.Request) -> httpx.Response:
    path = request.url.path
    body = json.loads(request.content or b"{}")
    if path.endswith("/chat/completions"):
        if request.headers.get("authorization") == "Bearer bad-key":
            return httpx.Response(401, json={"error": {"message": "Invalid API key"}})
        return httpx.Response(200, json={"choices": [{"message": chat_reply(body)}],
                                         "usage": {"prompt_tokens": 10, "completion_tokens": 5}})
    if path.endswith("/embeddings"):
        texts = body["input"] if isinstance(body["input"], list) else [body["input"]]
        return httpx.Response(200, json={"data": [{"index": i, "embedding": _vector(t)} for i, t in enumerate(texts)],
                                         "usage": {"prompt_tokens": len(texts)}})
    if path.endswith("/v1/chunk"):
        words, size, chunks, start = body["text"].split(" "), body["chunk_size"], [], 0
        current = ""
        for w in words:
            if current and len(current) + len(w) + 1 > size:
                chunks.append(current)
                current = w
            else:
                current = f"{current} {w}".strip()
        chunks.append(current)
        out = []
        for i, c in enumerate(chunks):
            out.append({"index": i + 1, "text": c, "start_char": start, "end_char": start + len(c), "char_count": len(c)})
            start += len(c) + 1
        return httpx.Response(200, json={"success": True, "chunks": out, "count": len(out)})
    return httpx.Response(404, json={"error": "not found"})


if __name__ == "__main__":
    # Serve the same fake over HTTP for browser tests
    from starlette.applications import Starlette
    from starlette.requests import Request
    from starlette.responses import Response
    from starlette.routing import Route
    import uvicorn

    async def endpoint(request: Request):
        req = httpx.Request(request.method, str(request.url), headers=request.headers, content=await request.body())
        r = handle(req)
        return Response(r.content, status_code=r.status_code, media_type="application/json")

    app = Starlette(routes=[Route("/{path:path}", endpoint, methods=["POST"])])
    uvicorn.run(app, host="127.0.0.1", port=int(sys.argv[1]) if len(sys.argv) > 1 else 9000)
