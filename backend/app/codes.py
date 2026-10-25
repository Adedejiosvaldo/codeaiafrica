"""Completion codes printed by the lab notebooks.

Must match make_code() in lab/content/akada_checks.py and the setup cell
of the kaggle/ notebooks.
"""
import hashlib
import re

SALT = "akada-labs-cohort-1"
CODE_PATTERN = re.compile(r"^AK-W(\d{2})-([0-9A-F]{6})$")


def make_code(email, week):
    email = (email or "").strip().lower()
    digest = hashlib.sha256(f"{SALT}|{int(week)}|{email}".encode()).hexdigest()
    return f"AK-W{int(week):02d}-{digest[:6].upper()}"


def check_code(email, week, code):
    """Return None if the code is right, else a message for the learner."""
    code = (code or "").strip().upper()
    match = CODE_PATTERN.match(code)
    if not match:
        return "That doesn't look like a completion code. It should look like AK-W04-3F9A1C."
    if int(match.group(1)) != week:
        return f"That code is for week {int(match.group(1))}, not week {week}."
    if code != make_code(email, week):
        return ("That code doesn't match your email. In the notebook's first cell, use the same email "
                "you applied with, then run the notebook again.")
    return None
