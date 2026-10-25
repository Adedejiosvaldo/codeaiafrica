"""Check learners' completion codes from the lab submission form.

Usage:
    python scripts/verify_completion_code.py submissions.csv

The CSV needs columns named email, week and code (rename them in the
Google Form export if needed). Prints each row with OK or WRONG, and
writes a copy with a "valid" column next to the input file.
"""
import csv
import hashlib
import sys
from pathlib import Path

SALT = "akada-labs-cohort-1"  # must match lab/content/akada_checks.py


def expected_code(email, week):
    email = (email or "").strip().lower()
    digest = hashlib.sha256(f"{SALT}|{int(week)}|{email}".encode()).hexdigest()
    return f"AK-W{int(week):02d}-{digest[:6].upper()}"


def main(path):
    path = Path(path)
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        ok = row["code"].strip().upper() == expected_code(row["email"], row["week"])
        row["valid"] = "yes" if ok else "no"
        print(f"{'OK   ' if ok else 'WRONG'}  week {row['week']:>2}  {row['email']}")
    out = path.with_name(path.stem + "_checked.csv")
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else ["email", "week", "code", "valid"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nWrote {out}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
