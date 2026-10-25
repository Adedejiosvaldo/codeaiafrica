# Weeks 6-10: Kaggle and Colab notebooks

These need a GPU or internet calls, so they run on Kaggle (or Colab), not in the browser lab.
Each notebook keeps the same pattern: exercise cell, check cell (PASS or a hint), completion code at the end.

| Notebook | Runs on | Needs |
| --- | --- | --- |
| `week06-neural-networks.ipynb` | Kaggle, GPU | The *Cassava Leaf Disease Classification* competition data (learners accept the rules once), Internet on |
| `week07-llms-through-an-api.ipynb` | Kaggle or Colab | A free Groq or Gemini key, stored as a secret |
| `week08-embeddings-and-search.ipynb` | Kaggle or Colab | The course data set (below), Internet on |
| `week09-rag.ipynb` | Kaggle or Colab | The course data set and an API key |
| `week10-agents-and-tools.ipynb` | Kaggle or Colab | The course data set and an API key |

## Before the cohort starts

1. **Make the course data set.** Create a public Kaggle dataset called `akada-labs-course-data` with:
   - `document.txt`: the clean text of the week 8-9 document (for example the Nigeria Data Protection Act 2023)
   - `nigeria_food_prices.csv`: the same file as `lab/content/data/`

   If you use another name, update the `/kaggle/input/akada-labs-course-data/` paths in weeks 8-10.
2. **Check the hidden questions.** Weeks 8 and 9 test search with questions about the NDPA (breach reporting
   within 72 hours, the Commission, consent). Read the document and confirm each expected phrase appears in the
   right section. If you pick a different document, rewrite the `HIDDEN` list in week 8's exercise 3 check
   and the question in week 9's exercise 3 check.
3. **Check the cassava data.** Week 6 uses labels 3 (cassava mosaic disease) and 4 (healthy) from the competition's
   `train.csv`. Confirm the competition rules allow teaching use.
4. **Check model names.** Weeks 7, 9 and 10 default to `llama-3.1-8b-instant` (Groq) and `gemini-2.5-flash` (Gemini).
   Providers retire models; update `PROVIDERS` if a name stops working.
5. **Publish.** Upload each notebook to Kaggle, make it public, and share the "Copy & Edit" link. For Colab, open it
   from GitHub (`colab.research.google.com/github/<owner>/<repo>/blob/main/kaggle/<file>`). On Colab, week 6's
   data path must point to a copy of the cassava images.

API keys never go in a cell: every notebook reads them with `get_secret()`, from Kaggle or Colab secrets.
