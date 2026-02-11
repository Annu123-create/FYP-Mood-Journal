import google.generativeai as genai

# 🔑 Your Gemini API key here
API_KEY = "AIzaSyDET40q1Or82TwYqseUdbNHl02Hp_9kmxo"

# ✅ Configure API
genai.configure(api_key=API_KEY)

# ✅ Use a currently available model
model = genai.GenerativeModel("gemini-2.5-flash")


# 🧾 Generate a reply
response = model.generate_content("Hello Gemini! How are you?")

print(response.text)
