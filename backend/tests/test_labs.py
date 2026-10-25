"""Interactive lab content: every solution passes its check, every starter fails it."""
import contextlib
import io

import pytest

from app.labs import LABS
from conftest import application


def run_step(ns, step, code):
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        exec(code, ns)
    ns["__output__"], ns["__code__"] = out.getvalue(), code
    exec(step["check"], ns)


@pytest.mark.parametrize("week", sorted(LABS))
def test_solutions_pass_in_order(week):
    ns = {}
    for step in LABS[week]["steps"]:
        run_step(ns, step, step["solution"])


@pytest.mark.parametrize("week", sorted(LABS))
def test_starters_fail_with_a_hint(week):
    ns = {}
    for step in LABS[week]["steps"]:
        clean = dict(ns)
        with pytest.raises(Exception) as err:
            run_step(clean, step, step["starter"])
        if isinstance(err.value, AssertionError):
            assert str(err.value), f"{step['id']}: failing check should explain why"
        run_step(ns, step, step["solution"])  # move on with a correct namespace


def test_wrong_answers_get_specific_hints():
    steps = {s["id"]: s for s in LABS[2]["steps"]}
    ns = {}
    run_step(ns, steps["variables"], 'location = "Yaba"\npm25 = 42.5')
    with pytest.raises(AssertionError, match="Think about exactly 35"):
        run_step(ns, steps["functions"], "def air_label(p):\n    return 'poor' if p >= 35 else 'good'")
    with pytest.raises(AssertionError, match="not just"):
        run_step(ns, steps["if"], 'reading = 48.3\nlabel = "poor"')


def test_passing_every_step_submits_the_week(client, admin, open_applications):
    client.post("/api/applications", json=application())
    [row] = admin.get("/api/admin/applications").json()
    token = admin.patch(f"/api/admin/applications/{row['id']}", json={"status": "accepted"}).json()["learner_token"]

    lab = client.get(f"/api/learner/{token}/labs/2").json()
    assert lab["passed"] == [] and len(lab["steps"]) == 8
    assert client.get(f"/api/learner/{token}/labs/7").status_code == 404
    assert client.post(f"/api/learner/{token}/labs/2/steps/nope").status_code == 404

    ids = [s["id"] for s in lab["steps"]]
    for i, step_id in enumerate(ids):
        r = client.post(f"/api/learner/{token}/labs/2/steps/{step_id}").json()
        assert r["completed"] == (i == len(ids) - 1)
    assert r["newly_completed"] is True
    again = client.post(f"/api/learner/{token}/labs/2/steps/{ids[0]}").json()
    assert again["completed"] and not again["newly_completed"]

    me = client.get(f"/api/learner/{token}").json()
    week2 = me["weeks"][1]
    assert week2["done"] and week2["interactive"] and me["labs_done"] == 1
