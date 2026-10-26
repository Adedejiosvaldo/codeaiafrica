# Akada Labs

The platform and course materials for Akada Labs, a free 12-week practical AI course for Nigerian beginners.
The original plan is in [`docs/build-specs.md`](docs/build-specs.md). To put it online, follow
[`deploy/DEPLOY.md`](deploy/DEPLOY.md).

## What's here

| Folder | What it is |
| --- | --- |
| `backend/` | The API (FastAPI + SQLite + Alembic): applications, selection, learners, labs, AI proxy, email, certificates |
| `frontend/` | The website (React + TypeScript + Tailwind): public site, application form, learner area, interactive labs, team dashboard |
| `deploy/` | Caddy config, backup script and the step-by-step VPS guide; `docker-compose.yml` is at the root |
| `lab/` | The browser lab (JupyterLite): weeks 2-5 notebooks, served by the app at `/lab/` |
| `kaggle/` | Weeks 6-10 notebooks for Kaggle or Colab (week 6 part 2 needs Kaggle's free GPU) |
| `ship-it/` | Week 11 starter: a Gradio app to deploy on Hugging Face Spaces |
| `scripts/` | Trim the raw datasets, score a CSV of applications, verify completion codes |
| `lead-magnet/` | A standalone copy of "Train your first AI" (the app has its own at `/try`) |
| `tests/` | Notebook tests: run every notebook with model answers |

## The platform

**Public site**
- Landing page with a product tour, the 12-week curriculum, capstone ideas and FAQ.
- "Train your first AI in 10 minutes" at `/try`.
- Waitlist, and a 4-step application form with a consent checkbox and a privacy notice (`/privacy`, written for the NDPA 2023).
- `/find-my-link`: emails learners their dashboard link, or applicants their status.
- `/demo-day` (agenda and registration), `/showcase` (learners' projects, opt-in), `/verify` (check a certificate).

**Learner area** (each accepted learner gets a private link, `/learn/<token>`)
- Home: continue learning, labs done, streak, quiz score, certificate progress, activity heatmap, next live
  session with a Join button, and announcements.
- Learning path, and a page per week with goals, steps, submission (completion code or link) and a reflection
  that a TA replies to. Week 9 has the capstone picker.
- Interactive labs (below), the week 1 and week 12 knowledge check, and a printable certificate.

**Team dashboard** (`/admin`)
- Overview, applications (score the problem answer 0-3; the rest of the rubric is automatic), selection
  (places, then waitlist), learners grid, feedback on reflections, attendance, waitlist, messages and
  announcements, demo day guests, AI usage, settings, team accounts and an activity log.
- Two roles: **admins** do everything; **TAs** review, score, give feedback and take attendance.
- CSV exports, and deleting a person's data on request.

## Interactive labs

Weeks 2 and 6-10 have interactive labs at `/learn/<token>/lab/<week>`: step-by-step instructions on the left, a
Python editor and output on the right (tabs on phones). Python runs in the learner's browser with
[Pyodide](https://pyodide.org), in a background worker, so a stuck loop never freezes the page.

- Each step explains an idea, shows an example and sets a task. **Check** runs a hidden test that passes or says what
  to fix. A hint is always available; the worked solution unlocks after two checks.
- Passing every step submits the week. Week 6's lab is part 1 only; its Kaggle notebook (part 2) submits the week.
- Labs for weeks 7-10 call AI models through the server with the `akada` helper module:

  ```python
  from akada import ask, chat, embed, chunk, usage, AIError
  ```

  The API key stays on the server. Each learner has a daily limit, the class has a daily budget, and identical
  requests on the same day are answered from a cache for free (so re-runs and replays don't use up calls).
- `chunk` uses the [RAG Document Chunker](https://github.com/Adedejiosvaldo/rag-chunker), which runs next to the app.

**Adding or editing a lab:** labs live in `backend/app/labs.py` and `backend/app/labcontent/`. Each step has
`id`, `title`, `body` (simple Markdown), `task`, `starter`, `check`, `hint` and `solution`. A check is Python that
runs after the learner's code in the same session and raises `AssertionError("what to fix")` when the step isn't
done; it can read `__output__` (what was printed) and `__code__` (what they wrote). `backend/tests/test_labs.py`
runs every solution against its check and makes sure every starter fails, so run the tests after editing.

## Running it on your computer

```bash
# API, on port 8000
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
python -m app.cli migrate
ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='choose-a-password' uvicorn app.main:app --reload

# Website, on port 5173 (second terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in at `/admin`. For sample data, run `python -m app.cli seed-demo` on an
empty database (it uses example.com addresses).

To try the AI labs without a real key, run the fake provider (`python tests/fake_provider.py 9000` in `backend/`)
and start the API with `AI_BASE_URL=http://127.0.0.1:9000/v1 AI_API_KEY=x EMBED_BASE_URL=http://127.0.0.1:9000/v1
EMBED_MODEL=fake-embed EMBED_API_KEY=x`. For chunking, run the chunker (`go run ./cmd/api` in its repo) and set
`CHUNKER_URL=http://127.0.0.1:8080`.

### Changing the database

Models are in `backend/app/models.py`. After changing them:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
python -m app.cli migrate
```

The Docker image runs `migrate` on every start. A test fails if the models and migrations disagree.

## Tests

| What | Command | Covers |
| --- | --- | --- |
| API | `cd backend && python -m pytest tests` | Every endpoint, roles, limits, email, AI proxy (fake provider), migrations, and every lab's solutions and starters |
| Browser | `cd frontend && npm run build && npm run e2e` | Apply, admin review, a Python lab step, an AI call, the phone layout (set `E2E_PYTHON` to your backend Python) |
| Notebooks | `python -m pytest tests` (repo root) | Runs every notebook with model answers |

All three run in GitHub Actions.

## How the notebooks work

Every exercise has a cell for the learner's code and a check cell that prints **PASS** or a hint. When every
exercise has passed, the last cell prints a completion code such as `AK-W04-3F9A1C`, made from the learner's email
and the week. Learners submit it on their week page, where it's checked against their email. Codes and lab checks
are an honesty system: a determined learner could read the code that makes them.

## Still to do before launch

1. **Add the data.** Download the raw datasets (links in `lab/content/data/README.md`) into `raw/`, then run the
   trim scripts in `scripts/` (each writes into `lab/content/data/` and lists the columns if it can't find one).
   Read a sample of the NaijaSenti split by eye.
2. **Run weeks 3-5 in the browser lab** on the real data, and time week 5 (if slow, `trim_naijasenti.py --per-variety 500`).
3. **Set up Kaggle** for week 6 part 2: see `kaggle/README.md`.
4. **Deploy** with `deploy/DEPLOY.md`, then fill in Settings: dates, live session link, privacy contact email.
5. **Check the defaults:** the privacy notice's retention periods, the AI limits in `.env`, and the course handbook
   text used in weeks 8-9 (`backend/app/labcontent/handbook.py`).
6. **Pin the chunker** to a release tag in `docker-compose.yml` once one exists.

Model answers live in `tests/solutions/` and `backend/app/labcontent/`; if this repo is public, learners can find them.
