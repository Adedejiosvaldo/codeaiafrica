# Akada Labs: Phase 1 build

Course materials for Akada Labs' free 12-week practical AI course for Nigerian beginners.
The full plan is in [`docs/build-specs.md`](docs/build-specs.md).

## What's here

| Folder | What it is |
| --- | --- |
| `lead-magnet/` | "Train your first AI in 10 minutes": one web page that walks someone through Teachable Machine, explains what happened, and points to the waitlist |
| `lab/` | The browser lab (JupyterLite): weeks 2-5 notebooks that run Python in the browser with nothing installed |
| `lab/content/data/` | The trimmed CSVs for weeks 2-5 (see the README there for sources and licences) |
| `kaggle/` | Weeks 6-10 starter notebooks for Kaggle or Colab |
| `ship-it/` | Week 11 starter: a Gradio app to deploy on Hugging Face Spaces |
| `scripts/` | Trim the raw datasets, score applications, verify completion codes |
| `tests/` | Run every notebook with model answers and check each self-check passes |

The site workflow publishes the lead magnet at `/` and the browser lab at `/lab/` on GitHub Pages.

## How the notebooks work

Every exercise has a cell for the learner's code and a check cell that prints **PASS** or a hint.
Checks work out the expected answer from the data, so refreshing a CSV doesn't break them.
When every exercise has passed, the last cell prints a completion code such as `AK-W04-3F9A1C`,
made from the learner's email and the week. Learners paste it into the submission form; check codes with:

    python scripts/verify_completion_code.py submissions.csv

This is an honesty system: a determined learner could read the code that makes it.

## To do before launch

1. **Add the data.** Download the raw datasets (links in `lab/content/data/README.md`) into a `raw/` folder, then:

       pip install -r requirements-dev.txt
       cd scripts
       python trim_air_quality.py ../raw/<lagos file>.csv
       python trim_food_prices.py ../raw/<world bank file>.csv --list   # see the column names first
       python trim_food_prices.py ../raw/<world bank file>.csv
       python trim_lagos_rent.py ../raw/<rent file>.csv
       python trim_naijasenti.py ../raw/pcm_train.tsv ../raw/pcm_dev.tsv ../raw/pcm_test.tsv

   Each script writes into `lab/content/data/`. If it can't find a column, it stops and lists the columns in the file.
   Read a sample of the NaijaSenti split by eye: it sorts Pidgin tweets into "english_like" and "pidgin" by word lists.
2. **Run each notebook once on the real data**, in the browser lab, and check the exercise numbers still make sense
   (for example, that week 4 clears the 60% accuracy floor and week 5 shows a Pidgin gap).
3. **Time week 5 in the browser.** The spec asks for a Pyodide speed check on 4,000 tweets; if training is slow,
   rerun `trim_naijasenti.py --per-variety 500`.
4. **Set up the Kaggle side**: see `kaggle/README.md`.
5. **Fill in the lead magnet settings** at the bottom of `lead-magnet/index.html` (waitlist link, social handle,
   demo video), and test it on a mid-range Android phone.
6. **Turn on GitHub Pages** (Settings > Pages > Source: GitHub Actions).

## Running the tests

    pip install -r requirements-dev.txt
    python -m pytest tests

The tests use small random files from `tests/make_fixtures.py`. These are test data only and never ship to learners.
Model answers live in `tests/solutions/`; if this repo is public, learners can find them.

## Applications

Export the Google Form responses as CSV, add a `q9_score` column (0-3, scored by a reviewer), then:

    python scripts/score_applications.py responses.csv --cap 40
