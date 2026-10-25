"""Self-checks for the Akada Labs browser notebooks (weeks 2-5).

Every exercise has a check function that prints PASS or a hint.
Expected answers are worked out from the data file, so the checks
still work after the CSVs in data/ are refreshed.

The last cell of each notebook calls completion_code(), which only
prints a code once every exercise has passed in this session.
"""

import hashlib
import re

# Shared with scripts/verify_completion_code.py. This is an honesty
# system, not security: anyone reading this file can see the salt.
SALT = "akada-labs-cohort-1"

_passed = {}  # week -> set of exercise numbers that passed


def _ok(week, exercise):
    _passed.setdefault(week, set()).add(exercise)
    print(f"PASS: exercise {exercise} done.")
    return True


def _hint(message):
    print(f"Not yet. Hint: {message}")
    return False


def _close(a, b, tol=0.01):
    try:
        return abs(float(a) - float(b)) <= tol * max(1.0, abs(float(b)))
    except (TypeError, ValueError):
        return False


def _sentences(text):
    if not isinstance(text, str):
        return 0
    parts = [p for p in re.split(r"[.!?]+", text) if len(p.strip().split()) >= 3]
    return len(parts)


def _free_text(week, exercise, text, min_sentences):
    if _sentences(text) >= min_sentences:
        print("Saved. A TA will read this answer.")
        return _ok(week, exercise)
    return _hint(
        f"write at least {min_sentences} full sentences inside the quotes."
    )


def make_code(email, week):
    email = (email or "").strip().lower()
    digest = hashlib.sha256(f"{SALT}|{week}|{email}".encode()).hexdigest()
    return f"AK-W{week:02d}-{digest[:6].upper()}"


def completion_code(email, week, exercises):
    if not isinstance(email, str) or "@" not in email:
        print("Put the email you applied with in the first cell, run it, then run this cell again.")
        return
    missing = sorted(set(exercises) - _passed.get(week, set()))
    if missing:
        names = ", ".join(str(m) for m in missing)
        print(f"Almost there. These exercises have not passed yet: {names}.")
        print("Run each exercise and its check cell again, from the top.")
        return
    code = make_code(email, week)
    print(f"Well done! Your completion code is: {code}")
    print("Paste it into the lab submission form.")


# ---------------------------------------------------------------------------
# Week 2: Python in the browser (Lagos air quality)
# ---------------------------------------------------------------------------

POOR_AIR_PM25 = 35  # PM2.5 above this (µg/m³) counts as "poor" in these labs


class week2:
    WEEK = 2
    EXERCISES = [1, 2, 3, 4, 5]

    @staticmethod
    def check_1(location, pm25, sentence):
        if not isinstance(location, str) or not location.strip():
            return _hint("location should be text in quotes, like \"Yaba\".")
        if isinstance(pm25, bool) or not isinstance(pm25, (int, float)):
            return _hint("pm25 should be a number, with no quotes around it.")
        if not isinstance(sentence, str) or str(pm25) not in sentence:
            return _hint("build sentence with an f-string that includes pm25, "
                         "like f\"In {location} PM2.5 is {pm25}\".")
        return _ok(2, 1)

    @staticmethod
    def check_2(temps, highest, average):
        if not isinstance(temps, list) or len(temps) != 7:
            return _hint("temps should be a list with 7 numbers in square brackets.")
        if not _close(highest, max(temps)):
            return _hint("max(temps) gives the highest value.")
        if not _close(average, sum(temps) / len(temps)):
            return _hint("the average is sum(temps) / len(temps).")
        return _ok(2, 2)

    @staticmethod
    def check_3(readings, labels):
        expected = ["poor" if r > POOR_AIR_PM25 else "good" for r in readings]
        if not isinstance(labels, list) or len(labels) != len(readings):
            return _hint("labels should be a list with one label per reading. "
                         "Start with labels = [] and use labels.append(...).")
        if labels != expected:
            return _hint(f"a reading above {POOR_AIR_PM25} is \"poor\", "
                         "anything else is \"good\". Check your spelling too.")
        return _ok(2, 3)

    @staticmethod
    def check_4(air_label):
        if not callable(air_label):
            return _hint("define a function with def air_label(pm25): ...")
        tests = [3.2, 35, 35.1, 80, 12]
        for value in tests:
            want = "poor" if value > POOR_AIR_PM25 else "good"
            try:
                got = air_label(value)
            except Exception as error:
                return _hint(f"air_label({value}) raised an error: {error}")
            if got != want:
                return _hint("your function gives the wrong label for one of the "
                             "hidden test values. Think about exactly 35.")
        return _ok(2, 4)

    @staticmethod
    def check_5(df, poor_hours):
        expected = int((df["pm25"] > POOR_AIR_PM25).sum())
        if isinstance(poor_hours, bool) or not _close(poor_hours, expected, tol=0):
            return _hint(f"count the rows where pm25 is above {POOR_AIR_PM25}. "
                         "You can loop over df[\"pm25\"] and use air_label.")
        return _ok(2, 5)


# ---------------------------------------------------------------------------
# Week 3: Working with data (World Bank food prices)
# ---------------------------------------------------------------------------

class week3:
    WEEK = 3
    EXERCISES = [1, 2, 3, 4, 5, 6]

    @staticmethod
    def check_1(df, n_rows, n_cols):
        import pandas as pd
        if not isinstance(df, pd.DataFrame):
            return _hint("load the file with pd.read_csv(...).")
        if (n_rows, n_cols) != df.shape:
            return _hint("df.shape gives (rows, columns). Store each number.")
        return _ok(3, 1)

    @staticmethod
    def check_2(df, market, rice):
        expected = df[(df["commodity"] == "rice") & (df["market"] == market)]
        if rice is None or len(rice) != len(expected):
            return _hint("combine two conditions with &, each in brackets: "
                         "(df[\"commodity\"] == \"rice\") & (df[\"market\"] == MARKET).")
        return _ok(3, 2)

    @staticmethod
    def check_3(df, market, peak_month):
        rice = df[(df["commodity"] == "rice") & (df["market"] == market)]
        expected = rice.loc[rice["price"].idxmax(), "date"]
        if str(peak_month)[:7] != str(expected)[:7]:
            return _hint("sort rice by price, or use rice[\"price\"].idxmax() "
                         "to find the row, then read its date.")
        return _ok(3, 3)

    @staticmethod
    def check_4(df, avg_by_market):
        rice = df[df["commodity"] == "rice"]
        expected = rice.groupby("market")["price"].mean()
        try:
            ok = all(_close(avg_by_market[m], v) for m, v in expected.items())
        except Exception:
            ok = False
        if not ok or len(avg_by_market) != len(expected):
            return _hint("filter to rice first, then "
                         "rice.groupby(\"market\")[\"price\"].mean().")
        return _ok(3, 4)

    @staticmethod
    def check_5(fig):
        axes = getattr(fig, "axes", None)
        if not axes:
            return _hint("make the chart with fig, ax = plt.subplots() and pass fig here.")
        lines = sum(len(ax.get_lines()) for ax in axes)
        if lines < 2:
            return _hint("call ax.plot(...) once for each market, so there are 2 lines.")
        return _ok(3, 5)

    @staticmethod
    def check_6(answer):
        return _free_text(3, 6, answer, 2)


# ---------------------------------------------------------------------------
# Week 4: Your first ML model (Lagos rents)
# ---------------------------------------------------------------------------

class week4:
    WEEK = 4
    EXERCISES = [1, 2, 3, 4, 5, 6]
    ACCURACY_FLOOR = 0.60

    @staticmethod
    def check_1(df, X, y):
        if X is None or y is None:
            return _hint("set X to the feature columns and y to the label column.")
        if len(X) != len(df) or len(y) != len(df):
            return _hint("X and y should have one row per listing.")
        if "label" in getattr(X, "columns", []):
            return _hint("the label must not be one of the features in X.")
        if getattr(X, "shape", (0, 0))[1] < 3:
            return _hint("use pd.get_dummies on bedrooms, area and property_type.")
        return _ok(4, 1)

    @staticmethod
    def check_2(X, X_train, X_test, y_train, y_test):
        n = len(X)
        expected_test = -(-n * 20 // 100)  # 20%, rounded up like scikit-learn
        if X_train is None or X_test is None:
            return _hint("use train_test_split(X, y, test_size=0.2, random_state=42).")
        if len(X_test) != expected_test or len(X_train) != n - expected_test:
            return _hint("set test_size=0.2 so 20% of rows go to the test set.")
        if len(y_train) != len(X_train) or len(y_test) != len(X_test):
            return _hint("unpack in this order: X_train, X_test, y_train, y_test.")
        return _ok(4, 2)

    @staticmethod
    def check_3(model):
        from sklearn.tree import DecisionTreeClassifier
        if not isinstance(model, DecisionTreeClassifier):
            return _hint("model should be DecisionTreeClassifier(...).")
        if not hasattr(model, "classes_"):
            return _hint("call model.fit(X_train, y_train).")
        return _ok(4, 3)

    @staticmethod
    def check_4(model, X_test, y_test, accuracy):
        real = (model.predict(X_test) == y_test).mean()
        if not _close(accuracy, real):
            return _hint("use accuracy_score(y_test, model.predict(X_test)).")
        floor = week4.ACCURACY_FLOOR
        if real < floor:
            return _hint(f"accuracy is {real:.2f}; aim for at least {floor:.2f}. "
                         "Try max_depth=4 or 6.")
        return _ok(4, 4)

    @staticmethod
    def check_5(predictions, labels):
        if predictions is None or len(predictions) != 3:
            return _hint("make a table with exactly 3 listings and predict all 3.")
        if not all(p in set(labels) for p in predictions):
            return _hint("predictions should come from model.predict(...).")
        return _ok(4, 5)

    @staticmethod
    def check_6(importances, answer):
        if importances is None or len(importances) == 0:
            return _hint("build importances from model.feature_importances_.")
        return _free_text(4, 6, answer, 1)


# ---------------------------------------------------------------------------
# Week 5: When models go wrong (NaijaSenti)
# ---------------------------------------------------------------------------

class week5:
    WEEK = 5
    EXERCISES = [1, 2, 3, 4, 5]
    _scores = {}

    @staticmethod
    def check_1(model):
        if model is None or not hasattr(model, "predict"):
            return _hint("build a make_pipeline(CountVectorizer(), LogisticRegression(...)).")
        try:
            model.predict(["test"])
        except Exception:
            return _hint("call model.fit(train_en[\"text\"], train_en[\"label\"]).")
        return _ok(5, 1)

    @staticmethod
    def check_2(model, test_en, test_pcm, acc_en, acc_pcm):
        real_en = (model.predict(test_en["text"]) == test_en["label"]).mean()
        real_pcm = (model.predict(test_pcm["text"]) == test_pcm["label"]).mean()
        if not (_close(acc_en, real_en) and _close(acc_pcm, real_pcm)):
            return _hint("score each test set with "
                         "accuracy_score(test[\"label\"], model.predict(test[\"text\"])).")
        week5._scores["pcm_before"] = real_pcm
        gap = real_en - real_pcm
        print(f"English-like: {real_en:.0%}   Pidgin: {real_pcm:.0%}   gap: {gap:+.0%}")
        if gap < 0.03:
            print("Interesting: the gap is small on this data. Say so in exercise 5.")
        return _ok(5, 2)

    @staticmethod
    def check_3(model_both, test_pcm, acc_pcm_new):
        real = (model_both.predict(test_pcm["text"]) == test_pcm["label"]).mean()
        if not _close(acc_pcm_new, real):
            return _hint("score model_both on test_pcm, the same Pidgin test set as before.")
        before = week5._scores.get("pcm_before")
        if before is not None:
            print(f"Pidgin accuracy before: {before:.0%}   after: {real:.0%}")
            if real <= before:
                print("It did not go up this time. Did you train on train_en and train_pcm together?")
        return _ok(5, 3)

    @staticmethod
    def check_4(skewed, baseline_accuracy):
        if skewed is None or len(skewed) == 0:
            return _hint("build skewed from the sample code above.")
        share = skewed["label"].value_counts(normalize=True).iloc[0]
        if share < 0.85:
            return _hint("about 90% of skewed should share one label.")
        if not _close(baseline_accuracy, share, tol=0.02):
            return _hint("the majority guess scores the share of the most common label. "
                         "Try DummyClassifier(strategy=\"most_frequent\").")
        print(f"A model that always guesses one label scores {baseline_accuracy:.0%}.")
        return _ok(5, 4)

    @staticmethod
    def check_5(answer):
        return _free_text(5, 5, answer, 3)


# If a learner runs a check before finishing the exercise, give a hint
# instead of a long error message.
def _safe(fn):
    def wrapper(*args, **kwargs):
        try:
            fn(*args, **kwargs)
        except Exception as error:
            _hint("something above isn't finished yet, or a cell was skipped. "
                         f"Run the cells in order from the top. ({type(error).__name__}: {error})")
    wrapper.__name__ = fn.__name__
    wrapper.__doc__ = fn.__doc__
    return wrapper


for _cls in (week2, week3, week4, week5):
    for _name, _value in list(vars(_cls).items()):
        if _name.startswith("check_"):
            setattr(_cls, _name, staticmethod(_safe(_value.__func__ if isinstance(_value, staticmethod) else _value)))
