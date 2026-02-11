// --- START OF app.js (Modified) ---

const API = (localStorage.getItem('API_BASE') || '/api');
const app = document.getElementById('app');
const relaxAudio = document.getElementById('relax-sound');
const sounds = {
  rain: 'sounds/rain.mp3',
  waves: 'sounds/waves.mp3',
  chimes: 'sounds/chimes.mp3',
  lofi_relax: 'sounds/lofi-relax.mp3',
  lofi: 'sounds/lofi.mp3',
  meditation_amp: 'sounds/meditation-amp.mp3',
  meditation_relax: 'sounds/meditation-relax.mp3',
  garden: 'sounds/morning-garden.mp3',
  relax_2: 'sounds/relax-2.mp3',
  relax_4: 'sounds/relax-4.mp3',
  relax_guitar: 'sounds/relax-guitar.mp3',
  relax_meditation: 'sounds/relax-meditation.mp3',
  relax_meditation1: 'sounds/relax-meditation1.mp3',
  sedative: 'sounds/sedative.mp3'
};

let state = {
  token: localStorage.getItem('mj_token') || null,
  user: null,
  entries: [],
  chatHistory: [
    {
      role: "system",
      content: "You are a kind, empathetic, and supportive companion in a mood journaling app. You listen, offer gentle encouragement, and help users reflect on their thoughts and feelings. Do not give medical advice. Keep responses concise and comforting.",
    },
  ],
};

// Lottie Player script recommendation - if not already in index.html
// This should be added to your index.html <head> or right before </body>
// <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>

// Simple utility functions
function setToken(t) {
  state.token = t;
  t ? localStorage.setItem('mj_token', t) : localStorage.removeItem('mj_token');
}

async function api(path, opts = {}) {
  const h = opts.headers || {};
  if (state.token) h['Authorization'] = 'Bearer ' + state.token;
  try {
    const r = await axios({ url: API + path, ...opts, headers: h });
    return r.data;
  } catch (e) {
    console.error(e);
    if (e.response?.data) return e.response.data;
    throw e;
  }
}

async function loadProfile() {
  if (!state.token) return;
  const res = await api('/auth/me');
  if (res?.user) state.user = res.user;
}

// Simple validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showLogin() {
  app.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card">
        <h2>🌸 Welcome Back, beautiful soul</h2>
        <p class="subtitle">Login or create your Mood Garden account 🌈</p>
        
        <label for="email">Email</label>
        <input id="email" type="email" placeholder="📧 Your sunshine address" />
        <label for="pwd">Password</label>
        <input id="pwd" type="password" placeholder="🔒 Your secret key to calm" />
        
        <div class="row">
          <button class="btn primary" id="loginBtn">✨Login</button>
          <button class="btn secondary" id="regBtn">🌱Register</button>
        </div>
        
        <div id="msg" class="msg"></div>
      </div>
    </div>
  `;

  // Add styles
  addLoginStyles();

  const emailInput = document.getElementById('email');
  const pwdInput = document.getElementById('pwd');
  const msg = document.getElementById('msg');
  const loginBtn = document.getElementById('loginBtn');
  const regBtn = document.getElementById('regBtn');

  // Simple validation function
  function validateForm() {
    const email = emailInput.value.trim();
    const password = pwdInput.value.trim();

    if (!email || !password) {
      msg.textContent = '⚠ Please provide email & password';
      return false;
    }

    if (!isValidEmail(email)) {
      msg.textContent = '⚠ Please enter a valid email address';
      return false;
    }

    if (password.length < 6) {
      msg.textContent = '⚠ Password must be at least 6 characters';
      return false;
    }

    return true;
  }

  // Login button
  loginBtn.onclick = async () => {
    if (!validateForm()) return;

    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Logging in...';

    try {
      const email = emailInput.value.trim();
      const password = pwdInput.value.trim();

      const r = await api('/auth/login', {
        method: 'post',
        data: { email, password }
      });

      if (r?.token) {
        setToken(r.token);
        await loadProfile();
        renderApp();
      } else {
        msg.textContent = r.message || '❌ Login failed';
      }
    } catch (error) {
      msg.textContent = '❌ Login failed. Please try again.';
      console.error('Login error:', error);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = '✨Login';
    }
  };

  // Register button
  regBtn.onclick = async () => {
    if (!validateForm()) return;

    regBtn.disabled = true;
    regBtn.textContent = '⏳ Registering...';

    try {
      const email = emailInput.value.trim();
      const password = pwdInput.value.trim();

      const r = await api('/auth/register', {
        method: 'post',
        data: { email, password }
      });

      if (r?.token) {
        setToken(r.token);
        await loadProfile();
        renderApp();
      } else {
        msg.textContent = r.message || '❌ Register failed';
      }
    } catch (error) {
      msg.textContent = '❌ Register failed. Please try again.';
      console.error('Register error:', error);
    } finally {
      regBtn.disabled = false;
      regBtn.textContent = '🌱Register';
    }
  };

  // Allow Enter key to submit
  pwdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginBtn.click();
    }
  });
}

// Add login styles with purple theme
function addLoginStyles() {
  // Only add styles if not already present
  if (document.getElementById('login-enhanced-styles')) return;

  const loginStyles = document.createElement('style');
  loginStyles.id = 'login-enhanced-styles';
  loginStyles.textContent = `
    /* Login Container */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }
    
    .login-wrapper::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
      background-size: 100px 100px;
      opacity: 0.5;
      z-index: 0;
    }
    
    /* Login Card */
    .login-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
      text-align: center;
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .login-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 25px 50px rgba(139, 92, 246, 0.4);
    }
    
    /* Typography */
    .login-card h2 {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin: 0 0 1rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .subtitle {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 2rem;
    }
    
    /* Form Elements */
    .login-card input {
      width: 100%;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border: none;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.1);
    }
    
    .login-card input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .login-card input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
    }
    
    /* Buttons */
    .row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .btn {
      flex: 1;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 2rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      white-space: nowrap;
    }
    
    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .btn:hover::before {
      transform: translateX(0);
    }
    
    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .btn.primary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
    }
    
    .btn.primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
    }
    
    .btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .btn.secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
    }
    
    /* Message */
    .msg {
      min-height: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      margin-top: 0.5rem;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .login-wrapper {
        padding: 1rem;
      }
      
      .login-card {
        padding: 1.5rem;
      }
      
      .login-card h2 {
        font-size: 1.8rem;
      }
      
      .row {
        flex-direction: column;
      }
    }
  `;

  document.head.appendChild(loginStyles);
}
// Add some basic CSS improvements
const loginCSS = `
  .login-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
  }
  
  .login-card {
    background: white;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    max-width: 400px;
    width: 100%;
  }
  
  .login-card h2 {
    text-align: center;
    margin-bottom: 10px;
    color: #333;
  }
  
  .subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 20px;
  }
  
  .login-card input {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    box-sizing: border-box;
  }
  
  .login-card input:focus {
    outline: none;
    border-color: #ff9966;
  }
  
  .row {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn:not(.ghost) {
    background: linear-gradient(135deg, #ff9966, #ff5e62);
    color: white;
  }
  
  .btn:not(.ghost):hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255,94,98,0.3);
  }
  
  .btn.ghost {
    background: transparent;
    color: #ff5e62;
    border: 1px solid #ff5e62;
  }
  
  .btn.ghost:hover:not(:disabled) {
    background: rgba(255,94,98,0.1);
  }
  
  .msg {
    text-align: center;
    color: #ff5e62;
    font-weight: 500;
    min-height: 20px;
  }
`;

// Add CSS if not already present
if (!document.getElementById('login-styles')) {
  const style = document.createElement('style');
  style.id = 'login-styles';
  style.textContent = loginCSS;
  document.head.appendChild(style);
}
function renderApp() {
  if (!state.token) { showLogin(); return; }
  app.innerHTML = `<div class="app-grid">
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center">
      <div><strong>${state.user?.email || ''}</strong><div style="font-size:12px;color:rgba(0,0,0,0.35)">📊 "Your Weekly Glow"
</div></div>
      <div><button class="btn ghost" id="logout">Logout</button></div></div><hr/>
      <div class="menu">
        <button id="nav_new" class="pink">🌸 New Entry</button>
        <button id="nav_notes" class="blue">🗒 My Notes</button>
        <button id="nav_stats" class="green">📊 Weekly Evaluation</button>
        <button id="nav_help" class="yellow">🩺 Professional Help</button>
        <button id="nav_sounds" class="purple">🎧 Relaxing Sounds</button>
        <button id="nav_person" class="coral">🧭 Personality</button>
        <button id="nav_motivation" class="teal">✨ Motivation</button>
        <button id="nav_chat" class="gray">💬 Chatbot</button>
      </div></div>
    <div class="card" id="maincard"></div></div>`;
  logout.onclick = () => { setToken(null); state.user = null; renderApp(); };
  nav_new.onclick = () => activateNav('nav_new', showNewEntry);
  nav_notes.onclick = () => activateNav('nav_notes', showNotes);
  nav_stats.onclick = () => activateNav('nav_stats', showStats);
  nav_help.onclick = () => activateNav('nav_help', showHelp);
  nav_sounds.onclick = () => activateNav('nav_sounds', showSounds);
  nav_person.onclick = () => activateNav('nav_person', showPersonality);
  nav_motivation.onclick = () => activateNav('nav_motivation', showMotivation);
  nav_chat.onclick = () => activateNav('nav_chat', showChatbot);
  showNewEntry(); fetchEntries();
}

async function fetchEntries() { const r = await api('/entries?limit=200'); if (r?.entries) state.entries = r.entries; }
function activateNav(id, fn) {
  document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
  const el = document.getElementById(id); if (el) el.classList.add('active'); fn();
}
function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ---- PAGES ---- */
function showNewEntry() {
  const main = document.getElementById('maincard');
  main.innerHTML = '';

  const entryContainer = createElement('div', 'entry-container');
  main.appendChild(entryContainer);

  // Add styles once
  addEntryStyles();

  renderEntryHeader(entryContainer);

  const scrollContainer = createElement('div', 'scroll-container');
  entryContainer.appendChild(scrollContainer);

  const entryContent = createElement('div', 'entry-content');
  scrollContainer.appendChild(entryContent);

  renderPromptSection(entryContent);
  renderMoodSection(entryContent);
  renderTextSection(entryContent);
  renderActionsSection(entryContent);

  renderEntryFooter(entryContainer);

  initializeEntryFunctionality();
}

/* ---------------------------
   Reusable Helper Function
---------------------------- */
function createElement(tag, className, html = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html) el.innerHTML = html;
  return el;
}

/* ---------------------------
       HEADER
---------------------------- */
function renderEntryHeader(container) {
  container.appendChild(createElement(
    'div',
    'entry-header',
    `
      <h2 class="entry-title">
        <span class="title-emoji">📝</span>
        New Entry
      </h2>
      <div class="entry-subtitle">Record your thoughts and feelings</div>
    `
  ));
}

/* ---------------------------
       PROMPT SECTION
---------------------------- */
function renderPromptSection(container) {
  container.appendChild(createElement(
    'div',
    'prompt-section',
    `
      <div class="section-title"><span class="section-emoji">💭</span>Daily Prompt</div>
      <div class="prompt-card glow-hover">
        <div class="prompt-text" id="promptText">Loading prompt...</div>
        <button class="refresh-btn" id="refreshPrompt" title="New Prompt">🔄</button>
      </div>
    `
  ));
}

/* ---------------------------
        MOOD SECTION
---------------------------- */
function renderMoodSection(container) {
  const moods = [
    ["happy", "😊", "Happy"],
    ["sad", "😢", "Sad"],
    ["angry", "😠", "Angry"],
    ["anxious", "😰", "Anxious"],
    ["neutral", "😐", "Neutral"],
    ["hopeful", "🌟", "Hopeful"]
  ];

  const moodButtons = moods.map(
    m => `<button class="mood-btn glow-hover" data-mood="${m[0]}"><span class="mood-emoji">${m[1]}</span>${m[2]}</button>`
  ).join('');

  container.appendChild(createElement(
    'div',
    'mood-section',
    `
      <div class="section-title"><span class="section-emoji">😊</span>How are you feeling?</div>
      <div class="mood-options">${moodButtons}</div>
    `
  ));
}

/* ---------------------------
        TEXT SECTION
---------------------------- */
function renderTextSection(container) {
  container.appendChild(createElement(
    'div',
    'text-section',
    `
      <div class="section-title"><span class="section-emoji">✍️</span>Your Thoughts</div>
      <div class="text-container glass-box">
        <textarea id="entryText" class="entry-textarea" placeholder="What's on your mind today?" maxlength="500"></textarea>
        <div class="text-counter"><span id="charCount">0</span>/500</div>
      </div>
    `
  ));
}

/* ---------------------------
        ACTION BUTTONS
---------------------------- */
function renderActionsSection(container) {
  container.appendChild(createElement(
    'div',
    'actions-section',
    `
      <div class="action-buttons">
        <button class="action-btn secondary glow-btn" id="saveDraft">💾 Save Draft</button>
        <button class="action-btn primary glow-btn" id="saveEntry">✅ Save Entry</button>
      </div>
    `
  ));
}

/* ---------------------------
        FOOTER
---------------------------- */
function renderEntryFooter(container) {
  container.appendChild(createElement(
    'div',
    'entry-footer',
    `<div class="footer-text">Your entries are private and secure</div>`
  ));
}

/* ---------------------------
        FUNCTIONALITY
---------------------------- */
function initializeEntryFunctionality() {
  const promptText = document.getElementById('promptText');
  const entryText = document.getElementById('entryText');
  const charCount = document.getElementById('charCount');
  const refreshPrompt = document.getElementById('refreshPrompt');

  const moodButtons = document.querySelectorAll('.mood-btn');
  const saveDraftBtn = document.getElementById('saveDraft');
  const saveEntryBtn = document.getElementById('saveEntry');

  const prompts = [
    "What are three things you're grateful for?",
    "What made you smile today?",
    "What challenged you today?",
    "What’s something you learned about yourself?",
    "What moment gave you peace today?",
    "What’s something you're proud of?",
    "What are you looking forward to?"
  ];

  let selectedMood = null;
  let promptIndex = 0;

  function loadPrompt() {
    promptText.textContent = prompts[promptIndex];
  }

  refreshPrompt.onclick = () => {
    promptIndex = (promptIndex + 1) % prompts.length;
    loadPrompt();
  };

  loadPrompt();

  // Mood selection
  moodButtons.forEach(btn => {
    btn.onclick = () => {
      moodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    };
  });

  // Character count
  entryText.addEventListener('input', () => {
    charCount.textContent = entryText.value.length;
  });

  // Save Draft
  saveDraftBtn.onclick = () => {
    saveToStorage(true);
  };

  // Save Entry
  saveEntryBtn.onclick = () => {
    if (!selectedMood) return showNotification("Select a mood", "warning");
    if (!entryText.value.trim()) return showNotification("Write something!", "warning");

    saveToStorage(false);
    resetForm();
  };

  function saveToStorage(isDraft) {
    const entryData = {
      text: entryText.value,
      mood: selectedMood,
      prompt: promptText.textContent,
      timestamp: new Date().toISOString(),
      isDraft
    };

    if (isDraft) {
      localStorage.setItem('journalDraft', JSON.stringify(entryData));
      showNotification("Draft saved!", "info");
    } else {
      const entries = JSON.parse(localStorage.getItem("journalEntries")) || [];
      entries.push(entryData);
      localStorage.setItem("journalEntries", JSON.stringify(entries));
      showNotification("Entry saved!", "success");
    }
  }

  function resetForm() {
    entryText.value = '';
    charCount.textContent = 0;
    moodButtons.forEach(btn => btn.classList.remove('selected'));
    selectedMood = null;
  }
}

/* ---------------------------
    BEAUTIFUL STYLE INJECTION
---------------------------- */
function addEntryStyles() {
  if (document.getElementById("new-entry-styles")) return;

  const css = `
    /* Cleaner, softer, more modern purple design */
    .entry-container {
      background: linear-gradient(130deg,#8b5cf6,#a855f7,#c084fc);
      padding: 2rem;
      border-radius: 1.5rem;
      color: white;
      box-shadow: 0 25px 45px rgba(0,0,0,0.25);
      backdrop-filter: blur(20px);
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }

    .glass-box {
      background: rgba(255,255,255,0.15);
      border-radius: 1rem;
      padding: 1rem;
      backdrop-filter: blur(12px);
    }

    .glow-hover:hover {
      box-shadow: 0 0 15px rgba(255,255,255,0.4);
      transform: translateY(-3px);
    }

    .glow-btn:hover {
      box-shadow: 0 0 20px rgba(255,255,255,0.5);
    }

    .entry-title { font-size: 2.3rem; font-weight: 700; }

    .mood-btn { 
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(255,255,255,0.12);
      color: white;
      border: none;
      transition: 0.25s;
    }

    .mood-btn.selected {
      background: rgba(255,255,255,0.35);
      box-shadow: 0 0 12px rgba(255,255,255,0.4);
    }

    .action-btn {
      padding: 0.9rem 1.5rem;
      border-radius: 2rem;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: 0.3s;
      color: white;
    }

    .primary { background: rgba(255,255,255,0.25); }
    .secondary { background: rgba(255,255,255,0.15); }

    .notification {
      position: fixed;
      right: 20px;
      bottom: 20px;
      padding: 12px 18px;
      border-radius: 10px;
      font-weight: 600;
      animation: fadeIn 0.3s ease;
      color: white;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; }
    }
  `;

  const style = document.createElement("style");
  style.id = "new-entry-styles";
  style.textContent = css;

  document.head.appendChild(style);
}

/* -----------------------------------
       NOTIFICATION FUNCTION
----------------------------------- */
function showNotification(msg, type) {
  const n = document.createElement("div");
  n.className = "notification";
  n.textContent = msg;

  if (type === "success") n.style.background = "rgba(40,167,69,0.9)";
  else if (type === "warning") n.style.background = "rgba(255,193,7,0.9)";
  else n.style.background = "rgba(139,92,246,0.9)";

  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2500);
}


// Render entry header
function renderEntryHeader(container) {
  const header = document.createElement('div');
  header.className = 'entry-header';
  header.innerHTML = `
    <h2 class="entry-title">
      <span class="title-emoji">📝</span>
      <span>New Entry</span>
    </h2>
    <div class="entry-subtitle">Record your thoughts and feelings</div>
  `;
  container.appendChild(header);
}

// Render prompt section
function renderPromptSection(container) {
  const promptSection = document.createElement('div');
  promptSection.className = 'prompt-section';
  promptSection.innerHTML = `
    <div class="section-title">
      <span class="section-emoji">💭</span>
      <span>Daily Prompt</span>
    </div>
    <div class="prompt-card">
      <div class="prompt-text" id="promptText">Loading prompt...</div>
      <button class="refresh-btn" id="refreshPrompt" title="Get new prompt">
        <span class="btn-emoji">🔄</span>
      </button>
    </div>
  `;
  container.appendChild(promptSection);
}

// Render mood section with specified moods
function renderMoodSection(container) {
  const moodSection = document.createElement('div');
  moodSection.className = 'mood-section';
  moodSection.innerHTML = `
    <div class="section-title">
      <span class="section-emoji">😊</span>
      <span>How are you feeling?</span>
    </div>
    <div class="mood-options">
      <button class="mood-btn" data-mood="happy">
        <span class="mood-emoji">😊</span>
        <span class="mood-label">Happy</span>
      </button>
      <button class="mood-btn" data-mood="sad">
        <span class="mood-emoji">😢</span>
        <span class="mood-label">Sad</span>
      </button>
      <button class="mood-btn" data-mood="angry">
        <span class="mood-emoji">😠</span>
        <span class="mood-label">Angry</span>
      </button>
      <button class="mood-btn" data-mood="anxious">
        <span class="mood-emoji">😰</span>
        <span class="mood-label">Anxious</span>
      </button>
      <button class="mood-btn" data-mood="neutral">
        <span class="mood-emoji">😐</span>
        <span class="mood-label">Neutral</span>
      </button>
      <button class="mood-btn" data-mood="hopeful">
        <span class="mood-emoji">🌟</span>
        <span class="mood-label">Hopeful</span>
      </button>
    </div>
  `;
  container.appendChild(moodSection);
}

// Render text section
function renderTextSection(container) {
  const textSection = document.createElement('div');
  textSection.className = 'text-section';
  textSection.innerHTML = `
    <div class="section-title">
      <span class="section-emoji">✍️</span>
      <span>Your Thoughts</span>
    </div>
    <div class="text-container">
      <textarea 
        id="entryText" 
        class="entry-textarea" 
        placeholder="What's on your mind today?"
        rows="8"
      ></textarea>
      <div class="text-counter">
        <span id="charCount">0</span> / <span id="charLimit">500</span>
      </div>
    </div>
  `;
  container.appendChild(textSection);
}

// Render actions section
function renderActionsSection(container) {
  const actionsSection = document.createElement('div');
  actionsSection.className = 'actions-section';
  actionsSection.innerHTML = `
    <div class="action-buttons">
      <button class="action-btn secondary" id="saveDraft">
        <span class="btn-emoji">💾</span>
        <span>Save Draft</span>
      </button>
      <button class="action-btn primary" id="saveEntry">
        <span class="btn-emoji">✅</span>
        <span>Save Entry</span>
      </button>
    </div>
  `;
  container.appendChild(actionsSection);
}

// Render entry footer
function renderEntryFooter(container) {
  const footer = document.createElement('div');
  footer.className = 'entry-footer';
  footer.innerHTML = `
    <div class="footer-text">
      <span>Your entries are private and secure</span>
    </div>
  `;
  container.appendChild(footer);
}

// Add entry styles with fresh purple design
function addEntryStyles() {
  // Only add styles if not already present
  if (document.getElementById('entry-enhanced-styles')) return;

  const entryStyles = document.createElement('style');
  entryStyles.id = 'entry-enhanced-styles';
  entryStyles.textContent = `
    /* Entry Container */
    .entry-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      border-radius: 1.5rem;
      box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
      color: white;
      min-height: 600px;
      position: relative;
      overflow: visible;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }
    
    /* Custom scrollbar for the entire container */
    .entry-container::-webkit-scrollbar {
      width: 10px;
    }
    
    .entry-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }
    
    .entry-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 5px;
    }
    
    .entry-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .entry-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
      background-size: 100px 100px;
      opacity: 0.5;
      z-index: 0;
    }
    
    /* Header Styles */
    .entry-header {
      text-align: center;
      margin-bottom: 1.5rem;
      position: relative;
      z-index: 1;
    }
    
    .entry-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin: 0 0 0.5rem;
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2.8rem;
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(5deg); }
    }
    
    .entry-subtitle {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      max-width: 600px;
      margin: 0 auto;
    }
    
    /* Scroll Container */
    .scroll-container {
      position: relative;
      z-index: 1;
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    .scroll-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .scroll-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .scroll-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    /* Content Styles */
    .entry-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    /* Section Styles */
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
    }
    
    .section-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    /* Prompt Section */
    .prompt-section {
      margin-bottom: 1.5rem;
    }
    
    .prompt-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .prompt-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .prompt-card:hover::after {
      opacity: 1;
    }
    
    .prompt-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(139, 92, 246, 0.3);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .prompt-text {
      font-size: 1.1rem;
      color: white;
      line-height: 1.5;
      flex: 1;
      padding-right: 1rem;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .refresh-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }
    
    .refresh-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: rotate(180deg);
    }
    
    .btn-emoji {
      font-size: 1.2rem;
    }
    
    /* Mood Section */
    .mood-section {
      margin-bottom: 1.5rem;
    }
    
    .mood-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }
    
    .mood-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: none;
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: white;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .mood-btn::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .mood-btn:hover::after {
      opacity: 1;
    }
    
    .mood-btn:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(139, 92, 246, 0.3);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .mood-btn.selected {
      background: rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
    }
    
    .mood-emoji {
      font-size: 2rem;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }
    
    .mood-label {
      font-size: 0.9rem;
      font-weight: 600;
    }
    
    /* Text Section */
    .text-section {
      margin-bottom: 1.5rem;
    }
    
    .text-container {
      position: relative;
    }
    
    .entry-textarea {
      width: 100%;
      min-height: 200px;
      padding: 1rem;
      border: none;
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: white;
      font-size: 1rem;
      line-height: 1.5;
      resize: vertical;
      box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .entry-textarea::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .entry-textarea:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 15px 40px rgba(139, 92, 246, 0.3);
    }
    
    .text-counter {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }
    
    /* Actions Section */
    .actions-section {
      margin-bottom: 1.5rem;
    }
    
    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 2rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .action-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .action-btn:hover::before {
      transform: translateX(0);
    }
    
    .action-btn.primary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
    }
    
    .action-btn.primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
    }
    
    .action-btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .action-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
    }
    
    /* Footer Styles */
    .entry-footer {
      text-align: center;
      margin-top: auto;
      padding-top: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .footer-text {
      font-size: 0.8rem;
      opacity: 0.7;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .entry-container {
        padding: 1rem;
        gap: 1rem;
      }
      
      .entry-title {
        font-size: 2rem;
      }
      
      .title-emoji {
        font-size: 2.3rem;
      }
      
      .mood-options {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
  `;

  document.head.appendChild(entryStyles);
}

// Initialize entry functionality
function initializeEntryFunctionality() {
  // DOM elements
  const elements = {
    promptText: document.getElementById('promptText'),
    refreshPrompt: document.getElementById('refreshPrompt'),
    entryText: document.getElementById('entryText'),
    charCount: document.getElementById('charCount'),
    saveDraft: document.getElementById('saveDraft'),
    saveEntry: document.getElementById('saveEntry'),
    moodButtons: document.querySelectorAll('.mood-btn')
  };

  // Data
  const prompts = [
    "What are three things you're grateful for today?",
    "Describe a challenge you overcame recently.",
    "What made you smile today?",
    "What's something you learned about yourself?",
    "Describe a moment of peace you experienced today.",
    "What would you tell your younger self?",
    "What's something you're looking forward to?",
    "Describe a person who made a positive impact on your day.",
    "What's a small victory you achieved today?",
    "What's something you're proud of yourself for?"
  ];

  let currentPromptIndex = 0;
  let selectedMood = null;

  // Initialize prompt
  loadPrompt();

  // Initialize mood buttons
  elements.moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.moodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    });
  });

  // Initialize character counter
  elements.entryText.addEventListener('input', () => {
    const count = elements.entryText.value.length;
    elements.charCount.textContent = count;

    if (count > 500) {
      elements.charCount.style.color = 'rgba(255, 100, 100, 0.9)';
    } else {
      elements.charCount.style.color = 'rgba(255, 255, 255, 0.7)';
    }
  });

  // Initialize refresh prompt button
  elements.refreshPrompt.addEventListener('click', () => {
    currentPromptIndex = (currentPromptIndex + 1) % prompts.length;
    loadPrompt();
  });

  // Initialize save buttons
  elements.saveDraft.addEventListener('click', saveDraft);
  elements.saveEntry.addEventListener('click', saveEntry);

  // Functions
  function loadPrompt() {
    elements.promptText.textContent = prompts[currentPromptIndex];
  }

  function saveDraft() {
    const entryData = {
      text: elements.entryText.value,
      mood: selectedMood,
      prompt: elements.promptText.textContent,
      isDraft: true,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('journalDraft', JSON.stringify(entryData));

    // Show notification
    showNotification('Draft saved successfully', 'info');
  }

  function saveEntry() {
    if (!selectedMood) {
      showNotification('Please select a mood', 'warning');
      return;
    }

    if (!elements.entryText.value.trim()) {
      showNotification('Please enter some text', 'warning');
      return;
    }

    const entryData = {
      text: elements.entryText.value,
      mood: selectedMood,
      prompt: elements.promptText.textContent,
      isDraft: false,
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    entries.push(entryData);
    localStorage.setItem('journalEntries', JSON.stringify(entries));

    // Clear draft
    localStorage.removeItem('journalDraft');

    // Show notification
    showNotification('Entry saved successfully', 'success');

    // Reset form
    resetForm();
  }

  function resetForm() {
    elements.entryText.value = '';
    elements.charCount.textContent = '0';
    elements.moodButtons.forEach(btn => btn.classList.remove('selected'));
    selectedMood = null;
    currentPromptIndex = (currentPromptIndex + 1) % prompts.length;
    loadPrompt();
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    if (type === 'success') {
      notification.style.background = 'rgba(76, 175, 80, 0.9)';
      notification.style.color = 'white';
    } else if (type === 'warning') {
      notification.style.background = 'rgba(255, 152, 0, 0.9)';
      notification.style.color = 'white';
    } else {
      notification.style.background = 'rgba(139, 92, 246, 0.9)';
      notification.style.color = 'white';
    }

    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '1rem';
    notification.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideIn 0.3s ease';
    notification.style.fontSize = '0.9rem';
    notification.style.backdropFilter = 'blur(10px)';

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Add slide animations
  const slideStyle = document.createElement('style');
  slideStyle.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(slideStyle);

  // Add mouse tracking for interactive hover effects
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.prompt-card, .mood-btn');

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top; ss

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    });
  });
}

// Add styles to document
function addEntryStyles() {
  if (document.getElementById('entry-enhanced-styles')) return;

  const entryStyles = document.createElement('style');
  entryStyles.id = 'entry-enhanced-styles';
  entryStyles.textContent = `
    :root {
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      --secondary-gradient: linear-gradient(135deg, #ec4899, #f43f5e);
      --accent-gradient: linear-gradient(135deg, #06b6d4, #3b82f6);
      --success-gradient: linear-gradient(135deg, #10b981, #34d399);
      --warning-gradient: linear-gradient(135deg, #f59e0b, #fbbf24);
      --danger-gradient: linear-gradient(135deg, #ef4444, #f87171);
      --text-primary: white;
      --text-secondary: rgba(255, 255, 255, 0.8);
      --text-muted: rgba(255, 255, 255, 0.6);
      --bg-card: rgba(255, 255, 255, 0.08);
      --bg-card-hover: rgba(255, 255, 255, 0.12);
      --bg-input: rgba(255, 255, 255, 0.12);
      --bg-input-focus: rgba(255, 255, 255, 0.18);
      --border-radius: 12px;
      --border-radius-sm: 6px;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
      --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
      --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
    }
    
    .entry-container {
      display: flex;
      flex-direction: column;
      height: 96vh;
      max-height: 96vh;
      background: var(--primary-gradient);
      border-radius: 20px;
      box-shadow: var(--shadow-xl);
      color: var(--text-primary);
      position: relative;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    
    .entry-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%);
      z-index: 0;
      animation: rotate 40s linear infinite;
    }
    
    .entry-container::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/></svg>');
      z-index: 0;
    }
    
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .entry-header {
      text-align: center;
      padding: 14px 20px 8px;
      position: relative;
      z-index: 1;
      flex-shrink: 0;
    }
    
    .entry-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0;
      font-size: clamp(18px, 2.2vw, 24px);
      font-weight: 800;
      background: linear-gradient(135deg, #f472b6, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }
    
    .title-emoji {
      font-size: clamp(20px, 2.2vw, 26px);
      animation: float 4s ease-in-out infinite;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    
    .entry-subtitle {
      font-size: 12px;
      opacity: 0.85;
      margin-top: 4px;
      font-weight: 400;
    }
    
    .scroll-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 20px;
      position: relative;
      z-index: 1;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    }
    
    .scroll-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .scroll-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .scroll-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .entry-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 8px;
    }
    
    .section {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border-radius: var(--border-radius);
      padding: 12px;
      transition: var(--transition);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: var(--shadow-md);
    }
    
    .section:hover {
      background: var(--bg-card-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      font-weight: 700;
      font-size: 14px;
    }
    
    .section-emoji {
      font-size: 16px;
      filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
    }
    
    .prompt-categories {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .prompt-select {
      flex: 1;
      padding: 6px 10px;
      border-radius: var(--border-radius-sm);
      border: 1px solid rgba(255, 255, 255, 0.3); /* Increased border opacity */
      background: rgba(30, 41, 59, 0.7); /* Darker background with opacity */
      color: white; /* Explicit white text */
      font-size: 12px;
      outline: none;
      transition: var(--transition);
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 16 16'%3e%3cpath d='m7.247 11.14 2.363-2.363H1v-1.5h8.61L7.247 4.914l1.06-1.06L12.5 8l-4.192 4.146-1.061-1.007z'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem; /* Space for dropdown arrow */
    }
    
    .prompt-select:focus {
      background: rgba(30, 41, 59, 0.9); /* Darker on focus */
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }
    
    .prompt-select option {
      background: #1e293b; /* Dark background for options */
      color: white;
      padding: 6px;
    }
    
    .prompt-btn {
      padding: 6px 10px;
      border-radius: var(--border-radius-sm);
      border: none;
      background: var(--accent-gradient);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: var(--shadow-sm);
      font-size: 12px;
    }
    
    .prompt-btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .prompt-content {
      margin-top: 6px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: var(--border-radius-sm);
      font-style: italic;
      animation: fadeIn 0.5s ease;
      border-left: 3px solid rgba(255, 255, 255, 0.3);
      font-size: 12px;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .mood-intensity {
      margin-bottom: 10px;
    }
    
    .intensity-label {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      opacity: 0.9;
      font-weight: 500;
    }
    
    .intensity-slider {
      position: relative;
    }
    
    .slider {
      width: 100%;
      height: 5px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.15);
      outline: none;
      -webkit-appearance: none;
    }
    
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      box-shadow: var(--shadow-md);
      transition: var(--transition);
    }
    
    .slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      box-shadow: var(--shadow-md);
      transition: var(--transition);
    }
    
    .slider::-webkit-slider-thumb:hover,
    .slider::-moz-range-thumb:hover {
      transform: scale(1.2);
    }
    
    .intensity-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 10px;
      opacity: 0.7;
    }
    
    .mood-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
      gap: 8px;
    }
    
    .chip {
      background: rgba(255, 255, 255, 0.12);
      border-radius: var(--border-radius-sm);
      padding: 8px;
      text-align: center;
      cursor: pointer;
      transition: var(--transition);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .chip::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0), rgba(255,255,255,0.15));
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .chip:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }
    
    .chip:hover::before {
      opacity: 1;
    }
    
    .chip.selected {
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    .chip lottie-player {
      width: 40px;
      height: 40px;
      margin: 0 auto 4px;
    }
    
    .chip-text {
      font-weight: 600;
      position: relative;
      z-index: 1;
      font-size: 10px;
    }
    
    .text-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    
    .char-counter {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      opacity: 0.8;
      padding: 3px 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 12px;
    }
    
    .char-counter.warning {
      background: rgba(245, 158, 11, 0.2);
    }
    
    .char-counter.danger {
      background: rgba(239, 68, 68, 0.2);
    }
    
    .text-container {
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    .entry-textarea {
      width: 100%;
      min-height: 80px;
      border-radius: var(--border-radius-sm);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 10px;
      font-size: 13px;
      background: rgba(30, 41, 59, 0.5); /* Darker background */
      color: white; /* Explicit white text */
      resize: none;
      outline: none;
      transition: var(--transition);
      font-family: inherit;
      line-height: 1.4;
    }
    
    .entry-textarea:focus {
      background: rgba(30, 41, 59, 0.7); /* Darker on focus */
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }
    
    .entry-textarea::placeholder {
      color: rgba(255, 255, 255, 0.7); /* More visible placeholder */
    }
    
    .text-tools {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin-top: 6px;
    }
    
    .tool-group {
      display: flex;
      gap: 4px;
    }
    
    .tool-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(30, 41, 59, 0.5); /* Darker background */
      color: white; /* Explicit white text */
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      font-weight: 600;
      font-size: 10px;
    }
    
    .tool-btn:hover {
      background: rgba(30, 41, 59, 0.7); /* Darker on hover */
      transform: scale(1.1);
      box-shadow: var(--shadow-md);
    }
    
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    
    .tag {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 10px;
      display: flex;
      align-items: center;
      gap: 3px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .tag-remove {
      cursor: pointer;
      font-weight: bold;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    
    .tag-remove:hover {
      opacity: 1;
    }
    
    .tag-input-container {
      display: flex;
      margin-top: 4px;
    }
    
    .tag-input {
      flex: 1;
      background: rgba(30, 41, 59, 0.5); /* Darker background */
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 4px 8px;
      color: white; /* Explicit white text */
      outline: none;
      transition: var(--transition);
      font-size: 11px;
    }
    
    .tag-input:focus {
      background: rgba(30, 41, 59, 0.7); /* Darker on focus */
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    .tag-input::placeholder {
      color: rgba(255, 255, 255, 0.7); /* More visible placeholder */
    }
    
    .entry-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    
    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--border-radius-sm);
      border: none;
      font-weight: 700;
      cursor: pointer;
      transition: var(--transition);
      font-size: 12px;
      box-shadow: var(--shadow-md);
    }
    
    .action-btn.primary {
      background: var(--secondary-gradient);
      color: white;
    }
    
    .action-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .action-btn.secondary {
      background: var(--accent-gradient);
      color: white;
    }
    
    .action-btn.secondary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .message-area {
      min-height: 18px;
      font-size: 11px;
      text-align: center;
      margin-top: 6px;
      animation: fadeIn 0.5s ease;
      font-weight: 500;
    }
    
    .entry-footer {
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border-radius: var(--border-radius);
      padding: 8px 20px;
      margin-top: 0;
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    
    .mood-history {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    
    .mood-history-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: var(--border-radius-sm);
      min-width: 40px;
      transition: var(--transition);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .mood-history-item:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
    }
    
    .mood-history-emoji {
      font-size: 14px;
      margin-bottom: 1px;
    }
    
    .mood-history-date {
      font-size: 8px;
      opacity: 0.7;
    }
    
    .loading-moods {
      width: 100%;
      text-align: center;
      font-style: italic;
      opacity: 0.7;
      padding: 4px;
      font-size: 10px;
    }
    
    .theme-toggle {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(30, 41, 59, 0.5); /* Darker background */
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: var(--transition);
      box-shadow: var(--shadow-md);
    }
    
    .theme-toggle:hover {
      background: rgba(30, 41, 59, 0.7); /* Darker on hover */
      transform: scale(1.1);
    }
    
    /* Dark theme */
    body.dark-theme .entry-container {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .entry-container {
        height: 99vh;
        max-height: 99vh;
      }
      
      .entry-header {
        padding: 10px 16px 6px;
      }
      
      .scroll-container {
        padding: 0 16px;
      }
      
      .entry-footer {
        padding: 6px 16px;
      }
      
      .mood-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .entry-actions {
        flex-direction: column;
        gap: 6px;
      }
      
      .text-header {
        flex-direction: column;
        gap: 6px;
        align-items: flex-start;
      }
      
      .prompt-categories {
        flex-direction: column;
      }
    }
  `;

  document.head.appendChild(entryStyles);
}

// Render entry header
function renderEntryHeader(container) {
  const header = document.createElement('div');
  header.className = 'entry-header';
  header.innerHTML = `
    <button class="theme-toggle" id="themeToggle" title="Toggle theme">
      <span id="themeIcon">🌙</span>
    </button>
    <h2 class="entry-title">
      <span class="title-emoji">🌸</span>
      <span>New Journal Entry</span>
    </h2>
    <div class="entry-subtitle">Capture your thoughts and emotions</div>
  `;
  container.appendChild(header);
}

// Render prompt section
function renderPromptSection(container) {
  const promptSection = document.createElement('div');
  promptSection.className = 'section prompt-section';
  promptSection.innerHTML = `
    <div class="section-header">
      <span class="section-emoji">💡</span>
      <span>Need inspiration?</span>
    </div>
    <div class="prompt-categories">
      <select id="promptCategory" class="prompt-select">
        <option value="all">All Categories</option>
        <option value="gratitude">Gratitude</option>
        <option value="reflection">Reflection</option>
        <option value="goals">Goals</option>
        <option value="emotions">Emotions</option>
      </select>
      <button class="prompt-btn" id="promptBtn">Get a writing prompt</button>
    </div>
    <div class="prompt-content" id="promptContent" style="display: none;"></div>
  `;
  container.appendChild(promptSection);
}

// Render mood section
function renderMoodSection(container) {
  const moodSection = document.createElement('div');
  moodSection.className = 'section mood-section';
  moodSection.innerHTML = `
    <div class="section-header">
      <span class="section-emoji">💭</span>
      <span>How are you feeling today?</span>
    </div>
    <div class="mood-intensity">
      <span class="intensity-label">Intensity:</span>
      <div class="intensity-slider">
        <input type="range" id="moodIntensity" min="1" max="5" value="3" class="slider">
        <div class="intensity-labels">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
    <div class="mood-grid" id="moodGrid"></div>
  `;
  container.appendChild(moodSection);
}

// Render text section
function renderTextSection(container) {
  const textSection = document.createElement('div');
  textSection.className = 'section entry-text-section';
  textSection.innerHTML = `
    <div class="text-header">
      <div>
        <span class="section-emoji">✍️</span>
        <span>Share your thoughts</span>
      </div>
      <div class="char-counter" id="charCounter">
        <span class="counter-emoji">📝</span>
        <span id="charCount">0</span> / <span id="charMax">500</span>
      </div>
    </div>
    <div class="text-container">
      <textarea id="entryText" placeholder="Let your thoughts flow... this is your safe space." 
                class="entry-textarea" maxlength="500"></textarea>
      <div class="text-tools">
        <div class="tool-group">
          <button class="tool-btn" id="clearBtn" title="Clear text">
            <span class="tool-emoji">🗑️</span>
          </button>
          <button class="tool-btn" id="saveDraftBtn" title="Save draft">
            <span class="tool-emoji">📝</span>
          </button>
          <button class="tool-btn" id="loadDraftBtn" title="Load draft">
            <span class="tool-emoji">📂</span>
          </button>
        </div>
        <div class="tool-group">
          <button class="tool-btn" id="boldBtn" title="Bold">
            <span class="tool-emoji">B</span>
          </button>
          <button class="tool-btn" id="italicBtn" title="Italic">
            <span class="tool-emoji">I</span>
          </button>
          <button class="tool-btn" id="quoteBtn" title="Quote">
            <span class="tool-emoji">"</span>
          </button>
        </div>
      </div>
      <div class="tags-container" id="tagsContainer"></div>
      <div class="tag-input-container">
        <input type="text" id="tagInput" class="tag-input" placeholder="Add a tag and press Enter">
      </div>
    </div>
  `;
  container.appendChild(textSection);
}

// Render actions section
function renderActionsSection(container) {
  const actionsSection = document.createElement('div');
  actionsSection.className = 'section entry-actions';
  actionsSection.innerHTML = `
    <button class="action-btn primary" id="saveEntry">
      <span class="btn-emoji">💾</span>
      <span>Save Entry</span>
    </button>
    <button class="action-btn secondary" id="analyzeBtn">
      <span class="btn-emoji">🔎</span>
      <span>Analyze</span>
    </button>
    <div class="message-area" id="saveMsg"></div>
  `;
  container.appendChild(actionsSection);
}

// Render entry footer
function renderEntryFooter(container) {
  const footer = document.createElement('div');
  footer.className = 'entry-footer';
  footer.innerHTML = `
    <div class="recent-moods">
      <div class="section-header">
        <span class="section-emoji">📊</span>
        <span>Recent Moods</span>
      </div>
      <div class="mood-history" id="moodHistory">
        <div class="loading-moods">Loading recent moods...</div>
      </div>
    </div>
  `;
  container.appendChild(footer);
}

// Initialize entry functionality
function initializeEntryFunctionality() {
  // Get DOM elements
  const entryText = document.getElementById('entryText');
  const saveEntryBtn = document.getElementById('saveEntry');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const saveMsg = document.getElementById('saveMsg');
  const moodGrid = document.getElementById('moodGrid');
  const charCount = document.getElementById('charCount');
  const charMax = document.getElementById('charMax');
  const promptBtn = document.getElementById('promptBtn');
  const promptContent = document.getElementById('promptContent');
  const promptCategory = document.getElementById('promptCategory');
  const clearBtn = document.getElementById('clearBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const loadDraftBtn = document.getElementById('loadDraftBtn');
  const moodIntensity = document.getElementById('moodIntensity');
  const moodHistory = document.getElementById('moodHistory');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const tagsContainer = document.getElementById('tagsContainer');
  const tagInput = document.getElementById('tagInput');

  // Text formatting buttons
  const boldBtn = document.getElementById('boldBtn');
  const italicBtn = document.getElementById('italicBtn');
  const quoteBtn = document.getElementById('quoteBtn');

  // Initialize variables
  let autoSaveTimer;
  let entryTags = [];

  // Enhanced writing prompts by category
  const prompts = {
    all: [
      "What's something that made you smile today?",
      "Describe a challenge you overcame recently.",
      "What are you grateful for right now?",
      "Write about a place where you feel completely at peace.",
      "What's one thing you'd like to improve about yourself?",
      "Describe a recent moment when you felt proud.",
      "What's been on your mind lately?",
      "Write about someone who inspires you.",
      "What would you tell your younger self?"
    ],
    gratitude: [
      "List three things you're grateful for today.",
      "Who is someone you're thankful to have in your life?",
      "What's a simple pleasure you enjoyed recently?",
      "Describe something beautiful you noticed today.",
      "What's a skill you're grateful to have?"
    ],
    reflection: [
      "What did you learn about yourself this week?",
      "How have you changed in the past year?",
      "What's a memory that always makes you happy?",
      "Describe a time you stepped out of your comfort zone.",
      "What's something you'd do differently if you could?"
    ],
    goals: [
      "What's a short-term goal you're working toward?",
      "Describe your ideal future in five years.",
      "What's a new skill you'd like to learn?",
      "How do you plan to achieve your biggest goal?",
      "What's one small step you can take tomorrow toward your goal?"
    ],
    emotions: [
      "What emotion have you been feeling most strongly lately?",
      "Describe a time you felt completely at peace.",
      "How do you handle stress or anxiety?",
      "Write about something that made you laugh recently.",
      "What helps you feel better when you're down?"
    ]
  };

  // Mood options with enhanced data
  const moods = [
    { k: 'happy', e: 'smiley emoji.json', color: '#FFD700' },
    { k: 'sad', e: 'Sad Emoji.json', color: '#4169E1' },
    { k: 'anxious', e: 'emoji head explosion.json', color: '#FF8C00' },
    { k: 'angry', e: 'Exploding Emoji.json', color: '#DC143C' },
    { k: 'neutral', e: 'Yelly Emoji No.json', color: '#808080' },
    { k: 'hopeful', e: 'Party.json', color: '#FF69B4' },
    { k: 'excited', e: 'smiley emoji.json', color: '#FF1744' },
    { k: 'calm', e: 'Yelly Emoji No.json', color: '#00BCD4' },
    { k: 'confused', e: 'emoji head explosion.json', color: '#9C27B0' },
    { k: 'grateful', e: 'Party.json', color: '#8BC34A' }
  ];

  // Initialize mood grid
  moods.forEach(m => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.dataset.mood = m.k;

    chip.innerHTML = `
      <lottie-player src="${m.e}" background="transparent" speed="1"
                     style="width:40px;height:40px;margin:auto;" loop autoplay>
      </lottie-player>
      <div class="chip-text">${m.k}</div>
    `;

    chip.onclick = () => {
      // Remove selected class from all chips
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      // Add selected class to clicked chip
      chip.classList.add('selected');
      // Update mood intensity color based on selection
      updateIntensityColor(m.color);
    };

    moodGrid.appendChild(chip);
  });

  // Update intensity slider color based on mood
  function updateIntensityColor(color) {
    moodIntensity.style.background = `linear-gradient(to right, rgba(255,255,255,0.2) 0%, ${color} 100%)`;
  }

  // Character counter
  function updateCharCounter() {
    const length = entryText.value.length;
    const maxLength = entryText.maxLength;
    charCount.textContent = length;

    // Update counter color based on remaining characters
    const remaining = maxLength - length;
    const counter = document.querySelector('.char-counter');
    counter.classList.remove('warning', 'danger');

    if (remaining < 50) {
      counter.classList.add('warning');
    }

    if (remaining < 20) {
      counter.classList.add('danger');
    }
  }

  // Auto-save draft with debouncing
  function saveDraft() {
    const draft = {
      text: entryText.value,
      mood: document.querySelector('.chip.selected')?.dataset.mood || null,
      intensity: moodIntensity.value,
      tags: entryTags,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('journalDraft', JSON.stringify(draft));
    showMessage('📝 Draft saved automatically', 'info');
  }

  // Load draft
  function loadDraft() {
    const draft = JSON.parse(localStorage.getItem('journalDraft') || '{}');
    if (draft.text) {
      entryText.value = draft.text;
      updateCharCounter();
    }
    if (draft.mood) {
      document.querySelector(`[data-mood="${draft.mood}"]`)?.click();
    }
    if (draft.intensity) {
      moodIntensity.value = draft.intensity;
    }
    if (draft.tags && draft.tags.length > 0) {
      entryTags = draft.tags;
      renderTags();
    }
    showMessage('📂 Draft loaded', 'info');
  }

  // Show message
  function showMessage(text, type = 'info') {
    saveMsg.textContent = text;
    saveMsg.className = 'message-area';

    if (type === 'success') {
      saveMsg.style.color = '#10b981';
    } else if (type === 'error') {
      saveMsg.style.color = '#ef4444';
    } else {
      saveMsg.style.color = 'var(--text-primary)';
    }
  }

  // Get writing prompt based on category
  promptBtn.onclick = () => {
    const category = promptCategory.value;
    const categoryPrompts = prompts[category] || prompts.all;
    const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    promptContent.textContent = randomPrompt;
    promptContent.style.display = 'block';
  };

  // Clear text
  clearBtn.onclick = () => {
    entryText.value = '';
    updateCharCounter();
    showMessage('🗑️ Text cleared', 'info');
  };

  // Text formatting functions
  function formatText(format) {
    const start = entryText.selectionStart;
    const end = entryText.selectionEnd;
    const selectedText = entryText.value.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
    }

    entryText.value = entryText.value.substring(0, start) + formattedText + entryText.value.substring(end);
    entryText.focus();
    entryText.setSelectionRange(start + formattedText.length, start + formattedText.length);
    updateCharCounter();
  }

  boldBtn.onclick = () => formatText('bold');
  italicBtn.onclick = () => formatText('italic');
  quoteBtn.onclick = () => formatText('quote');

  // Tag management
  function addTag(tag) {
    if (!tag || entryTags.includes(tag)) return;

    entryTags.push(tag);
    renderTags();
    tagInput.value = '';
  }

  function removeTag(tag) {
    entryTags = entryTags.filter(t => t !== tag);
    renderTags();
  }

  function renderTags() {
    tagsContainer.innerHTML = '';
    entryTags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'tag';
      tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
      `;
      tagsContainer.appendChild(tagElement);
    });
  }

  tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput.value.trim());
    }
  });

  // Save draft
  saveDraftBtn.onclick = saveDraft;

  // Load draft
  loadDraftBtn.onclick = loadDraft;

  // Auto-save on text change with debouncing
  entryText.addEventListener('input', () => {
    updateCharCounter();
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveDraft, 2000);
  });

  // Theme toggle
  themeToggle.onclick = () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeIcon.textContent = '☀️';
  }

  // Save entry
  saveEntryBtn.onclick = async () => {
    const text = entryText.value.trim();
    const mood = document.querySelector('.chip.selected')?.dataset.mood || 'neutral';
    const intensity = moodIntensity.value;

    if (!text) {
      showMessage('✍️ Please write something before saving.', 'error');
      return;
    }

    try {
      const res = await api('/entries', {
        method: 'post',
        data: { text, mood, intensity, tags: entryTags }
      });

      if (res && res.entry) {
        showMessage('✅ Entry saved successfully!', 'success');
        entryText.value = '';
        updateCharCounter();
        entryTags = [];
        renderTags();
        localStorage.removeItem('journalDraft'); // Clear draft after successful save
        await fetchEntries();
      } else {
        showMessage('❌ Failed to save entry.', 'error');
      }
    } catch (err) {
      console.error('Error saving entry:', err);
      showMessage('❌ Error saving entry. Please try again.', 'error');
    }
  };

  // Analyze entry
  analyzeBtn.onclick = async () => {
    const text = entryText.value.trim();
    if (!text) {
      showMessage('✍️ Write something to analyze.', 'error');
      return;
    }

    try {
      const res = await api('/analyze', {
        method: 'post',
        data: { text }
      });

      if (res) {
        const sentiment = res.sentiment || 'unknown';
        const emotions = res.emotions ? Object.keys(res.emotions).join(', ') : 'N/A';
        const personality = res.personality ? 'computed' : 'N/A';

        showMessage(`🔎 Sentiment: ${sentiment}, Emotions: ${emotions}, Personality: ${personality}`, 'info');
      } else {
        showMessage('❌ Analysis failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error analyzing entry:', err);
      showMessage('❌ Error analyzing entry. Please try again.', 'error');
    }
  };

  // Load recent moods
  async function loadRecentMoods() {
    try {
      const res = await api('/entries?limit=7');
      if (res && res.entries && res.entries.length > 0) {
        moodHistory.innerHTML = '';

        res.entries.slice(0, 5).forEach(entry => {
          const moodItem = document.createElement('div');
          moodItem.className = 'mood-history-item';

          const moodData = moods.find(m => m.k === entry.mood);
          const emoji = moodData ? moodData.k : 'neutral';

          const date = new Date(entry.createdAt);
          const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          moodItem.innerHTML = `
            <div class="mood-history-emoji">${emoji}</div>
            <div class="mood-history-date">${dateStr}</div>
          `;

          moodHistory.appendChild(moodItem);
        });
      } else {
        moodHistory.innerHTML = '<div class="loading-moods">No recent moods</div>';
      }
    } catch (err) {
      console.error('Error loading recent moods:', err);
      moodHistory.innerHTML = '<div class="loading-moods">Error loading moods</div>';
    }
  }

  // Initialize
  updateCharCounter();
  loadRecentMoods();

  // Check for existing draft
  const draft = JSON.parse(localStorage.getItem('journalDraft') || '{}');
  if (draft.text || draft.mood) {
    showMessage('📝 You have a saved draft. Click "Load Draft" to restore it.', 'info');
  }
}

function showStats() {
  const main = document.getElementById('maincard');
  main.innerHTML = `
    <div class="stats-container">
      <div class="stats-header">
        <h3 class="stats-title">
          <span class="title-emoji">✨</span>
          <span>Your Weekly Glow</span>
        </h3>
        <div class="stats-controls">
          <button class="control-btn" id="periodBtn" title="Change period">
            <span class="control-emoji">📅</span>
            <span class="control-text">Week</span>
          </button>
          <button class="control-btn" id="refreshBtn" title="Refresh data">
            <span class="control-emoji">🔄</span>
            <span class="control-text">Refresh</span>
          </button>
          <button class="control-btn" id="exportBtn" title="Export stats">
            <span class="control-emoji">📊</span>
            <span class="control-text">Export</span>
          </button>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h4 class="stat-title">Mood Distribution</h4>
            <div class="chart-container">
              <canvas id="moodChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <h4 class="stat-title">Mood Trends</h4>
            <div class="chart-container">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <h4 class="stat-title">Summary</h4>
            <div class="summary-stats" id="summaryStats">
              <div class="loading-stats">Loading summary...</div>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🌟</div>
          <div class="stat-content">
            <h4 class="stat-title">Insights</h4>
            <div class="insights" id="insights">
              <div class="loading-insights">Analyzing patterns...</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="detailed-stats">
        <div class="mood-breakdown" id="moodBreakdown">
          <h4 class="breakdown-title">
            <span class="breakdown-emoji">🎨</span>
            <span>Mood Breakdown</span>
          </h4>
          <div class="mood-list" id="moodList">
            <div class="loading-moods">Loading mood details...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Enhanced CSS for stats page with smaller cards
  const statsStyles = document.createElement('style');
  statsStyles.id = 'stats-enhanced-styles';
  statsStyles.textContent = `
    /* Stats Container */
    .stats-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
      color: white;
      min-height: calc(100vh - 100px);
      position: relative;
      overflow: visible;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
    }
    
    .stats-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
      background-size: 100px 100px;
      opacity: 0.5;
      z-index: 0;
    }
    
    /* Custom scrollbar for the entire container */
    .stats-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .stats-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .stats-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }
    
    .stats-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    /* Header Styles */
    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .stats-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2rem;
      animation: sparkle 2s ease-in-out infinite;
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    }
    
    @keyframes sparkle {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.05) rotate(5deg); }
    }
    
    .stats-controls {
      display: flex;
      gap: 0.5rem;
    }
    
    .control-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 0.8rem;
      border: none;
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .control-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .control-btn:hover::before {
      transform: translateX(0);
    }
    
    .control-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .control-btn:active {
      transform: translateY(0);
    }
    
    .control-emoji {
      font-size: 0.9rem;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }
    
    .control-text {
      font-weight: 600;
    }
    
    /* Stats Grid - More compact layout */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.8rem;
      margin-bottom: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 0.8rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .stat-card:hover::after {
      opacity: 1;
    }
    
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .stat-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      display: block;
      text-align: center;
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
    }
    
    .stat-content {
      color: white;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .stat-title {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      text-align: center;
    }
    
    .chart-container {
      position: relative;
      height: 140px;
      width: 100%;
      flex: 1;
    }
    
    /* Summary Stats - More compact */
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      flex: 1;
    }
    
    .summary-item {
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      text-align: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .summary-item::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .summary-item:hover::after {
      opacity: 1;
    }
    
    .summary-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.03);
    }
    
    .summary-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 0.3rem;
    }
    
    .summary-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
    }
    
    /* Insights - More compact */
    .insights {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.3rem;
      max-height: 180px;
    }
    
    .insights::-webkit-scrollbar {
      width: 6px;
    }
    
    .insights::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .insights::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .insight-item {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      font-size: 0.8rem;
      color: white;
      animation: slideIn 0.5s ease-out;
      border-left: 3px solid;
      transition: all 0.3s ease;
    }
    
    .insight-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(3px);
    }
    
    .insight-item.positive {
      border-left-color: #4caf50;
      background: linear-gradient(to right, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1));
    }
    
    .insight-item.neutral {
      border-left-color: #ff9800;
      background: linear-gradient(to right, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1));
    }
    
    .insight-item.concern {
      border-left-color: #f44336;
      background: linear-gradient(to right, rgba(244, 67, 54, 0.2), rgba(244, 67, 54, 0.1));
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-15px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Detailed Stats - More compact */
    .detailed-stats {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 0.8rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .breakdown-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.8rem 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: white;
    }
    
    .breakdown-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
    }
    
    .mood-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.5rem;
    }
    
    .mood-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .mood-item::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .mood-item:hover::after {
      opacity: 1;
    }
    
    .mood-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(5px);
    }
    
    .mood-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .mood-emoji {
      font-size: 1.2rem;
    }
    
    .mood-name {
      font-weight: 600;
      color: white;
    }
    
    .mood-stats {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .mood-count {
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
    }
    
    .mood-percentage {
      font-size: 0.7rem;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 0.5rem;
    }
    
    /* Loading States */
    .loading-stats, .loading-insights, .loading-moods {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.8);
      font-style: italic;
      padding: 1.5rem;
      text-align: center;
    }
    
    .loading-stats::before, .loading-insights::before, .loading-moods::before {
      content: '';
      width: 30px;
      height: 30px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 0.5rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* No Data Message */
    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .no-data-emoji {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      opacity: 0.8;
    }
    
    .no-data-text {
      font-size: 0.9rem;
      max-width: 250px;
      line-height: 1.5;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .stats-container {
        padding: 0.8rem;
        gap: 0.8rem;
      }
      
      .stats-header {
        flex-direction: column;
        gap: 0.8rem;
        align-items: stretch;
      }
      
      .stats-controls {
        justify-content: center;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 0.8rem;
      }
      
      .summary-stats {
        grid-template-columns: 1fr;
      }
      
      .mood-list {
        grid-template-columns: 1fr;
      }
      
      .stats-title {
        font-size: 1.5rem;
      }
      
      .title-emoji {
        font-size: 1.8rem;
      }
    }
    
    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .stat-card {
        padding: 0.6rem;
      }
      
      .chart-container {
        height: 120px;
      }
      
      .insights {
        max-height: 150px;
      }
      
      .detailed-stats {
        padding: 0.6rem;
      }
      
      .breakdown-title {
        font-size: 1rem;
      }
    }
  `;

  // Only add styles if not already present
  if (!document.getElementById('stats-enhanced-styles')) {
    document.head.appendChild(statsStyles);
  }

  // Initialize variables
  let currentPeriod = 'week';
  let moodData = null;
  let trendData = null;

  // Add mouse tracking for interactive hover effects
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.stat-card, .summary-item, .mood-item');

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    });
  });

  // Fetch and display stats
  async function loadStats(period = 'week') {
    try {
      const res = await api(`/stats/${period}`);

      if (!res || !res.stats) {
        showNoDataMessage();
        return;
      }

      moodData = res.stats;
      await renderCharts();
      await renderSummary();
      await renderInsights();
      await renderMoodBreakdown();

    } catch (err) {
      console.error('Error loading stats:', err);
      showErrorMessage();
    }
  }

  // Show no data message
  function showNoDataMessage() {
    document.getElementById('summaryStats').innerHTML = `
      <div class="no-data-message">
        <div class="no-data-emoji">📊</div>
        <div class="no-data-text">No data available. Add some journal entries to see your weekly mood summary!</div>
      </div>
    `;

    document.getElementById('insights').innerHTML = `
      <div class="no-data-message">
        <div class="no-data-emoji">🔍</div>
        <div class="no-data-text">Start journaling to unlock personalized insights!</div>
      </div>
    `;

    document.getElementById('moodList').innerHTML = `
      <div class="no-data-message">
        <div class="no-data-emoji">📝</div>
        <div class="no-data-text">No mood data yet. Begin your journey today!</div>
      </div>
    `;
  }

  // Show error message
  function showErrorMessage() {
    document.getElementById('summaryStats').innerHTML = `
      <div class="no-data-message">
        <div class="no-data-emoji">❌</div>
        <div class="no-data-text">Error loading statistics. Please try again.</div>
      </div>
    `;
  }

  // Render charts with smaller size
  async function renderCharts() {
    // Destroy previous charts if they exist
    if (window._moodChart) window._moodChart.destroy();
    if (window._trendChart) window._trendChart.destroy();

    // Mood Distribution Chart
    const moodCtx = document.getElementById('moodChart').getContext('2d');
    const labels = moodData.map(s => s.mood);
    const data = moodData.map(s => s.count);

    window._moodChart = new Chart(moodCtx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'white',
              font: { size: 10, weight: 'bold' },
              padding: 10
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleFont: { weight: 'bold' },
            bodyColor: '#fff',
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.raw / total) * 100).toFixed(1);
                return `${context.label}: ${context.raw} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    // Trend Chart (mock data for demonstration)
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    const trendLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trendDatasets = [
      {
        label: 'Happy',
        data: [3, 5, 4, 7, 6, 8, 9],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        borderWidth: 3
      },
      {
        label: 'Sad',
        data: [2, 1, 3, 1, 2, 1, 0],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        borderWidth: 3
      }
    ];

    window._trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendLabels,
        datasets: trendDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'white',
              font: { size: 10, weight: 'bold' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleFont: { weight: 'bold' },
            bodyColor: '#fff'
          }
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 10, weight: 'bold' }
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 10, weight: 'bold' }
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
  }

  // Render summary statistics with more compact layout
  async function renderSummary() {
    const totalEntries = moodData.reduce((sum, mood) => sum + mood.count, 0);
    const mostFrequent = moodData.reduce((max, mood) =>
      mood.count > max.count ? mood : max, moodData[0]);
    const averageEntries = Math.round(totalEntries / 7);
    const moodVariety = moodData.length;

    document.getElementById('summaryStats').innerHTML = `
      <div class="summary-item">
        <div class="summary-label">Total</div>
        <div class="summary-value">${totalEntries}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Daily Avg</div>
        <div class="summary-value">${averageEntries}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Top Mood</div>
        <div class="summary-value">${mostFrequent.mood}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Variety</div>
        <div class="summary-value">${moodVariety}</div>
      </div>
    `;
  }

  // Render insights with more compact text
  async function renderInsights() {
    const insights = generateInsights();

    document.getElementById('insights').innerHTML = insights.map(insight => `
      <div class="insight-item ${insight.type}">
        ${insight.icon} ${insight.text}
      </div>
    `).join('');
  }

  // Generate insights based on mood data
  function generateInsights() {
    const insights = [];
    const totalEntries = moodData.reduce((sum, mood) => sum + mood.count, 0);

    // Positive insight
    const happyMoods = moodData.filter(m =>
      ['happy', 'hopeful'].includes(m.mood.toLowerCase())
    );
    const happyPercentage = (happyMoods.reduce((sum, m) => sum + m.count, 0) / totalEntries) * 100;

    if (happyPercentage > 50) {
      insights.push({
        type: 'positive',
        icon: '😊',
        text: `Great! You've been happy ${happyPercentage.toFixed(0)}% of the time!`
      });
    }

    // Concern insight
    const negativeMoods = moodData.filter(m =>
      ['sad', 'anxious', 'angry'].includes(m.mood.toLowerCase())
    );
    const negativePercentage = (negativeMoods.reduce((sum, m) => sum + m.count, 0) / totalEntries) * 100;

    if (negativePercentage > 40) {
      insights.push({
        type: 'concern',
        icon: '💙',
        text: `Try relaxation techniques when feeling overwhelmed`
      });
    }

    // Neutral insight
    insights.push({
      type: 'neutral',
      icon: '📈',
      text: `Consistent journaling helps track patterns`
    });

    return insights;
  }

  // Render mood breakdown with more compact layout
  async function renderMoodBreakdown() {
    const totalEntries = moodData.reduce((sum, mood) => sum + mood.count, 0);

    document.getElementById('moodList').innerHTML = moodData.map(mood => {
      const percentage = ((mood.count / totalEntries) * 100).toFixed(1);
      const moodEmojis = {
        happy: '😊',
        sad: '😢',
        anxious: '😰',
        angry: '😠',
        neutral: '😐',
        hopeful: '🤗'
      };

      return `
        <div class="mood-item">
          <div class="mood-info">
            <span class="mood-emoji">${moodEmojis[mood.mood.toLowerCase()] || '😊'}</span>
            <span class="mood-name">${mood.mood}</span>
          </div>
          <div class="mood-stats">
            <span class="mood-count">${mood.count}</span>
            <span class="mood-percentage">${percentage}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Export stats functionality
  function exportStats() {
    if (!moodData) return;

    const exportData = {
      period: currentPeriod,
      generated: new Date().toISOString(),
      stats: moodData,
      summary: {
        totalEntries: moodData.reduce((sum, mood) => sum + mood.count, 0),
        mostFrequent: moodData.reduce((max, mood) =>
          mood.count > max.count ? mood : max, moodData[0]).mood
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-stats-${currentPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success notification
    showNotification('Stats exported successfully!', 'success');
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
      color: white;
      padding: 0.8rem 1.2rem;
      border-radius: 0.8rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
      font-size: 0.8rem;
      backdrop-filter: blur(10px);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add slide animation
    const slideStyle = document.createElement('style');
    slideStyle.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(slideStyle);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Event listeners
  document.getElementById('refreshBtn').addEventListener('click', () => {
    // Show loading state
    const refreshBtn = document.getElementById('refreshBtn');
    const originalContent = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<span class="control-emoji">⏳</span><span class="control-text">Loading</span>';
    refreshBtn.disabled = true;

    loadStats(currentPeriod).then(() => {
      // Reset button
      refreshBtn.innerHTML = originalContent;
      refreshBtn.disabled = false;

      // Show success notification
      showNotification('Stats refreshed successfully!', 'success');
    }).catch(() => {
      // Reset button
      refreshBtn.innerHTML = originalContent;
      refreshBtn.disabled = false;
    });
  });

  document.getElementById('exportBtn').addEventListener('click', exportStats);

  document.getElementById('periodBtn').addEventListener('click', () => {
    const periods = ['week', 'month', 'year'];
    const currentIndex = periods.indexOf(currentPeriod);
    currentPeriod = periods[(currentIndex + 1) % periods.length];

    document.querySelector('#periodBtn .control-text').textContent =
      currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1);

    loadStats(currentPeriod);
  });

  // Load initial data
  loadStats(currentPeriod);
}

// 🌟 Enhanced Professional Help & Support Page
function showHelp() {
  const main = document.getElementById('maincard');
  main.innerHTML = `
    <div class="help-container">
      <div class="help-header">
        <h2 class="help-title">
          <span class="title-emoji">🩺</span>
          <span>Gentle Support & Care</span>
        </h2>
        <div class="help-subtitle">Resources for your mental wellness journey</div>
      </div>
      
      <div class="help-tabs">
        <button class="tab-btn active" data-tab="emergency">
          <span class="tab-emoji">🚨</span>
          <span>Emergency</span>
        </button>
        <button class="tab-btn" data-tab="resources">
          <span class="tab-emoji">📚</span>
          <span>Resources</span>
        </button>
        <button class="tab-btn" data-tab="selfcare">
          <span class="tab-emoji">🧘‍♀️</span>
          <span>Self-Care</span>
        </button>
        <button class="tab-btn" data-tab="community">
          <span class="tab-emoji">🤝</span>
          <span>Community</span>
        </button>
      </div>
      
      <div class="tab-content">
        <!-- Emergency Tab -->
        <div class="tab-pane active" id="emergency">
          <div class="emergency-banner">
            <div class="emergency-content">
              <h3>Need Immediate Help?</h3>
              <p>If you're in crisis or having thoughts of self-harm, please reach out immediately.</p>
              <button class="emergency-btn" id="crisisBtn">
                <span class="btn-emoji">🆘</span>
                <span>Crisis Helpline</span>
              </button>
            </div>
          </div>
          
          <div class="help-cards">
            <div class="help-card">
              <div class="card-icon">📞</div>
              <h4>Hotlines</h4>
              <p>24/7 confidential support for immediate assistance</p>
              <div class="card-links">
                <a href="tel:988" class="card-link">988 Suicide & Crisis Lifeline</a>
                <a href="tel:1-800-273-8255" class="card-link">1-800-273-TALK</a>
              </div>
            </div>
            
            <div class="help-card">
              <div class="card-icon">💬</div>
              <h4>Text Support</h4>
              <p>Connect with a crisis counselor via text message</p>
              <div class="card-links">
                <a href="sms:741741" class="card-link">Text HOME to 741741</a>
              </div>
            </div>
            
            <div class="help-card">
              <div class="card-icon">🌐</div>
              <h4>Online Chat</h4>
              <p>Connect with trained volunteers online</p>
              <div class="card-links">
                <a href="https://www.imalive.org/" target="_blank" class="card-link">iAlive</a>
                <a href="https://www.crisistextline.org/" target="_blank" class="card-link">Crisis Text Line</a>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Resources Tab -->
        <div class="tab-pane" id="resources">
          <div class="resource-categories">
            <div class="category-section">
              <h3 class="category-title">
                <span class="category-emoji">🌍</span>
                <span>Global Organizations</span>
              </h3>
              <div class="resource-list">
                <div class="resource-item">
                  <div class="resource-info">
                    <h4>WHO Mental Health</h4>
                    <p>World Health Organization's mental health resources and information</p>
                  </div>
                  <a href="https://www.who.int/health-topics/mental-health" target="_blank" class="resource-link">
                    <span class="link-emoji">🔗</span>
                  </a>
                </div>
                
                <div class="resource-item">
                  <div class="resource-info">
                    <h4>Mental Health America</h4>
                    <p>Screening tools, resources, and advocacy information</p>
                  </div>
                  <a href="https://www.mhanational.org/" target="_blank" class="resource-link">
                    <span class="link-emoji">🔗</span>
                  </a>
                </div>
                
                <div class="resource-item">
                  <div class="resource-info">
                    <h4>NAMI</h4>
                    <p>National Alliance on Mental Illness support and education</p>
                  </div>
                  <a href="https://www.nami.org/" target="_blank" class="resource-link">
                    <span class="link-emoji">🔗</span>
                  </a>
                </div>
              </div>
            </div>
            
            <div class="category-section">
              <h3 class="category-title">
                <span class="category-emoji">🤝</span>
                <span>Support Communities</span>
              </h3>
              <div class="resource-list">
                <div class="resource-item">
                  <div class="resource-info">
                    <h4>Befrienders Worldwide</h4>
                    <p>Global network of emotional support helplines</p>
                  </div>
                  <a href="https://www.befrienders.org/" target="_blank" class="resource-link">
                    <span class="link-emoji">🔗</span>
                  </a>
                </div>
                
                <div class="resource-item">
                  <div class="resource-info">
                    <h4>7 Cups</h4>
                    <p>Free 24/7 emotional support and counseling</p>
                  </div>
                  <a href="https://www.7cups.com/" target="_blank" class="resource-link">
                    <span class="link-emoji">🔗</span>
                  </a>
                </div>
                
                <div class="resource-item">
                  <div class="resource-info">
                    <h4>Daily Strength</h4>
                    <p>Peer support community with various focus groups</p>
                  </div>
                  <a href="https://www.dailystrength.org/" target="_blank" class="resource-link">
                    <span class="link-emoji">🔗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Self-Care Tab -->
        <div class="tab-pane" id="selfcare">
          <div class="selfcare-grid">
            <div class="selfcare-card">
              <div class="card-header">
                <span class="card-emoji">🧘</span>
                <h3>Mindfulness</h3>
              </div>
              <p>Practice being present and reducing stress through mindfulness techniques</p>
              <div class="selfcare-tips">
                <div class="tip-item">
                  <span class="tip-emoji">📱</span>
                  <span>Try apps like Headspace or Calm for guided meditation</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">⏰</span>
                  <span>Start with just 5 minutes of daily practice</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">🌬️</span>
                  <span>Focus on your breathing when feeling overwhelmed</span>
                </div>
              </div>
            </div>
            
            <div class="selfcare-card">
              <div class="card-header">
                <span class="card-emoji">🏃</span>
                <h3>Physical Activity</h3>
              </div>
              <p>Regular exercise can significantly improve mood and reduce anxiety</p>
              <div class="selfcare-tips">
                <div class="tip-item">
                  <span class="tip-emoji">🚶</span>
                  <span>Even a 15-minute walk can boost your mood</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">🧘</span>
                  <span>Try yoga or tai chi for mind-body connection</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">🎵</span>
                  <span>Dancing to your favorite music counts too!</span>
                </div>
              </div>
            </div>
            
            <div class="selfcare-card">
              <div class="card-header">
                <span class="card-emoji">📝</span>
                <h3>Journaling</h3>
              </div>
              <p>Expressing thoughts and feelings can provide clarity and relief</p>
              <div class="selfcare-tips">
                <div class="tip-item">
                  <span class="tip-emoji">🤔</span>
                  <span>Try gratitude journaling - list 3 things you're grateful for</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">🎯</span>
                  <span>Write down your worries to get them out of your head</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">📅</span>
                  <span>Make it a daily habit, even if just for a few minutes</span>
                </div>
              </div>
            </div>
            
            <div class="selfcare-card">
              <div class="card-header">
                <span class="card-emoji">😴</span>
                <h3>Sleep Hygiene</h3>
              </div>
              <p>Quality sleep is essential for mental health and emotional regulation</p>
              <div class="selfcare-tips">
                <div class="tip-item">
                  <span class="tip-emoji">📱</span>
                  <span>Avoid screens 30 minutes before bedtime</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">🌡️</span>
                  <span>Keep your bedroom cool and dark</span>
                </div>
                <div class="tip-item">
                  <span class="tip-emoji">⏰</span>
                  <span>Try to maintain a consistent sleep schedule</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Community Tab -->
        <div class="tab-pane" id="community">
          <div class="community-section">
            <div class="community-header">
              <h3 class="community-title">
                <span class="title-emoji">🤝</span>
                <span>Join Our Supportive Community</span>
              </h3>
              <p>Connect with others who understand what you're going through</p>
            </div>
            
            <div class="community-options">
              <div class="community-card">
                <div class="card-icon">💬</div>
                <h4>Discussion Forums</h4>
                <p>Share experiences and get advice from peers</p>
                <button class="community-btn" id="forumBtn">Join Forums</button>
              </div>
              
              <div class="community-card">
                <div class="card-icon">📅</div>
                <h4>Support Groups</h4>
                <p>Regular virtual meetings for specific concerns</p>
                <button class="community-btn" id="groupsBtn">Find Groups</button>
              </div>
              
              <div class="community-card">
                <div class="card-icon">📱</div>
                <h4>Mobile App</h4>
                <p>Access support resources on the go</p>
                <button class="community-btn" id="appBtn">Download App</button>
              </div>
            </div>
          </div>
          
          <div class="video-section">
            <h3 class="section-title">
              <span class="section-emoji">🎥</span>
              <span>Helpful Videos</span>
            </h3>
            <div class="video-grid">
              <div class="video-item">
                <div class="video-thumbnail">
                  <iframe 
                    src="https://www.youtube.com/embed/ZToicYcHIOU" 
                    frameborder="0" 
                    allowfullscreen
                    class="video-iframe">
                  </iframe>
                </div>
                <h4>Understanding Anxiety</h4>
                <p>Learn about anxiety symptoms and coping strategies</p>
              </div>
              
              <div class="video-item">
                <div class="video-thumbnail">
                  <iframe 
                    src="https://www.youtube.com/embed/f77SKdyn-1Y" 
                    frameborder="0" 
                    allowfullscreen
                    class="video-iframe">
                  </iframe>
                </div>
                <h4>Mindfulness for Beginners</h4>
                <p>A simple introduction to mindfulness practice</p>
              </div>
              
              <div class="video-item">
                <div class="video-thumbnail">
                  <iframe 
                    src="https://www.youtube.com/embed/2Lz0VOltZKA" 
                    frameborder="0" 
                    allowfullscreen
                    class="video-iframe">
                  </iframe>
                </div>
                <h4>Building Resilience</h4>
                <p>Strategies to strengthen your emotional resilience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Enhanced CSS for help page
  const helpStyles = document.createElement('style');
  helpStyles.id = 'help-enhanced-styles';
  helpStyles.textContent = `
    /* Help Container */
    .help-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      border-radius: 1.5rem;
      box-shadow: 0 15px 35px rgba(139, 92, 246, 0.3);
      color: white;
      min-height: 600px;
      position: relative;
      overflow: visible;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }
    
    /* Custom scrollbar for the entire container */
    .help-container::-webkit-scrollbar {
      width: 10px;
    }
    
    .help-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }
    
    .help-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 5px;
    }
    
    .help-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .help-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
      background-size: 100px 100px;
      opacity: 0.5;
      z-index: 0;
    }
    
    /* Header Styles */
    .help-header {
      text-align: center;
      margin-bottom: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .help-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2.3rem;
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(5deg); }
    }
    
    .help-subtitle {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      max-width: 600px;
      margin: 0 auto;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    /* Tab Styles */
    .help-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 0.5rem;
      border-radius: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 1;
    }
    
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 1.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .tab-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .tab-btn:hover::before {
      transform: translateX(0);
    }
    
    .tab-btn:hover {
      color: white;
      transform: translateY(-2px);
    }
    
    .tab-btn.active {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .tab-emoji {
      font-size: 1.2rem;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }
    
    /* Tab Content */
    .tab-content {
      position: relative;
      z-index: 1;
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    .tab-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .tab-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .tab-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .tab-pane {
      display: none;
      animation: fadeIn 0.5s ease;
    }
    
    .tab-pane.active {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Emergency Tab Styles */
    .emergency-banner {
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      border-radius: 1.5rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px rgba(238, 90, 111, 0.3);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .emergency-banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
      background-size: 100px 100px;
      opacity: 0.3;
    }
    
    .emergency-content {
      position: relative;
      z-index: 1;
    }
    
    .emergency-content h3 {
      margin: 0 0 0.8rem;
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .emergency-content p {
      margin: 0 0 1.2rem;
      font-size: 1rem;
      opacity: 0.95;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .emergency-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 2rem;
      background: white;
      color: #ee5a6f;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      margin: 0 auto;
    }
    
    .emergency-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
    
    .btn-emoji {
      font-size: 1.1rem;
    }
    
    .help-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    
    .help-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .help-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .help-card:hover::after {
      opacity: 1;
    }
    
    .help-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .card-icon {
      font-size: 2rem;
      margin-bottom: 0.8rem;
      display: block;
      text-align: center;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .help-card h4 {
      margin: 0 0 0.8rem;
      font-size: 1.1rem;
      text-align: center;
      color: white;
      font-weight: 600;
    }
    
    .help-card p {
      margin: 0 0 1rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      line-height: 1.5;
    }
    
    .card-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: auto;
    }
    
    .card-link {
      display: block;
      padding: 0.6rem 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .card-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    /* Resources Tab Styles */
    .resource-categories {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .category-section {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .category-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem;
      font-size: 1.3rem;
      color: white;
      font-weight: 600;
    }
    
    .category-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .resource-list {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    
    .resource-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .resource-item::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .resource-item:hover::after {
      opacity: 1;
    }
    
    .resource-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(5px);
    }
    
    .resource-info {
      flex: 1;
    }
    
    .resource-info h4 {
      margin: 0 0 0.4rem;
      font-size: 1.1rem;
      color: white;
      font-weight: 600;
    }
    
    .resource-info p {
      margin: 0;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    .resource-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 35px;
      height: 35px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .resource-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    .link-emoji {
      font-size: 1rem;
    }
    
    /* Self-Care Tab Styles */
    .selfcare-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .selfcare-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .selfcare-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .selfcare-card:hover::after {
      opacity: 1;
    }
    
    .selfcare-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.8rem;
    }
    
    .card-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .card-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: white;
      font-weight: 600;
    }
    
    .selfcare-card p {
      margin: 0 0 1rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
    }
    
    .selfcare-tips {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: auto;
    }
    
    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.6rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.6rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    .tip-emoji {
      font-size: 1rem;
      flex-shrink: 0;
    }
    
    /* Community Tab Styles */
    .community-section {
      margin-bottom: 1.5rem;
    }
    
    .community-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .community-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0 0 0.8rem;
      font-size: 1.5rem;
      color: white;
      font-weight: 600;
    }
    
    .community-header p {
      margin: 0;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .community-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .community-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .community-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .community-card:hover::after {
      opacity: 1;
    }
    
    .community-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .community-btn {
      margin-top: auto;
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 2rem;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .community-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    
    .video-section {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem;
      font-size: 1.3rem;
      color: white;
      font-weight: 600;
    }
    
    .section-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    
    .video-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      padding: 0.8rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .video-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-3px);
    }
    
    .video-thumbnail {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      margin-bottom: 0.8rem;
      border-radius: 0.6rem;
      overflow: hidden;
    }
    
    .video-iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 0.6rem;
    }
    
    .video-item h4 {
      margin: 0 0 0.4rem;
      font-size: 1.1rem;
      color: white;
      font-weight: 600;
    }
    
    .video-item p {
      margin: 0;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .help-container {
        padding: 0.8rem;
        gap: 0.8rem;
      }
      
      .help-tabs {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .tab-btn {
        flex: 1;
        min-width: calc(50% - 0.25rem);
        justify-content: center;
      }
      
      .help-cards {
        grid-template-columns: 1fr;
      }
      
      .selfcare-grid {
        grid-template-columns: 1fr;
      }
      
      .community-options {
        grid-template-columns: 1fr;
      }
      
      .video-grid {
        grid-template-columns: 1fr;
      }
      
      .resource-item {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .resource-link {
        align-self: center;
      }
      
      .help-title {
        font-size: 1.8rem;
      }
      
      .title-emoji {
        font-size: 2rem;
      }
    }
  `;

  // Only add styles if not already present
  if (!document.getElementById('help-enhanced-styles')) {
    document.head.appendChild(helpStyles);
  }

  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');

      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Add mouse tracking for interactive hover effects
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.help-card, .resource-item, .selfcare-card, .community-card');

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    });
  });

  // Crisis button functionality
  document.getElementById('crisisBtn').addEventListener('click', () => {
    // In a real app, this would open a crisis hotline or chat
    const crisisModal = document.createElement('div');
    crisisModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    `;

    crisisModal.innerHTML = `
      <div style="
        background: white;
        border-radius: 1.5rem;
        padding: 1.5rem;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #8b5cf6, #a855f7);
        "></div>
        <h3 style="margin: 0 0 1rem; color: #333; font-size: 1.3rem;">Crisis Support</h3>
        <p style="margin: 0 0 1.5rem; color: #666; line-height: 1.6; font-size: 0.9rem;">
          You can call or text 988 anytime in the US and Canada. 
          In the UK, you can call 111. 
          These services are free, confidential, and available 24/7.
        </p>
        <div style="display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap;">
          <button id="callBtn" style="
            padding: 0.6rem 1.2rem;
            border: none;
            border-radius: 2rem;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            font-size: 0.9rem;
          ">Call</button>
          <button id="textBtn" style="
            padding: 0.6rem 1.2rem;
            border: none;
            border-radius: 2rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            font-size: 0.9rem;
          ">Text</button>
          <button id="closeModal" style="
            padding: 0.6rem 1.2rem;
            border: none;
            border-radius: 2rem;
            background: #f5f5f5;
            color: #333;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
          ">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(crisisModal);

    // Add event listeners to modal buttons
    document.getElementById('callBtn').addEventListener('click', () => {
      window.location.href = 'tel:988';
    });

    document.getElementById('textBtn').addEventListener('click', () => {
      window.location.href = 'sms:988';
    });

    document.getElementById('closeModal').addEventListener('click', () => {
      document.body.removeChild(crisisModal);
    });

    // Close modal when clicking outside
    crisisModal.addEventListener('click', (e) => {
      if (e.target === crisisModal) {
        document.body.removeChild(crisisModal);
      }
    });
  });

  // Community button functionality
  document.getElementById('forumBtn').addEventListener('click', () => {
    // In a real app, this would navigate to forum
    showNotification('Forum feature coming soon! Check back for updates.', 'info');
  });

  document.getElementById('groupsBtn').addEventListener('click', () => {
    // In a real app, this would navigate to support groups
    showNotification('Support groups feature coming soon! Check back for updates.', 'info');
  });

  document.getElementById('appBtn').addEventListener('click', () => {
    // In a real app, this would navigate to app store
    showNotification('Mobile app coming soon! Check back for updates.', 'info');
  });

  // Helper function to show notifications
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'info' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : 'linear-gradient(135deg, #43e97b, #38f9d7)'};
      color: white;
      padding: 0.8rem 1.2rem;
      border-radius: 0.8rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
      font-size: 0.85rem;
      backdrop-filter: blur(10px);
      max-width: 250px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add slide animation
    const slideStyle = document.createElement('style');
    slideStyle.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(slideStyle);

    // Remove the notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

function showSounds() {
  const main = document.getElementById('maincard');
  main.innerHTML = `
    <div class="sounds-container">
      <div class="sounds-header">
        <h2 class="sounds-title">
          <span class="title-emoji">🎧</span>
          <span>Relaxing Sounds</span>
        </h2>
        <div class="sounds-subtitle">Choose perfect ambiance for your mood</div>
      </div>
      
      <div class="sounds-player">
        <div class="player-main">
          <div class="current-track" id="currentTrack">
            <div class="track-info">
              <div class="track-emoji">🎵</div>
              <div class="track-details">
                <div class="track-name" id="trackName">Select a sound</div>
                <div class="track-artist" id="trackArtist">Mood Garden</div>
              </div>
            </div>
            <div class="track-duration">
              <span id="currentTime">0:00</span> / <span id="totalTime">0:00</span>
            </div>
          </div>          
          <div class="player-controls">
            <button class="control-btn" id="prevBtn" title="Previous">
              <span class="control-emoji">⏮️</span>
            </button>
            <button class="control-btn primary" id="playPauseBtn" title="Play/Pause">
              <span class="control-emoji" id="playPauseIcon">▶️</span>
            </button>
            <button class="control-btn" id="nextBtn" title="Next">
              <span class="control-emoji">⏭️</span>
            </button>
          </div>          
          <div class="player-progress">
            <div class="progress-bar" id="progressBar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
          </div>          
          <div class="player-extras">
            <button class="extra-btn" id="shuffleBtn" title="Shuffle">
              <span class="extra-emoji" id="shuffleIcon">🔀</span>
            </button>
            <button class="extra-btn" id="repeatBtn" title="Repeat">
              <span class="extra-emoji" id="repeatIcon">🔁</span>
            </button>
            <button class="extra-btn" id="volumeBtn" title="Volume">
              <span class="extra-emoji" id="volumeIcon">🔊</span>
            </button>
          </div>          
          <div class="volume-slider" id="volumeSlider" style="display: none;">
            <input type="range" id="volumeRange" min="0" max="100" value="70" class="slider">
          </div>
        </div>
        
        <div class="player-visualizer" id="visualizer">
          <div class="visualizer-bar"></div>
          <div class="visualizer-bar"></div>
          <div class="visualizer-bar"></div>
          <div class="visualizer-bar"></div>
          <div class="visualizer-bar"></div>
          <div class="visualizer-bar"></div>
          <div class="visualizer-bar"></div>
        </div>
      </div>
      
      <div class="sounds-categories">
        <div class="category-tabs">
          <button class="category-tab active" data-category="all">
            <span class="tab-emoji">🎵</span>
            <span>All</span>
          </button>
          <button class="category-tab" data-category="nature">
            <span class="tab-emoji">🌿</span>
            <span>Nature</span>
          </button>
          <button class="category-tab" data-category="ambient">
            <span class="tab-emoji">🌌</span>
            <span>Ambient</span>
          </button>
          <button class="category-tab" data-category="meditation">
            <span class="tab-emoji">🧘</span>
            <span>Meditation</span>
          </button>
          <button class="category-tab" data-category="music">
            <span class="tab-emoji">🎶</span>
            <span>Music</span>
          </button>
        </div>
        
        <div class="sounds-grid" id="soundsGrid">
          <div class="loading-sounds">Loading sounds...</div>
        </div>
      </div>
      
      <div class="player-playlist" id="playlist">
        <div class="playlist-header">
          <h3 class="playlist-title">
            <span class="title-emoji">📋</span>
            <span>Playlist</span>
          </h3>
          <button class="playlist-btn" id="clearPlaylistBtn" title="Clear playlist">
            <span class="btn-emoji">🗑️</span>
          </button>
        </div>
        <div class="playlist-items" id="playlistItems">
          <div class="empty-playlist">Your playlist is empty. Add sounds to create a custom playlist.</div>
        </div>
      </div>
    </div>
  `;

  // Enhanced CSS for sounds page with smaller size
  const soundsStyles = document.createElement('style');
  soundsStyles.id = 'sounds-enhanced-styles';
  soundsStyles.textContent = `
    .sounds-container {
      padding: 15px;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      border-radius: 15px;
      box-shadow: 0 15px 30px rgba(139, 92, 246, 0.3);
      color: white;
      min-height: calc(100vh - 100px);
      position: relative;
      overflow: visible;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
    }
    
    /* Custom scrollbar for the entire container */
    .sounds-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .sounds-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .sounds-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }
    
    .sounds-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    /* Header Styles */
    .sounds-header {
      text-align: center;
      margin-bottom: 15px;
      position: relative;
      z-index: 1;
    }
    
    .sounds-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 24px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .sounds-subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 5px;
    }
    
    /* Player Styles - More Compact */
    .sounds-player {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .player-main {
      margin-bottom: 12px;
    }
    
    .current-track {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .track-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .track-emoji {
      font-size: 20px;
      animation: spin 20s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .track-details {
      display: flex;
      flex-direction: column;
    }
    
    .track-name {
      font-size: 16px;
      font-weight: 600;
    }
    
    .track-artist {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .track-duration {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .player-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .control-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .control-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    
    .control-btn.primary {
      width: 45px;
      height: 45px;
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    }
    
    .control-btn.primary:hover {
      background: rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .control-emoji {
      font-size: 18px;
    }
    
    .player-progress {
      margin-bottom: 12px;
    }
    
    .progress-bar {
      height: 5px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      cursor: pointer;
    }
    
    .progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #ff9a9e, #fad0c4);
      border-radius: 3px;
      transition: width 0.1s linear;
    }
    
    .player-extras {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
    }
    
    .extra-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .extra-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    
    .extra-btn.active {
      background: rgba(255, 255, 255, 0.25);
    }
    
    .extra-emoji {
      font-size: 16px;
    }
    
    .volume-slider {
      margin-top: 8px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }
    
    .slider {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;
      -webkit-appearance: none;
    }
    
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
    }
    
    .slider::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      border: none;
    }
    
    .player-visualizer {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 30px;
      margin-top: 10px;
    }
    
    .visualizer-bar {
      width: 6px;
      background: linear-gradient(to top, #ff9a9e, #fad0c4);
      border-radius: 3px;
      transition: height 0.1s ease;
    }
    
    /* Categories Section - More Compact */
    .sounds-categories {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }
    
    .category-tabs {
      display: flex;
      justify-content: center;
      gap: 5px;
      margin-bottom: 12px;
      background: rgba(255, 255, 255, 0.1);
      padding: 8px;
      border-radius: 10px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    }
    
    .category-tab {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 10px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .category-tab:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .category-tab.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    .tab-emoji {
      font-size: 14px;
    }
    
    /* Sounds Grid - More Compact */
    .sounds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .sound-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      height: 100%;
    }
    
    .sound-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .sound-card:hover::after {
      opacity: 1;
    }
    
    .sound-card:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    }
    
    .sound-card.playing {
      background: rgba(255, 255, 255, 0.25);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
    
    .sound-emoji {
      font-size: 20px;
      margin-bottom: 6px;
    }
    
    .sound-name {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .sound-duration {
      font-size: 11px;
      opacity: 0.7;
    }
    
    .sound-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    
    .sound-action-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 12px;
    }
    
    .sound-action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    
    /* Playlist Section - More Compact */
    .player-playlist {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 12px;
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex: 1;
      display: flex;
      flex-direction: column;
      max-height: 180px;
    }
    
    .playlist-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .playlist-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .playlist-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .playlist-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    
    .btn-emoji {
      font-size: 14px;
    }
    
    .playlist-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      overflow-y: auto;
    }
    
    .playlist-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .playlist-item:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .playlist-item-emoji {
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .playlist-item-name {
      flex: 1;
      font-size: 13px;
      text-align: left;
    }
    
    .playlist-item-remove {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 10px;
      flex-shrink: 0;
    }
    
    .playlist-item-remove:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    
    .empty-playlist {
      text-align: center;
      font-style: italic;
      opacity: 0.7;
      padding: 15px;
      font-size: 13px;
    }
    
    .loading-sounds {
      text-align: center;
      font-style: italic;
      opacity: 0.7;
      padding: 15px;
      font-size: 13px;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .sounds-container {
        padding: 10px;
      }
      
      .sounds-player {
        padding: 12px;
      }
      
      .current-track {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      
      .player-controls {
        gap: 8px;
      }
      
      .player-visualizer {
        height: 25px;
      }
      
      .category-tabs {
        flex-wrap: wrap;
        gap: 3px;
      }
      
      .category-tab {
        padding: 5px 8px;
        font-size: 11px;
      }
      
      .tab-emoji {
        font-size: 12px;
      }
      
      .sounds-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
      }
      
      .sound-emoji {
        font-size: 18px;
        margin-bottom: 4px;
      }
      
      .sound-name {
        font-size: 12px;
      }
      
      .sound-duration {
        font-size: 10px;
      }
      
      .playlist-header {
        flex-direction: column;
        gap: 8px;
      }
      
      .playlist-title {
        font-size: 14px;
      }
      
      .playlist-items {
        gap: 4px;
      }
      
      .playlist-item {
        padding: 4px;
      }
      
      .playlist-item-emoji {
        font-size: 14px;
      }
      
      .playlist-item-name {
        font-size: 12px;
      }
    }
  `;

  // Only add styles if not already present
  if (!document.getElementById('sounds-enhanced-styles')) {
    document.head.appendChild(soundsStyles);
  }

  // Initialize variables
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const trackNameEl = document.getElementById('trackName');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeRange = document.getElementById('volumeRange');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeIcon = document.getElementById('volumeIcon');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const repeatBtn = document.getElementById('repeatBtn');
  const visualizer = document.getElementById('visualizer');
  const soundsGrid = document.getElementById('soundsGrid');
  const playlistItems = document.getElementById('playlistItems');
  const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');

  let isPlaying = false;
  let currentSound = null;
  let currentCategory = 'all';
  let isShuffle = false;
  let isRepeat = false;
  let playlist = JSON.parse(localStorage.getItem('moodPlaylist')) || [];

  // Sound data with categories
  const soundData = {
    rain: { name: 'Rain', emoji: '🌧️', category: 'nature', duration: '3:45' },
    waves: { name: 'Ocean Waves', emoji: '🌊', category: 'nature', duration: '5:20' },
    chimes: { name: 'Wind Chimes', emoji: '🔔', category: 'nature', duration: '2:15' },
    garden: { name: 'Morning Garden', emoji: '🌿', category: 'nature', duration: '4:30' },
    lofi_relax: { name: 'Lofi Relax', emoji: '🎧', category: 'music', duration: '3:10' },
    lofi: { name: 'Lofi Beats', emoji: '🎶', category: 'music', duration: '2:45' },
    relax_guitar: { name: 'Relaxing Guitar', emoji: '🎸', category: 'music', duration: '4:15' },
    meditation_amp: { name: 'Meditation (Amp)', emoji: '🧘', category: 'meditation', duration: '10:30' },
    meditation_relax: { name: 'Meditation (Relax)', emoji: '🧘', category: 'meditation', duration: '8:45' },
    relax_meditation: { name: 'Relax Meditation', emoji: '🧘', category: 'meditation', duration: '6:20' },
    relax_meditation1: { name: 'Deep Meditation', emoji: '🧘', category: 'meditation', duration: '12:15' },
    relax_2: { name: 'Ambient Relax 2', emoji: '🌌', category: 'ambient', duration: '5:45' },
    relax_4: { name: 'Ambient Relax 4', emoji: '🌌', category: 'ambient', duration: '7:30' },
    sedative: { name: 'Sedative', emoji: '💤', category: 'ambient', duration: '15:00' }
  };

  // Initialize audio
  const relaxAudio = new Audio();
  relaxAudio.volume = 0.7;

  // Render sounds grid
  function renderSoundsGrid(category = 'all') {
    currentCategory = category;
    soundsGrid.innerHTML = '';

    const filteredSounds = category === 'all'
      ? Object.entries(soundData)
      : Object.entries(soundData).filter(([key, data]) => data.category === category);

    if (filteredSounds.length === 0) {
      soundsGrid.innerHTML = '<div class="loading-sounds">No sounds in this category</div>';
      return;
    }

    filteredSounds.forEach(([key, data]) => {
      const soundCard = document.createElement('div');
      soundCard.className = 'sound-card';
      if (currentSound === key) soundCard.classList.add('playing');

      soundCard.innerHTML = `
        <div class="sound-emoji">${data.emoji}</div>
        <div class="sound-name">${data.name}</div>
        <div class="sound-duration">${data.duration}</div>
        <div class="sound-actions">
          <button class="sound-action-btn" title="Play/Pause">
            <span class="action-emoji">${currentSound === key && isPlaying ? '⏸️' : '▶️'}</span>
          </button>
          <button class="sound-action-btn" title="Add to playlist">
            <span class="action-emoji">➕</span>
          </button>
        </div>
      `;

      // Play/Pause button
      soundCard.querySelector('.sound-action-btn').addEventListener('click', (e) => {
        if (e.target.textContent === '▶️' || e.target.textContent === '⏸️') {
          playSound(key);
        } else if (e.target.textContent === '➕') {
          addToPlaylist(key);
        }
      });

      soundsGrid.appendChild(soundCard);
    });
  }

  // Play sound
  function playSound(soundKey) {
    if (currentSound === soundKey && isPlaying) {
      pauseSound();
    } else {
      currentSound = soundKey;
      const sound = soundData[soundKey];
      relaxAudio.src = sounds[soundKey];
      relaxAudio.play();
      isPlaying = true;
      updatePlayerUI();
      updateVisualizer(true);
      renderSoundsGrid(currentCategory);
    }
  }

  // Pause sound
  function pauseSound() {
    relaxAudio.pause();
    isPlaying = false;
    updatePlayerUI();
    updateVisualizer(false);
    renderSoundsGrid(currentCategory);
  }

  // Update player UI
  function updatePlayerUI() {
    if (currentSound) {
      const sound = soundData[currentSound];
      trackNameEl.textContent = sound.name;
      totalTimeEl.textContent = sound.duration;
    }

    playPauseIcon.textContent = isPlaying ? '⏸️' : '▶️';
  }

  // Update visualizer
  function updateVisualizer(active) {
    const bars = visualizer.querySelectorAll('.visualizer-bar');
    if (active) {
      // Animate bars with random heights
      const interval = setInterval(() => {
        if (!isPlaying) {
          clearInterval(interval);
          bars.forEach(bar => bar.style.height = '5px');
          return;
        }

        bars.forEach(bar => {
          const height = Math.random() * 25 + 5;
          bar.style.height = `${height}px`;
        });
      }, 200);
    } else {
      bars.forEach(bar => bar.style.height = '5px');
    }
  }

  // Add to playlist
  function addToPlaylist(soundKey) {
    if (!playlist.includes(soundKey)) {
      playlist.push(soundKey);
      localStorage.setItem('moodPlaylist', JSON.stringify(playlist));
      renderPlaylist();
      showNotification('Added to playlist', 'success');
    } else {
      showNotification('Already in playlist', 'info');
    }
  }

  // Remove from playlist
  function removeFromPlaylist(index) {
    playlist.splice(index, 1);
    localStorage.setItem('moodPlaylist', JSON.stringify(playlist));
    renderPlaylist();
  }

  // Clear playlist
  function clearPlaylist() {
    playlist = [];
    localStorage.setItem('moodPlaylist', JSON.stringify(playlist));
    renderPlaylist();
    showNotification('Playlist cleared', 'info');
  }

  // Render playlist
  function renderPlaylist() {
    if (playlist.length === 0) {
      playlistItems.innerHTML = '<div class="empty-playlist">Your playlist is empty. Add sounds to create a custom playlist.</div>';
      return;
    }

    playlistItems.innerHTML = '';
    playlist.forEach((soundKey, index) => {
      const sound = soundData[soundKey];
      const item = document.createElement('div');
      item.className = 'playlist-item';

      item.innerHTML = `
        <div class="playlist-item-emoji">${sound.emoji}</div>
        <div class="playlist-item-name">${sound.name}</div>
        <button class="playlist-item-remove">×</button>
      `;

      // Play sound when clicking item
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('playlist-item-remove')) {
          playSound(soundKey);
        }
      });

      // Remove button
      item.querySelector('.playlist-item-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromPlaylist(index);
      });

      playlistItems.appendChild(item);
    });
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 8px 12px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? 'linear-gradient(135deg, #43e97b, #38f9d7)' : 'linear-gradient(135deg, #8b5cf6, #a855f7)'};
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Add slide animation
    const slideStyle = document.createElement('style');
    slideStyle.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(slideStyle);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Format time
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  // Update progress
  function updateProgress() {
    if (relaxAudio.duration) {
      const progress = (relaxAudio.currentTime / relaxAudio.duration) * 100;
      progressFill.style.width = `${progress}%`;
      currentTimeEl.textContent = formatTime(relaxAudio.currentTime);
    }
  }

  // Event listeners
  playPauseBtn.addEventListener('click', () => {
    if (currentSound) {
      if (isPlaying) {
        pauseSound();
      } else {
        playSound(currentSound);
      }
    }
  });

  // Progress bar click to seek
  progressBar.addEventListener('click', (e) => {
    if (relaxAudio.duration) {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      relaxAudio.currentTime = percent * relaxAudio.duration;
    }
  });

  // Volume controls
  volumeBtn.addEventListener('click', () => {
    volumeSlider.style.display = volumeSlider.style.display === 'none' ? 'block' : 'none';
  });

  volumeRange.addEventListener('input', () => {
    relaxAudio.volume = volumeRange.value / 100;
    updateVolumeIcon();
  });

  function updateVolumeIcon() {
    const volume = relaxAudio.volume;
    if (volume === 0) {
      volumeIcon.textContent = '🔇';
    } else if (volume < 0.5) {
      volumeIcon.textContent = '🔈';
    } else {
      volumeIcon.textContent = '🔊';
    }
  }

  // Shuffle button
  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active');
    showNotification(isShuffle ? 'Shuffle enabled' : 'Shuffle disabled', 'info');
  });

  // Repeat button
  repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active');
    showNotification(isRepeat ? 'Repeat enabled' : 'Repeat disabled', 'info');
  });

  // Clear playlist button
  clearPlaylistBtn.addEventListener('click', clearPlaylist);

  // Category tabs
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSoundsGrid(tab.dataset.category);
    });
  });

  // Audio event listeners
  relaxAudio.addEventListener('timeupdate', updateProgress);

  relaxAudio.addEventListener('ended', () => {
    if (isRepeat) {
      relaxAudio.currentTime = 0;
      relaxAudio.play();
    } else if (isShuffle && playlist.length > 0) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      playSound(playlist[randomIndex]);
    } else if (playlist.length > 0) {
      const currentIndex = playlist.indexOf(currentSound);
      if (currentIndex < playlist.length - 1) {
        playSound(playlist[currentIndex + 1]);
      } else {
        playSound(playlist[0]);
      }
    } else {
      isPlaying = false;
      updatePlayerUI();
      updateVisualizer(false);
      renderSoundsGrid(currentCategory);
    }
  });

  // Add mouse tracking for interactive hover effects
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.sound-card');

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    });
  });

  // Initialize
  renderSoundsGrid();
  renderPlaylist();
  updateVolumeIcon();
}
// Enhanced Personality Glow Page with Professional Design (Fixed Sizing)
// Enhanced Personality Glow Page with Complete Error Handling
function showPersonality() {
  const main = document.getElementById('maincard');
  main.innerHTML = `
    <div class="personality-container">
      <div class="personality-header">
        <h2 class="personality-title">
          <span class="title-emoji">🌈</span>
          <span>Personality Glow</span>
        </h2>
        <div class="personality-subtitle">Discover your unique traits based on your journal entries</div>
      </div>
      
      <div class="personality-tabs">
        <button class="personality-tab active" data-tab="overview">
          <span class="tab-emoji">📊</span>
          <span>Overview</span>
        </button>
        <button class="personality-tab" data-tab="details">
          <span class="tab-emoji">🔍</span>
          <span>Details</span>
        </button>
        <button class="personality-tab" data-tab="growth">
          <span class="tab-emoji">📈</span>
          <span>Growth</span>
        </button>
        <button class="personality-tab" data-tab="insights">
          <span class="tab-emoji">💡</span>
          <span>Insights</span>
        </button>
      </div>
      
      <div class="personality-content">
        <!-- Overview Tab -->
        <div class="tab-content active" id="overview">
          <div class="personality-intro">
            <p>Your personality glow reflects your unique traits based on your recent entries. Discover how your personality shines through different dimensions.</p>
          </div>
          <div class="personality-grid" id="personalityGrid">
            <div class="loading-personality">Loading personality data...</div>
          </div>
          <div class="personality-radar-section">
            <div class="radar-header">
              <h3 class="radar-title">Personality Radar</h3>
              <div class="action-buttons">
                <button class="action-btn secondary-btn" id="compareBtn">
                  <i class="fas fa-exchange-alt"></i>
                  <span>Compare</span>
                </button>
                <button class="action-btn primary-btn" id="updateBtn">
                  <i class="fas fa-sync-alt"></i>
                  <span>Update</span>
                </button>
              </div>
            </div>
            <div class="radar-container">
              <div class="radar-chart">
                <canvas id="personalityRadar" width="400" height="400"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Details Tab -->
        <div class="tab-content" id="details">
          <div class="details-container">
            <h3 class="details-title">Personality Trait Details</h3>
            <div class="details-grid" id="detailsGrid">
              <div class="loading-details">Loading trait details...</div>
            </div>
          </div>
        </div>
        
        <!-- Growth Tab -->
        <div class="tab-content" id="growth">
          <div class="growth-container">
            <h3 class="growth-title">Your Personality Journey</h3>
            <div class="growth-chart-container">
              <canvas id="growthChart" width="400" height="200"></canvas>
            </div>
            <div class="growth-insights" id="growthInsights">
              <div class="loading-growth">Analyzing your growth...</div>
            </div>
          </div>
        </div>
        
        <!-- Insights Tab -->
        <div class="tab-content" id="insights">
          <div class="insights-container">
            <h3 class="insights-title">Personalized Insights</h3>
            <div class="insights-list" id="insightsList">
              <div class="loading-insights">Generating insights...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add enhanced CSS styles for personality page
  const personalityStyles = document.createElement('style');
  personalityStyles.id = 'personality-enhanced-styles';
  personalityStyles.textContent = `
    /* Personality Container */
    .personality-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      border-radius: 1.5rem;
      box-shadow: 0 15px 35px rgba(139, 92, 246, 0.3);
      color: white;
      min-height: 600px;
      position: relative;
      overflow: visible;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }
    
    /* Custom scrollbar for the entire container */
    .personality-container::-webkit-scrollbar {
      width: 10px;
    }
    
    .personality-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }
    
    .personality-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 5px;
    }
    
    .personality-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .personality-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
      background-size: 100px 100px;
      opacity: 0.5;
      z-index: 0;
    }
    
    /* Header Styles */
    .personality-header {
      text-align: center;
      margin-bottom: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .personality-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2.3rem;
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(5deg); }
    }
    
    .personality-subtitle {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      max-width: 600px;
      margin: 0 auto;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    /* Tab Styles */
    .personality-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 0.5rem;
      border-radius: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 1;
    }
    
    .personality-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 1.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .personality-tab::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .personality-tab:hover::before {
      transform: translateX(0);
    }
    
    .personality-tab:hover {
      color: white;
      transform: translateY(-2px);
    }
    
    .personality-tab.active {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .tab-emoji {
      font-size: 1.2rem;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }
    
    /* Tab Content */
    .personality-content {
      position: relative;
      z-index: 1;
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    .personality-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .personality-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .personality-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .tab-content {
      display: none;
      animation: fadeIn 0.5s ease;
    }
    
    .tab-content.active {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Overview Tab */
    .personality-intro {
      text-align: center;
      max-width: 600px;
      margin: 0 auto 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .personality-intro p {
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .personality-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .personality-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.2);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .personality-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, var(--trait-color) 0%, var(--trait-color-light) 100%);
    }
    
    .personality-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .personality-card:hover::after {
      opacity: 1;
    }
    
    .personality-card:hover {
      transform: translateY(-5px) scale(1.02);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    }
    
    .trait-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .trait-name {
      font-size: 1rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      word-break: break-word;
      overflow-wrap: break-word;
      flex: 1;
      min-width: 0;
    }
    
    .trait-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      color: white;
      background: var(--trait-color);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }
    
    .trait-percentage {
      font-size: 2rem;
      font-weight: 700;
      margin: 0.5rem 0;
      line-height: 1;
      color: var(--trait-color);
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    
    .trait-description {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.8rem;
      line-height: 1.4;
      margin-top: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    /* Trait specific colors */
    .personality-card.card-openness { 
      --trait-color: #667eea; 
      --trait-color-light: #8b9ffa;
    }
    
    .personality-card.card-conscientiousness { 
      --trait-color: #f093fb; 
      --trait-color-light: #f5b7ff;
    }
    
    .personality-card.card-extraversion { 
      --trait-color: #4facfe; 
      --trait-color-light: #7fc0ff;
    }
    
    .personality-card.card-agreeableness { 
      --trait-color: #43e97b; 
      --trait-color-light: #6fed9b;
    }
    
    .personality-card.card-neuroticism { 
      --trait-color: #fa709a; 
      --trait-color-light: #fc9dc0;
    }
    
    /* Radar Chart Section */
    .personality-radar-section {
      margin-top: 1.5rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .radar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .radar-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      word-break: break-word;
    }
    
    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .action-btn {
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      position: relative;
      overflow: hidden;
      white-space: nowrap;
    }
    
    .action-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .action-btn:hover::before {
      transform: translateX(0);
    }
    
    .primary-btn {
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
    }
    
    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
    }
    
    .secondary-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .secondary-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    
    .radar-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem 0;
    }
    
    .radar-chart {
      max-width: 300px;
      width: 100%;
      filter: drop-shadow(0 4px 15px rgba(0, 0, 0, 0.1));
    }
    
    /* Details Tab */
    .details-container {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .details-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
      margin-bottom: 1rem;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      word-break: break-word;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .detail-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      padding: 1rem;
      border-left: 4px solid var(--trait-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .detail-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .detail-card:hover::after {
      opacity: 1;
    }
    
    .detail-card:hover {
      transform: translateX(5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.15);
    }
    
    .detail-title {
      font-weight: 600;
      margin-bottom: 0.8rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      word-break: break-word;
    }
    
    .detail-content {
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .detail-content p {
      margin-bottom: 0.5rem;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 0.9rem;
    }
    
    .detail-content p:last-child {
      margin-bottom: 0;
    }
    
    /* Growth Tab */
    .growth-container {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .growth-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
      margin-bottom: 1rem;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      word-break: break-word;
    }
    
    .growth-chart-container {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      padding: 0.8rem;
    }
    
    .growth-insights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .insight-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      padding: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .insight-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .insight-card:hover::after {
      opacity: 1;
    }
    
    .insight-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.15);
    }
    
    .insight-title {
      font-weight: 600;
      margin-bottom: 0.8rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      word-break: break-word;
    }
    
    .insight-content {
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 0.85rem;
    }
    
    /* Insights Tab */
    .insights-container {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .insights-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
      margin-bottom: 1rem;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      word-break: break-word;
    }
    
    .insights-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .insight-item {
      padding: 1rem;
      border-radius: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      border-left: 4px solid var(--insight-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .insight-item::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .insight-item:hover::after {
      opacity: 1;
    }
    
    .insight-item:hover {
      transform: translateX(5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      background: rgba(255, 255, 255, 0.15);
    }
    
    .insight-item.positive {
      --insight-color: #4caf50;
      background: linear-gradient(to right, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1));
    }
    
    .insight-item.neutral {
      --insight-color: #ff9800;
      background: linear-gradient(to right, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1));
    }
    
    .insight-item.concern {
      --insight-color: #f44336;
      background: linear-gradient(to right, rgba(244, 67, 54, 0.2), rgba(244, 67, 54, 0.1));
    }
    
    .insight-item-title {
      font-weight: 600;
      margin-bottom: 0.8rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      word-break: break-word;
    }
    
    .insight-item-content {
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 0.85rem;
    }
    
    /* Loading States */
    .loading-personality, .loading-details, .loading-growth, .loading-insights {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.8);
      font-style: italic;
      font-size: 1rem;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .personality-container {
        padding: 0.8rem;
        gap: 0.8rem;
      }
      
      .personality-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.8rem;
      }
      
      .details-grid {
        grid-template-columns: 1fr;
      }
      
      .growth-insights {
        grid-template-columns: 1fr;
      }
      
      .radar-header {
        flex-direction: column;
        gap: 0.8rem;
        text-align: center;
      }
      
      .action-buttons {
        flex-direction: column;
        width: 100%;
      }
      
      .action-btn {
        width: 100%;
        justify-content: center;
      }
      
      .personality-title {
        font-size: 1.8rem;
      }
      
      .title-emoji {
        font-size: 2rem;
      }
    }
    
    /* Loading animation */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .loading-personality, .loading-details, .loading-growth, .loading-insights {
      animation: pulse 1.5s ease-in-out infinite;
    }
  `;

  // Only add styles if not already present
  if (!document.getElementById('personality-enhanced-styles')) {
    document.head.appendChild(personalityStyles);
  }

  // Initialize variables
  const personalityGrid = document.getElementById('personalityGrid');
  const personalityRadar = document.getElementById('personalityRadar');
  const detailsGrid = document.getElementById('detailsGrid');
  const growthChart = document.getElementById('growthChart');
  const growthInsights = document.getElementById('growthInsights');
  const insightsList = document.getElementById('insightsList');
  const compareBtn = document.getElementById('compareBtn');
  const updateBtn = document.getElementById('updateBtn');
  const tabs = document.querySelectorAll('.personality-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Tab functionality
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;

      // Update active tab button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active tab content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Add mouse tracking for interactive hover effects
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.personality-card, .detail-card, .insight-card, .insight-item');

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    });
  });

  // Fetch personality data
  api('/personality').then(res => {
    console.log(res);

    const grid = document.getElementById('personalityGrid');
    if (!res || !res.personality || res.personality.error) {
      grid.innerHTML = '<div style="color:rgba(255,255,255,0.8);">No personality data available yet. Add more journal entries!</div>';
      detailsGrid.innerHTML = '<div style="color:rgba(255,255,255,0.8);">No personality data available yet. Add more journal entries!</div>';
      growthInsights.innerHTML = '<div style="color:rgba(255,255,255,0.8);">No personality data available yet. Add more journal entries!</div>';
      insightsList.innerHTML = '<div style="color:rgba(255,255,255,0.8);">No personality data available yet. Add more journal entries!</div>';
      return;
    }

    // Render personality cards
    renderPersonalityCards(res.personality);

    // Create radar chart
    createRadarChart(res.personality);

    // Render trait details
    renderTraitDetails(res.personality);

    // Render growth chart
    renderGrowthChart(res.personality);

    // Render insights
    renderInsights(res.personality);

    // Set up button functionality
    setupButtonFunctionality(res.personality);

  }).catch(err => {
    personalityGrid.innerHTML = '<div style="color:rgba(255,255,255,0.8);">Error loading personality data.</div>';
    detailsGrid.innerHTML = '<div style="color:rgba(255,255,255,0.8);">Error loading personality data.</div>';
    growthInsights.innerHTML = '<div style="color:rgba(255,255,255,0.8);">Error loading personality data.</div>';
    insightsList.innerHTML = '<div style="color:rgba(255,255,255,0.8);">Error loading personality data.</div>';
    console.error(err);
  });

  // Render personality cards
  function renderPersonalityCards(personality) {
    personalityGrid.innerHTML = '';

    // Trait data with descriptions and icons
    const traitData = {
      'Openness': {
        icon: 'fas fa-lightbulb',
        description: 'Reflects creativity, curiosity, and preference for novelty and variety.'
      },
      'Conscientiousness': {
        icon: 'fas fa-check-circle',
        description: 'Indicates organization, responsibility, and goal-directed behavior.'
      },
      'Extraversion': {
        icon: 'fas fa-users',
        description: 'Represents sociability, assertiveness, and tendency to seek stimulation.'
      },
      'Agreeableness': {
        icon: 'fas fa-heart',
        description: 'Shows compassion, cooperation, and concern for social harmony.'
      },
      'Neuroticism': {
        icon: 'fas fa-cloud-rain',
        description: 'Measures emotional stability and tendency to experience negative emotions.'
      }
    };

    Object.entries(personality).forEach(([trait, value], i) => {
      // Normalize value to percentage (0-100)
      let percent = Math.round(value * 100);

      // If the value is already a percentage, just round it
      if (value > 1) {
        percent = Math.round(value);
      }

      const traitInfo = traitData[trait] || { icon: 'fas fa-question', description: 'Personality trait' };
      const card = document.createElement('div');
      card.className = `personality-card card-${trait.toLowerCase()}`;

      card.innerHTML = `
        <div class="trait-header">
          <h3 class="trait-name">${trait}</h3>
          <div class="trait-icon">
            <i class="${traitInfo.icon}"></i>
          </div>
        </div>
        <div class="trait-percentage" data-target="${percent}">0%</div>
        <p class="trait-description">${traitInfo.description}</p>
      `;

      personalityGrid.appendChild(card);
    });

    // Animate percentage counters
    const counters = document.querySelectorAll('.trait-percentage');
    const speed = 200; // The lower the faster

    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      const increment = target / speed;

      const updateCount = () => {
        const count = +counter.innerText.replace('%', '');

        if (count < target) {
          counter.innerText = Math.ceil(count + increment) + '%';
          setTimeout(updateCount, 10);
        } else {
          counter.innerText = target + '%';
        }
      };

      updateCount();
    });
  }

  // Create radar chart
  function createRadarChart(personality) {
    const ctx = personalityRadar.getContext('2d');

    // Destroy previous chart instance if exists
    if (window._personalityRadar) window._personalityRadar.destroy();

    window._personalityRadar = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: Object.keys(personality),
        datasets: [{
          label: 'Your Personality',
          data: Object.values(personality).map(v => v > 1 ? v : v * 100),
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.8)',
          pointBackgroundColor: 'rgba(255, 255, 255, 1)',
          pointBorderColor: 'rgba(139, 92, 246, 1)',
          pointHoverBackgroundColor: 'rgba(139, 92, 246, 1)',
          pointHoverBorderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            angleLines: {
              display: true,
              color: 'rgba(255, 255, 255, 0.2)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.2)'
            },
            pointLabels: {
              color: 'rgba(255, 255, 255, 0.9)',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              stepSize: 20,
              backdropColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        },
        maintainAspectRatio: true,
        responsive: true
      }
    });
  }

  // Render trait details
  function renderTraitDetails(personality) {
    detailsGrid.innerHTML = '';

    // Complete trait details with all levels
    const traitDetails = {
      'Openness': {
        high: 'You are highly open to new experiences and enjoy exploring new ideas and activities.',
        medium: 'You are moderately open to new experiences, balancing tradition with novelty.',
        low: 'You prefer familiar routines and may be more resistant to change.',
        description: 'Openness reflects your preference for variety, intellectual curiosity, and aesthetic appreciation.'
      },
      'Conscientiousness': {
        high: 'You are highly organized, disciplined, and goal-oriented in your approach.',
        medium: 'You are reasonably organized but can be flexible when needed.',
        low: 'You may be more spontaneous and less focused on detailed planning.',
        description: 'Conscientiousness indicates your level of organization, responsibility, and self-discipline.'
      },
      'Extraversion': {
        high: 'You are highly sociable, energetic, and enjoy being around others.',
        medium: 'You balance social interaction with alone time as needed.',
        low: 'You prefer quiet environments and may be more reserved in social situations.',
        description: 'Extraversion measures your sociability, assertiveness, and preference for external stimulation.'
      },
      'Agreeableness': {
        high: 'You are very cooperative, trusting, and considerate of others\' feelings.',
        medium: 'You are generally agreeable but can stand your ground when necessary.',
        low: 'You may be more competitive and less concerned with others\' opinions.',
        description: 'Agreeableness reflects your tendency to be compassionate, cooperative, and considerate.'
      },
      'Neuroticism': {
        high: 'You may experience more frequent negative emotions and mood swings.',
        medium: 'You experience some negative emotions but generally cope well.',
        low: 'You tend to be emotionally stable and calm under pressure.',
        description: 'Neuroticism measures your emotional stability and tendency to experience negative emotions.'
      }
    };

    Object.entries(personality).forEach(([trait, value]) => {
      // Normalize value to percentage (0-100)
      let percent = Math.round(value * 100);

      // If the value is already a percentage, just round it
      if (value > 1) {
        percent = Math.round(value);
      }

      // Get trait details with safe fallback
      const details = traitDetails[trait] || {
        high: 'Your personality shows strong ' + trait.toLowerCase() + ' traits.',
        medium: 'Your personality shows moderate ' + trait.toLowerCase() + ' traits.',
        low: 'Your personality shows lower ' + trait.toLowerCase() + ' traits.',
        description: trait + ' reflects your personality characteristics.'
      };

      let level = 'medium';

      if (percent >= 70) level = 'high';
      else if (percent <= 30) level = 'low';

      // Safe access to level description
      const levelDescription = details[level] || 'Your personality level is ' + level;

      const card = document.createElement('div');
      card.className = 'detail-card';
      card.style.setProperty('--trait-color', getTraitColor(trait));

      card.innerHTML = `
        <div class="detail-title">
          <i class="fas fa-info-circle"></i>
          ${trait}
        </div>
        <div class="detail-content">
          <p><strong>Your Level:</strong> ${level.charAt(0).toUpperCase() + level.slice(1)} (${percent}%)</p>
          <p>${levelDescription}</p>
          <p><strong>About this trait:</strong> ${details.description}</p>
        </div>
      `;

      detailsGrid.appendChild(card);
    });
  }

  // Get trait color for consistency
  function getTraitColor(trait) {
    const colors = {
      'Openness': '#667eea',
      'Conscientiousness': '#f093fb',
      'Extraversion': '#4facfe',
      'Agreeableness': '#43e97b',
      'Neuroticism': '#fa709a'
    };
    return colors[trait] || '#667eea';
  }

  // Render growth chart
  function renderGrowthChart(personality) {
    const ctx = growthChart.getContext('2d');

    // Destroy previous chart instance if exists
    if (window._growthChart) window._growthChart.destroy();

    // Mock growth data (in a real app, this would come from API)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const opennessData = [65, 68, 70, 72, 75, 78];
    const conscientiousnessData = [60, 62, 65, 63, 68, 70];
    const extraversionData = [55, 58, 60, 65, 62, 68];
    const agreeablenessData = [70, 72, 75, 73, 78, 80];
    const neuroticismData = [40, 38, 35, 32, 30, 28];

    window._growthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Openness',
            data: opennessData,
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            borderWidth: 3
          },
          {
            label: 'Conscientiousness',
            data: conscientiousnessData,
            borderColor: 'rgba(240, 147, 251, 1)',
            backgroundColor: 'rgba(240, 147, 251, 0.1)',
            tension: 0.4,
            borderWidth: 3
          },
          {
            label: 'Extraversion',
            data: extraversionData,
            borderColor: 'rgba(79, 172, 254, 1)',
            backgroundColor: 'rgba(79, 172, 254, 0.1)',
            tension: 0.4,
            borderWidth: 3
          },
          {
            label: 'Agreeableness',
            data: agreeablenessData,
            borderColor: 'rgba(67, 233, 123, 1)',
            backgroundColor: 'rgba(67, 233, 123, 0.1)',
            tension: 0.4,
            borderWidth: 3
          },
          {
            label: 'Neuroticism',
            data: neuroticismData,
            borderColor: 'rgba(250, 112, 154, 1)',
            backgroundColor: 'rgba(250, 112, 154, 0.1)',
            tension: 0.4,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
              color: 'rgba(255, 255, 255, 0.8)',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });

    // Generate growth insights
    const insights = [
      {
        title: 'Steady Growth',
        content: 'Your openness has shown consistent improvement over the past 6 months.',
        type: 'positive'
      },
      {
        title: 'Emotional Stability',
        content: 'Your neuroticism has decreased, indicating improved emotional stability.',
        type: 'positive'
      },
      {
        title: 'Social Development',
        content: 'Your extraversion has grown, suggesting increased social confidence.',
        type: 'positive'
      }
    ];

    growthInsights.innerHTML = insights.map(insight => `
      <div class="insight-card">
        <div class="insight-title">
          <i class="fas fa-chart-line"></i>
          ${insight.title}
        </div>
        <div class="insight-content">${insight.content}</div>
      </div>
    `).join('');
  }

  // Render insights
  function renderInsights(personality) {
    insightsList.innerHTML = '';

    // Generate personalized insights based on personality data
    const insights = generatePersonalityInsights(personality);

    insightsList.innerHTML = insights.map(insight => `
      <div class="insight-item ${insight.type}">
        <div class="insight-item-title">
          <i class="${insight.icon}"></i>
          ${insight.title}
        </div>
        <div class="insight-item-content">${insight.content}</div>
      </div>
    `).join('');
  }

  // Generate personalized insights
  function generatePersonalityInsights(personality) {
    const insights = [];
    const totalEntries = Object.values(personality).reduce((sum, val) => sum + val, 0);

    // Positive insight
    const happyMoods = personality.happy || 0;
    const happyPercentage = (happyMoods / totalEntries) * 100;

    if (happyPercentage > 50) {
      insights.push({
        type: 'positive',
        icon: 'fas fa-smile',
        title: 'Positive Outlook',
        content: `You've maintained a positive outlook ${happyPercentage.toFixed(0)}% of the time. Your optimism is a strength!`
      });
    }

    // Neutral insight
    insights.push({
      type: 'neutral',
      icon: 'fas fa-chart-line',
      title: 'Consistent Journaling',
      content: 'Your consistent journaling practice is helping you develop self-awareness and emotional intelligence.'
    });

    // Concern insight
    const anxiousMoods = personality.anxious || 0;
    const anxiousPercentage = (anxiousMoods / totalEntries) * 100;

    if (anxiousPercentage > 40) {
      insights.push({
        type: 'concern',
        icon: 'fas fa-exclamation-triangle',
        title: 'Stress Management',
        content: 'Consider incorporating relaxation techniques when feeling overwhelmed. Your well-being is important!'
      });
    }

    return insights;
  }

  // Set up button functionality
  function setupButtonFunctionality(personality) {
    // Update button functionality
    updateBtn.addEventListener('click', function () {
      // Show loading state
      this.innerHTML = '<span class="loading"></span> Updating...';
      this.disabled = true;

      // Simulate API call to update personality data
      setTimeout(() => {
        // Reset to original state
        this.innerHTML = '<i class="fas fa-sync-alt"></i><span>Update</span>';
        this.disabled = false;

        // Show a success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(139, 92, 246, 0.9);
          color: white;
          padding: 15px 20px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          z-index: 1000;
          animation: slideIn 0.3s ease;
          font-size: 0.9rem;
          backdrop-filter: blur(10px);
        `;
        successMessage.textContent = 'Personality data updated successfully!';
        document.body.appendChild(successMessage);

        // Remove message after 3 seconds
        setTimeout(() => {
          successMessage.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => {
            document.body.removeChild(successMessage);
          }, 300);
        }, 3000);
      }, 1500);
    });

    // Compare button functionality
    compareBtn.addEventListener('click', function () {
      // Toggle comparison view
      if (window._personalityRadar.data.datasets.length === 1) {
        // Add average dataset for comparison
        window._personalityRadar.data.datasets.push({
          label: 'Average User',
          data: [65, 70, 60, 75, 50],
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          borderColor: 'rgba(231, 76, 60, 0.8)',
          pointBackgroundColor: 'rgba(231, 76, 60, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(231, 76, 60, 1)',
          borderWidth: 2
        });
        window._personalityRadar.options.plugins.legend.display = true;
        this.innerHTML = '<i class="fas fa-times"></i><span>Remove Comparison</span>';
      } else {
        // Remove comparison dataset
        window._personalityRadar.data.datasets.pop();
        window._personalityRadar.options.plugins.legend.display = false;
        this.innerHTML = '<i class="fas fa-exchange-alt"></i><span>Compare</span>';
      }
      window._personalityRadar.update();
    });

    // Add slide animations
    const slideStyle = document.createElement('style');
    slideStyle.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      .loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(slideStyle);
  }
}
// Enhanced Motivation Page with Premium Features
function showMotivation() {
  // Clear previous content
  const main = document.getElementById('maincard');
  main.innerHTML = '';

  // Create and append the motivation container
  const motivationContainer = createMotivationContainer();
  main.appendChild(motivationContainer);

  // Add styles
  addMotivationStyles();

  // Initialize components
  initializeMotivationApp();
}

// Create the main container structure
function createMotivationContainer() {
  const container = document.createElement('div');
  container.className = 'motivation-container';

  // Header
  container.appendChild(createHeader());

  // Tabs
  container.appendChild(createTabs());

  // Content area
  container.appendChild(createContentArea());

  return container;
}

// Create header section
function createHeader() {
  const header = document.createElement('div');
  header.className = 'motivation-header';
  header.innerHTML = `
    <h2 class="motivation-title">
      <span class="title-emoji">✨</span>
      <span>Daily Spark</span>
    </h2>
    <div class="motivation-subtitle">Find your daily dose of inspiration</div>
  `;
  return header;
}

// Create tab navigation
function createTabs() {
  const tabs = document.createElement('div');
  tabs.className = 'motivation-tabs';
  tabs.innerHTML = `
    <button class="motivation-tab active" data-tab="quotes">
      <span class="tab-emoji">✨</span>
      <span>Quotes</span>
    </button>
    <button class="motivation-tab" data-tab="videos">
      <span class="tab-emoji">🎥</span>
      <span>Videos</span>
    </button>
    <button class="motivation-tab" data-tab="exercises">
      <span class="tab-emoji">🎨</span>
      <span>Exercises</span>
    </button>
    <button class="motivation-tab" data-tab="breathing">
      <span class="tab-emoji">🧘</span>
      <span>Breathing</span>
    </button>
  `;
  return tabs;
}

// Create content area with all tab content
function createContentArea() {
  const content = document.createElement('div');
  content.className = 'motivation-content';

  // Quotes Tab
  content.appendChild(createQuotesTab());

  // Videos Tab
  content.appendChild(createVideosTab());

  // Exercises Tab
  content.appendChild(createExercisesTab());

  // Breathing Tab (new implementation)
  content.appendChild(createBreathingTab());

  return content;
}

// Create quotes tab content
function createQuotesTab() {
  const quotesTab = document.createElement('div');
  quotesTab.className = 'tab-content active';
  quotesTab.id = 'quotes';

  quotesTab.innerHTML = `
    <div class="quote-container">
      <div class="quote-card" id="quoteCard">
        <div class="quote-content">
          <div class="quote-text" id="quoteText">Loading inspiration...</div>
          <div class="quote-author" id="quoteAuthor"></div>
        </div>
      </div>
      <div class="quote-actions">
        <button class="action-btn" id="prevQuote" title="Previous quote">
          <span class="btn-emoji">⏮️</span>
        </button>
        <button class="action-btn" id="shareQuote" title="Share quote">
          <span class="btn-emoji">📤</span>
        </button>
        <button class="action-btn" id="saveQuote" title="Save quote">
          <span class="btn-emoji">💾</span>
        </button>
        <button class="action-btn" id="favoriteQuote" title="Add to favorites">
          <span class="btn-emoji">❤️</span>
        </button>
      </div>
    </div>
    <div class="quote-pagination">
      <div class="page-info">
        <span id="currentPage">1</span> / <span id="totalPages">1</span>
      </div>
      <div class="pagination-controls">
        <button class="page-btn" id="prevPage" title="Previous page">
          <span class="btn-emoji">⏠️</span>
        </button>
        <button class="page-btn" id="nextPage" title="Next page">
          <span class="btn-emoji">➡️</span>
        </button>
      </div>
    </div>
  `;

  return quotesTab;
}

// Create videos tab content
function createVideosTab() {
  const videosTab = document.createElement('div');
  videosTab.className = 'tab-content';
  videosTab.id = 'videos';

  videosTab.innerHTML = `
    <div class="video-categories">
      <div class="category-tabs">
        <button class="category-tab active" data-category="all">
          <span class="tab-emoji">🎬</span>
          <span>All</span>
        </button>
        <button class="category-tab" data-category="meditation">
          <span class="tab-emoji">🧘</span>
          <span>Meditation</span>
        </button>
        <button class="category-tab" data-category="stress">
          <span class="tab-emoji">😰</span>
          <span>Stress Relief</span>
        </button>
        <button class="category-tab" data-category="energy">
          <span class="tab-emoji">⚡</span>
          <span>Energy Boost</span>
        </button>
      </div>
    </div>
    <div class="video-grid" id="videoGrid">
      <div class="loading-videos">Loading videos...</div>
    </div>
    <div class="video-pagination">
      <div class="page-info">
        <span id="currentPageVideo">1</span> / <span id="totalPagesVideo">1</span>
      </div>
      <div class="pagination-controls">
        <button class="page-btn" id="prevVideoPage" title="Previous page">
          <span class="btn-emoji">⏠️</span>
        </button>
        <button class="page-btn" id="nextVideoPage" title="Next page">
          <span class="btn-emoji">➡️</span>
        </button>
      </div>
    </div>
  `;

  return videosTab;
}

// Create exercises tab content
function createExercisesTab() {
  const exercisesTab = document.createElement('div');
  exercisesTab.className = 'tab-content';
  exercisesTab.id = 'exercises';

  exercisesTab.innerHTML = `
    <div class="exercise-categories">
      <div class="category-tabs">
        <button class="category-tab active" data-category="all">
          <span class="tab-emoji">🎨</span>
          <span>All</span>
        </button>
        <button class="category-tab" data-category="stress">
          <span class="tab-emoji">😰</span>
          <span>Stress Relief</span>
        </button>
        <button class="category-tab" data-category="mindfulness">
          <span class="tab-emoji">🧘</span>
          <span>Mindfulness</span>
        </button>
        <button class="category-tab" data-category="energy">
          <span class="tab-emoji">⚡</span>
          <span>Energy Boost</span>
        </button>
      </div>
    </div>
    <div class="exercise-grid" id="exerciseGrid">
      <div class="loading-exercises">Loading exercises...</div>
    </div>
    <div class="exercise-pagination">
      <div class="page-info">
        <span id="currentPageExercise">1</span> / <span id="totalPagesExercise">1</span>
      </div>
      <div class="pagination-controls">
        <button class="page-btn" id="prevExercisePage" title="Previous page">
          <span class="btn-emoji">⏠️</span>
        </button>
        <button class="page-btn" id="nextExercisePage" title="Next page">
          <span class="btn-emoji">➡️</span>
        </button>
      </div>
    </div>
  `;

  return exercisesTab;
}

// Create breathing tab content (new implementation)
function createBreathingTab() {
  const breathingTab = document.createElement('div');
  breathingTab.className = 'tab-content';
  breathingTab.id = 'breathing';

  breathingTab.innerHTML = `
    <div class="breathing-container">
      <div class="breathing-selector">
        <h3>Select a Breathing Exercise</h3>
        <div class="breathing-options">
          <button class="breathing-option active" data-technique="478">
            <span class="technique-name">4-7-8 Breathing</span>
            <span class="technique-desc">Calm anxiety and prepare for sleep</span>
          </button>
          <button class="breathing-option" data-technique="box">
            <span class="technique-name">Box Breathing</span>
            <span class="technique-desc">Reduce stress and improve focus</span>
          </button>
          <button class="breathing-option" data-technique="belly">
            <span class="technique-name">Belly Breathing</span>
            <span class="technique-desc">Relax mind and body</span>
          </button>
        </div>
      </div>
      
      <div class="breathing-exercise">
        <div class="breathing-circle" id="breathingCircle">
          <div class="breathing-text" id="breathingText">Ready to begin</div>
        </div>
        
        <div class="breathing-controls">
          <button class="control-btn" id="startBreathing">Start</button>
          <button class="control-btn" id="pauseBreathing">Pause</button>
          <button class="control-btn" id="resetBreathing">Reset</button>
        </div>
        
        <div class="breathing-info">
          <div class="info-title" id="infoTitle">4-7-8 Breathing</div>
          <div class="info-description" id="infoDescription">
            Inhale for 4 seconds, hold for 7 seconds, and exhale for 8 seconds. This technique helps calm nervous system and reduce anxiety.
          </div>
        </div>
      </div>
    </div>
  `;

  return breathingTab;
}

// Add enhanced CSS styles
function addMotivationStyles() {
  // Only add styles if not already present
  if (document.getElementById('motivation-enhanced-styles')) return;

  const motivationStyles = document.createElement('style');
  motivationStyles.id = 'motivation-enhanced-styles';
  motivationStyles.textContent = `
    /* Motivation Container */
    .motivation-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      border-radius: 1rem;
      box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
      color: white;
      min-height: 600px;
      position: relative;
      overflow: visible;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }
    
    /* Custom scrollbar for entire container */
    .motivation-container::-webkit-scrollbar {
      width: 10px;
    }
    
    .motivation-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }
    
    .motivation-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 5px;
    }
    
    .motivation-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .motivation-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></svg>');
      background-size: 100px 100px;
      opacity: 0.5;
      z-index: 0;
    }
    
    /* Header Styles */
    .motivation-header {
      text-align: center;
      margin-bottom: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .motivation-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2.3rem;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .motivation-subtitle {
      font-size: 0.9rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
    }
    
    /* Tab Styles */
    .motivation-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      border-radius: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      position: relative;
      z-index: 1;
    }
    
    .motivation-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.8rem;
      border: none;
      border-radius: 1.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .motivation-tab::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .motivation-tab:hover::before {
      transform: translateX(0);
    }
    
    .motivation-tab:hover {
      color: white;
      transform: translateY(-2px);
    }
    
    .motivation-tab.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .tab-emoji {
      font-size: 1.1rem;
    }
    
    /* Content Styles */
    .motivation-content {
      position: relative;
      z-index: 1;
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    .motivation-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .motivation-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .motivation-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .tab-content {
      display: none;
      animation: fadeIn 0.5s ease;
    }
    
    .tab-content.active {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Quotes Tab */
    .quote-container {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      margin-bottom: 0.8rem;
    }
    
    .quote-card {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 0.8rem;
      padding: 1rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      min-height: 120px;
    }
    
    .quote-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    
    .quote-text {
      font-size: 1rem;
      font-weight: 500;
      color: #333;
      line-height: 1.5;
      flex: 1;
      padding: 0 0.5rem;
      overflow-y: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .quote-author {
      font-size: 0.9rem;
      font-style: italic;
      color: #666;
      margin-top: 0.5rem;
      text-align: right;
    }
    
    .quote-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #8b5cf6;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    .btn-emoji {
      font-size: 1rem;
    }
    
    .quote-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.8rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
    }
    
    .page-info {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .pagination-controls {
      display: flex;
      gap: 0.5rem;
    }
    
    .page-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .page-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    /* Videos Tab */
    .video-categories {
      margin-bottom: 0.8rem;
    }
    
    .category-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    .category-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.8rem;
      border: none;
      border-radius: 1.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .category-tab:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      transform: translateY(-2px);
    }
    
    .category-tab.active {
      background: rgba(255, 255, 255, 0.3);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.8rem;
      margin-bottom: 0.8rem;
    }
    
    .video-card {
      background: white;
      border-radius: 0.8rem;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    
    .video-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }
    
    .video-thumbnail {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      background: #f0f0f0;
      overflow: hidden;
    }
    
    .video-thumbnail img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .video-info {
      padding: 0.8rem;
    }
    
    .video-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .video-description {
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.5rem;
    }
    
    .video-duration {
      font-size: 0.7rem;
      color: #999;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .video-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
    }
    
    /* Exercises Tab */
    .exercise-categories {
      margin-bottom: 0.8rem;
    }
    
    .exercise-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 0.8rem;
      margin-bottom: 0.8rem;
    }
    
    .exercise-card {
      background: white;
      border-radius: 0.8rem;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    
    .exercise-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }
    
    .exercise-thumbnail {
      width: 100%;
      height: 100px;
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 0.8rem;
    }
    
    .exercise-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .exercise-description {
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.5rem;
      text-align: center;
    }
    
    .exercise-details {
      padding: 0.8rem;
    }
    
    .exercise-instructions {
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.5rem;
    }
    
    .exercise-duration {
      font-size: 0.7rem;
      color: #999;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
    }
    
    .exercise-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
    }
    
    /* Breathing Tab */
    .breathing-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.8rem;
    }
    
    .breathing-selector {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      padding: 0.8rem;
    }
    
    .breathing-selector h3 {
      margin-top: 0;
      margin-bottom: 0.8rem;
      text-align: center;
      color: #333;
      font-size: 1rem;
    }
    
    .breathing-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.8rem;
    }
    
    .breathing-option {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.8rem;
      border: none;
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      color: #333;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .breathing-option:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .breathing-option.active {
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    
    .technique-name {
      font-weight: 600;
      font-size: 0.9rem;
    }
    
    .technique-desc {
      font-size: 0.8rem;
      opacity: 0.8;
    }
    
    .breathing-exercise {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .breathing-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 4s ease-in-out;
      position: relative;
    }
    
    .breathing-circle.inhale {
      transform: scale(1.3);
      background: rgba(139, 92, 246, 0.2);
    }
    
    .breathing-circle.hold {
      transform: scale(1.3);
      background: rgba(139, 92, 246, 0.3);
    }
    
    .breathing-circle.exhale {
      transform: scale(1);
      background: rgba(139, 92, 246, 0.1);
    }
    
    .breathing-text {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      text-align: center;
    }
    
    .breathing-controls {
      display: flex;
      gap: 0.8rem;
    }
    
    .control-btn {
      padding: 0.4rem 1rem;
      border: none;
      border-radius: 2rem;
      background: rgba(139, 92, 246, 0.1);
      color: #333;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.8rem;
    }
    
    .control-btn:hover {
      background: rgba(139, 92, 246, 0.2);
      transform: translateY(-2px);
    }
    
    .control-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .breathing-info {
      max-width: 400px;
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      padding: 0.8rem;
    }
    
    .info-title {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .info-description {
      font-size: 0.8rem;
      color: #666;
      line-height: 1.5;
    }
    
    /* Loading States */
    .loading-videos, .loading-exercises {
      display: flex;
      justify-content: center;
      padding: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      font-style: italic;
      font-size: 0.9rem;
    }
    
    /* Notification Styles */
    .notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(139, 92, 246, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 5px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease;
      font-size: 0.8rem;
    }
    
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .motivation-container {
        padding: 0.8rem;
        gap: 0.8rem;
      }
      
      .motivation-tabs {
        flex-wrap: wrap;
        gap: 0.25rem;
      }
      
      .motivation-tab {
        padding: 0.5rem 0.6rem;
      }
      
      .video-grid {
        grid-template-columns: 1fr;
      }
      
      .exercise-grid {
        grid-template-columns: 1fr;
      }
      
      .breathing-options {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(motivationStyles);
}

// Initialize motivation app
function initializeMotivationApp() {
  // Data
  const appData = {
    quotes: [
      { text: "🌟 Believe in yourself—you are capable of amazing things.", author: "Unknown" },
      { text: "💪 Small steps lead to big changes—keep moving forward.", author: "Unknown" },
      { text: "✨ Even the darkest night will end and the sun will rise.", author: "Unknown" },
      { text: "🌈 You are not alone—your feelings are valid.", author: "Unknown" },
      { text: "🔥 Healing takes time—be gentle with yourself.", author: "Unknown" },
      { text: "🌱 Growth takes patience—every step matters.", author: "Unknown" },
      { text: "🔥 Challenges make you stronger—embrace them.", author: "Unknown" },
      { text: "🌊 Take a deep breath—the world is full of beauty.", author: "Unknown" },
      { text: "🌿 Rest is part of progress—take care of yourself.", author: "Unknown" },
      { text: "🎨 Every day is a blank canvas—paint it boldly.", author: "Unknown" },
      { text: "🌺 Stars can't shine without darkness.", author: "Unknown" },
      { text: "🌳 Bloom where you are planted—embrace growth.", author: "Unknown" },
      { text: "🧘 Breathe in courage, breathe out fear.", author: "Unknown" },
      { text: "🛤 Your journey is unique—embrace every twist.", author: "Unknown" },
      { text: "🏆 Success is built on perseverance.", author: "Unknown" },
      { text: "🎯 Be kind to yourself—you're doing your best.", author: "Unknown" },
      { text: "🌈 Spread love wherever you go.", author: "Unknown" },
      { text: "🌅 Every ending is a doorway to a beginning.", author: "Unknown" },
      { text: "🌟 Your future is brighter than you think.", author: "Unknown" },
      { text: "❤️ You are enough—just as you are.", author: "Unknown" }
    ],
    videos: [
      {
        title: "5-Minute Morning Meditation",
        description: "Start your day with this quick meditation practice",
        thumbnail: "https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg",
        videoId: "inpok4MKVLM",
        duration: "5:00",
        category: "meditation"
      },
      {
        title: "Anxiety Relief Techniques",
        description: "Quick techniques to calm your mind",
        thumbnail: "https://img.youtube.com/vi/f77SKdyn-1Y/hqdefault.jpg",
        videoId: "f77SKdyn-1Y",
        duration: "7:30",
        category: "stress"
      },
      {
        title: "Energizing Morning Routine",
        description: "Start your day with energy and positivity",
        thumbnail: "https://img.youtube.com/vi/2Lz0VOltZKA/hqdefault.jpg",
        videoId: "2Lz0VOltZKA",
        duration: "8:45",
        category: "energy"
      },
      {
        title: "Quick Stress Relief",
        description: "5 techniques to manage stress",
        thumbnail: "https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg",
        videoId: "ZToicYcHIOU",
        duration: "3:45",
        category: "stress"
      },
      {
        title: "10-Minute Mindfulness Meditation",
        description: "A guided mindfulness practice for clarity",
        thumbnail: "https://img.youtube.com/vi/SEfs5TJZ6Nk/hqdefault.jpg",
        videoId: "SEfs5TJZ6Nk",
        duration: "10:00",
        category: "meditation"
      },
      {
        title: "Energy Boosting Exercises",
        description: "Quick exercises to boost your energy levels",
        thumbnail: "https://img.youtube.com/vi/5Rxn63zT1Qk/hqdefault.jpg",
        videoId: "5Rxn63zT1Qk",
        duration: "6:30",
        category: "energy"
      }
    ],
    exercises: {
      all: [
        {
          title: "5-Minute Mindfulness",
          description: "A quick mindfulness exercise to center yourself",
          duration: "5:00",
          instructions: "Sit comfortably, close your eyes, and focus on your breath for 5 minutes.",
          category: "mindfulness"
        },
        {
          title: "4-7-8 Breathing Exercise",
          description: "A breathing technique to reduce anxiety",
          duration: "5:00",
          instructions: "Inhale for 4 counts, hold for 7 counts, and exhale for 8 counts.",
          category: "mindfulness"
        },
        {
          title: "Body Scan Meditation",
          description: "A quick body scan meditation for relaxation",
          duration: "10:00",
          instructions: "Close your eyes and scan your body from head to toe, noting sensations without judgment.",
          category: "mindfulness"
        },
        {
          title: "Progressive Muscle Relaxation",
          description: "Tense and release muscle tension",
          duration: "15:00",
          instructions: "Tense each muscle group for 5 seconds, then release.",
          category: "stress"
        },
        {
          title: "Morning Stretching",
          description: "Start your day with gentle movements",
          duration: "10:00",
          instructions: "Gently stretch for 30 seconds, focusing on each major muscle group for 5 seconds.",
          category: "energy"
        },
        {
          title: "Desk Exercises",
          description: "Quick exercises for your workspace",
          duration: "5:00",
          instructions: "Roll your shoulders back 5 times, then forward 5 times.",
          category: "energy"
        }
      ],
      stress: [
        {
          title: "5-Minute Grounding",
          description: "A quick grounding technique",
          instructions: "Feel your feet on the ground and notice the support beneath you.",
          duration: "3:00",
          category: "stress"
        },
        {
          title: "Box Breathing",
          description: "A calming breathing technique",
          instructions: "Inhale for 4 counts, hold for 4 counts, exhale for 4 counts, and hold for 4 counts.",
          duration: "3:00",
          category: "stress"
        },
        {
          title: "Quick Body Scan",
          description: "A quick body scan to reconnect with your body",
          instructions: "Close your eyes and quickly scan your body from head to toe.",
          duration: "2:00",
          category: "stress"
        }
      ],
      mindfulness: [
        {
          title: "Mindful Observation",
          description: "Practice observing without judgment",
          instructions: "Choose an object and observe it for 3 minutes without labeling or judging.",
          duration: "3:00",
          category: "mindfulness"
        },
        {
          title: "Mindful Listening",
          description: "Practice focused listening",
          instructions: "Close your eyes and focus on all the sounds around you for 5 minutes.",
          duration: "5:00",
          category: "mindfulness"
        }
      ],
      energy: [
        {
          title: "Power Posing",
          description: "Strengthen your body with power poses",
          instructions: "Hold each pose for 30 seconds while breathing deeply.",
          duration: "5:00",
          category: "energy"
        },
        {
          title: "Quick Energy Boost",
          description: "A quick exercise to boost your energy",
          instructions: "Do 10 jumping jacks, followed by deep breathing.",
          duration: "2:00",
          category: "energy"
        }
      ]
    },
    breathingTechniques: {
      "478": {
        name: "4-7-8 Breathing",
        description: "Inhale for 4 seconds, hold for 7 seconds, and exhale for 8 seconds. This technique helps calm the nervous system and reduce anxiety.",
        phases: [
          { name: "Inhale", duration: 4 },
          { name: "Hold", duration: 7 },
          { name: "Exhale", duration: 8 }
        ]
      },
      "box": {
        name: "Box Breathing",
        description: "Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, and hold for 4 seconds. This technique helps reduce stress and improve focus.",
        phases: [
          { name: "Inhale", duration: 4 },
          { name: "Hold", duration: 4 },
          { name: "Exhale", duration: 4 },
          { name: "Hold", duration: 4 }
        ]
      },
      "belly": {
        name: "Belly Breathing",
        description: "Inhale deeply through your nose, allowing your belly to expand. Exhale slowly through your mouth. This technique helps relax mind and body.",
        phases: [
          { name: "Inhale", duration: 4 },
          { name: "Exhale", duration: 6 }
        ]
      }
    }
  };

  // State
  const state = {
    currentQuoteIndex: 0,
    currentVideoIndex: 0,
    currentVideoCategory: 'all',
    currentExerciseIndex: 0,
    currentExerciseCategory: 'all',
    currentBreathingTechnique: '478',
    favorites: JSON.parse(localStorage.getItem('motivationFavorites')) || [],
    breathingInterval: null,
    breathingPhase: 0
  };

  // DOM elements
  const elements = {
    tabs: document.querySelectorAll('.motivation-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    videoGrid: document.getElementById('videoGrid'),
    exerciseGrid: document.getElementById('exerciseGrid'),
    currentPage: document.getElementById('currentPage'),
    totalPages: document.getElementById('totalPages'),
    currentPageVideo: document.getElementById('currentPageVideo'),
    totalPagesVideo: document.getElementById('totalPagesVideo'),
    currentPageExercise: document.getElementById('currentPageExercise'),
    totalPagesExercise: document.getElementById('totalPagesExercise'),
    breathingCircle: document.getElementById('breathingCircle'),
    breathingText: document.getElementById('breathingText'),
    infoTitle: document.getElementById('infoTitle'),
    infoDescription: document.getElementById('infoDescription')
  };

  // Initialize components
  initializeTabs();
  initializeQuotes();
  initializeVideos();
  initializeExercises();
  initializeBreathing();

  // Tab functionality
  function initializeTabs() {
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;

        // Update active tab button
        elements.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active tab content
        elements.tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
      });
    });
  }

  // Quotes functionality
  function initializeQuotes() {
    // Initial render
    renderQuote();

    // Pagination buttons
    document.getElementById('prevPage').addEventListener('click', () => {
      state.currentQuoteIndex = (state.currentQuoteIndex - 1 + appData.quotes.length) % appData.quotes.length;
      renderQuote();
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      state.currentQuoteIndex = (state.currentQuoteIndex + 1) % appData.quotes.length;
      renderQuote();
    });

    // Action buttons
    document.getElementById('shareQuote').addEventListener('click', shareQuote);
    document.getElementById('saveQuote').addEventListener('click', saveQuote);
    document.getElementById('favoriteQuote').addEventListener('click', toggleFavorite);

    // Auto-rotate quotes
    setInterval(() => {
      state.currentQuoteIndex = (state.currentQuoteIndex + 1) % appData.quotes.length;
      renderQuote();
    }, 8000);
  }

  function renderQuote() {
    const quote = appData.quotes[state.currentQuoteIndex];
    elements.quoteText.textContent = quote.text;
    elements.quoteAuthor.textContent = `- ${quote.author}`;
    elements.currentPage.textContent = state.currentQuoteIndex + 1;
    elements.totalPages.textContent = appData.quotes.length;

    // Update favorite button
    const isFavorite = state.favorites.some(f => f.text === quote.text && f.author === quote.author);
    document.getElementById('favoriteQuote').innerHTML = `<span class="btn-emoji">${isFavorite ? '❤️' : '🤍'}</span>`;
  }

  function shareQuote() {
    const quote = appData.quotes[state.currentQuoteIndex];
    const text = `"${quote.text}" - ${quote.author}`;

    if (navigator.share) {
      navigator.share({
        title: 'Mood Companion Quote',
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      showNotification('Quote copied to clipboard', 'info');
    }
  }

  function saveQuote() {
    const quote = appData.quotes[state.currentQuoteIndex];

    if (!state.favorites.some(f => f.text === quote.text && f.author === quote.author)) {
      state.favorites.push(quote);
      localStorage.setItem('motivationFavorites', JSON.stringify(state.favorites));
      showNotification('Quote saved to favorites', 'success');
    } else {
      showNotification('Quote already in favorites', 'info');
    }
  }

  function toggleFavorite() {
    const quote = appData.quotes[state.currentQuoteIndex];
    const index = state.favorites.findIndex(f => f.text === quote.text && f.author === quote.author);

    if (index === -1) {
      state.favorites.push(quote);
      showNotification('Quote added to favorites', 'success');
    } else {
      state.favorites.splice(index, 1);
      showNotification('Quote removed from favorites', 'info');
    }

    localStorage.setItem('motivationFavorites', JSON.stringify(state.favorites));
    renderQuote();
  }

  // Videos functionality
  function initializeVideos() {
    // Initial render
    renderVideos();

    // Category tabs
    const videoCategoryTabs = document.querySelectorAll('#videos .category-tab');
    videoCategoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        videoCategoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        state.currentVideoCategory = tab.dataset.category;
        state.currentVideoIndex = 0;
        renderVideos();
      });
    });

    // Pagination buttons
    document.getElementById('prevVideoPage').addEventListener('click', () => {
      const videosToShow = getFilteredVideos();
      state.currentVideoIndex = (state.currentVideoIndex - 1 + videosToShow.length) % videosToShow.length;
      renderVideos();
    });

    document.getElementById('nextVideoPage').addEventListener('click', () => {
      const videosToShow = getFilteredVideos();
      state.currentVideoIndex = (state.currentVideoIndex + 1) % videosToShow.length;
      renderVideos();
    });
  }

  function getFilteredVideos() {
    return state.currentVideoCategory === 'all'
      ? appData.videos
      : appData.videos.filter(v => v.category === state.currentVideoCategory);
  }

  function renderVideos() {
    const videosToShow = getFilteredVideos();

    elements.videoGrid.innerHTML = '';

    videosToShow.forEach((video, index) => {
      const videoCard = document.createElement('div');
      videoCard.className = 'video-card';

      videoCard.innerHTML = `
        <div class="video-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" />
        </div>
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          <div class="video-description">${video.description}</div>
          <div class="video-duration">⏱ ${video.duration}</div>
        </div>
      `;

      videoCard.addEventListener('click', () => {
        // Open video in modal or new window
        window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
      });

      elements.videoGrid.appendChild(videoCard);
    });

    // Update pagination
    elements.currentPageVideo.textContent = state.currentVideoIndex + 1;
    elements.totalPagesVideo.textContent = videosToShow.length;
  }

  // Exercises functionality
  function initializeExercises() {
    // Initial render
    renderExercises();

    // Category tabs
    const exerciseCategoryTabs = document.querySelectorAll('#exercises .category-tab');
    exerciseCategoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        exerciseCategoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        state.currentExerciseCategory = tab.dataset.category;
        state.currentExerciseIndex = 0;
        renderExercises();
      });
    });

    // Pagination buttons
    document.getElementById('prevExercisePage').addEventListener('click', () => {
      const exercisesToShow = getFilteredExercises();
      state.currentExerciseIndex = (state.currentExerciseIndex - 1 + exercisesToShow.length) % exercisesToShow.length;
      renderExercises();
    });

    document.getElementById('nextExercisePage').addEventListener('click', () => {
      const exercisesToShow = getFilteredExercises();
      state.currentExerciseIndex = (state.currentExerciseIndex + 1) % exercisesToShow.length;
      renderExercises();
    });
  }

  function getFilteredExercises() {
    return state.currentExerciseCategory === 'all'
      ? appData.exercises.all
      : appData.exercises[state.currentExerciseCategory] || [];
  }

  function renderExercises() {
    const exercisesToShow = getFilteredExercises();

    elements.exerciseGrid.innerHTML = '';

    exercisesToShow.forEach((exercise, index) => {
      const exerciseCard = document.createElement('div');
      exerciseCard.className = 'exercise-card';

      exerciseCard.innerHTML = `
        <div class="exercise-thumbnail">
          <div class="exercise-title">${exercise.title}</div>
          <div class="exercise-description">${exercise.description}</div>
        </div>
        <div class="exercise-details">
          <div class="exercise-instructions">${exercise.instructions}</div>
          <div class="exercise-duration">⏱ ${exercise.duration}</div>
        </div>
      `;

      exerciseCard.addEventListener('click', () => {
        state.currentExerciseIndex = index;
        renderExercises();
      });

      elements.exerciseGrid.appendChild(exerciseCard);
    });

    // Update pagination
    elements.currentPageExercise.textContent = state.currentExerciseIndex + 1;
    elements.totalPagesExercise.textContent = exercisesToShow.length;
  }

  // Breathing functionality
  function initializeBreathing() {
    // Breathing technique options
    const breathingOptions = document.querySelectorAll('.breathing-option');
    breathingOptions.forEach(option => {
      option.addEventListener('click', () => {
        breathingOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');

        state.currentBreathingTechnique = option.dataset.technique;
        updateBreathingInfo();
        resetBreathing();
      });
    });

    // Breathing controls
    document.getElementById('startBreathing').addEventListener('click', startBreathing);
    document.getElementById('pauseBreathing').addEventListener('click', pauseBreathing);
    document.getElementById('resetBreathing').addEventListener('click', resetBreathing);

    // Initialize with first technique
    updateBreathingInfo();
  }

  function updateBreathingInfo() {
    const technique = appData.breathingTechniques[state.currentBreathingTechnique];
    elements.infoTitle.textContent = technique.name;
    elements.infoDescription.textContent = technique.description;
  }

  function startBreathing() {
    if (state.breathingInterval) return;

    const technique = appData.breathingTechniques[state.currentBreathingTechnique];
    state.breathingPhase = 0;

    runBreathingCycle();

    state.breathingInterval = setInterval(() => {
      state.breathingPhase = (state.breathingPhase + 1) % technique.phases.length;
      runBreathingCycle();
    }, 1000);
  }

  function runBreathingCycle() {
    const technique = appData.breathingTechniques[state.currentBreathingTechnique];
    const phase = technique.phases[state.breathingPhase];

    elements.breathingText.textContent = phase.name;

    // Update circle animation
    elements.breathingCircle.className = 'breathing-circle';

    if (phase.name === 'Inhale') {
      setTimeout(() => {
        elements.breathingCircle.classList.add('inhale');
      }, 50);
    } else if (phase.name === 'Hold') {
      setTimeout(() => {
        elements.breathingCircle.classList.add('hold');
      }, 50);
    } else if (phase.name === 'Exhale') {
      setTimeout(() => {
        elements.breathingCircle.classList.add('exhale');
      }, 50);
    }
  }

  function pauseBreathing() {
    if (state.breathingInterval) {
      clearInterval(state.breathingInterval);
      state.breathingInterval = null;
      elements.breathingText.textContent = 'Paused';
    }
  }

  function resetBreathing() {
    pauseBreathing();
    elements.breathingCircle.className = 'breathing-circle';
    elements.breathingText.textContent = 'Ready to begin';
    state.breathingPhase = 0;
  }

  // Utility function to show notifications
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    if (type === 'success') {
      notification.style.background = 'rgba(76, 175, 80, 0.9)';
      notification.style.color = 'white';
    } else {
      notification.style.background = 'rgba(139, 92, 246, 0.9)';
      notification.style.color = 'white';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}// Fixed: Added missing closing bracket for the showMotivation function

// --- Global State ---

// --- Helper Functions for Chatbot UI ---

// Helper function to escape HTML to prevent XSS attacks
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Function to append a styled message to the chat window
// --- Enhanced Chat Message Display with Typing Animation ---
function appendChatMessage(who, txt, isTyping = false) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) return;

  const d = document.createElement('div');
  d.style.margin = '10px 0';
  d.style.padding = '14px 18px';
  d.style.borderRadius = '18px';
  d.style.maxWidth = '75%';
  d.style.wordWrap = 'break-word';
  d.style.lineHeight = '1.6';
  d.style.fontSize = '15px';
  d.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)';
  d.style.animation = 'fadeIn 0.35s ease';
  d.style.backdropFilter = 'blur(10px)';
  d.style.display = 'inline-block';
  d.style.transition = 'all 0.25s ease';

  // 🌈 Modern gradients + better contrast
  if (who === 'You') {
    // 💬 User message bubble
    d.style.background = 'linear-gradient(135deg, #67e8f9, #3b82f6)';
    d.style.color = '#ffffff';
    d.style.marginLeft = 'auto';
    d.style.borderBottomRightRadius = '6px';
  } else {
    // 🤖 Bot message bubble
    d.style.background = 'rgba(255, 255, 255, 0.6)';
    d.style.color = '#1e293b';
    d.style.marginRight = 'auto';
    d.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    d.style.borderBottomLeftRadius = '6px';
  }

  // Typing animation for bot
  if (isTyping && who === 'Bot') {
    d.innerHTML = `
      <strong style="color:#2563eb;">${who}:</strong>
      <span class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    `;
  } else {
    d.innerHTML = `
      <strong style="color:#2563eb;">${who}:</strong>
      <span class="bot-text">${escapeHtml(txt)}</span>
    `;
  }

  chatWindow.appendChild(d);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // ✅ Inject CSS styles once
  if (!document.getElementById('chat-style')) {
    const style = document.createElement('style');
    style.id = 'chat-style';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .typing-dots span {
        display: inline-block;
        font-size: 18px;
        animation: blink 1.4s infinite both;
        color: #2563eb;
      }

      .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
      .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes blink {
        0%, 80%, 100% { opacity: 0; }
        40% { opacity: 1; }
      }

      .bot-text {
        display: inline-block;
        color: #1e293b;
        font-weight: 400;
      }

      /* 🌸 Smooth scrollbar for chat area */
      #chatWindow::-webkit-scrollbar {
        width: 8px;
      }
      #chatWindow::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #93c5fd, #3b82f6);
        border-radius: 10px;
      }
      #chatWindow::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.2);
      }
    `;
    document.head.appendChild(style);
  }

  return d;
}

// --- Ultra-Enhanced Chatbot UI with Emoji-Based Interface and Chat History ---
function showChatbot() {
  const main = document.getElementById('maincard');
  main.innerHTML = `
    <div class="chatbot-container" id="chatbotContainer">
      <div class="chatbot-header">
        <div class="header-content">
          <div class="bot-avatar" id="botAvatar">
            <div class="bot-image">🧘‍♀️</div>
            <div class="status-indicator online"></div>
          </div>
          <div class="bot-info">
            <h3 class="bot-name">Mood Companion</h3>
            <p class="bot-status">
              <span class="status-text">Active now</span>
              <span class="typing-status" style="display: none;">typing...</span>
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" id="historyBtn" title="Chat history">
            <span class="btn-emoji">📚</span>
          </button>
          <button class="action-btn" id="themeToggle" title="Toggle theme">
            <span class="btn-emoji">🌙</span>
          </button>
          <button class="action-btn" id="searchBtn" title="Search messages">
            <span class="btn-emoji">🔍</span>
          </button>
          <button class="action-btn" id="clearChat" title="Clear chat">
            <span class="btn-emoji">🗑️</span>
          </button>
        </div>
      </div>
      
      <div class="history-container" id="historyContainer" style="display: none;">
        <div class="history-header">
          <h3 class="history-title">
            <span class="history-emoji">📚</span>
            <span>Chat History</span>
          </h3>
          <button class="history-close" id="historyClose">❌</button>
        </div>
        <div class="history-controls">
          <button class="history-control-btn" id="exportHistory" title="Export history">
            <span class="control-emoji">💾</span>
            <span>Export</span>
          </button>
          <button class="history-control-btn" id="clearHistory" title="Clear all history">
            <span class="control-emoji">🗑️</span>
            <span>Clear All</span>
          </button>
        </div>
        <div class="history-list" id="historyList">
          <div class="history-loading">Loading chat history...</div>
        </div>
      </div>
      
      <div class="search-container" id="searchContainer" style="display: none;">
        <div class="search-wrapper">
          <span class="search-emoji">🔍</span>
          <input type="text" id="searchInput" placeholder="Search in conversation..." class="search-input">
          <button class="search-close" id="searchClose">❌</button>
        </div>
        <div class="search-results" id="searchResults"></div>
      </div>
      
      <div class="chat-window" id="chatWindow">
        <div class="welcome-message">
          <div class="bot-message">
            <div class="message-avatar">🧘‍♀️</div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-time">Just now</span>
                <span class="message-status">✓✓</span>
              </div>
              <p>Hello! I'm your mood companion. I'm here to listen without judgment and support you on your journey. How are you feeling today?</p>
              <div class="mood-selector">
                <div class="mood-label">
                  <span class="mood-label-emoji">💖</span>
                  <span>How are you feeling?</span>
                </div>
                <div class="mood-options">
                  <button class="mood-option" data-mood="happy" title="Happy">
                    <span class="mood-emoji">😊</span>
                    <span class="mood-text">Happy</span>
                  </button>
                  <button class="mood-option" data-mood="sad" title="Sad">
                    <span class="mood-emoji">😢</span>
                    <span class="mood-text">Sad</span>
                  </button>
                  <button class="mood-option" data-mood="anxious" title="Anxious">
                    <span class="mood-emoji">😰</span>
                    <span class="mood-text">Anxious</span>
                  </button>
                  <button class="mood-option" data-mood="angry" title="Angry">
                    <span class="mood-emoji">😠</span>
                    <span class="mood-text">Angry</span>
                  </button>
                  <button class="mood-option" data-mood="neutral" title="Neutral">
                    <span class="mood-emoji">😐</span>
                    <span class="mood-text">Neutral</span>
                  </button>
                  <button class="mood-option" data-mood="hopeful" title="Hopeful">
                    <span class="mood-emoji">🤗</span>
                    <span class="mood-text">Hopeful</span>
                  </button>
                </div>
              </div>
              <div class="message-suggestions">
                <button class="suggestion-btn" data-suggestion="I'm feeling anxious">
                  <span class="suggestion-emoji">☁️</span>
                  <span>I'm feeling anxious</span>
                </button>
                <button class="suggestion-btn" data-suggestion="I had a good day">
                  <span class="suggestion-emoji">☀️</span>
                  <span>I had a good day</span>
                </button>
                <button class="suggestion-btn" data-suggestion="I need motivation">
                  <span class="suggestion-emoji">🚀</span>
                  <span>I need motivation</span>
                </button>
                <button class="suggestion-btn" data-suggestion="I feel overwhelmed">
                  <span class="suggestion-emoji">🌊</span>
                  <span>I feel overwhelmed</span>
                </button>
              </div>
              <div class="message-actions">
                <button class="reaction-btn" title="React">
                  <span class="action-emoji">👍</span>
                </button>
                <button class="copy-btn" title="Copy">
                  <span class="action-emoji">📋</span>
                </button>
                <button class="share-btn" title="Share">
                  <span class="action-emoji">📤</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chat-input-container">
        <div class="input-wrapper">
          <button class="attach-btn" id="attachBtn" title="Attach file">
            <span class="input-emoji">📎</span>
          </button>
          <button class="emoji-btn" id="emojiBtn" title="Add emoji">
            <span class="input-emoji">😊</span>
          </button>
          <textarea id="chatInput" placeholder="Share your thoughts..." 
                   class="chat-input" rows="1" maxlength="500"></textarea>
          <button class="voice-btn" id="voiceBtn" title="Voice input">
            <span class="input-emoji">🎤</span>
          </button>
          <button class="send-btn" id="sendChat" title="Send message">
            <span class="send-emoji">📤</span>
          </button>
        </div>
        <div class="input-footer">
          <div class="left-footer">
            <span class="char-counter" id="charCounter">
              <span class="counter-emoji">⌨️</span>
              <span>0 / 500</span>
            </span>
          </div>
          <div class="right-footer">
            <span class="typing-hint" id="typingHint">
              <span class="hint-emoji">ℹ️</span>
              <span>Enter to send</span>
            </span>
          </div>
        </div>
      </div>
      
      <div class="typing-indicator" id="typingIndicator">
        <div class="typing-avatar">🧘‍♀️</div>
        <div class="typing-content">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">Companion is typing</span>
        </div>
      </div>
    </div>
  `;

  // Enhanced CSS with purple gradient theme
  const chatStyles = document.createElement('style');
  chatStyles.id = 'chatbot-ultra-enhanced-styles';
  chatStyles.textContent = `
    .chatbot-container {
      display: flex;
      flex-direction: column;
      height: 550px;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
      position: relative;
      transition: all 0.3s ease;
    }
    
    .chatbot-container.dark-theme {
      background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #6d28d9 100%);
    }
    
    .chatbot-header {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 10;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .bot-avatar {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.3);
      position: relative;
      transition: transform 0.3s ease;
      overflow: hidden;
    }
    
    .bot-avatar:hover {
      transform: scale(1.05);
    }
    
    .bot-image {
      font-size: 28px;
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    
    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      transition: all 0.3s ease;
    }
    
    .status-indicator.online {
      background: #4ade80;
      animation: pulse 2s infinite;
    }
    
    .status-indicator.offline {
      background: #ef4444;
    }
    
    .status-indicator.away {
      background: #f59e0b;
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
      100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
    }
    
    .bot-info h3 {
      margin: 0;
      color: white;
      font-size: 18px;
      font-weight: 600;
      transition: color 0.3s ease;
    }
    
    .bot-status {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .typing-status {
      color: #4ade80;
      font-style: italic;
      animation: fadeInOut 1.5s infinite;
    }
    
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    .action-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .action-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.3s, height 0.3s;
    }
    
    .action-btn:hover::before {
      width: 100%;
      height: 100%;
    }
    
    .action-btn:hover {
      transform: scale(1.1);
      background: rgba(255, 255, 255, 0.3);
    }
    
    .action-btn:active {
      transform: scale(0.95);
    }
    
    .btn-emoji {
      font-size: 18px;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
    }
    
    /* Chat History Styles */
    .history-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      z-index: 20;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease;
    }
    
    .chatbot-container.dark-theme .history-container {
      background: rgba(30, 30, 30, 0.95);
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .chatbot-container.dark-theme .history-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .history-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }
    
    .chatbot-container.dark-theme .history-title {
      color: #e0e0e0;
    }
    
    .history-emoji {
      font-size: 20px;
    }
    
    .history-close {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.1);
      color: #666;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chatbot-container.dark-theme .history-close {
      background: rgba(255, 255, 255, 0.1);
      color: #aaa;
    }
    
    .history-close:hover {
      background: rgba(0, 0, 0, 0.2);
      transform: rotate(90deg);
    }
    
    .chatbot-container.dark-theme .history-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .history-controls {
      display: flex;
      gap: 10px;
      padding: 10px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .chatbot-container.dark-theme .history-controls {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .history-control-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 8px 12px;
      border: none;
      border-radius: 20px;
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .chatbot-container.dark-theme .history-control-btn {
      background: rgba(139, 92, 246, 0.2);
      color: #a5b4fc;
    }
    
    .history-control-btn:hover {
      background: rgba(139, 92, 246, 0.2);
      transform: translateY(-2px);
    }
    
    .chatbot-container.dark-theme .history-control-btn:hover {
      background: rgba(139, 92, 246, 0.3);
    }
    
    .control-emoji {
      font-size: 14px;
    }
    
    .history-list {
      flex: 1;
      overflow-y: auto;
      padding: 15px 20px;
    }
    
    .history-loading {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 20px;
    }
    
    .chatbot-container.dark-theme .history-loading {
      color: #aaa;
    }
    
    .history-item {
      margin-bottom: 15px;
      padding: 12px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .chatbot-container.dark-theme .history-item {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .history-item:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .chatbot-container.dark-theme .history-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .history-date {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .chatbot-container.dark-theme .history-date {
      color: #aaa;
    }
    
    .history-preview {
      font-size: 14px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .chatbot-container.dark-theme .history-preview {
      color: #e0e0e0;
    }
    
    .history-empty {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 20px;
    }
    
    .chatbot-container.dark-theme .history-empty {
      color: #aaa;
    }
    
    .search-container {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .search-wrapper {
      display: flex;
      gap: 10px;
      align-items: center;
      position: relative;
    }
    
    .search-emoji {
      position: absolute;
      left: 15px;
      font-size: 16px;
      z-index: 1;
      filter: opacity(0.7);
    }
    
    .search-input {
      flex: 1;
      padding: 10px 15px 10px 40px;
      border: none;
      border-radius: 25px;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      font-size: 14px;
      outline: none;
      transition: all 0.3s ease;
    }
    
    .search-input:focus {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .search-close {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .search-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
    
    .search-results {
      margin-top: 10px;
      max-height: 100px;
      overflow-y: auto;
    }
    
    .search-result-item {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-bottom: 5px;
      color: white;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .search-result-item:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .search-result-item .result-emoji {
      font-size: 14px;
      opacity: 0.7;
    }
    
    .chat-window {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
      display: flex;
      flex-direction: column;
      gap: 15px;
      position: relative;
    }
    
    .chat-window::-webkit-scrollbar {
      width: 8px;
    }
    
    .chat-window::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .chat-window::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    
    .chat-window::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.4);
    }
    
    .bot-message, .user-message {
      display: flex;
      gap: 12px;
      animation: messageSlide 0.4s ease-out;
      position: relative;
    }
    
    .user-message {
      flex-direction: row-reverse;
    }
    
    .message-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      transition: transform 0.3s ease;
      cursor: pointer;
    }
    
    .message-avatar:hover {
      transform: scale(1.1);
    }
    
    .bot-message .message-avatar {
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      box-shadow: 0 4px 8px rgba(255, 154, 158, 0.3);
    }
    
    .user-message .message-avatar {
      background: linear-gradient(135deg, #f093fb, #f5576c);
      box-shadow: 0 4px 8px rgba(240, 147, 251, 0.3);
    }
    
    .message-content {
      max-width: 70%;
      padding: 14px 18px;
      border-radius: 20px;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .message-content:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
    
    .bot-message .message-content {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-bottom-left-radius: 6px;
    }
    
    .user-message .message-content {
      background: linear-gradient(135deg, #f093fb, #f5576c);
      color: white;
      border-bottom-right-radius: 6px;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 11px;
      opacity: 0.7;
    }
    
    .message-time {
      color: inherit;
    }
    
    .message-status {
      color: #4ade80;
      font-size: 12px;
    }
    
    .message-content p {
      margin: 0;
      line-height: 1.5;
      font-size: 14px;
      word-wrap: break-word;
    }
    
    .mood-selector {
      margin: 15px 0;
      padding: 12px;
      background: rgba(139, 92, 246, 0.05);
      border-radius: 12px;
    }
    
    .mood-label {
      font-size: 13px;
      font-weight: 600;
      color: #8b5cf6;
      margin-bottom: 10px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .mood-label-emoji {
      font-size: 16px;
    }
    
    .mood-options {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .mood-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 6px;
      border: none;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 60px;
    }
    
    .mood-option:hover {
      background: rgba(139, 92, 246, 0.2);
      transform: translateY(-3px);
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.2);
    }
    
    .mood-option.selected {
      background: rgba(139, 92, 246, 0.3);
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
    }
    
    .mood-emoji {
      font-size: 20px;
      margin-bottom: 4px;
    }
    
    .mood-text {
      font-size: 10px;
      font-weight: 500;
      color: #666;
    }
    
    .message-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    
    .suggestion-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 18px;
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .suggestion-emoji {
      font-size: 14px;
    }
    
    .suggestion-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.2);
      transform: translate(-50%, -50%);
      transition: width 0.3s, height 0.3s;
    }
    
    .suggestion-btn:hover::before {
      width: 100%;
      height: 100%;
    }
    
    .suggestion-btn:hover {
      background: rgba(139, 92, 246, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.2);
    }
    
    .message-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .message-content:hover .message-actions {
      opacity: 1;
    }
    
    .reaction-btn, .copy-btn, .share-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .action-emoji {
      font-size: 14px;
    }
    
    .reaction-btn:hover, .copy-btn:hover, .share-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: scale(1.1);
    }
    
    .chat-input-container {
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 28px;
      padding: 10px 15px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transition: all 0.3s ease;
    }
    
    .input-wrapper:focus-within {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .attach-btn, .emoji-btn, .voice-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .attach-btn:hover, .emoji-btn:hover, .voice-btn:hover {
      background: rgba(139, 92, 246, 0.1);
      transform: scale(1.1);
    }
    
    .voice-btn.recording {
      animation: recordPulse 1.5s infinite;
    }
    
    .voice-btn.recording .input-emoji {
      animation: recordBlink 1.5s infinite;
    }
    
    @keyframes recordPulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    
    @keyframes recordBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .send-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.3s, height 0.3s;
    }
    
    .send-btn:hover::before {
      width: 100%;
      height: 100%;
    }
    
    .send-btn:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
    }
    
    .send-btn:active {
      transform: scale(0.95);
    }
    
    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: scale(1);
    }
    
    .input-emoji {
      font-size: 18px;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
    }
    
    .send-emoji {
      font-size: 20px;
      filter: drop-shadow(0 1px 2px rgba(255,255,255,0.3));
    }
    
    .chat-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      padding: 8px 5px;
      background: transparent;
      color: #333;
      resize: none;
      max-height: 100px;
      line-height: 1.4;
      font-family: inherit;
    }
    
    .chat-input::placeholder {
      color: #999;
    }
    
    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding: 0 5px;
    }
    
    .left-footer, .right-footer {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .char-counter, .typing-hint {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      transition: color 0.3s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .counter-emoji, .hint-emoji {
      font-size: 12px;
    }
    
    .char-counter.warning {
      color: #f59e0b;
    }
    
    .char-counter.danger {
      color: #ef4444;
    }
    
    .typing-indicator {
      display: none;
      align-items: center;
      gap: 12px;
      padding: 0 20px 15px;
      animation: fadeIn 0.3s ease;
    }
    
    .typing-indicator.active {
      display: flex;
    }
    
    .typing-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      animation: bounce 1.5s infinite;
    }
    
    .typing-content {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.9);
      padding: 10px 15px;
      border-radius: 20px;
      border-bottom-left-radius: 6px;
    }
    
    .typing-dots {
      display: flex;
      gap: 4px;
    }
    
    .typing-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #8b5cf6;
      animation: typing 1.4s infinite;
    }
    
    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    .typing-text {
      color: #666;
      font-size: 13px;
      font-style: italic;
    }
    
    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.6;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Emoji Picker Styles */
    .emoji-picker {
      position: absolute;
      bottom: 70px;
      left: 20px;
      background: white;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      width: 320px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .emoji-categories {
      display: flex;
      gap: 5px;
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }
    
    .emoji-category {
      padding: 5px 10px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 15px;
      font-size: 18px;
      transition: background 0.2s ease;
    }
    
    .emoji-category:hover, .emoji-category.active {
      background: #f0f0f0;
    }
    
    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 5px;
    }
    
    .emoji-item {
      width: 35px;
      height: 35px;
      border: none;
      background: none;
      font-size: 20px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .emoji-item:hover {
      background: #f0f0f0;
      transform: scale(1.2);
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .chatbot-container {
        height: 450px;
        border-radius: 15px;
      }
      
      .message-content {
        max-width: 85%;
      }
      
      .mood-options {
        justify-content: center;
      }
      
      .message-suggestions {
        flex-direction: column;
      }
      
      .suggestion-btn {
        width: 100%;
        text-align: left;
        justify-content: flex-start;
      }
      
      .emoji-picker {
        width: 280px;
        left: 10px;
        right: 10px;
      }
      
      .emoji-grid {
        grid-template-columns: repeat(6, 1fr);
      }
      
      .action-btn {
        width: 35px;
        height: 35px;
      }
      
      .btn-emoji {
        font-size: 16px;
      }
      
      .attach-btn, .emoji-btn, .voice-btn {
        width: 32px;
        height: 32px;
      }
      
      .input-emoji {
        font-size: 16px;
      }
      
      .send-btn {
        width: 36px;
        height: 36px;
      }
      
      .send-emoji {
        font-size: 18px;
      }
    }
    
    /* Dark Theme Styles */
    .chatbot-container.dark-theme .message-content {
      background: rgba(30, 30, 30, 0.95);
      color: #e0e0e0;
    }
    
    .chatbot-container.dark-theme .input-wrapper {
      background: rgba(30, 30, 30, 0.95);
    }
    
    .chatbot-container.dark-theme .chat-input {
      color: #e0e0e0;
    }
    
    .chatbot-container.dark-theme .chat-input::placeholder {
      color: #888;
    }
    
    .chatbot-container.dark-theme .suggestion-btn {
      background: rgba(139, 92, 246, 0.2);
      color: #a5b4fc;
    }
    
    .chatbot-container.dark-theme .typing-content {
      background: rgba(30, 30, 30, 0.95);
    }
    
    .chatbot-container.dark-theme .typing-text {
      color: #a0a0a0;
    }
    
    .chatbot-container.dark-theme .mood-option {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .chatbot-container.dark-theme .mood-text {
      color: #e0e0e0;
    }
    
    .chatbot-container.dark-theme .search-result-item {
      color: #e0e0e0;
    }
    
    .chatbot-container.dark-theme .search-result-item .result-emoji {
      opacity: 0.7;
    }
  `;

  // Only add styles if not already present
  if (!document.getElementById('chatbot-ultra-enhanced-styles')) {
    document.head.appendChild(chatStyles);
  }

  // Initialize variables
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChat');
  const typingIndicator = document.getElementById('typingIndicator');
  const clearChatBtn = document.getElementById('clearChat');
  const emojiBtn = document.getElementById('emojiBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const attachBtn = document.getElementById('attachBtn');
  const themeToggle = document.getElementById('themeToggle');
  const searchBtn = document.getElementById('searchBtn');
  const searchContainer = document.getElementById('searchContainer');
  const searchInput = document.getElementById('searchInput');
  const searchClose = document.getElementById('searchClose');
  const searchResults = document.getElementById('searchResults');
  const chatWindow = document.getElementById('chatWindow');
  const charCounter = document.getElementById('charCounter');
  const chatbotContainer = document.getElementById('chatbotContainer');
  const botAvatar = document.getElementById('botAvatar');
  const statusText = document.querySelector('.status-text');
  const typingStatus = document.querySelector('.typing-status');
  const moodOptions = document.querySelectorAll('.mood-option');

  // Chat history elements
  const historyBtn = document.getElementById('historyBtn');
  const historyContainer = document.getElementById('historyContainer');
  const historyClose = document.getElementById('historyClose');
  const historyList = document.getElementById('historyList');
  const exportHistoryBtn = document.getElementById('exportHistory');
  const clearHistoryBtn = document.getElementById('clearHistory');

  // Initialize chat history
  let chatHistory = JSON.parse(localStorage.getItem('moodCompanionChatHistory')) || [];
  // Initialize chat history if not exists
  if (!window.state) window.state = { chatHistory: [] };

  let isDarkTheme = false;
  let isRecording = false;
  let recognition = null;
  let selectedMood = null;

  // Load chat history on initialization
  loadChatHistory();

  // Auto-resize textarea
  chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    updateCharCounter();
  });

  // Update character counter
  function updateCharCounter() {
    const length = chatInput.value.length;
    const remaining = 500 - length;
    const counterSpan = charCounter.querySelector('span:last-child');
    counterSpan.textContent = `${length} / 500`;

    if (remaining < 50) {
      charCounter.classList.add('warning');
    } else {
      charCounter.classList.remove('warning');
    }

    if (remaining < 20) {
      charCounter.classList.add('danger');
    } else {
      charCounter.classList.remove('danger');
    }
  }

  // Format timestamp
  function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Save chat history to localStorage
  function saveChatHistory() {
    localStorage.setItem('moodCompanionChatHistory', JSON.stringify(chatHistory));
  }

  // Load chat history from localStorage
  function loadChatHistory() {
    const savedHistory = JSON.parse(localStorage.getItem('moodCompanionChatHistory')) || [];
    chatHistory = savedHistory;

    // Display current session messages
    if (window.state.chatHistory && window.state.chatHistory.length > 0) {
      window.state.chatHistory.forEach(msg => {
        if (msg.role === 'user') {
          addMessage('You', msg.content);
        } else if (msg.role === 'assistant') {
          addMessage('Bot', msg.content);
        }
      });
    }
  }

  // Display chat history in the history panel
  function displayChatHistory() {
    if (chatHistory.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No chat history yet. Start a conversation!</div>';
      return;
    }

    historyList.innerHTML = '';

    // Group messages by date
    const groupedHistory = {};
    chatHistory.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString();
      if (!groupedHistory[date]) {
        groupedHistory[date] = [];
      }
      groupedHistory[date].push(msg);
    });

    // Display grouped history
    Object.keys(groupedHistory).reverse().forEach(date => {
      const dateItem = document.createElement('div');
      dateItem.className = 'history-date';
      dateItem.textContent = date;
      historyList.appendChild(dateItem);

      groupedHistory[date].forEach(msg => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
          <div class="history-preview">${msg.sender === 'user' ? '👤 ' : '🧘‍♀️ '}${escapeHtml(msg.content.substring(0, 50))}${msg.content.length > 50 ? '...' : ''}</div>
        `;

        historyItem.addEventListener('click', () => {
          // Load this conversation
          loadConversation(date);
          historyContainer.style.display = 'none';
        });

        historyList.appendChild(historyItem);
      });
    });
  }

  // Load a specific conversation by date
  function loadConversation(date) {
    const messages = chatHistory.filter(msg =>
      new Date(msg.timestamp).toLocaleDateString() === date
    );

    // Clear current chat
    const welcomeMessage = chatWindow.querySelector('.welcome-message');
    chatWindow.innerHTML = '';
    if (welcomeMessage) {
      chatWindow.appendChild(welcomeMessage);
    }

    // Load messages
    messages.forEach(msg => {
      if (msg.sender === 'user') {
        addMessage('You', msg.content);
      } else if (msg.sender === 'bot') {
        addMessage('Bot', msg.content);
      }
    });
  }

  // Export chat history
  function exportChatHistory() {
    if (chatHistory.length === 0) {
      alert('No chat history to export.');
      return;
    }

    // Format history for export
    let exportText = 'Mood Companion Chat History\n\n';

    // Group by date
    const groupedHistory = {};
    chatHistory.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString();
      if (!groupedHistory[date]) {
        groupedHistory[date] = [];
      }
      groupedHistory[date].push(msg);
    });

    // Format each date's messages
    Object.keys(groupedHistory).forEach(date => {
      exportText += `=== ${date} ===\n\n`;
      groupedHistory[date].forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        exportText += `[${time}] ${msg.sender === 'user' ? 'You' : 'Companion'}: ${msg.content}\n\n`;
      });
    });

    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-companion-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clear all chat history
  function clearAllHistory() {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      chatHistory = [];
      localStorage.removeItem('moodCompanionChatHistory');
      displayChatHistory();

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4ade80;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `;
      successMsg.textContent = 'Chat history cleared successfully!';
      document.body.appendChild(successMsg);

      setTimeout(() => {
        successMsg.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 300);
      }, 3000);
    }
  }

  // Function to add message to chat
  function addMessage(who, text, isTyping = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${who.toLowerCase()}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = who === 'You' ? '👤' : '🧘‍♀️';

    const content = document.createElement('div');
    content.className = 'message-content';

    if (isTyping) {
      content.innerHTML = `
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="message-header">
          <span class="message-time">${formatTimestamp()}</span>
          <span class="message-status">${who === 'You' ? '✓✓' : ''}</span>
        </div>
        <p>${escapeHtml(text)}</p>
        <div class="message-actions">
          <button class="reaction-btn" title="React">
            <span class="action-emoji">👍</span>
          </button>
          <button class="copy-btn" title="Copy">
            <span class="action-emoji">📋</span>
          </button>
          <button class="share-btn" title="Share">
            <span class="action-emoji">📤</span>
          </button>
        </div>
      `;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Add event listeners for message actions
    if (!isTyping) {
      const reactionBtn = content.querySelector('.reaction-btn');
      const copyBtn = content.querySelector('.copy-btn');
      const shareBtn = content.querySelector('.share-btn');

      reactionBtn.addEventListener('click', () => {
        const emoji = reactionBtn.querySelector('.action-emoji');
        if (emoji.textContent === '👍') {
          emoji.textContent = '❤️';
          reactionBtn.style.color = '#ef4444';
        } else {
          emoji.textContent = '👍';
          reactionBtn.style.color = '';
        }
      });

      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text);
        const emoji = copyBtn.querySelector('.action-emoji');
        emoji.textContent = '✅';
        copyBtn.style.color = '#4ade80';
        setTimeout(() => {
          emoji.textContent = '📋';
          copyBtn.style.color = '';
        }, 2000);
      });

      shareBtn.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'Mood Companion Message',
            text: text
          });
        } else {
          navigator.clipboard.writeText(text);
          const emoji = shareBtn.querySelector('.action-emoji');
          emoji.textContent = '✅';
          shareBtn.style.color = '#4ade80';
          setTimeout(() => {
            emoji.textContent = '📤';
            shareBtn.style.color = '';
          }, 2000);
        }
      });
    }

    return messageDiv;
  }

  // Function to show typing indicator
  function showTyping() {
    typingIndicator.classList.add('active');
    typingStatus.style.display = 'inline';
    statusText.style.display = 'none';
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Function to hide typing indicator
  function hideTyping() {
    typingIndicator.classList.remove('active');
    typingStatus.style.display = 'none';
    statusText.style.display = 'inline';
  }

  // Enhanced emoji picker with categories
  const emojiCategories = {
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗'],
    gestures: ['👋', '🤝', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
    nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌴', '🌲', '🌳', '🌿', '🍀', '🌵', '🌾', '🌊', '💧', '🔥', '⭐'],
    activities: ['🎯', '🎮', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎹', '🥁', '🎸', '🎺', '🎷', '🎻', '🎲'],
    objects: ['💡', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📹', '🎥', '📼', '💿', '📀', '💾', '💽', '🖱️', '🖲️']
  };

  let currentCategory = 'smileys';
  let emojiPickerVisible = false;

  function showEmojiPicker() {
    if (emojiPickerVisible) return;

    const picker = document.createElement('div');
    picker.className = 'emoji-picker';

    // Category tabs
    const categories = document.createElement('div');
    categories.className = 'emoji-categories';

    Object.keys(emojiCategories).forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'emoji-category';
      if (cat === currentCategory) btn.classList.add('active');
      btn.textContent = cat === 'smileys' ? '😊' :
        cat === 'gestures' ? '👋' :
          cat === 'hearts' ? '❤️' :
            cat === 'nature' ? '🌸' :
              cat === 'activities' ? '🎮' : '📱';
      btn.onclick = () => {
        currentCategory = cat;
        updateEmojiGrid();
        document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
      categories.appendChild(btn);
    });

    // Emoji grid
    const grid = document.createElement('div');
    grid.className = 'emoji-grid';

    function updateEmojiGrid() {
      grid.innerHTML = '';
      emojiCategories[currentCategory].forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-item';
        btn.textContent = emoji;
        btn.onclick = () => {
          chatInput.value += emoji;
          chatInput.focus();
          picker.remove();
          emojiPickerVisible = false;
        };
        grid.appendChild(btn);
      });
    }

    updateEmojiGrid();
    picker.appendChild(categories);
    picker.appendChild(grid);

    main.appendChild(picker);
    emojiPickerVisible = true;

    // Close picker when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closePicker(e) {
        if (!picker.contains(e.target) && e.target !== emojiBtn) {
          picker.remove();
          emojiPickerVisible = false;
          document.removeEventListener('click', closePicker);
        }
      });
    }, 100);
  }

  // Voice input functionality
  function initVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        voiceBtn.classList.add('recording');
        voiceBtn.querySelector('.input-emoji').textContent = '⏹️';
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        chatInput.value = transcript;
        updateCharCounter();
      };

      recognition.onend = () => {
        voiceBtn.classList.remove('recording');
        voiceBtn.querySelector('.input-emoji').textContent = '🎤';
        isRecording = false;
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceBtn.classList.remove('recording');
        voiceBtn.querySelector('.input-emoji').textContent = '🎤';
        isRecording = false;
      };
    }
  }

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    chatbotContainer.classList.toggle('dark-theme');
    const emoji = themeToggle.querySelector('.btn-emoji');
    if (isDarkTheme) {
      emoji.textContent = '☀️';
    } else {
      emoji.textContent = '🌙';
    }
  });

  // Chat history functionality
  historyBtn.addEventListener('click', () => {
    historyContainer.style.display = 'flex';
    displayChatHistory();
  });

  historyClose.addEventListener('click', () => {
    historyContainer.style.display = 'none';
  });

  exportHistoryBtn.addEventListener('click', exportChatHistory);
  clearHistoryBtn.addEventListener('click', clearAllHistory);

  // Search functionality
  searchBtn.addEventListener('click', () => {
    searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
    if (searchContainer.style.display === 'block') {
      searchInput.focus();
    }
  });

  searchClose.addEventListener('click', () => {
    searchContainer.style.display = 'none';
    searchInput.value = '';
    searchResults.innerHTML = '';
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    const messages = chatWindow.querySelectorAll('.bot-message p, .user-message p');
    const results = [];

    messages.forEach(msg => {
      const text = msg.textContent.toLowerCase();
      if (text.includes(query)) {
        results.push(msg.textContent);
      }
    });

    searchResults.innerHTML = results.map(result =>
      `<div class="search-result-item">
        <span class="result-emoji">🔍</span>
        ${escapeHtml(result)}
      </div>`
    ).join('');
  });

  // Clear chat functionality
  clearChatBtn.addEventListener('click', () => {
    const welcomeMessage = chatWindow.querySelector('.welcome-message');
    chatWindow.innerHTML = '';
    if (welcomeMessage) {
      chatWindow.appendChild(welcomeMessage);
    }
    window.state.chatHistory = [];
  });

  // Voice input toggle
  voiceBtn.addEventListener('click', () => {
    if (!recognition) {
      initVoiceInput();
    }

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      isRecording = true;
    }
  });

  // File attachment (placeholder)
  attachBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        addMessage('You', `📎 Attached: ${file.name}`);
      }
    };
    input.click();
  });

  // Emoji picker
  emojiBtn.addEventListener('click', showEmojiPicker);

  // Handle mood selection
  moodOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      moodOptions.forEach(opt => opt.classList.remove('selected'));
      // Add selected class to clicked option
      option.classList.add('selected');
      // Store selected mood
      selectedMood = option.dataset.mood;
      // Add message with mood
      const moodText = option.querySelector('.mood-text').textContent;
      addMessage('You', `I'm feeling ${moodText}`);
      // Trigger API call with mood
      sendMoodMessage(selectedMood);
    });
  });

  // Handle suggestion buttons
  document.querySelectorAll('.suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.dataset.suggestion;
      chatInput.focus();
      sendMessage();
    });
  });

  // Send mood message function
  async function sendMoodMessage(mood) {
    showTyping();

    try {
      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ message: `I'm feeling ${mood}` })
      });

      const data = await res.json();
      hideTyping();

      if (data.success && data.reply) {
        addMessage('Bot', data.reply);
        window.state.chatHistory.push({ role: 'assistant', content: data.reply });

        // Save to chat history
        chatHistory.push({
          sender: 'user',
          content: `I'm feeling ${mood}`,
          timestamp: new Date().toISOString()
        });
        chatHistory.push({
          sender: 'bot',
          content: data.reply,
          timestamp: new Date().toISOString()
        });
        saveChatHistory();
      } else {
        addMessage('Bot', data.message || 'I apologize, but I encountered an error. Please try again.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      hideTyping();
      addMessage('Bot', '⚠️ Connection issue. Please check your internet connection and try again.');
    }
  }

  // Send message function
  async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Add user message
    addMessage('You', userMessage);

    // Save to chat history
    chatHistory.push({
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });
    saveChatHistory();

    chatInput.value = '';
    chatInput.style.height = 'auto';
    updateCharCounter();
    sendChatBtn.disabled = true;

    // Show typing indicator
    showTyping();

    try {
      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();

      // Hide typing indicator
      hideTyping();

      if (data.success && data.reply) {
        addMessage('Bot', data.reply);
        window.state.chatHistory.push({ role: 'assistant', content: data.reply });

        // Save to chat history
        chatHistory.push({
          sender: 'bot',
          content: data.reply,
          timestamp: new Date().toISOString()
        });
        saveChatHistory();
      } else {
        addMessage('Bot', data.message || 'I apologize, but I encountered an error. Please try again.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      hideTyping();
      addMessage('Bot', '⚠️ Connection issue. Please check your internet connection and try again.');
    } finally {
      sendChatBtn.disabled = false;
      chatInput.focus();
    }
  }

  // Event listeners
  sendChatBtn.onclick = sendMessage;
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Initialize
  updateCharCounter();
  initVoiceInput();
}
function showNotes() {
  const main = document.getElementById('maincard');
  if (!main) {
    console.error('maincard element not found');
    return;
  }

  main.innerHTML = `
    <div class="notes-container">
      <div class="notes-header">
        <h2 class="notes-title">
          <span class="title-icon">🌸</span>
          <span>Your Garden of Memories</span>
        </h2>
        
        <div class="controls">
          <div class="search-container">
            <input type="text" id="searchInput" placeholder="Search your memories..." class="search-input">
            <button id="clearSearch" class="clear-btn">✕</button>
          </div>
          
          <div class="filters">
            <select id="moodFilter" class="filter-select">
              <option value="all">All Moods</option>
              <option value="happy">😊 Happy</option>
              <option value="sad">😢 Sad</option>
              <option value="anxious">😰 Anxious</option>
              <option value="angry">😠 Angry</option>
              <option value="neutral">😐 Neutral</option>
              <option value="hopeful">🌟 Hopeful</option>
            </select>
            
            <select id="sortBy" class="filter-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="mood">By Mood</option>
            </select>
          </div>
          
          <div class="actions">
            <button id="exportBtn" class="action-btn">📤 Export</button>
            <button id="addTagBtn" class="action-btn">🏷️ Tags</button>
          </div>
        </div>
      </div>
      
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-number" id="totalCount">0</span>
          <span class="stat-label">Total Entries</span>
        </div>
        <div class="stat-item">
          <span class="stat-number" id="filteredCount">0</span>
          <span class="stat-label">Filtered</span>
        </div>
        <div class="stat-item">
          <span class="stat-number" id="mostCommon">None</span>
          <span class="stat-label">Most Common Mood</span>
        </div>
      </div>
      
      <div id="notesList" class="notes-list"></div>
    </div>
  `;

  const notesStyles = document.createElement('style');
  notesStyles.id = 'notes-enhanced-styles';
  notesStyles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    .notes-container {
      padding: 25px;
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
      min-height: 100vh;
      box-sizing: border-box;
      position: relative;
      overflow-x: hidden;
    }
    
    .notes-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.05" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
      background-size: cover;
      pointer-events: none;
    }
    
    .notes-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 28px;
      font-weight: 600;
      color: white;
      margin-bottom: 20px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }
    
    .title-icon {
      font-size: 32px;
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .controls {
      display: flex;
      gap: 15px;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      padding: 15px;
      border-radius: 14px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
      margin-bottom: 18px;
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex-wrap: wrap;
    }
    
    .search-container {
      position: relative;
      flex: 1;
      min-width: 180px;
      max-width: 300px;
    }
    
    .search-input {
      width: 100%;
      padding: 8px 35px 8px 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 13px;
      font-family: 'Poppins', sans-serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .search-input:focus {
      border-color: rgba(255, 255, 255, 0.5);
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.25);
    }
    
    .clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      font-size: 11px;
      display: none;
      transition: all 0.2s ease;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
    }
    
    .clear-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }
    
    .filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .filter-select {
      padding: 6px 10px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 11px;
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 100px;
    }
    
    .filter-select:focus {
      border-color: rgba(255, 255, 255, 0.5);
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.25);
    }
    
    .filter-select option {
      background: #8b5cf6;
      color: white;
      padding: 5px;
    }
    
    .actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .action-btn {
      padding: 6px 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 11px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .stats-bar {
      display: flex;
      justify-content: space-around;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      padding: 14px;
      border-radius: 14px;
      margin-bottom: 18px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 1;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .stat-item {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      min-width: 70px;
    }
    
    .stat-number {
      font-size: 18px;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    
    .stat-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .notes-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
      padding: 5px;
      position: relative;
      z-index: 1;
    }
    
    .note-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
      height: fit-content;
    }
    
    .note-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .note-card:hover::before {
      opacity: 1;
    }
    
    .note-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .note-mood {
      font-size: 20px;
      line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }
    
    .note-date {
      font-size: 9px;
      color: #6b7280;
      font-weight: 500;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .note-text {
      font-size: 11px;
      line-height: 1.4;
      color: #374151;
      margin-bottom: 10px;
      word-wrap: break-word;
      font-weight: 400;
      max-height: 60px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
    
    .note-actions {
      display: flex;
      gap: 5px;
    }
    
    .delete-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #f87171, #ef4444);
      color: white;
      font-size: 9px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
    }
    
    .delete-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(239, 68, 68, 0.4);
    }
    
    .empty-state {
      text-align: center;
      padding: 30px 20px;
      color: white;
      font-size: 14px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border-radius: 14px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 1;
    }
    
    .empty-icon {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.9;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @media (max-width: 768px) {
      .notes-container {
        padding: 15px;
      }
      
      .controls {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }
      
      .search-container {
        max-width: 100%;
      }
      
      .notes-list {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
      }
      
      .stats-bar {
        flex-direction: column;
        gap: 10px;
      }
      
      .notes-title {
        font-size: 22px;
        margin-bottom: 15px;
      }
    }
    
    @media (max-width: 480px) {
      .notes-list {
        grid-template-columns: 1fr;
        gap: 10px;
      }
      
      .note-card {
        padding: 10px;
      }
    }
  `;

  if (!document.getElementById('notes-enhanced-styles')) {
    document.head.appendChild(notesStyles);
  }

  const list = document.getElementById('notesList');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const moodFilter = document.getElementById('moodFilter');
  const sortBy = document.getElementById('sortBy');
  const exportBtn = document.getElementById('exportBtn');
  const addTagBtn = document.getElementById('addTagBtn');
  const totalCount = document.getElementById('totalCount');
  const filteredCount = document.getElementById('filteredCount');
  const mostCommon = document.getElementById('mostCommon');

  let filteredEntries = [];
  let searchTerm = '';
  let selectedMood = 'all';
  let sortOption = 'newest';

  if (!state.entries || state.entries.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div><h3>No memories yet</h3><p>Start documenting your journey to see your memories here.</p></div>';
    return;
  }

  function applyFiltersAndSearch() {
    filteredEntries = [...state.entries];

    if (selectedMood !== 'all') {
      filteredEntries = filteredEntries.filter(entry => entry.mood === selectedMood);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredEntries = filteredEntries.filter(entry =>
        entry.text.toLowerCase().includes(term) ||
        entry.mood.toLowerCase().includes(term)
      );
    }

    switch (sortOption) {
      case 'oldest':
        filteredEntries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'mood':
        filteredEntries.sort((a, b) => a.mood.localeCompare(b.mood));
        break;
      case 'newest':
      default:
        filteredEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    renderNotes();
    updateStats();
  }

  function renderNotes() {
    list.innerHTML = '';

    if (filteredEntries.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No memories found</h3><p>Try adjusting your filters or search terms.</p></div>';
      return;
    }

    filteredEntries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'note-card';

      let entryEmoji = entry.emoji || '';

      if (!entryEmoji) {
        const moodEmojis = {
          happy: '😊',
          sad: '😢',
          anxious: '😰',
          angry: '😠',
          neutral: '😐',
          hopeful: '🌟'
        };
        entryEmoji = moodEmojis[entry.mood] || '😐';
      }

      card.innerHTML = `
        <div class="note-header">
          <div class="note-mood">${entryEmoji}</div>
          <div class="note-date">${new Date(entry.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}</div>
        </div>
        <div class="note-text">${escapeHtml(entry.text)}</div>
        <div class="note-actions">
          <button class="delete-btn" data-id="${entry.id}">Delete</button>
        </div>
      `;

      list.appendChild(card);
    });
  }

  function updateStats() {
    const totalEntries = state.entries.length;
    const filteredCountValue = filteredEntries.length;

    const moodCounts = {};
    state.entries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    let mostCommonMood = 'None';
    let maxCount = 0;
    for (const mood in moodCounts) {
      if (moodCounts[mood] > maxCount) {
        maxCount = moodCounts[mood];
        mostCommonMood = mood;
      }
    }

    totalCount.textContent = totalEntries;
    filteredCount.textContent = filteredCountValue;
    mostCommon.textContent = mostCommonMood.charAt(0).toUpperCase() + mostCommonMood.slice(1);
  }

  list.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const entryId = e.target.getAttribute('data-id');
      const card = e.target.closest('.note-card');

      if (confirm('Are you sure you want to delete this memory?')) {
        const originalText = e.target.textContent;
        e.target.textContent = '...';
        e.target.disabled = true;

        try {
          const res = await api(`/entries/${entryId}`, { method: 'DELETE' });
          if (res && res.success) {
            state.entries = state.entries.filter(e => e.id !== entryId);

            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';

            setTimeout(() => {
              applyFiltersAndSearch();
            }, 300);
          } else {
            alert('Failed to delete memory');
            e.target.textContent = originalText;
            e.target.disabled = false;
          }
        } catch (error) {
          console.error('Error deleting entry:', error);
          alert('Error deleting memory');
          e.target.textContent = originalText;
          e.target.disabled = false;
        }
      }
    }
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';
    applyFiltersAndSearch();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    clearSearchBtn.style.display = 'none';
    applyFiltersAndSearch();
  });

  moodFilter.addEventListener('change', (e) => {
    selectedMood = e.target.value;
    applyFiltersAndSearch();
  });

  sortBy.addEventListener('change', (e) => {
    sortOption = e.target.value;
    applyFiltersAndSearch();
  });

  exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(state.entries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `mood-entries-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  });

  addTagBtn.addEventListener('click', () => {
    alert('Tag management coming soon!');
  });

  applyFiltersAndSearch();
}

// Add this new function anywhere in your app.js file
function renderHeaderAnimation() {
  const moods = [
    { k: 'happy', e: 'smiley emoji.json' },
    { k: 'sad', e: 'Sad Emoji.json' },
    { k: 'anxious', e: 'emoji head explosion.json' },
    { k: 'angry', e: 'Exploding Emoji.json' },
    { k: 'neutral', e: 'Yelly Emoji No.json' },
    { k: 'hopeful', e: 'Party.json' }
  ];
  const randomMood = moods[Math.floor(Math.random() * moods.length)];
  const container = document.getElementById('header-animation-container');
  if (container) {
    container.innerHTML = `
      <lottie-player
        src="${randomMood.e}"
        background="transparent"
        speed="1"
        style="width: 80px; height: 80px;"
        loop autoplay>
      </lottie-player>
    `;
  }
}

// Now, call this function when the app initializes.
// Add the function call to the end of your file in the init block.
(async () => {
  await loadProfile();
  if (!state.token) {
    showLogin();
  } else {
    renderApp();
    renderHeaderAnimation(); // Call the new function here
  }
})();