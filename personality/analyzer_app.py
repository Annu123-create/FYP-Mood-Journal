# analyzer_app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk

# --- IMPORTANT: One-Time Setup ---
# You need to download the VADER lexicon for sentiment analysis.
# Run this command in your terminal ONCE:
# python -m nltk.downloader vader_lexicon
# ---------------------------------

from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # This allows your frontend to talk to this backend

# Initialize the VADER sentiment analyzer
sia = SentimentIntensityAnalyzer()

def map_sentiment_to_personality_percentages(sentiment_scores):
    """
    Maps VADER sentiment scores to a simple personality profile in percentages.
    This is a heuristic, not a clinical diagnosis.
    """
    compound_score = sentiment_scores['compound']
    pos_score = sentiment_scores['pos']
    neu_score = sentiment_scores['neu']
    neg_score = sentiment_scores['neg']

    # Map the compound score (-1 to 1) to a 0-100 scale.
    positivity_percentage = ((compound_score + 1) / 2) * 100

    personality_profile = {
        "Extraversion": round(positivity_percentage, 1),
        "Neuroticism": round(100 - positivity_percentage, 1), # Inverse of Extraversion
        "Agreeableness": round(positivity_percentage, 1),      # Similar to Extraversion
        "Conscientiousness": round(neu_score * 100, 1),      # Tied to how neutral the text is
        "Openness": round((pos_score * 100) + 40, 1)         # Base of 40, boosted by positive words
    }

    # Clamp values between 0 and 100 just in case
    for trait in personality_profile:
        personality_profile[trait] = max(0, min(100, personality_profile[trait]))

    return personality_profile

@app.route('/predict', methods=['POST'])
def predict():
    """
    Takes a single text, analyzes its sentiment, and returns a personality profile.
    (Kept for backward compatibility or manual testing)
    """
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text_to_analyze = data['text']
        sentiment_scores = sia.polarity_scores(text_to_analyze)
        personality = map_sentiment_to_personality_percentages(sentiment_scores)
        
        response = {
            "input_text": text_to_analyze,
            "sentiment": sentiment_scores,
            "personality_profile": personality
        }
        
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# --- NEW ENDPOINT FOR AUTOMATIC ANALYSIS ---
@app.route('/analyze_entries', methods=['POST'])
def analyze_entries():
    """
    Takes a list of journal entries, combines them, and returns a personality profile.
    """
    try:
        data = request.json
        if not data or 'entries' not in data:
            return jsonify({"error": "Missing 'entries' field in request"}), 400
        
        entries = data['entries']
        if not isinstance(entries, list) or not entries:
            return jsonify({"error": "'entries' must be a non-empty list of strings"}), 400

        # Combine all entries into a single large text for analysis
        combined_text = " ".join(entries)
        
        if not combined_text.strip():
            return jsonify({"error": "Provided entries contain no text to analyze."}), 400

        # Perform Sentiment Analysis on the combined text
        sentiment_scores = sia.polarity_scores(combined_text)
        
        # Map the sentiment to a personality profile with percentages
        personality = map_sentiment_to_personality_percentages(sentiment_scores)
        
        # Return the results
        response = {
            "analyzed_entry_count": len(entries),
            "sentiment": sentiment_scores,
            "personality_profile": personality
        }
        
        return jsonify(response)

    except Exception as e:
        # If anything goes wrong, return a server error
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)