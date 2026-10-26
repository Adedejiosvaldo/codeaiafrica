// The `akada` Python module available inside interactive labs.
// Calls go to the Akada Labs server, which holds the API key and counts daily calls.
// Python runs in a Web Worker, where synchronous requests are allowed, so learner code needs no `await`.
export const AKADA_MODULE = String.raw`
"""Akada Labs helpers for the interactive labs.

    from akada import ask, chat, embed, chunk, usage, AIError

Your calls go through the Akada Labs server. It keeps the API key secret and
counts your AI calls for the day. Run help(ask) to read about any of them.
"""
import json as _json
from js import XMLHttpRequest as _XHR

_BASE = ""
_fail_next = None  # lab checks use this to simulate a failure


class AIError(Exception):
    """An AI call didn't work: your daily calls are used up, the service is busy, or the request was wrong."""


def _request(method, path, payload=None):
    global _fail_next
    if _fail_next:
        message, _fail_next = _fail_next, None
        raise AIError(message)
    xhr = _XHR.new()
    xhr.open(method, _BASE + path, False)
    xhr.setRequestHeader("Content-Type", "application/json")
    try:
        xhr.send(_json.dumps(payload) if payload is not None else None)
    except Exception:
        raise AIError("Couldn't reach the Akada Labs server. Check your internet connection.") from None
    try:
        data = _json.loads(xhr.responseText or "{}")
    except ValueError:
        data = {}
    if xhr.status != 200:
        raise AIError(data.get("detail") or f"The request failed (status {xhr.status}).")
    return data


def chat(messages, temperature=0.7, model=None, max_tokens=None, tools=None, tool_choice=None, json_mode=False):
    """Send a list of messages to the AI model and return its reply message (a dict).

    messages: a list like [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]
    temperature: 0 for focused answers, up to 2 for more random ones
    tools: optional function descriptions the model may ask to call (week 10)
    json_mode: True to ask the model to reply with JSON
    """
    payload = {"messages": messages, "temperature": temperature, "json_mode": json_mode}
    if model: payload["model"] = model
    if max_tokens: payload["max_tokens"] = max_tokens
    if tools: payload["tools"] = tools
    if tool_choice is not None: payload["tool_choice"] = tool_choice
    return _request("POST", "/ai/chat", payload)["message"]


def ask(prompt, system="You are a helpful assistant.", temperature=0.7, model=None):
    """Ask the AI model one question and return its reply as text."""
    message = chat([{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                   temperature=temperature, model=model)
    return message.get("content") or ""


def embed(texts):
    """Turn text into embeddings (lists of numbers that represent meaning).

    Pass one string to get one list of numbers, or a list of strings to get a list of lists.
    """
    single = isinstance(texts, str)
    vectors = _request("POST", "/ai/embed", {"texts": [texts] if single else list(texts)})["embeddings"]
    return vectors[0] if single else vectors


def chunk(text, size=500, overlap=50, recursive=True, details=False):
    """Split a long text into overlapping chunks using the Akada Labs chunker.

    size: the longest chunk, in characters; overlap: characters shared with the previous chunk.
    recursive: split on paragraphs first, then lines, sentences and words.
    Returns a list of strings, or the chunker's full records (with start_char, end_char) if details=True.
    """
    data = _request("POST", "/chunk", {"text": text, "chunk_size": size, "overlap": overlap, "recursive": recursive})
    return data["chunks"] if details else [c["text"] for c in data["chunks"]]


def usage():
    """How many AI calls you've used today, and how many are left."""
    data = _request("GET", "/ai/usage")
    return {"used": data["used"], "limit": data["limit"], "remaining": data["remaining"]}
`;
