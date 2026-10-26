WEEK7 = {
    "week": 7,
    "title": "LLMs through an API",
    "intro": "A large language model (LLM) is a program that predicts likely next words. Companies run them on big servers "
             "and let you use them through an **API**: you send text over the internet and get text back. In this lab you'll "
             "call one from Python, steer it, pull structured data out of a bank SMS, and handle failures like a professional.",
    "uses_ai": True,
    "setup": "from akada import ask, chat, usage, AIError\n",
    "steps": [
        {
            "id": "first-call",
            "title": "Your first AI call",
            "body": """In this lab, `ask` sends a question to an AI model and returns its reply as a string:

```python
reply = ask("Name three Nigerian dishes.")
print(reply)
```

Behind the scenes, your code sends a request to the Akada Labs server, which adds a secret **API key** and forwards it to the AI provider. The key proves who's paying for the call, so it must never appear in your code or a shared notebook. Here, the server keeps it safe for you.

Each call takes a second or two, and you have a limited number per day (the counter is at the top of the page). If you run exactly the same request again today, you get the saved reply for free.""",
            "task": "Use `ask` to ask the model to explain what an API is, in one sentence. Store the answer in `reply` and print it.",
            "starter": "reply = \nprint(reply)\n",
            "check": """assert isinstance(reply, str) and reply.strip(), "reply should hold the text that ask(...) returns."
assert 'ask(' in __code__, "Use the ask(...) function." """,
            "hint": "reply = ask(\"Explain what an API is, in one sentence.\")",
            "solution": "reply = ask(\"Explain what an API is, in one sentence.\")\nprint(reply)\n",
        },
        {
            "id": "system",
            "title": "Steer it with a system prompt",
            "body": """Every chat has hidden instructions called the **system prompt**. It sets who the model should be and how it should answer. Change it and the same question gets a very different answer:

```python
ask("What is a budget?", system="You are a primary school teacher. Use very simple words.")
ask("What is a budget?", system="You are a finance professor. Be precise and formal.")
```

Apps use system prompts all the time: a bank chatbot's system prompt might say "Only answer questions about our products, and never ask for a PIN".""",
            "task": "Ask the same question, \"What is inflation?\", twice: once with a system prompt telling it to answer in Nigerian Pidgin (store in `pidgin`), and once as a formal economics lecturer (store in `formal`). Print both.",
            "starter": "question = \"What is inflation?\"\n\npidgin = \nformal = \n\nprint(pidgin)\nprint('---')\nprint(formal)\n",
            "check": """assert isinstance(pidgin, str) and pidgin.strip() and isinstance(formal, str) and formal.strip(), "Both pidgin and formal should come from ask(...)."
assert __code__.count('system=') >= 2, "Give each call its own system= prompt."
assert pidgin != formal, "The two answers are identical. Make the two system prompts different." """,
            "hint": "pidgin = ask(question, system=\"You explain things in Nigerian Pidgin, in 2 sentences.\")",
            "solution": "question = \"What is inflation?\"\n\npidgin = ask(question, system=\"You explain things in Nigerian Pidgin, in 2 sentences.\")\nformal = ask(question, system=\"You are a formal economics lecturer. Answer in 2 sentences.\")\n\nprint(pidgin)\nprint('---')\nprint(formal)\n",
        },
        {
            "id": "temperature",
            "title": "Temperature: focused or creative",
            "body": """At each step, the model has many possible next words, each with a probability. **Temperature** controls how it picks:

- `temperature=0`: nearly always picks the most likely word. Answers are focused and repeatable. Use it for facts and data extraction.
- `temperature=1` or more: takes more chances. Answers are more varied and creative, and more likely to go wrong.

```python
ask("Suggest a name for a Lagos food delivery app.", temperature=1.2)
```

Because identical requests are saved for the day, change the prompt slightly if you want to see a fresh high-temperature answer.""",
            "task": "Ask for a slogan for a jollof rice restaurant twice: with `temperature=0` (store in `calm`) and with `temperature=1.3` (store in `wild`). Print both and compare.",
            "starter": "prompt = \"Write a one-line slogan for a jollof rice restaurant in Ibadan.\"\n\ncalm = \nwild = \n\nprint('calm:', calm)\nprint('wild:', wild)\n",
            "check": """import re as _re
assert isinstance(calm, str) and calm.strip() and isinstance(wild, str) and wild.strip(), "calm and wild should both come from ask(...)."
temps = [float(t) for t in _re.findall(r"temperature\\s*=\\s*([0-9.]+)", __code__)]
assert any(t == 0 for t in temps), "Use temperature=0 for calm."
assert any(t >= 1 for t in temps), "Use a temperature of 1 or more for wild." """,
            "hint": "calm = ask(prompt, temperature=0)\nwild = ask(prompt, temperature=1.3)",
            "solution": "prompt = \"Write a one-line slogan for a jollof rice restaurant in Ibadan.\"\n\ncalm = ask(prompt, temperature=0)\nwild = ask(prompt, temperature=1.3)\n\nprint('calm:', calm)\nprint('wild:', wild)\n",
        },
        {
            "id": "json",
            "title": "From messy text to clean data",
            "body": """LLMs reply with text, but programs need data. The trick is to ask for **JSON**, a format Python can read into a dictionary, and to say exactly which fields you want and in what format:

```python
prompt = '''Extract the city and temperature from this sentence.
Reply with JSON only, with keys "city" (text) and "celsius" (a number).

Sentence: It's a hot 34 degrees in Kano today.'''
```

Models sometimes wrap JSON in ```` ``` ```` fences, so the starter code includes `parse_json`, which strips them and turns the text into a dictionary. Use `temperature=0` for extraction: you want the same answer every time.""",
            "task": "Write a prompt that turns the bank SMS into JSON with exactly three keys: `name` (who sent the money), `amount` (a number, no currency or commas) and `date` (YYYY-MM-DD). Store the dictionary in `data`.",
            "starter": "import json, re\n\ndef parse_json(text):\n    text = re.sub(r\"^```(json)?|```$\", \"\", text.strip(), flags=re.MULTILINE).strip()\n    return json.loads(text)\n\nsms = \"Acct:****4521 Amt:NGN15,500.00 CR Desc:TRF FROM ADEBAYO OLUWASEUN/OPAY Date:12-Mar-2026 14:22 Bal:NGN48,210.35\"\n\nprompt = f\"\"\"\n\n{sms}\n\"\"\"\n\ndata = \nprint(data)\n",
            "check": """assert isinstance(data, dict), "data should be a dictionary. Use parse_json(ask(prompt, temperature=0))."
missing = {"name", "amount", "date"} - set(data)
assert not missing, f"The JSON is missing {sorted(missing)}. Name each key in your prompt."
assert abs(float(str(data["amount"]).replace(",", "")) - 15500) < 0.01, "amount should be 15500. Say 'a number with no currency or commas' in your prompt."
assert str(data["date"]) == "2026-03-12", "date should be 2026-03-12. Show the YYYY-MM-DD format in your prompt."
assert "ADEBAYO" in str(data["name"]).upper(), "name should be the sender, ADEBAYO OLUWASEUN." """,
            "hint": "prompt = f\"\"\"Extract from this bank SMS. Reply with JSON only, with keys:\nname (who sent the money), amount (a number, no currency or commas), date (YYYY-MM-DD).\n\n{sms}\"\"\"\ndata = parse_json(ask(prompt, temperature=0))",
            "solution": "import json, re\n\ndef parse_json(text):\n    text = re.sub(r\"^```(json)?|```$\", \"\", text.strip(), flags=re.MULTILINE).strip()\n    return json.loads(text)\n\nsms = \"Acct:****4521 Amt:NGN15,500.00 CR Desc:TRF FROM ADEBAYO OLUWASEUN/OPAY Date:12-Mar-2026 14:22 Bal:NGN48,210.35\"\n\nprompt = f\"\"\"Extract the details from this bank SMS. Reply with JSON only, with exactly these keys:\nname (who sent the money), amount (a number, no currency or commas), date (YYYY-MM-DD).\n\n{sms}\n\"\"\"\n\ndata = parse_json(ask(prompt, temperature=0))\nprint(data)\n",
        },
        {
            "id": "failures",
            "title": "When calls fail",
            "body": """Real APIs fail: the internet drops, the service is busy, or you've used up your quota. A good program expects this and stays calm instead of crashing.

In Python you catch errors with `try` and `except`:

```python
try:
    reply = ask("Hello")
except AIError as error:
    reply = f"Sorry, that didn't work: {error}"
```

`AIError` is the error this lab's helpers raise when a call fails. The message says what went wrong.""",
            "task": "Write `safe_ask(prompt)` that returns the model's reply, or a string starting with `\"Error:\"` if the call fails. It must never crash. The check makes a call fail on purpose.",
            "starter": "def safe_ask(prompt):\n    # use try / except AIError\n    pass\n\nprint(safe_ask(\"Say hello in Hausa.\"))\n",
            "check": """import akada
akada._fail_next = "The AI service is busy right now. Wait a minute and try again."
try:
    result = safe_ask("hello")
except Exception as e:
    raise AssertionError(f"safe_ask crashed with {type(e).__name__}. Catch it with except AIError as error:")
finally:
    akada._fail_next = None
assert isinstance(result, str) and result.startswith("Error:"), "When the call fails, return a string that starts with 'Error:'."
assert "busy" in result, "Include the error message, like f\\"Error: {error}\\", so people know what went wrong." """,
            "hint": "def safe_ask(prompt):\n    try:\n        return ask(prompt)\n    except AIError as error:\n        return f\"Error: {error}\"",
            "solution": "def safe_ask(prompt):\n    try:\n        return ask(prompt)\n    except AIError as error:\n        return f\"Error: {error}\"\n\nprint(safe_ask(\"Say hello in Hausa.\"))\n",
        },
        {
            "id": "budget",
            "title": "Calls cost money",
            "body": """Every AI call costs the API key's owner money, measured in **tokens** (pieces of words). That's why this lab gives each learner a daily limit, and why real companies watch their usage closely.

Habits that save calls:

- Store a reply in a variable and reuse it, instead of calling again.
- Use the smallest model that does the job.
- Keep prompts short: send only the text the model needs.

When you deploy your capstone in week 11, you'll use your own free API key, stored as a secret on Hugging Face. The same habits will keep you inside the free tier.""",
            "task": "Call `usage()` to see your calls today. Store how many you have left in `left` and print it.",
            "starter": "info = usage()\nprint(info)\n\nleft = \nprint(f\"I have {left} AI calls left today.\")\n",
            "check": """assert isinstance(left, int), "left should be a whole number: info[\\"remaining\\"]."
assert left >= 0, "left can't be negative." """,
            "hint": "left = info[\"remaining\"]",
            "solution": "info = usage()\nprint(info)\n\nleft = info[\"remaining\"]\nprint(f\"I have {left} AI calls left today.\")\n",
        },
    ],
}
