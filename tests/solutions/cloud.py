"""Model answers for the parts of weeks 6-10 that run without a GPU or API key."""

RUN_AGENT = '''
def run_agent(question, client=client, max_steps=None, log=None):
    messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": question}]
    step = 0
    while True:
        if max_steps and step >= max_steps:
            return "Stopped: too many steps."
        step += 1
        response = client.chat.completions.create(model=MODEL, messages=messages, tools=TOOLS)
        message = response.choices[0].message
        if not message.tool_calls:
            return message.content
        messages.append({"role": "assistant", "content": message.content or "", "tool_calls": [
            {"id": c.id, "type": "function", "function": {"name": c.function.name, "arguments": c.function.arguments}}
            for c in message.tool_calls]})
        for call in message.tool_calls:
            args = json.loads(call.function.arguments or "{}")
            result = FUNCTIONS[call.function.name](**args)
            if log is not None:
                log.append(f"step {step}: {call.function.name}({args}) -> {result}")
            messages.append({"role": "tool", "tool_call_id": call.id, "content": str(result)})
'''

SOLUTIONS = {
    "week06-neural-networks.ipynb": {
        "stop_after": "check-2",
        "exercise-1": "h = relu(x @ W1 + b1)\ny = sigmoid(h @ W2 + b2)",
        "exercise-2": (
            "target = 1.0\nloss_before = -np.log(y)\ngrad = (h * (y - target)).reshape(3, 1)\n"
            "W2_new = W2 - 0.1 * grad\nloss_after = -np.log(sigmoid(h @ W2_new + b2))"
        ),
    },
    "week10-agents-and-tools.ipynb": {
        "stop_after": "finish",
        "exercise-1": '''
def get_food_price(commodity, market, month):
    rows = prices[(prices["commodity"] == commodity) & (prices["market"] == market) & prices["date"].str.startswith(month)]
    if rows.empty:
        return f"No price for {commodity} in {market} in {month}."
    return float(rows["price"].iloc[0])

OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.USub: operator.neg}

def calculator(expression):
    def walk(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            return OPS[type(node.op)](walk(node.left), walk(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
            return OPS[type(node.op)](walk(node.operand))
        raise ValueError("only numbers and + - * / are allowed")
    try:
        return walk(ast.parse(expression, mode="eval").body)
    except Exception as error:
        return f"Error: {error}"
''',
        "exercise-2": 'SYSTEM = "test"\n' + RUN_AGENT,
        "exercise-3": RUN_AGENT,
        "exercise-4": RUN_AGENT,
    },
}
