"""Interactive lab content: every solution passes its check, every starter fails with a hint."""
import contextlib
import io
import sys

import pytest

from app.labs import LABS
from conftest import application
from fake_akada import make_module


@pytest.fixture(autouse=True)
def akada():
    sys.modules["akada"] = make_module()
    yield sys.modules["akada"]
    sys.modules.pop("akada", None)


def run_step(ns, step, code):
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        exec(code, ns)
    scope = dict(ns)
    scope["__output__"], scope["__code__"] = out.getvalue(), code
    with contextlib.redirect_stdout(io.StringIO()):
        exec(step["check"], scope)


def fresh(lab):
    ns = {"__name__": "__main__"}
    exec(lab["setup"], ns)
    return ns


@pytest.mark.parametrize("week", sorted(LABS))
def test_solutions_pass_in_order(week):
    lab = LABS[week]
    ns = fresh(lab)
    for step in lab["steps"]:
        try:
            run_step(ns, step, step["solution"])
        except AssertionError as e:
            pytest.fail(f"week {week} step {step['id']}: {e}")


@pytest.mark.parametrize("week", sorted(LABS))
def test_starters_fail_with_a_hint(week):
    lab = LABS[week]
    ns = fresh(lab)
    for step in lab["steps"]:
        attempt = dict(ns)
        with pytest.raises(Exception) as err:
            run_step(attempt, step, step["starter"])
        if isinstance(err.value, AssertionError):
            assert str(err.value).strip(), f"week {week} {step['id']}: a failing check should say why"
        run_step(ns, step, step["solution"])


@pytest.mark.parametrize("week", sorted(LABS))
def test_steps_are_complete(week):
    for step in LABS[week]["steps"]:
        for field in ["id", "title", "body", "task", "starter", "check", "hint", "solution"]:
            assert step.get(field), f"week {week} {step.get('id')}: missing {field}"


def test_week2_specific_hints():
    steps = {s["id"]: s for s in LABS[2]["steps"]}
    ns = {}
    run_step(ns, steps["variables"], 'location = "Yaba"\npm25 = 42.5')
    with pytest.raises(AssertionError, match="Think about exactly 35"):
        run_step(ns, steps["functions"], "def air_label(p):\n    return 'poor' if p >= 35 else 'good'")
    with pytest.raises(AssertionError, match="not just"):
        run_step(ns, steps["if"], 'reading = 48.3\nlabel = "poor"')


def test_week7_failure_step_catches_errors():
    lab = LABS[7]
    ns = fresh(lab)
    step = next(s for s in lab["steps"] if s["id"] == "failures")
    with pytest.raises(AssertionError, match="crashed"):
        run_step(ns, step, "def safe_ask(prompt):\n    return ask(prompt)")


def test_week10_guard_is_required():
    lab = LABS[10]
    ns = fresh(lab)
    for step in lab["steps"]:
        if step["id"] == "guardrails":
            loop_only = next(s for s in lab["steps"] if s["id"] == "loop")["solution"]
            with pytest.raises(AssertionError, match="max_steps"):
                run_step(dict(ns), step, loop_only)
            break
        run_step(ns, step, step["solution"])


def accepted_token(client, admin):
    client.post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    return admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).json()["learner_token"]


def test_passing_every_step_submits_the_week(client, admin, open_applications):
    token = accepted_token(client, admin)
    lab = client.get(f"/api/learner/{token}/labs/2").json()
    assert lab["passed"] == [] and len(lab["steps"]) == 8 and lab["completes_week"] is True
    assert client.get(f"/api/learner/{token}/labs/3").status_code == 404
    assert client.post(f"/api/learner/{token}/labs/2/steps/nope").status_code == 404
    ids = [s["id"] for s in lab["steps"]]
    for i, step_id in enumerate(ids):
        r = client.post(f"/api/learner/{token}/labs/2/steps/{step_id}").json()
        assert r["completed"] == (i == len(ids) - 1)
    assert r["newly_completed"] is True
    me = client.get(f"/api/learner/{token}").json()
    assert me["weeks"][1]["done"] and me["weeks"][1]["interactive"] and me["labs_done"] == 1


def test_week6_lab_does_not_submit_the_week(client, admin, open_applications):
    token = accepted_token(client, admin)
    lab = client.get(f"/api/learner/{token}/labs/6").json()
    for s in lab["steps"]:
        r = client.post(f"/api/learner/{token}/labs/6/steps/{s['id']}").json()
    assert r["completed"] and not r["newly_completed"]
    assert client.get(f"/api/learner/{token}").json()["weeks"][5]["done"] is False
