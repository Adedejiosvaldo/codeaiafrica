"""Interactive labs: step-by-step exercises that run in the learner's browser.

Each step has:
- body: the explanation, in a small Markdown subset (paragraphs, **bold**, `code`,
  fenced ```python blocks and "- " bullet lists)
- task: what to do, shown in a highlighted box
- starter: the code the editor starts with
- check: Python run after the learner's code, in the same namespace. It raises
  AssertionError("hint") when the step isn't done. It can read __output__ (what
  the learner's code printed) and __code__ (the code they wrote).
- hint and solution: shown on request (the solution after a couple of tries)

Passing every step marks the week as submitted.
"""

WEEK2 = {
    "week": 2,
    "title": "Python in the browser",
    "intro": "You'll write real Python, right here, and learn the building blocks every AI program uses: "
             "variables, lists, decisions, loops and functions. Each step explains an idea, shows an example, "
             "then gives you a small task. Press Check when you think you're done.",
    "packages": [],
    "steps": [
        {
            "id": "print",
            "title": "Talk to Python",
            "body": """Python reads your code **from top to bottom** and does what each line says.

The simplest instruction is `print(...)`. Whatever you put inside the brackets appears in the output panel. Text needs quotes around it, so Python knows it's text and not an instruction. Text in quotes is called a **string**.

```python
print("Good morning")
print("Ẹ káàárọ̀")
```

Lines that start with `#` are **comments**. Python ignores them; they're notes for humans.""",
            "task": "Print a greeting of your own, for example `Hello from Lagos`. Then press **Run** to see it, and **Check** to pass the step.",
            "starter": "# Print a greeting on the line below\n",
            "check": "assert __output__.strip(), 'Nothing was printed yet. Use print(\"your message\") and make sure the text is inside quotes.'\nassert 'print' in __code__, 'Use the print(...) instruction.'",
            "hint": "Type print, then brackets, then your message in quotes inside them: print(\"Hello from Lagos\")",
            "solution": "print(\"Hello from Lagos\")",
        },
        {
            "id": "variables",
            "title": "Store values in variables",
            "body": """A **variable** is a name for a value, so you can use it later. You create one with `=`:

```python
city = "Abuja"
humidity = 78
```

Read `=` as "is now". `city` now holds the string `"Abuja"`, and `humidity` holds the number `78`.

Numbers don't have quotes. A number with a decimal point, like `31.5`, is a **float**; a whole number is an **int**. Python cares about the difference between `"78"` (text) and `78` (a number): you can do maths with one but not the other.

Air quality sensors measure **PM2.5**: tiny particles of dust and smoke in the air. In this lab, a PM2.5 reading above **35** means poor air.""",
            "task": "Create a variable `location` that holds the name of a Lagos area as text, and a variable `pm25` that holds the number `42.5`.",
            "starter": "location = \npm25 = \n",
            "check": """assert 'location' in dir(), "Create a variable called location."
assert isinstance(location, str) and location.strip(), "location should be text in quotes, like \\"Yaba\\"."
assert 'pm25' in dir(), "Create a variable called pm25."
assert not isinstance(pm25, bool) and isinstance(pm25, (int, float)), "pm25 should be a number with no quotes around it."
assert pm25 == 42.5, "Set pm25 to 42.5." """,
            "hint": "Text goes in quotes, numbers don't: location = \"Yaba\" and pm25 = 42.5",
            "solution": "location = \"Yaba\"\npm25 = 42.5\n",
        },
        {
            "id": "fstrings",
            "title": "Build sentences with f-strings",
            "body": """You'll often want to put variables inside a sentence. Python's neatest way is an **f-string**: a string with an `f` before the opening quote. Inside it, anything in `{curly brackets}` is replaced by its value.

```python
city = "Abuja"
humidity = 78
print(f"In {city}, humidity is {humidity}%")
```

That prints `In Abuja, humidity is 78%`.

Variables you made in earlier steps still exist: this whole lab shares one Python session, like one long notebook.""",
            "task": "Make a variable `sentence` with an f-string that includes both `location` and `pm25`, such as `In Yaba, PM2.5 is 42.5`. Then print it.",
            "starter": "sentence = \nprint(sentence)\n",
            "check": """assert isinstance(sentence, str), "sentence should be a string. Start it with f\\" and end it with \\"."
assert location in sentence, "Include {location} inside the f-string."
assert str(pm25) in sentence, "Include {pm25} inside the f-string."
assert sentence in __output__, "Print the sentence with print(sentence)." """,
            "hint": "sentence = f\"In {location}, PM2.5 is {pm25}\"",
            "solution": "sentence = f\"In {location}, PM2.5 is {pm25}\"\nprint(sentence)\n",
        },
        {
            "id": "lists",
            "title": "Keep many values in a list",
            "body": """A sensor doesn't give you one reading; it gives you hundreds. A **list** holds many values in order, inside square brackets, separated by commas:

```python
rainfall = [12, 0, 3, 25, 8]
```

Python has built-in helpers that work on lists:

- `len(rainfall)` counts the items: `5`
- `max(rainfall)` finds the biggest: `25`
- `min(rainfall)` finds the smallest: `0`
- `sum(rainfall)` adds them up: `48`

So the **average** is `sum(rainfall) / len(rainfall)`, which is `9.6`.""",
            "task": "These are a week of daily temperatures (°C): `31.2, 30.8, 32.5, 33.1, 29.9, 30.4, 31.7`. Put them in a list called `temps`. Then store the highest in `highest` and the average in `average`.",
            "starter": "temps = \nhighest = \naverage = \n\nprint(highest, average)\n",
            "check": """assert isinstance(temps, list), "temps should be a list: values inside [square brackets]."
assert temps == [31.2, 30.8, 32.5, 33.1, 29.9, 30.4, 31.7], "temps should hold the 7 temperatures from the task, in order."
assert highest == 33.1, "Use max(temps) for the highest value."
assert abs(average - sum(temps) / 7) < 1e-9, "The average is sum(temps) / len(temps)." """,
            "hint": "temps = [31.2, 30.8, ...] then highest = max(temps) and average = sum(temps) / len(temps)",
            "solution": "temps = [31.2, 30.8, 32.5, 33.1, 29.9, 30.4, 31.7]\nhighest = max(temps)\naverage = sum(temps) / len(temps)\n\nprint(highest, average)\n",
        },
        {
            "id": "if",
            "title": "Make decisions with if",
            "body": """Programs make decisions with `if`. If a condition is true, Python runs the indented lines under it; otherwise it runs the lines under `else`:

```python
humidity = 85
if humidity > 80:
    comfort = "sticky"
else:
    comfort = "fine"
```

Two details matter:

- The `if` and `else` lines end with a colon `:`
- The lines that belong to them are **indented** (4 spaces). Indentation is how Python knows what's inside the `if`.

Conditions use `>` (greater than), `<` (less than), `>=`, `<=`, and `==` (equal to). Note the double `==`: a single `=` stores a value, a double `==` compares.""",
            "task": "A sensor reads `reading = 48.3`. Write an `if`/`else` that sets `label` to `\"poor\"` when `reading` is above 35, and to `\"good\"` otherwise.",
            "starter": "reading = 48.3\n\n# your if / else here\n\nprint(label)\n",
            "check": """assert 'if' in __code__ and 'else' in __code__, "Use an if and an else, not just label = \\"poor\\"."
assert 'label' in dir(), "Set a variable called label inside your if and else."
assert label == ("poor" if reading > 35 else "good"), "Check the spelling of \\"poor\\" and \\"good\\", and the condition reading > 35." """,
            "hint": "if reading > 35:\n    label = \"poor\"\nelse:\n    label = \"good\"",
            "solution": "reading = 48.3\n\nif reading > 35:\n    label = \"poor\"\nelse:\n    label = \"good\"\n\nprint(label)\n",
        },
        {
            "id": "loops",
            "title": "Repeat with a for loop",
            "body": """A `for` loop runs the same code once for **each item** in a list. Each time round, the loop variable holds the next item:

```python
rainfall = [12, 0, 3]
for mm in rainfall:
    print(mm, "mm")
```

That prints three lines: `12 mm`, `0 mm`, `3 mm`.

To build a new list as you go, start with an empty list `[]` and add to it with `.append(...)`:

```python
wet_days = []
for mm in rainfall:
    if mm > 5:
        wet_days.append(mm)
```

Notice the `if` is indented inside the loop, and the `append` is indented inside the `if`.""",
            "task": "Loop over `readings` and build a list called `labels` with `\"poor\"` for each reading above 35 and `\"good\"` for the rest, in the same order.",
            "starter": "readings = [12.0, 48.3, 35.0, 61.7, 22.4, 90.1, 30.0]\nlabels = []\n\n# your loop here\n\nprint(labels)\n",
            "check": """expected = ["poor" if r > 35 else "good" for r in readings]
assert isinstance(labels, list) and len(labels) == len(readings), "labels should have one label per reading. Use labels.append(...) inside the loop."
assert labels == expected, "One label is wrong. Remember 35.0 is not above 35, so it's \\"good\\"."
assert 'for' in __code__, "Use a for loop." """,
            "hint": "for r in readings:\n    if r > 35:\n        labels.append(\"poor\")\n    else:\n        labels.append(\"good\")",
            "solution": "readings = [12.0, 48.3, 35.0, 61.7, 22.4, 90.1, 30.0]\nlabels = []\n\nfor r in readings:\n    if r > 35:\n        labels.append(\"poor\")\n    else:\n        labels.append(\"good\")\n\nprint(labels)\n",
        },
        {
            "id": "functions",
            "title": "Package it as a function",
            "body": """You've written the "poor or good" rule twice now. When you repeat yourself, make a **function**: a named, reusable piece of code.

```python
def celsius_to_f(c):
    return c * 9 / 5 + 32

print(celsius_to_f(30))   # 86.0
```

- `def` starts the function, then its name, then its **inputs** in brackets
- The indented lines are its body
- `return` hands a value back to whoever called it

Real AI code is mostly functions like this, called millions of times.""",
            "task": "Write a function `air_label(pm25)` that **returns** `\"poor\"` when `pm25` is above 35 and `\"good\"` otherwise. The check tries it on 5 readings you can't see.",
            "starter": "def air_label(pm25):\n    # your code here\n    pass\n\nprint(air_label(50), air_label(10))\n",
            "check": """assert callable(air_label), "Define it with def air_label(pm25):"
for value in [3.2, 35, 35.1, 80, 12]:
    want = "poor" if value > 35 else "good"
    got = air_label(value)
    assert got is not None, "Your function doesn't return anything yet. Use return \\"poor\\" or return \\"good\\"."
    assert got == want, f"air_label({value}) gave {got!r}, but should give {want!r}. Think about exactly 35." """,
            "hint": "def air_label(pm25):\n    if pm25 > 35:\n        return \"poor\"\n    return \"good\"",
            "solution": "def air_label(pm25):\n    if pm25 > 35:\n        return \"poor\"\n    return \"good\"\n\nprint(air_label(50), air_label(10))\n",
        },
        {
            "id": "together",
            "title": "Put it all together",
            "body": """Time to combine everything. Below is a day of sample hourly PM2.5 readings, one per hour from midnight.

You'll count how many hours had poor air. A common pattern is a **counter**: start at `0` and add `1` each time something happens:

```python
hot_days = 0
for t in temps:
    if t > 32:
        hot_days = hot_days + 1
```

`hot_days = hot_days + 1` means "take the current count, add one, and store it back". You can also write `hot_days += 1`.

Reuse your `air_label` function inside the loop, so the rule lives in one place.""",
            "task": "Using a loop and `air_label`, count the poor-air hours in `day` and store the count in `poor_hours`. Also store the worst (highest) reading in `worst`.",
            "starter": "day = [18, 16, 15, 14, 14, 17, 26, 41, 52, 47, 38, 33,\n       30, 29, 31, 34, 39, 46, 55, 49, 40, 32, 25, 21]\n\npoor_hours = 0\n# your loop here\n\nworst = \n\nprint(f\"{poor_hours} hours of poor air. Worst reading: {worst}\")\n",
            "check": """assert poor_hours == sum(1 for r in day if r > 35), "Count again: add 1 for every reading where air_label(r) is \\"poor\\"."
assert worst == max(day), "worst should be the highest reading in day. Try max(day)."
assert 'air_label(' in __code__, "Use your air_label function inside the loop." """,
            "hint": "for r in day:\n    if air_label(r) == \"poor\":\n        poor_hours += 1\n\nworst = max(day)",
            "solution": "day = [18, 16, 15, 14, 14, 17, 26, 41, 52, 47, 38, 33,\n       30, 29, 31, 34, 39, 46, 55, 49, 40, 32, 25, 21]\n\npoor_hours = 0\nfor r in day:\n    if air_label(r) == \"poor\":\n        poor_hours += 1\n\nworst = max(day)\n\nprint(f\"{poor_hours} hours of poor air. Worst reading: {worst}\")\n",
        },
    ],
}

LABS = {lab["week"]: lab for lab in [WEEK2]}


def step_ids(week):
    return [step["id"] for step in LABS[week]["steps"]]
