import google.generativeai as genai

# Configure with your API key
genai.configure(api_key="AIzaSyDET40q1Or82TwYqseUdbNHl02Hp_9kmxo")  # replace with your actual key

# Use the latest REST model name
model = genai.GenerativeModel("models/gemini-2.5-pro")



response = model.generate_content("Say hello from Gemini!")

print(response.text)
