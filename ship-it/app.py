"""Week 11 starter: put your capstone on the web with Gradio.

Runs on Hugging Face Spaces for free. Your API key lives in the Space's
settings as a secret called GROQ_API_KEY (or GEMINI_API_KEY), never in this file.
"""
import os

import gradio as gr
from openai import OpenAI

PROVIDERS = {
    "groq": ("GROQ_API_KEY", "https://api.groq.com/openai/v1", "llama-3.1-8b-instant"),
    "gemini": ("GEMINI_API_KEY", "https://generativelanguage.googleapis.com/v1beta/openai/", "gemini-2.5-flash"),
}
PROVIDER = os.environ.get("PROVIDER", "groq")
SECRET_NAME, BASE_URL, MODEL = PROVIDERS[PROVIDER]
client = OpenAI(api_key=os.environ.get(SECRET_NAME, "missing"), base_url=BASE_URL)

# Change this to describe your tool
SYSTEM = (
    "You label customer messages, in Nigerian Pidgin or English, as positive, negative or neutral. "
    "Reply with the label, then one short reason."
)


def respond(message):
    if not message.strip():
        return "Type a message first."
    if SECRET_NAME not in os.environ:
        return f"The app owner needs to add {SECRET_NAME} in the Space settings."
    try:
        reply = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": message}],
        )
        return reply.choices[0].message.content
    except Exception as error:
        return f"Sorry, something went wrong: {error}"


demo = gr.Interface(
    fn=respond,
    inputs=gr.Textbox(label="Customer message", lines=3, placeholder="Abeg una network don dey vex me since morning"),
    outputs=gr.Textbox(label="Result"),
    title="Pidgin sentiment checker",
    description="Built in the Akada Labs AI course.",
    examples=[["This app sweet die, e dey work well well"], ["My transfer never land since yesterday"]],
    flagging_mode="never",
)

if __name__ == "__main__":
    demo.launch()
