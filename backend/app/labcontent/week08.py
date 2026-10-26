from .handbook import HANDBOOK

WEEK8 = {
    "week": 8,
    "title": "Embeddings and search",
    "intro": "Keyword search only finds the exact words you type. In this lab you'll build search that understands meaning, "
             "using **embeddings**: lists of numbers that capture what a piece of text is about. You'll search the course "
             "handbook, split into pieces by a chunking service built by a Nigerian engineer.",
    "uses_ai": True,
    "setup": "import math\nfrom akada import embed, chunk, AIError\nHANDBOOK = " + repr(HANDBOOK) + "\n",
    "steps": [
        {
            "id": "embed",
            "title": "Turn text into numbers",
            "body": """An **embedding model** reads text and returns a long list of numbers, called a **vector**. The numbers themselves don't mean much on their own. What matters is that texts with similar meanings get similar lists, even when they use different words.

```python
v = embed("I love jollof rice")
print(len(v))     # often hundreds of numbers
print(v[:5])      # the first five
```

`embed` also accepts a list of texts and returns one vector for each, in a single call. That's much cheaper than calling it once per text.""",
            "task": "Embed the sentence \"The bus to Yaba is late again\". Store the vector in `v` and print how many numbers it has.",
            "starter": "v = \nprint(len(v), v[:5])\n",
            "check": """assert isinstance(v, list) and len(v) > 8, "v should be the list of numbers that embed(...) returns."
assert all(isinstance(x, (int, float)) for x in v), "Every item in v should be a number." """,
            "hint": "v = embed(\"The bus to Yaba is late again\")",
            "solution": "v = embed(\"The bus to Yaba is late again\")\nprint(len(v), v[:5])\n",
        },
        {
            "id": "cosine",
            "title": "Measure similarity by hand",
            "body": """How do you tell if two vectors are "close"? The standard measure is **cosine similarity**. It looks at the angle between them: 1 means pointing the same way (same meaning), 0 means unrelated.

The formula has three parts:

- the **dot product**: multiply matching numbers and add them up, `sum(x * y for x, y in zip(a, b))`
- the **length** of each vector: `math.sqrt(sum(x * x for x in a))`
- cosine = dot product ÷ (length of a × length of b)

```python
a, b = [1, 2], [2, 4]
# dot = 1*2 + 2*4 = 10; lengths = 2.236 and 4.472; cosine = 10 / 10 = 1.0
```

Libraries do this for you, but writing it once means you'll never wonder what it does.""",
            "task": "Write `cosine(a, b)` for two lists of numbers, using the formula above. The check tests it on vectors you can't see.",
            "starter": "def cosine(a, b):\n    pass\n\nprint(cosine([1, 2], [2, 4]))   # should be 1.0\n",
            "check": """tests = [([1, 2], [2, 4], 1.0), ([1, 0], [0, 1], 0.0), ([1, 0], [-1, 0], -1.0), ([3, 4, 0], [4, 3, 0], 0.96)]
for a, b, want in tests:
    got = cosine(a, b)
    assert got is not None, "cosine doesn't return anything yet."
    assert abs(got - want) < 1e-6, f"cosine({a}, {b}) gave {got}, but should be {want}." """,
            "hint": "def cosine(a, b):\n    dot = sum(x * y for x, y in zip(a, b))\n    return dot / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))",
            "solution": "def cosine(a, b):\n    dot = sum(x * y for x, y in zip(a, b))\n    length_a = math.sqrt(sum(x * x for x in a))\n    length_b = math.sqrt(sum(y * y for y in b))\n    return dot / (length_a * length_b)\n\nprint(cosine([1, 2], [2, 4]))\n",
        },
        {
            "id": "similar",
            "title": "Which sentences mean the same?",
            "body": """Now put the two together. Embed several sentences in **one** call, then compare the first sentence with each of the others:

```python
vectors = embed(sentences)          # one vector per sentence
scores = [cosine(vectors[0], v) for v in vectors]
```

The highest score (apart from comparing the sentence with itself, which is always 1) is its closest match in meaning.""",
            "task": "Embed all the `sentences` in one call. Find the index of the sentence most similar to `sentences[0]`, not counting itself, and store it in `best`.",
            "starter": "sentences = [\n    \"NEPA took the light since morning.\",\n    \"The Super Eagles won the match.\",\n    \"There has been no electricity all day.\",\n    \"Rice is more expensive this month.\",\n    \"My phone battery is almost flat.\",\n]\n\nvectors = \nbest = \n\nprint(sentences[0], '->', sentences[best])\n",
            "check": """assert isinstance(vectors, list) and len(vectors) == len(sentences), "vectors should hold one embedding per sentence: embed(sentences)."
assert __code__.count('embed(') == 1, "Embed all the sentences in a single embed(...) call."
scores = [cosine(vectors[0], v) for v in vectors]
want = max(range(1, len(sentences)), key=lambda i: scores[i])
assert best == want, "best should be the index (from 1 to 4) with the highest cosine score against vectors[0]." """,
            "hint": "vectors = embed(sentences)\nscores = [cosine(vectors[0], v) for v in vectors]\nbest = max(range(1, len(sentences)), key=lambda i: scores[i])",
            "solution": "sentences = [\n    \"NEPA took the light since morning.\",\n    \"The Super Eagles won the match.\",\n    \"There has been no electricity all day.\",\n    \"Rice is more expensive this month.\",\n    \"My phone battery is almost flat.\",\n]\n\nvectors = embed(sentences)\nscores = [cosine(vectors[0], v) for v in vectors]\nbest = max(range(1, len(sentences)), key=lambda i: scores[i])\n\nprint(sentences[0], '->', sentences[best])\n",
        },
        {
            "id": "chunk",
            "title": "Split a document into chunks",
            "body": """To search a document, first split it into **chunks**: pieces small enough that each one is about one thing. Embedding a whole document at once would blur everything together.

`HANDBOOK` holds the course handbook. `chunk` sends it to the **RAG Document Chunker**, an open-source Go service built by Adedeji Osvaldo, a Nigerian software engineer ([github.com/Adedejiosvaldo/rag-chunker](https://github.com/Adedejiosvaldo/rag-chunker)):

```python
pieces = chunk(HANDBOOK, size=400, overlap=40)
```

- `size`: the longest a chunk can be, in characters
- `overlap`: characters repeated at the start of the next chunk, so an idea cut at a boundary still appears whole somewhere
- by default it splits **recursively**: on paragraphs first, then lines, then sentences, then words, so chunks break at natural places""",
            "task": "Chunk `HANDBOOK` with `size=400` and `overlap=40`. Store the list in `chunks`, then print how many there are and the first one.",
            "starter": "chunks = \n\nprint(len(chunks), 'chunks')\nprint(chunks[0])\n",
            "check": """assert isinstance(chunks, list) and len(chunks) >= 4, "chunks should be the list that chunk(HANDBOOK, size=400, overlap=40) returns."
assert all(isinstance(c, str) and c.strip() for c in chunks), "Every chunk should be a piece of text."
assert max(len(c) for c in chunks) <= 480, "Use size=400 so chunks stay small." """,
            "hint": "chunks = chunk(HANDBOOK, size=400, overlap=40)",
            "solution": "chunks = chunk(HANDBOOK, size=400, overlap=40)\n\nprint(len(chunks), 'chunks')\nprint(chunks[0])\n",
        },
        {
            "id": "search",
            "title": "Search by meaning",
            "body": """Now build a search engine in three steps:

1. Embed every chunk once and keep the vectors. (Do this once, outside the search function: it's the expensive part.)
2. When a question comes in, embed the question.
3. Score every chunk against the question with `cosine`, and return the best ones.

```python
ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
```

`sorted(..., reverse=True)` puts the highest scores first. This is exactly how the search box in many apps works.""",
            "task": "Embed all `chunks` into `chunk_vectors`. Then write `search(question, k=3)` that returns the `k` most similar chunks (the text), best first.",
            "starter": "chunk_vectors = \n\ndef search(question, k=3):\n    # embed the question, score every chunk, return the top k chunk texts\n    pass\n\nfor result in search(\"When are the live classes?\") or []:\n    print('-', result[:120])\n",
            "check": """assert isinstance(chunk_vectors, list) and len(chunk_vectors) == len(chunks), "chunk_vectors should hold one embedding per chunk: embed(chunks)."
q = "How many labs do I need for a certificate?"
results = search(q, k=2)
assert isinstance(results, list) and len(results) == 2, "search(question, k) should return a list of k chunk texts."
qv = embed(q)
scores = [cosine(qv, v) for v in chunk_vectors]
order = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
assert results == [chunks[i] for i in order[:2]], "Return the chunks with the highest cosine scores, best first." """,
            "hint": "def search(question, k=3):\n    qv = embed(question)\n    scores = [cosine(qv, v) for v in chunk_vectors]\n    ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)\n    return [chunks[i] for i in ranked[:k]]",
            "solution": "chunk_vectors = embed(chunks)\n\ndef search(question, k=3):\n    qv = embed(question)\n    scores = [cosine(qv, v) for v in chunk_vectors]\n    ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)\n    return [chunks[i] for i in ranked[:k]]\n\nfor result in search(\"When are the live classes?\") or []:\n    print('-', result[:120])\n",
        },
    ],
}
