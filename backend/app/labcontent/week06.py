WEEK6 = {
    "week": 6,
    "title": "Neural networks by hand",
    "intro": "Before you use a real neural network, you'll build a tiny one yourself with NumPy, so you can see there's no magic: "
             "just multiplying, adding and nudging numbers. This lab is part 1 of week 6. Part 2, training a real image model "
             "on a free GPU, happens on Kaggle, and that notebook's completion code is what submits the week.",
    "completes_week": False,
    "uses_ai": False,
    "setup": "import numpy as np\n",
    "steps": [
        {
            "id": "arrays",
            "title": "Numbers in arrays",
            "body": """Neural networks work on lots of numbers at once. **NumPy** is the Python library for that. Its main type is the **array**: a list of numbers that you can do maths on all at once.

```python
import numpy as np

prices = np.array([900, 750, 1200])
print(prices * 1.1)      # every price up 10%: [ 990.  825. 1320.]
```

The most important operation in a neural network is the **weighted sum**: multiply each input by a weight, then add them up. With arrays you write it as `@`:

```python
inputs  = np.array([2, 3])
weights = np.array([0.5, 1.0])
print(inputs @ weights)  # 2*0.5 + 3*1.0 = 4.0
```

A weight says how much the network cares about each input. Training is the process of finding good weights.""",
            "task": "`x` holds 4 inputs and `w` holds 4 weights. Store their weighted sum in `z` using `@`.",
            "starter": "x = np.array([0.5, -1.2, 3.0, 0.8])\nw = np.array([0.2, 0.4, -0.1, 0.5])\n\nz = \nprint(z)\n",
            "check": """assert 'z' in dir(), "Create a variable called z."
assert abs(float(z) - float(x @ w)) < 1e-9, "z should be x @ w: multiply each input by its weight, then add them up."
assert '@' in __code__ or 'dot' in __code__, "Use the @ operator (or np.dot)." """,
            "hint": "z = x @ w",
            "solution": "x = np.array([0.5, -1.2, 3.0, 0.8])\nw = np.array([0.2, 0.4, -0.1, 0.5])\n\nz = x @ w\nprint(z)\n",
        },
        {
            "id": "activations",
            "title": "Activation functions",
            "body": """After the weighted sum, a neuron passes the result through an **activation function**. Without one, stacking layers would just be one big weighted sum, and the network couldn't learn curved, real-world patterns.

Two you'll meet everywhere:

- **ReLU** keeps positive numbers and turns negatives into 0. In NumPy: `np.maximum(0, z)`
- **Sigmoid** squashes any number into the range 0 to 1, which is handy for "how likely is this?". The formula is `1 / (1 + np.exp(-z))`

```python
np.maximum(0, np.array([-2, 0.5, 3]))   # [0.  0.5 3. ]
```""",
            "task": "Write two functions, `relu(z)` and `sigmoid(z)`, that work on single numbers and on arrays.",
            "starter": "def relu(z):\n    pass\n\ndef sigmoid(z):\n    pass\n\nprint(relu(np.array([-2, 0.5, 3])), sigmoid(0))\n",
            "check": """t = np.array([-3.0, -0.5, 0.0, 0.5, 3.0])
assert relu(t) is not None, "relu doesn't return anything yet."
assert np.allclose(relu(t), [0, 0, 0, 0.5, 3]), "relu should turn negatives into 0 and keep positives: np.maximum(0, z)."
assert sigmoid(t) is not None, "sigmoid doesn't return anything yet."
assert np.allclose(sigmoid(t), 1 / (1 + np.exp(-t))), "sigmoid is 1 / (1 + np.exp(-z))."
assert abs(float(sigmoid(0)) - 0.5) < 1e-9, "sigmoid(0) should be 0.5." """,
            "hint": "def relu(z):\n    return np.maximum(0, z)\n\ndef sigmoid(z):\n    return 1 / (1 + np.exp(-z))",
            "solution": "def relu(z):\n    return np.maximum(0, z)\n\ndef sigmoid(z):\n    return 1 / (1 + np.exp(-z))\n\nprint(relu(np.array([-2, 0.5, 3])), sigmoid(0))\n",
        },
        {
            "id": "layer",
            "title": "A whole layer at once",
            "body": """A **layer** is several neurons side by side, each with its own weights. Store all their weights in a **matrix** (a grid of numbers) and NumPy computes every neuron in one go:

```python
W = np.array([[0.1, 0.2],
              [0.3, 0.4]])      # 2 inputs -> 2 neurons
print(np.array([1, 2]) @ W)      # [0.7 1. ]
```

Each neuron also has a **bias**, a number added after the weighted sum. It lets a neuron fire even when its inputs are small.

The shape tells you the size: `W1.shape` is `(4, 3)` here, meaning 4 inputs go in and 3 neurons come out.""",
            "task": "Compute the hidden layer `h = relu(x @ W1 + b1)`. Check its shape is `(3,)`: one value per neuron.",
            "starter": "rng = np.random.default_rng(0)\nW1 = rng.normal(size=(4, 3))\nb1 = np.zeros(3)\n\nh = \nprint(h, h.shape)\n",
            "check": """assert 'h' in dir() and h is not None, "Create h."
assert np.shape(h) == (3,), "h should have 3 values. Use x @ W1 + b1 inside relu."
assert np.allclose(h, relu(x @ W1 + b1)), "h should be relu(x @ W1 + b1)." """,
            "hint": "h = relu(x @ W1 + b1)",
            "solution": "rng = np.random.default_rng(0)\nW1 = rng.normal(size=(4, 3))\nb1 = np.zeros(3)\n\nh = relu(x @ W1 + b1)\nprint(h, h.shape)\n",
        },
        {
            "id": "forward",
            "title": "The forward pass",
            "body": """Stack a second layer on the first and you have a small neural network. Running inputs through it, layer by layer, is called the **forward pass**:

1. hidden layer: `h = relu(x @ W1 + b1)`
2. output layer: `y = sigmoid(h @ W2 + b2)`

Our network has one output neuron, so `y` is a single probability between 0 and 1. Imagine the 4 inputs describe a cassava leaf photo, and `y` is "how likely is this leaf diseased?".""",
            "task": "Compute the output `y = sigmoid(h @ W2 + b2)`. It should have shape `(1,)`.",
            "starter": "W2 = rng.normal(size=(3, 1))\nb2 = np.zeros(1)\n\ny = \nprint(y)\n",
            "check": """assert np.shape(y) == (1,), "y should have shape (1,). Use h @ W2 + b2 inside sigmoid."
assert np.allclose(y, sigmoid(h @ W2 + b2)), "y should be sigmoid(h @ W2 + b2)."
assert 0 < float(y[0]) < 1, "After sigmoid, y must be between 0 and 1." """,
            "hint": "y = sigmoid(h @ W2 + b2)",
            "solution": "W2 = rng.normal(size=(3, 1))\nb2 = np.zeros(1)\n\ny = sigmoid(h @ W2 + b2)\nprint(y)\n",
        },
        {
            "id": "loss",
            "title": "How wrong is it? The loss",
            "body": """Say this leaf really is diseased, so the right answer is `1`. How wrong is our network? We measure that with a **loss**: a single number where lower is better.

For yes/no questions the usual loss is **log loss**. When the right answer is 1, it's:

```python
loss = -np.log(y)
```

If `y` is close to 1 (confident and right), `-log(y)` is close to 0. If `y` is close to 0 (confident and wrong), the loss shoots up. Training means changing the weights to make this number smaller.""",
            "task": "The right answer is `target = 1`. Compute `loss_before = -np.log(y)` and print it.",
            "starter": "target = 1.0\nloss_before = \nprint(loss_before)\n",
            "check": """assert np.allclose(loss_before, -np.log(y)), "loss_before should be -np.log(y)."
assert float(np.squeeze(loss_before)) > 0, "The loss should be a positive number." """,
            "hint": "loss_before = -np.log(y)",
            "solution": "target = 1.0\nloss_before = -np.log(y)\nprint(loss_before)\n",
        },
        {
            "id": "gradient",
            "title": "Learning: one gradient step",
            "body": """How should each weight change to lower the loss? Calculus gives a formula called the **gradient**: for each weight, which direction makes the loss go up. We step the opposite way, by a small amount called the **learning rate**.

For our output weights, the gradient works out to:

```python
grad = (h * (y - target)).reshape(3, 1)
```

Then one training step is:

```python
W2_new = W2 - 0.1 * grad      # 0.1 is the learning rate
```

Real training repeats this thousands of times, for every weight, over many examples. In part 2 on Kaggle, PyTorch does all of this for you, on millions of weights, using a GPU.""",
            "task": "Take one step: compute `W2_new`, run the output again with it, and store the new loss in `loss_after`. It should be smaller than `loss_before`.",
            "starter": "grad = (h * (y - target)).reshape(3, 1)\nW2_new = \n\ny_new = \nloss_after = \n\nprint(float(loss_before[0]), '->', float(loss_after[0]))\n",
            "check": """assert np.allclose(W2_new, W2 - 0.1 * (h * (y - target)).reshape(3, 1)), "W2_new = W2 - 0.1 * grad"
assert np.allclose(loss_after, -np.log(sigmoid(h @ W2_new + b2))), "Recompute the output with W2_new, then loss_after = -np.log(y_new)."
assert float(np.squeeze(loss_after)) < float(np.squeeze(loss_before)), "The loss should go down after the step." """,
            "hint": "W2_new = W2 - 0.1 * grad\ny_new = sigmoid(h @ W2_new + b2)\nloss_after = -np.log(y_new)",
            "solution": "grad = (h * (y - target)).reshape(3, 1)\nW2_new = W2 - 0.1 * grad\n\ny_new = sigmoid(h @ W2_new + b2)\nloss_after = -np.log(y_new)\n\nprint(float(loss_before[0]), '->', float(loss_after[0]))\n",
        },
    ],
}
