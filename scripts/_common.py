"""Helpers shared by the trim scripts."""
import sys

import pandas as pd


def read_table(path):
    """Read a CSV or TSV, guessing the separator."""
    return pd.read_csv(path, sep=None, engine="python")


def find_column(df, wanted, candidates, required=True):
    """Return the first column whose lowercase name is in candidates."""
    if wanted:
        if wanted not in df.columns:
            stop(f"column {wanted!r} not found", df)
        return wanted
    lower = {c.lower().strip(): c for c in df.columns}
    for name in candidates:
        if name in lower:
            return lower[name]
    if required:
        stop(f"could not find a column like {candidates}; pass it with a flag", df)
    return None


def stop(message, df=None):
    print(f"Error: {message}", file=sys.stderr)
    if df is not None:
        print("Columns in the file:", list(df.columns), file=sys.stderr)
    sys.exit(1)


def report(df, path):
    size_kb = path.stat().st_size / 1024
    print(f"Wrote {path} ({len(df):,} rows, {size_kb:,.0f} KB)")
    if size_kb > 2048:
        print("Warning: over 2 MB. Trim further so the browser lab loads quickly.")
