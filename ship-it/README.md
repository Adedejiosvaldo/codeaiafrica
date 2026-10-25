---
title: My Akada Labs capstone
colorFrom: green
colorTo: gray
sdk: gradio
app_file: app.py
pinned: false
---

# Week 11: ship it

This folder is a starter for putting your capstone online, free, on Hugging Face Spaces.

## Steps

1. Make a free account at huggingface.co.
2. Click **New Space**. Pick **Gradio** as the SDK and the free **CPU basic** hardware.
3. Upload `app.py`, `requirements.txt` and this `README.md` (keep the block at the top: Spaces reads it).
4. In the Space, open **Settings > Variables and secrets** and add a **secret** called `GROQ_API_KEY` with your key.
   Using Gemini? Name it `GEMINI_API_KEY` and add a **variable** `PROVIDER` set to `gemini`.
5. Wait for the build to finish, then try your app.
6. Change `SYSTEM`, the title and the examples in `app.py` to fit your project. For RAG or agent capstones,
   copy your functions from the week 9 or 10 notebook into `app.py`, and any data files into the Space.

**Done when** someone else can open your Space link on their phone and it works.

Never put your API key in `app.py`. Spaces are public, and anyone can read the code.
