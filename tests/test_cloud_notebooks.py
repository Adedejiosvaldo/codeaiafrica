"""Run the offline parts of the week 6-10 notebooks with model answers.

Cells that need a GPU, a downloaded model or a live API are skipped:
install cells, and everything after the "stop_after" tag.
"""
import subprocess
import sys
from pathlib import Path

import nbformat
import pytest
from nbclient import NotebookClient

sys.path.insert(0, str(Path(__file__).parent))
from solutions.cloud import SOLUTIONS  # noqa: E402
from test_lab_notebooks import outputs_text, tag  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.parametrize("name", sorted(SOLUTIONS))
def test_offline_parts_pass(name, tmp_path, monkeypatch):
    subprocess.run([sys.executable, str(ROOT / "tests" / "make_fixtures.py"), str(tmp_path)], check=True)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")  # never used: the checks use a fake client
    answers = SOLUTIONS[name]
    book = nbformat.read(ROOT / "kaggle" / name, as_version=4)
    kept = []
    for cell in book.cells:
        t = tag(cell)
        if t == "install":
            continue
        if t == "setup":
            cell.source = cell.source.replace('EMAIL = ""', 'EMAIL = "learner@example.com"')
        if t in answers:
            cell.source = answers[t]
        cell.source = cell.source.replace("/kaggle/input/akada-labs-course-data/", f"{tmp_path}/")
        kept.append(cell)
        if t == answers["stop_after"]:
            break
    book.cells = kept
    NotebookClient(book, timeout=120, kernel_name="python3").execute()
    checks = [c for c in book.cells if (tag(c) or "").startswith("check-")]
    assert checks
    for cell in checks:
        assert "PASS" in outputs_text(cell), f"{tag(cell)}: {outputs_text(cell)}"
    if answers["stop_after"] == "finish":
        assert "AK-W" in outputs_text(book.cells[-1])
