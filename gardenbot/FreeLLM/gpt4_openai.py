import requests

class GPT4OpenAI:
    def __init__(self, model="gpt-4", endpoint="https://api.gpt4free.net/v1/chat/completions"):
        self.model = model
        self.endpoint = endpoint

    def chat(self, messages):
        payload = {
            "model": self.model,
            "messages": messages
        }
        response = requests.post(self.endpoint, json=payload)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            return f"Error: {response.status_code} - {response.text}"
