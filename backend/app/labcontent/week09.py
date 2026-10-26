from .handbook import HANDBOOK

WEEK9 = {
    "week": 9,
    "title": "RAG: answers with sources",
    "intro": "LLMs sometimes make things up (a **hallucination**). Retrieval-augmented generation, or **RAG**, reduces that: first "
             "**retrieve** the passages that answer a question, then ask the model to answer **only from those passages** and "
             "cite them. You'll build a RAG bot for the course handbook. This week you also choose your capstone.",
    "uses_ai": True,
    "setup": "import math, re\nfrom akada import ask, chat, embed, chunk, AIError\nHANDBOOK = " + repr(HANDBOOK) + "\n"
             "def cosine(a, b):\n    dot = sum(x * y for x, y in zip(a, b))\n    return dot / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))\n",
    "steps": [
        {
            "id": "my-chunker",
            "title": "Write your own chunker",
            "body": """Every RAG system starts by splitting documents into chunks. The simplest way is to count **words**: take `size` words, then step forward `size - overlap` words and take the next `size`, so neighbouring chunks share a few words.

```python
words = text.split()                     # a list of words
for start in range(0, len(words), step): # 0, step, 2*step, ...
    piece = " ".join(words[start:start + size])
```

`range(0, len(words), step)` counts up in jumps of `step`. `" ".join(...)` glues words back into one string.""",
            "task": "Write `my_chunk(text, size=60, overlap=10)` that splits `text` into chunks of `size` words, each starting `size - overlap` words after the last.",
            "starter": "def my_chunk(text, size=60, overlap=10):\n    words = text.split()\n    step = size - overlap\n    chunks = []\n    # your loop here\n    return chunks\n\nmine = my_chunk(HANDBOOK)\nprint(len(mine), 'chunks')\nprint(mine[0])\n",
            "check": """words = HANDBOOK.split()
want = [" ".join(words[i:i + 60]) for i in range(0, len(words), 50)]
got = my_chunk(HANDBOOK)
assert isinstance(got, list) and got, "my_chunk should return a list of chunk strings."
assert len(got) == len(want), f"Expected {len(want)} chunks of 60 words, each starting 50 words after the last. You made {len(got)}."
assert got == want, "The chunk count is right, but the contents differ. Use \\" \\".join(words[start:start + size])."
assert my_chunk("a b c d e f", size=4, overlap=2) == ["a b c d", "c d e f", "e f"], "Use the size and overlap arguments, not fixed numbers." """,
            "hint": "for start in range(0, len(words), step):\n    chunks.append(\" \".join(words[start:start + size]))",
            "solution": "def my_chunk(text, size=60, overlap=10):\n    words = text.split()\n    step = size - overlap\n    chunks = []\n    for start in range(0, len(words), step):\n        chunks.append(\" \".join(words[start:start + size]))\n    return chunks\n\nmine = my_chunk(HANDBOOK)\nprint(len(mine), 'chunks')\nprint(mine[0])\n",
        },
        {
            "id": "compare",
            "title": "Compare with a production chunker",
            "body": """Your word chunker works, but look at where it cuts: often in the middle of a sentence. A chunk that starts with "...and lasts 60 minutes" has lost its subject, so search and answers suffer.

Production chunkers are smarter. The **RAG Document Chunker** ([github.com/Adedejiosvaldo/rag-chunker](https://github.com/Adedejiosvaldo/rag-chunker)), an open-source Go service built by Nigerian engineer Adedeji Osvaldo, splits **recursively**: it tries paragraphs first, then lines, then sentences, then words, and only cuts smaller when a piece is still too big. It also accepts PDF and Word files, which you might use in your capstone.

```python
pro = chunk(HANDBOOK, size=400, overlap=40)
```

A simple quality measure: how many chunks end at the end of a sentence (`.`, `!` or `?`)?""",
            "task": "Chunk `HANDBOOK` with `chunk(..., size=400, overlap=40)` into `pro`. Then count how many chunks in `mine` and in `pro` end with a full stop (after stripping spaces): store the counts in `mine_clean` and `pro_clean`.",
            "starter": "pro = \n\ndef ends_cleanly(piece):\n    return piece.strip().endswith(('.', '!', '?'))\n\nmine_clean = \npro_clean = \n\nprint(f\"Mine: {mine_clean}/{len(mine)} chunks end cleanly\")\nprint(f\"Production: {pro_clean}/{len(pro)} chunks end cleanly\")\n",
            "check": """assert isinstance(pro, list) and len(pro) >= 4, "pro should be chunk(HANDBOOK, size=400, overlap=40)."
clean = lambda p: p.strip().endswith(('.', '!', '?'))
assert mine_clean == sum(clean(p) for p in mine), "Count the chunks in mine where ends_cleanly(piece) is True."
assert pro_clean == sum(clean(p) for p in pro), "Count the chunks in pro where ends_cleanly(piece) is True." """,
            "hint": "pro = chunk(HANDBOOK, size=400, overlap=40)\nmine_clean = sum(ends_cleanly(p) for p in mine)",
            "solution": "pro = chunk(HANDBOOK, size=400, overlap=40)\n\ndef ends_cleanly(piece):\n    return piece.strip().endswith(('.', '!', '?'))\n\nmine_clean = sum(ends_cleanly(p) for p in mine)\npro_clean = sum(ends_cleanly(p) for p in pro)\n\nprint(f\"Mine: {mine_clean}/{len(mine)} chunks end cleanly\")\nprint(f\"Production: {pro_clean}/{len(pro)} chunks end cleanly\")\n",
        },
        {
            "id": "retrieve",
            "title": "Index and retrieve",
            "body": """The **index** is just your chunks plus their embeddings, made once. **Retrieval** finds the chunks closest to a question, exactly like last week's search, but this time also return each chunk's **number**, so the answer can cite it:

```python
hits = retrieve("When is demo day?")
# [(7, "Demo day\\nDemo day is the final session..."), (2, "..."), ...]
```

`cosine` is already defined for you in this lab.""",
            "task": "Embed the `pro` chunks into `index_vectors`. Write `retrieve(question, k=3)` that returns a list of `(chunk_number, chunk_text)` pairs for the `k` best chunks, best first. Number chunks from 0, their position in `pro`.",
            "starter": "index_vectors = \n\ndef retrieve(question, k=3):\n    pass\n\nfor number, text in retrieve(\"When is demo day?\") or []:\n    print(number, text[:80].replace('\\n', ' '))\n",
            "check": """assert isinstance(index_vectors, list) and len(index_vectors) == len(pro), "index_vectors should be embed(pro)."
q = "What happens if I lose my private link?"
hits = retrieve(q, k=2)
assert isinstance(hits, list) and len(hits) == 2, "retrieve(question, k) should return k pairs."
assert all(isinstance(h, tuple) and len(h) == 2 for h in hits), "Each item should be a (chunk_number, chunk_text) pair."
qv = embed(q)
order = sorted(range(len(pro)), key=lambda i: cosine(qv, index_vectors[i]), reverse=True)
assert [n for n, _ in hits] == order[:2], "Return the best-scoring chunks first."
assert all(pro[n] == t for n, t in hits), "Each pair should hold the chunk's number and its text." """,
            "hint": "def retrieve(question, k=3):\n    qv = embed(question)\n    ranked = sorted(range(len(pro)), key=lambda i: cosine(qv, index_vectors[i]), reverse=True)\n    return [(i, pro[i]) for i in ranked[:k]]",
            "solution": "index_vectors = embed(pro)\n\ndef retrieve(question, k=3):\n    qv = embed(question)\n    ranked = sorted(range(len(pro)), key=lambda i: cosine(qv, index_vectors[i]), reverse=True)\n    return [(i, pro[i]) for i in ranked[:k]]\n\nfor number, text in retrieve(\"When is demo day?\") or []:\n    print(number, text[:80].replace('\\n', ' '))\n",
        },
        {
            "id": "generate",
            "title": "Answer with citations",
            "body": """Now the **generation** step. Put the retrieved chunks into the prompt, each labelled with its number, and give the model strict rules in the system prompt:

```python
context = "\\n\\n".join(f"[chunk {n}] {text}" for n, text in hits)
system = (
    "Answer using only the chunks below. Cite the chunks you used like [chunk 3]. "
    "If the answer isn't in the chunks, say you don't know."
)
```

Citations let people check the answer for themselves. "Say you don't know" is what stops the model from making things up when retrieval missed.""",
            "task": "Write `answer_question(question)`. It should retrieve 3 chunks, build the context, ask the model with a system prompt like the one above (use `temperature=0`), and return `(answer_text, chunk_numbers_used_as_context)`.",
            "starter": "def answer_question(question):\n    hits = retrieve(question, k=3)\n    context = \n    system = \n    answer = \n    return answer, [n for n, _ in hits]\n\nreply, used = answer_question(\"How long is each live session?\")\nprint(reply)\nprint('context chunks:', used)\n",
            "check": """reply, used = answer_question("How long does each demo last?")
assert isinstance(reply, str) and reply.strip(), "answer_question should return the model's answer text first."
cited = {int(n) for n in re.findall(r"chunk\\s*(\\d+)", reply, flags=re.I)}
assert cited, "The answer doesn't cite any chunk. In the system prompt, tell the model to cite chunks like [chunk 3]."
assert cited & set(used), "The answer cites chunks that weren't in the context. Label each chunk with its number in the prompt." """,
            "hint": "context = \"\\n\\n\".join(f\"[chunk {n}] {text}\" for n, text in hits)\nsystem = \"Answer using only the chunks below. Cite chunks like [chunk 3]. If the answer isn't there, say you don't know.\"\nanswer = ask(f\"Chunks:\\n{context}\\n\\nQuestion: {question}\", system=system, temperature=0)",
            "solution": "def answer_question(question):\n    hits = retrieve(question, k=3)\n    context = \"\\n\\n\".join(f\"[chunk {n}] {text}\" for n, text in hits)\n    system = (\"Answer using only the chunks provided. Cite the chunks you used like [chunk 3]. \"\n              \"If the answer isn't in the chunks, say you don't know.\")\n    answer = ask(f\"Chunks:\\n{context}\\n\\nQuestion: {question}\", system=system, temperature=0)\n    return answer, [n for n, _ in hits]\n\nreply, used = answer_question(\"How long is each live session?\")\nprint(reply)\nprint('context chunks:', used)\n",
        },
        {
            "id": "break-it",
            "title": "Break it, then explain why",
            "body": """Every RAG system fails somewhere. Engineers learn the most by finding where. Try questions like:

- something the handbook doesn't cover ("What is the course fee in dollars?")
- a vague question ("Tell me about it")
- a question in Pidgin ("Wetin happen if I miss class?")

When it goes wrong, ask: was it **retrieval** (the right chunk wasn't found) or **generation** (the right chunk was there, but the answer was still wrong)? Print `retrieve(question)` to see what the model was given.

This is also the week to **choose your capstone**. You'll pick it on your dashboard's week 9 page.""",
            "task": "Find a question your bot answers badly. Store it in `bad_question`, and write 2 or more sentences in `notes`: what went wrong, and was retrieval or generation to blame?",
            "starter": "bad_question = \"\"\nprint(answer_question(bad_question)[0] if bad_question else \"Set bad_question first\")\n\nnotes = \"\"\"\n\n\"\"\"\n",
            "check": """assert isinstance(bad_question, str) and len(bad_question.split()) >= 2, "Write the question you tried in bad_question."
parts = [p for p in re.split(r"[.!?]+", notes or "") if len(p.split()) >= 3]
assert len(parts) >= 2, "Write at least 2 full sentences in notes about what went wrong and why." """,
            "hint": "Try bad_question = \"What is the course fee in dollars?\" and see whether the model admits it doesn't know.",
            "solution": "bad_question = \"Wetin go happen if I miss class?\"\nprint(answer_question(bad_question)[0] if bad_question else \"Set bad_question first\")\n\nnotes = \"\"\"The question was in Pidgin, so the words didn't match the handbook text closely and retrieval picked a chunk about demo day.\nThe model then answered from the wrong chunk, so the failure started with retrieval, not generation.\n\"\"\"\n",
        },
    ],
}
