"""Week 3 and 10 data: monthly food prices in 10 Nigerian markets, 2020 onward.

Source: World Bank, Monthly food price estimates by product and market, Nigeria
(microdata.worldbank.org/catalog/4503). Check the terms of use on download.

    python scripts/trim_food_prices.py raw/NGA_RTFP_mkt.csv

The World Bank file is wide (one column per product, with prefixes like
c_rice for the closing price). Long files with commodity and price columns
also work. Use --list to see the product columns, and --items to map them:

    --items rice=rice,beans=beans,maize=maize,garri=gari

Output: lab/content/data/nigeria_food_prices.csv with columns
date, market, state, commodity, price (naira).
"""
import argparse
from pathlib import Path

import pandas as pd

from _common import find_column, read_table, report, stop

OUT = Path(__file__).resolve().parents[1] / "lab" / "content" / "data" / "nigeria_food_prices.csv"
DEFAULT_ITEMS = "rice=rice,beans=beans,maize=maize,garri=gari"


def parse_items(text):
    return dict(pair.split("=", 1) for pair in text.split(","))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("file")
    parser.add_argument("--items", default=DEFAULT_ITEMS, help="our_name=name_in_file, comma separated")
    parser.add_argument("--prefix", default="c_", help="price column prefix in the wide file (default c_)")
    parser.add_argument("--since", default="2020-01-01")
    parser.add_argument("--markets", help="comma-separated market names (default: 10 with the most data)")
    parser.add_argument("--n-markets", type=int, default=10)
    parser.add_argument("--list", action="store_true", help="print product columns and markets, then stop")
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()

    raw = read_table(args.file)
    market = find_column(raw, None, ["mkt_name", "market", "market_name"])
    state = find_column(raw, None, ["adm1_name", "state", "admin1"], required=False)
    date_col = find_column(raw, None, ["price_date", "date", "month_date"], required=False)
    if date_col:
        raw["_date"] = pd.to_datetime(raw[date_col], errors="coerce")
    else:
        raw["_date"] = pd.to_datetime(dict(year=raw[find_column(raw, None, ["year"])],
                                          month=raw[find_column(raw, None, ["month"])], day=1), errors="coerce")
    raw["_date"] = raw["_date"].dt.to_period("M").dt.to_timestamp()

    commodity_col = find_column(raw, None, ["commodity", "item", "product", "cm_name"], required=False)
    if args.list:
        if commodity_col:
            print("Products:", sorted(raw[commodity_col].dropna().unique()))
        else:
            print("Price columns:", [c for c in raw.columns if c.startswith(args.prefix)])
        print("Markets:", sorted(raw[market].dropna().unique()))
        return

    items = parse_items(args.items)
    if commodity_col:  # long format
        price = find_column(raw, None, ["price", "mp_price", "value"])
        lookup = {v.lower(): k for k, v in items.items()}
        raw["_item"] = raw[commodity_col].astype(str).str.lower().map(lookup)
        long = raw.dropna(subset=["_item"]).rename(columns={price: "price"})
    else:  # wide World Bank format
        cols = {}
        for ours, theirs in items.items():
            col = args.prefix + theirs
            if col not in raw:
                stop(f"no column {col!r}. Run with --list and fix --items", raw)
            cols[col] = ours
        keep = [market, "_date"] + ([state] if state else []) + list(cols)
        long = raw[keep].melt(id_vars=keep[: len(keep) - len(cols)], var_name="_col", value_name="price")
        long["_item"] = long["_col"].map(cols)

    long["price"] = pd.to_numeric(long["price"], errors="coerce")
    long = long.dropna(subset=["price", "_date"])
    long = long[long["_date"] >= pd.Timestamp(args.since)]

    if args.markets:
        chosen = [m.strip() for m in args.markets.split(",")]
    else:  # markets with the most rice prices, so every learner's MARKET has data
        rice = long[long["_item"] == "rice"]
        chosen = rice[market].value_counts().head(args.n_markets).index.tolist()
    long = long[long[market].isin(chosen)]

    out = pd.DataFrame({
        "date": long["_date"].dt.strftime("%Y-%m-%d"),
        "market": long[market],
        "state": long[state] if state else "",
        "commodity": long["_item"],
        "price": long["price"].round(2),
    })
    out = out.groupby(["date", "market", "state", "commodity"], as_index=False)["price"].mean()
    out = out.sort_values(["commodity", "market", "date"])
    args.out.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False)
    report(out, args.out)
    print("Markets:", ", ".join(chosen))


if __name__ == "__main__":
    main()
