"""Run each week 2-5 notebook with model answers and check every exercise passes.

Run with: python -m pytest tests
"""
import shutil
import subprocess
import sys
from pathlib import Path

import nbformat
import pytest
from nbclient import NotebookClient

sys.path.insert(0, str(Path(__file__).parent))
from solutions.lab import SOLUTIONS  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "lab" / "content"


@pytest.fixture(scope="module")
def workdir(tmp_path_factory):
    work = tmp_path_factory.mktemp("lab")
    shutil.copy(CONTENT / "akada_checks.py", work)
    subprocess.run([sys.executable, str(ROOT / "tests" / "make_fixtures.py"), str(work / "data")], check=True)
    return work


def outputs_text(cell):
    parts = []
    for out in cell.get("outputs", []):
        parts.append(out.get("text", ""))
        parts.append(str(out.get("data", {}).get("text/plain", "")))
        if out.get("output_type") == "error":
            parts.append(f"ERROR {out['ename']}: {out['evalue']}")
    return "".join(parts)


def tag(cell):
    tags = cell.metadata.get("tags", [])
    return tags[0] if tags else None


def run(path, workdir, solved):
    book = nbformat.read(path, as_version=4)
    for cell in book.cells:
        t = tag(cell)
        if t == "setup":
            cell.source = cell.source.replace('EMAIL = ""', 'EMAIL = "learner@example.com"')
        if solved and t in SOLUTIONS[path.name]:
            cell.source = SOLUTIONS[path.name][t]
    NotebookClient(book, timeout=300, kernel_name="python3", allow_errors=not solved,
                   resources={"metadata": {"path": str(workdir)}}).execute()
    return book


@pytest.mark.parametrize("name", sorted(SOLUTIONS))
def test_solved_notebook_passes(name, workdir):
    book = run(CONTENT / name, workdir, solved=True)
    checks = [c for c in book.cells if (tag(c) or "").startswith("check-")]
    assert checks, "no check cells found"
    for cell in checks:
        assert "PASS" in outputs_text(cell), f"{tag(cell)}: {outputs_text(cell)}"
    finish = next(c for c in book.cells if tag(c) == "finish")
    assert "AK-W" in outputs_text(finish), outputs_text(finish)


@pytest.mark.parametrize("name", sorted(SOLUTIONS))
def test_unsolved_checks_give_hints_not_errors(name, workdir):
    book = run(CONTENT / name, workdir, solved=False)
    for cell in book.cells:
        if (tag(cell) or "").startswith("check-"):
            text = outputs_text(cell)
            assert "PASS" not in text, f"{tag(cell)} passed with no answer"
            # A traceback is OK only if an earlier, unfinished cell broke the chain
            assert "Not yet" in text or "ERROR NameError" in text, f"{tag(cell)}: {text}"
    finish = next(c for c in book.cells if tag(c) == "finish")
    assert "AK-W" not in outputs_text(finish)


def test_completion_code_matches_verifier():
    sys.path.insert(0, str(CONTENT))
    sys.path.insert(0, str(ROOT / "scripts"))
    import akada_checks
    import verify_completion_code
    code = akada_checks.make_code(" Learner@Example.com ", 4)
    assert verify_completion_code.expected_code("learner@example.com", 4) == code
