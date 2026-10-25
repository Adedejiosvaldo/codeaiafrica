"""Week 2 data: one month of hourly Lagos air quality readings.

Source: sensors.AFRICA air quality archive, Lagos (openAFRICA, CC BY).
Download one or more monthly CSVs from the archive, then run:

    python scripts/trim_air_quality.py raw/lagos_2024_03.csv --month 2024-03

Output: lab/content/data/lagos_air_quality.csv with columns
timestamp, pm25, pm10, temperature, humidity (hourly averages across sensors).
"""
import argparse
from pathlib import Path

import pandas as pd

from _common import find_column, read_table, report, stop

OUT = Path(__file__).resolve().parents[1] / "lab" / "content" / "data" / "lagos_air_quality.csv"

# sensors.AFRICA names: P2 is PM2.5, P1 is PM10
VALUE_NAMES = {"p2": "pm25", "p1": "pm10", "temperature": "temperature", "humidity": "humidity"}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="+")
    parser.add_argument("--month", help="YYYY-MM to keep (default: the month with most readings)")
    parser.add_argument("--sensor-id", help="keep one sensor only")
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()

    raw = pd.concat([read_table(f) for f in args.files], ignore_index=True)
    ts = find_column(raw, None, ["timestamp", "time", "date"])
    if args.sensor_id:
        sid = find_column(raw, None, ["sensor_id", "sensor"])
        raw = raw[raw[sid].astype(str) == args.sensor_id]

    vtype = find_column(raw, None, ["value_type"], required=False)
    if vtype:  # long format: one row per measurement
        raw = raw.assign(_kind=raw[vtype].astype(str).str.lower().map(VALUE_NAMES))
        raw = raw.dropna(subset=["_kind"])
        raw["value"] = pd.to_numeric(raw[find_column(raw, None, ["value"])], errors="coerce")
        raw["_time"] = pd.to_datetime(raw[ts], errors="coerce", utc=True).dt.tz_convert("Africa/Lagos").dt.floor("h")
        hourly = raw.pivot_table(index="_time", columns="_kind", values="value", aggfunc="mean")
    else:  # wide format: already one column per measurement
        rename = {c: VALUE_NAMES[c.lower()] for c in raw.columns if c.lower() in VALUE_NAMES}
        raw = raw.rename(columns=rename)
        raw["_time"] = pd.to_datetime(raw[ts], errors="coerce", utc=True).dt.tz_convert("Africa/Lagos").dt.floor("h")
        hourly = raw.groupby("_time")[[c for c in VALUE_NAMES.values() if c in raw]].mean()

    if "pm25" not in hourly:
        stop("no PM2.5 (P2) readings found", raw)
    hourly = hourly.dropna(subset=["pm25"])
    hourly = hourly[(hourly["pm25"] >= 0) & (hourly["pm25"] < 1000)]  # drop sensor glitches

    months = hourly.index.strftime("%Y-%m")
    month = args.month or months.value_counts().idxmax()
    hourly = hourly[months == month]
    if hourly.empty:
        stop(f"no readings in {month}")

    out = hourly.round(1).reset_index().rename(columns={"_time": "timestamp"})
    out["timestamp"] = out["timestamp"].dt.strftime("%Y-%m-%d %H:%M")
    out = out[["timestamp"] + [c for c in ["pm25", "pm10", "temperature", "humidity"] if c in out]]
    args.out.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False)
    report(out, args.out)
    print(f"Month: {month}. Hours with PM2.5 above 35: {(out['pm25'] > 35).sum()}")


if __name__ == "__main__":
    main()
