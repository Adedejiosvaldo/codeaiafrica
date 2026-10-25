# Phase 1 build specs

## Name

The recommendation is **Akada Labs**. "Akada" is Nigerian slang for a bookish, studious person. It's memorable, it's Nigerian without belonging to one language group, and it makes AI sound like something you learn rather than something you buy.

Web searches on 25 Oct 2026 found no AI or education organisation using any of these names. That isn't proof of availability: run the CAC name search, then check the domain and social handles before committing.

| Name | Meaning | Web check | Notes |
| --- | --- | --- | --- |
| **Akada Labs** | Nigerian slang: a bookish, studious person | No organisation found | Recommended. Playful and pan-Nigerian |
| Ilimi Labs | Hausa: knowledge | No organisation found | Strong meaning; less familiar in Lagos |
| Ogbon Labs | Yoruba: wisdom | No organisation found | Strong meaning; reads as Yoruba-specific |
| OpenTab Africa | Learning in an open browser tab | Taken: several "OpenTab" projects and extensions exist | Dropped |

For CAC, the registered form would be "The Incorporated Trustees of Akada Labs Initiative" or similar. The public brand stays **Akada Labs**.

- [ ] Run the CAC name search for Akada Labs plus 2 backups
- [ ] Check akadalabs.org / .com.ng / .africa availability
- [ ] Check @akadalabs on X, LinkedIn, Instagram and GitHub

## Datasets

Six datasets cover every notebook, all free to download. The four for weeks 2–5 get trimmed to small CSVs (under 2 MB) and bundled into the JupyterLite site. Weeks 6–10 load data inside Kaggle, where size isn't a problem.

| Week | Dataset | What's in it | Licence | Trim to |
| --- | --- | --- | --- | --- |
| 2 | [sensors.AFRICA air quality archive, Lagos](https://www.openafrica.net/dataset/sensorsafrica-airquality-archive-lagos/resource/ae8d2f72-6514-4cfd-92d4-4ad5e097cdd9) | Particulate matter, temperature and humidity readings from low-cost sensors | CC BY | One month, a few hundred rows |
| 3, 10 | [World Bank monthly food price estimates, Nigeria](https://microdata.worldbank.org/catalog/4503/data-dictionary) | Monthly prices by product and market, 73 markets, 2007 to Mar 2026 | Check World Bank terms on download | Rice, beans, maize, garri in 10 markets, 2020 onward |
| 4 | [Lagos rent prices 2022](https://open.africa/dataset/cost-of-housing-in-lagos) (from Kaggle) | Rents with location and property details | CC BY | Clean columns; label each listing affordable or expensive |
| 5 | [NaijaSenti](https://huggingface.co/datasets/HausaNLP/NaijaSenti-Twitter/blob/main/README.md) | About 30,000 labelled tweets per language in Hausa, Igbo, Pidgin and Yorùbá | Check the licence on the dataset card; related NaijaSenti files are CC BY-NC-SA | 2,000 Pidgin tweets plus 2,000 English-like tweets |
| 6 | Cassava leaf disease photos (Kaggle, from Makerere University's AI lab; to locate and verify) | Labelled photos of healthy and diseased cassava leaves | Check competition rules on Kaggle | 2 classes, about 1,000 images |
| 8–9 | A public Nigerian document, for example the Nigeria Data Protection Act 2023 (to choose and download) | Plain legal text, good for search and Q&A | Public law text | The full text, split into chunks in the notebook |

The licence checks are open tasks. A non-commercial licence is fine for the NGO but would need revisiting before any paid tier uses the same material.

- [ ] Download and trim the weeks 2–5 datasets, and commit the CSVs to the site repo with a README crediting each source
- [ ] Locate the cassava dataset on Kaggle and confirm its rules allow teaching use
- [ ] Pick the week 8–9 document and save a clean text copy

## Lead magnet: "Train your first AI in 10 minutes"

The lead magnet is a single web page where someone trains a working image classifier in their browser in 10 minutes, then gets one clear prompt to apply. It ships in November and drives all the build-in-public posts.

**Who it's for:** someone curious about AI who has never coded and assumes they'd need an expensive laptop.

**What they do**

1. Open the page on a laptop or phone. One sentence explains what they're about to do.
2. A 90-second video (or GIF) shows the whole thing once.
3. They open Teachable Machine (Image Project) in a new tab, make 2 classes (for example "Naira note" and "Not money", or "Ripe plantain" and "Unripe plantain") and capture about 30 webcam photos for each.
4. They click Train, then test it live with the webcam.
5. They come back to the page for the "what just happened" explanation: 3 short paragraphs on examples, patterns and predictions, and why their model sometimes gets it wrong.
6. The page asks them to post a screenshot or clip of their model and tag Akada Labs. Their post becomes your marketing.

**The call to action:** "That took 10 minutes. In 12 weeks you'll build and deploy an AI tool that solves a real Nigerian problem, with nothing installed. 40 places, free. Applications close on \[date\]." Then the application button. Before applications open in January, the button collects emails for a waitlist.

**Done when:** a non-technical friend completes it in 10 minutes or less with no help, and it works on a mid-range Android phone browser.

Open question: Teachable Machine needs a webcam and internet. Test it on a mid-range Android phone before launch; if it struggles, the phone version uses uploaded photos instead.

## Notebook specs: weeks 2–5

Each JupyterLite notebook follows the same shape: a short explanation cell, a worked example, 4–6 exercises, and a self-check cell after each exercise that prints PASS or a hint. The last cell prints a completion code the learner pastes into the submission form.

**Notebook 1 (week 2): Python in the browser.** Dataset: Lagos air quality, trimmed.

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Store a reading in variables and print a sentence about it | Variables exist with the right types |
| 2 | Put a week of temperature readings in a list and find the max and average | Returned values match the expected numbers |
| 3 | Loop over readings and label each "good" or "poor" air with an if statement | Label list matches the expected list |
| 4 | Write a function `air_label(pm25)` | Function returns correct labels on 5 hidden test values |
| 5 | Load the CSV with one given line, count the poor-air hours | Count matches |

**Notebook 2 (week 3): Working with data.** Dataset: World Bank food prices, trimmed.

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Load the CSV with pandas; show shape, columns and first rows | Data frame loaded with the expected shape |
| 2 | Filter to rice in one market | Row count matches |
| 3 | Find the month rice was most expensive | Correct month returned |
| 4 | Compare average prices across markets with groupby | Values match within rounding |
| 5 | Plot rice price over time for 2 markets | A figure with 2 lines exists |
| 6 | Write 2 sentences: what does the chart show? | Free text, reviewed by TAs |

**Notebook 3 (week 4): Your first ML model.** Dataset: Lagos rents, labelled affordable or expensive.

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Pick features (bedrooms, area, property type) and the label | X and y have the right shapes |
| 2 | Split into train and test sets | Split sizes are correct |
| 3 | Train a decision tree with scikit-learn | Model is fitted |
| 4 | Score it on the test set | Accuracy is above a set floor |
| 5 | Predict 3 listings they make up | 3 predictions returned |
| 6 | Explain which feature mattered most | Feature importance printed; free text reviewed |

**Notebook 4 (week 5): When models go wrong.** Dataset: NaijaSenti, Pidgin plus English-like tweets.

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Train a simple sentiment classifier on English-like tweets only | Model is fitted |
| 2 | Test it on English-like tweets, then on Pidgin tweets | Both accuracies printed; Pidgin is noticeably lower |
| 3 | Retrain with Pidgin included and compare | New Pidgin accuracy is higher |
| 4 | Make a skewed dataset (90% one label) and show accuracy can mislead | Learner shows a majority-guess baseline scoring high |
| 5 | Write 3 sentences: who gets hurt when a model ignores Pidgin speakers? | Free text, reviewed by TAs |

Notebook 4 is the heart of the course: learners see bias happen to their own language, not just read about it.

Check before building notebook 4: scikit-learn text vectorisers must run fast enough in Pyodide on 4,000 tweets. If not, trim to 1,000.

## Notebook specs: weeks 6–11

Weeks 6–11 run on Kaggle or Colab, because they need a GPU or network calls. Each starter notebook opens in one click, keeps the same self-check pattern, and never asks learners to paste API keys into a cell: keys live in Kaggle or Colab secrets.

**Week 6: Neural networks (Kaggle, GPU).** Dataset: cassava leaves, 2 classes.

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Code a forward pass of a 2-layer network in NumPy on 4 numbers | Output shape and values match |
| 2 | Compute the loss and take one gradient step by hand | Loss goes down |
| 3 | Load the cassava subset and view a batch | Image and label counts match |
| 4 | Fine-tune a small pretrained image model for 2 epochs on the GPU | Test accuracy is above a set floor |
| 5 | Show 5 wrong predictions and explain why the model missed them | Free text, reviewed by TAs |

**Week 7: LLMs through an API.**

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Store the key in secrets and make a first call to Groq or Gemini | A reply comes back |
| 2 | Change the system prompt and temperature, and compare outputs | Two different outputs printed |
| 3 | Extract name, amount and date from a Nigerian bank SMS alert as JSON | JSON parses and has the 3 fields |
| 4 | Handle a failed call (bad key, rate limit) without crashing | Error is caught and reported |

**Week 8: Embeddings and semantic search.**

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Embed 20 sentences and compute cosine similarity | Similarity matrix has the right shape |
| 2 | Find the most similar pairs | Expected pairs are found |
| 3 | Build a search over about 200 chunks of the chosen document | Top result is correct for 3 hidden queries |
| 4 | Compare with keyword search on a Pidgin question | Free text, reviewed by TAs |

**Week 9: RAG.** Learners also pick their capstone brief this week.

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Split the document into chunks | Chunk count and sizes are within range |
| 2 | Embed the chunks into a simple in-memory index | Index holds every chunk |
| 3 | Retrieve the top 3 chunks for a question | The expected section is among them |
| 4 | Generate an answer that cites the chunks it used | Answer cites at least one retrieved chunk |
| 5 | Find a question it gets wrong and explain why | Free text, reviewed by TAs |

**Week 10: Agents and tool use.**

| Exercise | Learner does | Self-check tests |
| --- | --- | --- |
| 1 | Write 2 tools: a food-price lookup and a calculator | Tools return correct values on test inputs |
| 2 | Build a function-calling loop with Groq or Gemini | The price tool is called for a price question |
| 3 | Add a maximum-steps guard | The loop stops at the limit |
| 4 | Log each step the agent takes | A step-by-step trace is printed |

**Week 11: Ship it.** Learners wrap their capstone in a Gradio interface and deploy it free on Hugging Face Spaces, with the API key stored as a Space secret. Done when the public link works for someone else.

**Capstone briefs** (or learners propose their own):

| Brief | What it does | Builds on |
| --- | --- | --- |
| Pidgin sentiment checker | Labels customer messages as positive, negative or neutral, in Pidgin or English | Weeks 5 and 7 |
| Market price agent | Answers "how has rice price changed in Kano?" by calling a price tool | Weeks 3 and 10 |
| Ask-the-law bot | Answers questions about the chosen Nigerian document, with citations | Weeks 8 and 9 |
| Bank alert parser | Turns pasted SMS alerts into a spending table | Week 7 |

## Application form and selection rubric

The form takes 5 minutes and measures commitment, not credentials. It's a Google Form linked from the landing page.

**Questions**

1. Name, email, WhatsApp number
2. Age: confirm you are 18 or older
3. City and country
4. What best describes you? (university student / working / looking for work / other)
5. Which device will you use? (own laptop / shared or family laptop / cyber café / phone only)
6. Can you attend a live 60-minute session on Saturday mornings for 12 weeks? (yes / most weeks / no)
7. How many hours a week can you give to labs? (under 2 / 2–4 / over 4)
8. Have you written any code before? (never / a little / yes)
9. In one or two sentences: what problem would you like to solve with AI?
10. Will you commit to submitting 9 of the 12 labs? (yes / no)

**Scoring (out of 10)**

| Criterion | Points |
| --- | --- |
| Can attend live sessions (Q6): yes 3, most weeks 2, no 0 | up to 3 |
| Lab hours (Q7): 2 hours or more = 2, under 2 = 0 | up to 2 |
| Device (Q5): laptop of any kind 2, café 1, phone only 0 | up to 2 |
| Answer to Q9 is specific and their own | up to 3 |

Rules: answering "no" to Q2 or Q10 means not accepted. Prior coding (Q8) is not scored, because the course is for beginners. Accept from the top score down until the cap is reached, and keep the next 10 as a waitlist for anyone who drops out in week 1.

## Pre/post quiz

The same 20 multiple-choice questions run in week 1 and week 12 as a Google Form quiz with auto-grading. Each question is worth 5 points, for a score out of 100.

| # | Question | Correct answer |
| --- | --- | --- |
| 1 | A machine learning model learns mainly from… (rules a programmer writes / examples in data / the internet live) | Examples in data |
| 2 | Your model is 95% accurate on its training data and 60% on new data. What's happening? (overfitting / underfitting / perfect model) | Overfitting |
| 3 | Why do we keep a test set separate? (to train faster / to check the model on data it hasn't seen / to save memory) | To check it on unseen data |
| 4 | In Python, what does `len([3, 5, 7])` return? (3 / 7 / 15) | 3 |
| 5 | In pandas, which line shows the first 5 rows? (`df.head()` / `df.first()` / `df.top()`) | `df.head()` |
| 6 | A dataset has 90% "no fraud" rows. A model that always says "no fraud" scores… (10% / 50% / 90%) | 90% |
| 7 | What is a "label" in supervised learning? (the answer the model should predict / a column name / a chart title) | The answer to predict |
| 8 | A sentiment model trained only on English tweets will most likely… (work equally well on Pidgin / do worse on Pidgin / refuse Pidgin) | Do worse on Pidgin |
| 9 | An LLM produces text by… (looking answers up in a database / predicting likely next words / copying websites) | Predicting likely next words |
| 10 | Raising an LLM's temperature makes outputs… (more random / more accurate / shorter) | More random |
| 11 | Where should an API key live? (pasted in a shared notebook / in a secrets manager or environment variable / in the prompt) | Secrets manager or environment variable |
| 12 | A chatbot confidently gives a wrong fact. This is called… (a hallucination / a bug in Python / overfitting) | A hallucination |
| 13 | Which is a classification task? (predict a house price / sort messages into spam and not spam / forecast next month's rainfall) | Spam vs not spam |
| 14 | A decision tree's feature importance tells you… (which inputs most affected its predictions / how fast it trained / its accuracy) | Which inputs mattered most |
| 15 | Which best reduces bias against a group? (more data from that group / a bigger model only / training for longer) | More data from that group |

Questions 16–20 cover weeks 6–11:

| # | Question | Correct answer |
| --- | --- | --- |
| 16 | Training a neural network means… (adjusting weights to reduce loss / writing more if statements / adding layers until it works) | Adjusting weights to reduce loss |
| 17 | An embedding is… (a list of numbers that represents meaning / a compressed file / an API key) | A list of numbers that represents meaning |
| 18 | In RAG, the retrieval step… (finds relevant text to give the LLM / retrains the LLM / deletes old data) | Finds relevant text to give the LLM |
| 19 | Why split documents into chunks for RAG? (so retrieval returns focused passages that fit the prompt / to encrypt them / to save disk space) | So retrieval returns focused passages |
| 20 | In a tool-using agent, the LLM… (decides which function to call and with what inputs / runs the Python itself / replaces the database) | Decides which function to call and with what inputs |

Also ask 3 confidence questions (1–5 scale) before and after: "I can explain what AI is", "I can write Python to analyse data", "I could build a small AI tool".

## Demo day format

Demo day is the 12th session, 90 minutes online on 24 Apr 2027, open to the public. It doubles as your best piece of marketing for cohort 2 and your best evidence for funders.

| Block | Minutes | What happens |
| --- | --- | --- |
| Welcome | 5 | What the cohort did, in numbers |
| Demos | 60 | Each learner or pair: 3 minutes to show their deployed tool live, plus 1 minute of questions |
| Guest remarks | 10 | One invited guest: an AI practitioner, a funder, or a partner community lead |
| Certificates and next steps | 10 | Certificates, the school-phase volunteer call, cohort 2 waitlist |
| Buffer | 5 | For connection problems |

At about 4 minutes per demo, 60 minutes fits 15 demos. If more than 15 learners finish, run demos in pairs or record the rest and post them.

Record the whole session (with permission) and cut 3–5 clips for LinkedIn and X the same week.

## Sources

Checked 25 Oct 2026.

- [sensors.AFRICA air quality archive, Lagos (openAFRICA)](https://www.openafrica.net/dataset/sensorsafrica-airquality-archive-lagos/resource/ae8d2f72-6514-4cfd-92d4-4ad5e097cdd9)
- [World Bank: monthly food price estimates, Nigeria](https://microdata.worldbank.org/catalog/4503/data-dictionary)
- [openAFRICA: Cost of housing in Lagos](https://open.africa/dataset/cost-of-housing-in-lagos)
- [NaijaSenti dataset card (Hugging Face)](https://huggingface.co/datasets/HausaNLP/NaijaSenti-Twitter/blob/main/README.md)
- [NaijaSenti stopwords card, showing CC BY-NC-SA](https://huggingface.co/datasets/HausaNLP/Naija-Stopwords/blob/main/README.md)
- [OpenTab Community (GitHub)](https://github.com/OpenTabCommunity), showing the OpenTab name in use
