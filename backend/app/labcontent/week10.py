WEEK10 = {
    "week": 10,
    "title": "Agents and tool use",
    "intro": "An **agent** is an LLM that can use tools: your Python functions. The model decides which function to call and "
             "with what inputs; your code runs it and hands back the result. You'll build a small food-price agent, with the "
             "safety rails real agents need. The prices in this lab are made up for practice.",
    "uses_ai": True,
    "setup": "import json\nfrom akada import ask, chat, AIError\n"
             "# Made-up practice prices, in naira per 50kg bag. Not real market data.\n"
             "PRICES = {\n"
             "    ('rice', 'Kano'): 78000, ('rice', 'Lagos'): 86000, ('rice', 'Ibadan'): 83000,\n"
             "    ('beans', 'Kano'): 95000, ('beans', 'Lagos'): 104000, ('beans', 'Ibadan'): 99000,\n"
             "    ('maize', 'Kano'): 41000, ('maize', 'Lagos'): 48000, ('maize', 'Ibadan'): 45000,\n"
             "}\n",
    "steps": [
        {
            "id": "tool",
            "title": "A tool is just a function",
            "body": """An LLM on its own can't look anything up: it only knows what it learned in training, and it will happily guess a price. **Tools** fix that. A tool is an ordinary Python function that fetches real information.

`PRICES` is a dictionary of practice prices. The keys are pairs like `("rice", "Kano")`:

```python
PRICES[("rice", "Kano")]          # 78000
PRICES.get(("rice", "Abuja"))     # None: .get returns None instead of crashing
```

A good tool never crashes on bad input. It returns a clear message instead, because the model will read that message and can try again.""",
            "task": "Write `get_food_price(commodity, market)` that returns the price (a number) for that commodity and market, or a message string like `\"No price for rice in Abuja\"` if there isn't one. Make it work whatever the capitalisation (\"Rice\", \"KANO\").",
            "starter": "def get_food_price(commodity, market):\n    pass\n\nprint(get_food_price(\"rice\", \"Kano\"))\nprint(get_food_price(\"rice\", \"Abuja\"))\n",
            "check": """assert get_food_price("rice", "Kano") == 78000, "get_food_price('rice', 'Kano') should return 78000."
assert get_food_price("Beans", "LAGOS") == 104000, "Make it work with any capitalisation: commodity.lower() and market.title()."
missing = get_food_price("rice", "Abuja")
assert isinstance(missing, str) and missing.strip(), "For a price that isn't there, return a message string instead of None or crashing." """,
            "hint": "def get_food_price(commodity, market):\n    price = PRICES.get((commodity.lower(), market.title()))\n    if price is None:\n        return f\"No price for {commodity} in {market}\"\n    return price",
            "solution": "def get_food_price(commodity, market):\n    price = PRICES.get((commodity.lower(), market.title()))\n    if price is None:\n        return f\"No price for {commodity} in {market}\"\n    return price\n\nprint(get_food_price(\"rice\", \"Kano\"))\nprint(get_food_price(\"rice\", \"Abuja\"))\n",
        },
        {
            "id": "describe",
            "title": "Describe the tool to the model",
            "body": """The model never sees your Python code. It sees a **description** of each tool, in a format called JSON Schema: the tool's name, what it does, and what inputs it needs.

```python
{"type": "function", "function": {
    "name": "get_weather",
    "description": "Today's temperature in a Nigerian city, in Celsius.",
    "parameters": {"type": "object",
                   "properties": {"city": {"type": "string", "description": "e.g. Kano"}},
                   "required": ["city"]}}}
```

Good descriptions matter as much as good code: they're how the model decides when to use a tool and what to pass it.""",
            "task": "Complete `TOOLS`: give `get_food_price` a clear description, and list both inputs, `commodity` and `market`, as required strings.",
            "starter": "TOOLS = [\n    {\"type\": \"function\", \"function\": {\n        \"name\": \"get_food_price\",\n        \"description\": \"\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\n                \"commodity\": {\"type\": \"string\", \"description\": \"rice, beans or maize\"},\n                # add market here\n            },\n            \"required\": [],\n        },\n    }},\n]\nFUNCTIONS = {\"get_food_price\": get_food_price}\n",
            "check": """fn = TOOLS[0]["function"]
assert fn["name"] == "get_food_price", "Keep the name get_food_price."
assert len(fn.get("description", "").split()) >= 4, "Write a description of at least a few words: what does the tool return?"
props = fn["parameters"]["properties"]
assert "market" in props and props["market"].get("type") == "string", "Add a market property with type string."
assert set(fn["parameters"]["required"]) == {"commodity", "market"}, "List both commodity and market in required."
assert FUNCTIONS["get_food_price"] is get_food_price, "Keep FUNCTIONS mapping the name to your function." """,
            "hint": "\"description\": \"Price in naira of a 50kg bag of a food item in a Nigerian market.\"\n\"market\": {\"type\": \"string\", \"description\": \"Kano, Lagos or Ibadan\"}\n\"required\": [\"commodity\", \"market\"]",
            "solution": "TOOLS = [\n    {\"type\": \"function\", \"function\": {\n        \"name\": \"get_food_price\",\n        \"description\": \"Price in naira of a 50kg bag of a food item in a Nigerian market.\",\n        \"parameters\": {\n            \"type\": \"object\",\n            \"properties\": {\n                \"commodity\": {\"type\": \"string\", \"description\": \"rice, beans or maize\"},\n                \"market\": {\"type\": \"string\", \"description\": \"Kano, Lagos or Ibadan\"},\n            },\n            \"required\": [\"commodity\", \"market\"],\n        },\n    }},\n]\nFUNCTIONS = {\"get_food_price\": get_food_price}\n",
        },
        {
            "id": "choose",
            "title": "Let the model choose a tool",
            "body": """Pass the tool descriptions to `chat` with `tools=TOOLS`. If the model decides it needs a tool, its reply has no text. Instead it has `tool_calls`: which function to call, with what arguments (as a JSON string):

```python
message = chat([{"role": "user", "content": "How much is maize in Lagos?"}], tools=TOOLS)
call = message["tool_calls"][0]
print(call["function"]["name"])        # get_food_price
print(call["function"]["arguments"])   # '{"commodity": "maize", "market": "Lagos"}'
```

Notice: the model doesn't run anything. It only asks. Your code stays in control of what actually happens.""",
            "task": "Ask \"How much is rice in Kano?\" with `tools=TOOLS`. Store the first tool call in `call`, the parsed arguments (use `json.loads`) in `args`, and run the tool with them, storing the result in `result`.",
            "starter": "message = chat([{\"role\": \"user\", \"content\": \"How much is rice in Kano?\"}], tools=TOOLS)\nprint(message)\n\ncall = \nargs = \nresult = \n\nprint(call[\"function\"][\"name\"], args, '->', result)\n",
            "check": """assert isinstance(call, dict) and call.get("function", {}).get("name") == "get_food_price", "call should be message['tool_calls'][0]."
assert isinstance(args, dict) and {"commodity", "market"} <= set(args), "args should be json.loads(call['function']['arguments'])."
assert result == get_food_price(**args), "Run the tool with get_food_price(**args) (or FUNCTIONS[name](**args))." """,
            "hint": "call = message[\"tool_calls\"][0]\nargs = json.loads(call[\"function\"][\"arguments\"])\nresult = FUNCTIONS[call[\"function\"][\"name\"]](**args)",
            "solution": "message = chat([{\"role\": \"user\", \"content\": \"How much is rice in Kano?\"}], tools=TOOLS)\nprint(message)\n\ncall = message[\"tool_calls\"][0]\nargs = json.loads(call[\"function\"][\"arguments\"])\nresult = FUNCTIONS[call[\"function\"][\"name\"]](**args)\n\nprint(call[\"function\"][\"name\"], args, '->', result)\n",
        },
        {
            "id": "loop",
            "title": "The agent loop",
            "body": """An agent repeats until it has an answer:

1. Send the conversation (and the tools) to the model.
2. If the reply has **no** `tool_calls`, it's the final answer: return its `content`.
3. Otherwise, add the model's message to the conversation, run each tool, and add each result as a `"tool"` message. Then go back to 1.

```python
messages.append(message)                       # the model's tool request
messages.append({"role": "tool", "tool_call_id": call["id"], "content": str(result)})
```

`chat_fn` is a parameter so the check can test your loop with a pretend model. Use it instead of calling `chat` directly.""",
            "task": "Complete `run_agent`. Fill in the two `TODO` lines.",
            "starter": "SYSTEM = \"You answer questions about food prices in Nigerian markets. Always use the tool for prices; never guess.\"\n\ndef run_agent(question, chat_fn=chat, max_steps=6, log=None):\n    messages = [{\"role\": \"system\", \"content\": SYSTEM}, {\"role\": \"user\", \"content\": question}]\n    step = 0\n    while True:\n        # (next step: a max_steps guard goes here)\n        step += 1\n        message = chat_fn(messages, tools=TOOLS)\n        if not message.get(\"tool_calls\"):\n            return message[\"content\"]\n        messages.append(message)\n        for call in message[\"tool_calls\"]:\n            args = json.loads(call[\"function\"][\"arguments\"] or \"{}\")\n            result = None   # TODO: run the right function from FUNCTIONS with **args\n            # (next step: logging goes here)\n            messages.append(None)   # TODO: a {\"role\": \"tool\", ...} message with the result\n",
            "check": """def _fake(script):
    seen = []
    def fn(messages, tools=None, **kw):
        seen.append([dict(m) for m in messages])
        return script.pop(0) if script else {"role": "assistant", "content": "done"}
    return fn, seen
_call = {"id": "c1", "type": "function", "function": {"name": "get_food_price", "arguments": json.dumps({"commodity": "rice", "market": "Lagos"})}}
fn, seen = _fake([{"role": "assistant", "content": None, "tool_calls": [_call]}, {"role": "assistant", "content": "Rice is 86000."}])
out = run_agent("price of rice in Lagos?", chat_fn=fn)
assert out == "Rice is 86000.", "Return the content of the first reply that has no tool_calls."
tool_msgs = [m for m in seen[-1] if isinstance(m, dict) and m.get("role") == "tool"]
assert tool_msgs, "Append a tool message after running the tool: {\\"role\\": \\"tool\\", \\"tool_call_id\\": call[\\"id\\"], \\"content\\": str(result)}"
assert tool_msgs[0].get("tool_call_id") == "c1" and "86000" in str(tool_msgs[0].get("content")), "The tool message needs tool_call_id=call['id'] and content=str(result)." """,
            "hint": "result = FUNCTIONS[call[\"function\"][\"name\"]](**args)\nmessages.append({\"role\": \"tool\", \"tool_call_id\": call[\"id\"], \"content\": str(result)})",
            "solution": "SYSTEM = \"You answer questions about food prices in Nigerian markets. Always use the tool for prices; never guess.\"\n\ndef run_agent(question, chat_fn=chat, max_steps=6, log=None):\n    messages = [{\"role\": \"system\", \"content\": SYSTEM}, {\"role\": \"user\", \"content\": question}]\n    step = 0\n    while True:\n        step += 1\n        message = chat_fn(messages, tools=TOOLS)\n        if not message.get(\"tool_calls\"):\n            return message[\"content\"]\n        messages.append(message)\n        for call in message[\"tool_calls\"]:\n            args = json.loads(call[\"function\"][\"arguments\"] or \"{}\")\n            result = FUNCTIONS[call[\"function\"][\"name\"]](**args)\n            messages.append({\"role\": \"tool\", \"tool_call_id\": call[\"id\"], \"content\": str(result)})\n",
        },
        {
            "id": "guardrails",
            "title": "Guardrails: step limit and a log",
            "body": """Agents can get stuck calling tools forever, and every call costs money. Two habits every real agent needs:

- **A step limit.** At the top of the loop: if `step` has reached `max_steps`, stop and return a message.
- **A log.** Record each tool call and its result, so when an agent does something odd you can see exactly why.

```python
if max_steps and step >= max_steps:
    return "Stopped: too many steps."
...
if log is not None:
    log.append(f"step {step}: {name}({args}) -> {result}")
```""",
            "task": "Copy your `run_agent` here and add both: return `\"Stopped: too many steps.\"` when `step` reaches `max_steps`, and append one line per tool call to `log` when a list is given.",
            "starter": "# paste your run_agent here, then add the step limit and logging\n",
            "check": """_loop = {"id": "c9", "type": "function", "function": {"name": "get_food_price", "arguments": json.dumps({"commodity": "maize", "market": "Kano"})}}
calls = []
def _forever(messages, tools=None, **kw):
    calls.append(1)
    if len(calls) > 20:
        raise AssertionError("Your agent never stopped: it called the model over 20 times. Add the max_steps check at the top of the loop.")
    return {"role": "assistant", "content": None, "tool_calls": [_loop]}
out = run_agent("loop forever", chat_fn=_forever, max_steps=3)
assert out == "Stopped: too many steps.", "When step reaches max_steps, return \\"Stopped: too many steps.\\""
assert len(calls) == 3, f"With max_steps=3 the model should be called 3 times, not {len(calls)}."
trace = []
script = [{"role": "assistant", "content": None, "tool_calls": [_loop]}, {"role": "assistant", "content": "ok"}]
run_agent("maize?", chat_fn=lambda m, tools=None, **k: script.pop(0), max_steps=5, log=trace)
assert len(trace) == 1 and "get_food_price" in trace[0] and "41000" in trace[0], "Append one log line per tool call, with the tool name and its result." """,
            "hint": "At the top of the while loop:\n    if max_steps and step >= max_steps:\n        return \"Stopped: too many steps.\"\nAfter running a tool:\n    if log is not None:\n        log.append(f\"step {step}: {call['function']['name']}({args}) -> {result}\")",
            "solution": "def run_agent(question, chat_fn=chat, max_steps=6, log=None):\n    messages = [{\"role\": \"system\", \"content\": SYSTEM}, {\"role\": \"user\", \"content\": question}]\n    step = 0\n    while True:\n        if max_steps and step >= max_steps:\n            return \"Stopped: too many steps.\"\n        step += 1\n        message = chat_fn(messages, tools=TOOLS)\n        if not message.get(\"tool_calls\"):\n            return message[\"content\"]\n        messages.append(message)\n        for call in message[\"tool_calls\"]:\n            args = json.loads(call[\"function\"][\"arguments\"] or \"{}\")\n            result = FUNCTIONS[call[\"function\"][\"name\"]](**args)\n            if log is not None:\n                log.append(f\"step {step}: {call['function']['name']}({args}) -> {result}\")\n            messages.append({\"role\": \"tool\", \"tool_call_id\": call[\"id\"], \"content\": str(result)})\n",
        },
        {
            "id": "real",
            "title": "Run it for real",
            "body": """Time to watch your agent work with the real model. Ask something that needs the tool, maybe more than once:

```python
trace = []
print(run_agent("Is rice cheaper in Kano or Lagos?", log=trace))
print("\\n".join(trace))
```

Read the trace: did it call the tool once for each market? If it guessed instead of using the tool, how would you change `SYSTEM` or the tool description? This is the core of the market price agent capstone brief.""",
            "task": "Run your agent on a question that compares two markets. Store its answer in `answer` and its trace in `trace`, and print both.",
            "starter": "trace = []\nanswer = \n\nprint(answer)\nprint(\"\\n\".join(trace))\n",
            "check": """assert isinstance(answer, str) and answer.strip(), "answer should be what run_agent(...) returns."
assert isinstance(trace, list), "Pass log=trace to run_agent so the steps are recorded."
assert 'run_agent(' in __code__ and 'log=' in __code__, "Call run_agent(..., log=trace)." """,
            "hint": "answer = run_agent(\"Is rice cheaper in Kano or Lagos?\", log=trace)",
            "solution": "trace = []\nanswer = run_agent(\"Is rice cheaper in Kano or Lagos?\", log=trace)\n\nprint(answer)\nprint(\"\\n\".join(trace))\n",
        },
    ],
}
