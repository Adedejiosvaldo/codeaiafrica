"""Score cohort applications using the selection rubric (out of 10).

1. Export the Google Form responses as CSV.
2. Add a column called q9_score and give each answer to Q9 ("what problem
   would you like to solve with AI?") 0-3 points: 3 if it is specific and
   clearly their own, 0 if blank or copied.
3. Run:

    python scripts/score_applications.py responses.csv --cap 40

Writes responses_scored.csv with score and decision columns (accepted,
waitlist, not accepted). Columns are matched by the start of each question,
so keep the question wording from docs/build-specs.md.

Rubric:
    Q6 live sessions: yes 3, most weeks 2, no 0
    Q7 lab hours:     2 hours or more 2, under 2 0
    Q5 device:        any laptop 2, cyber cafe 1, phone only 0
    Q9 problem:       0-3, scored by a reviewer
    "No" to Q2 (18 or older) or Q10 (commit to 9 of 12 labs) means not accepted.
    Q8 (prior coding) is not scored.
"""
import argparse
import csv
import sys
from pathlib import Path

QUESTIONS = {
    "age": "age",
    "device": "which device",
    "live": "can you attend",
    "hours": "how many hours",
    "commit": "will you commit",
    "q9_score": "q9_score",
    "name": "name",
    "email": "email",
}


def find_columns(header):
    found = {}
    for key, start in QUESTIONS.items():
        match = next((h for h in header if h.strip().lower().startswith(start)), None)
        if match is None:
            sys.exit(f"Error: no column starting with {start!r}. Columns: {header}")
        found[key] = match
    return found


def score(row, col):
    live = row[col["live"]].strip().lower()
    hours = row[col["hours"]].strip().lower()
    device = row[col["device"]].strip().lower()

    points = {"yes": 3, "most weeks": 2}.get(live, 0)
    points += 0 if hours.startswith("under") else 2 if hours else 0
    if "phone" in device:
        points += 0
    elif "caf" in device:
        points += 1
    elif "laptop" in device:
        points += 2
    try:
        points += max(0, min(3, int(float(row[col["q9_score"]] or 0))))
    except ValueError:
        sys.exit(f"Error: q9_score must be 0-3, got {row[col['q9_score']]!r} for {row[col['email']]}")
    return points


def eligible(row, col):
    age = row[col["age"]].strip().lower()
    commit = row[col["commit"]].strip().lower()
    return not age.startswith("no") and commit.startswith("yes")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("file", type=Path)
    parser.add_argument("--cap", type=int, default=40)
    parser.add_argument("--waitlist", type=int, default=10)
    args = parser.parse_args()

    with args.file.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        col = find_columns(reader.fieldnames)

    for row in rows:
        row["score"] = score(row, col)
        row["eligible"] = "yes" if eligible(row, col) else "no"

    # Highest score first; ties keep form order (earlier applicants first)
    ranked = sorted((r for r in rows if r["eligible"] == "yes"), key=lambda r: -r["score"])
    for i, row in enumerate(ranked):
        row["decision"] = "accepted" if i < args.cap else "waitlist" if i < args.cap + args.waitlist else "not accepted"
    for row in rows:
        row.setdefault("decision", "not accepted")
    if len(ranked) > args.cap and ranked[args.cap - 1]["score"] == ranked[args.cap]["score"]:
        print(f"Note: a tie at score {ranked[args.cap]['score']} crosses the cap. Earlier applicants were taken first; review by hand.")

    out = args.file.with_name(args.file.stem + "_scored.csv")
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda r: (r["decision"] != "accepted", r["decision"] != "waitlist", -r["score"])))

    counts = {d: sum(r["decision"] == d for r in rows) for d in ["accepted", "waitlist", "not accepted"]}
    print(f"{len(rows)} applications: " + ", ".join(f"{n} {d}" for d, n in counts.items()))
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
