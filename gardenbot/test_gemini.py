import google.generativeai as genai

genai.configure(api_key="AIzaSyDET40q1Or82TwYqseUdbNHl02Hp_9kmxo")   # from https://aistudio.google.com/app/apikey

model = genai.GenerativeModel("gemini-1.5-flash")   # or "gemini-1.0-pro"
response = model.generate_content("Say hello from Gemini!")

print(response.text)
