"""The 12-week course and the pre/post quiz, from docs/build-specs.md."""

# kind: "code" = completion code from a notebook, "link" = a URL the learner submits
WEEKS = [
    {"week": 1, "title": "Train your first AI", "kind": "link", "where": "Teachable Machine",
     "summary": "Train an image classifier in your browser, then post a clip of it working.",
     "prompt": "Link to your post showing your model"},
    {"week": 2, "title": "Python in the browser", "kind": "code", "where": "Browser lab",
     "summary": "Variables, lists, loops and functions, on Lagos air quality readings.",
     "notebook": "week02-python-in-the-browser.ipynb"},
    {"week": 3, "title": "Working with data", "kind": "code", "where": "Browser lab",
     "summary": "Load, filter, group and chart World Bank food prices with pandas.",
     "notebook": "week03-working-with-data.ipynb"},
    {"week": 4, "title": "Your first ML model", "kind": "code", "where": "Browser lab",
     "summary": "Train a decision tree to tell affordable Lagos rentals from expensive ones.",
     "notebook": "week04-first-ml-model.ipynb"},
    {"week": 5, "title": "When models go wrong", "kind": "code", "where": "Browser lab",
     "summary": "Watch a sentiment model fail on Pidgin, then fix it.",
     "notebook": "week05-when-models-go-wrong.ipynb"},
    {"week": 6, "title": "Neural networks", "kind": "code", "where": "Kaggle (GPU)",
     "summary": "Build a network by hand, then fine-tune one to spot cassava disease.",
     "notebook": "week06-neural-networks.ipynb"},
    {"week": 7, "title": "LLMs through an API", "kind": "code", "where": "Kaggle or Colab",
     "summary": "Call an LLM from Python and turn bank SMS alerts into data.",
     "notebook": "week07-llms-through-an-api.ipynb"},
    {"week": 8, "title": "Embeddings and search", "kind": "code", "where": "Kaggle or Colab",
     "summary": "Search a Nigerian law by meaning, not keywords.",
     "notebook": "week08-embeddings-and-search.ipynb"},
    {"week": 9, "title": "RAG", "kind": "code", "where": "Kaggle or Colab",
     "summary": "Build a bot that answers questions with citations. Pick your capstone.",
     "notebook": "week09-rag.ipynb"},
    {"week": 10, "title": "Agents and tool use", "kind": "code", "where": "Kaggle or Colab",
     "summary": "An LLM that calls your functions to answer food price questions.",
     "notebook": "week10-agents-and-tools.ipynb"},
    {"week": 11, "title": "Ship it", "kind": "link", "where": "Hugging Face Spaces",
     "summary": "Put your capstone online with Gradio, free.",
     "prompt": "Link to your Hugging Face Space"},
    {"week": 12, "title": "Demo day", "kind": "link", "where": "Live online",
     "summary": "Show your tool live in 3 minutes.",
     "prompt": "Link to your demo (Space or recording)"},
]
WEEK_BY_NUMBER = {w["week"]: w for w in WEEKS}

QUIZ = [
    ("A machine learning model learns mainly from…", ["Rules a programmer writes", "Examples in data", "The internet, live"], 1),
    ("Your model is 95% accurate on its training data and 60% on new data. What's happening?", ["Overfitting", "Underfitting", "It's a perfect model"], 0),
    ("Why do we keep a test set separate?", ["To train faster", "To check the model on data it hasn't seen", "To save memory"], 1),
    ("In Python, what does len([3, 5, 7]) return?", ["3", "7", "15"], 0),
    ("In pandas, which line shows the first 5 rows?", ["df.head()", "df.first()", "df.top()"], 0),
    ("A dataset has 90% \"no fraud\" rows. A model that always says \"no fraud\" scores…", ["10%", "50%", "90%"], 2),
    ("What is a \"label\" in supervised learning?", ["The answer the model should predict", "A column name", "A chart title"], 0),
    ("A sentiment model trained only on English tweets will most likely…", ["Work equally well on Pidgin", "Do worse on Pidgin", "Refuse Pidgin"], 1),
    ("An LLM produces text by…", ["Looking answers up in a database", "Predicting likely next words", "Copying websites"], 1),
    ("Raising an LLM's temperature makes outputs…", ["More random", "More accurate", "Shorter"], 0),
    ("Where should an API key live?", ["Pasted in a shared notebook", "In a secrets manager or environment variable", "In the prompt"], 1),
    ("A chatbot confidently gives a wrong fact. This is called…", ["A hallucination", "A bug in Python", "Overfitting"], 0),
    ("Which is a classification task?", ["Predict a house price", "Sort messages into spam and not spam", "Forecast next month's rainfall"], 1),
    ("A decision tree's feature importance tells you…", ["Which inputs most affected its predictions", "How fast it trained", "Its accuracy"], 0),
    ("Which best reduces bias against a group?", ["More data from that group", "A bigger model only", "Training for longer"], 0),
    ("Training a neural network means…", ["Adjusting weights to reduce loss", "Writing more if statements", "Adding layers until it works"], 0),
    ("An embedding is…", ["A list of numbers that represents meaning", "A compressed file", "An API key"], 0),
    ("In RAG, the retrieval step…", ["Finds relevant text to give the LLM", "Retrains the LLM", "Deletes old data"], 0),
    ("Why split documents into chunks for RAG?", ["So retrieval returns focused passages that fit the prompt", "To encrypt them", "To save disk space"], 0),
    ("In a tool-using agent, the LLM…", ["Decides which function to call and with what inputs", "Runs the Python itself", "Replaces the database"], 0),
]
POINTS_PER_QUESTION = 5

CONFIDENCE = [
    "I can explain what AI is",
    "I can write Python to analyse data",
    "I could build a small AI tool",
]


def public_quiz():
    return {
        "questions": [{"id": i, "text": q, "options": opts} for i, (q, opts, _) in enumerate(QUIZ)],
        "confidence": CONFIDENCE,
    }


def grade(answers):
    return sum(POINTS_PER_QUESTION for (_, _, right), given in zip(QUIZ, answers) if given == right)
