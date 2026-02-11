import os
import sqlite3
import datetime
import jwt
import hashlib
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth
from flask import session

# --- Load environment variables ---
load_dotenv()

# --- Flask App Setup ---
app = Flask(__name__, static_folder='../public', static_url_path='/')
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for development
SECRET = os.environ.get('MJ_SECRET', 'change_this_secret_123')
DB = os.path.join(os.path.dirname(__file__), 'mood_journal.db')

# --- URL for your separate email service ---
EMAIL_SERVICE_URL = "http://127.0.0.1:3000"

# --- OAuth Setup ---
app.secret_key = SECRET # Required for sessions
oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

facebook = oauth.register(
    name='facebook',
    client_id=os.environ.get('FACEBOOK_APP_ID'),
    client_secret=os.environ.get('FACEBOOK_APP_SECRET'),
    access_token_url='https://graph.facebook.com/v12.0/oauth/access_token',
    access_token_params=None,
    authorize_url='https://www.facebook.com/v12.0/dialog/oauth',
    authorize_params=None,
    api_base_url='https://graph.facebook.com/v12.0/',
    client_kwargs={'scope': 'email'},
)

# --- Database Helper Functions ---
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    # The 'is_verified' column is crucial for the email verification flow
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        is_verified BOOLEAN DEFAULT 0,
        createdAt TEXT
    )''')
    
    # --- Migration: Add new profile columns if they don't exist ---
    existing_cols = [row['name'] for row in c.execute("PRAGMA table_info(users)")]
    new_cols = {
        'avatar': 'TEXT',
        'full_name': 'TEXT',
        'bio': 'TEXT',
        'location': 'TEXT',
        'interests': 'TEXT',  # Stored as JSON string
        'date_of_birth': 'TEXT',
        'oauth_provider': 'TEXT',
        'oauth_id': 'TEXT'
    }
    
    for col, data_type in new_cols.items():
        if col not in existing_cols:
            print(f"Migrating DB: Adding '{col}' column to users table...")
            try:
                c.execute(f"ALTER TABLE users ADD COLUMN {col} {data_type}")
            except Exception as e:
                print(f"Error adding {col}: {e}")

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


# --- Authentication Decorator to check for verification ---
def auth_required(f):
    from functools import wraps
    @wraps(f)
    def inner(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Authorization token required'}), 401
        token = auth.split(' ', 1)[1]
        try:
            data = jwt.decode(token, SECRET, algorithms=['HS256'])
            
            # Check if the user is verified in the main app's database
            conn = get_db()
            c = conn.cursor()
            user = c.execute('SELECT is_verified FROM users WHERE id=?', (data['id'],)).fetchone()
            conn.close()

            if not user or user['is_verified'] == 0:
                return jsonify({'success': False, 'message': 'Email not verified. Please verify your email to continue.'}), 403

            request.user = data
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({'success': False, 'message': 'Invalid or expired token.'}), 401
    return inner

@app.route('/api/auth/me', methods=['GET', 'PUT'])
@auth_required
def handle_me():
    conn = get_db()
    c = conn.cursor()

    if request.method == 'GET':
        user = c.execute('SELECT id, email, is_verified, avatar, full_name, bio, location, interests, date_of_birth, createdAt FROM users WHERE id=?',
                         (request.user['id'],)).fetchone()
        conn.close()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user_dict = dict(user)
        # Parse interests from JSON string if it exists
        import json
        if user_dict.get('interests'):
            try:
                user_dict['interests'] = json.loads(user_dict['interests'])
            except:
                user_dict['interests'] = []
                
        return jsonify({"success": True, "user": user_dict})

    elif request.method == 'PUT':
        data = request.get_json() or {}
        
        # Fields to update
        updates = []
        params = []
        
        # Map frontend keys (camelCase) to DB columns (snake_case)
        field_mapping = {
            'fullName': 'full_name',
            'dateOfBirth': 'date_of_birth',
            'avatar': 'avatar',
            'bio': 'bio',
            'location': 'location'
        }
        
        for frontend_key, db_col in field_mapping.items():
            if frontend_key in data:
                updates.append(f"{db_col} = ?")
                params.append(data[frontend_key])

        # Handle interests specifically (convert list to JSON string)
        if 'interests' in data:
            import json
            updates.append("interests = ?")
            params.append(json.dumps(data['interests']))

        if not updates:
            conn.close()
            return jsonify({"success": False, "message": "No valid fields to update"}), 400

        # Add updated_at if you want track that, but for now just the fields
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        params.append(request.user['id'])
        
        try:
            c.execute(query, tuple(params))
            conn.commit()
            
            # Fetch updated user to return
            updated_user = c.execute('SELECT id, email, is_verified, avatar, full_name, bio, location, interests, date_of_birth, createdAt FROM users WHERE id=?',
                             (request.user['id'],)).fetchone()
            conn.close()
            
            user_dict = dict(updated_user)
            if user_dict.get('interests'):
                try:
                    user_dict['interests'] = json.loads(user_dict['interests'])
                except:
                    user_dict['interests'] = []

            return jsonify({"success": True, "message": "Profile updated", "user": user_dict})
            
        except Exception as e:
            conn.close()
            print(f"Error updating profile: {e}")
            return jsonify({"success": False, "message": "Database error during update"}), 500



def hash_pwd(p):
    # In a production app, consider using a stronger hashing algorithm like bcrypt
    return hashlib.sha256(p.encode()).hexdigest()

# --- Simple Sentiment + Personality Estimators ---
POS_WORDS = set(['happy', 'relieved', 'good', 'better', 'calm', 'hopeful', 'grateful', 'love', 'excited'])
NEG_WORDS = set(['sad', 'depressed', 'anxious', 'angry', 'hopeless', 'worthless', 'tired', 'lonely', 'hate'])

def simple_sentiment(text):
    t = (text or '').lower()
    p = sum(1 for w in POS_WORDS if w in t)
    n = sum(1 for w in NEG_WORDS if w in t)
    return p - n

def gemini_sentiment(text):
    """Fallback to simple sentiment estimator."""
    return float(simple_sentiment(text))

# Function to call the new personality analyzer
def estimate_personality(text):
    try:
        response = requests.post(
            "http://127.0.0.1:5003/predict",
            json={"text": text},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        else:
            return {'error': 'Analyzer error'}
    except Exception as e:
        return {'error': str(e)}

# Function to analyze multiple entries with the new analyzer
def analyze_entries(entries):
    try:
        response = requests.post(
            "http://127.0.0.1:5003/analyze_entries",
            json={"entries": entries},
            timeout=15
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

    rows = c.execute(
        'SELECT text FROM entries WHERE user_id=? ORDER BY id DESC LIMIT 20',
        (request.user['id'],)
    ).fetchall()
    conn.close()

    if not rows:
        return jsonify({'success': True, 'personality': None})

    entries = [r['text'] for r in rows]
    personality = analyze_entries(entries)
    
    return jsonify({'success': True, 'personality': personality.get('personality_profile')})

# --- Auth Routes ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email')
    pwd = data.get('password')
    if not email or not pwd:
        return jsonify({'success': False, 'message': 'Email & password are required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    try:
        # Create user with is_verified set to 0 (false)
        c.execute(
            'INSERT INTO users (email, password, is_verified, createdAt) VALUES (?,?,?,?)',
            (email, hash_pwd(pwd), 0, datetime.datetime.utcnow().isoformat())
        )
        conn.commit()
        
        # Call the separate Node.js email service to send the verification code
        try:
            response = requests.post(
                f"{EMAIL_SERVICE_URL}/send-verification-code",
                json={"email": email},
                timeout=10
            )
            response.raise_for_status()

            return jsonify({
                'success': True,
                'message': 'Account created. Please check your email to verify your account.'
            })

        except requests.exceptions.RequestException as e:
            # If the email service fails, we have a user who can't verify.
            print(f"Error calling email service: {e}")
            return jsonify({'success': False, 'message': 'Failed to send verification email. Please try again.'}), 500

    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'An account with this email already exists.'}), 409
    finally:
        conn.close()

@app.route('/api/auth/request-reset', methods=['POST'])
def request_reset():
    data = request.get_json() or {}
    email = data.get('email')

    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400

    # Call Node.js email service
    try:
        response = requests.post(
            f"{EMAIL_SERVICE_URL}/send-password-reset",
            json={"email": email},
            timeout=10
        )
        response.raise_for_status()
        return jsonify({'success': True, 'message': 'Reset code sent to email'})
    except Exception as e:
        print(f"Email service error: {e}")
        return jsonify({'success': False, 'message': f'Failed to send reset email: {str(e)}'}), 500

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('password')

    print(f"Reset request received: email={email}, code={code}, password_length={len(new_password) if new_password else 0}")
    
    if not email or not code or not new_password:
        print("Missing required parameters")
        return jsonify({'success': False, 'message': 'Email, code, and new password required'}), 400

    # Validate code via email service
    try:
        print(f"Calling email service at {EMAIL_SERVICE_URL}/verify-password-reset")
        response = requests.post(
            f"{EMAIL_SERVICE_URL}/verify-password-reset",
            json={"email": email, "code": code},
            timeout=30
        )
        print(f"Email service response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Email service returned non-200 status: {response.status_code}")
            print(f"Email service response: {response.text}")
            return jsonify({'success': False, 'message': 'Invalid reset code'}), 400

        result = response.json()
        print(f"Email service result: {result}")

        if not result.get('success'):
            print(f"Email service validation failed for code: {code}")
            return jsonify({'success': False, 'message': 'Invalid reset code'}), 400

        # Update password in database
        conn = get_db()
        c = conn.cursor()
        c.execute('UPDATE users SET password=? WHERE email=?', (hash_pwd(new_password), email))
        conn.commit()
        conn.close()
        
        print("Password updated successfully in database")
        return jsonify({'success': True, 'message': 'Password updated successfully'})

    except requests.exceptions.RequestException as e:
        print(f"Email service connection error: {e}")
        return jsonify({'success': False, 'message': 'Reset service error'}), 500
    except Exception as e:
        print(f"Unexpected error in reset_password: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Reset service error'}), 500
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    pwd = data.get('password')
    conn = get_db()
    c = conn.cursor()
    user = c.execute('SELECT id,email,password,is_verified FROM users WHERE email=?', (email,)).fetchone()
    conn.close()
    
    if not user or hash_pwd(pwd) != user['password']:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
    # Check if user is verified before allowing login
    if user['is_verified'] == 0:
        return jsonify({'success': False, 'message': 'Please verify your email before logging in.'}), 403
        
    token = jwt.encode({'id': user['id'], 'email': user['email']}, SECRET, algorithm='HS256')
    return jsonify({'success': True, 'token': token})

@app.route('/api/auth/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json() or {}
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({'success': False, 'message': 'Email and verification code are required.'}), 400

    # 1. Call the Node.js email service to validate the code
    try:
        response = requests.post(
            f"{EMAIL_SERVICE_URL}/verify-code",
            json={"email": email, "code": code},
            timeout=10
        )
        response.raise_for_status()
        result = response.json()

        # 2. If the Node.js service says the code is valid...
        if result.get('success'):
            # ...update the user's status in the Flask app's database
            conn = get_db()
            c = conn.cursor()
            c.execute('UPDATE users SET is_verified=1 WHERE email=?', (email,))
            conn.commit()
            
            # Fetch the user to create a token for them
            user = c.execute('SELECT id, email FROM users WHERE email=?', (email,)).fetchone()
            conn.close()

            if user:
                # 3. Log the user in by generating a JWT
                token = jwt.encode({'id': user['id'], 'email': user['email']}, SECRET, algorithm='HS256')
                return jsonify({
                    'success': True,
                    'message': 'Email verified successfully!',
                    'token': token
                })
            else:
                return jsonify({'success': False, 'message': 'User not found after verification.'}), 404
        else:
            # If the code is invalid, return the error from the service
            return jsonify({'success': False, 'message': result.get('message', 'Verification failed')}), 400

    except requests.exceptions.RequestException as e:
        print(f"Error calling email service: {e}")
        return jsonify({'success': False, 'message': 'Could not connect to verification service.'}), 500

@app.route('/api/auth/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json() or {}
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required.'}), 400
        
    conn = get_db()
    c = conn.cursor()
    user = c.execute('SELECT id, is_verified FROM users WHERE email=?', (email,)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'success': False, 'message': 'No account found with this email.'}), 404
        
    if user['is_verified'] == 1:
        return jsonify({'success': False, 'message': 'This account is already verified.'}), 400
        
    # Call the email service to resend the verification code
    try:
        response = requests.post(
            f"{EMAIL_SERVICE_URL}/send-verification-code",
            json={"email": email},
            timeout=10
        )
        response.raise_for_status()
        
        return jsonify({
            'success': True,
            'message': 'Verification email sent. Please check your inbox.'
        })
    except requests.exceptions.RequestException as e:
        print(f"Error calling email service: {e}")
        return jsonify({'success': False, 'message': 'Failed to send verification email. Please try again.'}), 500

# --- Journal Entries (all protected by auth_required) ---
@app.route('/api/entries', methods=['POST', 'GET'])
@auth_required
def entries():
    conn = get_db()
    c = conn.cursor()

    if request.method == 'POST':
        data = request.get_json() or {}
        text = data.get('text', '')
        mood = data.get('mood', 'neutral')
        
        # Use Gemini sentiment for better understanding (includes non-English)
        sentiment_score = gemini_sentiment(text)
        
        c.execute(
            'INSERT INTO entries (user_id,text,mood,sentiment,createdAt) VALUES (?,?,?,?,?)',
            (request.user['id'], text, mood, sentiment_score, datetime.datetime.utcnow().isoformat())
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

@app.route('/api/analyze', methods=['POST'])
@auth_required
def analyze_text():
    data = request.get_json() or {}
    text = data.get('text', '')
    
    try:
        response = requests.post(
            "http://127.0.0.1:5003/predict",
            json={"text": text},
            timeout=15
        )
        if response.status_code == 200:
            pers = response.json()
        else:
            pers = {'error': 'Analyzer returned non-200 response'}
    except Exception as e:
        pers = {'error': str(e)}

    return jsonify({
        'success': True, 
        'sentiment_score': gemini_sentiment(text),
        'personality': pers.get('personality_profile')
    })


@app.route('/api/chat', methods=['POST'])
@auth_required
def chat_query():
    data = request.get_json() or {}
    message = data.get('message', '')
    if not message:
        return jsonify({'success': False, 'message': 'No message provided'}), 400

    try:
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

@app.route('/favicon.ico')
def favicon():
    return '', 204

# --- OAuth Routes ---
@app.route('/api/auth/google')
def google_login():
    redirect_uri = request.base_url + '/callback'
    return google.authorize_redirect(redirect_uri)

@app.route('/api/auth/google/callback')
def google_authorize():
    token = google.authorize_access_token()
    user_info = token.get('userinfo')
    if not user_info:
        # For some configurations it might be different
        user_info = google.get('https://openidconnect.googleapis.com/v1/userinfo').json()
    
    email = user_info.get('email')
    google_id = user_info.get('sub')
    name = user_info.get('name')
    avatar = user_info.get('picture')

    return complete_oauth_login('google', google_id, email, name, avatar)

@app.route('/api/auth/facebook')
def facebook_login():
    redirect_uri = request.base_url + '/callback'
    return facebook.authorize_redirect(redirect_uri)

@app.route('/api/auth/facebook/callback')
def facebook_authorize():
    token = facebook.authorize_access_token()
    resp = facebook.get('me?fields=id,name,email,picture')
    user_info = resp.json()
    
    email = user_info.get('email')
    facebook_id = user_info.get('id')
    name = user_info.get('name')
    avatar = user_info.get('picture', {}).get('data', {}).get('url')

    return complete_oauth_login('facebook', facebook_id, email, name, avatar)

def complete_oauth_login(provider, provider_id, email, name, avatar):
    if not email:
        return f"<html><body><script>window.opener.postMessage({{success: false, message: 'Email not provided by {provider}'}}, '*'); window.close();</script></body></html>"

    conn = get_db()
    c = conn.cursor()
    
    # Check if user already exists
    user = c.execute('SELECT id, email, is_verified FROM users WHERE email = ?', (email,)).fetchone()
    
    if user:
        # Update existing user with OAuth info and name if missing
        c.execute('''UPDATE users SET oauth_provider = ?, oauth_id = ?, is_verified = 1, 
                     full_name = COALESCE(full_name, ?), avatar = COALESCE(avatar, ?) 
                     WHERE id = ?''', 
                  (provider, provider_id, name, avatar, user['id']))
        user_id = user['id']
    else:
        # Create new user
        c.execute('''INSERT INTO users (email, full_name, avatar, is_verified, oauth_provider, oauth_id, createdAt) 
                     VALUES (?, ?, ?, 1, ?, ?, ?)''',
                  (email, name, avatar, provider, provider_id, datetime.datetime.utcnow().isoformat()))
        user_id = c.lastrowid
    
    conn.commit()
    conn.close()
    
    # Generate JWT token
    token = jwt.encode({'id': user_id, 'email': email}, SECRET, algorithm='HS256')
    
    # Send token back to frontend using postMessage
    return f"""
    <html>
        <body>
            <script>
                window.opener.postMessage({{
                    success: true, 
                    token: '{token}',
                    message: 'Successfully logged in with {provider}'
                }}, '*');
                window.close();
            </script>
        </body>
    </html>
    """

# --- Health check endpoint ---
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'timestamp': datetime.datetime.utcnow().isoformat()})

# --- Main Entry Point ---
if __name__ == '__main__':
    init_db()
    print("🚀 Server starting on port 5000...")
    print("📧 Email service configured for:", EMAIL_SERVICE_URL)
    app.run(host='0.0.0.0', port=5000, debug=True)