from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS

genai.configure(api_key="AIzaSyDET40q1Or82TwYqseUdbNHl02Hp_9kmxo")

model = genai.GenerativeModel("gemini-1.5-flash")
app = Flask(__name__)
CORS(app)

chat = model.start_chat(history=[])

@app.route("/chat", methods=["POST"])
def chat_api():
    data = request.get_json()
    message = data.get("message", "")
    if not message:
        return jsonify({"reply": "No message received."}), 400
    try:
        response = chat.send_message(message)
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"reply": f"Error: {e}"}), 500

if __name__ == "__main__":
    app.run(port=5001, debug=True)
