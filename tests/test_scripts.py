import csv
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

HEADER = [
    "Timestamp", "Name", "Email", "WhatsApp number", "Age: confirm you are 18 or older", "City and country",
    "What best describes you?", "Which device will you use?",
    "Can you attend a live 60-minute session on Saturday mornings for 12 weeks?",
    "How many hours a week can you give to labs?", "Have you written any code before?",
    "In one or two sentences: what problem would you like to solve with AI?",
    "Will you commit to submitting 9 of the 12 labs?", "q9_score",
]


def applicant(i, device="Own laptop", live="Yes", hours="2-4", age="Yes", commit="Yes", q9=3):
    return ["t", f"P{i}", f"p{i}@x.com", "080", age, "Lagos", "student", device, live, hours, "never", "...", commit, q9]


def test_scoring_and_decisions(tmp_path):
    rows = [
        applicant(1),                                              # 10
        applicant(2, device="Cyber café", live="Most weeks"),      # 2+2+1+3 = 8
        applicant(3, device="Phone only", hours="Under 2", q9=1),  # 3+0+0+1 = 4
        applicant(4, commit="No"),                                 # not eligible
        applicant(5, age="No"),                                    # not eligible
    ]
    path = tmp_path / "responses.csv"
    with path.open("w", newline="") as f:
        csv.writer(f).writerows([HEADER] + rows)
    subprocess.run([sys.executable, str(ROOT / "scripts" / "score_applications.py"), str(path), "--cap", "1",
                    "--waitlist", "1"], check=True)
    with (tmp_path / "responses_scored.csv").open() as f:
        result = {r["Name"]: (int(r["score"]), r["decision"]) for r in csv.DictReader(f)}
    assert result["P1"] == (10, "accepted")
    assert result["P2"] == (8, "waitlist")
    assert result["P3"] == (4, "not accepted")
    assert result["P4"][1] == "not accepted"
    assert result["P5"][1] == "not accepted"
