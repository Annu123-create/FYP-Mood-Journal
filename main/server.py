import os
import sqlite3
import datetime
import jwt
import hashlib
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests

# --- Load environment variables ---
load_dotenv()

# --- Flask App Setup ---
app = Flask(__name__, static_folder='../public', static_url_path='/')
CORS(app)
SECRET = os.environ.get('MJ_SECRET', 'change_this_secret_123')
DB = os.path.join(os.path.dirname(__file__), 'mood_journal.db')

# --- Database Helper Functions ---
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        createdAt TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        text TEXT,
        mood TEXT,
        sentiment REAL,
        createdAt TEXT
    )''')
    conn.commit()
    conn.close()

def hash_pwd(p):
    return hashlib.sha256(p.encode()).hexdigest()

# --- Authentication Decorator ---
def auth_required(f):
    from functools import wraps
    @wraps(f)
    def inner(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'auth required'}), 401
        token = auth.split(' ', 1)[1]
        try:
            data = jwt.decode(token, SECRET, algorithms=['HS256'])
            request.user = data
            return f(*args, **kwargs)
        except Exception:
            return jsonify({'success': False, 'message': 'invalid token'}), 401
    return inner

# --- Simple Sentiment + Personality Estimators ---
POS_WORDS = set(['happy', 'relieved', 'good', 'better', 'calm', 'hopeful', 'grateful', 'love', 'excited'])
NEG_WORDS = set(['sad', 'depressed', 'anxious', 'angry', 'hopeless', 'worthless', 'tired', 'lonely', 'hate'])

def simple_sentiment(text):
    t = (text or '').lower()
    p = sum(1 for w in POS_WORDS if w in t)
    n = sum(1 for w in NEG_WORDS if w in t)
    return p - n

def estimate_personality(text):
    try:
        response = requests.post(
            "http://127.0.0.1:5002/predict",
            json=text,
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        else:
            return {'error': 'Analyzer error'}
    except Exception as e:
        return {'error': str(e)}


# --- Routes ---
@app.route('/')
def index():
    return app.send_static_file('index.html')
    

@app.route('/api/personality')
@auth_required
def get_personality_api():
    conn = get_db()
    c = conn.cursor()

    # Fetch latest entries for logged-in user
    rows = c.execute(
        'SELECT text FROM entries WHERE user_id=? ORDER BY id DESC LIMIT 20',
        (request.user['id'],)
    ).fetchall()
    conn.close()

    if not rows:
        return jsonify({'success': True, 'personality': None})

    combined_text = ' '.join(r['text'] for r in rows)

    # ---- Integration with external analyzer (port 5002) ----
    try:
        response = requests.post(
            "http://127.0.0.1:5002/predict",
            json=combined_text,
            timeout=15
        )
        if response.status_code == 200:
            traits = response.json()
        else:
            traits = {'error': 'Analyzer failed'}
    except Exception as e:
        traits = {'error': str(e)}

    return jsonify({'success': True, 'personality': traits})




# --- Auth Routes ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email')
    pwd = data.get('password')
    if not email or not pwd:
        return jsonify({'success': False, 'message': 'email & password required'}), 400
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('INSERT INTO users (email,password,createdAt) VALUES (?,?,?)',
                  (email, hash_pwd(pwd), datetime.datetime.utcnow().isoformat()))
        conn.commit()
        user_id = c.lastrowid
        token = jwt.encode({'id': user_id, 'email': email}, SECRET, algorithm='HS256')
        return jsonify({'success': True, 'token': token})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'user exists'}), 409
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    pwd = data.get('password')
    conn = get_db()
    c = conn.cursor()
    user = c.execute('SELECT id,email,password FROM users WHERE email=?', (email,)).fetchone()
    conn.close()
    if not user or hash_pwd(pwd) != user['password']:
        return jsonify({'success': False, 'message': 'invalid'}), 401
    token = jwt.encode({'id': user['id'], 'email': user['email']}, SECRET, algorithm='HS256')
    return jsonify({'success': True, 'token': token})

# --- Journal Entries ---
@app.route('/api/entries', methods=['POST', 'GET'])
@auth_required
def entries():
    conn = get_db()
    c = conn.cursor()

    if request.method == 'POST':
        data = request.get_json() or {}
        text = data.get('text', '')
        mood = data.get('mood', 'neutral')
        sent = simple_sentiment(text)
        c.execute(
            'INSERT INTO entries (user_id,text,mood,sentiment,createdAt) VALUES (?,?,?,?,?)',
            (request.user['id'], text, mood, sent, datetime.datetime.utcnow().isoformat())
        )
        conn.commit()
        eid = c.lastrowid
        row = c.execute(
            'SELECT id,user_id,text,mood,sentiment,createdAt FROM entries WHERE id=?',
            (eid,)
        ).fetchone()
        conn.close()
        return jsonify({'success': True, 'entry': dict(row)})

    # GET
    limit = int(request.args.get('limit', 200))
    rows = c.execute(
        'SELECT id,user_id,text,mood,sentiment,createdAt FROM entries WHERE user_id=? ORDER BY datetime(createdAt) DESC LIMIT ?',
        (request.user['id'], limit)
    ).fetchall()
    conn.close()
    return jsonify({'success': True, 'entries': [dict(r) for r in rows]})
@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
@auth_required
def delete_entry(entry_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM entries WHERE id = ? AND user_id = ?', (entry_id, request.user['id']))
    conn.commit()
    deleted = c.rowcount
    conn.close()

    if deleted:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Entry not found or not yours'}), 404


# --- Weekly Stats ---
@app.route('/api/stats/week')
@auth_required
def stats_week():
    conn = get_db()
    c = conn.cursor()
    since = (datetime.datetime.utcnow() - datetime.timedelta(days=7)).isoformat()
    rows = c.execute('SELECT mood, COUNT(*) as count FROM entries WHERE user_id=? AND createdAt>=? GROUP BY mood',
                     (request.user['id'], since)).fetchall()
    conn.close()
    return jsonify({'success': True, 'stats': [dict(r) for r in rows]})






# --- Text Analyzer ---
@app.route('/api/analyze', methods=['POST'])
@auth_required
def analyze_text():
    data = request.get_json() or {}
    text = data.get('text', '')

    # Run built-in simple sentiment
    sent = simple_sentiment(text)

    # 🔹 Forward text to your trained personality analyzer (port 5002)
    try:
        response = requests.post(
            "http://127.0.0.1:5002/predict",
            json=text,
            timeout=15
        )
        if response.status_code == 200:
            pers = response.json()
        else:
            pers = {'error': 'Analyzer returned non-200 response'}
    except Exception as e:
        pers = {'error': str(e)}

    return jsonify({'success': True, 'sentiment': sent, 'personality': pers})

@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_current_user():
    conn = get_db()
    c = conn.cursor()
    user = c.execute('SELECT id, email, createdAt FROM users WHERE id=?',
                     (request.user['id'],)).fetchone()
    conn.close()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"success": True, "user": dict(user)})


# --- Chatbot (Gemini API Integration) ---
@app.route('/api/chat', methods=['POST'])
@auth_required
def chat_query():
    data = request.get_json() or {}
    message = data.get('message', '')
    if not message:
        return jsonify({'success': False, 'message': 'No message provided'}), 400

    try:
        # Forward message to your local Gemini API
        response = requests.post(
            "http://127.0.0.1:5001/chat",
            json={"message": message},
            timeout=20
        )

        if response.status_code != 200:
            return jsonify({'success': False, 'message': 'Gemini API error'}), 500

        reply = response.json().get('reply', '')
        return jsonify({'success': True, 'reply': reply})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error contacting Gemini: {e}'}), 500
# --- Main Entry Point ---
if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
