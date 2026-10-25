"""Week 4 data: Lagos rental listings labelled affordable or expensive.

Source: Lagos rent prices 2022 (Kaggle, mirrored on openAFRICA as
"Cost of housing in Lagos", CC BY).

    python scripts/trim_lagos_rent.py raw/lagos_rent.csv

Column names are guessed; override them with --price, --bedrooms, --area
and --type if the guess fails.

Output: lab/content/data/lagos_rent.csv with columns
bedrooms, bathrooms, toilets, area, property_type, price, label.
The label is "expensive" above the median rent, otherwise "affordable".
"""
import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from _common import find_column, read_table, report

OUT = Path(__file__).resolve().parents[1] / "lab" / "content" / "data" / "lagos_rent.csv"


def to_number(series):
    text = series.astype(str).str.replace(r"[^\d.]", "", regex=True)
    return pd.to_numeric(text, errors="coerce")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("file")
    parser.add_argument("--price")
    parser.add_argument("--bedrooms")
    parser.add_argument("--area", help="neighbourhood column")
    parser.add_argument("--type", help="property type column")
    parser.add_argument("--min-listings", type=int, default=15, help="drop areas with fewer listings")
    parser.add_argument("--max-rows", type=int, default=3000)
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()

    raw = read_table(args.file)
    cols = {
        "price": find_column(raw, args.price, ["price", "rent", "amount", "price_ngn"]),
        "bedrooms": find_column(raw, args.bedrooms, ["bedrooms", "bedroom", "beds"]),
        "area": find_column(raw, args.area, ["neighborhood", "neighbourhood", "area", "location", "town"]),
        "property_type": find_column(raw, args.type, ["type", "property_type", "house_type", "title"]),
    }
    for extra in ["bathrooms", "toilets"]:
        found = find_column(raw, None, [extra, extra[:-1]], required=False)
        if found:
            cols[extra] = found

    df = pd.DataFrame({ours: raw[theirs] for ours, theirs in cols.items()})
    df["price"] = to_number(df["price"])
    for c in ["bedrooms", "bathrooms", "toilets"]:
        if c in df:
            df[c] = to_number(df[c])
    df["area"] = df["area"].astype(str).str.split(",").str[0].str.strip().str.title()
    # Listing titles often start "3 Bedroom Flat": keep just the type
    df["property_type"] = (df["property_type"].astype(str)
                           .str.replace(r"^\s*\d+\s*bed(room)?s?\s*", "", regex=True, case=False)
                           .str.strip().str.title())
    df = df.dropna(subset=["price", "bedrooms"]).drop_duplicates()

    # Drop the most extreme 1% at each end (typos and sale prices listed as rent)
    low, high = df["price"].quantile([0.01, 0.99])
    df = df[df["price"].between(low, high)]
    counts = df["area"].value_counts()
    df = df[df["area"].isin(counts[counts >= args.min_listings].index)]
    if len(df) > args.max_rows:
        df = df.sample(args.max_rows, random_state=42)

    df["bedrooms"] = df["bedrooms"].astype(int)
    df["price"] = df["price"].astype(np.int64)
    median = df["price"].median()
    df["label"] = np.where(df["price"] > median, "expensive", "affordable")
    order = [c for c in ["bedrooms", "bathrooms", "toilets", "area", "property_type", "price", "label"] if c in df]
    df = df[order].sort_values(["area", "price"])
    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    report(df, args.out)
    print(f"Median rent (the affordable/expensive line): N{median:,.0f}. Areas: {df['area'].nunique()}")


if __name__ == "__main__":
    main()
