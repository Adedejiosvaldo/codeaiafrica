"""The selection rubric from the build spec (score out of 10)."""

OCCUPATIONS = {"student": "University student", "working": "Working", "looking": "Looking for work", "other": "Other"}
DEVICES = {"own_laptop": "Own laptop", "shared_laptop": "Shared or family laptop", "cyber_cafe": "Cyber café",
           "phone_only": "Phone only"}
LIVE = {"yes": "Yes", "most_weeks": "Most weeks", "no": "No"}
HOURS = {"under_2": "Under 2 hours", "2_4": "2–4 hours", "over_4": "Over 4 hours"}
CODED = {"never": "Never", "a_little": "A little", "yes": "Yes"}

LIVE_POINTS = {"yes": 3, "most_weeks": 2, "no": 0}
HOURS_POINTS = {"under_2": 0, "2_4": 2, "over_4": 2}
DEVICE_POINTS = {"own_laptop": 2, "shared_laptop": 2, "cyber_cafe": 1, "phone_only": 0}


def eligible(app):
    """'No' to Q2 (18 or older) or Q10 (commit to 9 of 12 labs) means not accepted."""
    return bool(app.is_adult and app.commits)


def auto_score(app):
    """Points from Q5-Q7 (up to 7). Q8, prior coding, is not scored."""
    return LIVE_POINTS[app.live_sessions] + HOURS_POINTS[app.lab_hours] + DEVICE_POINTS[app.device]


def total_score(app):
    return auto_score(app) + (app.q9_score or 0)


def breakdown(app):
    return {
        "live_sessions": LIVE_POINTS[app.live_sessions],
        "lab_hours": HOURS_POINTS[app.lab_hours],
        "device": DEVICE_POINTS[app.device],
        "problem": app.q9_score,
    }


def rank(apps, cap, waitlist_size):
    """Decide who gets in: eligible applicants, highest score first, earliest first on ties.

    Returns a list of (application, decision) for every application passed in.
    """
    ordered = sorted((a for a in apps if eligible(a)), key=lambda a: (-total_score(a), a.created_at.replace(tzinfo=None), a.id))
    decisions = {}
    for i, app in enumerate(ordered):
        decisions[app.id] = "accepted" if i < cap else "waitlisted" if i < cap + waitlist_size else "rejected"
    return [(a, decisions.get(a.id, "rejected")) for a in ordered + [a for a in apps if not eligible(a)]]
