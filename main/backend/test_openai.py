import os
from dotenv import load_dotenv
import openai

load_dotenv()  # load .env file
print("API Key Loaded:", os.environ.get("OPENAI_API_KEY") is not None)

openai.api_key = os.environ.get("OPENAI_API_KEY")

try:
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt="Say hello in one sentence",
        max_tokens=10
    )
    print(response.choices[0].text.strip())
except Exception as e:
    print("Error:", e)