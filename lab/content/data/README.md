# Lab data

The week 2-5 notebooks read these files. Each is trimmed from a free public
dataset by a script in `scripts/`, and kept under 2 MB so the browser lab
loads fast on a phone connection.

| File | Week | Source | Licence | Made by |
| --- | --- | --- | --- | --- |
| `lagos_air_quality.csv` | 2 | [sensors.AFRICA air quality archive, Lagos](https://www.openafrica.net/dataset/sensorsafrica-airquality-archive-lagos) (openAFRICA) | CC BY | `scripts/trim_air_quality.py` |
| `nigeria_food_prices.csv` | 3, 10 | [World Bank: Monthly food price estimates by product and market, Nigeria](https://microdata.worldbank.org/catalog/4503) | World Bank terms of use (check on download) | `scripts/trim_food_prices.py` |
| `lagos_rent.csv` | 4 | [Cost of housing in Lagos](https://open.africa/dataset/cost-of-housing-in-lagos) (openAFRICA, from Kaggle "Lagos rent prices 2022") | CC BY | `scripts/trim_lagos_rent.py` |
| `naijasenti_pcm_en.csv` | 5 | [NaijaSenti](https://huggingface.co/datasets/HausaNLP/NaijaSenti-Twitter) (Muhammad et al., HausaNLP) | Check the dataset card; related files are CC BY-NC-SA | `scripts/trim_naijasenti.py` |

## Columns the notebooks expect

- `lagos_air_quality.csv`: `timestamp, pm25, pm10, temperature, humidity` (one row per hour)
- `nigeria_food_prices.csv`: `date, market, state, commodity, price` (commodity is one of rice, beans, maize, garri)
- `lagos_rent.csv`: `bedrooms, bathrooms, toilets, area, property_type, price, label` (label is affordable or expensive)
- `naijasenti_pcm_en.csv`: `text, label, variety` (label is positive or negative; variety is english_like or pidgin)

## Credit

When you share these labs, credit sensors.AFRICA / Code for Africa, the World Bank,
the original Kaggle uploader of the Lagos rent data, and the NaijaSenti authors.
A non-commercial licence (NaijaSenti) is fine for the free course but must be
revisited before any paid course reuses the data.
