"""Week 5 data: Pidgin and English-like tweets from NaijaSenti.

Source: NaijaSenti (HausaNLP/NaijaSenti-Twitter on Hugging Face). Check
the licence on the dataset card before use; related NaijaSenti files are
CC BY-NC-SA, which is fine for a free course.

Download the Pidgin ("pcm") train, dev and test files, then run:

    python scripts/trim_naijasenti.py raw/pcm_train.tsv raw/pcm_dev.tsv raw/pcm_test.tsv

NaijaSenti has no separate English set, so this script splits the Pidgin
tweets by how English they look: the share of words found in a list of
common English words, minus the share of common Pidgin words. The most
English-looking tweets become "english_like", the least become "pidgin".
Read a sample of each before shipping: the split is a heuristic.

Output: lab/content/data/naijasenti_pcm_en.csv with columns text, label, variety.
Only positive and negative tweets are kept.
"""
import argparse
import re
from pathlib import Path

import pandas as pd

from _common import find_column, read_table, report

OUT = Path(__file__).resolve().parents[1] / "lab" / "content" / "data" / "naijasenti_pcm_en.csv"

ENGLISH = set("""
a about after again all also always am an and any are as at back be because been before being best better
big both but by came can come could day did do does doing done down each even every family feel few first
for friend from get give go going good got great had happy has have having he her here him his home how i
if in into is it its just know last life like little long look love made make man many me more most much
must my need never new next no not nothing now of off old on once one only or other our out over people
please really right said same say see she should since so some still such sure take than thank thanks that
the their them then there these they thing think this those though time to today too two under until up
us very want was way we week well were what when where which while who why will with without work would
year yes yet you your bad sad hate angry terrible worst awful wrong sorry poor problem enjoy nice amazing
wonderful beautiful excited glad fun win won lost lose hope pain tired sick
""".split())

PIDGIN = set("""
dey na wetin abeg una wey don sef sha abi oga wahala pikin comot dem dis dat wan sabi chop gist o oo ooo
make bin don go fit no be naija una e im am wan kuku joor jare shey shebi ehn ehen kpele omo gbege yeye
waka ginger mumu ode werey ashawo wayo palava kasala kolo jor nawa haba choi ah eh
""".split())


def clean(text):
    text = re.sub(r"https?://\S+", "", str(text))
    text = re.sub(r"@\w+", "@user", text)
    return re.sub(r"\s+", " ", text).strip()


def english_score(text):
    words = re.findall(r"[a-z']+", text.lower())
    if not words:
        return 0.0
    en = sum(w in ENGLISH for w in words) / len(words)
    pcm = sum(w in PIDGIN for w in words) / len(words)
    return en - pcm


def take_balanced(df, n):
    """Up to n tweets, split as evenly as possible between labels."""
    parts = []
    per_label = n // 2
    for label in ["positive", "negative"]:
        group = df[df["label"] == label]
        parts.append(group.head(per_label))
    picked = pd.concat(parts)
    if len(picked) < n:  # top up from whichever label has spare tweets
        rest = df.drop(picked.index)
        picked = pd.concat([picked, rest.head(n - len(picked))])
    return picked


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="+")
    parser.add_argument("--per-variety", type=int, default=2000)
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()

    raw = pd.concat([read_table(f) for f in args.files], ignore_index=True)
    text = find_column(raw, None, ["tweet", "text"])
    label = find_column(raw, None, ["label", "sentiment"])
    df = pd.DataFrame({"text": raw[text].map(clean), "label": raw[label].astype(str).str.lower().str.strip()})
    # Some versions store labels as 0/1/2
    df["label"] = df["label"].replace({"0": "positive", "1": "neutral", "2": "negative"})
    df = df[df["label"].isin(["positive", "negative"])]
    df = df[df["text"].str.split().str.len() >= 3].drop_duplicates("text")

    df["score"] = df["text"].map(english_score)
    df = df.sort_values("score", ascending=False)
    n = min(args.per_variety, len(df) // 2)
    english_like = take_balanced(df.head(len(df) // 2), n).assign(variety="english_like")
    pidgin = take_balanced(df.tail(len(df) // 2).iloc[::-1], n).assign(variety="pidgin")

    out = pd.concat([english_like, pidgin])[["text", "label", "variety"]]
    out = out.sample(frac=1, random_state=42)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.out, index=False)
    report(out, args.out)
    print(out.groupby(["variety", "label"]).size().to_string())
    print("\nSample english_like:", *english_like["text"].head(3), sep="\n  ")
    print("Sample pidgin:", *pidgin["text"].head(3), sep="\n  ")


if __name__ == "__main__":
    main()
