"""Model answers for the week 2-5 notebooks, used by the tests.

Keyed by notebook file, then by the exercise cell's tag.
"""

SOLUTIONS = {
    "week02-python-in-the-browser.ipynb": {
        "exercise-1": 'location = "Yaba"\npm25 = 42.5\nsentence = f"In {location}, PM2.5 is {pm25}"\nprint(sentence)',
        "exercise-2": "temps = [31.2, 30.8, 32.5, 33.1, 29.9, 30.4, 31.7]\nhighest = max(temps)\naverage = sum(temps) / len(temps)",
        "exercise-3": (
            "readings = [12.0, 48.3, 35.0, 61.7, 22.4, 90.1, 30.0]\nlabels = []\n"
            "for r in readings:\n    if r > 35:\n        labels.append('poor')\n    else:\n        labels.append('good')"
        ),
        "exercise-4": "def air_label(pm25):\n    if pm25 > 35:\n        return 'poor'\n    return 'good'",
        "exercise-5": (
            "import pandas as pd\ndf = pd.read_csv('data/lagos_air_quality.csv')\n"
            "poor_hours = 0\nfor v in df['pm25']:\n    if air_label(v) == 'poor':\n        poor_hours += 1"
        ),
    },
    "week03-working-with-data.ipynb": {
        "exercise-1": "df = pd.read_csv('data/nigeria_food_prices.csv', parse_dates=['date'])\nn_rows, n_cols = df.shape\ndf.head()",
        "exercise-2": "rice = df[(df['commodity'] == 'rice') & (df['market'] == MARKET)]",
        "exercise-3": "peak_month = rice.loc[rice['price'].idxmax(), 'date']",
        "exercise-4": "avg_by_market = df[df['commodity'] == 'rice'].groupby('market')['price'].mean()",
        "exercise-5": (
            "fig, ax = plt.subplots(figsize=(8, 4))\n"
            "for m in markets[:2]:\n    r = df[(df['commodity'] == 'rice') & (df['market'] == m)]\n"
            "    ax.plot(r['date'], r['price'], label=m)\nax.legend()"
        ),
        "exercise-6": 'answer = "Rice prices rose steadily in both markets. One market was always a bit dearer than the other."',
    },
    "week04-first-ml-model.ipynb": {
        "exercise-1": "X = pd.get_dummies(df[['bedrooms', 'area', 'property_type']], dtype=int)\ny = df['label']",
        "exercise-2": "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)",
        "exercise-3": "model = DecisionTreeClassifier(max_depth=5, random_state=42)\nmodel.fit(X_train, y_train)",
        "exercise-4": "accuracy = accuracy_score(y_test, model.predict(X_test))",
        "exercise-5": (
            "my_listings = pd.DataFrame({'bedrooms': [1, 3, 5], 'area': ['Yaba', 'Lekki', 'Ikoyi'],"
            " 'property_type': ['Flat', 'Flat', 'Detached Duplex']})\n"
            "my_X = pd.get_dummies(my_listings, dtype=int).reindex(columns=X.columns, fill_value=0)\n"
            "predictions = model.predict(my_X)"
        ),
        "exercise-6": (
            "importances = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False)\n"
            "print(importances.head(5))\nanswer = 'The area mattered most, which matches how rents work in Lagos.'"
        ),
    },
    "week05-when-models-go-wrong.ipynb": {
        "exercise-1": "model = make_pipeline(CountVectorizer(), LogisticRegression(max_iter=1000))\nmodel.fit(train_en['text'], train_en['label'])",
        "exercise-2": (
            "acc_en = accuracy_score(test_en['label'], model.predict(test_en['text']))\n"
            "acc_pcm = accuracy_score(test_pcm['label'], model.predict(test_pcm['text']))"
        ),
        "exercise-3": (
            "both = pd.concat([train_en, train_pcm])\n"
            "model_both = make_pipeline(CountVectorizer(), LogisticRegression(max_iter=1000))\n"
            "model_both.fit(both['text'], both['label'])\n"
            "acc_pcm_new = accuracy_score(test_pcm['label'], model_both.predict(test_pcm['text']))"
        ),
        "exercise-4": (
            "neg = tweets[tweets['label'] == 'negative']\n"
            "pos = tweets[tweets['label'] == 'positive'].sample(len(neg) // 9, random_state=1)\n"
            "skewed = pd.concat([neg, pos])\n"
            "dummy = DummyClassifier(strategy='most_frequent').fit(skewed['text'], skewed['label'])\n"
            "baseline_accuracy = accuracy_score(skewed['label'], dummy.predict(skewed['text']))"
        ),
        "exercise-5": (
            'answer = "Pidgin speakers get their complaints misread and ignored. '
            'The company thinks its customers are happier than they really are. '
            'I would collect labelled Pidgin messages and test on them before launch."'
        ),
    },
}
