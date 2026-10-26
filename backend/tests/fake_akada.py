"""A stand-in for the lab's `akada` module, backed by the fake provider, for testing lab content in CPython."""
import json
import types

import httpx

from fake_provider import _vector, chat_reply, handle


def make_module():
    m = types.ModuleType("akada")

    class AIError(Exception):
        pass

    m.AIError = AIError
    m._fail_next = None
    m.calls = 0

    def _maybe_fail():
        if m._fail_next:
            msg, m._fail_next = m._fail_next, None
            raise AIError(msg)
        m.calls += 1

    def chat(messages, temperature=0.7, model=None, max_tokens=None, tools=None, tool_choice=None, json_mode=False):
        _maybe_fail()
        body = {"messages": messages, "temperature": temperature, "tools": tools}
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        return chat_reply(body)

    def ask(prompt, system="You are a helpful assistant.", temperature=0.7, model=None):
        return chat([{"role": "system", "content": system}, {"role": "user", "content": prompt}], temperature) ["content"]

    def embed(texts):
        _maybe_fail()
        return _vector(texts) if isinstance(texts, str) else [_vector(t) for t in texts]

    def chunk(text, size=500, overlap=50, recursive=True, details=False):
        _maybe_fail()
        r = handle(httpx.Request("POST", "http://x/v1/chunk", content=json.dumps({"text": text, "chunk_size": size})))
        chunks = r.json()["chunks"]
        return chunks if details else [c["text"] for c in chunks]

    def usage():
        return {"used": m.calls, "limit": 100, "remaining": 100 - m.calls}

    m.chat, m.ask, m.embed, m.chunk, m.usage = chat, ask, embed, chunk, usage
    return m
