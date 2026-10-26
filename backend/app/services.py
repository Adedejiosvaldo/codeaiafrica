"""Calls to outside services: the document chunker and the AI provider."""
import httpx


def chunker_alive(cfg):
    try:
        r = httpx.post(f"{cfg.chunker_url.rstrip('/')}/v1/chunk", timeout=3,
                       json={"text": "health check", "chunk_size": 50, "overlap": 1})
        return r.status_code == 200
    except httpx.HTTPError:
        return False
