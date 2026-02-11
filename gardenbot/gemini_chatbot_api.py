from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

# ✅ Initialize Flask app
app = Flask(__name__)
CORS(app)

# ✅ Configure Gemini API key
genai.configure(api_key="AIzaSyBNlLBhEPmfJAlh45PQyX3Hfvy7Yt6rdv8")

# ✅ Load Gemini model
model = genai.GenerativeModel("gemini-2.5-flash")

# ✅ Home route for testing
@app.route('/')
def home():
    return "✅ Gemini Chat API is running and ready to chat!"

# ✅ Chat route for POST requests
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json(force=True)
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        response = model.generate_content(user_message)
        return jsonify({"reply": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Run Flask app
if __name__ == '__main__':
    print("✅ Gemini Chat API is running on http://127.0.0.1:5001")
    app.run(host="0.0.0.0", port=5001)
