import google.generativeai as genai

# ✅ Configure with your Gemini API key
genai.configure(api_key="AIzaSyDET40q1Or82TwYqseUdbNHl02Hp_9kmxo")

# ✅ Load a fast, chat-optimized model
model = genai.GenerativeModel("gemini-2.5-flash")

print("🤖 Gemini Chatbot (type 'exit' to quit)\n")

# ✅ Start the chat loop
chat = model.start_chat(history=[])

while True:
    user_input = input("You: ")

    if user_input.lower() in ["exit", "quit", "bye"]:
        print("Gemini: Goodbye! 👋")
        break

    try:
        response = chat.send_message(user_input)
        print("Gemini:", response.text)
    except Exception as e:
        print("⚠️ Error:", e)
