"""Write small random test files with the same columns as the real CSVs.

These are for the test suite only. They are not course data and must
never be copied into lab/content/data.
"""
import random
import sys
from pathlib import Path

import numpy as np
import pandas as pd


def air_quality(rng):
    hours = pd.date_range("2024-03-01", periods=24 * 30, freq="h")
    pm25 = np.clip(rng.gamma(2.5, 14, len(hours)), 1, None).round(1)
    return pd.DataFrame({
        "timestamp": hours.strftime("%Y-%m-%d %H:%M"),
        "pm25": pm25,
        "pm10": (pm25 * 1.6).round(1),
        "temperature": rng.normal(29, 2, len(hours)).round(1),
        "humidity": rng.normal(78, 6, len(hours)).round(1),
    })


def food_prices(rng):
    markets = ["Market A", "Market B", "Market C", "Market D"]
    base = {"rice": 900, "beans": 700, "maize": 400, "garri": 350}
    months = pd.date_range("2020-01-01", "2025-12-01", freq="MS")
    rows = []
    for m in markets:
        level = rng.uniform(0.85, 1.15)
        for c, b in base.items():
            for i, d in enumerate(months):
                price = b * level * (1.025 ** i) * rng.uniform(0.95, 1.05)
                rows.append((d.strftime("%Y-%m-%d"), m, "State " + m[-1], c, round(price, 2)))
    return pd.DataFrame(rows, columns=["date", "market", "state", "commodity", "price"])


def lagos_rent(rng):
    areas = {"Yaba": 1.0, "Surulere": 0.9, "Lekki": 2.2, "Ikoyi": 3.5, "Ikeja": 1.4, "Ajah": 1.1}
    types = {"Flat": 1.0, "Mini Flat": 0.6, "Detached Duplex": 2.5, "Terraced Duplex": 1.8}
    rows = []
    for _ in range(600):
        a, t = rng.choice(list(areas)), rng.choice(list(types))
        beds = int(rng.integers(1, 6))
        rent = 400_000 * areas[a] * types[t] * (0.6 + 0.4 * beds) * rng.uniform(0.8, 1.2)
        rows.append((beds, beds, beds + 1, a, t, int(rent)))
    df = pd.DataFrame(rows, columns=["bedrooms", "bathrooms", "toilets", "area", "property_type", "price"])
    df["label"] = np.where(df["price"] > df["price"].median(), "expensive", "affordable")
    return df


def tweets(rng):
    r = random.Random(0)
    words = {
        ("english_like", "positive"): "love great happy good amazing thanks wonderful best".split(),
        ("english_like", "negative"): "hate bad sad terrible awful worst angry poor".split(),
        ("pidgin", "positive"): "e sweet die gbedu correct mad oo ehen".split(),
        ("pidgin", "negative"): "wahala yeye vex wayo nonsense kpele ojoro shege".split(),
    }
    filler = {"english_like": "the this is was so my day today really very".split(),
              "pidgin": "na dey wetin abeg una wey don sef sha dem".split()}
    rows = []
    for (variety, label), w in words.items():
        for _ in range(400):
            # Pidgin tweets borrow some English sentiment words, so an English-only model gets some right
            pool = w + (words[("english_like", label)][:3] if variety == "pidgin" else [])
            toks = r.choices(filler[variety], k=5) + r.choices(pool, k=2)
            r.shuffle(toks)
            rows.append((" ".join(toks), label, variety))
    return pd.DataFrame(rows, columns=["text", "label", "variety"])


if __name__ == "__main__":
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(0)
    air_quality(rng).to_csv(out / "lagos_air_quality.csv", index=False)
    food_prices(rng).to_csv(out / "nigeria_food_prices.csv", index=False)
    lagos_rent(rng).to_csv(out / "lagos_rent.csv", index=False)
    tweets(rng).to_csv(out / "naijasenti_pcm_en.csv", index=False)
