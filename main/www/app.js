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

function getUserKey(key) {
    if (!state.user || !state.user.id) {
        console.warn('Attempted to access storage without user ID. Using temporary guest key.');
        return `guest_${key}`;
    }
    return `${state.user.id}_${key}`;
}

function clearUserState() {
    state.token = null;
    state.user = null;
    state.entries = [];
    state.currentPage = 'page_login';

    // Clear simple editor if it exists
    const noteInput = document.getElementById('noteInput');
    if (noteInput) noteInput.value = '';

    // Clear local storage items that shouldn't persist across sessions
    // BUT DO NOT Clear 'moodGardenToken' here, let clearToken() handle that specifically
    localStorage.removeItem(getUserKey('userProfile'));
    localStorage.removeItem('currentPage');
}

function handleAuthError(response) {
    if (response.status === 401) {
        clearToken();
        state.token = null;
        showLogin();
        alert("Your session expired. Please log in again.");
        return true;
    }
    return false;
}

/* === JWT Parsing Helper === */
function parseJwt(token) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const storedToken = localStorage.getItem('moodGardenToken') || null;
let initialUser = null;
if (storedToken) {
    const decoded = parseJwt(storedToken);
    if (decoded && decoded.id) { initialUser = { id: decoded.id }; }
}

let state = {
    token: storedToken,
    user: initialUser,
    entries: [],
    chatHistory: [
        {
            role: "system",
            content: "You are a kind, empathetic, and supportive companion in a mood journaling app. You listen, offer gentle encouragement, and help users reflect on their thoughts and feelings. Do not give medical advice. Keep responses concise and comforting.",
        },
    ],
};

// Mobile Responsiveness Utilities
/**
 * Check if current device is mobile (width <= 768px)
 * @returns {boolean} True if mobile device
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Check if current device is a small phone (width <= 480px)
 * @returns {boolean} True if small phone
 */
function isSmallPhone() {
    return window.innerWidth <= 480;
}

/**
 * Check if device is in landscape orientation
 * @returns {boolean} True if landscape
 */
function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

/**
 * Get current breakpoint name
 * @returns {string} 'mobile', 'tablet', or 'desktop'
 */
function getBreakpoint() {
    if (window.innerWidth <= 480) return 'mobile';
    if (window.innerWidth <= 768) return 'tablet';
    if (window.innerWidth <= 900) return 'small-desktop';
    return 'desktop';
}


// Lottie Player script recommendation - if not already in index.html
// This should be added to your index.html <head> or right before </body>
// <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
// Simple validation utility functions
/**
 * Sets the JWT token in both the app state and localStorage.
 * @param {string|null} t - The JWT token, or null to clear it.
 */
function setToken(t) {
    state.token = t;
    // CORRECTED: Now uses the same key 'moodGardenToken'
    t ? localStorage.setItem('moodGardenToken', t) : localStorage.removeItem('moodGardenToken');
}
/**
 * Retrieves the JWT token from localStorage.
 * @returns {string|null} The JWT, or null if it doesn't exist.
 */
function getToken() {
    // This was already correct
    return localStorage.getItem('moodGardenToken');
}
/**
 * Removes the JWT token from localStorage.
 */
function clearToken() {
    localStorage.removeItem('moodGardenToken');
    clearUserState();
}

function logout() {
    clearToken();
    showLogin();
    showNotification('Logged out successfully', 'success');
}

// Global UI and Navigation Helpers
function getDisplayName() {
    let name = '';
    if (state.user?.username) {
        name = state.user.username;
    } else if (state.user?.email) {
        name = state.user.email.split('@')[0];
    } else {
        return 'User';
    }
    const lettersOnly = name.match(/^[a-zA-Z]+/);
    return lettersOnly ? lettersOnly[0] : name;
}

function getInitial() {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
}

function getUserAvatar() {
    if (state.user && state.user.avatar) {
        return `<img src="${state.user.avatar}" alt="Profile" class="profile-avatar-img">`;
    }
    return getInitial();
}

function saveCurrentPage(pageId) {
    localStorage.setItem('currentPage', pageId);
    state.currentPage = pageId;
}

function getSavedPage() {
    return state.currentPage || localStorage.getItem('currentPage') || 'page_home';
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Get icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-body">
            <div class="notification-message">${message}</div>
        </div>
        <div class="notification-progress"></div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    const duration = 3000;
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, duration);
}

function showModal(title, content, footerButtons) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'appModal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';

    const modalTitle = document.createElement('h2');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = title;

    const closeButton = document.createElement('span');
    closeButton.className = 'close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => document.body.removeChild(modal);

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = content;

    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';

    footerButtons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `btn ${button.class}`;
        btn.textContent = button.text;
        btn.onclick = button.action;
        modalFooter.appendChild(btn);
    });

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    modal.style.display = 'block';

    window.onclick = (event) => {
        if (event.target === modal) document.body.removeChild(modal);
    };
}

async function api(path, opts = {}) {
    try {
        // Ensure headers exist
        const headers = {
            "Content-Type": "application/json",
            ...(opts.headers || {})
        };

        // Add auth token
        if (state.token) {
            headers["Authorization"] = "Bearer " + state.token;
        }

        // Axios request
        const r = await axios({
            url: API + path,
            method: opts.method || "GET",
            headers,
            data: opts.body ? JSON.parse(opts.body) : undefined
        });

        return r.data;

    } catch (e) {
        console.error("API ERROR:", e);

        // If server returned structured JSON error
        if (e.response && e.response.data) {
            return e.response.data;
        }

        // Fallback message
        return { success: false, message: "Unexpected server error" };
    }
}

async function loadProfile() {
    if (!state.token) return null;

    try {
        const res = await api('/auth/me', {
            method: "GET"
        });

        if (res?.user) {
            state.user = res.user;
            // Sync with localStorage so pages using it (like Profile Settings) have latest data
            localStorage.setItem(getUserKey('userProfile'), JSON.stringify(res.user));
            return res.user;
        }

        // Only throw if we have a specific error message
        if (res?.message) {
            throw new Error(res.message);
        }

        return null;

    } catch (err) {
        console.error("loadProfile() error:", err);

        // ONLY clear token if it's an auth error (e.g. 401)
        // Check for common auth error indicators
        const errorMsg = err.message ? err.message.toLowerCase() : "";
        if (errorMsg.includes("401") || errorMsg.includes("unauthorized") || errorMsg.includes("invalid token") || errorMsg.includes("expired")) {
            console.warn("Auth failed, clearing session.");
            clearToken();
            state.user = null;
        }

        return null;
    }
}

function loadEntries() {
    const key = getUserKey("moodData");
    if (!key || key.startsWith('guest_')) {
        state.entries = [];
        return [];
    }
    const entries = JSON.parse(localStorage.getItem(key) || "[]");
    state.entries = entries;
    return entries;
}

function saveEntries(entries) {
    const key = getUserKey("moodData");
    if (!key || key.startsWith('guest_')) {
        console.warn("Saving entries to guest storage - usually not desired for persistence");
    }
    localStorage.setItem(key, JSON.stringify(entries));
    state.entries = entries;
}

// Load user profile from localStorage (user-specific)
function loadUserProfile() {
    const profile = JSON.parse(localStorage.getItem(getUserKey("userProfile")) || "{}");
    return profile;
}

// Save user profile to localStorage (user-specific)
function saveUserProfile(profile) {
    localStorage.setItem(getUserKey("userProfile"), JSON.stringify(profile));
}

// Add CSS styles for profile dropdown and main card to match login card
const style = document.createElement('style');
style.textContent = `
#maincard {
  background: var(--bg-card) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border-radius: 1.5rem !important;
  border: 1px solid var(--border-main) !important;
  box-shadow: var(--shadow-main) !important;
  color: var(--text-main) !important;
}

.profile-dropdown {
  background: var(--bg-card) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border-radius: 1rem !important;
  border: 1px solid var(--border-main) !important;
  color: var(--text-main) !important;
}

/* Flat FAQ Styles */
.faq-item-flat .faq-answer {
  display: none;
  padding: 10px 0;
  color: var(--text-secondary);
  font-size: 0.95em;
  line-height: 1.5;
}

.faq-item-flat.active .faq-answer {
  display: block;
  animation: fadeIn 0.3s ease;
}

.faq-item-flat .faq-question {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 15px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-main);
  font-size: 1rem;
}

.faq-item-flat .faq-question:hover {
  opacity: 0.8;
}

.faq-icon {
  font-size: 1.2em;
  transition: transform 0.3s ease;
}

.faq-item-flat.active .faq-icon {
  transform: rotate(45deg);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* FAQ Input-like Styles (Matching Profile Inputs) */
.faq-input-like {
  width: 100%;
  padding: 14px 14px 14px 20px; /* Added left padding for text */
  border: 1px solid var(--border-main);
  border-radius: 12px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transition: all 0.3s ease;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  text-align: left;
  font-weight: 500;
}

.faq-input-like:hover {
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.faq-input-like.active {
    border-color: var(--primary-color);
    background: rgba(255, 255, 255, 0.15);
}
`;
document.head.appendChild(style);

// Example of how to update API calls to handle auth errors
async function fetchUserEntries() {
    if (!state.token) return [];

    try {
        const response = await api('/entries', {
            method: "GET"
        });

        // Check for auth error
        if (handleAuthError(response)) return [];

        if (response.success && response.entries) {
            saveEntries(response.entries);
            return response.entries;
        }

        return [];
    } catch (error) {
        console.error("Error fetching entries:", error);
        return [];
    }
}

// Example of how to save entries to server
async function saveEntryToServer(entry) {
    if (!state.token) return false;

    try {
        const response = await api('/entries', {
            method: "POST",
            body: JSON.stringify(entry)
        });

        // Check for auth error
        if (handleAuthError(response)) return false;

        if (response.success) {
            // Update local storage with the new entry
            const entries = loadEntries();
            entries.push(response.entry);
            saveEntries(entries);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error saving entry:", error);
        return false;
    }
}

// Example of how to save profile to server
async function saveProfileToServer(profile) {
    if (!state.token) return false;

    try {
        const response = await api('/profile', {
            method: "PUT",
            body: JSON.stringify(profile)
        });

        // Check for auth error
        if (handleAuthError(response)) return false;

        if (response.success) {
            // Update local storage with the new profile
            saveUserProfile(response.profile);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error saving profile:", error);
        return false;
    }
}

// Example of how to encrypt data before storing in localStorage
function encryptData(data) {
    try {
        return btoa(JSON.stringify(data));
    } catch (error) {
        console.error("Error encrypting data:", error);
        return JSON.stringify(data);
    }
}

// Example of how to decrypt data from localStorage
function decryptData(encryptedData) {
    try {
        return JSON.parse(atob(encryptedData));
    } catch (error) {
        console.error("Error decrypting data:", error);
        try {
            return JSON.parse(encryptedData);
        } catch (parseError) {
            console.error("Error parsing data:", parseError);
            return {};
        }
    }
}

// Example of using encryption for sensitive data
function saveEncryptedProfile(profile) {
    const encryptedProfile = encryptData(profile);
    localStorage.setItem(getUserKey("encryptedUserProfile"), encryptedProfile);
}

function loadEncryptedProfile() {
    const encryptedProfile = localStorage.getItem(getUserKey("encryptedUserProfile"));
    if (!encryptedProfile) return {};
    return decryptData(encryptedProfile);
}
// Simple validation
function isValidEmail(email) {
    console.log('Validating email:', email);

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid format' };
    }

    // Extract domain part and convert to lowercase
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
        return { valid: false, message: 'Invalid format' };
    }

    console.log('Domain:', domain);

    // List of common invalid domains and typos
    const invalidDomains = [
        'gail.com', 'gmil.com', 'gmal.com', 'gmali.com', 'gmaill.com',
        'fgty.com', 'fgt.com', 'fgtyy.com',
        'yaho.com', 'hotmial.com', 'hotmail.co', 'outlok.com', 'outlook.coom',
        'gmail.co', 'gmail.org', 'gmail.net', 'gmail.io',
        'yahoo.co', 'yahoo.org', 'yahoo.net',
        'hotmail.co', 'hotmail.org', 'hotmail.net'
    ];

    // Check if domain is in invalid list
    if (invalidDomains.includes(domain)) {
        return { valid: false, message: 'Check for typos in domain name' };
    }

    // Check for common domain typos (common provider + typo)
    const commonProviders = {
        'gmail.com': ['gail.com', 'gmil.com', 'gmal.com', 'gmali.com', 'gmaill.com'],
        'yahoo.com': ['yaho.com', 'yaoo.com', 'yaho.co'],
        'hotmail.com': ['hotmial.com', 'hotmail.co', 'hotmail.coom'],
        'outlook.com': ['outlok.com', 'outlook.coom', 'outlook.co']
    };

    // Check if it's a typo of a common domain
    for (const [correct, typos] of Object.entries(commonProviders)) {
        if (typos.includes(domain)) {
            return { valid: false, message: 'Check for typos in domain name' };
        }
    }

    // Check domain structure (reasonable length, valid TLD)
    const parts = domain.split('.');
    if (parts.length < 2) {
        return { valid: false, message: 'Invalid format' };
    }
    if (parts[parts.length - 1].length < 2) {
        return { valid: false, message: 'Invalid format' };
    }
    if (parts[0].length < 2) {
        return { valid: false, message: 'Invalid format' };
    }

    console.log('Email validation passed');
    return { valid: true, message: 'Valid email' };
}

function showLoadingScreen(onComplete) {
    const loadingHTML = `
        <div id="loading-screen">
            <div class="splash-background">
                <div class="bg-pattern bg-pattern-1">🌿</div>
                <div class="bg-pattern bg-pattern-2">🌸</div>
                <div class="bg-pattern bg-pattern-3">🦋</div>
                <div class="bg-pattern bg-pattern-4">🌻</div>
                <div class="bg-pattern bg-pattern-5">🌱</div>
            </div>
            <div class="loader-container">
                <div class="splash-icon-box">
                    <span class="icon-img">🌱</span>
                </div>
                <div class="splash-branding">
                    <h1 class="splash-title">MOOD GARDEN</h1>
                    <p class="splash-tagline">Your Emotional Wellness Companion</p>
                </div>
            </div>
        </div>
    `;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = loadingHTML;
    const loader = tempDiv.firstElementChild;
    document.body.appendChild(loader);

    setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.remove();
            if (onComplete) onComplete();
        }, 1000); // Wait for transition
    }, 4000);
}

function showLogin() {
    clearUserState(); // Ensure fresh state
    localStorage.setItem("currentPage", "page_login");
    document.body.classList.add('login-mode'); // Enable login styles
    let currentView = 'login';
    let currentEmail = '';


    const init = () => {
        renderView();
        initLoginInterface();
        setupPasswordToggles();
    };

    init();

    function renderView() {
        // Only show the special overlay if we're in verify or reset mode
        const isOverlay = (currentView === 'verify' || currentView === 'reset-password');

        const html = `
      <div class="container ${currentView === 'register' ? 'active' : ''}" id="mainContainer">
        <!-- Brand Section (Info) -->
        <div class="info-content">
            <div class="brand-wrapper">
                <div class="brand-logo">MOOD GARDEN</div>
                <h1 class="brand-title">Your emotional wellness companion</h1>
                <div class="floating-elements">
                    <span class="floating-item fi-1">🌻</span>
                    <span class="floating-item fi-2">🦋</span>
                    <span class="floating-item fi-3">🌺</span>
                </div>
            </div>
        </div>

        <!-- Form Section -->
        <div class="form-box">
             <!-- Login Form -->
             <div id="loginPane" class="form-content login">
                <div class="form-header">
                    <h2>Login</h2>
                </div>
                <form id="loginForm">
                    <div class="input-box">
                        <input id="email" type="email" required placeholder=" " autocomplete="email">
                        <label for="email">Email</label>
                        <i class='bx bxs-user'></i>
                    </div>
                    <div class="input-box">
                        <input id="pwd" type="password" required placeholder=" " autocomplete="current-password">
                        <label for="pwd">Password</label>
                        <i class='bx bx-show toggle-password' data-target="pwd"></i>
                    </div>
                    <div class="form-options">
                        <label class="checkbox-wrapper" for="rememberMe">
                            <input type="checkbox" id="rememberMe" /> Remember me
                        </label>
                        <button type="button" class="forgot-link" id="forgotPasswordBtn">Forgot password?</button>
                    </div>
                    <button type="submit" class="btn" id="loginBtn">
                        <span class="btn-content">Login</span>
                        <span class="btn-loader" style="display: none;">
                            <span class="spinner"></span>
                        </span>
                    </button>
                    <div class="social-icons" style="display: none;">
                        <a href="#" id="googleLoginBtn"><i class='bx bxl-google'></i></a>
                        <a href="#" id="facebookLoginBtn"><i class='bx bxl-facebook'></i></a>
                    </div>
                    <p class="form-link-text">Don't have an account? <a href="#" id="showRegBtn">Sign Up</a></p>
                </form>
             </div>

             <!-- Register Form -->
             <div id="registerPane" class="form-content register">
                <div class="form-header">
                    <h2>Sign Up</h2>
                </div>
                <form id="registerForm">
                    <div class="input-box">
                        <input id="regEmail" type="email" required placeholder=" " autocomplete="email">
                        <label for="regEmail">Email</label>
                        <i class='bx bxs-envelope'></i>
                    </div>
                    <div class="input-box">
                        <input id="regPwd" type="password" required placeholder=" " autocomplete="new-password">
                        <label for="regPwd">Password</label>
                        <i class='bx bx-show toggle-password' data-target="regPwd"></i>
                    </div>
                    <div class="input-box">
                        <input id="regConfirmPwd" type="password" required placeholder=" " autocomplete="new-password">
                        <label for="regConfirmPwd">Confirm Password</label>
                        <i class='bx bx-show toggle-password' data-target="regConfirmPwd"></i>
                    </div>
                    <div class="form-options">
                        <label class="checkbox-wrapper" for="agreeTerms">
                            <input type="checkbox" id="agreeTerms" /> I agree to Terms & Conditions
                        </label>
                    </div>
                    <button type="submit" class="btn" id="regBtn">
                        <span class="btn-content">Sign Up</span>
                        <span class="btn-loader" style="display: none;">
                            <span class="spinner"></span>
                        </span>
                    </button>
                    <div class="divider">
                        <span>or</span>
                    </div>
                    <div class="social-icons">
                        <button type="button" class="google-btn" id="googleRegBtn">
                            <i class='bx bxl-google'></i>
                            <span>Sign Up with Google</span>
                        </button>
                    </div>
                    <p class="form-link-text">Already have an account? <a href="#" id="showLoginBtn">Login</a></p>
                </form>
             </div>
             
             <!-- Special Overlay (Verify/Reset) -->
             <div id="overlayPane" class="form-content" style="${isOverlay ? 'display: block !important; opacity: 1 !important; pointer-events: auto !important; transform: none !important; z-index: 10 !important; position: relative !important;' : 'display: none !important;'}">
                ${isOverlay ? getFormHTML() : ''}
             </div>

             <div id="msg" class="msg" style="text-align: center; margin-top: 10px;"></div>
        </div>
      </div>
    `;
        app.innerHTML = html;

        // Force overlay handle if needed
        const overlayPane = document.getElementById('overlayPane');
        const loginPane = document.getElementById('loginPane');
        const registerPane = document.getElementById('registerPane');

        if (isOverlay) {
            if (loginPane) loginPane.style.display = 'none';
            if (registerPane) registerPane.style.display = 'none';
        } else {
            // CSS transition handles login-register visibility
        }

        attachEventListeners();
    }

    // Get the appropriate form HTML based on current view
    function getFormHTML() {
        switch (currentView) {
            case 'login': return getLoginHTML();
            case 'register': return getRegisterHTML();
            case 'verify': return getVerificationHTML(currentEmail);
            case 'reset-password': return getResetPasswordHTML(currentEmail);
            default: return getLoginHTML();
        }
    }

    // HTML Templates
    function getLoginHTML() {
        return `
        <div class="form-header">
            <h2>Login</h2>
        </div>
        
        <form class="login-form" id="loginForm">
            <div class="input-box">
                <input id="email_login" type="email" required placeholder=" " autocomplete="email">
                <label for="email_login">Email</label>
                <i class='bx bxs-user'></i>
            </div>

            <div class="input-box">
                <input id="pwd_login" type="password" required placeholder=" " autocomplete="current-password">
                <label for="pwd_login">Password</label>
                <i class='bx bxs-lock-alt' id="passwordToggle" style="cursor: pointer;"></i>
            </div>
          
          <div class="form-options">
            <label class="checkbox-wrapper" for="rememberMe_pane">
              <input type="checkbox" id="rememberMe_pane" />
              Remember me
            </label>
            <button type="button" class="forgot-link" id="forgotPasswordBtn">
              Forgot password?
            </button>
          </div>
          
          <button type="submit" class="btn" id="loginBtn">Login</button>

          <div class="social-icons" style="display: none;">
               <a href="#" id="googleLoginBtn2"><i class='bx bxl-google'></i></a>
               <a href="#" id="facebookLoginBtn2"><i class='bx bxl-facebook'></i></a>
          </div>

          <p class="form-link-text">Don't have an account? <a href="#" id="showRegBtn">Sign Up</a></p>
        </form>
    `;
    }

    function getRegisterHTML() {
        return `
        <div class="form-header">
          <h2>Sign Up</h2>
        </div>
        
        <form class="login-form" id="registerForm">
          <div class="input-box">
              <input id="regEmail_pane" type="email" required placeholder=" " autocomplete="email">
              <label for="regEmail_pane">Email</label>
              <i class='bx bxs-envelope'></i>
          </div>

          <div class="input-box">
              <input id="regPwd_pane" type="password" required placeholder=" " autocomplete="new-password">
              <label for="regPwd_pane">Password</label>
              <i class='bx bxs-lock-alt' id="regPasswordToggle" style="cursor: pointer;"></i>
          </div>
          <div id="passwordStrength" class="password-strength"></div>

          <div class="input-box">
              <input id="regConfirmPwd_pane" type="password" required placeholder=" " autocomplete="new-password">
              <label for="regConfirmPwd_pane">Confirm Password</label>
              <i class='bx bxs-lock-alt' id="regConfirmPasswordToggle" style="cursor: pointer;"></i>
          </div>
          
          <div class="form-options">
            <label class="checkbox-wrapper" for="agreeTerms_pane">
              <input type="checkbox" id="agreeTerms_pane" />
              I agree to Terms & Conditions
            </label>
          </div>
          
          <button type="submit" class="btn" id="regBtn">Sign Up</button>

          <div class="divider">
            <span>or</span>
          </div>
          <div class="social-icons">
              <button type="button" class="google-btn" id="googleRegBtn2">
                  <i class='bx bxl-google'></i>
                  <span>Sign Up with Google</span>
              </button>
          </div>

          <p class="form-link-text">Already have an account? <a href="#" id="showLoginBtn">Login</a></p>
        </form>
    `;
    }

    function getVerificationHTML(email) {
        return `
        <div class="form-header">
          <div class="welcome-icon">📧</div>
          <h2>Verify Email</h2>
          <p class="subtitle">Code sent to <strong>${email}</strong></p>
        </div>
        
        <form class="login-form" id="verifyForm">
          <div class="form-group">
            <label for="verifyCode">
              <span class="label-icon">🔢</span>
              Code
            </label>
            <div class="input-wrapper">
              <input id="verifyCode" type="text" placeholder="Enter 6-digit code" maxlength="6" autocomplete="one-time-code" />
              <div class="input-border"></div>
            </div>
            <div class="code-inputs">
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
            </div>
          </div>
          
          <div class="button-group">
            <button type="submit" class="btn primary" id="verifyBtn">
              <span class="btn-content">
                <span class="btn-icon">✅</span>
                <span class="btn-text">Verify Email</span>
              </span>
              <span class="btn-loader" style="display: none;">
                <span class="spinner"></span>
                <span>Verifying...</span>
              </span>
            </button>
          </div>
          
          <div class="resend-section">
            <p>Didn't receive code?</p>
            <button type="button" class="btn secondary-outline" id="resendVerifyBtn">
              <span class="btn-content">
                <span class="btn-icon">📧</span>
                <span class="btn-text">Resend</span>
              </span>
            </button>
          </div>
          
          <button type="button" class="btn back-btn" id="backToLoginBtn">
            <span class="btn-content">
              <span class="btn-icon">←</span>
              <span class="btn-text">Back to Login</span>
            </span>
          </button>
        </form>
        
        <div id="verifyMsg" class="msg"></div>
    `;
    }

    function getResetPasswordHTML(email) {
        return `
        <div class="form-header">
          <div class="welcome-icon">🔑</div>
          <h2>Reset Password</h2>
          <p class="subtitle">Enter the code sent to <strong>${email}</strong> and your new password</p>
        </div>
        
        <form class="login-form" id="resetPasswordForm">
          <div class="form-group">
            <label for="resetCode">
              <span class="label-icon">🔢</span>
              Reset Code
            </label>
            <div class="input-wrapper">
              <input id="resetCode" type="text" placeholder="Enter 6-digit code" maxlength="6" autocomplete="one-time-code" />
              <div class="input-border"></div>
            </div>
            <div class="code-inputs">
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
              <input type="text" maxlength="1" class="code-input" />
            </div>
          </div>

          <div class="form-group">
            <label for="newPwd">
              <span class="label-icon">🔒</span>
              New Password
            </label>
            <div class="input-wrapper">
              <input id="newPwd" type="password" placeholder="Create new password" autocomplete="new-password" />
              <button type="button" class="password-toggle" id="newPasswordToggle">
                <span class="eye-icon">👁️</span>
              </button>
              <div class="input-border"></div>
            </div>
            <div class="password-strength" id="newPasswordStrength"></div>
          </div>

          <div class="form-group">
            <label for="confirmNewPwd">
              <span class="label-icon">🔒</span>
              Confirm New Password
            </label>
            <div class="input-wrapper">
              <input id="confirmNewPwd" type="password" placeholder="Confirm new password" autocomplete="new-password" />
              <button type="button" class="password-toggle" id="confirmNewPasswordToggle">
                <span class="eye-icon">👁️</span>
              </button>
              <div class="input-border"></div>
            </div>
          </div>
          
          <div class="button-group">
            <button type="submit" class="btn primary" id="resetBtn">
              <span class="btn-content">
                <span class="btn-icon">🔑</span>
                <span class="btn-text">Set New Password</span>
              </span>
              <span class="btn-loader" style="display: none;">
                <span class="spinner"></span>
                <span>Resetting...</span>
              </span>
            </button>
          </div>
          
          <button type="button" class="btn back-btn" id="backToLoginFromResetBtn">
            <span class="btn-content">
              <span class="btn-icon">←</span>
              <span class="btn-text">Back to Login</span>
            </span>
          </button>
        </form>
        
        <div id="resetMsg" class="msg"></div>
    `;
    }

    // Event Listeners
    function attachEventListeners() {
        setupPasswordToggles();
        setupPasswordStrength();
        setupCodeInputs();
        setupFormSubmissions();
        setupNavigationButtons();
        setupEmailValidation();
        setupOAuthEventListeners();
    }

    function setupPasswordToggles() {
        const toggles = document.querySelectorAll('.toggle-password');
        toggles.forEach(toggle => {
            toggle.onclick = (e) => {
                e.preventDefault();
                const targetId = toggle.getAttribute('data-target');
                const input = document.getElementById(targetId);

                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);

                    // Toggle icon class
                    toggle.classList.toggle('bx-show');
                    toggle.classList.toggle('bx-hide');
                    toggle.classList.toggle('bx-show-alt'); // Handle variants if any
                }
            };
        });
    }

    function setupPasswordStrength() {
        const strengthConfigs = [
            { inputId: 'regPwd', indicatorId: 'passwordStrength' },
            { inputId: 'newPwd', indicatorId: 'newPasswordStrength' }
        ];

        strengthConfigs.forEach(({ inputId, indicatorId }) => {
            const passwordInput = document.getElementById(inputId);
            const strengthIndicator = document.getElementById(indicatorId);

            if (passwordInput && strengthIndicator) {
                passwordInput.oninput = () => {
                    const password = passwordInput.value;
                    let strength = 0;
                    let strengthText = '';
                    let strengthColor = '';

                    if (password.length >= 8) strength++;
                    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
                    if (password.match(/[0-9]/)) strength++;
                    if (password.match(/[^a-zA-Z0-9]/)) strength++;

                    switch (strength) {
                        case 0:
                        case 1:
                            strengthText = 'Weak';
                            strengthColor = '#ff6b6b';
                            break;
                        case 2:
                            strengthText = 'Fair';
                            strengthColor = '#ffd93d';
                            break;
                        case 3:
                            strengthText = 'Good';
                            strengthColor = '#6bcf7f';
                            break;
                        case 4:
                            strengthText = 'Strong';
                            strengthColor = '#4ecdc4';
                            break;
                    }

                    strengthIndicator.innerHTML = `
            <div class="strength-bar">
              <div class="strength-fill" style="width: ${strength * 25}%; background: ${strengthColor};"></div>
            </div>
            <span class="strength-text" style="color: ${strengthColor};">${strengthText}</span>
          `;
                };
            }
        });
    }

    function setupCodeInputs() {
        // FIX: Scoped code inputs per form container
        document.querySelectorAll('.code-inputs').forEach(container => {
            const inputs = container.querySelectorAll('.code-input');
            const hiddenInput =
                container.closest('form')?.querySelector('input[type="text"][autocomplete="one-time-code"]');

            if (!hiddenInput) return;

            inputs.forEach((input, index) => {
                input.oninput = () => {
                    if (input.value && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                    hiddenInput.value = Array.from(inputs).map(i => i.value).join('');
                };

                input.onkeydown = e => {
                    if (e.key === 'Backspace' && !input.value && index > 0) {
                        inputs[index - 1].focus();
                    }
                };
            });
        });
    }

    function setupFormSubmissions() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.onsubmit = handleLoginSubmit;
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.onsubmit = handleRegisterSubmit;
        }

        // Verify form
        const verifyForm = document.getElementById('verifyForm');
        if (verifyForm) {
            verifyForm.onsubmit = handleVerifySubmit;
        }

        // Reset password form
        const resetPasswordForm = document.getElementById('resetPasswordForm');
        if (resetPasswordForm) {
            resetPasswordForm.onsubmit = handleResetPasswordSubmit;
        }
    }

    function setupNavigationButtons() {
        const showRegBtn = document.getElementById('showRegBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');
        const container = document.getElementById('mainContainer');

        if (showRegBtn) {
            showRegBtn.onclick = (e) => {
                e.preventDefault();
                currentView = 'register';
                if (container) {
                    container.classList.add('active');
                }
            };
        }

        if (showLoginBtn) {
            showLoginBtn.onclick = (e) => {
                e.preventDefault();
                currentView = 'login';
                if (container) {
                    container.classList.remove('active');
                }
            };
        }

        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.onclick = handleForgotPassword;
        }

        const resendVerifyBtn = document.getElementById('resendVerifyBtn');
        if (resendVerifyBtn) {
            resendVerifyBtn.onclick = handleResendVerification;
        }

        const backToLoginBtn = document.getElementById('backToLoginBtn');
        if (backToLoginBtn) {
            backToLoginBtn.onclick = () => {
                currentView = 'login';
                renderView();
            };
        }

        const backToLoginFromResetBtn = document.getElementById('backToLoginFromResetBtn');
        if (backToLoginFromResetBtn) {
            backToLoginFromResetBtn.onclick = () => {
                currentView = 'login';
                renderView();
            };
        }
    }

    // Form submission handlers
    async function handleLoginSubmit(e) {
        e.preventDefault();
        const emailInput = document.getElementById('email');
        const pwdInput = document.getElementById('pwd');
        const msg = document.getElementById('msg');
        const loginBtn = document.getElementById('loginBtn');
        const btnContent = loginBtn.querySelector('.btn-content');
        const btnLoader = loginBtn.querySelector('.btn-loader');

        // Aggressively clear any previous user state before attempting a new login
        clearUserState();

        const email = emailInput.value.trim();
        const password = pwdInput.value.trim();

        // Clear previous messages
        msg.textContent = '';
        msg.className = 'msg';

        if (!email || !password) {
            msg.textContent = '⚠ Please provide email & password';
            msg.className = "msg error";
            return;
        }

        // REMOVED: Email validation from login form

        if (password.length < 6) {
            msg.textContent = '⚠ Password must be at least 6 characters';
            msg.className = "msg error";
            return;
        }

        loginBtn.disabled = true;
        btnContent.style.display = 'none';
        btnLoader.style.display = 'flex';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.status === 401) {
                msg.textContent = '⚠ Invalid email or password';
                msg.className = "msg error";
                return;
            }

            if (response.status === 403) {
                if (data.message && data.message.includes('verify your email')) {
                    currentEmail = email;
                    currentView = 'verify';
                    renderView();
                    const verifyMsg = document.getElementById('verifyMsg');
                    if (verifyMsg) {
                        verifyMsg.textContent = data.message;
                        verifyMsg.className = 'msg error';
                    }
                } else {
                    msg.textContent = data.message || '❌ Access denied';
                    msg.className = "msg error";
                }
                return;
            }

            if (!response.ok) {
                msg.textContent = data.message || '❌ Login failed';
                msg.className = "msg error";
                return;
            }

            if (data.success && data.token) {
                msg.textContent = '✅ Login successful! Redirecting...';
                msg.className = 'msg success';
                setToken(data.token);
                await loadProfile();
                document.body.classList.remove('login-mode');
                setTimeout(() => renderApp(), 1000);
            } else {
                msg.textContent = data.message || '❌ Login failed';
                msg.className = "msg error";
            }
        } catch (error) {
            console.error('Login error:', error);
            msg.textContent = '❌ Network error or server unavailable. Please try again.';
            msg.className = "msg error";
        } finally {
            loginBtn.disabled = false;
            btnContent.style.display = 'flex';
            btnLoader.style.display = 'none';
        }
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault();
        const regEmailInput = document.getElementById('regEmail');
        const regPwdInput = document.getElementById('regPwd');
        const regConfirmPwdInput = document.getElementById('regConfirmPwd');
        const agreeTermsInput = document.getElementById('agreeTerms');
        const regMsg = document.getElementById('msg');
        const regBtn = document.getElementById('regBtn');
        const btnContent = regBtn.querySelector('.btn-content');
        const btnLoader = regBtn.querySelector('.btn-loader');

        const email = regEmailInput.value.trim();
        const password = regPwdInput.value.trim();
        const confirmPassword = regConfirmPwdInput.value.trim();

        // Clear previous messages
        regMsg.textContent = '';
        regMsg.className = 'msg';

        if (!email || !password || !confirmPassword) {
            regMsg.textContent = '⚠ Please fill in all fields';
            regMsg.className = "msg error";
            return;
        }

        // Enhanced email validation - KEEP THIS FOR REGISTRATION
        if (!isValidEmail(email)) {
            const domain = email.split('@')[1]?.toLowerCase();
            const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
            const hasCommonProvider = commonProviders.some(provider =>
                domain?.includes(provider.replace('.com', ''))
            );

            if (hasCommonProvider) {
                regMsg.textContent = '⚠ Please enter a proper email address (check for typos in domain name)';
                regMsg.className = "msg error";
            } else {
                regMsg.textContent = '⚠ Please enter a valid email address';
                regMsg.className = "msg error";
            }
            return;
        }

        if (password.length < 6) {
            regMsg.textContent = '⚠ Password must be at least 6 characters';
            regMsg.className = "msg error";
            return;
        }
        if (password !== confirmPassword) {
            regMsg.textContent = '⚠ Passwords do not match';
            regMsg.className = "msg error";
            return;
        }
        if (!agreeTermsInput.checked) {
            regMsg.textContent = '⚠ Please agree to Terms of Service';
            regMsg.className = "msg error";
            return;
        }

        regBtn.disabled = true;
        btnContent.style.display = 'none';
        btnLoader.style.display = 'flex';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const r = await response.json();

            if (response.status === 409) {
                regMsg.textContent = r.message || '⚠ Email already registered. Please log in.';
                regMsg.className = 'msg error';
                return;
            }

            if (!response.ok) {
                regMsg.textContent = r.message || '❌ Registration failed';
                regMsg.className = 'msg error';
                return;
            }

            if (r.success) {
                regMsg.textContent = '✅ Registration successful! Please check your email.';
                regMsg.className = 'msg success';
                currentEmail = email;
                currentView = 'verify';
                setTimeout(() => renderView(), 1500);
            } else {
                regMsg.textContent = r.message || '❌ Registration failed';
                regMsg.className = 'msg error';
            }
        } catch (error) {
            console.error('Register error:', error);
            regMsg.textContent = '❌ Network error or server unavailable. Please try again.';
            regMsg.className = "msg error";
        } finally {
            regBtn.disabled = false;
            btnContent.style.display = 'flex';
            btnLoader.style.display = 'none';
        }
    }

    async function handleVerifySubmit(e) {
        e.preventDefault();
        const verifyCodeInput = document.getElementById('verifyCode');
        const verifyMsg = document.getElementById('verifyMsg');
        const verifyBtn = document.getElementById('verifyBtn');
        const btnContent = verifyBtn.querySelector('.btn-content');
        const btnLoader = verifyBtn.querySelector('.btn-loader');

        // Aggressively clear any previous user state before processing verification (which leads to login)
        clearUserState();

        const code = verifyCodeInput.value.trim();

        if (!code || code.length !== 6) {
            verifyMsg.textContent = '⚠ Please enter a valid 6-digit code';
            verifyMsg.className = "msg error";
            return;
        }

        verifyBtn.disabled = true;
        btnContent.style.display = 'none';
        btnLoader.style.display = 'flex';

        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, code })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const r = await response.json();

            if (r.success && r.token) {
                verifyMsg.textContent = '✅ Email verified! Redirecting...';
                verifyMsg.className = 'msg success';
                setToken(r.token);
                await loadProfile();
                document.body.classList.remove('login-mode');
                setTimeout(() => renderApp(), 1000);
            } else {
                verifyMsg.textContent = r.message || '❌ Verification failed';
                verifyMsg.className = "msg error";
            }
        } catch (error) {
            console.error('Verification error:', error);
            verifyMsg.textContent = '❌ Network error or server unavailable. Please try again.';
            verifyMsg.className = "msg error";
        } finally {
            verifyBtn.disabled = false;
            btnContent.style.display = 'flex';
            btnLoader.style.display = 'none';
        }
    }

    async function handleResetPasswordSubmit(e) {
        e.preventDefault();
        const resetCodeInput = document.getElementById('resetCode');
        const newPwdInput = document.getElementById('newPwd');
        const confirmNewPwdInput = document.getElementById('confirmNewPwd');
        const resetMsg = document.getElementById('resetMsg');
        const resetBtn = document.getElementById('resetBtn');
        const btnContent = resetBtn.querySelector('.btn-content');
        const btnLoader = resetBtn.querySelector('.btn-loader');

        const code = resetCodeInput.value.trim();
        const newPassword = newPwdInput.value.trim();
        const confirmPassword = confirmNewPwdInput.value.trim();

        console.log('Reset attempt:', {
            email: currentEmail,
            enteredCode: code,
            newPassword: newPassword
        });

        if (!code || code.length !== 6) {
            resetMsg.textContent = '⚠ Please enter a valid 6-digit code';
            resetMsg.className = "msg error";
            return;
        }
        if (!newPassword || !confirmPassword) {
            resetMsg.textContent = '⚠ Please enter and confirm your new password';
            resetMsg.className = "msg error";
            return;
        }
        if (newPassword.length < 6) {
            resetMsg.textContent = '⚠ Password must be at least 6 characters';
            resetMsg.className = "msg error";
            return;
        }
        if (newPassword !== confirmPassword) {
            resetMsg.textContent = '⚠ Passwords do not match';
            resetMsg.className = "msg error";
            return;
        }

        resetBtn.disabled = true;
        btnContent.style.display = 'none';
        btnLoader.style.display = 'flex';

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentEmail,
                    code,
                    password: newPassword
                })
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (!response.ok) {
                resetMsg.textContent = data.message || '❌ Invalid reset code. Please check the code and try again.';
                resetMsg.className = "msg error";
                console.error('Reset failed:', data.message);
                return;
            }

            if (data.success) {
                resetMsg.textContent = '✅ Password reset successfully! Redirecting to login...';
                resetMsg.className = 'msg success';
                setTimeout(() => {
                    currentView = 'login';
                    renderView();
                }, 2000);
            } else {
                resetMsg.textContent = data.message || '❌ Failed to reset password';
                resetMsg.className = "msg error";
            }
        } catch (error) {
            console.error('Reset password error:', error);
            resetMsg.textContent = '❌ Network error or server unavailable. Please try again.';
            resetMsg.className = "msg error";
        } finally {
            resetBtn.disabled = false;
            btnContent.style.display = 'flex';
            btnLoader.style.display = 'none';
        }
    }

    async function handleForgotPassword() {
        const emailInput = document.getElementById('email');
        const msg = document.getElementById('msg');
        const email = emailInput.value.trim();

        if (!email) {
            msg.textContent = '⚠ Please enter your email address first';
            msg.className = "msg error";
            return;
        }

        // REMOVED: Email validation from forgot password

        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        forgotPasswordBtn.disabled = true;
        forgotPasswordBtn.innerHTML = '<span class="spinner"></span> Sending reset link...';

        try {
            // UPDATED: Use the correct Flask API endpoint
            const response = await fetch('/api/auth/request-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const data = await response.json();

            if (data.success) {
                currentEmail = email;
                currentView = 'reset-password';
                renderView();
                const resetMsg = document.getElementById('resetMsg');
                if (resetMsg) {
                    resetMsg.textContent = '✅ Password reset code sent! Please check your email.';
                    resetMsg.className = 'msg success';
                }
            } else {
                msg.textContent = data.message || '❌ Failed to send reset link';
                msg.className = "msg error";
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            msg.textContent = '❌ Network error or server unavailable. Please try again.';
            msg.className = "msg error";
        } finally {
            forgotPasswordBtn.disabled = false;
            forgotPasswordBtn.innerHTML = `
        <span class="forgot-icon">🔑</span>
        <span>Forgot password?</span>
      `;
        }
    }

    async function handleResendVerification() {
        const verifyMsg = document.getElementById('verifyMsg');
        const resendVerifyBtn = document.getElementById('resendVerifyBtn');
        const btnContent = resendVerifyBtn.querySelector('.btn-content');

        resendVerifyBtn.disabled = true;
        resendVerifyBtn.innerHTML = '<span class="spinner"></span> Sending...';


        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const r = await response.json();

            if (r.success) {
                verifyMsg.textContent = '✅ Verification email sent! Please check your inbox.';
                verifyMsg.className = 'msg success';
            } else {
                verifyMsg.textContent = r.message || '❌ Failed to resend email.';
                verifyMsg.className = "msg error";
            }
        } catch (error) {
            console.error('Resend error:', error);
            verifyMsg.textContent = '❌ Network error or server unavailable. Please try again.';
            verifyMsg.className = "msg error";
        } finally {
            resendVerifyBtn.disabled = false;
            resendVerifyBtn.innerHTML = btnContent.outerHTML;
        }
    }

    // Add real-time validation setup functions - ONLY FOR REGISTRATION
    function setupEmailValidation() {
        // Add real-time validation to registration email input only
        const regEmailInput = document.getElementById('regEmail');
        if (regEmailInput) {
            regEmailInput.addEventListener('input', function () {
                const email = this.value.trim();
                const container = this.closest('.input-box');
                let errorMsg = container?.querySelector('.email-error');

                const validation = isValidEmail(email);

                if (email && !validation.valid) {
                    if (!errorMsg) {
                        errorMsg = document.createElement('div');
                        errorMsg.className = 'email-error';
                        errorMsg.style.color = '#ff6b6b';
                        errorMsg.style.fontSize = '0.75rem';
                        errorMsg.style.marginTop = '0.4rem';
                        errorMsg.style.fontWeight = '500';
                        container.appendChild(errorMsg);
                    }
                    errorMsg.textContent = `⚠ ${validation.message}`;
                } else {
                    if (errorMsg) {
                        errorMsg.remove();
                    }
                }
            });
        }
    }

    function setupOAuthEventListeners() {
        const oauthButtons = [
            'googleLoginBtn', 'googleLoginBtn2', 'googleRegBtn', 'googleRegBtn2',
            'facebookLoginBtn', 'facebookLoginBtn2'
        ];

        oauthButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    const provider = id.toLowerCase().includes('google') ? 'google' : 'facebook';
                    const url = `/api/auth/${provider}`;

                    // Open OAuth in a popup
                    const width = 600;
                    const height = 700;
                    const left = (window.innerWidth - width) / 2;
                    const top = (window.innerHeight - height) / 2;

                    window.open(url, 'OAuth', `width=${width},height=${height},left=${left},top=${top}`);
                };
            }
        });

        // Listen for message from OAuth popup
        window.onmessage = async (event) => {
            if (event.data && event.data.success && event.data.token) {
                showNotification(event.data.message || 'Authenticated successfully!', 'success');
                setToken(event.data.token);
                await loadProfile();
                document.body.classList.remove('login-mode');
                setTimeout(() => renderApp(), 500);
            } else if (event.data && event.data.success === false) {
                showNotification(event.data.message || 'Authentication failed', 'error');
            }
        };
    }

    // Initialize the interface
    function initLoginInterface() {
        renderView();
        addLoginStyles();
    }

    function addLoginStyles() {
        if (document.getElementById('login-enhanced-styles')) return;

        const loginStyles = document.createElement('style');
        loginStyles.id = 'login-enhanced-styles';
        loginStyles.textContent = `
    /* Login Container - Split Screen */
    .login-wrapper {
      display: flex;
      height: 100vh;
      width: 100%;
      margin: 0;
      padding: 0;
      background: var(--gradient-primary);
      overflow: hidden;
    }
    
    /* Left Side with Nature Background - Full Coverage */
    .login-left {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(135deg, #5b3a8b 0%, #7b5a8b 50%, #9b6a8b 100%);
    }
    
    /* Use a direct background image with fallback */
    .login-left::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('https://picsum.photos/seed/mood-garden-nature/1920/1080.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
      opacity: 0.9;
    }
    
    /* Add gradient overlay */
    .login-left::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.7) 0%, rgba(168, 85, 247, 0.6) 50%, rgba(192, 132, 252, 0.5) 100%);
      z-index: 0;
    }
    
    .brand-container {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 1.5rem 1rem;
      animation: fadeInUp 1s ease-out;
    }
    
    .brand-icon {
      font-size: 2rem;
      margin: 0 0.3rem;
      display: inline-block;
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }
    
    .brand-icon:first-child {
      animation-delay: 0s;
    }
    
    .brand-icon:last-child {
      animation-delay: 1.5s;
    }
    
    .brand-logo {
      font-size: 2.2rem;
      font-weight: 800;
      margin: 0.6rem 0;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #ffffff 0%, #f0e6ff 50%, #e6d7ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
      font-family: 'Georgia', serif;
      line-height: 1.2;
    }
    
    .brand-title {
      font-size: 1rem;
      font-weight: 400;
      margin: 0.6rem 0 0;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      max-width: 90%;
      margin-left: auto;
      margin-right: auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* Floating Elements */
    .floating-elements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      pointer-events: none;
    }
    
    .floating-item {
      position: absolute;
      font-size: 1.5rem;
      animation: floatUpDown 6s ease-in-out infinite;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    /* Right Side with Login Form */
    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
    }
    
    /* Ultra-Compact Form Container */
    .form-container {
      width: 100%;
      max-width: 320px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(20px);
      border-radius: 1.5rem;
      padding: 1.5rem 1.2rem;
      box-shadow: 
        0 15px 30px rgba(139, 92, 246, 0.2),
        0 8px 20px rgba(139, 92, 246, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.18);
      animation: fadeInUp 1s ease-out 0.3s both;
      position: relative;
      overflow: hidden;
    }
    
    /* Smaller forms for register/verify/reset */
    .form-container.register-form,
    .form-container.verify-form,
    .form-container.reset-password-form {
      max-width: 300px;
      padding: 1.3rem 1.1rem;
    }
    
    .form-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent, 
        rgba(255, 255, 255, 0.4), 
        transparent
      );
    }
    
    /* Ultra-Compact Form Header */
    .form-header {
      text-align: center;
      margin-bottom: 1.2rem;
      position: relative;
    }
    
    /* Smaller headers for register/verify/reset forms */
    .register-form .form-header,
    .verify-form .form-header,
    .reset-password-form .form-header {
      margin-bottom: 1rem;
    }
    
    .welcome-icon {
      font-size: 1.8rem;
      margin-bottom: 0.6rem;
      display: inline-block;
      animation: bounce 2s ease-in-out infinite;
    }
    
    /* Smaller welcome icons for register/verify/reset forms */
    .register-form .welcome-icon,
    .verify-form .welcome-icon,
    .reset-password-form .welcome-icon {
      font-size: 1.5rem;
      margin-bottom: 0.4rem;
    }
    
    .form-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.3rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.3;
      background: linear-gradient(135deg, #ffffff 0%, #f8f4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    /* Smaller headings for register/verify/reset forms */
    .register-form .form-header h2,
    .verify-form .form-header h2,
    .reset-password-form .form-header h2 {
      font-size: 1.3rem;
    }
    
    .subtitle {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.4;
    }
    
    /* Smaller subtitles for register/verify/reset forms */
    .register-form .subtitle,
    .verify-form .subtitle,
    .reset-password-form .subtitle {
      font-size: 0.75rem;
    }
    
    /* Ultra-Compact Form Elements */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    
    /* Smaller gaps for register/verify/reset forms */
    .register-form .login-form,
    .verify-form .login-form,
    .reset-password-form .login-form {
      gap: 0.6rem;
    }
    
    .form-group {
      position: relative;
    }
    
    .form-group label {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin-bottom: 0.4rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      font-size: 0.75rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* Smaller labels for register/verify/reset forms */
    .register-form .form-group label,
    .verify-form .form-group label,
    .reset-password-form .form-group label {
      font-size: 0.7rem;
      margin-bottom: 0.3rem;
    }
    
    .label-icon {
      font-size: 0.8rem;
    }
    
    /* Smaller label icons for register/verify/reset forms */
    .register-form .label-icon,
    .verify-form .label-icon,
    .reset-password-form .label-icon {
      font-size: 0.7rem;
    }
    
    .input-wrapper {
      position: relative;
    }
    
    .form-group input {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border: none;
      border-radius: 0.8rem;
      background: rgba(255, 255, 255, 0.08);
      color: white;
      font-size: 0.85rem;
      transition: all 0.3s ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-sizing: border-box;
      position: relative;
      z-index: 2;
    }
    
    /* Smaller inputs for register/verify/reset forms */
    .register-form .form-group input,
    .verify-form .form-group input,
    .reset-password-form .form-group input {
      padding: 0.5rem 0.7rem;
      font-size: 0.8rem;
    }
    
    .form-group input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    
    .form-group input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
    }
    
    .input-border {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, 
        transparent, 
        rgba(255, 255, 255, 0.3), 
        transparent
      );
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    
    .form-group input:focus + .input-border {
      transform: scaleX(1);
    }
    
    /* Ultra-Compact Password Toggle */
    .password-toggle {
      position: absolute;
      right: 0.6rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      transition: color 0.3s ease;
      z-index: 3;
    }
    
    /* Smaller password toggles for register/verify/reset forms */
    .register-form .password-toggle,
    .verify-form .password-toggle,
    .reset-password-form .password-toggle {
      right: 0.5rem;
      font-size: 0.7rem;
    }
    
    .password-toggle:hover {
      color: rgba(255, 255, 255, 0.9);
    }
    
    /* Ultra-Compact Password Strength Indicator */
    .password-strength {
      margin-top: 0.3rem;
    }
    
    .strength-bar {
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.2rem;
    }
    
    .strength-fill {
      height: 100%;
      transition: width 0.3s ease, background 0.3s ease;
    }
    
    .strength-text {
      font-size: 0.65rem;
      font-weight: 500;
    }
    
    /* Ultra-Compact Code Inputs */
    .code-inputs {
      display: flex;
      gap: 0.3rem;
      margin-top: 0.6rem;
    }
    
    .code-input {
      flex: 1;
      aspect-ratio: 1;
      text-align: center;
      font-size: 1rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.08);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      color: white;
      transition: all 0.3s ease;
    }
    
    /* Smaller code inputs for verify/reset form */
    .verify-form .code-input,
    .reset-password-form .code-input {
      font-size: 0.9rem;
    }
    
    .code-input:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.12);
    }
    
    /* Ultra-Compact Form Options */
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0.6rem 0;
    }
    
    /* Smaller form options for register/verify/reset forms */
    .register-form .form-options,
    .verify-form .form-options,
    .reset-password-form .form-options {
      margin: 0.4rem 0;
    }
    
    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.75rem;
      cursor: pointer;
    }
    
    /* Smaller checkbox wrapper for register/verify/reset forms */
    .register-form .checkbox-wrapper,
    .verify-form .checkbox-wrapper,
    .reset-password-form .checkbox-wrapper {
      font-size: 0.7rem;
    }
    
    .checkbox-wrapper input[type="checkbox"] {
      display: none;
    }
    
    .checkmark {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 3px;
      position: relative;
      transition: all 0.3s ease;
    }
    
    /* Smaller checkmarks for register/verify/reset forms */
    .register-form .checkmark,
    .verify-form .checkmark,
    .reset-password-form .checkmark {
      width: 12px;
      height: 12px;
    }
    
    .checkbox-wrapper input[type="checkbox"]:checked + .checkmark {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
    }
    
    .checkbox-wrapper input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 0.6rem;
      font-weight: bold;
    }
    
    /* Enhanced Forgot Password Link */
    .forgot-link {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 0.75rem;
      transition: all 0.3s ease;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0.3rem 0.5rem;
      border-radius: 0.5rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .forgot-link:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    
    .forgot-link:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .forgot-icon {
      font-size: 1rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    /* Ultra-Compact Buttons */
    .button-group {
      margin: 0.6rem 0;
    }
    
    /* Smaller button groups for register/verify/reset forms */
    .register-form .button-group,
    .verify-form .button-group,
    .reset-password-form .button-group {
      margin: 0.4rem 0;
    }
    
    .btn {
      width: 100%;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
    }
    
    /* Smaller buttons for register/verify/reset forms */
    .register-form .btn,
    .verify-form .btn,
    .reset-password-form .btn {
      padding: 0.5rem 0.8rem;
      font-size: 0.8rem;
      min-height: 36px;
    }
    
    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
    }
    
    .btn-loader {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
    }
    
    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.1), 
        rgba(255, 255, 255, 0.05)
      );
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }
    
    .btn:hover::before {
      transform: translateX(0);
    }
    
    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .btn:disabled::before {
      display: none;
    }
    
    .btn.primary {
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.25), 
        rgba(255, 255, 255, 0.15)
      );
      color: white;
      box-shadow: 
        0 6px 15px rgba(139, 92, 246, 0.25),
        0 3px 8px rgba(139, 92, 246, 0.15);
    }
    
    .btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 20px rgba(139, 92, 246, 0.35),
        0 4px 12px rgba(139, 92, 246, 0.25);
    }
    
    .btn.secondary {
      background: rgba(255, 255, 255, 0.08);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .btn.secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    .btn-secondary-outline {
      width: 100%;
      padding: 0.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.6rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin-top: 0.3rem;
      font-size: 0.8rem;
    }
    
    /* Smaller outline buttons for register/verify/reset forms */
    .register-form .btn-secondary-outline,
    .verify-form .btn-secondary-outline,
    .reset-password-form .btn-secondary-outline {
      padding: 0.4rem;
      font-size: 0.75rem;
      margin-top: 0.2rem;
    }
    
    .btn-secondary-outline:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.4);
      color: white;
    }
    
    .back-btn {
      width: 100%;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.6rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin-top: 0.6rem;
      font-size: 0.8rem;
    }
    
    /* Smaller back button for verify/reset form */
    .verify-form .back-btn,
    .reset-password-form .back-btn {
      padding: 0.4rem;
      font-size: 0.75rem;
      margin-top: 0.4rem;
    }
    
    .back-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: white;
    }
    
    /* Ultra-Compact Divider */
    .divider {
      display: flex;
      align-items: center;
      margin: 0.8rem 0;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.75rem;
    }
    
    /* Smaller dividers for register/verify/reset forms */
    .register-form .divider,
    .verify-form .divider,
    .reset-password-form .divider {
      margin: 0.6rem 0;
      font-size: 0.7rem;
    }
    
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent, 
        rgba(255, 255, 255, 0.2), 
        transparent
      );
    }
    
    .divider span {
      padding: 0 0.6rem;
    }
    
    /* Ultra-Compact Resend Section */
    .resend-section {
      text-align: center;
      margin-top: 0.6rem;
    }
    
    /* Smaller resend section for verify/reset form */
    .verify-form .resend-section,
    .reset-password-form .resend-section {
      margin-top: 0.4rem;
    }
    
    .resend-section p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.75rem;
      margin-bottom: 0.3rem;
    }
    
    /* Smaller resend text for verify/reset form */
    .verify-form .resend-section p,
    .reset-password-form .resend-section p {
      font-size: 0.7rem;
    }
    
    /* Ultra-Compact Message Styling */
    .msg {
      padding: 0.6rem 0.8rem;
      border-radius: 0.6rem;
      font-size: 0.75rem;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      margin-top: 0.6rem;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }
    
    /* Smaller messages for register/verify/reset forms */
    .register-form .msg,
    .verify-form .msg,
    .reset-password-form .msg {
      padding: 0.5rem 0.7rem;
      font-size: 0.7rem;
      margin-top: 0.4rem;
    }
    
    .msg.error {
      background: rgba(255, 107, 107, 0.15);
      color: #ffcccc;
      border-color: rgba(255, 107, 107, 0.3);
    }
    
    .msg.success {
      background: rgba(107, 255, 127, 0.15);
      color: #ccffcc;
      border-color: rgba(107, 255, 127, 0.3);
    }
    
    /* Ultra-Compact Spinner */
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
    }
    
    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-6px);
      }
    }
    
    @keyframes floatUpDown {
      0%, 100% {
        transform: translateY(0) rotate(0deg);
      }
      25% {
        transform: translateY(-12px) rotate(5deg);
      }
      75% {
        transform: translateY(12px) rotate(-5deg);
      }
    }
    
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .login-wrapper {
        flex-direction: column;
      }
      
      .login-left {
        height: 30vh;
      }
      
      .brand-container {
        padding: 1rem 0.8rem;
      }
      
      .brand-logo {
        font-size: 1.8rem;
      }
      
      .brand-title {
        font-size: 0.9rem;
      }
      
      .login-right {
        height: 70vh;
        padding: 0.8rem;
      }
      
      .form-container {
        padding: 1.2rem 1rem;
        border-radius: 1.2rem;
        max-width: 100%;
      }
      
      /* Even smaller forms on mobile */
      .form-container.register-form,
      .form-container.verify-form,
      .form-container.reset-password-form {
        max-width: 100%;
        padding: 1rem 0.8rem;
      }
      
      .form-header h2 {
        font-size: 1.3rem;
      }
      
      .code-inputs {
        gap: 0.2rem;
      }
      
      .floating-item {
        font-size: 1.2rem;
      }
      
      .brand-icon {
        font-size: 1.5rem;
      }
    }
    
    @media (max-height: 600px) {
      .form-container {
        padding: 1rem 0.8rem;
      }
      
      /* Even smaller forms on short screens */
      .form-container.register-form,
      .form-container.verify-form,
      .form-container.reset-password-form {
        padding: 0.8rem 0.6rem;
      }
      
      .form-header {
        margin-bottom: 0.8rem;
      }
      
      .register-form .form-header,
      .verify-form .form-header,
      .reset-password-form .form-header {
        margin-bottom: 0.6rem;
      }
      
      .welcome-icon {
        font-size: 1.5rem;
        margin-bottom: 0.4rem;
      }
      
      .register-form .welcome-icon,
      .verify-form .welcome-icon,
      .reset-password-form .welcome-icon {
        font-size: 1.3rem;
        margin-bottom: 0.3rem;
      }
      
      .form-header h2 {
        font-size: 1.3rem;
        margin-bottom: 0.2rem;
      }
      
      .register-form .form-header h2,
      .verify-form .form-header h2,
      .reset-password-form .form-header h2 {
        font-size: 1.1rem;
      }
      
      .subtitle {
        font-size: 0.7rem;
      }
      
      .register-form .subtitle,
      .verify-form .subtitle,
      .reset-password-form .subtitle {
        font-size: 0.65rem;
      }
      
      .login-form {
        gap: 0.6rem;
      }
      
      .register-form .login-form,
      .verify-form .login-form,
      .reset-password-form .login-form {
        gap: 0.4rem;
      }
      
      .form-group {
        margin-bottom: 0.3rem;
      }
      
      .form-group input {
        padding: 0.5rem 0.7rem;
      }
      
      .register-form .form-group input,
      .verify-form .form-group input,
      .reset-password-form .form-group input {
        padding: 0.4rem 0.6rem;
      }
      
      .btn {
        padding: 0.5rem 0.8rem;
        min-height: 36px;
      }
      
      .register-form .btn,
      .verify-form .btn,
      .reset-password-form .btn {
        padding: 0.4rem 0.6rem;
        min-height: 32px;
      }
    }
  `;

        document.head.appendChild(loginStyles);
    }
}
// ===== PROFILE SETTINGS =====
function showProfileSettingsPage() {
    localStorage.setItem("currentPage", "page_profile");

    // Use state.user as primary source, fallback to localStorage backup
    const profileData = state.user || JSON.parse(localStorage.getItem('userProfile')) || {
        fullName: '',
        email: '',
        bio: '',
        avatar: '',
        dateOfBirth: '',
        location: '',
        interests: []
    };

    // Get user's entries for mood insights
    const moodEntries = JSON.parse(localStorage.getItem('moodData') || '[]');
    const recentMoods = moodEntries.slice(-7); // Last 7 entries

    // Calculate mood summary
    const moodCounts = {};
    recentMoods.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
        moodCounts[a] > moodCounts[b] ? a : b, '😊');

    // Calculate profile completion percentage
    const calculateCompletion = () => {
        let completedFields = 0;
        const totalFields = 7; // Total fields we're tracking

        if (profileData.fullName) completedFields++;
        if (profileData.email) completedFields++;
        if (profileData.bio) completedFields++;
        if (profileData.avatar) completedFields++;
        if (profileData.dateOfBirth) completedFields++;
        if (profileData.location) completedFields++;
        if (profileData.interests && profileData.interests.length > 0) completedFields++;

        return Math.round((completedFields / totalFields) * 100);
    };

    const completionPercentage = calculateCompletion();

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container">
            <div class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji">🌸</span>
                    <h2>Profile Settings</h2>
                    <span class="deco-emoji">🌈</span>
                </div>
                <p>Manage your personal information and mood profile</p>
                <div class="profile-completion">
                    <div class="completion-label">Profile Completion</div>
                    <div class="completion-bar">
                        <div class="completion-fill" style="width: ${completionPercentage}%"></div>
                    </div>
                    <div class="completion-percentage">${completionPercentage}%</div>
                </div>
            </div>
            
            <div class="settings-content">
                <div class="profile-avatar-section">
                    <div class="avatar-container">
                        <div class="avatar" id="avatarPreview">
                            ${profileData.avatar ? `<img src="${profileData.avatar}" alt="Profile">` : `<span class="avatar-placeholder">${dominantMood}</span>`}
                        </div>
                        <div class="avatar-upload">
                            <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                            <button class="btn-primary" onclick="document.getElementById('avatarInput').click()">
                                <span class="icon">📷</span> Change Photo
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="profile-form">
                    <div class="form-section">
                        <h3><span class="section-icon">🌱</span> Personal Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fullName">Full Name</label>
                                <input type="text" id="fullName" value="${profileData.fullName || ''}" placeholder="Enter your name">
                            </div>
                            <div class="form-group">
                                <label for="dateOfBirth">Date of Birth</label>
                                <input type="date" id="dateOfBirth" value="${profileData.dateOfBirth || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" value="${profileData.email || ''}" placeholder="your.email@example.com">
                        </div>
                        
                        <div class="form-group">
                            <label for="location">Location</label>
                            <input type="text" id="location" value="${profileData.location || ''}" placeholder="City, Country">
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3><span class="section-icon">🦋</span> About You</h3>
                        <div class="form-group">
                            <label for="bio">Bio</label>
                            <textarea id="bio" rows="4" placeholder="Tell us about yourself...">${profileData.bio || ''}</textarea>
                            <div class="char-count">
                                <span id="bioCharCount">${profileData.bio ? profileData.bio.length : 0}</span>/200
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Interests</label>
                            <div class="interests-container">
                                ${['Meditation', 'Exercise', 'Art', 'Music', 'Reading', 'Nature', 'Travel', 'Cooking'].map(interest => `
                                    <label class="interest-tag">
                                        <input type="checkbox" value="${interest}" ${profileData.interests && profileData.interests.includes(interest) ? 'checked' : ''}>
                                        <span>${interest}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn-primary" onclick="saveProfileData()">
                    <span class="icon">💾</span> Save Changes
                </button>
                <button class="btn-secondary" onclick="showHome()">
                    <span class="icon">✖</span> Cancel
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);
    document.getElementById('bio').addEventListener('input', updateBioCharCount);

    // Initialize bio character count
    updateBioCharCount();

    // Add CSS for enhanced profile settings with simple scrollbar
    const profileStyles = document.createElement('style');
    profileStyles.textContent = `
        /* Main container with simple scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        }
        
        /* Simple scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--bg-section);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            opacity: 0.7;
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            opacity: 1;
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) var(--bg-section);
        }
        
        .settings-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 40px;
            background: transparent;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 24px;
            border: none;
            position: relative;
            box-shadow: none;
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
            opacity: 0.05;
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        
        .profile-completion {
            margin-top: 20px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            border: 1px solid var(--border-main);
        }
        
        .completion-label {
            font-weight: 600;
            margin-bottom: 10px;
            color: #ffffff;
            font-size: 1.1rem;
        }
        
        .completion-bar {
            height: 12px;
            background: var(--bg-page);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 8px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .completion-fill {
            height: 100%;
            background: var(--primary-color);
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 10px;
        }
        
        .completion-percentage {
            font-weight: 700;
            color: var(--primary-color);
            font-size: 1.2rem;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .profile-avatar-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding: 25px;
            background: transparent;
            border-radius: 20px;
            border: none;
            position: relative;
            z-index: 2;
        }
        
        .avatar-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        .avatar {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            overflow: hidden;
            border: 5px solid var(--border-main);
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: none;
            transition: transform 0.3s ease;
        }
        
        .avatar:hover {
            transform: scale(1.05);
            border-color: var(--primary-color);
        }
        
        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .avatar-placeholder {
            font-size: 3.5rem;
            color: var(--primary-color);
        }
        
        .avatar-upload {
            display: flex;
            gap: 10px;
        }
        
        .profile-form {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .form-section {
            padding: 20px 0;
            background: transparent;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
        }
        
        .form-section:last-child {
            border-bottom: none;
        }
        
        .form-section h3 {
            color: #ffffff;
            margin-bottom: 20px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        .form-row {
            display: flex;
            gap: 20px;
        }
        
        .form-group {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-group label {
            font-weight: 600;
            color: #ffffff;
            font-size: 1rem;
        }
        
        .form-group input,
        .form-group textarea {
            padding: 14px;
            border: 1px solid var(--border-main);
            border-radius: 12px;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transition: all 0.3s ease;
            width: 100%;
            box-sizing: border-box;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-color);
            background: transparent;
            transform: translateY(-2px);
            box-shadow: none;
        }
        
        .char-count {
            text-align: right;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
        }
        
        .interests-container {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .interest-tag {
            display: flex;
            align-items: center;
            padding: 8px 16px;
            background: rgba(168, 85, 247, 0.15);
            color: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(168, 85, 247, 0.3);
        }
        
        .interest-tag:hover {
            transform: translateY(-2px);
            background: rgba(168, 85, 247, 0.25);
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .interest-tag input {
            display: none;
        }
        
        .interest-tag input:checked + span {
            color: #ffffff;
            font-weight: 600;
        }

        .interest-tag:has(input:checked) {
            background: linear-gradient(135deg, #a855f7, #8b5cf6);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            color: #ffffff;
        }
        
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
            position: relative;
            z-index: 1;
        }
        
        .btn-primary {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
            background: var(--primary-color);
            color: var(--text-on-primary);
            box-shadow: none;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            opacity: 0.9;
        }
        
        .btn-secondary {
            padding: 14px 28px;
            border: 1px solid var(--border-main);
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
            background: transparent;
            color: #ffffff;
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            background: var(--bg-section);
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
            }
            
            .avatar-container {
                margin-bottom: 10px;
            }
            
            .settings-actions {
                flex-direction: column;
            }
            
            .settings-container {
                margin: 10px;
                padding: 15px;
            }
            
            .header-decoration {
                flex-direction: column;
                gap: 5px;
            }
            
            .settings-header h2 {
                font-size: 1.8rem;
            }
            
            #maincard {
                height: 100%;
            }
        }
    `;

    if (!document.querySelector('style[data-profile-settings]')) {
        profileStyles.setAttribute('data-profile-settings', 'true');
        document.head.appendChild(profileStyles);
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size should be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('avatarPreview').innerHTML = `<img src="${e.target.result}" alt="Profile">`;
            showNotification('Avatar uploaded successfully', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function updateBioCharCount() {
    const bio = document.getElementById('bio').value;
    document.getElementById('bioCharCount').textContent = bio.length;

    if (bio.length > 200) {
        document.getElementById('bio').value = bio.substring(0, 200);
        document.getElementById('bioCharCount').textContent = 200;
    }
}

async function saveProfileData() {
    const interests = [];
    document.querySelectorAll('.interest-tag input:checked').forEach(checkbox => {
        interests.push(checkbox.value);
    });

    const avatarImg = document.querySelector('#avatarPreview img');
    const profileData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        bio: document.getElementById('bio').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        location: document.getElementById('location').value,
        interests: interests,
        avatar: avatarImg ? avatarImg.src : '',
        updatedAt: new Date().toISOString()
    };

    // Show saving indicator
    const saveButton = document.querySelector('.btn-primary');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="icon">⏳</span> Saving...';
    saveButton.disabled = true;

    try {
        // Send updates to server
        const response = await api('/auth/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (response.success && response.user) {
            // Update local state immediately
            state.user = response.user;

            // Also update localStorage backup
            localStorage.setItem(getUserKey('userProfile'), JSON.stringify(response.user));

            // Update profile button avatar immediately
            updateProfileButtonAvatar(response.user.avatar);

            // Update dropdown avatar if it exists
            const dropdownAvatar = document.querySelector('.dropdown-avatar');
            if (dropdownAvatar) {
                dropdownAvatar.innerHTML = getUserAvatar();
            }

            showNotification('Profile updated successfully!', 'success');
            showHome();
        } else {
            throw new Error(response.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification(error.message || 'Error saving profile. Please try again.', 'error');
    } finally {
        // Reset button
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    }
}

// Function to update profile button avatar
function updateProfileButtonAvatar(avatarUrl) {
    // Try different selectors for the profile button
    const profileButton = document.querySelector('.profile-button') ||
        document.querySelector('#profile-button') ||
        document.querySelector('.user-avatar') ||
        document.querySelector('.avatar-button');

    if (profileButton) {
        if (avatarUrl) {
            profileButton.innerHTML = `<img src="${avatarUrl}" alt="Profile" class="profile-avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`;
        } else {
            const profileData = JSON.parse(localStorage.getItem('userProfile')) || {};
            const initial = profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U';
            profileButton.innerHTML = `<span class="profile-initial" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${initial}</span>`;
        }
    }
}

// Function to initialize profile button with current avatar
function initializeProfileButton() {
    const profileData = JSON.parse(localStorage.getItem('userProfile')) || {};
    const avatarUrl = profileData.avatar;

    // Try different selectors for the profile button
    const profileButton = document.querySelector('.profile-button') ||
        document.querySelector('#profile-button') ||
        document.querySelector('.user-avatar') ||
        document.querySelector('.avatar-button');

    if (profileButton) {
        if (avatarUrl) {
            profileButton.innerHTML = `<img src="${avatarUrl}" alt="Profile" class="profile-avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`;
        } else {
            const initial = profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U';
            profileButton.innerHTML = `<span class="profile-initial" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${initial}</span>`;
        }
    }
}

// Call this function when the page loads to set the initial avatar
document.addEventListener('DOMContentLoaded', initializeProfileButton);

// ===== PRIVACY AND SECURITY =====
function showPrivacySecurityPage() {
    localStorage.setItem("currentPage", "page_privacy");
    const privacySettings = JSON.parse(localStorage.getItem(getUserKey('privacySettings'))) || {
        dataSharing: false,
        analytics: true,
        publicProfile: false,
        twoFactorAuth: false,
        sessionTimeout: 30,
        loginNotifications: true
    };

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container">
            <div class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji">🌸</span>
                    <h2>Privacy & Security</h2>
                    <span class="deco-emoji">🔒</span>
                </div>
                <p>Control your data and protect your account</p>
            </div>
            
            <div class="settings-content">
                <div class="settings-section">
                    <h3><span class="section-icon">🛡️</span> Privacy Settings</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Data Sharing</h4>
                            <p>Allow anonymous data sharing for research purposes</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="dataSharing" ${privacySettings.dataSharing ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Analytics</h4>
                            <p>Help us improve by sharing usage analytics</p>
                        </div>
                        <label class="toggle-switch" for="analytics">
                            <input type="checkbox" id="analytics" ${privacySettings.analytics ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Public Profile</h4>
                            <p>Make your profile visible to other users</p>
                        </div>
                        <label class="toggle-switch" for="publicProfile">
                            <input type="checkbox" id="publicProfile" ${privacySettings.publicProfile ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">🔐</span> Security Settings</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Two-Factor Authentication</h4>
                            <p>Add an extra layer of security to your account</p>
                        </div>
                        <label class="toggle-switch" for="twoFactorAuth">
                            <input type="checkbox" id="twoFactorAuth" ${privacySettings.twoFactorAuth ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Login Notifications</h4>
                            <p>Get notified when someone logs into your account</p>
                        </div>
                        <label class="toggle-switch" for="loginNotifications">
                            <input type="checkbox" id="loginNotifications" ${privacySettings.loginNotifications ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Session Timeout</h4>
                            <p>Automatically log out after period of inactivity</p>
                        </div>
                        <select id="sessionTimeout" class="setting-select">
                            <option value="15" ${privacySettings.sessionTimeout === 15 ? 'selected' : ''}>15 minutes</option>
                            <option value="30" ${privacySettings.sessionTimeout === 30 ? 'selected' : ''}>30 minutes</option>
                            <option value="60" ${privacySettings.sessionTimeout === 60 ? 'selected' : ''}>1 hour</option>
                            <option value="0" ${privacySettings.sessionTimeout === 0 ? 'selected' : ''}>Never</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">🔑</span> Password</h3>
                    <div class="password-form">
                        <div class="form-group">
                            <label for="currentPassword">Current Password</label>
                            <input type="password" id="currentPassword" placeholder="Enter current password">
                        </div>
                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <input type="password" id="newPassword" placeholder="Enter new password">
                            <div class="password-strength" id="passwordStrength"></div>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm New Password</label>
                            <input type="password" id="confirmPassword" placeholder="Confirm new password">
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">💾</span> Data Management</h3>
                    <div class="data-actions">
                        <button class="btn-secondary" onclick="downloadMyData()">
                            <span class="icon">📥</span> Download My Data
                        </button>
                        <button class="btn-danger" onclick="confirmDeleteAccount()">
                            <span class="icon">🗑️</span> Delete Account
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn-primary" onclick="savePrivacySettings()">
                    <span class="icon">💾</span> Save Changes
                </button>
                <button class="btn-secondary" onclick="showHome()">
                    <span class="icon">✖</span> Cancel
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('newPassword').addEventListener('input', checkPasswordStrength);

    // Add CSS for enhanced privacy and security page
    const privacyStyles = document.createElement('style');
    privacyStyles.textContent = `
        /* Main container with scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        }
        
        /* Simple scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--bg-section);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            opacity: 0.7;
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            opacity: 1;
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) var(--bg-section);
        }
        
        .settings-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: transparent;
            position: relative;
            overflow: visible;
            border: none;
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
            opacity: 0.05;
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            margin-bottom: 0;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .settings-section {
            background: transparent !important;
            padding: 15px 0 !important;
            border: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            margin-bottom: 20px;
        }
        
        .settings-section h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .setting-item:last-child {
            border-bottom: none;
        }
        
        .setting-info {
            flex: 1;
        }
        
        .setting-info h4 {
            margin: 0 0 5px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .setting-info p {
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            transition: 0.4s;
            border-radius: 30px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background: rgba(255, 255, 255, 0.1);
            transition: 0.4s;
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background: linear-gradient(135deg, #ff6b6b, #feca57);
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(30px);
        }
        
        .setting-select {
            padding: 6px 12px;
            width: auto;
            min-width: 140px;
            border: 2px solid transparent;
            border-radius: 12px;
            font-size: 0.95rem;
            background: rgba(255, 255, 255, 0.1) padding-box,
                        linear-gradient(135deg, #ff6b6b, #feca57) border-box;
            transition: all 0.3s ease;
            cursor: pointer;
            color: white;
        }

        .setting-select option {
            background-color: #8e23e6ff;
            color: white;
            padding: 10px;
        }
        
        .setting-select:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.1) padding-box,
                        linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb) border-box;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.2);
        }
        
        .password-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-group label {
            font-weight: 600;
            color: #ffffff;
            font-size: 1rem;
        }
        
        .form-group input {
            padding: 14px;
            border: 1px solid var(--border-main);
            border-radius: 12px;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transition: all 0.3s ease;
            width: 100%;
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: var(--primary-color);
            background: transparent;
            transform: translateY(-2px);
            box-shadow: none;
        }

        
        .password-strength {
            font-size: 0.9rem;
            margin-top: 5px;
            height: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .password-strength-weak {
            color: #e74c3c;
        }
        
        .password-strength-medium {
            color: #f39c12;
        }
        
        .password-strength-strong {
            color: #2ecc71;
        }
        
        .data-actions {
            display: flex;
            gap: 15px;
            margin-top: 10px;
        }
        
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn-primary,
        .btn-secondary,
        .btn-danger {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #ff6b6b, #feca57);
            color: white;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #dfe6e9, #b2bec3);
            color: #2c3e50;
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(178, 190, 195, 0.3);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
        }
        
        .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
            .setting-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
                padding: 15px 0;
            }
            
            .toggle-switch {
                margin-top: 5px;
            }
            
            .settings-container {
                margin: 10px;
                padding: 15px;
            }
            
            .header-decoration {
                flex-direction: column;
                gap: 5px;
            }
            
            .settings-header h2 {
                font-size: 1.8rem;
            }
            
            #maincard {
                height: 100%;
            }

            .data-actions, .settings-actions {
                flex-direction: column !important;
                width: 100% !important;
                gap: 12px !important;
            }

            .data-actions button, .settings-actions button {
                width: 100% !important;
                justify-content: center !important;
            }
        }
    `;

    if (!document.querySelector('style[data-privacy-security]')) {
        privacyStyles.setAttribute('data-privacy-security', 'true');
        document.head.appendChild(privacyStyles);
    }
}
function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthElement = document.getElementById('passwordStrength');

    if (!password) {
        strengthElement.textContent = '';
        return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    let strengthText = '';
    let strengthClass = '';

    if (strength <= 2) {
        strengthText = 'Weak';
        strengthClass = 'weak';
    } else if (strength <= 4) {
        strengthText = 'Medium';
        strengthClass = 'medium';
    } else {
        strengthText = 'Strong';
        strengthClass = 'strong';
    }

    strengthElement.innerHTML = `<span class="password-strength-${strengthClass}">${strengthText}</span>`;
}
function savePrivacySettings() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword && newPassword !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    const settings = {
        dataSharing: document.getElementById('dataSharing').checked,
        analytics: document.getElementById('analytics').checked,
        publicProfile: document.getElementById('publicProfile').checked,
        twoFactorAuth: document.getElementById('twoFactorAuth').checked,
        loginNotifications: document.getElementById('loginNotifications').checked,
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem(getUserKey('privacySettings'), JSON.stringify(settings));

    if (newPassword) {
        // In a real app, this would update the password on the server
        showNotification('Password updated successfully!', 'success');
    }

    showNotification('Privacy settings updated successfully!', 'success');
    showHome();
}
function downloadMyData() {
    // This would gather all user data and create a downloadable file
    showNotification('Preparing your data for download...', 'info');
    setTimeout(() => {
        showNotification('Your data is ready for download!', 'success');
    }, 1500);
}
function confirmDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
        if (confirm('This is your final warning. All your mood data, profile information, and settings will be permanently deleted. Continue?')) {
            // In a real app, this would delete the account on the server
            showNotification('Account deletion requested. You will receive a confirmation email shortly.', 'info');
            setTimeout(() => {
                showHome();
            }, 2000);
        }
    }
}
// ===== EXPORT DATA =====
function showExportDataPage() {
    localStorage.setItem("currentPage", "page_export");

    const moodData = JSON.parse(localStorage.getItem(getUserKey('moodData')) || '[]');
    const profileData = JSON.parse(localStorage.getItem(getUserKey('userProfile'))) || {};
    const settingsData = JSON.parse(localStorage.getItem(getUserKey('privacySettings'))) || {};

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container">
            <div class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji">🌸</span>
                    <h2>Export Your Data</h2>
                    <span class="deco-emoji">📦</span>
                </div>
                <p>Download your mood data in various formats</p>
            </div>
            
            <div class="settings-content">
                <div class="data-summary">
                    <div class="summary-card">
                        <div class="summary-icon">📝</div>
                        <div class="summary-value">${moodData.length}</div>
                        <div class="summary-label">Mood Entries</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon">📅</div>
                        <div class="summary-value">${calculateDaysTracked(moodData)}</div>
                        <div class="summary-label">Days Tracked</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon">💾</div>
                        <div class="summary-value">${formatFileSize(JSON.stringify(moodData).length)}</div>
                        <div class="summary-label">Data Size</div>
                    </div>
                </div>
                
                <div class="export-options">
                    <div class="export-option" onclick="exportAsJSON()">
                        <div class="export-icon">📄</div>
                        <div class="export-info">
                            <h3>JSON</h3>
                            <p>Structured data format suitable for developers</p>
                        </div>
                        <div class="export-action">
                            <button class="btn-secondary">Export</button>
                        </div>
                    </div>
                    
                    <div class="export-option" onclick="exportAsCSV()">
                        <div class="export-icon">📊</div>
                        <div class="export-info">
                            <h3>CSV</h3>
                            <p>Spreadsheet format for data analysis</p>
                        </div>
                        <div class="export-action">
                            <button class="btn-secondary">Export</button>
                        </div>
                    </div>
                    
                    <div class="export-option" onclick="exportAsPDF()">
                        <div class="export-icon">📑</div>
                        <div class="export-info">
                            <h3>PDF Report</h3>
                            <p>Formatted report with charts and insights</p>
                        </div>
                        <div class="export-action">
                            <button class="btn-secondary">Export</button>
                        </div>
                    </div>
                </div>
                
                <div class="export-preview">
                    <h3><span class="section-icon">👁️</span> Data Preview</h3>
                    <div class="preview-tabs">
                        <button class="tab-button active" onclick="showPreviewTab('mood')">Mood Data</button>
                        <button class="tab-button" onclick="showPreviewTab('profile')">Profile</button>
                        <button class="tab-button" onclick="showPreviewTab('settings')">Settings</button>
                    </div>
                    <div class="preview-content" id="moodPreview">
                        <table class="preview-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Mood</th>
                                    <th>Intensity</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${moodData.slice(0, 5).map(entry => `
                                    <tr>
                                        <td>${new Date(entry.date).toLocaleDateString()}</td>
                                        <td>${entry.mood}</td>
                                        <td>${entry.intensity || 'N/A'}</td>
                                        <td>${entry.notes || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${moodData.length > 5 ? `<p class="preview-more">... and ${moodData.length - 5} more entries</p>` : ''}
                    </div>
                    <div class="preview-content hidden" id="profilePreview">
                        <table class="preview-table">
                            <tbody>
                                <tr>
                                    <td>Name</td>
                                    <td>${profileData.fullName || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>Email</td>
                                    <td>${profileData.email || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>Bio</td>
                                    <td>${profileData.bio || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td>Location</td>
                                    <td>${profileData.location || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="preview-content hidden" id="settingsPreview">
                        <table class="preview-table">
                            <tbody>
                                <tr>
                                    <td>Data Sharing</td>
                                    <td>${settingsData.dataSharing ? 'Enabled' : 'Disabled'}</td>
                                </tr>
                                <tr>
                                    <td>Analytics</td>
                                    <td>${settingsData.analytics ? 'Enabled' : 'Disabled'}</td>
                                </tr>
                                <tr>
                                    <td>Public Profile</td>
                                    <td>${settingsData.publicProfile ? 'Enabled' : 'Disabled'}</td>
                                </tr>
                                <tr>
                                    <td>Two-Factor Auth</td>
                                    <td>${settingsData.twoFactorAuth ? 'Enabled' : 'Disabled'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn-primary" onclick="exportAllData()">
                    <span class="icon">📦</span> Export All Data
                </button>
                <button class="btn-secondary" onclick="showHome()">
                    <span class="icon">✖</span> Back to Home
                </button>
            </div>
        </div>
    `;

    // Add CSS for enhanced export data page
    const exportStyles = document.createElement('style');
    exportStyles.textContent = `
        /* Main container with scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        }
        
        /* Simple scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--bg-section);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            opacity: 0.7;
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            opacity: 1;
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) var(--bg-section);
        }
        
        .settings-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: transparent;
            position: relative;
            overflow: visible;
            border: none;
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: clamp(0.9rem, 4vw, 1.1rem);
            margin: 10px auto;
            max-width: 100%;
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            display: block !important;
            line-height: 1.5;
            padding: 0 15px;
            box-sizing: border-box;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .data-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
            width: 100%;
        }
        
        .summary-card {
            background: transparent !important;
            border-radius: 0 !important;
            padding: 20px;
            text-align: center;
            backdrop-filter: none !important;
            border: none !important;
            box-shadow: none !important;
            border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
            transition: transform 0.3s ease;
        }
        
        .summary-card:hover {
            transform: translateY(-5px);
        }
        
        .summary-icon {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .summary-value {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 5px;
        }
        
        .summary-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1rem;
            font-weight: 500;
        }
        
        .export-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .export-option {
            background: transparent !important;
            border-radius: 0 !important;
            padding: 25px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            backdrop-filter: none !important;
            border: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            transition: transform 0.3s ease;
            cursor: pointer;
            box-shadow: none !important;
        }
        
        .export-option:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .export-icon {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        
        .export-info {
            flex: 1;
        }
        
        .export-info h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin-bottom: 5px;
        }
        
        .export-info p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1rem;
            margin: 0;
        }
        
        .export-action {
            margin-top: 15px;
        }
        
        .export-preview {
            background: transparent;
            border-radius: 0;
            padding: 25px;
            backdrop-filter: none;
            border: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .export-preview h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        .preview-tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .tab-button {
            padding: 10px 15px;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 8px 8px 0 0;
        }
        
        .tab-button.active {
            color: #ff6b6b;
            border-bottom-color: #ff6b6b;
        }
        
        .tab-button:hover {
            color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
        }
        
        .preview-content {
            overflow: hidden;
        }
        
        .preview-content.hidden {
            display: none;
        }
        
        .preview-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .preview-table th {
            text-align: left;
            padding: 10px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            color: #ffffff;
            font-weight: 600;
        }
        
        .preview-table td {
            padding: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.9);
        }
        
        .preview-table tr:last-child td {
            border-bottom: none;
        }
        
        .preview-more {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            font-style: italic;
            margin-top: 15px;
        }
        
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn-primary,
        .btn-secondary {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #ff6b6b, #feca57);
            color: white;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #dfe6e9, #b2bec3);
            color: #2c3e50;
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(178, 190, 195, 0.3);
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
            .data-summary {
                grid-template-columns: 1fr !important;
                gap: 15px !important;
                width: 100% !important;
            }

            .summary-card {
                border-right: none !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                padding: 20px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }

            .summary-card:last-child {
                border-bottom: none !important;
            }
            
            .export-options {
                grid-template-columns: 1fr !important;
                gap: 15px !important;
                width: 100% !important;
            }

            .export-option {
                padding: 20px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            
            .settings-container {
                margin: 0 !important;
                padding: 15px !important;
                width: 100% !important;
                max-width: 100vw !important;
                box-sizing: border-box !important;
                border-radius: 0 !important;
            }
            
            .header-decoration {
                flex-direction: column;
                gap: 10px;
                width: 100%;
            }
            
            .settings-header h2 {
                font-size: clamp(1.5rem, 8vw, 2.2rem) !important;
                word-break: break-word !important;
                white-space: normal !important;
                line-height: 1.2;
                padding: 0 10px;
            }
            
            #maincard {
                height: 100% !important;
                padding: 0 !important;
                overflow-x: hidden !important;
            }

            .settings-actions {
                flex-direction: column !important;
                width: 100% !important;
                gap: 15px !important;
                padding: 0 15px 20px 15px !important;
                box-sizing: border-box !important;
            }

            .settings-actions button {
                width: 100% !important;
                justify-content: center !important;
                padding: 16px !important;
            }

            .preview-content {
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch;
                margin: 0 -15px;
                padding: 0 15px;
                width: calc(100% + 30px);
            }

            .preview-table {
                min-width: 500px;
            }

            .tab-button {
                padding: 10px 8px;
                font-size: 0.85rem;
                flex: 1;
                text-align: center;
            }
        }
    `;

    if (!document.querySelector('style[data-export-page]')) {
        exportStyles.setAttribute('data-export-page', 'true');
        document.head.appendChild(exportStyles);
    }
}
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function calculateDaysTracked(moodData) {
    if (!moodData.length) return 0;

    const uniqueDays = new Set();
    moodData.forEach(entry => {
        uniqueDays.add(entry.date.split('T')[0]);
    });

    return uniqueDays.size;
}
function showPreviewTab(tab) {
    // Hide all preview content
    document.querySelectorAll('.preview-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected preview content
    document.getElementById(tab + 'Preview').classList.remove('hidden');

    // Add active class to clicked tab button
    event.target.classList.add('active');
}
function exportAsJSON() {
    const data = {
        profile: JSON.parse(localStorage.getItem(getUserKey('userProfile')) || '{}'),
        moods: JSON.parse(localStorage.getItem(getUserKey('moodData')) || '[]'),
        settings: JSON.parse(localStorage.getItem(getUserKey('privacySettings')) || '{}'),
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-garden-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Data exported as JSON!', 'success');
}
function exportAsCSV() {
    const moodData = JSON.parse(localStorage.getItem(getUserKey('moodData')) || '[]');
    let csv = 'Date,Mood,Intensity,Notes\n';

    moodData.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : '';
        csv += `${date},${entry.mood},${entry.intensity || ''},${notes}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-garden-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Data exported as CSV!', 'success');
}
function exportAsPDF() {
    showNotification('Preparing PDF report...', 'info');
    setTimeout(() => {
        // In a real app, this would generate a PDF with charts and formatted data
        showNotification('PDF report ready!', 'success');
    }, 2000);
}
function exportAllData() {
    // Create a zip file with all formats
    showNotification('Preparing all data formats...', 'info');
    setTimeout(() => {
        // In a real app, this would create a zip with JSON, CSV, and PDF
        showNotification('All data exported successfully!', 'success');
    }, 2500);
}
// ===== APPEARANCE =====
function showAppearancePage() {
    localStorage.setItem("currentPage", "page_appearance");

    const currentTheme = localStorage.getItem(getUserKey('theme')) || 'light';
    const fontSize = localStorage.getItem(getUserKey('fontSize')) || 'medium';
    const compactMode = localStorage.getItem(getUserKey('compactMode')) === 'true';
    const appearanceSettings = JSON.parse(localStorage.getItem(getUserKey('appearanceSettings'))) || {
        primaryColor: '#8b5cf6',
        accentColor: '#10b981',
        moodAnimations: true,
        highContrast: false
    };

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container">
            <div class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji">🌸</span>
                    <h2>Appearance Settings</h2>
                    <span class="deco-emoji">🎨</span>
                </div>
                <p>Customize the look and feel of your app</p>
            </div>
            
            <div class="settings-content">
                <div class="settings-section">
                    <h3><span class="section-icon">🌈</span> Theme</h3>
                    <div class="theme-options">
                        <div class="theme-option ${currentTheme === 'light' ? 'active' : ''}" onclick="changeTheme('light')">
                            <div class="theme-preview light-theme">
                                <div class="preview-header"></div>
                                <div class="preview-content">
                                    <div class="preview-card"></div>
                                    <div class="preview-card"></div>
                                </div>
                            </div>
                            <h4>Light</h4>
                            <p>Bright and clean interface</p>
                        </div>
                        
                        <div class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" onclick="changeTheme('dark')">
                            <div class="theme-preview dark-theme">
                                <div class="preview-header"></div>
                                <div class="preview-content">
                                    <div class="preview-card"></div>
                                    <div class="preview-card"></div>
                                </div>
                            </div>
                            <h4>Dark</h4>
                            <p>Easy on the eyes in low light</p>
                        </div>
                        

                        
                        <div class="theme-option ${currentTheme === 'auto' ? 'active' : ''}" onclick="changeTheme('auto')">
                            <div class="theme-preview auto-theme">
                                <div class="preview-header"></div>
                                <div class="preview-content">
                                    <div class="preview-card"></div>
                                    <div class="preview-card"></div>
                                </div>
                            </div>
                            <h4>Auto</h4>
                            <p>Follows your system settings</p>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">📝</span> Text Size</h3>
                    <div class="font-size-options">
                        <div class="font-size-option ${fontSize === 'small' ? 'active' : ''}" onclick="setFontSize('small')">
                            <div class="font-preview small-font">Aa</div>
                            <h4>Small</h4>
                        </div>
                        
                        <div class="font-size-option ${fontSize === 'medium' ? 'active' : ''}" onclick="setFontSize('medium')">
                            <div class="font-preview medium-font">Aa</div>
                            <h4>Medium</h4>
                        </div>
                        
                        <div class="font-size-option ${fontSize === 'large' ? 'active' : ''}" onclick="setFontSize('large')">
                            <div class="font-preview large-font">Aa</div>
                            <h4>Large</h4>
                        </div>
                        
                        <div class="font-size-option ${fontSize === 'extra-large' ? 'active' : ''}" onclick="setFontSize('extra-large')">
                            <div class="font-preview extra-large-font">Aa</div>
                            <h4>Extra Large</h4>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">🌺</span> Layout Options</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Compact Mode</h4>
                            <p>Reduce spacing between elements for more content on screen</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="compactMode" ${compactMode ? 'checked' : ''} onchange="toggleCompactMode()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Show Mood Animations</h4>
                            <p>Display subtle animations when interacting with mood elements</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="moodAnimations" ${appearanceSettings.moodAnimations ? 'checked' : ''} onchange="toggleMoodAnimations()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>High Contrast</h4>
                            <p>Increase contrast for better visibility</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="highContrast" ${appearanceSettings.highContrast ? 'checked' : ''} onchange="toggleHighContrast()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">🎨</span> Color Customization</h3>
                    <div class="color-options">
                        <div class="color-option">
                            <label for="primaryColor">Primary Color</label>
                            <div class="color-input-container">
                                <input type="color" id="primaryColor" value="${appearanceSettings.primaryColor}" onchange="updatePrimaryColor(this.value)">
                                <span>${appearanceSettings.primaryColor}</span>
                            </div>
                        </div>
                        
                        <div class="color-option">
                            <label for="accentColor">Accent Color</label>
                            <div class="color-input-container">
                                <input type="color" id="accentColor" value="${appearanceSettings.accentColor}" onchange="updateAccentColor(this.value)">
                                <span>${appearanceSettings.accentColor}</span>
                            </div>
                        </div>
                        
                        <div class="color-presets">
                            <h4>Color Presets</h4>
                            <div class="preset-colors">
                                <div class="preset-color ${appearanceSettings.primaryColor === '#8b5cf6' && appearanceSettings.accentColor === '#10b981' ? 'active' : ''}" onclick="applyColorPreset('#8b5cf6', '#10b981')">
                                    <div class="preset-preview" style="background: linear-gradient(135deg, var(--primary-color), var(--accent-color))"></div>
                                    <h5>Ocean</h5>
                                </div>
                                <div class="preset-color ${appearanceSettings.primaryColor === '#e74c3c' && appearanceSettings.accentColor === '#f39c12' ? 'active' : ''}" onclick="applyColorPreset('#e74c3c', '#f39c12')">
                                    <div class="preset-preview" style="background: linear-gradient(135deg, #e74c3c, #f39c12)"></div>
                                    <h5>Sunset</h5>
                                </div>
                                <div class="preset-color ${appearanceSettings.primaryColor === '#2ecc71' && appearanceSettings.accentColor === '#27ae60' ? 'active' : ''}" onclick="applyColorPreset('#2ecc71', '#27ae60')">
                                    <div class="preset-preview" style="background: linear-gradient(135deg, #2ecc71, #27ae60)"></div>
                                    <h5>Forest</h5>
                                </div>
                                <div class="preset-color ${appearanceSettings.primaryColor === '#9b59b6' && appearanceSettings.accentColor === '#3498db' ? 'active' : ''}" onclick="applyColorPreset('#9b59b6', '#3498db')">
                                    <div class="preset-preview" style="background: linear-gradient(135deg, #9b59b6, #3498db)"></div>
                                    <h5>Night Sky</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn-primary" onclick="saveAppearanceSettings()">
                    <span class="icon">💾</span> Save Changes
                </button>
                <button class="btn-secondary" onclick="resetAppearanceSettings()">
                    <span class="icon">↺</span> Reset to Default
                </button>
                <button class="btn-secondary" onclick="showHome()">
                    <span class="icon">✖</span> Back to Home
                </button>
            </div>
        </div>
    `;

    // Add CSS for enhanced appearance page
    const appearanceStyles = document.createElement('style');
    appearanceStyles.textContent = `
        /* Main container with scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        }
        
        /* Simple scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--bg-section);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            opacity: 0.7;
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            opacity: 1;
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) var(--bg-section);
        }
        
        .settings-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 40px;
            background: transparent;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 24px;
            border: none;
            position: relative;
            box-shadow: none;
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
            opacity: 0.05;
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            margin-bottom: 0;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .settings-section {
            background: transparent;
            border-radius: 0;
            padding: 0;
            backdrop-filter: none;
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 25px;
            transition: none;
        }
        
        .settings-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4);
        }
        
        .settings-section h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        .theme-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .theme-option {
            background: transparent !important;
            border-radius: 0 !important;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            backdrop-filter: none !important;
            border: none;
            border: 2px solid transparent !important; /* Keep border for active state but transparent by default */
            transition: all 0.3s ease;
            cursor: pointer;
            box-shadow: none !important;
        }
        
        .theme-option:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .theme-option.active {
            border-color: var(--primary-color, #8b5cf6) !important;
            background: rgba(var(--primary-color-rgb), 0.1) !important;
        }
        
        .theme-preview {
            width: 100px;
            height: 60px;
            border-radius: 10px;
            margin-bottom: 15px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .light-theme .theme-preview {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .dark-theme .theme-preview {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        }
        
        .garden-theme .theme-preview {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }
        
        .auto-theme .theme-preview {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        }
        
        .preview-header {
            height: 20px;
            background: rgba(255, 255, 255, 0.3);
        }
        
        .preview-content {
            display: flex;
            height: 40px;
        }
        
        .preview-card {
            flex: 1;
            height: 100%;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.5);
            margin: 0 5px;
        }
        
        .theme-option h4 {
            margin: 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .theme-option p {
            margin: 5px 0 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        .font-size-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        
        .font-size-option {
            background: transparent !important;
            border-radius: 0 !important;
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            backdrop-filter: none !important;
            border: 2px solid transparent !important;
            transition: transform 0.3s ease;
            cursor: pointer;
            box-shadow: none !important;
        }
        
        .font-size-option:hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .font-size-option.active {
            border-color: var(--primary-color, #8b5cf6) !important;
        }
        
        .font-preview {
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .small-font {
            font-size: 14px;
        }
        
        .medium-font {
            font-size: 16px;
        }
        
        .large-font {
            font-size: 18px;
        }
        
        .extra-large-font {
            font-size: 20px;
        }
        
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .setting-item:last-child {
            border-bottom: none;
        }
        
        .setting-info {
            flex: 1;
        }
        
        .setting-info h4 {
            margin: 0 0 5px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .setting-info p {
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            transition: 0.4s;
            border-radius: 30px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background: rgba(255, 255, 255, 0.9);
            transition: 0.4s;
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background: linear-gradient(135deg, var(--primary-color, #8b5cf6), var(--accent-color, #10b981));
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(30px);
        }
        
        .color-options {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .color-option {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .color-option label {
            font-weight: 600;
            color: #ffffff;
            font-size: 1rem;
            width: 120px;
        }
        
        .color-input-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .color-input-container input {
            width: 50px;
            height: 40px;
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
        }
        
        .color-input-container span {
            font-size: 0.9rem;
            font-weight: 500;
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 6px;
            min-width: 60px;
            text-align: center;
        }
        
        .color-presets {
            margin-top: 20px;
        }
        
        .color-presets h4 {
            color: #ffffff;
            font-size: 1.1rem;
            margin-bottom: 15px;
        }
        
        .preset-colors {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        
        .preset-color {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        
        .preset-color:hover {
            transform: translateY(-5px);
        }
        
        .preset-color.active {
            transform: translateY(-5px) scale(1.05);
        }
        
        .preset-preview {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-bottom: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .preset-color h5 {
            margin: 0;
            color: #ffffff;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn-primary,
        .btn-secondary {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--primary-color, #8b5cf6), var(--accent-color, #10b981));
            color: white;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #dfe6e9, #b2bec3);
            color: #2c3e50;
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(178, 190, 195, 0.3);
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
            .theme-options, .font-size-options, .preset-colors {
                grid-template-columns: 1fr !important;
            }
            
            .settings-container {
                margin: 10px;
                padding: 15px;
            }
            
            .header-decoration {
                flex-direction: column;
                gap: 5px;
            }
            
            .settings-header h2 {
                font-size: 1.8rem;
            }
            
            #maincard {
                height: 100%;
            }

            .settings-actions {
                flex-direction: column !important;
                width: 100% !important;
                gap: 12px !important;
            }

            .settings-actions button {
                width: 100% !important;
                justify-content: center !important;
            }
        }
    `;

    if (!document.querySelector('style[data-appearance-page]')) {
        appearanceStyles.setAttribute('data-appearance-page', 'true');
        document.head.appendChild(appearanceStyles);
    }
}
function changeTheme(theme) {
    // Update theme selection UI (if on appearance page)
    const options = document.querySelectorAll('.theme-option');
    if (options.length > 0) {
        options.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('onclick') && option.getAttribute('onclick').includes(`'${theme}'`)) {
                option.classList.add('active');
            }
        });
    }

    // Remove all theme classes first
    document.body.classList.remove('dark-theme', 'light-theme', 'garden-theme');

    // Apply specific theme
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'auto') {
        const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.add(isSystemDark ? 'dark-theme' : 'light-theme');
    } else {
        document.body.classList.add('light-theme');
    }

    // Save to localStorage
    localStorage.setItem(getUserKey('theme'), theme);

    // Update Navbar Appearance label
    const appearanceMenuItem = document.getElementById('appearanceSettings');
    if (appearanceMenuItem) {
        const textSpan = appearanceMenuItem.querySelector('.dropdown-item-text');
        if (textSpan) {
            const displayTheme = theme === 'auto' ? 'Auto' : theme.charAt(0).toUpperCase() + theme.slice(1);
            textSpan.textContent = `Appearance: ${displayTheme}`;
        }
    }

    // Sync Chatbot if it exists in DOM
    const chatbotToggle = document.getElementById('themeToggle');
    if (chatbotToggle) {
        const emoji = chatbotToggle.querySelector('.btn-emoji');
        const chatbotContainer = document.getElementById('chatbotContainer');
        const isDark = document.body.classList.contains('dark-theme');

        if (chatbotContainer) {
            isDark ? chatbotContainer.classList.add('dark-theme') : chatbotContainer.classList.remove('dark-theme');
        }
        if (emoji) emoji.textContent = isDark ? '☀️' : '🌙';
    }

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}
function setFontSize(size) {
    // Update font size selection UI
    document.querySelectorAll('.font-size-option').forEach(option => {
        option.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Apply font size
    const fontSizes = {
        'small': '14px',
        'medium': '16px',
        'large': '18px',
        'extra-large': '20px'
    };

    document.body.style.fontSize = fontSizes[size];
    localStorage.setItem(getUserKey('fontSize'), size);
    showNotification(`Font size set to ${size}`, 'success');
}
function toggleCompactMode() {
    const isEnabled = document.getElementById('compactMode').checked;
    if (isEnabled) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    localStorage.setItem(getUserKey('compactMode'), isEnabled);
    showNotification(`Compact mode ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
}
function toggleMoodAnimations() {
    const isEnabled = document.getElementById('moodAnimations').checked;
    if (isEnabled) {
        document.body.classList.remove('no-animations');
    } else {
        document.body.classList.add('no-animations');
    }
    localStorage.setItem(getUserKey('moodAnimations'), isEnabled);
    showNotification(`Mood animations ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
}
function toggleHighContrast() {
    const isEnabled = document.getElementById('highContrast').checked;
    if (isEnabled) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
    localStorage.setItem(getUserKey('highContrast'), isEnabled);
    showNotification(`High contrast ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
}
function updatePrimaryColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    event.target.nextElementSibling.textContent = color;
}
function updateAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    event.target.nextElementSibling.textContent = color;
}
function applyColorPreset(primaryColor, accentColor) {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);

    // Update active preset
    document.querySelectorAll('.preset-color').forEach(preset => {
        preset.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    showNotification('Color preset applied', 'success');
}

function applyAppearanceSettings() {
    // 1. Theme
    const theme = localStorage.getItem(getUserKey('theme')) || 'light';
    changeTheme(theme);

    // 2. Font Size
    const fontSize = localStorage.getItem(getUserKey('fontSize')) || 'medium';
    const fontSizes = {
        'small': '14px',
        'medium': '16px',
        'large': '18px',
        'extra-large': '20px'
    };
    document.body.style.fontSize = fontSizes[fontSize] || '16px';

    // 3. Compact Mode
    const compactMode = localStorage.getItem(getUserKey('compactMode')) === 'true';
    if (compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }

    // 4. Mood Animations
    const moodAnimations = localStorage.getItem(getUserKey('moodAnimations')) !== 'false'; // default true
    if (moodAnimations) {
        document.body.classList.remove('no-animations');
    } else {
        document.body.classList.add('no-animations');
    }

    // 5. High Contrast
    const highContrast = localStorage.getItem(getUserKey('highContrast')) === 'true';
    if (highContrast) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }

    // 6. Colors
    const appearanceSettings = JSON.parse(localStorage.getItem('appearanceSettings')) || {
        primaryColor: '#8b5cf6',
        accentColor: '#10b981'
    };
    document.documentElement.style.setProperty('--primary-color', appearanceSettings.primaryColor);
    document.documentElement.style.setProperty('--accent-color', appearanceSettings.accentColor);
}
function saveAppearanceSettings() {
    const primaryColor = document.getElementById('primaryColor').value;
    const accentColor = document.getElementById('accentColor').value;
    const moodAnimations = document.getElementById('moodAnimations').checked;
    const highContrast = document.getElementById('highContrast').checked;

    const settings = {
        primaryColor,
        accentColor,
        moodAnimations: document.getElementById('moodAnimations').checked,
        highContrast: document.getElementById('highContrast').checked,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('appearanceSettings', JSON.stringify(settings));

    // Save state of other toggles that aren't in the JSON object
    localStorage.setItem('compactMode', document.getElementById('compactMode').checked);
    localStorage.setItem('moodAnimations', document.getElementById('moodAnimations').checked);
    localStorage.setItem('highContrast', document.getElementById('highContrast').checked);

    // Re-apply everything to be sure
    applyAppearanceSettings();

    showNotification('Appearance settings saved!', 'success');
    showHome();
}
function resetAppearanceSettings() {
    if (confirm('Reset all appearance settings to default?')) {
        localStorage.removeItem('theme');
        localStorage.removeItem('fontSize');
        localStorage.removeItem('compactMode');
        localStorage.removeItem('moodAnimations');
        localStorage.removeItem('highContrast');
        localStorage.removeItem('appearanceSettings');

        applyAppearanceSettings();

        showNotification('Appearance settings reset to default', 'success');
        showAppearancePage(); // Refresh the page
    }
}
// ===== NOTIFICATIONS =====
function showNotificationSettingsPage() {
    localStorage.setItem("currentPage", "page_notification");

    const notificationSettings = JSON.parse(localStorage.getItem('notificationSettings')) || {
        dailyReminder: true,
        weeklyReport: true,
        moodAlerts: false,
        emailNotifications: true,
        pushNotifications: true,
        reminderTime: '20:00',
        reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    };

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container">
            <div class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji">🌸</span>
                    <h2>Notification Settings</h2>
                    <span class="deco-emoji">🔔</span>
                </div>
                <p>Control how and when you receive reminders</p>
            </div>
            
            <div class="settings-content">
                <div class="settings-section">
                    <h3><span class="section-icon">📧</span> Notification Types</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Daily Mood Reminders</h4>
                            <p>Get reminded to log your mood each day</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="dailyReminder" ${notificationSettings.dailyReminder ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Weekly Mood Reports</h4>
                            <p>Receive a summary of your mood patterns each week</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="weeklyReport" ${notificationSettings.weeklyReport ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Mood Alerts</h4>
                            <p>Get notified when your mood patterns change significantly</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="moodAlerts" ${notificationSettings.moodAlerts ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Email Notifications</h4>
                            <p>Receive reminders and reports via email</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="emailNotifications" ${notificationSettings.emailNotifications ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">📱</span> Push Notifications</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Enable Push Notifications</h4>
                            <p>Receive notifications even when the app is closed</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="pushNotifications" ${notificationSettings.pushNotifications ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">⏰</span> Schedule</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Reminder Time</h4>
                            <p>What time should we remind you to log your mood?</p>
                        </div>
                        <input type="time" id="reminderTime" value="${notificationSettings.reminderTime || '20:00'}" class="setting-input">
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Reminder Days</h4>
                            <p>Which days should we send you reminders?</p>
                        </div>
                        <div class="days-selector">
                            ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1, 3);
        const isChecked = notificationSettings.reminderDays && notificationSettings.reminderDays.includes(day);
        return `
                                    <label class="day-checkbox">
                                        <input type="checkbox" value="${day}" ${isChecked ? 'checked' : ''}>
                                        <span>${dayName}</span>
                                    </label>
                                `;
    }).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3><span class="section-icon">👁️</span> Notification Preview</h3>
                    <div class="notification-preview">
                        <div class="notification-item">
                            <div class="notification-icon">🌸</div>
                            <div class="notification-content">
                                <div class="notification-title">Daily Mood Reminder</div>
                                <div class="notification-message">How are you feeling today? Take a moment to log your mood.</div>
                                <div class="notification-time">${notificationSettings.reminderTime || '20:00'}</div>
                            </div>
                        </div>
                        
                        <div class="notification-item">
                            <div class="notification-icon">📊</div>
                            <div class="notification-content">
                                <div class="notification-title">Weekly Mood Report</div>
                                <div class="notification-message">Your mood has been mostly positive this week. Keep it up!</div>
                                <div class="notification-time">Sunday, 9:00 AM</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-actions">
                <button class="btn-primary" onclick="saveNotificationSettings()">
                    <span class="icon">💾</span> Save Changes
                </button>
                <button class="btn-secondary" onclick="testNotification()">
                    <span class="icon">🔔</span> Test Notification
                </button>
                <button class="btn-secondary" onclick="showHome()">
                    <span class="icon">✖</span> Cancel
                </button>
            </div>
        </div>
    `;

    // Add CSS for enhanced notification settings page
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        /* Main container with scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            padding: clamp(10px, 3vw, 25px) !important;
            scroll-behavior: smooth;
            display: flex !important;
            flex-direction: column !important;
        }
        
        /* Custom scrollbar */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            border: 2px solid transparent;
        }
        
        .settings-container {
            max-width: 800px;
            width: 100%;
            margin: 0 auto;
            padding: clamp(1rem, 5vw, 2.5rem) !important;
            position: relative;
            z-index: 1;
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: clamp(1rem, 4vw, 2.5rem) !important;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 0.5rem;
        }
        
        .deco-emoji {
            font-size: clamp(1.4rem, 6vw, 2.2rem) !important;
            animation: emojiBounce 3s ease-in-out infinite;
        }
        
        @keyframes emojiBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff !important;
            font-size: clamp(1.5rem, 7vw, 2.4rem) !important;
            font-weight: 700 !important;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.9) !important;
            font-size: clamp(0.9rem, 3vw, 1.15rem) !important;
            margin: 8px 0 0 0 !important;
        }
        
        .settings-content {
            display: flex !important;
            flex-direction: column !important;
            gap: clamp(1rem, 4vw, 2rem) !important;
        }
        
        .settings-section {
            background: rgba(255, 255, 255, 0.12) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border-radius: 24px !important;
            padding: clamp(1.2rem, 5vw, 2rem) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
        }
        
        .settings-section:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.4) !important;
            background: rgba(255, 255, 255, 0.15) !important;
        }
        
        .settings-section h3 {
            color: #ffffff !important;
            margin-bottom: 1.5rem !important;
            font-size: clamp(1.1rem, 4vw, 1.4rem) !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            font-weight: 600 !important;
        }
        
        .section-icon {
            font-size: 1.6rem;
        }
        
        .setting-item {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 1.2rem 0 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            gap: 20px !important;
        }
        
        .setting-item:last-child {
            border-bottom: none !important;
        }
        
        .setting-info {
            flex: 1 !important;
            min-width: 0 !important;
        }
        
        .setting-info h4 {
            margin: 0 0 8px 0 !important;
            color: #ffffff !important;
            font-size: clamp(1rem, 3vw, 1.1rem) !important;
            font-weight: 600 !important;
        }
        
        .setting-info p {
            margin: 0 !important;
            color: rgba(255, 255, 255, 0.8) !important;
            font-size: clamp(0.85rem, 2.5vw, 0.95rem) !important;
            line-height: 1.6 !important;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 58px;
            height: 32px;
            flex-shrink: 0;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.15);
            transition: 0.4s;
            border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 24px;
            width: 24px;
            left: 3px;
            bottom: 3px;
            background: white;
            transition: 0.4s;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        input:checked + .toggle-slider {
            background: var(--primary-color);
            border-color: var(--primary-color);
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(26px);
        }
        
        .setting-input {
            padding: 12px 16px !important;
            border: 2px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 12px !important;
            font-size: 1rem !important;
            background: rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            max-width: 160px !important;
            font-family: inherit !important;
        }
        
        .setting-input:focus {
            outline: none !important;
            border-color: var(--primary-color) !important;
            background: rgba(255, 255, 255, 0.2) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25) !important;
        }
        
        .days-selector {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)) !important;
            gap: 12px !important;
            width: 100% !important;
            margin-top: 15px !important;
        }
        
        .day-checkbox {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: 12px 8px !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 15px !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            cursor: pointer !important;
            user-select: none !important;
        }
        
        .day-checkbox span {
            font-size: 0.95rem !important;
            font-weight: 600 !important;
            color: rgba(255, 255, 255, 0.95) !important;
        }
        
        .day-checkbox input { display: none !important; }
        
        .day-checkbox:has(input:checked) {
            background: var(--primary-color) !important;
            border-color: rgba(255, 255, 255, 0.4) !important;
            transform: scale(1.05);
            box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4) !important;
        }
        
        .day-checkbox:hover:not(:has(input:checked)) {
            background: rgba(255, 255, 255, 0.2) !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
            transform: translateY(-2px);
        }
        
        .notification-preview {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
        }
        
        .notification-item {
            display: flex !important;
            align-items: flex-start !important;
            gap: clamp(12px, 4vw, 20px) !important;
            padding: clamp(14px, 4vw, 20px) !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 20px !important;
            border-left: 6px solid var(--primary-color) !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08) !important;
            transition: all 0.3s ease !important;
        }
        
        .notification-item:hover {
            transform: translateX(5px);
            background: rgba(255, 255, 255, 0.15) !important;
        }
        
        .notification-icon {
            font-size: clamp(1.8rem, 5vw, 2.2rem) !important;
            flex-shrink: 0 !important;
            margin-top: 2px !important;
        }
        
        .notification-content {
            flex: 1 !important;
            min-width: 0 !important;
        }
        
        .notification-title {
            font-weight: 700 !important;
            font-size: clamp(1rem, 3vw, 1.15rem) !important;
            color: #ffffff !important;
            margin-bottom: 6px !important;
        }
        
        .notification-message {
            font-size: clamp(0.85rem, 2.5vw, 0.95rem) !important;
            color: rgba(255, 255, 255, 0.85) !important;
            line-height: 1.6 !important;
            white-space: normal !important;
        }
        
        .notification-time {
            font-size: 0.85rem !important;
            color: var(--primary-color) !important;
            font-weight: 700 !important;
            margin-top: 8px !important;
            display: inline-block !important;
            padding: 4px 10px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
        }
        
        .settings-actions {
            display: flex !important;
            justify-content: center !important;
            gap: clamp(10px, 3vw, 20px) !important;
            margin-top: clamp(1.5rem, 6vw, 3rem) !important;
            flex-wrap: wrap !important;
            padding-bottom: 2.5rem !important;
        }
        
        .settings-actions button {
            padding: clamp(12px, 3vw, 16px) clamp(20px, 5vw, 35px) !important;
            border: none !important;
            border-radius: 15px !important;
            font-weight: 700 !important;
            font-size: 1.05rem !important;
            cursor: pointer !important;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 12px !important;
            flex: 1 !important;
            min-width: 200px !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
        }
        
        .btn-primary {
            background: #ffffff !important;
            color: var(--primary-color) !important;
        }
        
        .btn-primary:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 12px 30px rgba(255, 255, 255, 0.25) !important;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.15) !important;
            color: white !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.25) !important;
            transform: translateY(-3px);
            border-color: rgba(255, 255, 255, 0.4) !important;
        }
        
        /* MEDIA QUERIES */
        @media (max-width: 768px) {
            .settings-container {
                padding: 1.5rem 1rem !important;
            }
            .days-selector {
                grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)) !important;
                gap: 10px !important;
            }
            .day-checkbox {
                padding: 10px 5px !important;
            }
        }
        
        @media (max-width: 600px) {
            .setting-item {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 15px !important;
            }
            
            .setting-item > *:last-child {
                align-self: flex-start !important;
            }
            
            .setting-input {
                max-width: 100% !important;
                width: 100% !important;
            }

            .notification-item {
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                gap: 15px !important;
            }

            .notification-time {
                align-self: center !important;
            }
        }

        @media (max-width: 480px) {
            .days-selector {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            
            .day-checkbox {
                flex-direction: row !important;
                justify-content: center !important;
                gap: 10px !important;
                padding: 15px !important;
            }
            
            .settings-actions {
                flex-direction: column !important;
            }
            
            .settings-actions button {
                width: 100% !important;
                flex: none !important;
            }
        }

        @media (max-width: 360px) {
            .days-selector {
                grid-template-columns: 1fr !important;
            }
            .settings-header h2 {
                font-size: 1.4rem !important;
            }
        }
    `;

    if (!document.querySelector('style[data-notification-settings]')) {
        notificationStyles.setAttribute('data-notification-settings', 'true');
        document.head.appendChild(notificationStyles);
    }
}
function saveNotificationSettings() {
    const reminderDays = [];
    document.querySelectorAll('.day-checkbox input:checked').forEach(checkbox => {
        reminderDays.push(checkbox.value);
    });

    const settings = {
        dailyReminder: document.getElementById('dailyReminder').checked,
        weeklyReport: document.getElementById('weeklyReport').checked,
        moodAlerts: document.getElementById('moodAlerts').checked,
        emailNotifications: document.getElementById('emailNotifications').checked,
        pushNotifications: document.getElementById('pushNotifications').checked,
        reminderTime: document.getElementById('reminderTime').value,
        reminderDays: reminderDays,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('notificationSettings', JSON.stringify(settings));

    if (settings.pushNotifications && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('Push notifications enabled!', 'success');
            }
        });
    }

    showNotification('Notification preferences saved!', 'success');
    showHome();
}
function testNotification() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Mood Garden Test', {
                    body: 'This is a test notification from Mood Garden',
                    icon: '/favicon.ico'
                });
                showNotification('Test notification sent!', 'success');
            } else {
                showNotification('Please enable notifications in your browser settings', 'error');
            }
        });
    } else {
        showNotification('Your browser does not support notifications', 'error');
    }
}
// ===== GENERAL SETTINGS =====
function showGeneralSettingsPage() {
    localStorage.setItem("currentPage", "page_settings");

    const generalSettings = JSON.parse(localStorage.getItem('generalSettings')) || {
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/DD/YYYY',
        autoSave: true,
        soundEffects: true,
        hapticFeedback: true,
        dataSync: true
    };

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container general-settings-page" role="main" aria-label="General Settings">
            <header class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji" role="img" aria-label="Settings">⚙️</span>
                    <h2>General Settings</h2>
                    <span class="deco-emoji" role="img" aria-label="Configuration">🔧</span>
                </div>
                <p>Configure app-wide settings and preferences</p>
            </header>
            
            <div class="settings-content">
                <section class="settings-section" aria-labelledby="regional-heading">
                    <h3 id="regional-heading"><span class="section-icon" role="img" aria-label="Regional">🌍</span> Regional Settings</h3>
                    <div class="form-group">
                        <label for="language">Language</label>
                        <select id="language" class="setting-select" aria-label="Select language">
                            <option value="en" ${generalSettings.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="es" ${generalSettings.language === 'es' ? 'selected' : ''}>Spanish</option>
                            <option value="fr" ${generalSettings.language === 'fr' ? 'selected' : ''}>French</option>
                            <option value="de" ${generalSettings.language === 'de' ? 'selected' : ''}>German</option>
                            <option value="zh" ${generalSettings.language === 'zh' ? 'selected' : ''}>Chinese</option>
                            <option value="ja" ${generalSettings.language === 'ja' ? 'selected' : ''}>Japanese</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="timezone">Time Zone</label>
                        <select id="timezone" class="setting-select" aria-label="Select timezone">
                            <option value="UTC" ${generalSettings.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
                            <option value="America/New_York" ${generalSettings.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time (ET)</option>
                            <option value="America/Chicago" ${generalSettings.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time (CT)</option>
                            <option value="America/Denver" ${generalSettings.timezone === 'America/Denver' ? 'selected' : ''}>Mountain Time (MT)</option>
                            <option value="America/Los_Angeles" ${generalSettings.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time (PT)</option>
                            <option value="Europe/London" ${generalSettings.timezone === 'Europe/London' ? 'selected' : ''}>London (GMT/BST)</option>
                            <option value="Europe/Paris" ${generalSettings.timezone === 'Europe/Paris' ? 'selected' : ''}>Paris (CET/CEST)</option>
                            <option value="Asia/Tokyo" ${generalSettings.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Tokyo (JST)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="dateFormat">Date Format</label>
                        <select id="dateFormat" class="setting-select" aria-label="Select date format">
                            <option value="MM/DD/YYYY" ${generalSettings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY" ${generalSettings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD" ${generalSettings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                            <option value="DD.MM.YYYY" ${generalSettings.dateFormat === 'DD.MM.YYYY' ? 'selected' : ''}>DD.MM.YYYY</option>
                        </select>
                    </div>
                </section>
                
                <section class="settings-section" aria-labelledby="behavior-heading">
                    <h3 id="behavior-heading"><span class="section-icon" role="img" aria-label="Behavior">🎯</span> App Behavior</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Auto-Save</h4>
                            <p>Automatically save your mood entries as you type</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="autoSave" ${generalSettings.autoSave ? 'checked' : ''} aria-label="Toggle auto-save">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Sound Effects</h4>
                            <p>Play sounds when interacting with the app</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="soundEffects" ${generalSettings.soundEffects ? 'checked' : ''} aria-label="Toggle sound effects">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Haptic Feedback</h4>
                            <p>Use vibration for tactile feedback on supported devices</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="hapticFeedback" ${generalSettings.hapticFeedback ? 'checked' : ''} aria-label="Toggle haptic feedback">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Data Sync</h4>
                            <p>Sync your data across devices</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="dataSync" ${generalSettings.dataSync ? 'checked' : ''} aria-label="Toggle data sync">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </section>
                
                <section class="settings-section" aria-labelledby="storage-heading">
                    <h3 id="storage-heading"><span class="section-icon" role="img" aria-label="Storage">💾</span> Storage</h3>
                    <div class="storage-info">
                        <div class="storage-bar-container">
                            <div class="storage-bar">
                                <div class="storage-used" style="width: 35%"></div>
                            </div>
                            <div class="storage-percentage">35%</div>
                        </div>
                        <div class="storage-details">
                            <span>3.5 MB used of 10 MB</span>
                            <button class="btn-text" onclick="clearCache()" aria-label="Clear cache">Clear Cache</button>
                        </div>
                        <div class="storage-breakdown">
                            <div class="storage-item">
                                <span class="storage-label">Mood Entries</span>
                                <span class="storage-size">2.1 MB</span>
                            </div>
                            <div class="storage-item">
                                <span class="storage-label">Images</span>
                                <span class="storage-size">1.2 MB</span>
                            </div>
                            <div class="storage-item">
                                <span class="storage-label">Cache</span>
                                <span class="storage-size">0.2 MB</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            
            <footer class="settings-actions">
                <button class="btn-primary" onclick="saveGeneralSettings()" aria-label="Save settings">
                    <span class="icon" aria-hidden="true">💾</span> Save Changes
                </button>
                <button class="btn-secondary" onclick="showHome()" aria-label="Cancel and return to home">
                    <span class="icon" aria-hidden="true">✖</span> Cancel
                </button>
            </footer>
            
            <button id="back-to-top" class="back-to-top" aria-label="Back to top" onclick="scrollToTop()">
                <span aria-hidden="true">↑</span>
            </button>
        </div>
    `;

    // Add CSS for enhanced general settings page with NOTIFICATION PAGE PURPLE theme
    const settingsStyles = document.createElement('style');
    settingsStyles.textContent = `
        /* Main container with scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        }
        
        /* Simple scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--bg-section);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            opacity: 0.7;
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            opacity: 1;
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) var(--bg-section);
        }
        
        .settings-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: transparent;
            border-radius: 20px;
            box-shadow: none;
            position: relative;
            overflow: visible;
            border: 1px solid var(--border-main);
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
            opacity: 0.05;
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .settings-section {
            padding: 25px;
            background: var(--bg-section);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-main);
            position: relative;
        }
        
        .settings-section h3 {
            color: #ffffff;
            margin-bottom: 20px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
            font-size: 1rem;
        }
        
        .setting-select {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--border-main);
            border-radius: 12px;
            font-size: 1rem;
            background: transparent;
            color: #ffffff;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .setting-select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: none;
        }
        
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: transparent;
            border-radius: 12px;
            margin-bottom: 15px;
            border: 1px solid var(--border-main);
            transition: all 0.3s ease;
        }
        
        .setting-item:hover {
            transform: translateY(-2px);
            box-shadow: none;
        }
        
        .setting-info h4 {
            margin: 0 0 5px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .setting-info p {
            margin: 0;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--bg-section);
            border: 1px solid var(--border-main);
            transition: 0.4s;
            border-radius: 30px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 3px;
            background-color: var(--text-secondary);
            transition: 0.4s;
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(30px);
            background-color: var(--text-on-primary);
        }
        
        .storage-info {
            padding: 20px;
            background: transparent;
            border-radius: 12px;
            border: 1px solid var(--border-main);
        }
        
        .storage-bar-container {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .storage-bar {
            flex: 1;
            height: 12px;
            background: var(--bg-section);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .storage-used {
            height: 100%;
            background: var(--primary-color);
            border-radius: 10px;
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .storage-percentage {
            font-weight: 700;
            color: var(--primary-color);
            font-size: 1.1rem;
            min-width: 50px;
        }
        
        .storage-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .btn-text {
            background: none;
            border: none;
            color: var(--primary-color);
            cursor: pointer;
            font-weight: 600;
            padding: 5px 10px;
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .btn-text:hover {
            background: var(--bg-section);
        }
        
        .storage-breakdown {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .storage-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: var(--bg-section);
            border-radius: 8px;
        }
        
        .storage-label {
            color: #ffffff;
            font-weight: 500;
        }
        
        .storage-size {
            color: rgba(255, 255, 255, 0.8);
            font-weight: 600;
        }

            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
            background: transparent;
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: none;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            margin-bottom: 0;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .settings-section {
            background: transparent;
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: none;
            transition: transform 0.3s ease;
        }
        
        .settings-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4);
        }
        
        .settings-section h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        /* Form Styles */
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .form-group label {
            font-weight: 600;
            color: #ffffff;
            font-size: 1rem;
        }
        
        .setting-select {
            padding: 14px;
            border: 2px solid transparent;
            border-radius: 12px;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.1) padding-box,
                        linear-gradient(135deg, #9b59b6, #8e44ad) border-box;
            transition: all 0.3s ease;
            width: 100%;
            box-sizing: border-box;
            font-family: inherit;
            cursor: pointer;
        }
        
        .setting-select:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.1) padding-box,
                        linear-gradient(135deg, #9b59b6, #8e44ad, #6c3483) border-box;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.2);
        }
        
        /* Setting Item Styles */
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .setting-item:last-child {
            border-bottom: none;
        }
        
        .setting-info {
            flex: 1;
        }
        
        .setting-info h4 {
            margin: 0 0 5px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .setting-info p {
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        /* Toggle Switch Styles */
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            transition: 0.4s;
            border-radius: 30px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background: rgba(255, 255, 255, 0.9);
            transition: 0.4s;
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background: linear-gradient(135deg, #ff6b6b, #feca57);
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(30px);
        }
        
        /* Storage Styles */
        .storage-info {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .storage-bar-container {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .storage-bar {
            flex: 1;
            height: 20px;
            background: rgba(139, 92, 246, 0.5);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }
        
        .storage-used {
            height: 100%;
            background: linear-gradient(90deg, #9b59b6, #8e44ad);
            border-radius: 10px;
            transition: width 0.5s ease;
        }
        
        .storage-percentage {
            font-weight: 600;
            color: #ffffff;
            font-size: 1.1rem;
            min-width: 40px;
            text-align: right;
        }
        
        .storage-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .storage-details span {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        .btn-text {
            background: none;
            border: none;
            color: #9b59b6;
            font-weight: 600;
            cursor: pointer;
            padding: 5px 0;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: underline;
        }
        
        .btn-text:hover {
            color: #8e44ad;
            transform: translateY(-2px);
        }
        
        .storage-breakdown {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 10px;
            padding: 15px;
            background: rgba(139, 92, 246, 0.5);
            border-radius: 12px;
        }
        
        .storage-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .storage-label {
            color: #ffffff;
            font-weight: 500;
        }
        
        .storage-size {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        /* Button Styles */
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn-primary,
        .btn-secondary {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #dfe6e9, #b2bec3);
            color: #2c3e50;
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(178, 190, 195, 0.3);
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            border: none;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .back-to-top:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
        }
        
        @media (max-width: 768px) {
            .settings-container {
                margin: 10px;
                padding: 15px;
            }
            
            .header-decoration {
                flex-direction: column;
                gap: 5px;
            }
            
            .settings-header h2 {
                font-size: 1.8rem;
            }
            
            .setting-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .toggle-switch {
                margin-top: 5px;
            }
            
            #maincard {
                height: 100%;
            }
        }
    `;

    if (!document.querySelector('style[data-general-settings]')) {
        settingsStyles.setAttribute('data-general-settings', 'true');
        document.head.appendChild(settingsStyles);
    }

    // Initialize back-to-top button visibility
    initializeBackToTopButton();

    // Add smooth scroll behavior for internal links
    initializeSmoothScrolling();
}
// ===== DESIGN SYSTEM =====
// Global design system for consistent Mood Garden theme
const GardenDesignSystem = {
    // Color palette inspired by nature and gardens
    colors: {
        primary: {
            50: '#ff6b6b',      // Coral red
            100: '#feca57',     // Warm yellow
            gradient: 'linear-gradient(135deg, #ff6b6b, #feca57)'
        },
        secondary: {
            50: '#a29bfe',     // Periwinkle
            100: '#6c5ce7',     // Lavender
            gradient: 'linear-gradient(135deg, #a29bfe, #6c5ce7)'
        },
        accent: {
            50: '#fd79a8',     // Orange
            100: '#48dbfb',     // Sky blue
            gradient: 'linear-gradient(135deg, #fd79a8, #48dbfb)'
        },
        background: {
            light: '#ffecd2',    // Light peach
            dark: '#1f2937',     // Dark blue
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        },
        surface: {
            card: 'rgba(255, 255, 255, 0.9)',  // Semi-transparent white
            overlay: 'rgba(255, 255, 255, 0.7)'  // More transparent white
        },
        text: {
            primary: '#2c3e50',     // Dark blue-gray
            secondary: '#5a6c7d',   // Medium gray
            muted: '#95a5a6',     // Light gray
            inverse: '#ffffff'      // White
        },
        status: {
            success: '#2ecc71',   // Emerald green
            warning: '#f39c12',   // Orange
            error: '#e74c3c',     // Red
            info: '#3498db'      // Blue
        },
        nature: {
            flowers: ['#ff6b6b', '#feca57', '#fd79a8', '#a29bfe'],  // Red to purple
            leaves: ['#27ae60', '#2ecc71', '#3498db', '#9b59b6'],    // Green to blue
            sky: ['#87ceeb', '#f39c12', '#e67e22', '#e74c3c'],     // Sky colors
            earth: ['#8b5cf6', '#d4ac0d', '#e67e22', '#f39c12'],   // Brown tones
        }
    },

    // Typography system
    typography: {
        fontFamily: {
            primary: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
            display: "'Comic Sans MS', 'Arial', sans-serif"
        },
        fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            xxl: '24px'
        },
        fontWeight: {
            light: '300',
            normal: '400',
            medium: '600',
            bold: '700'
        },
        lineHeight: {
            tight: '1.2',
            normal: '1.5',
            relaxed: '1.6'
        }
    },

    // Spacing system
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px'
    },

    // Border radius system
    borderRadius: {
        none: '0',
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        pill: '25px',
        full: '30px'
    },

    // Shadow system
    shadows: {
        sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
        md: '0 4px 12px rgba(0, 0, 0, 0.15)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.2)',
        xl: '0 12px 32px rgba(0, 0, 0, 0.25)',
        colored: '0 8px 24px rgba(255, 107, 107, 0.3)'
    },

    // Animation system
    animations: {
        duration: {
            fast: '0.2s',
            normal: '0.3s',
            slow: '0.5s'
        },
        easing: {
            ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)'
        },
        transitions: {
            transform: 'transform 0.3s ease',
            opacity: 'opacity 0.3s ease',
            colors: 'all 0.3s ease'
        }
    },

    // Breakpoints for responsive design
    breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1200px'
    }
};
// ===== GLOBAL STYLES =====
function addGlobalStyles() {
    const globalStyles = document.createElement('style');
    globalStyles.textContent = `
        /* CSS Variables for theme consistency */
        :root {
            --primary-50: ${GardenDesignSystem.colors.primary[50]};
            --primary-100: ${GardenDesignSystem.colors.primary[100]};
            --primary-gradient: ${GardenDesignSystem.colors.primary.gradient};
            
            --secondary-50: ${GardenDesignSystem.colors.secondary[50]};
            --secondary-100: ${GardenDesignSystem.colors.secondary[100]};
            --secondary-gradient: ${GardenDesignSystem.colors.secondary.gradient};
            
            --accent-50: ${GardenDesignSystem.colors.accent[50]};
            --accent-100: ${GardenDesignSystem.colors.accent[100]};
            --accent-gradient: ${GardenDesignSystem.colors.accent.gradient};
            
            --background-light: ${GardenDesignSystem.colors.background.light};
            --background-dark: ${GardenDesignSystem.colors.background.dark};
            --background-gradient: ${GardenDesignSystem.colors.background.gradient};
            
            --surface: ${GardenDesignSystem.colors.surface.card};
            --surface-overlay: ${GardenDesignSystem.colors.surface.overlay};
            
            --text-primary: ${GardenDesignSystem.colors.text.primary};
            --text-secondary: ${GardenDesignSystem.colors.text.secondary};
            --text-muted: ${GardenDesignSystem.colors.text.muted};
            --text-inverse: ${GardenDesignSystem.colors.text.inverse};
            
            --success: ${GardenDesignSystem.colors.status.success};
            --warning: ${GardenDesignSystem.colors.status.warning};
            --error: ${GardenDesignSystem.colors.status.error};
            --info: ${GardenDesignSystem.colors.status.info};
            
            --border-radius-sm: ${GardenDesignSystem.borderRadius.sm};
            --border-radius-md: ${GardenDesignSystem.borderRadius.md};
            --border-radius-lg: ${GardenDesignSystem.borderRadius.lg};
            --border-radius-xl: ${GardenDesignSystem.borderRadius.xl};
            --border-radius-full: ${GardenDesignSystem.borderRadius.full};
            
            --shadow-sm: ${GardenDesignSystem.shadows.sm};
            --shadow-md: ${GardenDesignSystem.shadows.md};
            --shadow-lg: ${GardenDesignSystem.shadows.lg};
            --shadow-xl: ${GardenDesignSystem.shadows.xl};
            --shadow-colored: ${GardenDesignSystem.shadows.colored};
            
            --spacing-xs: ${GardenDesignSystem.spacing.xs};
            --spacing-sm: ${GardenDesignSystem.spacing.sm};
            --spacing-md: ${GardenDesignSystem.spacing.md};
            --spacing-lg: ${GardenDesignSystem.spacing.lg};
            --spacing-xl: ${GardenDesignSystem.spacing.xl};
            --spacing-xxl: ${GardenDesignSystem.spacing.xxl};
            
            --font-size-xs: ${GardenDesignSystem.typography.fontSize.xs};
            --font-size-sm: ${GardenDesignSystem.typography.fontSize.sm};
            --font-size-base: ${GardenDesignSystem.typography.fontSize.base};
            --font-size-lg: ${GardenDesignSystem.typography.fontSize.lg};
            --font-size-xl: ${GardenDesignSystem.typography.fontSize.xl};
            
            --transition-fast: ${GardenDesignSystem.animations.duration.fast};
            --transition-normal: ${GardenDesignSystem.animations.duration.normal};
            --transition-slow: ${GardenDesignSystem.animations.duration.slow};
            
            --ease: ${GardenDesignSystem.animations.easing.ease};
            --ease-out: ${GardenDesignSystem.animations.easing.easeOut};
        }
        
        /* Base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-family-primary);
            font-size: var(--font-size-base);
            line-height: var(--line-height-normal);
            color: var(--text-primary);
            background: var(--background-gradient);
            min-height: 100vh;
            transition: var(--transition-normal), var(--transition-colors);
        }
        
        /* Main container */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: var(--spacing-md);
            border-radius: var(--border-radius-lg);
            background: var(--surface);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: var(--transition-transform);
        }
        
        /* Scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--text-muted);
            border-radius: var(--border-radius-sm);
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-gradient);
            border-radius: var(--border-radius-sm);
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            background: var(--accent-gradient);
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-50) var(--text-muted);
        }
        
        /* Settings container */
        .settings-container {
            max-width: 900px;
            margin: 0 auto;
            padding: var(--spacing-xl);
            background: var(--background-gradient);
            border-radius: var(--border-radius-xl);
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: visible;
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255, 182, 193, 0.1) 0%, transparent 70%);
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        /* Header styles */
        .settings-header {
            text-align: center;
            margin-bottom: var(--spacing-lg);
            position: relative;
            z-index: 1;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-sm);
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        .settings-header h2 {
            margin: 0;
            color: var(--text-primary);
            font-size: 2.2rem;
            font-weight: var(--font-weight-bold);
            text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
            margin-bottom: 0;
        }
        
        /* Content sections */
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            position: relative;
            z-index: 1;
        }
        
        .settings-section {
            background: var(--surface);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: var(--transition-transform);
        }
        
        .settings-section:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
        }
        
        .settings-section h3 {
            color: var(--text-primary);
            font-size: 1.3rem;
            margin-bottom: var(--spacing-md);
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: var(--spacing-sm);
        }
        
        /* Card styles */
        .stat-card, .summary-card, .export-option, .theme-option, .font-size-option {
            background: var(--surface);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-lg);
            text-align: center;
            transition: var(--transition-transform);
        }
        
        .stat-card:hover, .summary-card:hover, .export-option:hover, .theme-option:hover, .font-size-option:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-md);
        }
        
        .stat-icon, .export-icon, .theme-preview, .font-preview {
            font-size: 2.5rem;
            margin-bottom: var(--spacing-sm);
        }
        
        .stat-value, .summary-value {
            font-size: 2rem;
            font-weight: var(--font-weight-bold);
            color: var(--text-primary);
            margin-bottom: var(--spacing-xs);
        }
        
        .stat-label, .summary-label {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1rem;
            font-weight: var(--font-weight-medium);
        }
        
        /* Form controls */
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-md) 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: var(--transition-normal);
        }
        
        .setting-item:last-child {
            border-bottom: none;
        }
        
        .setting-info {
            flex: 1;
        }
        
        .setting-info h4 {
            margin: 0 0 var(--spacing-xs) 0;
            color: var(--text-primary);
            font-size: 1.1rem;
            font-weight: var(--font-weight-medium);
        }
        
        .setting-info p {
            margin: 0;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }
        
        /* Toggle switches */
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
            cursor: pointer;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--secondary-gradient);
            transition: var(--transition-fast);
            border-radius: 30px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background: var(--text-inverse);
            transition: var(--transition-fast);
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background: var(--primary-gradient);
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(30px);
        }
        
        /* Input styles */
        .setting-input, .search-input {
            padding: var(--spacing-md) var(--spacing-sm);
            border: 2px solid transparent;
            border-radius: var(--border-radius-md);
            font-size: var(--font-size-base);
            background: var(--text-inverse) var(--text-inverse) padding-box,
                        var(--primary-gradient) border-box;
            transition: var(--transition-normal);
            width: 100%;
            box-sizing: border-box;
        }
        
        .setting-input:focus, .search-input:focus {
            outline: none;
            background: var(--text-inverse) var(--text-inverse) padding-box,
                        var(--primary-gradient) border-box;
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        
        /* Button styles */
        .btn-primary, .btn-secondary, .btn-danger {
            padding: var(--spacing-md) var(--spacing-lg);
            border: none;
            border-radius: var(--border-radius-md);
            font-weight: var(--font-weight-medium);
            cursor: pointer;
            transition: var(--transition-transform);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            font-size: var(--font-size-base);
            font-family: var(--font-family-primary);
        }
        
        .btn-primary {
            background: var(--primary-gradient);
            color: var(--text-inverse);
            box-shadow: var(--shadow-colored);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .btn-secondary {
            background: var(--secondary-gradient);
            color: var(--text-primary);
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, var(--error), #c0392b);
            color: var(--text-inverse);
        }
        
        .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        
        .icon {
            font-size: var(--font-size-lg);
        }
        
        /* Specialized components */
        .notification-preview {
            background: var(--surface);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .notification-item {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-md);
            padding: var(--spacing-md);
            background: var(--surface-overlay);
            border-radius: var(--border-radius-md);
            transition: var(--transition-transform);
        }
        
        .notification-item:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-sm);
        }
        
        .notification-icon {
            font-size: 2rem;
            background: var(--primary-gradient);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-inverse);
            flex-shrink: 0;
        }
        
        .notification-content {
            flex: 1;
        }
        
        .notification-title {
            font-size: 1.2rem;
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
            margin-bottom: var(--spacing-xs);
        }
        
        .notification-message {
            color: rgba(255, 255, 255, 0.8);
            font-size: var(--font-size-base);
            margin-bottom: var(--spacing-xs);
        }
        
        .notification-time {
            font-size: 0.9rem;
            color: var(--text-muted);
            background: var(--surface-overlay);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--border-radius-sm);
            align-self: flex-start;
        }
        
        /* FAQ styles */
        .faq-list, .guide-topics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: var(--spacing-md);
        }
        
        .faq-item {
            background: var(--surface);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-lg);
            transition: var(--transition-transform);
            cursor: pointer;
        }
        
        .faq-item:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-sm);
        }
        
        .faq-item summary {
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
            font-size: 1.1rem;
            padding-bottom: var(--spacing-sm);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
        }
        
        .faq-item summary::before {
            content: '+';
            display: inline-block;
            width: 20px;
            height: 20px;
            background: var(--primary-gradient);
            color: var(--text-inverse);
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            transition: var(--transition-fast);
        }
        
        .faq-item[open] summary::before {
            transform: rotate(45deg);
        }
        
        .faq-content {
            color: rgba(255, 255, 255, 0.8);
            font-size: var(--font-size-base);
            line-height: var(--line-height-relaxed);
        }
        
        .faq-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: var(--border-radius-md);
            margin-top: var(--spacing-sm);
        }
        
        /* Support options */
        .support-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-md);
        }
        
        .support-option {
            background: var(--surface);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-lg);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            transition: var(--transition-transform);
            cursor: pointer;
        }
        
        .support-option:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-md);
        }
        
        .support-icon {
            font-size: 2rem;
            background: var(--primary-gradient);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-inverse);
            margin-bottom: var(--spacing-sm);
        }
        
        .support-status {
            font-size: 0.8rem;
            font-weight: var(--font-weight-medium);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--border-radius-sm);
            margin-top: var(--spacing-xs);
        }
        
        .support-status.online {
            background: var(--success);
            color: var(--text-inverse);
        }
        
        .support-status:not(.online) {
            background: var(--warning);
            color: var(--text-inverse);
        }
        
        /* Actions */
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: var(--spacing-md);
            margin-top: var(--spacing-xl);
        }
        
        /* Utility classes */
        .hidden {
            display: none !important;
        }
        
        .text-center {
            text-align: center;
        }
        
        /* Responsive design */
        @media (max-width: ${GardenDesignSystem.breakpoints.mobile}) {
            .settings-container {
                margin: var(--spacing-sm);
                padding: var(--spacing-md);
            }
            
            .header-decoration {
                flex-direction: column;
                gap: var(--spacing-xs);
            }
            
            .settings-header h2 {
                font-size: 1.8rem;
            }
            
            .faq-list, .guide-topics {
                grid-template-columns: 1fr;
            }
            
            .support-options {
                grid-template-columns: 1fr;
            }
            
            #maincard {
                height: 100%;
            }
        }
        
        @media (max-width: ${GardenDesignSystem.breakpoints.tablet}) {
            .faq-list, .guide-topics {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .support-options {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;

    if (!document.querySelector('style[data-garden-design-system]')) {
        globalStyles.setAttribute('data-garden-design-system', 'true');
        document.head.appendChild(globalStyles);
    }
}
// ===== COMPONENT HELPERS =====
// Helper functions to use the design system consistently
function createCard(className = '', additionalStyles = '') {
    return `
        <div class="card ${className}" style="
            background: var(--surface);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            box-shadow: var(--shadow-md);
            transition: var(--transition-transform);
            ${additionalStyles}
        ">
    `;
}
function createButton(text, variant = 'primary', onClick = null, icon = '', additionalStyles = '') {
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger'
    };

    return `
        <button class="${variantClasses[variant]}" onclick="${onClick}" style="
            ${additionalStyles}
        ">
            ${icon ? `<span class="icon">${icon}</span>` : ''}
            ${text}
        </button>
    `;
}
function createInput(placeholder = '', type = 'text', additionalStyles = '') {
    return `
        <input type="${type}" placeholder="${placeholder}" style="
            background: var(--text-inverse) var(--text-inverse) padding-box,
                        var(--primary-gradient) border-box;
            border: 2px solid transparent;
            border-radius: var(--border-radius-md);
            padding: var(--spacing-md) var(--spacing-sm);
            font-size: var(--font-size-base);
            transition: var(--transition-normal);
            width: 100%;
            box-sizing: border-box;
            ${additionalStyles}
        ">
    `;
}
function createToggle(id, checked = false, onChange = null) {
    return `
        <label class="toggle-switch" style="cursor: pointer;">
            <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} onchange="${onChange}" style="
                opacity: 0;
                width: 0;
                height: 0;
            ">
            <span class="toggle-slider" style="
                background: var(--secondary-gradient);
                transition: var(--transition-fast);
                border-radius: 30px;
            "></span>
        </label>
    `;
}
function createIcon(emoji, size = '1.5rem', additionalStyles = '') {
    return `
        <span class="icon" style="
            font-size: ${size};
            ${additionalStyles}
        ">${emoji}</span>
    `;
}
function createSection(title, icon = null, additionalStyles = '') {
    return `
        <div class="settings-section" style="${additionalStyles}">
            <h3 style="
                color: var(--text-primary);
                font-size: 1.3rem;
                margin-bottom: var(--spacing-md);
                display: flex;
                align-items: center;
            ">
                ${icon ? `<span class="section-icon" style="margin-right: var(--spacing-sm);">${icon}</span>` : ''}
                ${title}
            </h3>
        </div>
    `;
}
// ===== INITIALIZATION =====
// Initialize the design system when the app loads
document.addEventListener('DOMContentLoaded', () => {
    addGlobalStyles();
});

// ===== HELP AND SUPPORT =====
function showHelpSupportPage() {
    localStorage.setItem("currentPage", "page_support");

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container help-support-page" role="main" aria-label="Help and Support">
            <header class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji" role="img" aria-label="Help">🆘</span>
                    <h2>Help & Support</h2>
                    <span class="deco-emoji" role="img" aria-label="Support">💬</span>
                </div>
                <p>We're here to help with any questions or issues</p>
            </header>
            
            <div class="settings-content">
                <section class="settings-section" aria-labelledby="faq-heading">
                    <h3 id="faq-heading"><span class="section-icon" role="img" aria-label="FAQ">❓</span> Frequently Asked Questions</h3>
                    <div class="faq-container" style="display: flex; flex-direction: column; gap: 15px;">
                        <div class="setting-item faq-item-flat" style="border: none; padding: 0;">
                            <div style="margin-bottom: 8px; font-weight: 600; color: #fff;">How do I track my daily mood?</div>
                            <button class="faq-question faq-input-like" onclick="toggleFAQ(this)" aria-expanded="false">
                                <span>Tap to view answer</span>
                                <span class="faq-icon">+</span>
                            </button>
                            <div class="faq-answer">
                                <p>To track your daily mood, simply go to the home screen and tap on the emoji that best represents how you're feeling. You can add notes about your day, tag activities, and set reminders for future mood check-ins.</p>
                            </div>
                        </div>
                        
                        <div class="setting-item faq-item-flat" style="border: none; padding: 0;">
                             <div style="margin-bottom: 8px; font-weight: 600; color: #fff;">Is my data private and secure?</div>
                            <button class="faq-question faq-input-like" onclick="toggleFAQ(this)" aria-expanded="false">
                                <span>Tap to view answer</span>
                                <span class="faq-icon">+</span>
                            </button>
                            <div class="faq-answer">
                                <p>Yes! All your mood data is encrypted and stored locally on your device. We never share your personal information with third parties without your explicit consent. You can review our Privacy Policy for more details.</p>
                            </div>
                        </div>
                        
                        <div class="setting-item faq-item-flat" style="border: none; padding: 0;">
                             <div style="margin-bottom: 8px; font-weight: 600; color: #fff;">Can I export my mood data?</div>
                            <button class="faq-question faq-input-like" onclick="toggleFAQ(this)" aria-expanded="false">
                                <span>Tap to view answer</span>
                                <span class="faq-icon">+</span>
                            </button>
                            <div class="faq-answer">
                                <p>Absolutely! You can export all your mood data at any time from the Privacy & Security settings. We provide your data in CSV format, which you can open in spreadsheet applications or import into other mood tracking tools.</p>
                            </div>
                        </div>
                        
                        <div class="setting-item faq-item-flat" style="border: none; padding: 0;">
                             <div style="margin-bottom: 8px; font-weight: 600; color: #fff;">How do mood insights work?</div>
                            <button class="faq-question faq-input-like" onclick="toggleFAQ(this)" aria-expanded="false">
                                <span>Tap to view answer</span>
                                <span class="faq-icon">+</span>
                            </button>
                            <div class="faq-answer">
                                <p>Our mood insights analyze patterns in your emotional states over time. We look for correlations between your moods, activities, and time of day to provide personalized recommendations for improving your emotional well-being.</p>
                            </div>
                        </div>
                        
                        <div class="setting-item faq-item-flat" style="border: none; padding: 0;">
                             <div style="margin-bottom: 8px; font-weight: 600; color: #fff;">Can I set reminders for mood check-ins?</div>
                            <button class="faq-question faq-input-like" onclick="toggleFAQ(this)" aria-expanded="false">
                                <span>Tap to view answer</span>
                                <span class="faq-icon">+</span>
                            </button>
                            <div class="faq-answer">
                                <p>Yes! Go to Settings > Notifications to customize when you receive mood check-in reminders. You can set multiple reminders throughout the day and choose which days of the week to receive them.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section class="settings-section" aria-labelledby="contact-heading">
                    <h3 id="contact-heading"><span class="section-icon" role="img" aria-label="Contact">📧</span> Contact Us</h3>
                    <div class="contact-options">
                        <div class="contact-option">
                            <div class="contact-icon" role="img" aria-label="Email">📧</div>
                            <h4>Email Support</h4>
                            <p>support@moodgarden.app</p>
                            <p>We typically respond within 24 hours</p>
                        </div>
                        
                        <div class="contact-option">
                            <div class="contact-icon" role="img" aria-label="Chat">💬</div>
                            <h4>Live Chat</h4>
                            <p>Available Monday-Friday, 9am-5pm EST</p>
                            <button class="btn-secondary" onclick="startLiveChat()">Start Chat</button>
                        </div>
                        
                        <div class="contact-option">
                            <div class="contact-icon" role="img" aria-label="Community">👥</div>
                            <h4>Community Forum</h4>
                            <p>Connect with other Mood Garden users</p>
                            <button class="btn-secondary" onclick="openCommunityForum()">Visit Forum</button>
                        </div>
                    </div>
                </section>
                

                

                
                <section class="settings-section" aria-labelledby="resources-heading">
                    <h3 id="resources-heading"><span class="section-icon" role="img" aria-label="Resources">📚</span> Helpful Resources</h3>
                    <div class="resources-grid">
                        <a href="#" class="resource-card" onclick="openResource('user-guide'); return false;">
                            <div class="resource-icon" role="img" aria-label="User Guide">📖</div>
                            <h4>User Guide</h4>
                            <p>Complete guide to using Mood Garden</p>
                        </a>
                        
                        <a href="#" class="resource-card" onclick="openResource('video-tutorials'); return false;">
                            <div class="resource-icon" role="img" aria-label="Video Tutorials">🎥</div>
                            <h4>Video Tutorials</h4>
                            <p>Step-by-step video guides</p>
                        </a>
                        
                        <a href="#" class="resource-card" onclick="openResource('mental-health'); return false;">
                            <div class="resource-icon" role="img" aria-label="Mental Health">🧠</div>
                            <h4>Mental Health Resources</h4>
                            <p>Professional mental health support</p>
                        </a>
                        
                        <a href="#" class="resource-card" onclick="openResource('blog'); return false;">
                            <div class="resource-icon" role="img" aria-label="Blog">✍️</div>
                            <h4>Blog</h4>
                            <p>Tips for emotional wellness</p>
                        </a>
                    </div>
                </section>
                
                <section class="settings-section" aria-labelledby="troubleshooting-heading">
                    <h3 id="troubleshooting-heading"><span class="section-icon" role="img" aria-label="Troubleshooting">🔧</span> Troubleshooting</h3>
                    <div class="troubleshooting-topics">
                        <div class="troubleshooting-item">
                            <h4>App Not Syncing</h4>
                            <p>Check your internet connection and try refreshing the app. If the issue persists, log out and log back in.</p>
                        </div>
                        
                        <div class="troubleshooting-item">
                            <h4>Notifications Not Working</h4>
                            <p>Ensure notifications are enabled in your device settings and in-app preferences. Check that the app has permission to send notifications.</p>
                        </div>
                        
                        <div class="troubleshooting-item">
                            <h4>Can't Remember Password</h4>
                            <p>Use the "Forgot Password" option on the login screen. Check your email for reset instructions.</p>
                        </div>
                        
                        <div class="troubleshooting-item">
                            <h4>App Crashing</h4>
                            <p>Try restarting the app. If it continues, clear the app cache or reinstall the app. Your data is safely backed up.</p>
                        </div>
                    </div>
                </section>
            </div>
            
            <footer class="settings-actions">
                <button class="btn-primary" onclick="showHome()" aria-label="Return to home page">
                    <span class="icon" aria-hidden="true">🏠</span> Back to Home
                </button>
            </footer>
            
            <button id="back-to-top" class="back-to-top" aria-label="Back to top" onclick="scrollToTop()">
                <span aria-hidden="true">↑</span>
            </button>
        </div>
    `;

    // Add CSS for help and support page with PURPLE theme
    const helpStyles = document.createElement('style');
    helpStyles.textContent = `
        /* Main container with scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        }
        
        /* Simple scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--bg-section);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            opacity: 0.7;
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            opacity: 1;
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) var(--bg-section);
        }
        
        .settings-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 40px;
            background: transparent;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 24px;
            border: none;
            position: relative;
            box-shadow: none;
            overflow: visible;
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
            opacity: 0.05;
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
            background: transparent;
            border-radius: 0;
            padding: 0;
            backdrop-filter: none;
            border: none;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            margin-bottom: 0;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .settings-section {
            background: transparent;
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: none;
            transition: transform 0.3s ease;
        }
        
        .settings-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4);
        }
        
        .settings-section h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        /* FAQ Styles */
        .faq-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .faq-item {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.3));
            border-radius: 15px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        
        .faq-question {
            width: 100%;
            background: none;
            border: none;
            padding: 20px;
            text-align: left;
            font-size: 1.1rem;
            font-weight: 600;
            color: #ffffff;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        .faq-question:hover {
            background: rgba(139, 92, 246, 0.2);
        }
        
        .faq-icon {
            font-size: 1.5rem;
            transition: transform 0.3s ease;
        }
        
        .faq-question[aria-expanded="true"] .faq-icon {
            transform: rotate(45deg);
        }
        
        .faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .faq-answer p {
            padding: 0 20px 20px;
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
        }
        
        .faq-item.active .faq-answer {
            max-height: 200px;
        }
        
        /* Contact Options */
        .contact-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .contact-option {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 25px;
            text-align: center;
            transition: transform 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .contact-option:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(139, 92, 246, 0.15);
        }
        
        .contact-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
        }
        
        .contact-option h4 {
            margin: 0 0 10px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .contact-option p {
            margin: 0 0 15px 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        /* Feedback Form */
        .feedback-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .form-group label {
            font-weight: 600;
            color: #ffffff;
            font-size: 1rem;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            padding: 14px;
            border: 2px solid transparent;
            border-radius: 12px;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.1) padding-box,
                        linear-gradient(135deg, #9b59b6, #8e44ad) border-box;
            transition: all 0.3s ease;
            width: 100%;
            box-sizing: border-box;
            font-family: inherit;
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 120px;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.1) padding-box,
                        linear-gradient(135deg, #9b59b6, #8e44ad, #6c3483) border-box;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.2);
        }
        
        .setting-select {
            cursor: pointer;
        }
        
        /* Resources Grid */
        .resources-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .resource-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            text-decoration: none;
            color: #ffffff;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.4);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .resource-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(139, 92, 246, 0.15);
            color: #ffffff;
        }
        
        .resource-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
        }
        
        .resource-card h4 {
            margin: 0 0 10px 0;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .resource-card p {
            margin: 0;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.9);
        }
        
        /* Troubleshooting */
        .troubleshooting-topics {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .troubleshooting-item {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.3));
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        
        .troubleshooting-item h4 {
            margin: 0 0 10px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .troubleshooting-item p {
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
            line-height: 1.6;
        }
        
        /* Buttons */
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn-primary,
        .btn-secondary {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
            text-decoration: none;
            justify-content: center;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #dfe6e9, #b2bec3);
            color: #2c3e50;
        }
        
        .btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(178, 190, 195, 0.3);
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            border: none;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .back-to-top:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
        }
        
        @media (max-width: 768px) {
            .settings-container {
                margin: 10px;
                padding: 15px;
            }
            
            .header-decoration {
                flex-direction: column;
                gap: 5px;
            }
            
            .settings-header h2 {
                font-size: 1.8rem;
            }
            
            .contact-options {
                grid-template-columns: 1fr;
            }
            
            .resources-grid {
                grid-template-columns: 1fr;
            }
            
            #maincard {
                height: 100%;
            }
        }
    `;

    if (!document.querySelector('style[data-help-support]')) {
        helpStyles.setAttribute('data-help-support', 'true');
        document.head.appendChild(helpStyles);
    }

    // Initialize back-to-top button visibility
    initializeBackToTopButton();

    // Add smooth scroll behavior for internal links
    initializeSmoothScrolling();
}
// Toggle FAQ items
function toggleFAQ(button) {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');

    // Close all FAQ items
    document.querySelectorAll('.faq-item-flat').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
    }
}

// Placeholder functions for contact options
function startLiveChat() {
    showNotification('Live chat feature coming soon!', 'info');
}
function openCommunityForum() {
    showNotification('Redirecting to community forum...', 'info');
}
function openResource(type) {
    showNotification(`Opening ${type.replace('-', ' ')}...`, 'info');
}
// Helper functions for enhanced functionality
function initializeBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
}
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
// Notification function (assuming it exists in your app)
function showNotification(message, type) {
    // This would integrate with your existing notification system
    console.log(`${type}: ${message}`);

    // Simple fallback notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
// ===== ABOUT MOOD GARDEN =====
function showAboutPage() {
    localStorage.setItem("currentPage", "page_about");

    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    // Create about page content with enhanced design matching privacy/security page
    document.getElementById('maincard').innerHTML = `
        <div class="settings-container about-page" role="main" aria-label="About Mood Garden">
            <header class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji" role="img" aria-label="Flower">🌸</span>
                    <h2>Mood Garden</h2>
                    <span class="deco-emoji" role="img" aria-label="Plant">🌱</span>
                </div>
                <p>Version 1.0.0 - Your personal emotional wellness companion</p>
            </header>
            
            <div class="settings-content">
                <section class="settings-section" aria-labelledby="about-heading">
                    <h3 id="about-heading"><span class="section-icon" role="img" aria-label="Information">ℹ️</span> About Mood Garden</h3>
                    <p>Mood Garden is your personal companion for emotional wellness. Track your daily moods, identify patterns, and cultivate better mental health through mindful observation.</p>
                    
                    <div class="about-features">
                        <div class="feature-item">
                            <div class="feature-icon" role="img" aria-label="Daily Mood Tracking">😊</div>
                            <h4>Daily Mood Tracking</h4>
                            <p>Log your emotions with our intuitive emoji-based interface</p>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon" role="img" aria-label="Personalized Insights">📊</div>
                            <h4>Personalized Insights</h4>
                            <p>Discover patterns in your mood with detailed statistics</p>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon" role="img" aria-label="Privacy First">🔒</div>
                            <h4>Privacy First</h4>
                            <p>Your data is encrypted and stored locally on your device</p>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon" role="img" aria-label="Growth Mindset">🌱</div>
                            <h4>Growth Mindset</h4>
                            <p>Cultivate emotional awareness and resilience over time</p>
                        </div>
                    </div>
                </section>
                
                <section class="settings-section" aria-labelledby="mission-heading">
                    <h3 id="mission-heading"><span class="section-icon" role="img" aria-label="Target">🎯</span> Our Mission</h3>
                    <p>We believe that understanding our emotions is the first step toward emotional well-being. Mood Garden provides a gentle, non-judgmental space for you to explore your feelings and build a healthier relationship with your inner self.</p>
                </section>
                
                <section class="settings-section" aria-labelledby="team-heading">
                    <h3 id="team-heading"><span class="section-icon" role="img" aria-label="Team">👥</span> Team</h3>
                    <div class="team-members">
                        <div class="team-member">
                            <div class="member-avatar" role="img" aria-label="Anmol and Aliya">👩‍💼</div>
                            <h4>Anmol and Aliya</h4>
                            <p>Founder & CEO</p>
                        </div>
                        
                        <div class="team-member">
                            <div class="member-avatar" role="img" aria-label="Anmol">👨‍💻</div>
                            <h4>Anmol</h4>
                            <p>Lead Developer</p>
                        </div>
                        
                        <div class="team-member">
                            <div class="member-avatar" role="img" aria-label="Anmol and Aliya">👩‍🎨</div>
                            <h4>Anmol and Aliya</h4>
                            <p>UX Designer</p>
                        </div>
                        
                        <div class="team-member">
                            <div class="member-avatar" role="img" aria-label="Dr. Huma">👨‍⚕️</div>
                            <h4>Dr. Hira Akbar</h4>
                            <p>Mental Health Advisor</p>
                        </div>
                    </div>
                </section>
                
                <section class="settings-section" aria-labelledby="legal-heading">
                    <h3 id="legal-heading"><span class="section-icon" role="img" aria-label="Legal">⚖️</span> Legal</h3>
                    <div class="legal-links">
                        <a href="#" class="legal-link" onclick="showTermsOfService(); return false;">Terms of Service</a>
                        <a href="#" class="legal-link" onclick="showPrivacyPolicy(); return false;">Privacy Policy</a>
                        <a href="#" class="legal-link" onclick="showCookiePolicy(); return false;">Cookie Policy</a>
                    </div>
                </section>
            </div>
            
            <footer class="settings-actions">
                <button class="btn-primary" onclick="showHome()" aria-label="Return to home page">
                    <span class="icon" aria-hidden="true">🏠</span> Back to Home
                </button>
            </footer>
            
            <button id="back-to-top" class="back-to-top" aria-label="Back to top" onclick="scrollToTop()">
                <span aria-hidden="true">↑</span>
            </button>
        </div>
    `;

    // Add CSS for enhanced about page matching privacy/security design
    const aboutStyles = document.createElement('style');
    aboutStyles.textContent = `
        /* Main container with scrolling */
        #maincard {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        }
        
        /* Simple scrollbar styling */
        #maincard::-webkit-scrollbar {
            width: 8px;
        }
        
        #maincard::-webkit-scrollbar-track {
            background: var(--bg-section);
            border-radius: 4px;
        }
        
        #maincard::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
            opacity: 0.7;
        }
        
        #maincard::-webkit-scrollbar-thumb:hover {
            opacity: 1;
        }
        
        /* Firefox scrollbar */
        #maincard {
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) var(--bg-section);
        }
        
        .settings-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 40px;
            background: transparent;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 24px;
            border: none;
            position: relative;
            box-shadow: none;
            overflow: visible;
        }
        
        .settings-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
            opacity: 0.05;
            animation: float 20s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-30px, -30px) rotate(180deg); }
        }
        
        .settings-header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
            background: transparent;
            border-radius: 20px;
            padding: 25px;
            border: none;
        }
        
        .header-decoration {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .deco-emoji {
            font-size: 2rem;
            animation: bounce 2s ease-in-out infinite;
        }
        
        .deco-emoji:first-child {
            animation-delay: 0s;
        }
        
        .deco-emoji:last-child {
            animation-delay: 1s;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .settings-header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 2.2rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .settings-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1.1rem;
            margin-bottom: 0;
        }
        
        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 25px;
            position: relative;
            z-index: 1;
        }
        
        .settings-section {
            background: transparent;
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: none;
            transition: transform 0.3s ease;
        }
        
        .settings-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4);
        }
        
        .settings-section h3 {
            color: #ffffff;
            font-size: 1.3rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .section-icon {
            font-size: 1.5rem;
            margin-right: 8px;
        }
        
        .about-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .feature-item {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.3));
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        
        .feature-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(139, 92, 246, 0.15);
        }
        
        .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 15px;
        }
        
        .feature-item h4 {
            margin: 0 0 10px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .feature-item p {
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        .team-members {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .team-member {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.3));
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 4);
        }
        
        .team-member:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(139, 92, 246, 0.15);
        }
        
        .member-avatar {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        
        .team-member h4 {
            margin: 0 0 5px 0;
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .team-member p {
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.9rem;
        }
        
        .social-links {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
        }
        
        .social-link {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.3));
            border-radius: 12px;
            text-decoration: none;
            color: #ffffff;
            font-weight: 500;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        
        .social-link:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(139, 92, 246, 0.2);
            color: #ffffff;
        }
        
        .social-icon {
            font-size: 1.2rem;
        }
        
        .legal-links {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
        }
        
        .legal-link {
            padding: 10px 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.3));
            border-radius: 12px;
            text-decoration: none;
            color: #ffffff;
            font-weight: 500;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.4);
        }
        
        .legal-link:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(139, 92, 246, 0.2);
            color: #ffffff;
        }
        
        .settings-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn-primary {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1rem;
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
        }
        
        .icon {
            font-size: 1.1rem;
        }
        
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            border: none;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .back-to-top:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
        }
        
        @media (max-width: 768px) {
            .settings-container {
                margin: 10px;
                padding: 15px;
            }
            
            .header-decoration {
                flex-direction: column;
                gap: 5px;
            }
            
            .settings-header h2 {
                font-size: 1.8rem;
            }
            
            .about-features {
                grid-template-columns: 1fr;
            }
            
            .team-members {
                grid-template-columns: 1fr;
            }
            
            .social-links {
                justify-content: center;
            }
            
            .legal-links {
                justify-content: center;
            }
            
            #maincard {
                height: 100%;
            }
        }
    `;

    if (!document.querySelector('style[data-about-page]')) {
        aboutStyles.setAttribute('data-about-page', 'true');
        document.head.appendChild(aboutStyles);
    }

    // Initialize back-to-top button visibility
    initializeBackToTopButton();

    // Add smooth scroll behavior for internal links
    initializeSmoothScrolling();
}
// Helper functions for enhanced functionality
function initializeBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
}
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
// ===== TERMS OF SERVICE =====
function showTermsOfService() {
    // Save current page
    localStorage.setItem("currentPage", "page_terms");
    document.getElementById('maincard').innerHTML = `
        <div class="settings-container legal-page" role="main" aria-label="Terms of Service">
            <header class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji" role="img" aria-label="Document">📄</span>
                    <h2>Terms of Service</h2>
                    <span class="deco-emoji" role="img" aria-label="Legal">⚖️</span>
                </div>
                <p>Last updated: ${new Date().toLocaleDateString()}</p>
            </header>
            
            <div class="settings-content">
                <section class="legal-section" aria-labelledby="intro-heading">
                    <h3 id="intro-heading">Introduction</h3>
                    <p>Welcome to Mood Garden. These Terms of Service ("Terms") govern your use of our mobile application and services. By accessing or using Mood Garden, you agree to be bound by these Terms.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="acceptance-heading">
                    <h3 id="acceptance-heading">Acceptance of Terms</h3>
                    <p>By downloading, installing, or using Mood Garden, you ("User") agree to these Terms. If you do not agree to these Terms, you may not use the Service.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="description-heading">
                    <h3 id="description-heading">Service Description</h3>
                    <p>Mood Garden is a personal emotional wellness application that allows users to:</p>
                    <ul>
                        <li>Track daily moods and emotions</li>
                        <li>View mood patterns and insights</li>
                        <li>Set reminders for mood check-ins</li>
                        <li>Export personal data</li>
                        <li>Access mental health resources</li>
                    </ul>
                </section>
                
                <section class="legal-section" aria-labelledby="user-responsibilities-heading">
                    <h3 id="user-responsibilities-heading">User Responsibilities</h3>
                    <p>As a User, you agree to:</p>
                    <ul>
                        <li>Provide accurate information when required</li>
                        <li>Use the Service for personal, non-commercial purposes</li>
                        <li>Respect the privacy and rights of others</li>
                        <li>Not attempt to reverse engineer or hack the application</li>
                        <li>Not use the Service for any illegal activities</li>
                    </ul>
                </section>
                
                <section class="legal-section" aria-labelledby="privacy-heading">
                    <h3 id="privacy-heading">Privacy and Data Protection</h3>
                    <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using Mood Garden, you consent to the collection and use of information as described in our Privacy Policy.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="intellectual-property-heading">
                    <h3 id="intellectual-property-heading">Intellectual Property</h3>
                    <p>Mood Garden and its original content, features, and functionality are owned by Mood Garden Inc. and are protected by international copyright, trademark, and other intellectual property laws.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="disclaimer-heading">
                    <h3 id="disclaimer-heading">Medical Disclaimer</h3>
                    <p>Mood Garden is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="limitation-heading">
                    <h3 id="limitation-heading">Limitation of Liability</h3>
                    <p>To the maximum extent permitted by law, Mood Garden Inc. shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the Service.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="termination-heading">
                    <h3 id="termination-heading">Termination</h3>
                    <p>We may terminate or suspend your account at any time for violation of these Terms or for any other reason at our sole discretion.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="changes-heading">
                    <h3 id="changes-heading">Changes to Terms</h3>
                    <p>We reserve the right to modify these Terms at any time. We will notify users of any changes by posting the new Terms in the application.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="contact-heading">
                    <h3 id="contact-heading">Contact Information</h3>
                    <p>If you have any questions about these Terms, please contact us at:</p>
                    <div class="contact-info">
                        <p>Email: legal@moodgarden.app</p>
                        <p>Address: 123 Wellness Street, Mindful City, MC 12345</p>
                    </div>
                </section>
            </div>
            
            <footer class="settings-actions">
                <button class="btn-primary" onclick="showHome()">
                    <span class="icon" aria-hidden="true">🏠</span> Back to Home
                </button>
                <button class="btn-secondary" onclick="window.print()">
                    <span class="icon" aria-hidden="true">🖨️</span> Print Terms
                </button>
            </footer>
            
            <button id="back-to-top" class="back-to-top" aria-label="Back to top" onclick="scrollToTop()">
                <span aria-hidden="true">↑</span>
            </button>
        </div>
    `;

    addLegalPageStyles();
    initializeBackToTopButton();
    initializeSmoothScrolling();
}

function addLegalPageStyles() {

    document.querySelectorAll('style[data-legal-page]').forEach(s => s.remove());

    const style = document.createElement('style');
    style.setAttribute('data-legal-page', 'true');

    style.textContent = `
        /* THEME */
        .legal-page {
            --purple-main: #8b5cf6;
            --purple-dark: #7c3aed;
            --purple-glass: rgba(139, 92, 246, 0.55);
            --purple-solid: rgba(139, 92, 246, 0.75);
            --text-light: rgba(255,255,255,0.95);
        }

        /* MAIN PAGE */
        .legal-page.settings-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 40px;
            background: var(--bg-card) !important;
            backdrop-filter: blur(10px);
            border-radius: 24px;
            border: none;
            box-shadow: none;
        }

        /* HEADER CARD */
        .legal-page .settings-header {
            background: transparent !important;
            border-radius: 0;
            color: white;
            padding: 0;
            border: none;
        }

        /* 🔥 ALL CARDS — CATCH EVERYTHING */
        .legal-page .legal-section,
        .legal-page .settings-card,
        .legal-page .card,
        .legal-page section,
        .legal-page article,
        .legal-page .content-card,
        .legal-page .info-card,
        .legal-page > div > div {
            background: transparent !important;
            border-radius: 0;
            box-shadow: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        /* REMOVE LIGHT BACKGROUNDS */
        .legal-page * {
            background-color: transparent;
        }

        /* RESTORE PURPLE TO CARDS AFTER RESET */
        .legal-page .legal-section *,
        .legal-page .settings-header * {
            background-color: transparent;
        }

        /* TEXT */
        .legal-page h1,
        .legal-page h2,
        .legal-page h3 {
            color: white !important;
        }

        .legal-page p,
        .legal-page li,
        .legal-page span {
            color: var(--text-light) !important;
        }
    `;

    document.head.appendChild(style);
}


// ===== PRIVACY POLICY =====
function showPrivacyPolicy() {
    // Save current page
    localStorage.setItem("currentPage", "page_privacy");
    document.getElementById('maincard').innerHTML = `
        <div class="settings-container legal-page" role="main" aria-label="Privacy Policy">
            <header class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji" role="img" aria-label="Privacy">🔒</span>
                    <h2>Privacy Policy</h2>
                    <span class="deco-emoji" role="img" aria-label="Shield">🛡️</span>
                </div>
                <p>Last updated: ${new Date().toLocaleDateString()}</p>
            </header>
            
            <div class="settings-content">
                <section class="legal-section" aria-labelledby="privacy-intro-heading">
                    <h3 id="privacy-intro-heading">Our Commitment to Privacy</h3>
                    <p>At Mood Garden, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="data-collection-heading">
                    <h3 id="data-collection-heading">Information We Collect</h3>
                    <div class="subsection">
                        <h4>Information You Provide</h4>
                        <ul>
                            <li>Mood entries and emotional states</li>
                            <li>Optional notes and journal entries</li>
                            <li>Profile information (name, email)</li>
                            <li>Feedback and support requests</li>
                        </ul>
                    </div>
                    <div class="subsection">
                        <h4>Automatically Collected Information</h4>
                        <ul>
                            <li>Usage patterns and app interactions</li>
                            <li>Device information (OS, device type)</li>
                            <li>App version and performance data</li>
                            <li>General location (optional, with consent)</li>
                        </ul>
                    </div>
                </section>
                
                <section class="legal-section" aria-labelledby="data-usage-heading">
                    <h3 id="data-usage-heading">How We Use Your Information</h3>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Provide and improve our services</li>
                        <li>Generate personalized mood insights</li>
                        <li>Send important app notifications</li>
                        <li>Respond to your support requests</li>
                        <li>Conduct anonymized research to improve mental health outcomes</li>
                    </ul>
                </section>
                
                <section class="legal-section" aria-labelledby="data-storage-heading">
                    <h3 id="data-storage-heading">Data Storage and Security</h3>
                    <p>Your data is stored with the following security measures:</p>
                    <ul>
                        <li>Local encryption on your device</li>
                        <li>Secure cloud backup (optional)</li>
                        <li>Regular security audits</li>
                        <li>Limited access to authorized personnel only</li>
                        <li>Compliance with data protection regulations</li>
                    </ul>
                </section>
                
                <section class="legal-section" aria-labelledby="data-sharing-heading">
                    <h3 id="data-sharing-heading">Information Sharing</h3>
                    <p>We do not sell your personal information. We may share your data only in the following circumstances:</p>
                    <ul>
                        <li>With your explicit consent</li>
                        <li>Anonymized data for research purposes</li>
                        <li>When required by law</li>
                        <li>To protect our rights and prevent fraud</li>
                    </ul>
                </section>
                
                <section class="legal-section" aria-labelledby="user-rights-heading">
                    <h3 id="user-rights-heading">Your Rights</h3>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate information</li>
                        <li>Delete your account and data</li>
                        <li>Export your data in a readable format</li>
                        <li>Opt-out of data collection</li>
                    </ul>
                </section>
                
                <section class="legal-section" aria-labelledby="cookies-heading">
                    <h3 id="cookies-heading">Cookies and Tracking</h3>
                    <p>We use minimal cookies and tracking technologies to:</p>
                    <ul>
                        <li>Remember your preferences</li>
                        <li>Analyze app performance</li>
                        <li>Provide personalized experiences</li>
                    </ul>
                    <p>You can control cookie settings in your app preferences.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="third-party-heading">
                    <h3 id="third-party-heading">Third-Party Services</h3>
                    <p>We may use third-party services for:</p>
                    <ul>
                        <li>Analytics and performance monitoring</li>
                        <li>Cloud storage services</li>
                        <li>Email communication</li>
                    </ul>
                    <p>These services have their own privacy policies and are committed to protecting your data.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="privacy-contact-heading">
                    <h3 id="privacy-contact-heading">Contact Us</h3>
                    <p>If you have questions about this Privacy Policy or your data rights, please contact us:</p>
                    <div class="contact-info">
                        <p>Email: privacy@moodgarden.app</p>
                        <p>Privacy Officer: privacy.officer@moodgarden.app</p>
                    </div>
                </section>
            </div>
            
            <footer class="settings-actions">
                <button class="btn-primary" onclick="showHome()">
                    <span class="icon" aria-hidden="true">🏠</span> Back to Home
                </button>
                <button class="btn-secondary" onclick="downloadMyData()">
                    <span class="icon" aria-hidden="true">📥</span> Download My Data
                </button>
            </footer>
            
            <button id="back-to-top" class="back-to-top" aria-label="Back to top" onclick="scrollToTop()">
                <span aria-hidden="true">↑</span>
            </button>
        </div>
    `;

    addLegalPageStyles();
    initializeBackToTopButton();
    initializeSmoothScrolling();
}
// ===== COOKIE POLICY =====
function showCookiePolicy() {
    // Save current page
    localStorage.setItem("currentPage", "page_cookie");

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container legal-page" role="main" aria-label="Cookie Policy">
            <header class="settings-header">
                <div class="header-decoration">
                    <span class="deco-emoji" role="img" aria-label="Cookie">🍪</span>
                    <h2>Cookie Policy</h2>
                    <span class="deco-emoji" role="img" aria-label="Settings">⚙️</span>
                </div>
                <p>Last updated: ${new Date().toLocaleDateString()}</p>
            </header>
            
            <div class="settings-content">
                <section class="legal-section" aria-labelledby="cookie-intro-heading">
                    <h3 id="cookie-intro-heading">What Are Cookies?</h3>
                    <p>Cookies are small text files stored on your device when you visit a website or use an application. They help us provide you with a better experience by remembering your preferences and improving our services.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="cookie-types-heading">
                    <h3 id="cookie-types-heading">Types of Cookies We Use</h3>
                    <div class="cookie-types">
                        <div class="cookie-type">
                            <h4>Essential Cookies</h4>
                            <p>Required for the app to function properly</p>
                            <ul>
                                <li>Authentication tokens</li>
                                <li>Security settings</li>
                                <li>Load balancing</li>
                            </ul>
                        </div>
                        
                        <div class="cookie-type">
                            <h4>Performance Cookies</h4>
                            <p>Help us understand how you use the app</p>
                            <ul>
                                <li>Analytics data</li>
                                <li>Usage statistics</li>
                                <li>Performance metrics</li>
                            </ul>
                        </div>
                        
                        <div class="cookie-type">
                            <h4>Functional Cookies</h4>
                            <p>Remember your preferences</p>
                            <ul>
                                <li>Language settings</li>
                                <li>Theme preferences</li>
                                <li>Notification settings</li>
                            </ul>
                        </div>
                    </div>
                </section>
                
                <section class="legal-section" aria-labelledby="cookie-usage-heading">
                    <h3 id="cookie-usage-heading">How We Use Cookies</h3>
                    <p>We use cookies to:</p>
                    <ul>
                        <li>Keep you logged in to your account</li>
                        <li>Remember your mood tracking preferences</li>
                        <li>Analyze app usage patterns</li>
                        <li>Provide personalized content</li>
                        <li>Ensure app security and prevent fraud</li>
                        <li>Improve app performance and features</li>
                    </ul>
                </section>
                
                <section class="legal-section" aria-labelledby="cookie-lifespan-heading">
                    <h3 id="cookie-lifespan-heading">Cookie Lifespan</h3>
                    <div class="cookie-lifespan">
                        <div class="lifespan-item">
                            <h4>Session Cookies</h4>
                            <p>Deleted when you close the app</p>
                        </div>
                        <div class="lifespan-item">
                            <h4>Persistent Cookies</h4>
                            <p>Remain on your device for a set period</p>
                        </div>
                        <div class="lifespan-item">
                            <h4>Authentication Cookies</h4>
                            <p>Last for 30 days (renewed on each use)</p>
                        </div>
                    </div>
                </section>
                
                <section class="legal-section" aria-labelledby="cookie-control-heading">
                    <h3 id="cookie-control-heading">Managing Your Cookie Preferences</h3>
                    <p>You have several options to manage cookies:</p>
                    <ul>
                        <li>Accept or reject non-essential cookies in app settings</li>
                        <li>Clear cookies through your device settings</li>
                        <li>Use private/incognito mode to avoid cookies</li>
                        <li>Adjust browser settings for web-based features</li>
                    </ul>
                    <p>Note: Disabling essential cookies may affect app functionality.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="third-party-cookies-heading">
                    <h3 id="third-party-cookies-heading">Third-Party Cookies</h3>
                    <p>We may use third-party services that place cookies on your device:</p>
                    <ul>
                        <li><strong>Analytics Services:</strong> Google Analytics, Mixpanel</li>
                        <li><strong>Cloud Services:</strong> AWS, Firebase</li>
                        <li><strong>Support Tools:</strong> Intercom, Zendesk</li>
                    </ul>
                    <p>These third parties have their own cookie policies and are responsible for their cookie practices.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="cookie-updates-heading">
                    <h3 id="cookie-updates-heading">Updates to This Policy</h3>
                    <p>We may update this Cookie Policy to reflect changes in our practices or for legal reasons. We will notify you of any significant changes through the app or email.</p>
                </section>
                
                <section class="legal-section" aria-labelledby="cookie-contact-heading">
                    <h3 id="cookie-contact-heading">Questions About Cookies</h3>
                    <p>If you have questions about our Cookie Policy or how we use cookies, please contact us:</p>
                    <div class="contact-info">
                        <p>Email: cookies@moodgarden.app</p>
                        <p>Data Protection Officer: dpo@moodgarden.app</p>
                    </div>
                </section>
            </div>
            
            <footer class="settings-actions">
                <button class="btn-primary" onclick="showHome()">
                    <span class="icon" aria-hidden="true">🏠</span> Back to Home
                </button>
                <button class="btn-secondary" onclick="showPrivacySecurityPage()">
                    <span class="icon" aria-hidden="true">🔒</span> Privacy Settings
                </button>
            </footer>
            
            <button id="back-to-top" class="back-to-top" aria-label="Back to top" onclick="scrollToTop()">
                <span aria-hidden="true">↑</span>
            </button>
        </div>
    `;

    addLegalPageStyles();
    initializeBackToTopButton();
    initializeSmoothScrolling();
}
// ===== HELPER FUNCTIONS =====
function addLegalPageStyles() {
    if (!document.querySelector('style[data-legal-pages]')) {
        const legalStyles = document.createElement('style');
        legalStyles.setAttribute('data-legal-pages', 'true');
        legalStyles.textContent = `
            /* Main container with scrolling */
            #maincard {
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 10px;
            }
            
            /* Simple scrollbar styling */
            #maincard::-webkit-scrollbar {
                width: 8px;
            }
            
            #maincard::-webkit-scrollbar-track {
                background: #f5f5f5;
                border-radius: 4px;
            }
            
            #maincard::-webkit-scrollbar-thumb {
                background: #ff6b6b;
                border-radius: 4px;
            }
            
            #maincard::-webkit-scrollbar-thumb:hover {
                background: #ee5a24;
            }
            
            /* Firefox scrollbar */
            #maincard {
                scrollbar-width: thin;
                scrollbar-color: #ff6b6b #f5f5f5;
            }
            
            .settings-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(255, 182, 193, 0.3);
                position: relative;
                overflow: visible;
            }
            
            .settings-container::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255, 182, 193, 0.1) 0%, transparent 70%);
                animation: float 20s ease-in-out infinite;
                pointer-events: none;
            }
            
            @keyframes float {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                50% { transform: translate(-30px, -30px) rotate(180deg); }
            }
            
            .settings-header {
                text-align: center;
                margin-bottom: 30px;
                position: relative;
                z-index: 1;
            }
            
            .header-decoration {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-bottom: 10px;
            }
            
            .deco-emoji {
                font-size: 2rem;
                animation: bounce 2s ease-in-out infinite;
            }
            
            .deco-emoji:first-child {
                animation-delay: 0s;
            }
            
            .deco-emoji:last-child {
                animation-delay: 1s;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .settings-header h2 {
                margin: 0;
                color: #2c3e50;
                font-size: 2.2rem;
                font-weight: 700;
                text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
            }
            
            .settings-header p {
                color: #5a6c7d;
                font-size: 1.1rem;
                margin-bottom: 0;
            }
            
            .settings-content {
                display: flex;
                flex-direction: column;
                gap: 20px;
                position: relative;
                z-index: 1;
            }
            
            .legal-section {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
                border-radius: 20px;
                padding: 25px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                transition: transform 0.3s ease;
            }
            
            .legal-section:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(255, 107, 107, 0.2);
            }
            
            .legal-section h3 {
                color: #2c3e50;
                font-size: 1.3rem;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .legal-section h3::before {
                content: '📌';
                font-size: 1.2rem;
            }
            
            .legal-section p {
                color: #2c3e50;
                line-height: 1.6;
                margin-bottom: 15px;
            }
            
            .legal-section ul {
                color: #2c3e50;
                line-height: 1.6;
                margin-left: 20px;
                margin-bottom: 15px;
            }
            
            .legal-section li {
                margin-bottom: 8px;
            }
            
            .subsection {
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 12px;
            }
            
            .subsection h4 {
                color: #2c3e50;
                font-size: 1.1rem;
                margin-bottom: 10px;
            }
            
            .cookie-types {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 15px;
            }
            
            .cookie-type {
                background: rgba(255, 255, 255, 0.5);
                border-radius: 12px;
                padding: 20px;
                transition: transform 0.3s ease;
            }
            
            .cookie-type:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 16px rgba(255, 107, 107, 0.15);
            }
            
            .cookie-type h4 {
                color: #2c3e50;
                font-size: 1.1rem;
                margin-bottom: 10px;
            }
            
            .cookie-type p {
                margin-bottom: 10px;
            }
            
            .cookie-lifespan {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-top: 15px;
            }
            
            .lifespan-item {
                background: rgba(255, 255, 255, 0.5);
                border-radius: 12px;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .lifespan-item h4 {
                color: #2c3e50;
                font-size: 1.1rem;
                margin: 0;
            }
            
            .lifespan-item p {
                margin: 0;
                color: #5a6c7d;
            }
            
            .contact-info {
                background: rgba(255, 255, 255, 0.5);
                border-radius: 12px;
                padding: 15px;
                margin-top: 15px;
            }
            
            .contact-info p {
                margin: 5px 0;
                color: #2c3e50;
            }
            
            .settings-actions {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 30px;
            }
            
            .btn-primary,
            .btn-secondary {
                padding: 14px 28px;
                border: none;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 1rem;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #ff6b6b, #feca57);
                color: white;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
            }
            
            .btn-secondary {
                background: linear-gradient(135deg, #dfe6e9, #b2bec3);
                color: #2c3e50;
            }
            
            .btn-secondary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(178, 190, 195, 0.3);
            }
            
            .icon {
                font-size: 1.1rem;
            }
            
            .back-to-top {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff6b6b, #feca57);
                color: white;
                border: none;
                cursor: pointer;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                transition: all 0.3s ease;
                z-index: 1000;
            }
            
            .back-to-top:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
            }
            
            @media (max-width: 768px) {
                .settings-container {
                    margin: 10px;
                    padding: 15px;
                }
                
                .header-decoration {
                    flex-direction: column;
                    gap: 5px;
                }
                
                .settings-header h2 {
                    font-size: 1.8rem;
                }
                
                .cookie-types {
                    grid-template-columns: 1fr;
                }
                
                .lifespan-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                }
                
                #maincard {
                    height: 100%;
                }
            }
        `;
        document.head.appendChild(legalStyles);
    }
}
function initializeBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
}
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
// ===== ACCOUNT SETTINGS PAGE =====
function showAccountSettings() {
    localStorage.setItem('currentPage', 'page_settings');

    document.getElementById('maincard').innerHTML = `
        <div class="settings-container">
            <div class="settings-header">
                <h2>Settings</h2>
                <p>Customize your Mood Garden experience</p>
            </div>
            
            <div class="settings-grid">
                <div class="settings-card" onclick="showProfileSettingsPage()">
                    <div class="card-icon">👤</div>
                    <h3>Profile Settings</h3>
                    <p>Update your personal information</p>
                </div>
                

                
                <div class="settings-card" onclick="showPrivacySecurityPage()">
                    <div class="card-icon">🔒</div>
                    <h3>Privacy & Security</h3>
                    <p>Manage your privacy settings</p>
                </div>
                
                <div class="settings-card" onclick="showExportDataPage()">
                    <div class="card-icon">💾</div>
                    <h3>Export Data</h3>
                    <p>Download your information</p>
                </div>
                
                <div class="settings-card" onclick="showAppearancePage()">
                    <div class="card-icon">🌙</div>
                    <h3>Appearance</h3>
                    <p>Customize theme and visual preferences</p>
                </div>
                
                <div class="settings-card" onclick="showNotificationSettingsPage()">
                    <div class="card-icon">🔔</div>
                    <h3>Notifications</h3>
                    <p>Manage notification preferences</p>
                </div>
                
                <div class="settings-card" onclick="showGeneralSettingsPage()">
                    <div class="card-icon">⚙️</div>
                    <h3>General Settings</h3>
                    <p>Configure app-wide settings</p>
                </div>
                
                <div class="settings-card" onclick="showHelpSupportPage()">
                    <div class="card-icon">❓</div>
                    <h3>Help & Support</h3>
                    <p>Get help and find answers</p>
                </div>
                

                
                <div class="settings-card" onclick="showAboutPage()">
                    <div class="card-icon">ℹ️</div>
                    <h3>About Mood Garden</h3>
                    <p>Learn more about the app and its features</p>
                </div>
            </div>
        </div>
    `;
}
// ===== NOTIFICATION FUNCTION =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">✖</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
// ===== CSS STYLES =====
const settingsStyles = `
<style>
.settings-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: var(--text-main);
}

.settings-header {
    text-align: center;
    margin-bottom: 30px;
}

.settings-header h2 {
    font-size: 28px;
    margin-bottom: 10px;
}

.settings-header p {
    color: var(--text-secondary);
    font-size: 16px;
}

.settings-content {
    background: var(--gradient-primary);
    border-radius: 15px;
    padding: 25px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--border-main);
    margin-bottom: 20px;
}

/* 🌟 Light Theme Specific Overrides for Purple Glassmorphism */
body.light-theme .settings-content,
body.light-theme .home-card,
body.light-theme .help-card,
body.light-theme .entry-container .section {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(168, 85, 247, 0.9)) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

body.light-theme .settings-content h2,
body.light-theme .settings-content h3,
body.light-theme .settings-content p,
body.light-theme .home-card-title,
body.light-theme .home-card-description,
body.light-theme .help-card h4,
body.light-theme .help-card p,
body.light-theme .section-title,
body.light-theme .entry-title,
body.light-theme .entry-subtitle {
    color: white !important;
}

body.light-theme .setting-input,
body.light-theme .setting-select,
body.light-theme .setting-textarea {
    background: rgba(255, 255, 255, 0.2) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

body.light-theme .setting-input::placeholder,
body.light-theme .setting-textarea::placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
}

body.light-theme .setting-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
}
}

.settings-section {
    margin-bottom: 30px;
}

.settings-section h3 {
    margin-bottom: 15px;
    font-size: 20px;
    display: flex;
    align-items: center;
}

.settings-section h3::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 20px;
    background: #10b981;
    margin-right: 10px;
    border-radius: 2px;
}

.form-group {
    margin-bottom: 20px;
}

.form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.setting-input, .setting-select, .setting-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-main);
    border-radius: 8px;
    background: var(--bg-section);
    color: var(--text-main);
    font-size: 16px;
}

.setting-textarea {
    resize: vertical;
    min-height: 100px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid var(--border-main);
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-info h4 {
    margin-bottom: 5px;
}

.setting-info p {
    color: var(--text-secondary);
    font-size: 14px;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.3);
    transition: .4s;
    border-radius: 34px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .toggle-slider {
    background-color: #10b981;
}

input:checked + .toggle-slider:before {
    transform: translateX(24px);
}

.settings-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
}

.btn-primary, .btn-secondary, .btn-danger, .btn-text {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: #10b981;
    color: white;
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.btn-danger {
    background: #ef4444;
    color: white;
}

.btn-text {
    background: transparent;
    color: white;
    text-decoration: underline;
    padding: 5px;
}

.btn-primary:hover, .btn-secondary:hover, .btn-danger:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.icon {
    font-size: 18px;
}

/* Profile Settings Styles */
.profile-avatar-section {
    display: flex;
    gap: 30px;
    margin-bottom: 30px;
}

.avatar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    font-size: 48px;
}

.mood-summary {
    flex: 1;
}

.mood-icons {
    display: flex;
    gap: 10px;
    margin: 15px 0;
}

.mood-icon {
    font-size: 24px;
    opacity: 0.7;
}

.dominant-mood {
    font-size: 28px;
}

.char-count {
    text-align: right;
    font-size: 14px;
    opacity: 0.7;
}

.interests-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

/* Consolidated interest-tag with purple theme */
.interest-tag {
    display: flex;
    align-items: center;
    background: rgba(168, 85, 247, 0.15);
    padding: 8px 15px;
    border-radius: 20px;
    cursor: pointer;
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: rgba(255, 255, 255, 0.9);
    transition: all 0.3s ease;
}

.interest-tag input {
    display: none;
}

.interest-tag span {
    font-size: 14px;
}

.interest-tag input:checked + span {
    color: #ffffff;
    font-weight: 600;
}

.interest-tag:has(input:checked) {
    background: linear-gradient(135deg, #a855f7, #8b5cf6);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}


    text-align: center;
}

.bar-container {
    flex: 1;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    overflow: hidden;
}

.bar {
    height: 100%;
    background: #10b981;
    border-radius: 10px;
}

.mood-count {
    width: 30px;
    text-align: right;
}

.day-chart, .time-chart {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.day-bar, .time-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}

.day-label, .time-label {
    font-weight: 500;
}

.day-mood, .time-mood {
    font-size: 24px;
}

.trend-chart {
    position: relative;
    height: 150px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    margin-top: 20px;
}

.trend-point {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.trend-mood {
    font-size: 20px;
}

.trend-date {
    font-size: 12px;
    opacity: 0.7;
    margin-top: 5px;
}

/* Export Data Styles */
.data-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.summary-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.summary-icon {
    font-size: 24px;
    margin-bottom: 10px;
}

.summary-value {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
}

.summary-label {
    opacity: 0.8;
    font-size: 14px;
}

.export-options {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
}

.export-option {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.export-option:hover {
    background: rgba(255, 255, 255, 0.2);
}

.export-icon {
    font-size: 32px;
    margin-right: 20px;
}

.export-info {
    flex: 1;
}

.export-info h3 {
    margin-bottom: 5px;
}

.export-info p {
    opacity: 0.8;
    font-size: 14px;
}

.export-action {
    margin-left: 20px;
}

.export-preview {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
}

.preview-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.tab-button {
    padding: 8px 15px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 20px;
    color: white;
    cursor: pointer;
}

.tab-button.active {
    background: rgba(255, 255, 255, 0.3);
}

.preview-content {
    max-height: 300px;
    overflow-y: auto;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
}

.preview-table th, .preview-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-more {
    text-align: center;
    margin-top: 10px;
    opacity: 0.7;
}

/* Appearance Settings Styles */
.theme-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.theme-option {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.theme-option:hover {
    background: rgba(255, 255, 255, 0.2);
}

.theme-option.active {
    background: rgba(16, 185, 129, 0.3);
    border: 2px solid #10b981;
}

.theme-preview {
    width: 100%;
    height: 100px;
    border-radius: 8px;
    margin-bottom: 15px;
    overflow: hidden;
}

.preview-header {
    height: 20px;
    background: rgba(255, 255, 255, 0.3);
}

.preview-content {
    display: flex;
    padding: 10px;
    gap: 10px;
}

.preview-card {
    flex: 1;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.light-theme .preview-header {
    background: rgba(0, 0, 0, 0.1);
}

.light-theme .preview-card {
    background: rgba(0, 0, 0, 0.05);
}

.dark-theme .preview-header {
    background: rgba(0, 0, 0, 0.3);
}

.dark-theme .preview-card {
    background: rgba(0, 0, 0, 0.2);
}

.auto-theme .preview-header {
    background: linear-gradient(to right, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));
}

.auto-theme .preview-card {
    background: linear-gradient(to right, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.2));
}

.font-size-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 20px;
}

.font-size-option {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.font-size-option:hover {
    background: rgba(255, 255, 255, 0.2);
}

.font-size-option.active {
    background: rgba(16, 185, 129, 0.3);
    border: 2px solid #10b981;
}

.font-preview {
    margin-bottom: 10px;
}

.small-font {
    font-size: 14px;
}

.medium-font {
    font-size: 16px;
}

.large-font {
    font-size: 18px;
}

.extra-large-font {
    font-size: 20px;
}

.color-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.color-option {
    display: flex;
    flex-direction: column;
}

.color-input-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

input[type="color"] {
    width: 50px;
    height: 40px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

/* Notification Settings Styles */
.days-selector {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.day-checkbox {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    border-radius: 20px;
    cursor: pointer;
}

.day-checkbox input {
    display: none;
}

.day-checkbox span {
    font-size: 14px;
}

.day-checkbox input:checked + span {
    color: #10b981;
    font-weight: 600;
}

.notification-preview {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 10px;
}

.notification-icon {
    font-size: 24px;
    margin-right: 15px;
}

.notification-content {
    flex: 1;
}

.notification-title {
    font-weight: 600;
    margin-bottom: 5px;
}

.notification-message {
    margin-bottom: 5px;
    opacity: 0.8;
}

.notification-time {
    font-size: 12px;
    opacity: 0.6;
}

/* Help & Support Styles */
.help-search {
    margin-bottom: 30px;
}

.search-input {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 16px;
}

.search-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
}

.faq-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.faq-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
}

.faq-item summary {
    padding: 15px;
    cursor: pointer;
    font-weight: 600;
}

.faq-content {
    padding: 0 15px 15px;
}

.faq-image {
    margin-top: 15px;
}

.faq-image img {
    width: 100%;
    border-radius: 8px;
}

.guide-topics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.guide-topic {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.guide-topic:hover {
    background: rgba(255, 255, 255, 0.2);
}

.guide-icon {
    font-size: 32px;
    margin-bottom: 10px;
}

.support-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.support-option {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.support-option:hover {
    background: rgba(255, 255, 255, 0.2);
}

.support-icon {
    font-size: 32px;
    margin-bottom: 10px;
}

.support-status {
    font-size: 14px;
    margin-top: 10px;
    padding: 5px 10px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
    display: inline-block;
}

.support-status.online {
    background: rgba(16, 185, 129, 0.3);
}

/* Feedback Form Styles */
.feedback-form {
    margin-bottom: 30px;
}

.rating-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.rating-stars {
    display: flex;
    gap: 5px;
}

.star {
    font-size: 24px;
    cursor: pointer;
    opacity: 0.5;
}

.star.active {
    opacity: 1;
}

.rating-text {
    font-size: 14px;
    opacity: 0.7;
}

.checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.checkbox-label input {
    display: none;
}

.checkmark {
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    margin-right: 10px;
    position: relative;
}

.checkbox-label input:checked + .checkmark {
    background: #10b981;
}

.checkbox-label input:checked + .checkmark::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
}

.previous-feedback {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
}

.previous-feedback-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.previous-feedback-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 8px;
}

.feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.feedback-status {
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
}

.feedback-status.submitted {
    background: rgba(59, 130, 246, 0.3);
}

.feedback-status.in-progress {
    background: rgba(245, 158, 11, 0.3);
}

.feedback-status.resolved {
    background: rgba(16, 185, 129, 0.3);
}

.feedback-date {
    font-size: 12px;
    opacity: 0.7;
    margin-bottom: 10px;
}

.feedback-preview {
    font-size: 14px;
}

/* About Page Styles */
.about-header {
    text-align: center;
    margin-bottom: 30px;
}

.about-logo {
    font-size: 64px;
    margin-bottom: 20px;
}

.about-version {
    font-size: 18px;
    opacity: 0.8;
    margin-bottom: 20px;
}

.about-section {
    margin-bottom: 30px;
}

.about-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.feature-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.feature-icon {
    font-size: 32px;
    margin-bottom: 10px;
}

.team-members {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.team-member {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.member-avatar {
    font-size: 48px;
    margin-bottom: 10px;
}

.social-links {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
}

.social-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 10px;
    text-decoration: none;
    color: white;
    transition: all 0.3s;
}

.social-link:hover {
    background: rgba(255, 255, 255, 0.2);
}

.social-icon {
    font-size: 24px;
    margin-bottom: 5px;
}

.legal-links {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 20px;
}

.legal-link {
    color: white;
    text-decoration: underline;
}

/* Home Page Styles */
.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.settings-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 25px;
    border-radius: 15px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    backdrop-filter: blur(5px);
}

.settings-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.card-icon {
    font-size: 32px;
    margin-bottom: 15px;
}

.settings-card h3 {
    margin-bottom: 10px;
}

.settings-card p {
    opacity: 0.8;
    font-size: 14px;
}

/* Notification Styles */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    color: #333;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2001;
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    max-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    border-left: 4px solid #10b981;
}

.notification-error {
    border-left: 4px solid #ef4444;
}

.notification-info {
    border-left: 4px solid #3b82f6;
}

.notification-icon {
    font-size: 18px;
}

.notification-message {
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    opacity: 0.7;
}

.notification-close:hover {
    opacity: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
    .form-row {
        flex-direction: column;
        gap: 0;
    }
    
    .profile-avatar-section {
        flex-direction: column;
        align-items: center;
    }
    
    .stats-overview {
        grid-template-columns: 1fr;
    }
    
    .stats-charts {
        grid-template-columns: 1fr;
    }
    
    .theme-options {
        grid-template-columns: 1fr;
    }
    
    .font-size-options {
        grid-template-columns: 1fr;
    }
    
    .settings-grid {
        grid-template-columns: 1fr;
    }
    
    .settings-actions {
        flex-direction: column;
    }
    
    .social-links {
        flex-wrap: wrap;
    }
    
    .legal-links {
        flex-direction: column;
        align-items: center;
    }
}
</style>
`;
// Add styles to the document
if (!document.getElementById('settings-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'settings-styles';
    styleElement.textContent = settingsStyles;
    document.head.appendChild(styleElement);
}
function renderApp() {
    // Check if user is logged in using standardized keys
    const currentToken = state.token || localStorage.getItem('moodGardenToken');
    if (!currentToken) {
        showLogin();
        return;
    }

    // Add enhanced purple theme styles if not already present
    if (!document.getElementById('app-purple-theme')) {
        const themeStyles = document.createElement('style');
        themeStyles.id = 'app-purple-theme';
        themeStyles.textContent = `
      /* CSS Reset to ensure consistent baseline */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      :root {
        /* Force Purple Theme Backgrounds */
        --bg-page: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%) !important;
        --bg-card: rgba(255, 255, 255, 0.1) !important;
        --bg-header: rgba(139, 92, 246, 0.95) !important;
        --glass-bg: rgba(255, 255, 255, 0.1) !important;
        --text-main: #ffffff !important;
        --text-secondary: rgba(255, 255, 255, 0.9) !important;
      }
      
      /* Font import with higher specificity */
      html {
        font-family: 'Poppins', sans-serif !important;
      }
      
      html, body {
        height: 100% !important;
        /* Enable global scrolling */
        overflow-y: auto !important; 
        overflow-x: hidden !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      #app, .bg, .container {
        /* Allow container to grow */
        min-height: 100vh !important;
        height: auto !important;
        display: flex !important;
        flex-direction: column !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      body {
        font-family: 'Poppins', sans-serif !important;
        background: var(--bg-page) !important;
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="%23a855f7" opacity="0.8"/><circle cx="16" cy="16" r="6" fill="%23ffffff" opacity="0.9"/></svg>'), auto !important;
      }
      
      /* Enhanced scrollbar for entire application */
      ::-webkit-scrollbar {
        width: 12px !important;
        height: 12px !important;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1) !important;
        border-radius: 10px !important;
        margin: 5px !important;
        box-shadow: inset 0 0 5px rgba(139, 92, 246, 0.1) !important;
      }
      
      ::-webkit-scrollbar-thumb {
        background: var(--primary-color) !important;
        border-radius: 10px !important;
        border: 2px solid rgba(255, 255, 255, 0.2) !important;
        box-shadow: var(--shadow-main) !important;
        transition: all 0.3s ease !important;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        opacity: 0.9 !important;
        box-shadow: 0 3px 8px rgba(139, 92, 246, 0.5) !important;
        transform: scale(1.05) !important;
      }
      
      ::-webkit-scrollbar-thumb:active {
        background: var(--gradient-primary) !important;
        transform: scale(0.95) !important;
      }
      
      ::-webkit-scrollbar-corner {
        background: rgba(255, 255, 255, 0.05) !important;
        border-radius: 10px !important;
      }
      
      /* Custom scrollbar for Firefox */
      * {
        scrollbar-width: thin !important;
        scrollbar-color: #a855f7 rgba(255, 255, 255, 0.1) !important;
      }
      
      /* Custom cursor for interactive elements */
      button, a, input, textarea, select, [onclick], [role="button"] {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="%23c084fc" opacity="0.8"/><circle cx="16" cy="16" r="6" fill="%23ffffff" opacity="0.9"/></svg>'), pointer !important;
      }
      
      /* Custom cursor for text selection */
      input[type="text"], input[type="email"], input[type="password"], textarea {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="16" y1="8" x2="16" y2="24" stroke="%23a855f7" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="8" r="2" fill="%23a855f7"/><circle cx="16" cy="24" r="2" fill="%23a855f7"/></svg>'), text !important;
      }
      
      /* Custom cursor for disabled elements */
      button:disabled, [disabled] {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="%239ca3af" opacity="0.8"/><circle cx="16" cy="16" r="6" fill="%23ffffff" opacity="0.9"/></svg>'), not-allowed !important;
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50% !important; }
        50% { background-position: 100% 50% !important; }
        100% { background-position: 0% 50% !important; }
      }
      
      /* Decorative background removed */
      
      /* Navigation Bar */
      .navbar {
        background: var(--bg-header) !important;
        backdrop-filter: blur(25px) !important;
        -webkit-backdrop-filter: blur(25px) !important;
        border-bottom: 1px solid var(--border-main) !important;
        padding: 0 15px !important;
        height: 60px !important;
        display: flex !important;
        align-items: center !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 1000 !important;
        box-shadow: var(--shadow-main) !important;
      }
      
      .navbar-brand {
        display: flex !important;
        align-items: center !important;
        margin-right: 15px !important;
        flex-shrink: 0 !important;
        text-decoration: none !important;
      }
      
      .brand-apex {
        font-family: 'Orbitron', sans-serif !important;
        font-weight: 900 !important;
        font-size: clamp(1rem, 4vw, 1.5rem) !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        position: relative !important;
        display: inline-block !important;
        
        /* Metallic Gradient with Swoosh */
        background: linear-gradient(
          170deg, 
          #ffffff 0%, 
          #94a3b8 35%, 
          #38bdf8 45%, /* The Swoosh Top */
          #0ea5e9 50%, /* The Swoosh Middle */
          #38bdf8 55%, /* The Swoosh Bottom */
          #475569 65%, 
          #1e293b 100%
        ) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        
        /* 3D Depth Shadows */
        filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.8)) 
                drop-shadow(0 0 10px rgba(56, 189, 248, 0.3)) !important;
        
        transition: all 0.3s ease !important;
        cursor: pointer !important;
      }

      .brand-apex:hover {
        filter: drop-shadow(2px 2px 0px rgba(0,0,0,0.9)) 
                drop-shadow(0 0 20px rgba(56, 189, 248, 0.6)) !important;
        transform: translateY(-1px) scale(1.02) !important;
      }
      
      .navbar-menu {
        display: flex !important;
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
        gap: 5px !important;
        flex: 1 !important;
        justify-content: center !important;
      }
      
      .navbar-menu li {
        margin: 0 !important;
      }
      
      .navbar-menu button {
        background: none !important;
        border: none !important;
        padding: 6px 12px !important;
        color: var(--text-secondary) !important;
        text-decoration: none !important;
        font-weight: 400 !important;
        font-size: 14px !important;
        border-radius: 0 !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        position: relative !important;
        font-family: 'Poppins', sans-serif !important;
      }
      
      .navbar-menu button:hover {
        color: var(--primary-color) !important;
        background: none !important;
        transform: none !important;
      }
      
      /* Only active button gets underline */
      .navbar-menu button.active {
        color: var(--primary-color) !important;
        font-weight: 600 !important;
        background: none !important;
        box-shadow: none !important;
      }
      
      .navbar-menu button.active::after {
        content: '' !important;
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 2px !important;
        background: var(--primary-color) !important;
      }
      
      /* Right side navigation buttons */
      .navbar-right {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
      }
      
      /* Back button */
      .navbar-back {
        display: flex !important;
        align-items: center !important;
      }
      
      .navbar-back button {
        background: none !important;
        border: none !important;
        padding: 8px 16px !important;
        color: var(--text-primary) !important;
        text-decoration: none !important;
        font-weight: 500 !important;
        font-size: 16px !important;
        border-radius: 8px !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        position: relative !important;
        font-family: 'Poppins', sans-serif !important;
        display: flex !important;
        align-items: center continue
        !important;
        gap: 8px !important;
      }
      
      .navbar-back button:hover {
        color: var(--primary-color) !important;
        background: var(--bg-section) !important;
      }
      
      .navbar-back button .back-icon {
        font-size: 18px !important;
      }
      
      .navbar-user {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        flex-shrink: 0 !important;
        position: relative !important;
        cursor: pointer !important;
        padding: 0 !important;
        background: none !important;
        border: none !important;
        backdrop-filter: none !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      .navbar-user:hover {
        transform: translateY(-2px) !important;
      }
      
      .navbar-user.active {
        background: none !important;
      }

      .profile-avatar-circle {
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        background: var(--primary-color) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4) !important;
        position: relative !important;
      }
      
      .hamburger-indicator {
        position: absolute !important;
        bottom: -2px !important;
        right: -2px !important;
        width: 16px !important;
        height: 16px !important;
        border-radius: 50% !important;
        background: var(--primary-color) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 2px !important;
        border: 1.5px solid white !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        z-index: 2 !important;
        transition: all 0.3s ease !important;
      }

      .hamburger-line {
        width: 8px !important;
        height: 1.5px !important;
        background: white !important;
        border-radius: 1px !important;
      }

      .navbar-user.active .hamburger-indicator {
        transform: scale(0.9) !important;
        background: var(--primary-color) !important;
        opacity: 0.9 !important;
      }

      .profile-avatar-img {
        width: 100% !important;
        height: 100% !important;
        border-radius: 50% !important;
        object-fit: cover !important;
      }
      
      .profile-dropdown {
        position: absolute !important;
        top: 100% !important;
        right: 0 !important;
        margin-top: 10px !important;
        background: var(--bg-card) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid var(--border-main) !important;
        border-radius: 12px !important;
        box-shadow: var(--shadow-main) !important;
        width: 300px !important;
        max-width: calc(100vw - 32px) !important;
        z-index: 1001 !important;
        opacity: 0 !important;
        visibility: hidden !important;
        transform: translateY(-10px) !important;
        transition: all 0.3s ease !important;
        max-height: calc(100vh - 100px) !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }

      @media (max-width: 480px) {
        .profile-dropdown {
          width: calc(100vw - 40px) !important;
          right: -10px !important;
          max-height: 70vh !important;
        }
        
        .dropdown-item {
          padding: 12px 15px !important;
        }
        
        .dropdown-item-text {
          font-size: 15px !important;
        }
      }
      
      .profile-dropdown.active {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateY(0) !important;
      }
      
      .dropdown-header {
        padding: 15px !important;
        border-bottom: 1px solid var(--border-main) !important;
        display: flex !important;
        align-items: center !important;
        flex-shrink: 0 !important;
      }
      
      .dropdown-avatar {
        width: 50px !important;
        height: 50px !important;
        border-radius: 50% !important;
        background-color: var(--primary-color) !important;
        color: var(--text-on-primary) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-weight: 600 !important;
        font-size: 18px !important;
        margin-right: 15px !important;
      }
      
      .dropdown-user-info {
        flex: 1 !important;
      }
      
      .dropdown-user-name {
        font-weight: 600 !important;
        color: var(--text-main) !important;
        font-size: 16px !important;
        margin-bottom: 3px !important;
      }
      
      .dropdown-user-email {
        font-size: 13px !important;
        color: var(--text-secondary) !important;
      }
      
      .dropdown-manage-account {
        font-size: 13px !important;
        color: var(--primary-color) !important;
        margin-top: 3px !important;
        cursor: pointer !important;
        font-weight: 500 !important;
      }
      
      .dropdown-manage-account:hover {
        text-decoration: underline !important;
      }
      
      .dropdown-content {
        padding: 8px 0 !important;
        overflow-y: auto !important;
        flex: 1 !important;
        max-height: 400px !important;
      }
      
      /* Custom scrollbar for dropdown */
      .dropdown-content::-webkit-scrollbar {
        width: 6px !important;
      }
      
      .dropdown-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05) !important;
        border-radius: 3px !important;
      }
      
      .dropdown-content::-webkit-scrollbar-thumb {
        background: rgba(139, 92, 246, 0.3) !important;
        border-radius: 3px !important;
        transition: background 0.3s ease !important;
      }
      
      .dropdown-content::-webkit-scrollbar-thumb:hover {
        background: rgba(139, 92, 246, 0.5) !important;
      }
      
      .dropdown-item {
        display: flex !important;
        align-items: center !important;
        padding: 10px 15px !important;
        cursor: pointer !important;
        transition: background-color 0.2s !important;
      }
      
      .dropdown-item:hover {
        background-color: rgba(139, 92, 246, 0.1) !important;
      }
      
      .dropdown-item-icon {
        margin-right: 15px !important;
        color: #e5e7eb !important;
        font-size: 16px !important;
        width: 20px !important;
        text-align: center !important;
      }
      
      .dropdown-item-text {
        font-size: 14px !important;
        color: white !important;
      }
      
      .dropdown-divider {
        height: 1px !important;
        background-color: rgba(0, 0, 0, 0.1) !important;
        margin: 8px 0 !important;
        flex-shrink: 0 !important;
      }
      
      .dropdown-logout {
        display: flex !important;
        align-items: center !important;
        padding: 10px 15px !important;
        cursor: pointer !important;
        transition: background-color 0.2s !important;
        flex-shrink: 0 !important;
        border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
        margin-top: auto !important;
      }
      
      .dropdown-logout:hover {
        background-color: rgba(139, 92, 246, 0.1) !important;
      }
      
      .dropdown-logout-icon {
        margin-right: 15px !important;
        color: #e5e7eb !important;
        font-size: 16px !important;
        width: 20px !important;
        text-align: center !important;
      }
      
      .dropdown-logout-text {
        font-size: 14px !important;
        color: white !important;
      }
      
      /* Main Content Area - MODIFIED TO INCREASE CARD SIZE */
      .main-content {
        flex: 1 !important; /* Fill all remaining space */
        width: 100% !important;
        padding: 5px 5px 0 5px !important; /* 0 bottom padding to reach edge */
        max-width: 1400px !important;
        margin: 0 auto !important;
        position: relative !important;
        z-index: 1 !important;
        display: flex !important;
        flex-direction: column !important;
      }
      
      @media (max-width: 768px) {
        #maincard {
          height: 100% !important;
          border-bottom-left-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important; /* Reset padding at bottom */
        }
      }
      
      .card {
        background: var(--bg-card) !important;
        backdrop-filter: blur(25px) !important;
        border-radius: 16px !important;
        border-bottom-left-radius: 0 !important; /* Flush to bottom on mobile */
        border-bottom-right-radius: 0 !important;
        padding: 12px !important; 
        /* Remove shadow/border based on user feedback */
        box-shadow: none !important;
        border: none !important;
        overflow-y: auto !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important; 
        height: 100% !important; /* Fill parent height */
      }
      
      .card::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 1px !important;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent) !important;
      }
      
      #maincard {
        background: var(--gradient-primary) !important;
        border: none !important;
        color: white !important;
        position: relative !important;
        /* Allow maincard to grow with content */
        display: flex !important;
        flex-direction: column !important;
        min-height: calc(100vh - 80px) !important; 
        height: auto !important; 
        overflow: visible !important;
      }
      
      /* Removed #maincard::before overlay */
      
      /* === NEW CSS RULE TO HIDE THE DUPLICATE HEADING === */
      #maincard h1 {
        display: none !important;
      }
      
      /* Enhanced scrollbar styling for cards */
      .card::-webkit-scrollbar {
        width: 8px !important;
        display: block !important;
      }
      
      .card::-webkit-scrollbar-track {
        background: var(--bg-section) !important;
        border-radius: 10px !important;
        margin: 3px !important;
      }
      
      .card::-webkit-scrollbar-thumb {
        background: var(--primary-color) !important;
        opacity: 0.6 !important;
        border-radius: 10px !important;
        border: 1px solid var(--glass-border) !important;
        transition: all 0.3s ease !important;
        display: block !important;
      }
      
      .card::-webkit-scrollbar-thumb:hover {
        opacity: 0.8 !important;
        background: var(--primary-color) !important;
      }
      
      /* Ensure scrollbar is always visible */
      .card {
        scrollbar-gutter: stable !important;
      }
      
      /* Home Page Styles - FIXED SIZES WITH HIGHER SPECIFICITY */
      .home-container {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
        gap: 20px !important;
        padding: 20px !important;
        width: 100% !important;
        z-index: 1 !important;
        position: relative !important;
      }
      
      .home-card {
        background: var(--bg-card) !important;
        border-radius: 16px !important;
        padding: 24px !important;
        box-shadow: var(--shadow-main) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        border: 1px solid var(--border-main) !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        min-height: 200px !important; 
        position: relative !important;
        overflow: hidden !important;
        color: var(--text-main) !important;
      }
      
      .home-card::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: var(--bg-section) !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        z-index: -1 !important;
      }
      
      .home-card:hover {
        transform: translateY(-5px) !important;
        box-shadow: var(--shadow-main) !important;
        border-color: var(--primary-color) !important;
      }
      
      .home-card:hover::before {
        opacity: 1 !important;
      }
      
      .home-card-icon {
        font-size: 48px !important; /* Fixed size in pixels */
        margin-bottom: 16px !important;
        display: block !important;
      }
      
      .home-card-title {
        font-size: 20px !important; /* Fixed size in pixels */
        font-weight: 600 !important;
        color: var(--text-main) !important;
        margin-bottom: 8px !important;
      }
      
      .home-card-description {
        font-size: 14px !important; /* Fixed size in pixels */
        color: #ffffff !important;
        line-height: 1.4 !important;
      }
      
      /* Modal styles */
      .modal {
        display: none !important;
        position: fixed !important;
        z-index: 2000 !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: auto !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
      }
      
      .modal-content {
        background-color: #fefefe !important;
        margin: 15% auto !important;
        padding: 20px !important;
        border: none !important;
        border-radius: 10px !important;
        width: 80% !important;
        max-width: 500px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
      }
      
      .modal-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 15px !important;
      }
      
      .modal-title {
        font-size: 18px !important;
        font-weight: 600 !important;
        color: #333 !important;
      }
      
      .close {
        color: #aaa !important;
        font-size: 28px !important;
        font-weight: bold !important;
        cursor: pointer !important;
      }
      
      .close:hover,
      .close:focus {
        color: #000 !important;
        text-decoration: none !important;
      }
      
      .modal-body {
        margin-bottom: 20px !important;
      }
      
      .form-group {
        margin-bottom: 15px !important;
      }
      
      .form-group label {
        display: block !important;
        margin-bottom: 5px !important;
        font-weight: 500 !important;
        color: #333 !important;
      }
      
      .form-group input,
      .form-group textarea,
      .form-group select {
        width: 100% !important;
        padding: 8px 12px !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        font-family: 'Poppins', sans-serif !important;
      }
      
      .form-group textarea {
        resize: vertical !important;
        min-height: 100px !important;
      }
      
      .modal-footer {
        display: flex !important;
        justify-content: flex-end !important;
        gap: 10px !important;
      }
      
      .btn {
        padding: 8px 16px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-family: 'Poppins', sans-serif !important;
        font-weight: 500 !important;
        transition: all 0.3s ease !important;
      }
      
      .btn-primary {
        background-color: var(--primary-color) !important;
        color: white !important;
      }
      
      .btn-primary:hover {
        background-color: #7c3aed !important;
      }
      
      .btn-secondary {
        background-color: #e5e7eb !important;
        color: #333 !important;
      }
      
      .btn-secondary:hover {
        background-color: #d1d5db !important;
      }
      
      /* Notification styles */
      .notification {
        position: fixed !important;
        top: 25px !important;
        right: 25px !important;
        background: rgba(15, 23, 42, 0.95) !important;
        backdrop-filter: blur(15px) !important;
        -webkit-backdrop-filter: blur(15px) !important;
        color: white !important;
        padding: 16px 24px !important;
        border-radius: 16px !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        z-index: 9999 !important;
        transform: translateX(150%) scale(0.9) !important;
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        display: flex !important;
        align-items: center !important;
        gap: 15px !important;
        max-width: 380px !important;
        overflow: hidden !important;
      }
      
      .notification.show {
        transform: translateX(0) scale(1) !important;
        opacity: 1 !important;
      }
      
      .notification-icon {
        font-size: 22px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .notification-message {
        font-weight: 500 !important;
        font-size: 15px !important;
        line-height: 1.4 !important;
        color: white !important;
        font-family: 'Poppins', sans-serif !important;
      }
      
      .notification-progress {
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        height: 3px !important;
        background: rgba(255, 255, 255, 0.3) !important;
        width: 100% !important;
        animation: notificationProgress 3s linear forwards !important;
      }
      
      @keyframes notificationProgress {
        from { width: 100%; }
        to { width: 0%; }
      }
      
      .notification.success {
        background: linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(16, 185, 129, 0.9)) !important;
        border: 1px solid rgba(16, 185, 129, 0.3) !important;
      }
      
      .notification.error {
        background: linear-gradient(135deg, rgba(127, 29, 29, 0.95), rgba(239, 68, 68, 0.9)) !important;
        border: 1px solid rgba(239, 68, 68, 0.3) !important;
      }
      
      .notification.info {
        background: linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(139, 92, 246, 0.9)) !important;
        border: 1px solid rgba(139, 92, 246, 0.3) !important;
      }
      
      /* Responsive design - Consolidated & Optimized */
      @media (max-width: 1024px) {
        .brand-apex {
          font-size: 1.2rem !important;
        }
        .navbar-brand {
          margin-right: 15px !important;
        }
        .home-container {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
          gap: 16px !important;
          padding: 16px !important;
        }
      }
      
      @media (max-width: 768px) {
        .navbar {
          height: 60px !important;
          padding: 0 12px !important;
          gap: 8px !important;
          justify-content: space-between !important;
        }
        .brand-apex {
          font-size: 1.0rem !important;
          letter-spacing: 0.5px !important;
        }
        .navbar-brand {
          margin-right: 8px !important;
        }
        .navbar-home button, .navbar-back button {
          padding: 8px 10px !important;
          font-size: 14px !important;
        }
      }
      
      @media (max-width: 480px) {
        .navbar {
          height: 54px !important;
          padding: 0 6px !important;
          gap: 4px !important;
        }
        .brand-apex {
          font-size: 0.85rem !important;
          letter-spacing: 0 !important;
        }
        .navbar-brand {
          margin-right: 4px !important;
        }
        /* Icon-only mode for small phones */
        .navbar-home button span:not(.home-icon),
        .navbar-back button span:not(.back-icon) {
          display: none !important;
        }
        .navbar-home button, .navbar-back button {
          padding: 6px !important;
          min-width: 34px !important;
          font-size: 16px !important;
          border-radius: 10px !important;
        }
        .navbar-right {
          gap: 4px !important;
        }
        .main-content {
          padding: 4px !important;
        }
        .home-container {
          grid-template-columns: 1fr 1fr !important;
          gap: 8px !important;
          padding: 8px !important;
        }
        .home-card {
          min-height: 120px !important;
          padding: 10px !important;
        }
        .home-card-icon {
          font-size: 32px !important;
        }
        .home-card-title {
          font-size: 14px !important;
        }
        .home-card-description {
          display: block !important;
        }
      }
    `;
        document.head.appendChild(themeStyles);
    }

    // Navigation handlers are managed globally through currentPage

    // Placeholder functions for navigation items

    // Hide legacy elements
    const legacyFooter = document.querySelector('footer');
    if (legacyFooter) legacyFooter.style.display = 'none';

    // Render the app HTML
    app.innerHTML = `
    <nav class="navbar">
      <div class="navbar-brand">
        <div class="brand-apex">MOOD GARDEN</div>
      </div>
      
      <ul class="navbar-menu">
        <!-- Navigation menu items can be added here if needed in future -->
      </ul>
      
      <div class="navbar-right">
        <div class="navbar-back">
          <button id="nav_back">
            <span class="back-icon">←</span>
            Back
          </button>
        </div>
        
        <div class="navbar-user" id="profileButton">
          <div class="profile-avatar-circle">
            ${getUserAvatar()}
            <div class="hamburger-indicator">
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </div>
          </div>
          <div class="profile-dropdown" id="profileDropdown">
            <div class="dropdown-header">
              <div class="dropdown-avatar">${getUserAvatar()}</div>
              <div class="dropdown-user-info">
                <div class="dropdown-user-name">${getDisplayName()}</div>
                <div class="dropdown-user-email">${state.user?.email || ''}</div>
              </div>
            </div>
            <div class="dropdown-content">
              <div class="dropdown-item" id="profileSettings">
                <span class="dropdown-item-icon">👤</span>
                <span class="dropdown-item-text">Profile Settings</span>
              </div>
              
              <div class="dropdown-item" id="privacySecurity">
                <span class="dropdown-item-icon">🔒</span>
                <span class="dropdown-item-text">Privacy & Security</span>
              </div>
              <div class="dropdown-item" id="exportData">
                <span class="dropdown-item-icon">💾</span>
                <span class="dropdown-item-text">Export Data</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" id="appearanceSettings">
                <span class="dropdown-item-icon">🌙</span>
                <span class="dropdown-item-text">Appearance: Light</span>
              </div>
              <div class="dropdown-item" id="notificationSettings">
                <span class="dropdown-item-icon">🔔</span>
                <span class="dropdown-item-text">Notifications</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" id="helpSupport">
                <span class="dropdown-item-icon">❓</span>
                <span class="dropdown-item-text">Help & Support</span>
              </div>

              <div class="dropdown-item" id="aboutApp">
                <span class="dropdown-item-icon">ℹ️</span>
                <span class="dropdown-item-text">About Mood Garden</span>
              </div>
            </div>
            <div class="dropdown-logout" id="logoutButton">
              <span class="dropdown-logout-icon">🚪</span>
              <span class="dropdown-logout-text">Sign out</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="main-content">
      <div class="card" id="maincard"></div>
    </div>
  `;

    // Profile dropdown functionality
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutButton = document.getElementById('logoutButton');

    // Toggle dropdown when profile button is clicked
    profileButton.addEventListener('click', function (e) {
        e.stopPropagation();
        const isActive = profileDropdown.classList.toggle('active');
        profileButton.classList.toggle('active', isActive);
        // Also toggle active on navbar-user if different
        document.querySelector('.navbar-user').classList.toggle('active', isActive);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        profileButton.classList.remove('active');
    });

    // Prevent dropdown from closing when clicking inside it
    profileDropdown.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Handle logout
    logoutButton.addEventListener('click', function () {
        setToken(null);
        state.user = null;
        localStorage.removeItem('currentPage'); // Clear saved page
        renderApp();
    });



    // Connect all dropdown items to their functions
    document.getElementById('profileSettings').addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        if (typeof showProfileSettingsPage === 'function') {
            showProfileSettingsPage();
        } else {
            showNotification('Profile Settings page would open here', 'info');
        }
    });

    document.getElementById('privacySecurity').addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        if (typeof showPrivacySecurityPage === 'function') {
            showPrivacySecurityPage();
        } else {
            showNotification('Privacy & Security page would open here', 'info');
        }
    });

    document.getElementById('exportData').addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        if (typeof showExportDataPage === 'function') {
            showExportDataPage();
        } else {
            showNotification('Export Data page would open here', 'info');
        }
    });

    document.getElementById('appearanceSettings').addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        if (typeof showAppearancePage === 'function') {
            showAppearancePage();
        } else {
            showNotification('Appearance Settings page would open here', 'info');
        }
    });

    document.getElementById('notificationSettings').addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        if (typeof showNotificationSettingsPage === 'function') {
            showNotificationSettingsPage();
        } else {
            showNotification('Notification Settings page would open here', 'info');
        }
    });


    document.getElementById('helpSupport').addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        if (typeof showHelpSupportPage === 'function') {
            showHelpSupportPage();
        } else {
            showNotification('Help & Support page would open here', 'info');
        }
    });



    document.getElementById('aboutApp').addEventListener('click', function () {
        profileDropdown.classList.remove('active');
        if (typeof showAboutPage === 'function') {
            showAboutPage();
        } else {
            showNotification('About page would open here', 'info');
        }
    });

    // Updated activateNav function to properly handle active states and save page
    function activateNav(id, callback) {
        // Remove active class from all nav buttons
        document.querySelectorAll('.navbar-menu button, .navbar-home button, .navbar-back button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        const activeButton = document.getElementById(id);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Save current page to localStorage
        saveCurrentPage(id);

        // Execute callback function
        if (typeof callback === 'function') {
            callback();
        }
    }

    function showHome() {
        // Only clear home-specific style overrides if they exist
        const homepageStyles = document.getElementById('home-page-styles');
        if (homepageStyles) homepageStyles.textContent = '';

        // Create a dedicated style element for home page
        let homePageStyles = document.getElementById('home-page-styles');
        if (!homePageStyles) {
            homePageStyles = document.createElement('style');
            homePageStyles.id = 'home-page-styles';
            document.head.appendChild(homePageStyles);
        }

        // Set styles with higher specificity
        homePageStyles.textContent = `
      /* Home Page Specific Styles with Maximum Specificity */
      #maincard .home-container {
        display: grid !important;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)) !important;
        gap: clamp(10px, 2vw, 20px) !important;
        padding: clamp(10px, 3vw, 20px) !important;
        width: 100% !important;
        max-width: 1400px !important;
        margin: 0 auto !important;
        z-index: 1 !important;
        position: relative !important;
        min-height: 100% !important; /* Ensure container fills card */
        align-content: center !important; /* Center cards vertically */
      }
      
      #maincard .home-card {
        background: var(--bg-card) !important;
        border-radius: 12px !important;
        padding: 16px !important;
        box-shadow: var(--shadow-main) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        border: 1px solid var(--border-main) !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        min-height: 160px !important; /* Reduced height to fit more */
        position: relative !important;
        overflow: hidden !important;
      }
      
      #maincard .home-card::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: var(--bg-section) !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        z-index: -1 !important;
      }
      
      #maincard .home-card:hover {
        transform: translateY(-5px) !important;
        box-shadow: var(--shadow-main) !important;
        border-color: var(--primary-color) !important;
      }
      
      #maincard .home-card:hover::before {
        opacity: 1 !important;
      }
      
      #maincard .home-card-icon {
        font-size: 40px !important; /* Reduced icon size slightly */
        margin-bottom: 12px !important;
        display: block !important;
      }
      
      #maincard .home-card-title {
        font-size: 18px !important; /* Reduced title size slightly */
        font-weight: 600 !important;
        color: var(--text-main) !important;
        margin-bottom: 6px !important;
      }
      
      #maincard .home-card-description {
        font-size: 13px !important; /* Reduced description size slightly */
        color: #ffffff !important;
        line-height: 1.3 !important;
      }
      
      /* Responsive design with higher specificity */
      @media (max-width: 1024px) {
        #maincard .home-container {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
          gap: 12px !important;
          padding: 12px !important;
        }
        
        #maincard .home-card {
          min-height: 150px !important; 
        }
        
        #maincard .home-card-icon {
          font-size: 36px !important;
        }
        
        #maincard .home-card-title {
          font-size: 16px !important;
        }
        
        #maincard .home-card-description {
          font-size: 12px !important;
        }
      }
      
      @media (max-width: 768px) {
        #maincard .home-container {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
          gap: 10px !important;
          padding: 10px !important;
        }
        
        #maincard .home-card {
          min-height: 140px !important;
          padding: 12px !important;
        }
        
        #maincard .home-card-icon {
          font-size: 32px !important;
          margin-bottom: 8px !important;
        }
        
        #maincard .home-card-title {
          font-size: 15px !important;
        }
        
        #maincard .home-card-description {
          font-size: 11px !important;
        }
      }
      
      /* Mobile Vertical Card Stack Layout */
      @media (max-width: 600px) {
        #maincard .home-container {
          grid-template-columns: 1fr !important; /* Force Single Column */
          gap: 16px !important;
          padding: 20px !important;
        }
        
        #maincard .home-card {
          min-height: 140px !important;
          padding: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
        }
        
        #maincard .home-card-icon {
          font-size: 42px !important;
          margin-bottom: 12px !important;
          display: block !important;
        }
        
        
        #maincard .home-card-title {
          font-size: 18px !important;
          font-weight: 600 !important;
          margin-bottom: 4px !important;
        }
        
        /* Restore descriptions on mobile */
        #maincard .home-card-description {
          display: block !important;
          font-size: 13px !important; /* Slightly larger for readability */
          opacity: 0.9 !important;
          line-height: 1.4 !important;
          max-width: 90% !important; /* Prevent text from hitting edges */
        }
      }
    `;

        document.getElementById('maincard').innerHTML = `
      <div class="home-container">
        <div class="home-card" onclick="activateNav('nav_new', showNewEntry)">
          <span class="home-card-icon">📝</span>
          <h3 class="home-card-title">New Entry</h3>
          <p class="home-card-description">Record your thoughts and feelings</p>
        </div>
        
        <div class="home-card" onclick="activateNav('nav_notes', showNotes)">
          <span class="home-card-icon">📚</span>
          <h3 class="home-card-title">My Notes</h3>
          <p class="home-card-description">Review your past entries</p>
        </div>
        
        <div class="home-card" onclick="activateNav('nav_stats', showStats)">
          <span class="home-card-icon">📊</span>
          <h3 class="home-card-title">Weekly Evaluation</h3>
          <p class="home-card-description">Track your mood patterns</p>
        </div>
        
        <div class="home-card" onclick="activateNav('nav_help', showHelp)">
          <span class="home-card-icon">🧑‍⚕️</span>
          <h3 class="home-card-title">Professional Help</h3>
          <p class="home-card-description">Find mental health resources</p>
        </div>
        
        <div class="home-card" onclick="activateNav('nav_sounds', showSounds)">
          <span class="home-card-icon">🎵</span>
          <h3 class="home-card-title">Relaxing Sounds</h3>
          <p class="home-card-description">Listen to calming audio</p>
        </div>
        
        <div class="home-card" onclick="activateNav('nav_person', showPersonality)">
          <span class="home-card-icon">🧠</span>
          <h3 class="home-card-title">Personality</h3>
          <p class="home-card-description">Explore your personality traits</p>
        </div>
        
        <div class="home-card" onclick="activateNav('nav_motivation', showMotivation)">
          <span class="home-card-icon">💪</span>
          <h3 class="home-card-title">Motivation</h3>
          <p class="home-card-description">Get inspired and stay positive</p>
        </div>
        
        <div class="home-card" onclick="activateNav('nav_chat', showChatbot)">
          <span class="home-card-icon">🤖</span>
          <h3 class="home-card-title">Chatbot</h3>
          <p class="home-card-description">Talk with our AI assistant</p>
        </div>
      </div>
    `;
    }

    // Make the logo act as a home button
    const brandLogo = document.querySelector('.brand-apex');
    if (brandLogo) {
        brandLogo.onclick = () => activateNav('nav_home', showHome);
    }

    // Add back button functionality - always goes back to home page
    const backBtn = document.getElementById('nav_back');
    if (backBtn) {
        backBtn.onclick = () => {
            // Always navigate back to home page
            activateNav('nav_home', showHome);
        };
    }

    // Get saved page and navigate to it
    const savedPage = getSavedPage();

    // Set initial active state for saved page
    document.getElementById(savedPage)?.classList.add('active');

    // List of deleted/ghost pages
    const deletedPages = ['page_mood_statistics', 'page_feedback', 'page_send_feedback', 'page_stats', 'weekly_stats'];

    // Navigate to saved page using activateNav to ensure proper state management
    if (savedPage && deletedPages.includes(savedPage)) {
        console.log(`Preventing restoration of ghost page: ${savedPage}`);
        activateNav('nav_home', showHome);
    } else {
        switch (savedPage) {
            case 'page_home':
                activateNav('nav_home', showHome);
                break;
            case 'page_entry':
                activateNav('nav_new', showNewEntry);
                break;
            case 'page_notes':
                activateNav('nav_notes', showNotes);
                break;
            case 'page_stats':
            case 'weekly_stats':
                activateNav('nav_stats', showStats);
                break;
            case 'page_help':
                activateNav('nav_help', showHelp);
                break;
            case 'page_sounds':
                activateNav('nav_sounds', showSounds);
                break;
            case 'page_personality':
                activateNav('nav_person', showPersonality);
                break;
            case 'page_motivation':
                activateNav('nav_motivation', showMotivation);
                break;
            case 'page_chatbot':
                activateNav('nav_chat', showChatbot);
                break;
            default:
                activateNav('nav_home', showHome);
        }
    }

    // Fetch entries if the function exists
    if (typeof fetchEntries === 'function') {
        fetchEntries();
    }
}
// Add missing function to fix renderHeaderAnimation error
function renderHeaderAnimation() {
    // Empty function to prevent error
    console.log('Header animation called');
}
async function fetchEntries() { const r = await api('/entries?limit=200'); if (r?.entries) state.entries = r.entries; }
function activateNav(id, fn) {
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('active'));
    const el = document.getElementById(id); if (el) el.classList.add('active'); fn();
}
function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
/* ---- PAGES ---- */
function showNewEntry() {
    saveCurrentPage('page_entry');
    const main = document.getElementById('maincard');
    main.innerHTML = `
    <div class="entry-container">
      <div class="entry-header">
        <h2 class="entry-title">
          <span class="title-emoji">📝</span>
          <span>New Entry</span>
        </h2>
        <div class="entry-subtitle">Record your thoughts and feelings</div>
      </div>
      
      <div class="scroll-container">
        <div class="entry-content">
          <div class="section">
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
          </div>
          
          <div class="section">
            <div class="section-title">
              <span class="section-emoji">😊</span>
              <span>How are you feeling?</span>
            </div>
            <div class="mood-options" id="moodOptions">
              <!-- Mood options will be dynamically added here -->
            </div>
          </div>
          
          <div class="section thoughts-section">
            <div class="section-title">
              <span class="section-emoji">✍️</span>
              <span>Your Thoughts</span>
            </div>
            <div class="text-container">
              <textarea 
                id="entryText" 
                class="entry-textarea" 
                placeholder="How are you feeling today? Share your thoughts..."
                rows="4"
              ></textarea>
              <div class="text-counter">
                <span id="charCount">0</span> / <span id="charLimit">500</span>
              </div>
              <div id="validationFeedback" class="validation-feedback"></div>
            </div>
          </div>
          
          <div class="section">
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
          </div>
        </div>
      </div>

      <!-- Footer positioned inside to grow with container -->
      <div class="entry-footer">
        <div class="footer-text">
          <span>Your entries are private and secure</span>
        </div>
      </div>
    </div>
  `;

    // Add styles once
    addEntryStyles();

    // Check if Lottie is already loaded
    if (typeof lottie === 'undefined') {
        // Add Lottie library if not already loaded
        if (!document.getElementById('lottie-script')) {
            const lottieScript = document.createElement('script');
            lottieScript.id = 'lottie-script';
            lottieScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
            document.head.appendChild(lottieScript);

            lottieScript.onload = () => {
                // Initialize functionality after Lottie loads
                initializeEntryFunctionality();
            };

            // Fallback in case script fails to load
            lottieScript.onerror = () => {
                console.warn('Lottie library failed to load, using fallback emojis');
                initializeEntryFunctionality();
            };
        } else {
            // Script tag exists but lottie not loaded yet
            const checkLottie = setInterval(() => {
                if (typeof lottie !== 'undefined') {
                    clearInterval(checkLottie);
                    initializeEntryFunctionality();
                }
            }, 100);

            // Timeout after 3 seconds
            setTimeout(() => {
                clearInterval(checkLottie);
                console.warn('Lottie loading timeout, using fallback emojis');
                initializeEntryFunctionality();
            }, 3000);
        }
    } else {
        // Lottie is already loaded
        initializeEntryFunctionality();
    }
}
function addEntryStyles() {
    // Only add styles if not already present
    if (!document.getElementById('entry-enhanced-styles')) {
        const entryStyles = document.createElement('style');
        entryStyles.id = 'entry-enhanced-styles';
        entryStyles.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      #maincard {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      
      .entry-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--gradient-primary);
        position: relative;
        overflow: hidden;
        min-height: 0; /* Important for flexbox */
      }
      
      .entry-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.05" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
        background-size: cover;
        pointer-events: none;
        z-index: 1;
      }
      
      .entry-header {
        position: relative;
        z-index: 10;
        text-align: center;
        padding: 0.8rem 1.5rem 0.5rem; /* Reduced padding */
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }
      
      .entry-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem; /* Reduced gap */
        font-size: 1.6rem; /* Reduced font size */
        font-weight: 700;
        color: white;
        margin-bottom: 0.4rem; /* Reduced margin */
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        letter-spacing: -0.02em;
      }
      
      .title-emoji {
        font-size: 2.5rem; /* Increased from 2rem */
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(5deg); }
      }
      
      .entry-subtitle {
        font-size: 0.9rem; /* Reduced font size */
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
        letter-spacing: 0.02em;
      }
      
      .scroll-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        position: relative;
        z-index: 5;
        padding: 1rem; /* Reduced padding */
        display: flex;
        flex-direction: column;
        min-height: 0; /* Important for flexbox scrolling */
      }
      
      .scroll-container::-webkit-scrollbar {
        width: 8px; /* Reduced scrollbar width */
      }
      
      .scroll-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        margin: 3px 0;
      }
      
      .scroll-container::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .scroll-container::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(168, 85, 247, 1));
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .entry-content {
        display: flex;
        flex-direction: column;
        gap: 0.8rem; /* Reduced gap */
        max-width: 1000px;
        margin: 0 auto;
        width: 100%;
        flex: 1;
      }
      
      .section {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border-radius: 12px;
        padding: 0.8rem;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      /* Make the thoughts section flexible to fill height */
      .thoughts-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 180px;
      }
      
      .section:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      }
      
      .section-title {
        display: flex;
        align-items: center;
        gap: 0.5rem; /* Reduced gap */
        margin-bottom: 0.6rem; /* Reduced margin */
        font-size: 1.1rem; /* Reduced font size */
        font-weight: 600;
        color: white;
        letter-spacing: 0.01em;
      }
      
      .section-emoji {
        font-size: 1.8rem; /* Increased from 1.4rem */
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
      
      .prompt-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px; /* Reduced border radius */
        padding: 0.8rem; /* Reduced padding */
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .prompt-card:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.02);
      }
      
      .prompt-text {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem; /* Reduced font size */
        line-height: 1.5; /* Reduced line height */
        flex: 1;
        font-style: italic;
        letter-spacing: 0.01em;
      }
      
      .refresh-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 40px; /* Increased from 36px */
        height: 40px; /* Increased from 36px */
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .refresh-btn:hover {
        background: rgba(168, 85, 247, 0.4);
        transform: rotate(180deg) scale(1.1);
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3);
      }
      
      .btn-emoji {
        font-size: 1.5rem; /* Increased from 1.2rem */
      }
      
      .mood-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); /* Reduced min-width */
        gap: 0.6rem; /* Reduced gap */
      }
      
      .mood-option {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px; /* Reduced border radius */
        padding: 0.6rem; /* Reduced padding */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        height: 80px; /* Increased from 70px */
        position: relative;
        overflow: hidden;
      }
      
      .mood-option:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-3px);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      
      .mood-option.selected {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      }
      
      .mood-emoji {
        font-size: 2.2rem; /* Increased from 1.8rem */
        margin-bottom: 0.3rem; /* Reduced margin */
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        transition: transform 0.3s ease;
      }
      
      .mood-option:hover .mood-emoji {
        transform: scale(1.2);
      }
      
      .mood-label {
        font-size: 0.75rem; /* Reduced font size */
        color: rgba(255, 255, 255, 0.9);
        text-align: center;
        font-weight: 500;
        letter-spacing: 0.02em;
      }
      
      .text-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }
      
      .entry-textarea {
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 0.8rem;
        color: white;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        resize: none;
        line-height: 1.5;
        transition: all 0.3s ease;
        box-sizing: border-box;
        flex: 1;
        min-height: 100px;
      }
      
      .entry-textarea:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
      }
      
      .entry-textarea::placeholder {
        color: rgba(255, 255, 255, 0.7);
        font-style: italic;
      }
      
      .text-counter {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.4rem; /* Reduced margin */
        font-size: 0.8rem; /* Reduced font size */
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }
      
      .validation-feedback {
        margin-top: 0.4rem; /* Reduced margin */
        font-size: 0.75rem; /* Reduced font size */
        color: #000000;
        min-height: 1rem; /* Reduced height */
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.3rem; /* Reduced gap */
      }
      
      .validation-feedback::before {
        content: '⚠️';
        font-size: 0.9rem; /* Reduced font size */
      }
      
      .grammar-feedback {
        margin-top: 0.4rem; /* Reduced margin */
        font-size: 0.75rem; /* Reduced font size */
        color: #fbbf24;
        min-height: 1rem; /* Reduced height */
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.3rem; /* Reduced gap */
      }
      
      .grammar-feedback::before {
        content: '📝';
        font-size: 0.9rem; /* Reduced font size */
      }
      
      .action-buttons {
        display: flex;
        gap: 0.8rem; /* Reduced gap */
        justify-content: center;
        margin-top: 0.4rem; /* Reduced margin */
      }
      
      .action-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem; /* Reduced gap */
        padding: 0.6rem 1.2rem; /* Reduced padding */
        border: none;
        border-radius: 10px; /* Reduced border radius */
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem; /* Reduced font size */
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 0.02em;
      }
      
      .action-btn.primary {
        background: var(--gradient-primary);
        color: white;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
      }
      
      .action-btn.primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
      }
      
      .action-btn.secondary {
        background: rgba(168, 85, 247, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .action-btn.secondary:hover {
        background: rgba(168, 85, 247, 0.3);
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
      }
      
      /* Footer stays within layout flow */
      .entry-footer {
        z-index: 1000;
        text-align: center;
        padding: 0.6rem 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
      }
      
      .footer-text {
        font-size: 0.8rem; /* Reduced font size */
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
        letter-spacing: 0.02em;
      }
      
      /* Responsive Design */
      @media (max-width: 1200px) {
        .entry-content {
          max-width: 900px;
        }
        
        .mood-options {
          grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
        }
      }
      
      @media (max-width: 768px) {
        .entry-header {
          padding: 0.6rem 1.2rem 0.4rem;
        }
        
        .entry-title {
          font-size: 1.4rem;
          gap: 0.4rem;
        }
        
        .title-emoji {
          font-size: 2rem; /* Adjusted for mobile */
        }
        
        .entry-subtitle {
          font-size: 0.8rem;
        }
        
        .scroll-container {
          padding: 0.8rem;
        }
        
        .entry-content {
          gap: 0.6rem;
        }
        
        .section {
          padding: 0.6rem;
          border-radius: 10px;
        }
        
        .section-title {
          font-size: 1rem;
          gap: 0.4rem;
          margin-bottom: 0.5rem;
        }
        
        .section-emoji {
          font-size: 1.5rem; /* Adjusted for mobile */
        }
        
        .prompt-card {
          padding: 0.6rem;
        }
        
        .prompt-text {
          font-size: 0.85rem;
        }
        
        .refresh-btn {
          width: 36px;
          height: 36px;
        }
        
        .btn-emoji {
          font-size: 1.3rem; /* Adjusted for mobile */
        }
        
        .mood-options {
          grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
          gap: 0.5rem;
        }
        
        .mood-option {
          padding: 0.5rem;
          height: 70px;
          border-radius: 8px;
        }
        
        .mood-emoji {
          font-size: 1.8rem; /* Adjusted for mobile */
          margin-bottom: 0.3rem;
        }
        
        .mood-label {
          font-size: 0.65rem;
        }
        
        .entry-textarea {
          padding: 0.6rem;
          font-size: 0.85rem;
          min-height: 70px;
        }
        
        .text-counter {
          font-size: 0.7rem;
          margin-top: 0.3rem;
        }
        
        .validation-feedback {
          font-size: 0.65rem;
          margin-top: 0.3rem;
        }
        
        .grammar-feedback {
          font-size: 0.65rem;
          margin-top: 0.3rem;
        }
        
        .action-buttons {
          gap: 0.6rem;
          margin-top: 0.3rem;
        }
        
        .action-btn {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          gap: 0.3rem;
          border-radius: 8px;
        }
        
        .entry-footer {
          padding: 0.5rem 1.2rem;
        }
        
        .footer-text {
          font-size: 0.7rem;
        }
      }
      
      @media (max-width: 480px) {
        .entry-header {
          padding: 0.5rem 1rem 0.3rem;
        }
        
        .entry-title {
          font-size: 1.2rem;
          gap: 0.3rem;
        }
        
        .title-emoji {
          font-size: 1.8rem; /* Adjusted for small screens */
        }
        
        .entry-subtitle {
          font-size: 0.75rem;
        }
        
        .scroll-container {
          padding: 0.6rem;
        }
        
        .entry-content {
          gap: 0.5rem;
        }
        
        .section {
          padding: 0.5rem;
        }
        
        .section-title {
          font-size: 0.9rem;
          gap: 0.3rem;
          margin-bottom: 0.4rem;
        }
        
        .section-emoji {
          font-size: 1.3rem; /* Adjusted for small screens */
        }
        
        .prompt-card {
          padding: 0.5rem;
        }
        
        .prompt-text {
          font-size: 0.8rem;
        }
        
        .refresh-btn {
          width: 32px;
          height: 32px;
        }
        
        .btn-emoji {
          font-size: 1.2rem; /* Adjusted for small screens */
        }
        
        .mood-options {
          grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
          gap: 0.4rem;
        }
        
        .mood-option {
          padding: 0.4rem;
          height: 60px;
          border-radius: 6px;
        }
        
        .mood-emoji {
          font-size: 1.6rem; /* Adjusted for small screens */
          margin-bottom: 0.2rem;
        }
        
        .mood-label {
          font-size: 0.6rem;
        }
        
        .entry-textarea {
          padding: 0.5rem;
          font-size: 0.8rem;
          min-height: 60px;
        }
        
        .text-counter {
          font-size: 0.65rem;
          margin-top: 0.2rem;
        }
        
        .validation-feedback {
          font-size: 0.6rem;
          margin-top: 0.2rem;
        }
        
        .grammar-feedback {
          font-size: 0.6rem;
          margin-top: 0.2rem;
        }
        
        .action-buttons {
          gap: 0.5rem;
          margin-top: 0.2rem;
        }
        
        .action-btn {
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          gap: 0.2rem;
          border-radius: 6px;
        }
        
        .entry-footer {
          padding: 0.4rem 1rem;
        }
        
        .footer-text {
          font-size: 0.65rem;
        }
      }
      
      /* Animation for valid state */
      .entry-textarea.valid {
        border-color: #86efac;
        box-shadow: 0 0 0 4px rgba(134, 239, 172, 0.2);
      }
      
      .entry-textarea.invalid {
        border-color: #f87171;
        box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.2);
      }
    `;

        document.head.appendChild(entryStyles);
    }
}
function initializeEntryFunctionality() {
    const prompts = [
        "What are three things you're grateful for today?",
        "Describe a moment that made you smile today.",
        "What challenge did you overcome today?",
        "What's something new you learned today?",
        "Who made a positive impact on your day?",
        "What would make tomorrow even better?",
        "Describe your favorite part of today.",
        "What emotion is most prominent for you today?",
        "What's one thing you'd like to remember about today?"
    ];

    const moods = [
        { k: 'happy', e: 'Happy.json', label: 'Happy', emoji: '😊' },
        { k: 'sad', e: 'Sad Emoji.json', label: 'Sad', emoji: '😢' },
        { k: 'anxious', e: 'emoji head explosion.json', label: 'Anxious', emoji: '😰' },
        { k: 'angry', e: 'Angry.json', label: 'Angry', emoji: '😠' },
        { k: 'neutral', e: 'Neutral face.json', label: 'Neutral', emoji: '😐' },
        { k: 'hopeful', e: 'Party.json', label: 'Hopeful', emoji: '🌟' }
    ];

    let selectedMood = null;
    let lottieAvailable = typeof lottie !== 'undefined';
    let moodAnimations = {};



    // Initialize prompt
    function loadNewPrompt() {
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        const promptText = document.getElementById('promptText');
        promptText.style.opacity = '0';

        setTimeout(() => {
            promptText.textContent = randomPrompt;
            promptText.style.opacity = '1';
        }, 300);
    }

    // Initialize mood options
    function initializeMoodOptions() {
        const moodOptionsContainer = document.getElementById('moodOptions');
        moodOptionsContainer.innerHTML = '';

        moods.forEach(mood => {
            const moodOption = document.createElement('div');
            moodOption.className = 'mood-option';
            moodOption.setAttribute('data-mood', mood.k);

            if (lottieAvailable) {
                const lottieContainer = document.createElement('div');
                lottieContainer.className = 'lottie-container';
                lottieContainer.style.width = '30px'; // Increased from 24px
                lottieContainer.style.height = '30px'; // Increased from 24px

                const moodEmoji = document.createElement('div');
                moodEmoji.className = 'mood-emoji';
                moodEmoji.appendChild(lottieContainer);

                moodOption.appendChild(moodEmoji);

                try {
                    const animation = lottie.loadAnimation({
                        container: lottieContainer,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        path: mood.e
                    });

                    moodAnimations[mood.k] = animation;
                } catch (error) {
                    console.warn(`Failed to load Lottie animation for ${mood.k}:`, error);
                    lottieAvailable = false;
                    renderEmojiFallback(lottieContainer, mood.emoji);
                }
            } else {
                const moodEmoji = document.createElement('div');
                moodEmoji.className = 'mood-emoji';
                moodEmoji.textContent = mood.emoji;
                moodOption.appendChild(moodEmoji);
            }

            const moodLabel = document.createElement('div');
            moodLabel.className = 'mood-label';
            moodLabel.textContent = mood.label;
            moodOption.appendChild(moodLabel);

            moodOption.addEventListener('click', () => selectMood(mood.k));
            moodOptionsContainer.appendChild(moodOption);
        });
    }

    function renderEmojiFallback(container, emoji) {
        container.innerHTML = emoji;
    }

    // Select mood
    function selectMood(mood) {
        // Remove previous selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Add selection to clicked mood
        const selectedOption = document.querySelector(`[data-mood="${mood}"]`);
        selectedOption.classList.add('selected');

        selectedMood = mood;

        // Check mood-text consistency when mood is selected
        if (document.getElementById('entryText').value.trim()) {
            updateValidationFeedback();
        }
    }

    // Sentiment analysis function
    function analyzeSentiment(text) {
        const lowerText = text.toLowerCase();

        // Define sentiment keywords - Refined to prevent overlap
        const positiveWords = ['happy', 'relieved', 'good', 'better', 'calm', 'hopeful', 'grateful', 'love', 'excited', 'wonderful', 'amazing', 'glad', 'joy', 'peaceful'];
        const negativeWords = ['sad', 'depressed', 'hopeless', 'worthless', 'tired', 'lonely', 'hate', 'miserable', 'unhappy', 'gloomy'];
        const anxiousWords = ['anxious', 'worried', 'nervous', 'stressed', 'tense', 'panic', 'fear', 'scared', 'uneasy'];
        const angryWords = ['angry', 'mad', 'irritated', 'annoyed', 'frustrated', 'furious', 'pissed', 'enraged'];

        // Count sentiment words
        let positiveCount = 0;
        let negativeCount = 0;
        let anxiousCount = 0;
        let angryCount = 0;

        // Helper to count occurrences
        const countMatches = (list) => {
            let count = 0;
            list.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = lowerText.match(regex);
                if (matches) count += matches.length;
            });
            return count;
        };

        positiveCount = countMatches(positiveWords);
        negativeCount = countMatches(negativeWords);
        anxiousCount = countMatches(anxiousWords);
        angryCount = countMatches(angryWords);

        // Determine dominant sentiment
        const sentimentCounts = {
            happy: positiveCount,
            sad: negativeCount,
            anxious: anxiousCount,
            angry: angryCount
        };

        let dominantSentiment = 'neutral';
        let maxCount = 0;

        for (const [sentiment, count] of Object.entries(sentimentCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominantSentiment = sentiment;
            }
        }

        // Neutral if no matches found
        if (maxCount === 0) dominantSentiment = 'neutral';

        return {
            sentiment: dominantSentiment,
            counts: sentimentCounts
        };
    }

    // Check if selected mood matches analyzed sentiment
    function checkMoodConsistency(mood, text) {
        const analysis = analyzeSentiment(text);
        const sentiment = analysis.sentiment;

        // If analysis is neutral, allow any mood (prevents blocking users writing short/neutral things)
        if (sentiment === 'neutral') return true;

        // Define consistency mapping
        // Key: Analyzed Sentiment, Value: Allowed Moods (from the 'moods' array keys)
        const consistencyMap = {
            'happy': ['happy', 'hopeful', 'neutral'],
            'sad': ['sad', 'anxious', 'neutral'],
            'anxious': ['anxious', 'sad', 'neutral'],
            'angry': ['angry', 'anxious', 'neutral']
        };

        const allowedMoods = consistencyMap[sentiment] || [];
        return allowedMoods.includes(mood);
    }

    // Reordered validation function following the specified priority order
    function validateEntry(text) {
        const errors = [];

        // Basic checks first
        if (typeof text !== 'string') {
            errors.push('Entry must be text');
            return { valid: false, errors };
        }

        const trimmed = text.trim();

        if (trimmed.length === 0) {
            errors.push('Entry cannot be empty');
            return { valid: false, errors };
        }

        if (trimmed.length < 10) {
            errors.push('Entry must be at least 10 characters long');
            return { valid: false, errors };
        }

        if (trimmed.length > 500) {
            errors.push('Entry cannot exceed 500 characters');
            return { valid: false, errors };
        }

        if (!/^[a-zA-Z0-9\s.,!?'"-]+$/.test(trimmed)) {
            errors.push('Entry contains invalid characters');
            return { valid: false, errors };
        }

        // Mood consistency check if mood is selected
        if (selectedMood && !checkMoodConsistency(selectedMood, trimmed)) {
            errors.push('The selected mood doesn\'t match your entry\'s tone');
            return { valid: false, errors, isMoodMismatch: true };
        }

        return { valid: true, errors: [] };
    }

    // Character counter with enhanced visual feedback
    function updateCharCounter() {
        const textarea = document.getElementById('entryText');
        const charCount = document.getElementById('charCount');
        const charLimit = document.getElementById('charLimit');

        const currentLength = textarea.value.length;
        const entryText = textarea.value.trim();
        charCount.textContent = currentLength;

        // Update color based on validation status
        if (currentLength > 500) {
            charCount.style.color = '#f87171';
            charLimit.style.color = '#f87171';
        } else if (currentLength > 400) {
            charCount.style.color = '#fbbf24';
            charLimit.style.color = 'rgba(255, 255, 255, 0.7)';
        } else if (entryText.length > 0 && entryText.length < 10) {
            charCount.style.color = '#fbbf24';
            charLimit.style.color = 'rgba(255, 255, 255, 0.7)';
        } else if (entryText.length > 0) {
            // Check if current text passes validation
            const validation = validateEntry(entryText);
            if (validation.valid) {
                charCount.style.color = '#86efac'; // Light green for valid
                charLimit.style.color = 'rgba(255, 255, 255, 0.7)';
            } else {
                charCount.style.color = '#f87171'; // Red for invalid
                charLimit.style.color = 'rgba(255, 255, 255, 0.7)';
            }
        } else {
            charCount.style.color = 'rgba(255, 255, 255, 0.7)';
            charLimit.style.color = 'rgba(255, 255, 255, 0.7)';
        }
    }

    // Real-time validation feedback
    function updateValidationFeedback() {
        const textarea = document.getElementById('entryText');
        const entryText = textarea.value.trim();
        const feedback = document.getElementById('validationFeedback');

        if (entryText.length === 0) {
            feedback.textContent = '';
            textarea.classList.remove('valid', 'invalid', 'grammar-warning', 'mood-mismatch');
            return;
        }

        const validation = validateEntry(entryText);

        if (validation.valid) {
            feedback.textContent = '';
            textarea.classList.remove('invalid', 'grammar-warning', 'mood-mismatch');
            textarea.classList.add('valid');
        } else {
            feedback.textContent = validation.errors[0]; // Show first error in priority order
            textarea.classList.remove('valid', 'grammar-warning');
            textarea.classList.add('invalid');

            if (validation.isMoodMismatch) {
                textarea.classList.add('mood-mismatch');
            } else {
                textarea.classList.remove('mood-mismatch');
            }
        }
    }

    // Save entry with strict validation
    function saveEntry(isDraft = false) {
        const entryText = document.getElementById('entryText').value.trim();

        if (!selectedMood && !isDraft) {
            showNotification('Please select a mood before saving.', 'error');
            return;
        }

        // Validate entry
        const validation = validateEntry(entryText);

        if (!validation.valid) {
            showNotification(validation.errors[0], 'error');
            return;
        }

        const entry = {
            id: `entry-${Date.now()}`,
            text: entryText,
            mood: selectedMood,
            createdAt: new Date().toISOString(),
            isDraft: isDraft
        };

        // Get existing entries
        let entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        entries.push(entry);

        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(entries));

        // Show success message
        showNotification(isDraft ? 'Draft saved successfully!' : 'Entry saved successfully!', 'success');

        // Reset form
        document.getElementById('entryText').value = '';
        updateCharCounter();
        updateValidationFeedback();
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.remove('selected');
        });
        selectedMood = null;

        // Load new prompt
        loadNewPrompt();
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        if (type === 'error') {
            notification.style.background = 'rgba(239, 68, 68, 0.9)'; // Brighter red
        } else {
            notification.style.background = 'rgba(34, 197, 94, 0.9)'; // Brighter green
        }

        notification.style.position = 'fixed';
        notification.style.bottom = '30px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '12px';
        notification.style.color = 'white';
        notification.style.fontWeight = '600';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        notification.style.fontSize = '0.9rem';
        notification.style.letterSpacing = '0.01em';
        notification.style.textAlign = 'center';
        notification.style.minWidth = '200px';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(-10px)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000); // Slightly longer visible time
    }

    // Event listeners
    document.getElementById('refreshPrompt').addEventListener('click', loadNewPrompt);
    document.getElementById('entryText').addEventListener('input', () => {
        updateCharCounter();
        updateValidationFeedback();
    });
    document.getElementById('saveDraft').addEventListener('click', () => saveEntry(true));
    document.getElementById('saveEntry').addEventListener('click', () => saveEntry(false));

    // Initialize components
    loadNewPrompt();
    initializeMoodOptions();
}
function showStats() {
    localStorage.setItem("currentPage", "weekly_stats");
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
          <button class="control-btn" id="debugBtn" title="Debug data">
            <span class="control-emoji">🔍</span>
            <span class="control-text">Debug</span>
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

    // Load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(chartScript);

        // Wait for Chart.js to load
        chartScript.onload = () => {
            initializeStats();
        };
    } else {
        initializeStats();
    }

    // Enhanced CSS for stats page - EXPANDED VERSION
    const statsStyles = document.createElement('style');
    statsStyles.id = 'stats-enhanced-styles';
    statsStyles.textContent = `
    /* Main container with proper scrolling - EXPANDED */
    .stats-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: var(--gradient-primary);
      border-radius: 1.2rem;
      box-shadow: 0 15px 30px rgba(156, 39, 176, 0.25);
      color: white;
      height: 100%;
      overflow-y: auto;
      position: relative;
    }
    
    /* Custom scrollbar for the main container */
    .stats-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .stats-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .stats-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.4);
      border-radius: 4px;
    }
    
    .stats-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.6);
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
      pointer-events: none;
    }
    
    /* Header Styles - EXPANDED */
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
      gap: 0.8rem;
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2.2rem;
      animation: sparkle 2s ease-in-out infinite;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
    }
    
    @keyframes sparkle {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(5deg); }
    }
    
    .stats-controls {
      display: flex;
      gap: 0.8rem;
    }
    
    .control-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.8rem 1.2rem;
      border: none;
      border-radius: 2rem;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      font-size: 0.9rem;
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
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
    }
    
    .control-btn:active {
      transform: translateY(0);
    }
    
    .control-emoji {
      font-size: 1.1rem;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }
    
    .control-text {
      font-weight: 600;
    }
    
    /* Stats Grid - EXPANDED */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      position: relative;
      z-index: 1;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
      min-height: 280px;
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
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.25);
    }
    
    .stat-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      display: block;
      text-align: center;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .stat-content {
      color: white;
    }
    
    .stat-title {
      margin: 0 0 1rem 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: white;
      text-align: center;
    }
    
    .chart-container {
      position: relative;
      height: 200px;
      width: 100%;
    }
    
    /* Summary Stats - EXPANDED */
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .summary-item {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
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
      transform: scale(1.05);
    }
    
    .summary-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 0.5rem;
    }
    
    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }
    
    /* Insights with improved scrollbar - EXPANDED */
    .insights {
      max-height: 200px;
      overflow-y: auto;
      padding-right: 0.5rem;
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
    
    .insights::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    .insight-item {
      padding: 0.8rem;
      margin-bottom: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      font-size: 0.9rem;
      color: white;
      animation: slideIn 0.5s ease-out;
      border-left: 3px solid;
      transition: all 0.3s ease;
    }
    
    .insight-item:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateX(5px);
    }
    
    .insight-item.positive {
      border-left-color: #9c27b0;
      background: linear-gradient(to right, rgba(156, 39, 176, 0.2), rgba(156, 39, 176, 0.1));
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
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Detailed Stats - EXPANDED */
    .detailed-stats {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .breakdown-title {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin: 0 0 1.2rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
    }
    
    .breakdown-emoji {
      font-size: 1.8rem;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .mood-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .mood-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: rgba(168, 85, 247, 0.15); /* Purple theme instead of white */
      border-radius: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
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
      transform: translateX(8px);
    }
    
    .mood-info {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    
    .mood-emoji {
      font-size: 1.5rem;
    }
    
    .mood-name {
      font-weight: 600;
      color: white;
      font-size: 1rem;
    }
    
    .mood-stats {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    
    .mood-count {
      font-size: 1.3rem;
      font-weight: 700;
      color: white;
    }
    
    .mood-percentage {
      font-size: 0.8rem;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.3rem 0.6rem;
      border-radius: 1rem;
    }
    
    /* Loading States - EXPANDED */
    .loading-stats, .loading-insights, .loading-moods {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.8);
      font-style: italic;
      padding: 1.5rem;
      text-align: center;
      font-size: 1rem;
    }
    
    .loading-stats::before, .loading-insights::before, .loading-moods::before {
      content: '';
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 0.8rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* No Data Message - EXPANDED */

/* --- Login Page Redesign Styles --- */
.divider {
    display: flex;
    align-items: center;
    margin: 20px 0;
    color: rgba(255, 255, 255, 0.6);
}

.divider::before,
.divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
}

.divider span {
    padding: 0 15px;
    font-size: 14px;
    text-transform: lowercase;
}

.google-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: white !important;
    color: #444 !important;
    border: none;
    border-radius: 8px;
    padding: 12px;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.google-btn:hover {
    background: #f8f9fa !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.google-btn i {
    font-size: 20px;
    color: #4285F4;
}

.social-icons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
}
      margin-bottom: 0.8rem;
      opacity: 0.8;
    }
    
    .no-data-text {
      font-size: 1rem;
      max-width: 300px;
      line-height: 1.5;
    }
    
    /* Debug Info - EXPANDED */
    .debug-info {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 1rem;
      font-family: monospace;
      font-size: 0.8rem;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }
    
    /* Responsive Design - EXPANDED */
    @media (max-width: 768px) {
      .stats-container {
        padding: 1rem;
        gap: 1rem;
        height: 100%;
      }
      
      .stats-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .stats-controls {
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .summary-stats {
        grid-template-columns: 1fr;
      }
      
      .mood-list {
        grid-template-columns: 1fr;
      }
      
      .stats-title {
        font-size: 1.8rem;
      }
      
      .title-emoji {
        font-size: 2rem;
      }
      
      .stat-card {
        min-height: 250px;
      }
    }
  `;

    // Only add styles if not already present
    if (!document.getElementById('stats-enhanced-styles')) {
        document.head.appendChild(statsStyles);
    }

    // Initialize stats functionality
    function initializeStats() {
        // Initialize variables
        let currentPeriod = 'week';
        let journalEntries = null;
        let processedData = null;

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

        // Try multiple ways to get journal entries
        function getJournalEntries() {
            console.log("Attempting to fetch journal entries...");

            // Method 1: Try direct localStorage access with common keys
            const possibleKeys = ['journalEntries', 'entries', 'journal', 'moodEntries', 'data'];
            let entries = null;

            for (const key of possibleKeys) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            console.log(`Found ${parsed.length} entries in localStorage key: ${key}`);
                            entries = parsed;
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`Failed to parse data from key ${key}:`, e);
                }
            }

            // Method 2: Try to find a global variable
            if (!entries && typeof window.entries !== 'undefined') {
                entries = window.entries;
                console.log(`Found ${entries.length} entries in global window.entries`);
            }

            if (!entries && typeof window.journalEntries !== 'undefined') {
                entries = window.journalEntries;
                console.log(`Found ${entries.length} entries in global window.journalEntries`);
            }

            // Method 3: Try to access through any other global objects
            if (!entries) {
                for (const prop in window) {
                    if (prop.includes('journal') || prop.includes('entry') || prop.includes('mood')) {
                        try {
                            const value = window[prop];
                            if (Array.isArray(value) && value.length > 0) {
                                console.log(`Found ${value.length} entries in global window.${prop}`);
                                entries = value;
                                break;
                            }
                        } catch (e) {
                            // Skip if we can't access this property
                        }
                    }
                }
            }

            // Method 4: Create sample data if nothing found - REMOVED
            // if (!entries) {
            //    console.log("No entries found, skip creating sample data");
            // }

            return entries;
        }

        // Debug function to show data structure
        function debugData() {
            const entries = getJournalEntries();
            const debugInfo = document.createElement('div');
            debugInfo.className = 'debug-info';

            let debugText = `Found ${entries ? entries.length : 0} entries:\n\n`;

            if (entries && entries.length > 0) {
                const sampleEntry = entries[0];
                debugText += `Sample entry structure:\n${JSON.stringify(sampleEntry, null, 2)}\n\n`;
                debugText += `First 3 entries:\n`;
                for (let i = 0; i < Math.min(3, entries.length); i++) {
                    debugText += `${i + 1}. ${JSON.stringify(entries[i], null, 2)}\n`;
                }
            } else {
                debugText += "No entries found. Check your data storage.";
            }

            debugInfo.textContent = debugText;

            // Create modal to show debug info
            const modal = document.createElement('div');
            modal.style.cssText = `
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
      `;

            const content = document.createElement('div');
            content.style.cssText = `
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        max-width: 80%;
        max-height: 80%;
        overflow: auto;
      `;

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close';
            closeBtn.style.cssText = `
        background: #9c27b0;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        margin-top: 1rem;
        cursor: pointer;
      `;

            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });

            content.appendChild(debugInfo);
            content.appendChild(closeBtn);
            modal.appendChild(content);
            document.body.appendChild(modal);
        }

        // Filter entries by date range
        function filterEntriesByPeriod(entries, period) {
            const now = new Date();
            const startDate = new Date();

            switch (period) {
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(now.getDate() - 7);
            }

            return entries.filter(entry => {
                // Try different date field names
                let entryDate;
                if (entry.date) {
                    entryDate = new Date(entry.date);
                } else if (entry.timestamp) {
                    entryDate = new Date(entry.timestamp);
                } else if (entry.created_at) {
                    entryDate = new Date(entry.created_at);
                } else if (entry.time) {
                    entryDate = new Date(entry.time);
                } else {
                    // If no date field, include it
                    return true;
                }

                return entryDate >= startDate && entryDate <= now;
            });
        }

        // Process entries to extract mood data
        function processMoodData(entries) {
            const moodCounts = {};
            const dailyMoods = {};

            entries.forEach(entry => {
                // Try different mood field names
                let mood = 'neutral'; // Default mood
                if (entry.mood) {
                    mood = entry.mood;
                } else if (entry.feeling) {
                    mood = entry.feeling;
                } else if (entry.emotion) {
                    mood = entry.emotion;
                } else if (entry.emoji) {
                    mood = entry.emoji;
                }

                // Normalize mood to lowercase
                mood = mood.toLowerCase();

                // Get date for trends - FIXED: Use consistent date format
                let entryDate;
                if (entry.date) {
                    entryDate = new Date(entry.date);
                } else if (entry.timestamp) {
                    entryDate = new Date(entry.timestamp);
                } else if (entry.created_at) {
                    entryDate = new Date(entry.created_at);
                } else {
                    entryDate = new Date(); // Use today if no date
                }

                // Create a consistent date key (YYYY-MM-DD format)
                const dateKey = entryDate.toISOString().split('T')[0];

                // Count mood occurrences
                moodCounts[mood] = (moodCounts[mood] || 0) + 1;

                // Track daily moods for trends
                if (!dailyMoods[dateKey]) {
                    dailyMoods[dateKey] = {};
                }
                dailyMoods[dateKey][mood] = (dailyMoods[dateKey][mood] || 0) + 1;
            });

            // Convert to array format for charts
            const moodData = Object.entries(moodCounts).map(([mood, count]) => ({
                mood: mood.charAt(0).toUpperCase() + mood.slice(1),
                count
            }));

            // Generate trend data
            const trendData = generateTrendData(dailyMoods);

            return {
                moodData,
                trendData,
                totalEntries: entries.length,
                uniqueMoods: Object.keys(moodCounts).length
            };
        }

        // Generate trend data for line chart - COMPLETELY REWRITTEN
        function generateTrendData(dailyMoods) {
            const moodColors = {
                happy: 'rgba(75, 192, 192, 1)',
                sad: 'rgba(54, 162, 235, 1)',
                anxious: 'rgba(255, 206, 86, 1)',
                angry: 'rgba(255, 99, 132, 1)',
                neutral: 'rgba(153, 102, 255, 1)',
                hopeful: 'rgba(255, 159, 64, 1)'
            };

            // Get all unique moods across all days
            const allMoods = new Set();
            Object.keys(dailyMoods).forEach(date => {
                Object.keys(dailyMoods[date]).forEach(mood => allMoods.add(mood));
            });

            // Sort dates chronologically
            const sortedDates = Object.keys(dailyMoods).sort();

            // Create a dataset for each mood
            const datasets = [];
            allMoods.forEach(mood => {
                const data = sortedDates.map(date => {
                    return dailyMoods[date][mood] || 0;
                });

                datasets.push({
                    label: mood.charAt(0).toUpperCase() + mood.slice(1),
                    data,
                    borderColor: moodColors[mood] || 'rgba(128, 128, 128, 1)',
                    backgroundColor: (moodColors[mood] || 'rgba(128, 128, 128, 0.2)').replace('1)', '0.2)'),
                    tension: 0.4,
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 5
                });
            });

            // Format dates for display
            const formattedDates = sortedDates.map(dateStr => {
                const date = new Date(dateStr + 'T00:00:00');
                return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
            });

            return {
                labels: formattedDates,
                datasets
            };
        }

        // Fetch and display stats
        async function loadStats(period = 'week') {
            try {
                // Show loading states
                document.getElementById('summaryStats').innerHTML = '<div class="loading-stats">Loading summary...</div>';
                document.getElementById('insights').innerHTML = '<div class="loading-insights">Analyzing patterns...</div>';
                document.getElementById('moodList').innerHTML = '<div class="loading-moods">Loading mood details...</div>';

                // Get journal entries
                journalEntries = getJournalEntries();

                if (!journalEntries || journalEntries.length === 0) {
                    showNoDataMessage();
                    return;
                }

                // Filter entries by period
                const filteredEntries = filterEntriesByPeriod(journalEntries, period);

                if (filteredEntries.length === 0) {
                    showNoDataMessage();
                    return;
                }

                // Process the data
                processedData = processMoodData(filteredEntries);

                // Render all components
                await renderCharts();
                await renderSummary();
                await renderInsights();
                await renderMoodBreakdown();

            } catch (err) {
                console.error('Error loading stats:', err);
                showErrorMessage(err);
            }
        }

        // Show no data message
        function showNoDataMessage() {
            document.getElementById('summaryStats').innerHTML = `
        <div class="no-data-message">
          <div class="no-data-emoji">📊</div>
          <div class="no-data-text">No data available for this period. Add some journal entries to see your mood summary!</div>
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
          <div class="no-data-text">No mood data for this period. Begin your journey today!</div>
        </div>
      `;

            // Clear charts
            if (window._moodChart) window._moodChart.destroy();
            if (window._trendChart) window._trendChart.destroy();
        }

        // Show error message
        function showErrorMessage(err) {
            document.getElementById('summaryStats').innerHTML = `
        <div class="no-data-message">
          <div class="no-data-emoji">❌</div>
          <div class="no-data-text">Error loading statistics: ${err.message || 'Unknown error'}</div>
        </div>
      `;
        }

        // Render charts - FIXED VERSION
        async function renderCharts() {
            // Destroy previous charts if they exist
            if (window._moodChart) window._moodChart.destroy();
            if (window._trendChart) window._trendChart.destroy();

            // Mood Distribution Chart
            const moodCtx = document.getElementById('moodChart').getContext('2d');
            const labels = processedData.moodData.map(s => s.mood);
            const data = processedData.moodData.map(s => s.count);

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
                                font: { size: 12, weight: 'bold' },
                                padding: 15
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

            // Trend Chart - FIXED VERSION
            const trendCtx = document.getElementById('trendChart').getContext('2d');

            // Always use the processed trend data
            if (processedData.trendData && processedData.trendData.datasets && processedData.trendData.datasets.length > 0) {
                window._trendChart = new Chart(trendCtx, {
                    type: 'line',
                    data: processedData.trendData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: 'white',
                                    font: { size: 12, weight: 'bold' },
                                    padding: 15
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                titleFont: { weight: 'bold' },
                                bodyColor: '#fff',
                                callbacks: {
                                    label: function (context) {
                                        return `${context.dataset.label}: ${context.raw} entries`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    font: { size: 11, weight: 'bold' }
                                },
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)',
                                    drawBorder: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    font: { size: 11, weight: 'bold' },
                                    stepSize: 1,
                                    precision: 0
                                },
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)',
                                    drawBorder: false
                                },
                                title: {
                                    display: true,
                                    text: 'Number of Entries',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    font: { size: 11 }
                                }
                            }
                        }
                    }
                });
            } else {
                // Create empty chart with message
                window._trendChart = new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: []
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'No trend data available',
                                color: 'rgba(255, 255, 255, 0.8)',
                                font: { size: 14 }
                            }
                        },
                        scales: {
                            x: {
                                display: false
                            },
                            y: {
                                display: false
                            }
                        }
                    }
                });
            }
        }

        // Render summary statistics
        async function renderSummary() {
            const totalEntries = processedData.totalEntries;
            const mostFrequent = processedData.moodData.reduce((max, mood) =>
                mood.count > max.count ? mood : max, processedData.moodData[0]);
            const daysInPeriod = currentPeriod === 'week' ? 7 : currentPeriod === 'month' ? 30 : 365;
            const averageEntries = (totalEntries / daysInPeriod).toFixed(1);
            const moodVariety = processedData.uniqueMoods;

            document.getElementById('summaryStats').innerHTML = `
        <div class="summary-item">
          <div class="summary-label">Total Entries</div>
          <div class="summary-value">${totalEntries}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Daily Average</div>
          <div class="summary-value">${averageEntries}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Top Mood</div>
          <div class="summary-value">${mostFrequent.mood}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Mood Variety</div>
          <div class="summary-value">${moodVariety}</div>
        </div>
      `;
        }

        // Render insights
        async function renderInsights() {
            const insights = generateInsights();

            document.getElementById('insights').innerHTML = insights.map(insight => `
        <div class="insight-item ${insight.type}">
          ${insight.icon} ${insight.text}
        </div>
      `).join('');
        }

        // Generate insights based on actual mood data
        function generateInsights() {
            const insights = [];
            const totalEntries = processedData.totalEntries;

            // Calculate mood percentages
            const moodPercentages = {};
            processedData.moodData.forEach(mood => {
                moodPercentages[mood.mood.toLowerCase()] = (mood.count / totalEntries) * 100;
            });

            // Positive insight for happy moods
            const happyPercentage = (moodPercentages.happy || 0) + (moodPercentages.hopeful || 0);
            if (happyPercentage > 50) {
                insights.push({
                    type: 'positive',
                    icon: '😊',
                    text: `Excellent! You've been feeling positive ${happyPercentage.toFixed(0)}% of the time!`
                });
            } else if (happyPercentage > 30) {
                insights.push({
                    type: 'positive',
                    icon: '💪',
                    text: `Good progress! You've been feeling positive ${happyPercentage.toFixed(0)}% of the time.`
                });
            }

            // Concern insight for negative moods
            const negativePercentage = (moodPercentages.sad || 0) + (moodPercentages.anxious || 0) + (moodPercentages.angry || 0);
            if (negativePercentage > 40) {
                insights.push({
                    type: 'concern',
                    icon: '💙',
                    text: `Consider self-care activities when feeling overwhelmed`
                });
            }

            // Consistency insight
            const daysInPeriod = currentPeriod === 'week' ? 7 : currentPeriod === 'month' ? 30 : 365;
            const consistency = (totalEntries / daysInPeriod) * 100;
            if (consistency > 70) {
                insights.push({
                    type: 'positive',
                    icon: '🎯',
                    text: `Amazing consistency! You're journaling ${consistency.toFixed(0)}% of days`
                });
            } else if (consistency > 40) {
                insights.push({
                    type: 'neutral',
                    icon: '📈',
                    text: `Try to journal more regularly for better insights`
                });
            }

            // Mood variety insight
            if (processedData.uniqueMoods >= 4) {
                insights.push({
                    type: 'neutral',
                    icon: '🌈',
                    text: `You're experiencing a wide range of emotions - that's perfectly normal!`
                });
            }

            return insights;
        }

        // Render mood breakdown
        async function renderMoodBreakdown() {
            const totalEntries = processedData.totalEntries;

            document.getElementById('moodList').innerHTML = processedData.moodData.map(mood => {
                const percentage = ((mood.count / totalEntries) * 100).toFixed(1);
                const moodEmojis = {
                    Happy: '😊',
                    Sad: '😢',
                    Anxious: '😰',
                    Angry: '😡',
                    Neutral: '😐',
                    Hopeful: '🤗',
                    Excited: '🎉',
                    Calm: '😌',
                    Frustrated: '😤',
                    Grateful: '🙏'
                };

                return `
          <div class="mood-item">
            <div class="mood-info">
              <span class="mood-emoji">${moodEmojis[mood.mood] || '😊'}</span>
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
            if (!processedData) return;

            const exportData = {
                period: currentPeriod,
                generated: new Date().toISOString(),
                entries: filterEntriesByPeriod(journalEntries, currentPeriod),
                summary: {
                    totalEntries: processedData.totalEntries,
                    mostFrequent: processedData.moodData.reduce((max, mood) =>
                        mood.count > max.count ? mood : max, processedData.moodData[0]).mood,
                    moodVariety: processedData.uniqueMoods
                },
                moodData: processedData.moodData
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
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? 'rgba(156, 39, 176, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-size: 0.9rem;
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

        // Add debug button listener
        document.getElementById('debugBtn').addEventListener('click', debugData);

        // Load initial data
        loadStats(currentPeriod);
    }
}
// 🌟 Enhanced Professional Help & Support Page
function showHelp() {
    localStorage.setItem("currentPage", "page_help");
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
            
            <div class="help-card">
              <div class="card-icon">👩‍⚕️</div>
              <h4>Dr. Hira Akbar</h4>
              <p>Clinical Psychologist<br>Phone: +92 316 1531304</p>
              <div class="card-links">
                <a href="https://www.instagram.com/hiravamindclinic?igsh=NjN5ZGtkYmthMWYx" target="_blank" class="card-link">Visit Instagram</a>
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

    // Enhanced CSS for help page - EXPANDED VERSION
    const helpStyles = document.createElement('style');
    helpStyles.id = 'help-enhanced-styles';
    helpStyles.textContent = `
    /* Help Container - EXPANDED */
    .help-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: var(--gradient-primary);
      border-radius: 1.2rem;
      box-shadow: 0 15px 30px rgba(139, 92, 246, 0.25);
      color: white;
      height: 100%;
      overflow-y: auto;
      position: relative;
    }
    
    /* Custom scrollbar for entire container */
    .help-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .help-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .help-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.4);
      border-radius: 4px;
    }
    
    .help-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.6);
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
    
    /* Header Styles - EXPANDED */
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
      gap: 0.8rem;
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2.2rem;
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
    
    /* Tab Styles - EXPANDED */
    .help-tabs {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      padding: 0.5rem;
      border-radius: 2rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 1;
    }
    
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.8rem 1.2rem;
      border: none;
      border-radius: 1.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      font-size: 0.9rem;
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
      transform: translateY(-3px);
    }
    
    .tab-btn.active {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .tab-emoji {
      font-size: 1.2rem;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    }
    
    /* Tab Content - EXPANDED */
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
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Emergency Tab Styles - EXPANDED */
    .emergency-banner {
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      border-radius: 1.2rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 20px rgba(238, 90, 111, 0.25);
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
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 2rem;
      background: white;
      color: #ee5a6f;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      margin: 0 auto;
    }
    
    .emergency-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
    
    .btn-emoji {
      font-size: 1.2rem;
    }
    
    .help-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .help-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
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
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .card-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      display: block;
      text-align: center;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .help-card h4 {
      margin: 0 0 0.8rem;
      font-size: 1.2rem;
      text-align: center;
      color: white;
      font-weight: 600;
    }
    
    .help-card p {
      margin: 0 0 1.2rem;
      font-size: 1rem;
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
      font-size: 0.9rem;
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
    
    /* Resources Tab Styles - EXPANDED */
    .resource-categories {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .category-section {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .category-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1.2rem;
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
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: white;
      font-weight: 600;
    }
    
    .resource-info p {
      margin: 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    .resource-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
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
      font-size: 1.1rem;
    }
    
    /* Self-Care Tab Styles - EXPANDED */
    .selfcare-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .selfcare-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
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
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .card-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    }
    
    .card-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: white;
      font-weight: 600;
    }
    
    .selfcare-card p {
      margin: 0 0 1.2rem;
      font-size: 1rem;
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
      border-radius: 0.8rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    .tip-emoji {
      font-size: 1rem;
      flex-shrink: 0;
    }
    
    /* Community Tab Styles - EXPANDED */
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
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .community-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
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
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .community-btn {
      margin-top: auto;
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 2rem;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 0.9rem;
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
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1.2rem;
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
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .video-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
      padding: 1rem;
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
      border-radius: 0.8rem;
      overflow: hidden;
    }
    
    .video-iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 0.8rem;
    }
    
    .video-item h4 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: white;
      font-weight: 600;
    }
    
    .video-item p {
      margin: 0;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.4;
    }
    
    /* Responsive Design - EXPANDED */
    @media (max-width: 768px) {
      .help-container {
        padding: 1rem;
        gap: 1rem;
        height: 100%;
        margin: 10px;
      }
      
      .help-tabs {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .tab-btn {
        flex: 1;
        min-width: calc(50% - 0.25rem);
        justify-content: center;
        font-size: 0.8rem;
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
        border-radius: 1rem;
        padding: 1.5rem;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: var(--gradient-primary);
        "></div>
        <h3 style="margin: 0 0 1rem; color: #333; font-size: 1.3rem;">Crisis Support</h3>
        <p style="margin: 0 0 1.5rem; color: #666; line-height: 1.5; font-size: 1rem;">
          You can call or text 988 anytime in the US and Canada. 
          In the UK, you can call 111. 
          These services are free, confidential, and available 24/7.
        </p>
        <div style="display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap;">
          <button id="callBtn" style="
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 2rem;
            background: var(--gradient-primary);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(139, 92, 246, 0.3);
            font-size: 1rem;
          ">Call</button>
          <button id="textBtn" style="
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 2rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            font-size: 1rem;
          ">Text</button>
          <button id="closeModal" style="
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 2rem;
            background: #f5f5f5;
            color: #333;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
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
      bottom: 30px;
      right: 30px;
      background: ${type === 'info' ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #43e97b, #38f9d7)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
      font-size: 0.9rem;
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

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}
function showSounds() {
    localStorage.setItem("currentPage", "page_sounds");

    const main = document.getElementById('maincard');
    main.innerHTML = `
    <div class="sounds-container">
      <div class="sounds-header">
        <h2 class="sounds-title">
          <span class="title-emoji">🎵</span>
          <span>Relaxing Sounds</span>
        </h2>
        <div class="sounds-subtitle">Choose perfect ambiance for your mood</div>
      </div>
      
      <div class="scroll-container">
        <div class="sounds-content">
          <div class="section">
            <div class="section-title">
              <span class="section-emoji">🎵</span>
              <span>Now Playing</span>
            </div>
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
              <div class="player-visualizer" id="visualizer">
                <div class="visualizer-bar"></div>
                <div class="visualizer-bar"></div>
                <div class="visualizer-bar"></div>
                <div class="visualizer-bar"></div>
                <div class="visualizer-bar"></div>
                <div class="visualizer-bar"></div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">
              <span class="section-emoji">🎵</span>
              <span>Categories</span>
            </div>
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
          
          <div class="section">
            <div class="section-title">
              <span class="section-emoji">📋</span>
              <span>Playlist</span>
            </div>
            <div class="playlist-items" id="playlistItems">
              <div class="empty-playlist">Your playlist is empty. Add sounds to create a custom playlist.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Add styles once
    addSoundsStyles();

    // Initialize functionality
    initializeSoundsFunctionality();
}
function addSoundsStyles() {
    // Only add styles if not already present
    if (!document.getElementById('sounds-enhanced-styles')) {
        const soundsStyles = document.createElement('style');
        soundsStyles.id = 'sounds-enhanced-styles';
        soundsStyles.textContent = `
      /* Import Poppins font */
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      /* Reset and base styles */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .sounds-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
      }
      
      .sounds-header {
        position: relative;
        z-index: 10;
        text-align: center;
        padding: 0.8rem 1.5rem 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }
      
      .sounds-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 1.6rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.4rem;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        letter-spacing: -0.02em;
      }
      
      .title-emoji {
        font-size: 2.5rem;
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(5deg); }
      }
      
      .sounds-subtitle {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
        letter-spacing: 0.02em;
      }
      
      .scroll-container {
        flex: 1;
        overflow-y: visible;
        overflow-x: hidden;
        position: relative;
        z-index: 5;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      
      .scroll-container::-webkit-scrollbar {
        width: 8px;
      }
      
      .scroll-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        margin: 3px 0;
      }
      
      .scroll-container::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      }
      
      .scroll-container::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(168, 85, 247, 1));
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .sounds-content {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        max-width: 1000px;
        margin: 0 auto;
        width: 100%;
        flex: 1;
        padding-bottom: 80px;
      }
      
      .section {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border-radius: 12px;
        padding: 0.8rem;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .section:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      }
      
      .section-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.6rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: white;
        letter-spacing: 0.01em;
      }
      
      .section-emoji {
        font-size: 1.8rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
      
      /* Player Styles */
      .player-main {
        margin-bottom: 0.8rem;
      }
      
      .current-track {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
      }
      
      .track-info {
        display: flex;
        align-items: center;
        gap: 0.8rem;
      }
      
      .track-emoji {
        font-size: 2.2rem;
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
        font-size: 1rem;
        font-weight: 600;
        color: white;
      }
      
      .track-artist {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .track-duration {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .player-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 0.8rem;
      }
      
      .control-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .control-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      
      .control-btn.primary {
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
      
      .control-btn.primary:hover {
        background: rgba(255, 255, 255, 0.35);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
      }
      
      .control-emoji {
        font-size: 1.5rem;
      }
      
      .player-progress {
        margin-bottom: 0.8rem;
      }
      
      .progress-bar {
        height: 6px;
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
        gap: 0.8rem;
      }
      
      .extra-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .extra-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      
      .extra-btn.active {
        background: rgba(255, 255, 255, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
      
      .extra-emoji {
        font-size: 1.4rem;
      }
      
      .volume-slider {
        margin-top: 0.6rem;
        padding: 0.6rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
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
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
      }
      
      .slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
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
        margin-top: 0.8rem;
      }
      
      .visualizer-bar {
        width: 6px;
        background: linear-gradient(to top, #ff9a9e, #fad0c4);
        border-radius: 3px;
        transition: height 0.1s ease;
      }
      
      /* Categories Section */
      .category-tabs {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.8rem;
        flex-wrap: wrap;
      }
      
      .category-tab {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.6rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .category-tab:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
      
      .category-tab.active {
        background: rgba(255, 255, 255, 0.25);
        color: white;
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .tab-emoji {
        font-size: 1.2rem;
      }
      
      /* Sounds Grid */
      .sounds-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.8rem;
      }
      
      .sound-card {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border-radius: 12px;
        padding: 0.8rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        position: relative;
        overflow: visible;
        border: 1px solid rgba(255, 255, 255, 0.2);
        height: auto;
        min-height: 155px;
      }
      
      .sound-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }
      
      .sound-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .sound-card:hover::before {
        opacity: 1;
      }
      
      .sound-card.playing {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      }
      
      .sound-emoji {
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
      
      .sound-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: white;
        margin-bottom: 0.3rem;
      }
      
      .sound-duration {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .sound-actions {
        display: flex;
        gap: 0.4rem;
        margin-top: 0.6rem;
      }
      
      .sound-action-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 28px;
        height: 28px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        font-size: 1rem;
      }
      
      .sound-action-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .action-emoji {
        font-size: 1rem;
      }
      
      /* Playlist Section */
      .playlist-items {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        max-height: none;
        overflow-y: visible;
      }
      
      .playlist-items::-webkit-scrollbar {
        width: 6px;
      }
      
      .playlist-items::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }
      
      .playlist-items::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.4);
        border-radius: 3px;
        transition: background 0.3s ease;
      }
      
      .playlist-items::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.6);
      }
      
      .playlist-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .playlist-item:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .playlist-item-emoji {
        font-size: 1.2rem;
        flex-shrink: 0;
      }
      
      .playlist-item-name {
        flex: 1;
        font-size: 0.8rem;
        color: white;
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
        font-size: 0.8rem;
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
        padding: 1rem;
        font-size: 0.8rem;
        color: white;
      }
      
      .loading-sounds {
        text-align: center;
        font-style: italic;
        opacity: 0.7;
        padding: 1rem;
        font-size: 0.8rem;
        color: white;
      }
      
      /* Responsive Design */
      @media (max-width: 1024px) {
        .sounds-grid {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.6rem;
        }
        
        .sound-card {
          height: auto;
          min-height: 145px;
          padding: 0.6rem;
        }
        
        .sound-emoji {
          font-size: 2rem;
          margin-bottom: 0.4rem;
        }
        
        .sound-name {
          font-size: 0.8rem;
          margin-bottom: 0.2rem;
        }
        
        .sound-duration {
          font-size: 0.65rem;
        }
      }
      
      @media (max-width: 768px) {
        .sounds-header {
          padding: 0.6rem 1.2rem 0.4rem;
        }
        
        .sounds-title {
          font-size: 1.4rem;
          gap: 0.4rem;
        }
        
        .title-emoji {
          font-size: 2rem;
        }
        
        .sounds-subtitle {
          font-size: 0.8rem;
        }
        
        .scroll-container {
          padding: 0.8rem;
        }
        
        .sounds-content {
          gap: 0.6rem;
        }
        
        .section {
          padding: 0.6rem;
          border-radius: 10px;
        }
        
        .section-title {
          font-size: 1rem;
          gap: 0.4rem;
          margin-bottom: 0.5rem;
        }
        
        .section-emoji {
          font-size: 1.5rem;
        }
        
        .player-main {
          gap: 0.6rem;
        }
        
        .current-track {
          flex-direction: column;
          gap: 0.6rem;
          text-align: center;
        }
        
        .track-info {
          gap: 0.6rem;
        }
        
        .track-emoji {
          font-size: 1.8rem;
        }
        
        .track-name {
          font-size: 0.9rem;
        }
        
        .track-artist {
          font-size: 0.7rem;
        }
        
        .track-duration {
          font-size: 0.7rem;
        }
        
        .player-controls {
          gap: 0.6rem;
        }
        
        .control-btn {
          width: 36px;
          height: 36px;
        }
        
        .control-btn.primary {
          width: 44px;
          height: 44px;
        }
        
        .control-emoji {
          font-size: 1.3rem;
        }
        
        .player-progress {
          margin-bottom: 0.6rem;
        }
        
        .progress-bar {
          height: 5px;
        }
        
        .player-extras {
          gap: 0.6rem;
        }
        
        .extra-btn {
          width: 32px;
          height: 32px;
        }
        
        .extra-emoji {
          font-size: 1.2rem;
        }
        
        .volume-slider {
          margin-top: 0.5rem;
          padding: 0.5rem;
        }
        
        .slider {
          height: 3px;
        }
        
        .slider::-webkit-slider-thumb {
          width: 14px;
          height: 14px;
        }
        
        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
        }
        
        .player-visualizer {
          height: 25px;
        }
        
        .visualizer-bar {
          width: 5px;
        }
        
        .category-tabs {
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        
        .category-tab {
          padding: 0.5rem 0.8rem;
          font-size: 0.8rem;
        }
        
        .tab-emoji {
          font-size: 1rem;
        }
        
        .sounds-grid {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
        }
        
        .sound-card {
          height: auto;
          min-height: 140px;
          padding: 0.6rem;
        }
        
        .sound-emoji {
          font-size: 1.8rem;
          margin-bottom: 0.4rem;
        }
        
        .sound-name {
          font-size: 0.75rem;
          margin-bottom: 0.2rem;
        }
        
        .sound-duration {
          font-size: 0.6rem;
        }
        
        .sound-actions {
          gap: 0.3rem;
          margin-top: 0.5rem;
        }
        
        .sound-action-btn {
          width: 24px;
          height: 24px;
          font-size: 0.9rem;
        }
        
        .playlist-items {
          gap: 0.3rem;
          max-height: none;
          overflow-y: visible;
        }
        
        .playlist-item {
          padding: 0.3rem;
        }
        
        .playlist-item-emoji {
          font-size: 1rem;
        }
        
        .playlist-item-name {
          font-size: 0.75rem;
        }
        
        .playlist-item-remove {
          width: 18px;
          height: 18px;
          font-size: 0.7rem;
        }
        
        .empty-playlist {
          padding: 0.8rem;
          font-size: 0.75rem;
        }
        
        .loading-sounds {
          padding: 0.8rem;
          font-size: 0.75rem;
        }
      }
      
      @media (max-width: 480px) {
        .sounds-header {
          padding: 0.5rem 1rem 0.3rem;
        }
        
        .sounds-title {
          font-size: 1.2rem;
          gap: 0.3rem;
        }
        
        .title-emoji {
          font-size: 1.8rem;
        }
        
        .sounds-subtitle {
          font-size: 0.75rem;
        }
        
        .scroll-container {
          padding: 0.6rem;
        }
        
        .sounds-content {
          gap: 0.5rem;
        }
        
        .section {
          padding: 0.5rem;
          border-radius: 8px;
        }
        
        .section-title {
          font-size: 0.9rem;
          gap: 0.3rem;
          margin-bottom: 0.4rem;
        }
        
        .section-emoji {
          font-size: 1.3rem;
        }
        
        .player-main {
          gap: 0.5rem;
        }
        
        .current-track {
          flex-direction: column;
          gap: 0.5rem;
          text-align: center;
        }
        
        .track-info {
          gap: 0.5rem;
        }
        
        .track-emoji {
          font-size: 1.6rem;
        }
        
        .track-name {
          font-size: 0.8rem;
        }
        
        .track-artist {
          font-size: 0.65rem;
        }
        
        .track-duration {
          font-size: 0.65rem;
        }
        
        .player-controls {
          gap: 0.5rem;
        }
        
        .control-btn {
          width: 32px;
          height: 32px;
        }
        
        .control-btn.primary {
          width: 40px;
          height: 40px;
        }
        
        .control-emoji {
          font-size: 1.2rem;
        }
        
        .player-progress {
          margin-bottom: 0.5rem;
        }
        
        .progress-bar {
          height: 4px;
        }
        
        .player-extras {
          gap: 0.5rem;
        }
        
        .extra-btn {
          width: 28px;
          height: 28px;
        }
        
        .extra-emoji {
          font-size: 1.1rem;
        }
        
        .volume-slider {
          margin-top: 0.4rem;
          padding: 0.4rem;
        }
        
        .slider {
          height: 3px;
        }
        
        .slider::-webkit-slider-thumb {
          width: 12px;
          height: 12px;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
        }
        
        .player-visualizer {
          height: 20px;
        }
        
        .visualizer-bar {
          width: 4px;
        }
        
        .category-tabs {
          gap: 0.2rem;
        }
        
        .category-tab {
          padding: 0.4rem 0.6rem;
          font-size: 0.75rem;
        }
        
        .tab-emoji {
          font-size: 0.9rem;
        }
        
        .sounds-grid {
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.4rem;
        }
        
        .sound-card {
          height: auto;
          min-height: 135px;
          padding: 0.5rem;
        }
        
        .sound-emoji {
          font-size: 1.6rem;
          margin-bottom: 0.3rem;
        }
        
        .sound-name {
          font-size: 0.7rem;
          margin-bottom: 0.2rem;
        }
        
        .sound-duration {
          font-size: 0.55rem;
        }
        
        .sound-actions {
          gap: 0.2rem;
          margin-top: 0.4rem;
        }
        
        .sound-action-btn {
          width: 22px;
          height: 22px;
          font-size: 0.8rem;
        }
        
        .playlist-items {
          gap: 0.2rem;
          max-height: none;
          overflow-y: visible;
        }
        
        .playlist-item {
          padding: 0.3rem;
        }
        
        .playlist-item-emoji {
          font-size: 0.9rem;
        }
        
        .playlist-item-name {
          font-size: 0.7rem;
        }
        
        .playlist-item-remove {
          width: 16px;
          height: 16px;
          font-size: 0.65rem;
        }
        
        .empty-playlist {
          padding: 0.6rem;
          font-size: 0.7rem;
        }
        
        .loading-sounds {
          padding: 0.6rem;
          font-size: 0.7rem;
        }
      }
    `;
        document.head.appendChild(soundsStyles);
    }
}
function initializeSoundsFunctionality() {
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

    let isPlaying = false;
    let currentSound = null;
    let currentCategory = 'all';
    let isShuffle = false;
    let isRepeat = false;
    let playlist = JSON.parse(localStorage.getItem('moodPlaylist')) || [];

    // Sound data with categories
    const soundData = {
        rain: { name: 'Rain', emoji: '🌧️', category: 'nature', duration: '3:45', url: 'sounds/rain.mp3' },
        waves: { name: 'Ocean Waves', emoji: '🌊', category: 'nature', duration: '5:20', url: 'sounds/waves.mp3' },
        chimes: { name: 'Wind Chimes', emoji: '🔔', category: 'nature', duration: '2:15', url: 'sounds/chimes.mp3' },
        garden: { name: 'Morning Garden', emoji: '🌿', category: 'nature', duration: '4:30', url: 'sounds/morning-garden.mp3' },
        lofi_relax: { name: 'Lofi Relax', emoji: '🎧', category: 'music', duration: '3:10', url: 'sounds/lofi-relax.mp3' },
        lofi: { name: 'Lofi Beats', emoji: '🎶', category: 'music', duration: '2:45', url: 'sounds/lofi.mp3' },
        relax_guitar: { name: 'Relaxing Guitar', emoji: '🎸', category: 'music', duration: '4:15', url: 'sounds/relax-guitar.mp3' },
        meditation_amp: { name: 'Meditation (Amp)', emoji: '🧘', category: 'meditation', duration: '10:30', url: 'sounds/meditation-amp.mp3' },
        meditation_relax: { name: 'Meditation (Relax)', emoji: '🧘', category: 'meditation', duration: '8:45', url: 'sounds/meditation-relax.mp3' },
        relax_meditation: { name: 'Relax Meditation', emoji: '🧘', category: 'meditation', duration: '6:20', url: 'sounds/relax-meditation.mp3' },
        relax_meditation1: { name: 'Deep Meditation', emoji: '🧘', category: 'meditation', duration: '12:15', url: 'sounds/relax-meditation1.mp3' },
        relax_2: { name: 'Ambient Relax 2', emoji: '🌌', category: 'ambient', duration: '5:45', url: 'sounds/relax-2.mp3' },
        relax_4: { name: 'Ambient Relax 4', emoji: '🌌', category: 'ambient', duration: '7:30', url: 'sounds/relax-4.mp3' },
        sedative: { name: 'Sedative', emoji: '💤', category: 'ambient', duration: '15:00', url: 'sounds/sedative.mp3' }
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
            relaxAudio.src = sound.url;

            const playPromise = relaxAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotSupportedError') {
                        showNotification('Audio file not found or invalid format', 'error');
                    } else if (error.name !== 'AbortError') {
                        // Ignore AbortError (happens when pausing while loading)
                        console.error('Playback error:', error);
                    }
                    isPlaying = false;
                    updatePlayerUI();
                    updateVisualizer(false);
                    renderSoundsGrid(currentCategory);
                });
            }

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
                    const height = Math.random() * 15 + 5;
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
      padding: 6px 10px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? 'linear-gradient(135deg, #43e97b, #38f9d7)' : 'var(--gradient-primary)'};
      font-size: 12px;
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
            const playPromise = relaxAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error('Playback error on repeat:', error);
                    }
                });
            }
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

    // Initialize
    renderSoundsGrid();
    renderPlaylist();
    updateVolumeIcon();
}
// Enhanced Personality Glow Page with Professional Design (Fixed Sizing)
// Enhanced Personality Glow Page with Complete Error Handling
function showPersonality() {
    try {
        localStorage.setItem('currentPage', 'page_personality');

        const main = document.getElementById('maincard');
        if (!main) {
            console.error('Main card element not found');
            return;
        }

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
                  <div class="canvas-container">
                    <canvas id="personalityRadar"></canvas>
                  </div>
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
                <div class="canvas-container">
                  <canvas id="growthChart"></canvas>
                </div>
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

        // Add enhanced CSS styles for personality page - LARGER VERSION
        const personalityStyles = document.createElement('style');
        personalityStyles.id = 'personality-enhanced-styles';
        personalityStyles.textContent = `
      /* Personality Container - Fluid padding */
      .personality-container {
        display: flex;
        flex-direction: column;
        gap: clamp(0.8rem, 2vw, 1.2rem);
        padding: clamp(0.8rem, 3vw, 1.5rem);
        background: var(--gradient-primary);
        border-radius: 1.2rem;
        box-shadow: 0 12px 24px rgba(139, 92, 246, 0.25);
        color: white;
        height: 100%;
        position: relative;
        overflow-y: auto;
        max-height: calc(100vh - 120px); /* Prevent container from exceeding viewport height */
      }
      
      /* Custom scrollbar for the entire container */
      .personality-container::-webkit-scrollbar {
        width: 6px;
      }
      
      .personality-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      
      .personality-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
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
      
      /* Header Styles - Fluid typography */
      .personality-header {
        text-align: center;
        margin-bottom: clamp(1rem, 2vw, 1.5rem);
        position: relative;
        z-index: 1;
      }
      
      .personality-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        margin: 0 0 0.5rem;
        font-size: clamp(1.5rem, 5vw, 2.2rem);
        font-weight: 700;
        color: white;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        word-break: break-word; /* Prevent long text from overflowing */
      }
      
      .title-emoji {
        font-size: clamp(1.8rem, 6vw, 2.8rem);
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-5px) rotate(5deg); }
      }
      
      .personality-subtitle {
        font-size: clamp(0.9rem, 2.5vw, 1.15rem);
        color: rgba(255, 255, 255, 0.9);
        max-width: 600px;
        margin: 0 auto;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 0 10px;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      /* Tab Styles - Responsive wrapping */
      .personality-tabs {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.2rem;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        padding: 0.5rem;
        border-radius: 2rem;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        position: relative;
        z-index: 1;
      }
      
      .personality-tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.2rem;
        border: none;
        border-radius: 1.5rem;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        font-size: clamp(0.85rem, 2vw, 1rem);
        white-space: nowrap;
        flex: 1 1 auto; /* Allow tabs to flex but maintain minimum width */
        min-width: 80px; /* Minimum width for very small screens */
      }
      
      .personality-tab:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      
      .personality-tab.active {
        background: rgba(255, 255, 255, 0.25);
        color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }
      
      .tab-emoji {
        font-size: 1.2rem;
      }
      
      /* Tab Content */
      .personality-content {
        position: relative;
        z-index: 1;
        flex: 1;
        overflow-y: auto;
        max-height: calc(100vh - 250px); /* Prevent content from exceeding viewport */
      }
      
      .tab-content {
        display: none;
        animation: fadeIn 0.4s ease;
        width: 100%; /* Ensure tab content takes full width */
        box-sizing: border-box; /* Include padding in width calculation */
      }
      
      .tab-content.active {
        display: block;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Overview Tab - Grids */
      .personality-intro {
        text-align: center;
        max-width: 100%;
        width: 100%;
        margin: 0 auto 1.5rem;
        padding: clamp(0.8rem, 3vw, 1.2rem);
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 1.2rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-sizing: border-box;
      }
      
      .personality-intro p {
        color: rgba(255, 255, 255, 0.9);
        font-size: clamp(0.85rem, 2.5vw, 1rem);
        line-height: 1.6;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      .personality-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: clamp(0.8rem, 2vw, 1.2rem);
        margin-bottom: 2rem;
        width: 100%; /* Ensure grid takes full width */
        box-sizing: border-box;
      }
      
      .personality-card {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 1.5rem;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-sizing: border-box;
        width: 100%; /* Ensure card takes full grid cell width */
        min-height: 200px; /* Minimum height for cards */
      }
      
      .personality-card:hover {
        transform: translateY(-5px);
        background: rgba(255, 255, 255, 0.2);
      }
      
      .trait-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 1rem;
        width: 100%; /* Ensure header takes full card width */
      }
      
      .trait-name {
        font-size: 1.2rem;
        font-weight: 600;
        word-wrap: break-word; /* Prevent long trait names from overflowing */
        text-align: center;
      }
      
      .trait-icon {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background: var(--trait-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .trait-percentage {
        font-size: 2.22rem;
        font-weight: 800;
        color: var(--trait-color);
        margin: 0.5rem 0;
      }
      
      .trait-description {
        font-size: 0.9rem;
        opacity: 0.8;
        line-height: 1.4;
        word-wrap: break-word; /* Prevent long descriptions from overflowing */
        overflow-wrap: break-word;
      }
      
      /* Trait specific colors */
      .card-openness { --trait-color: #667eea; }
      .card-conscientiousness { --trait-color: #f093fb; }
      .card-extraversion { --trait-color: #4facfe; }
      .card-agreeableness { --trait-color: #43e97b; }
      .card-neuroticism { --trait-color: #fa709a; }
      
      /* Radar Section */
      .personality-radar-section {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1.2rem;
        padding: clamp(1rem, 3vw, 1.5rem);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        box-sizing: border-box;
        width: 100%; /* Ensure section takes full width */
      }
      
      .radar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .radar-title {
        font-size: clamp(1.1rem, 3vw, 1.4rem);
        font-weight: 600;
        margin: 0;
        word-wrap: break-word; /* Prevent long titles from overflowing */
      }
      
      .action-buttons {
        display: flex;
        gap: 0.8rem;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      
      .action-btn {
        padding: clamp(0.5rem, 2vw, 0.6rem) clamp(0.8rem, 3vw, 1.2rem);
        border-radius: 2rem;
        border: none;
        font-weight: 600;
        font-size: clamp(0.8rem, 2vw, 0.9rem);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
        white-space: nowrap;
      }
      
      .primary-btn { background: white; color: var(--primary-main); }
      .secondary-btn { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); }
      
      .action-btn:hover { transform: scale(1.05); }
      
      .radar-container {
        display: flex;
        justify-content: center;
        width: 100%;
        margin: 0 auto;
        position: relative; /* Added for canvas container positioning */
      }
      
      .radar-chart {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
      }
      
      /* Canvas container for responsive charts */
      .canvas-container {
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 100%; /* 1:1 Aspect Ratio */
      }
      
      .canvas-container canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      /* Details & Insights */
      .details-grid, .growth-insights, .insights-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.2rem;
        width: 100%; /* Ensure grids take full width */
        box-sizing: border-box;
      }
      
      .detail-card, .insight-card, .insight-item {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.5rem;
        border-left: 4px solid var(--trait-color, white);
        transition: transform 0.3s ease;
        box-sizing: border-box;
        width: 100%; /* Ensure cards take full grid cell width */
        word-wrap: break-word; /* Prevent long text from overflowing */
        overflow-wrap: break-word;
      }
      
      .detail-card:hover { transform: translateX(5px); }
      
      /* Growth Chart */
      .growth-chart-container {
        width: 100%;
        margin-bottom: 2rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 1rem;
        padding: 1rem;
        box-sizing: border-box;
      }
      
      /* Responsive Media Queries */
      @media (max-width: 768px) {
        .personality-container {
          padding: clamp(0.6rem, 2vw, 1rem);
          gap: clamp(0.6rem, 1.5vw, 1rem);
          max-height: calc(100vh - 100px); /* Adjust for smaller screens */
        }
        
        .personality-header {
          margin-bottom: clamp(0.8rem, 1.5vw, 1.2rem);
        }
        
        .personality-title {
          font-size: clamp(1.3rem, 4vw, 1.8rem);
        }
        
        .personality-subtitle {
          font-size: clamp(0.8rem, 2vw, 1rem);
          padding: 0 5px;
        }
        
        .personality-tabs {
          padding: 0.4rem;
          gap: 0.4rem;
        }
        
        .personality-tab {
          padding: 0.5rem 0.9rem;
          font-size: clamp(0.75rem, 1.8vw, 0.9rem);
          min-width: 70px; /* Smaller minimum width for medium screens */
        }
        
        .tab-emoji {
          font-size: 1.1rem;
        }
        
        .personality-intro {
          padding: clamp(0.6rem, 2vw, 1rem);
          margin-bottom: 1rem;
        }
        
        .personality-intro p {
          font-size: clamp(0.8rem, 2vw, 0.95rem);
        }
        
        .personality-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(0.6rem, 1.5vw, 1rem);
        }
        
        .personality-card {
          padding: clamp(0.8rem, 2vw, 1.2rem);
          min-height: 180px; /* Smaller minimum height for medium screens */
        }
        
        .trait-name {
          font-size: clamp(0.95rem, 2.5vw, 1.1rem);
        }
        
        .trait-percentage {
          font-size: clamp(1.6rem, 4vw, 2rem);
        }
        
        .trait-description {
          font-size: clamp(0.75rem, 2vw, 0.85rem);
        }
        
        .personality-radar-section {
          padding: clamp(0.8rem, 2vw, 1.2rem);
        }
        
        .radar-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.8rem;
        }
        
        .radar-title {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
        }
        
        .action-buttons {
          width: 100%;
          justify-content: stretch;
        }
        
        .action-btn {
          flex: 1;
          justify-content: center;
          padding: 0.5rem 0.8rem;
          font-size: clamp(0.75rem, 1.8vw, 0.85rem);
        }
        
        .action-btn i {
          font-size: 0.9rem;
        }
        
        .details-grid, .growth-insights, .insights-list {
          grid-template-columns: 1fr;
          gap: clamp(0.6rem, 1.5vw, 1rem);
        }
        
        .detail-card, .insight-card, .insight-item {
          padding: clamp(0.8rem, 2vw, 1.2rem);
        }
        
        .personality-content {
          max-height: calc(100vh - 200px); /* Adjust for smaller screens */
        }
      }
      
      @media (max-width: 480px) {
        .personality-container {
          padding: 0.6rem;
          gap: 0.6rem;
          max-height: calc(100vh - 80px); /* Further adjust for very small screens */
        }
        
        .personality-header {
          margin-bottom: 0.8rem;
        }
        
        .personality-title {
          font-size: 1.4rem;
          gap: 0.4rem;
        }
        
        .title-emoji {
          font-size: 1.6rem;
        }
        
        .personality-subtitle {
          font-size: 0.8rem;
        }
        
        .personality-tabs {
          padding: 0.3rem;
          gap: 0.3rem;
          border-radius: 1rem;
        }
        
        .personality-tab {
          padding: 0.45rem 0.7rem;
          font-size: 0.75rem;
          flex: 1 1 40%;
          justify-content: center;
          gap: 0.3rem;
          min-width: 60px; /* Even smaller minimum width for very small screens */
        }
        
        .tab-emoji {
          font-size: 1rem;
        }
        
        .personality-intro {
          padding: 0.8rem;
          margin-bottom: 0.8rem;
        }
        
        .personality-intro p {
          font-size: 0.8rem;
          line-height: 1.5;
        }
        
        .personality-grid {
          grid-template-columns: 1fr;
          gap: 0.8rem;
        }
        
        .personality-card {
          padding: 1rem;
          min-height: 160px; /* Even smaller minimum height for very small screens */
        }
        
        .trait-name {
          font-size: 1rem;
        }
        
        .trait-icon {
          width: 40px;
          height: 40px;
          font-size: 1.3rem;
        }
        
        .trait-percentage {
          font-size: 1.8rem;
        }
        
        .trait-description {
          font-size: 0.8rem;
        }
        
        .personality-radar-section {
          padding: 0.8rem;
          gap: 1rem;
        }
        
        .radar-header {
          gap: 0.6rem;
        }
        
        .radar-title {
          font-size: 1.1rem;
        }
        
        .action-buttons {
          gap: 0.5rem;
        }
        
        .action-btn {
          padding: 0.5rem 0.7rem;
          font-size: 0.75rem;
          gap: 0.3rem;
        }
        
        .action-btn i {
          font-size: 0.85rem;
        }
        
        .action-btn span {
          display: inline;
        }
        
        .growth-chart-container {
          padding: 0.8rem;
        }
        
        .details-grid, .growth-insights, .insights-list {
          grid-template-columns: 1fr;
          gap: 0.8rem;
        }
        
        .detail-card, .insight-card, .insight-item {
          padding: 1rem;
        }
        
        .personality-content {
          max-height: calc(100vh - 180px); /* Further adjust for very small screens */
        }
        
        /* Adjust canvas aspect ratio for very small screens */
        .canvas-container {
          padding-bottom: 100%; /* Keep 1:1 aspect ratio */
        }
      }
      
      /* Loading Animation */
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .loading-personality, .loading-details, .loading-growth, .loading-insights {
        animation: pulse 1.5s infinite;
        text-align: center;
        padding: 2rem;
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

        // Check if Chart.js is loaded, if not, load it
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => fetchAndAnalyzeEntries();
            document.head.appendChild(script);
        } else {
            fetchAndAnalyzeEntries();
        }

        // Fetch journal entries and analyze them
        async function fetchAndAnalyzeEntries() {
            // Show loading state
            personalityGrid.innerHTML = '<div class="loading-personality">Fetching your journal entries...</div>';
            detailsGrid.innerHTML = '<div class="loading-details">Please wait...</div>';
            growthInsights.innerHTML = '<div class="loading-growth">Please wait...</div>';
            insightsList.innerHTML = '<div class="loading-insights">Please wait...</div>';

            try {
                // Step 1: Fetch journal entries from your Mood Garden app's API
                // This assumes you have a function `api()` to get entries
                let entries = [];
                try {
                    if (typeof api === 'function') {
                        const entriesResponse = await api('/entries');
                        if (entriesResponse && entriesResponse.data) {
                            entries = entriesResponse.data.map(entry => entry.text);
                        }
                    }
                } catch (err) {
                    console.log('Could not fetch entries via api function, trying fallback method');
                }

                // Fallback: Try to get entries from localStorage if available
                if (entries.length === 0) {
                    try {
                        const storedEntries = localStorage.getItem('journalEntries');
                        if (storedEntries) {
                            entries = JSON.parse(storedEntries).map(entry => entry.text);
                        }
                    } catch (err) {
                        console.log('Could not fetch entries from localStorage');
                    }
                }

                if (entries.length === 0) {
                    throw new Error("No journal entries found to analyze.");
                }

                // Step 2: Send entries to personality analyzer
                const analysisResponse = await fetch('http://localhost:5003/analyze_entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: entries })
                });

                if (!analysisResponse.ok) {
                    throw new Error('Personality analyzer service error.');
                }

                const analysisResult = await analysisResponse.json();
                handlePersonalityData(analysisResult);

            } catch (error) {
                console.error('Analysis failed:', error);
                handleError(error.message);
            }
        }

        // Handle personality data
        function handlePersonalityData(res) {
            console.log('Analysis result:', res);

            if (!res || !res.personality_profile) {
                const errorMsg = res.error || 'Could not analyze entries. Please try again.';
                handleError(errorMsg);
                return;
            }

            const personality = res.personality_profile;

            // Render personality cards with the new data
            renderPersonalityCards(personality);

            // Create radar chart with the new data
            createRadarChart(personality);

            // Render trait details with the new data
            renderTraitDetails(personality);

            // Render growth chart with the new data
            renderGrowthChart(personality);

            // Render insights with the new data
            renderInsights(personality);

            // Set up button functionality
            setupButtonFunctionality(personality);
        }

        // Handle errors
        function handleError(message) {
            console.error('Error:', message);
            personalityGrid.innerHTML = `<div style="color:rgba(255,255,255,0.8);">Error: ${message}</div>`;
            detailsGrid.innerHTML = `<div style="color:rgba(255,255,255,0.8);">Error: ${message}</div>`;
            growthInsights.innerHTML = `<div style="color:rgba(255,255,255,0.8);">Error: ${message}</div>`;
            insightsList.innerHTML = `<div style="color:rgba(255,255,255,0.8);">Error: ${message}</div>`;
        }

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
                // The new analyzer gives percentages, so we use them directly
                const percent = Math.round(value);
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

            // The new analyzer gives percentages, so we use them directly
            const normalizedData = Object.values(personality);

            window._personalityRadar = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: Object.keys(personality),
                    datasets: [{
                        label: 'Your Personality',
                        data: normalizedData,
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
                    responsive: true,
                    maintainAspectRatio: false, // Changed to false for better responsiveness
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
                    }
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
                // The new analyzer gives percentages, so we use them directly
                const percent = Math.round(value);

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
                            borderWidth: 2
                        },
                        {
                            label: 'Conscientiousness',
                            data: conscientiousnessData,
                            borderColor: 'rgba(240, 147, 251, 1)',
                            backgroundColor: 'rgba(240, 147, 251, 0.1)',
                            tension: 0.4,
                            borderWidth: 2
                        },
                        {
                            label: 'Extraversion',
                            data: extraversionData,
                            borderColor: 'rgba(79, 172, 254, 1)',
                            backgroundColor: 'rgba(79, 172, 254, 0.1)',
                            tension: 0.4,
                            borderWidth: 2
                        },
                        {
                            label: 'Agreeableness',
                            data: agreeablenessData,
                            borderColor: 'rgba(67, 233, 123, 1)',
                            backgroundColor: 'rgba(67, 233, 123, 0.1)',
                            tension: 0.4,
                            borderWidth: 2
                        },
                        {
                            label: 'Neuroticism',
                            data: neuroticismData,
                            borderColor: 'rgba(250, 112, 154, 1)',
                            backgroundColor: 'rgba(250, 112, 154, 0.1)',
                            tension: 0.4,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Changed to false for better responsiveness
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                padding: 12,
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
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: {
                                    size: 11
                                }
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

            // Get total value for percentage calculations
            const totalValue = Object.values(personality).reduce((sum, val) => sum + val, 0);

            // If totalValue is 0, return a default insight
            if (totalValue === 0) {
                return [{
                    type: 'neutral',
                    icon: 'fas fa-info-circle',
                    title: 'No Data Available',
                    content: 'Start journaling to get personalized insights about your personality.'
                }];
            }

            // Find the highest and lowest traits
            let highestTrait = '';
            let highestValue = 0;
            let lowestTrait = '';
            let lowestValue = 100;

            Object.entries(personality).forEach(([trait, value]) => {
                const normalizedValue = value;
                if (normalizedValue > highestValue) {
                    highestValue = normalizedValue;
                    highestTrait = trait;
                }
                if (normalizedValue < lowestValue) {
                    lowestValue = normalizedValue;
                    lowestTrait = trait;
                }
            });

            // Add insight about highest trait
            insights.push({
                type: 'positive',
                icon: 'fas fa-star',
                title: `Your Strongest Trait: ${highestTrait}`,
                content: `Your ${highestTrait.toLowerCase()} score of ${highestValue}% is your strongest personality trait. This significantly influences how you interact with the world.`
            });

            // Add insight about lowest trait
            if (lowestValue < 40) {
                insights.push({
                    type: 'neutral',
                    icon: 'fas fa-exclamation-circle',
                    title: `Growth Opportunity: ${lowestTrait}`,
                    content: `Your ${lowestTrait.toLowerCase()} score of ${lowestValue}% is lower than your other traits. Consider exploring activities that might help develop this aspect of your personality.`
                });
            }

            // Add insight about balance
            const traitValues = Object.values(personality);
            const average = traitValues.reduce((sum, val) => sum + val, 0) / traitValues.length;
            const variance = traitValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / traitValues.length;
            const standardDeviation = Math.sqrt(variance);

            if (standardDeviation < 15) {
                insights.push({
                    type: 'positive',
                    icon: 'fas fa-balance-scale',
                    title: 'Well-Balanced Personality',
                    content: 'Your personality traits are well-balanced, indicating versatility and adaptability in different situations.'
                });
            } else {
                insights.push({
                    type: 'neutral',
                    icon: 'fas fa-chart-pie',
                    title: 'Distinct Personality Profile',
                    content: 'Your personality shows distinct strengths in certain areas, which gives you a unique approach to life.'
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

                // Re-fetch and analyze entries
                fetchAndAnalyzeEntries().then(() => {
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
            padding: 12px 18px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-size: 1rem;
            backdrop-filter: blur(10px);
          `;
                    successMessage.textContent = 'Personality data updated successfully!';
                    document.body.appendChild(successMessage);

                    // Remove message after 3 seconds
                    setTimeout(() => {
                        successMessage.style.animation = 'slideOut 0.3s ease';
                        setTimeout(() => {
                            if (document.body.contains(successMessage)) {
                                document.body.removeChild(successMessage);
                            }
                        }, 300);
                    }, 3000);
                });
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
    } catch (error) {
        console.error('Error in showPersonality function:', error);
        const main = document.getElementById('maincard');
        if (main) {
            main.innerHTML = '<div style="color:rgba(255,255,255,0.8);padding:20px;">Error loading personality dashboard. Please try again later.</div>';
        }
    }
}
// Enhanced Motivation Page with Premium Features
function showMotivation() {
    localStorage.setItem("currentPage", "page_motivation");

    const main = document.getElementById('maincard');
    main.innerHTML = '';

    // Create and append motivation container
    const motivationContainer = createMotivationContainer();
    main.appendChild(motivationContainer);

    // Add styles
    addMotivationStyles();

    // Initialize components
    initializeMotivationApp();
}
// Create main container structure
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
          <div class="quote-label" id="quoteLabel">Quote of the Day</div>
          <div class="quote-date" id="quoteDate"></div>
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
        <span id="currentDate"></span>
      </div>
      <div class="pagination-controls">
        <button class="page-btn" id="prevDay" title="Previous day">
          <span class="btn-emoji">⏠️</span>
        </button>
        <button class="page-btn" id="todayQuote" title="Today's quote">
          <span class="btn-emoji">📅</span>
        </button>
        <button class="page-btn" id="nextDay" title="Next day">
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
// Add enhanced CSS styles - EXPANDED VERSION
function addMotivationStyles() {
    // Only add styles if not already present
    if (document.getElementById('motivation-enhanced-styles')) return;
    const motivationStyles = document.createElement('style');
    motivationStyles.id = 'motivation-enhanced-styles';
    motivationStyles.textContent = `
    /* Motivation Container - EXPANDED */
    .motivation-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: var(--gradient-primary);
      border-radius: 1.2rem;
      box-shadow: 0 15px 30px rgba(139, 92, 246, 0.25);
      color: white;
      height: 100%;
      overflow-y: auto;
      position: relative;
    }
    
    /* Custom scrollbar for entire container */
    .motivation-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .motivation-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .motivation-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.4);
      border-radius: 4px;
    }
    
    .motivation-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.6);
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
    
    /* Header Styles - COMPACTED */
    .motivation-header {
      text-align: center;
      margin-bottom: 0.5rem;
      position: relative;
      z-index: 1;
    }
    
    .motivation-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      margin: 0 0 0.3rem;
      font-size: 1.8rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .title-emoji {
      font-size: 2rem;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .motivation-subtitle {
      font-size: 0.9rem;
      opacity: 0.9;
      max-width: 500px;
      margin: 0 auto;
    }
    
    /* Tab Styles - EXPANDED */
    .motivation-tabs {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.15);
      padding: 0.5rem;
      border-radius: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 1;
    }
    
    .motivation-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.8rem 1.2rem;
      border: none;
      border-radius: 1.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      font-size: 0.9rem;
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
      transform: translateY(-3px);
    }
    
    .motivation-tab.active {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .tab-emoji {
      font-size: 1.2rem;
    }
    
    /* Content Styles - EXPANDED */
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
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Quotes Tab - EXPANDED WITH LARGER CARD */
    .quote-container {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      margin-bottom: 1.2rem;
    }
    
    .quote-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 2rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      min-height: 250px;
      flex: 1;
    }
    
    .quote-card::after {
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
    
    .quote-card:hover::after {
      opacity: 1;
    }
    
    .quote-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .quote-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    
    .quote-label {
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
      text-align: center;
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      border-radius: 1rem;
    }
    
    .quote-date {
      font-size: 1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      margin-bottom: 1rem;
    }
    
    .quote-text {
      font-size: 1.3rem;
      font-weight: 500;
      color: white;
      line-height: 1.6;
      flex: 1;
      padding: 0 0.5rem;
      overflow-y: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .quote-author {
      font-size: 1.1rem;
      font-style: italic;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 1.2rem;
      text-align: right;
    }
    
    .quote-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.2rem;
      justify-content: center;
    }
    
    .action-btn {
      width: 50px;
      height: 50px;
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
    
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    .btn-emoji {
      font-size: 1.4rem;
    }
    
    .quote-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.2rem;
      padding: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
    }
    
    .page-info {
      font-size: 0.9rem;
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
    
    .page-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    /* Videos Tab - EXPANDED */
    .video-categories {
      margin-bottom: 1rem;
    }
    
    .category-tabs {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.4rem;
      border-radius: 1.2rem;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .category-tab {
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
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }
    
    .category-tab:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      transform: translateY(-2px);
    }
    
    .category-tab.active {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    }
    
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .video-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    
    .video-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .video-thumbnail {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      background: rgba(255, 255, 255, 0.1);
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
      padding: 1rem;
    }
    
    .video-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: white;
      margin-bottom: 0.5rem;
    }
    
    .video-description {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 0.5rem;
    }
    
    .video-duration {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    
    .video-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
    }
    
    /* Exercises Tab - EXPANDED */
    .exercise-categories {
      margin-bottom: 1rem;
    }
    
    .exercise-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .exercise-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    
    .exercise-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.2);
    }
    
    .exercise-thumbnail {
      width: 100%;
      height: 120px;
      background: var(--gradient-primary);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 1rem;
    }
    
    .exercise-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: white;
      margin-bottom: 0.5rem;
    }
    
    .exercise-description {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 0.5rem;
      text-align: center;
    }
    
    .exercise-details {
      padding: 1rem;
    }
    
    .exercise-instructions {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 0.5rem;
    }
    
    .exercise-duration {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
    }
    
    .exercise-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.8rem;
    }
    
    /* Breathing Tab - EXPANDED */
    .breathing-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1rem;
    }
    
    .breathing-selector {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    
    .breathing-selector h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      text-align: center;
      color: white;
      font-size: 1.2rem;
    }
    
    .breathing-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    
    .breathing-option {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      border: none;
      border-radius: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .breathing-option:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .breathing-option.active {
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .technique-name {
      font-weight: 600;
      font-size: 1.1rem;
    }
    
    .technique-desc {
      font-size: 0.9rem;
      opacity: 0.8;
    }
    
    .breathing-exercise {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    
    .breathing-circle {
      width: 200px;
      height: 200px;
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
      font-size: 1.2rem;
      font-weight: 600;
      color: white;
      text-align: center;
    }
    
    .breathing-controls {
      display: flex;
      gap: 1rem;
    }
    
    .control-btn {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 2rem;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }
    
    .control-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    
    .control-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .breathing-info {
      max-width: 500px;
      text-align: center;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      border-radius: 1.2rem;
      padding: 1.5rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    
    .info-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: white;
      margin-bottom: 0.8rem;
    }
    
    .info-description {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
    }
    
    /* Loading States - EXPANDED */
    .loading-videos, .loading-exercises {
      display: flex;
      justify-content: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.9);
      font-style: italic;
      font-size: 1rem;
    }
    
    /* Notification Styles - EXPANDED */
    .notification {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: rgba(139, 92, 246, 0.9);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
      font-size: 0.9rem;
      backdrop-filter: blur(10px);
      max-width: 300px;
    }
    
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    /* Responsive Design - EXPANDED */
    @media (max-width: 768px) {
      .motivation-container {
        padding: 1rem;
        gap: 1rem;
        height: 100%;
        margin: 10px;
      }
      
      .motivation-header {
        margin-bottom: 0.3rem;
      }
      
      .motivation-title {
        font-size: 1.6rem;
      }
      
      .title-emoji {
        font-size: 1.8rem;
      }
      
      .motivation-tabs {
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.4rem;
        border-radius: 1.2rem;
      }
      
      .motivation-tab {
        flex: 0 1 auto;
        padding: 0.5rem 0.8rem;
        font-size: 0.8rem;
        border-radius: 1.2rem;
      }

      .category-tabs {
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.3rem;
        border-radius: 1rem;
      }

      .category-tab {
        flex: 0 1 auto;
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        border-radius: 1rem;
      }
      
      .quote-card {
        padding: 1.5rem;
        min-height: 200px;
      }
      
      .quote-text {
        font-size: 1.1rem;
      }
      
      .quote-author {
        font-size: 1rem;
        margin-top: 1rem;
      }
      
      .quote-actions {
        gap: 0.8rem;
        margin-top: 1rem;
      }
      
      .action-btn {
        width: 45px;
        height: 45px;
      }
      
      .btn-emoji {
        font-size: 1.2rem;
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
      
      .breathing-circle {
        width: 160px;
        height: 160px;
      }
      
      .breathing-text {
        font-size: 1rem;
      }
    }
  `;

    document.head.appendChild(motivationStyles);
}
// Initialize motivation app
function initializeMotivationApp() {
    // Data
    const appData = {
        // Quotes organized by month and day
        quotes: {
            1: { // January
                1: { text: "🎉 New year, new beginnings. Every day is a fresh start.", author: "Unknown" },
                2: { text: "🌱 Growth begins at the end of your comfort zone.", author: "Unknown" },
                3: { text: "⭐ Your potential is endless. Go do what you were created to do.", author: "Unknown" },
                4: { text: "🔥 The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
                5: { text: "💫 You are braver than you believe, stronger than you seem.", author: "A.A. Milne" },
                6: { text: "🌟 The only way to do great work is to love what you do.", author: "Steve Jobs" },
                7: { text: "🌈 Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
                8: { text: "🎯 Focus on being productive instead of busy.", author: "Tim Ferriss" },
                9: { text: "💎 You are enough just as you are.", author: "Meghan Markle" },
                10: { text: "🌅 Every sunset brings the promise of a new dawn.", author: "Ralph Waldo Emerson" },
                11: { text: "🦋 Change is the only constant in life.", author: "Heraclitus" },
                12: { text: "🌸 The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
                13: { text: "⚡ Your limitation—it's only your imagination.", author: "Unknown" },
                14: { text: "🎨 Great things never come from comfort zones.", author: "Unknown" },
                15: { text: "🌙 Dream it. Wish it. Do it.", author: "Unknown" },
                16: { text: "💖 Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
                17: { text: "🔥 The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
                18: { text: "🌊 Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
                19: { text: "🌟 Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
                20: { text: "🎯 Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
                21: { text: "🌱 Little things make big days.", author: "Unknown" },
                22: { text: "💫 It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
                23: { text: "🌈 Don't wait for opportunity. Create it.", author: "Unknown" },
                24: { text: "🎉 Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
                25: { text: "🦋 The key to success is to focus on goals, not obstacles.", author: "Unknown" },
                26: { text: "🌅 Dream bigger. Do bigger.", author: "Unknown" },
                27: { text: "💎 You don't need to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
                28: { text: "🌟 Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
                29: { text: "🔥 Instead of wondering when your next vacation is, maybe you should set up a life you don't need to escape from.", author: "Seth Godin" },
                30: { text: "🌸 The only impossible journey is the one you never begin.", author: "Tony Robbins" },
                31: { text: "🎨 In the end, we only regret the chances we didn't take.", author: "Lewis Carroll" }
            },
            2: { // February
                1: { text: "❤️ Love yourself first and everything else falls into line.", author: "Lucille Ball" },
                2: { text: "🌱 You have been criticizing yourself for years, and it hasn't worked. Try approving of yourself and see what happens.", author: "Louise Hay" },
                3: { text: "⭐ You are confined only by the walls you build yourself.", author: "Andrew Murphy" },
                4: { text: "🔥 The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
                5: { text: "💫 Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
                6: { text: "🌟 What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
                7: { text: "🌈 Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
                8: { text: "🎯 Two roads diverged in a wood, and I—I took the one less traveled by.", author: "Robert Frost" },
                9: { text: "💎 The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                10: { text: "🌅 It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
                11: { text: "🦋 The purpose of our lives is to be happy.", author: "Dalai Lama" },
                12: { text: "🌸 Life is what happens when you're busy making other plans.", author: "John Lennon" },
                13: { text: "⚡ Get busy living or get busy dying.", author: "Stephen King" },
                14: { text: "🎨 You only live once, but if you do it right, once is enough.", author: "Mae West" },
                15: { text: "🌙 Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas A. Edison" },
                16: { text: "💖 If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
                17: { text: "🔥 Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                18: { text: "🌊 The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.", author: "Helen Keller" },
                19: { text: "🌟 It is better to be hated for what you are than to be loved for what you are not.", author: "André Gide" },
                20: { text: "🎯 Good things come to those who believe, better things come to those who are patient, and the best things come to those who don't give up.", author: "Unknown" },
                21: { text: "🌱 Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.", author: "Mark Twain" },
                22: { text: "💫 The only impossible thing is that which you don't attempt.", author: "Unknown" },
                23: { text: "🌈 Challenges are what make life interesting and overcoming them is what makes life meaningful.", author: "Joshua J. Marine" },
                24: { text: "🎉 Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
                25: { text: "🦋 Let us always meet each other with smile, for the smile is the beginning of love.", author: "Mother Teresa" },
                26: { text: "🌅 The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill" },
                27: { text: "💎 You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
                28: { text: "🌟 Whether you think you can or you think you can't, you're right.", author: "Henry Ford" }
            },
            3: { // March
                1: { text: "🌱 Spring is nature's way of saying, 'Let's party!'", author: "Robin Williams" },
                2: { text: "⭐ The secret of getting ahead is getting started.", author: "Mark Twain" },
                3: { text: "🔥 It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
                4: { text: "💫 If you're offered a seat on a rocket ship, don't ask what seat! Just get on.", author: "Sheryl Sandberg" },
                5: { text: "🌟 Perfection is not attainable, but if we chase perfection we can catch excellence.", author: "Vince Lombardi" },
                6: { text: "🌈 Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
                7: { text: "🎯 The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
                8: { text: "💎 Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
                9: { text: "🌅 The best revenge is massive success.", author: "Frank Sinatra" },
                10: { text: "🦋 Don't cry because it's over, smile because it happened.", author: "Dr. Seuss" },
                11: { text: "🌸 In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
                12: { text: "⚡ If you tell the truth you don't have to remember anything.", author: "Mark Twain" },
                13: { text: "🎨 A friend is someone who knows all about you and still loves you.", author: "Elbert Hubbard" },
                14: { text: "🌙 To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
                15: { text: "💖 I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou" },
                16: { text: "🔥 Either you run the day or the day runs you.", author: "Jim Rohn" },
                17: { text: "🌊 Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
                18: { text: "🌟 The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
                19: { text: "🎯 Whatever you are, be a good one.", author: "Abraham Lincoln" },
                20: { text: "🌱 The only way to do great work is to love what you do.", author: "Steve Jobs" },
                21: { text: "💫 If you look at what you have in life, you'll always have more. If you look at what you don't have in life, you'll never have enough.", author: "Oprah Winfrey" },
                22: { text: "🌈 It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
                23: { text: "🎉 Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
                24: { text: "🦋 Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
                25: { text: "🌅 Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
                26: { text: "💎 I can't change the direction of the wind, but I can adjust my sails to always reach my destination.", author: "Jimmy Dean" },
                27: { text: "🌟 No matter what people tell you, words and ideas can change the world.", author: "Robin Williams" },
                28: { text: "🔥 The question isn't who is going to let me; it's who is going to stop me.", author: "Ayn Rand" },
                29: { text: "🌊 If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
                30: { text: "🌸 The secret of success is to do the common thing uncommonly well.", author: "John D. Rockefeller Jr." },
                31: { text: "⚡ I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" }
            },
            4: { // April
                1: { text: "🌸 April showers bring May flowers.", author: "Proverb" },
                2: { text: "🌱 The earth laughs in flowers.", author: "Ralph Waldo Emerson" },
                3: { text: "⭐ Where flowers bloom, so does hope.", author: "Lady Bird Johnson" },
                4: { text: "🔥 Every flower must grow through dirt.", author: "Proverb" },
                5: { text: "💫 A flower cannot blossom without sunshine, and man cannot live without love.", author: "Max Muller" },
                6: { text: "🌟 Like wildflowers; you must allow yourself to grow in all the places people thought you never would.", author: "E.V." },
                7: { text: "🌈 Happiness blooms from within.", author: "Unknown" },
                8: { text: "🎯 After winter comes the spring. After darkness comes the dawn.", author: "Proverb" },
                9: { text: "💎 Every day is a fresh start. Every morning is a new beginning.", author: "Unknown" },
                10: { text: "🌅 The sun is a daily reminder that we too can rise again.", author: "Unknown" },
                11: { text: "🦋 Just when the caterpillar thought the world was ending, he turned into a butterfly.", author: "Proverb" },
                12: { text: "🌸 Spring is a time of rebirth and renewal.", author: "Unknown" },
                13: { text: "⚡ No winter lasts forever; no spring skips its turn.", author: "Hal Borland" },
                14: { text: "🎨 April is a promise that May is bound to keep.", author: "Hal Borland" },
                15: { text: "🌙 The earth has music for those who listen.", author: "William Shakespeare" },
                16: { text: "💖 Where there is hope, there is faith. Where there is faith, miracles can occur.", author: "Unknown" },
                17: { text: "🔥 Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
                18: { text: "🌊 The world is mud-luscious and puddle-wonderful.", author: "E.E. Cummings" },
                19: { text: "🌟 In the spring, at the end of the day, you should smell like dirt.", author: "Margaret Atwood" },
                20: { text: "🎯 Spring is nature's way of saying, 'Let's party!'", author: "Robin Williams" },
                21: { text: "🌱 The sun shineth, the land is green, and the waters are flowing.", author: "Irish Blessing" },
                22: { text: "💫 April is the kindest month. Breed lilacs out of the dead land.", author: "T.S. Eliot" },
                23: { text: "🌈 Spring adds new life and new beauty to all that is.", author: "Jessica Harrelson" },
                24: { text: "🎉 Spring is when you feel like whistling even with a shoe full of slush.", author: "Doug Larson" },
                25: { text: "🦋 Despite the forecast, live like it's spring.", author: "Lilly Pulitzer" },
                26: { text: "🌅 Spring will not let me stay in this house.", author: "Catherine the Great" },
                27: { text: "💎 The first day of spring is one thing, and the first spring day is another.", author: "Henry Van Dyke" },
                28: { text: "🌟 Spring is when life's alive in everything.", author: "Christina Rossetti" },
                29: { text: "🔥 April, dressed in all his finery, flaunts his beauty everywhere.", author: "Shakespeare" },
                30: { text: "🌊 Spring shows what God can do with a drab and dirty world.", author: "Victor Hugo" }
            },
            5: { // May
                1: { text: "🌸 May your life be like a wildflower, growing freely in the most beautiful places.", author: "Unknown" },
                2: { text: "🌱 The world's favorite season is the spring. All things seem possible in May.", author: "Edwin Way Teale" },
                3: { text: "⭐ May is a month of fresh beginnings and new growth.", author: "Unknown" },
                4: { text: "🔥 May, more than any other month of the year, wants us to feel most alive.", author: "Fennel Hudson" },
                5: { text: "💫 Where flowers bloom, so does hope.", author: "Lady Bird Johnson" },
                6: { text: "🌟 May and June. Soft syllables, gentle names for the two best months in the year.", author: "O. Henry" },
                7: { text: "🌈 May is green and floral and embryonic possibility.", author: "Diane Ackerman" },
                8: { text: "🎯 May, the queen of months, is rich in beauty.", author: "R. A. L. Bennett" },
                9: { text: "💎 In the merry month of May, all the pretty flowers are gay.", author: "English Nursery Rhyme" },
                10: { text: "🌅 May is the bridge between April's showers and June's sunshine.", author: "Unknown" },
                11: { text: "🦋 May is nature's way of saying, 'Let's dance!'", author: "Unknown" },
                12: { text: "🌸 The month of May is the pleasant time; its face is beautiful; the blackbird sings his full song.", author: "John Clare" },
                13: { text: "⚡ May, more than any other month of the year, wants us to feel most alive.", author: "Fennel Hudson" },
                14: { text: "🎨 The air in May is sweet with the promise of summer.", author: "Unknown" },
                15: { text: "🌙 May is the month of expectation, the month of wishes, the month of hope.", author: "Emily Bronte" },
                16: { text: "💖 May is a month of fresh beginnings and new growth.", author: "Unknown" },
                17: { text: "🔥 In May, the world is at its best.", author: "Unknown" },
                18: { text: "🌊 May is the month when the air smells so fresh and clean.", author: "Unknown" },
                19: { text: "🌟 May is the month of colors and flowers.", author: "Unknown" },
                20: { text: "🎯 May is the month of sunshine and smiles.", author: "Unknown" },
                21: { text: "🌱 May is the month of new beginnings.", author: "Unknown" },
                22: { text: "💫 May is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 May is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 May is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 May is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 May is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 May is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 May is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 May is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 May is the month of wonder and wisdom.", author: "Unknown" },
                31: { text: "🌸 May is the month of beauty and bliss.", author: "Unknown" }
            },
            6: { // June
                1: { text: "☀️ June is the gateway to summer.", author: "Unknown" },
                2: { text: "🌱 In June, we can smell the first roses of summer.", author: "Unknown" },
                3: { text: "⭐ June is the month of dreams and desires.", author: "Unknown" },
                4: { text: "🔥 June is the month of love and laughter.", author: "Unknown" },
                5: { text: "💫 June is the month of peace and prosperity.", author: "Unknown" },
                6: { text: "🌟 June is the month of joy and jubilation.", author: "Unknown" },
                7: { text: "🌈 June is the month of success and satisfaction.", author: "Unknown" },
                8: { text: "🎯 June is the month of triumph and triumph.", author: "Unknown" },
                9: { text: "💎 June is the month of victory and valor.", author: "Unknown" },
                10: { text: "🌅 June is the month of wonder and wisdom.", author: "Unknown" },
                11: { text: "🦋 June is the month of beauty and bliss.", author: "Unknown" },
                12: { text: "🌸 June is the month of hope and happiness.", author: "Unknown" },
                13: { text: "⚡ June is the month of dreams and desires.", author: "Unknown" },
                14: { text: "🎨 June is the month of love and laughter.", author: "Unknown" },
                15: { text: "🌙 June is the month of peace and prosperity.", author: "Unknown" },
                16: { text: "💖 June is the month of joy and jubilation.", author: "Unknown" },
                17: { text: "🔥 June is the month of success and satisfaction.", author: "Unknown" },
                18: { text: "🌊 June is the month of triumph and triumph.", author: "Unknown" },
                19: { text: "🌟 June is the month of victory and valor.", author: "Unknown" },
                20: { text: "🎯 June is the month of wonder and wisdom.", author: "Unknown" },
                21: { text: "🌱 June is the month of beauty and bliss.", author: "Unknown" },
                22: { text: "💫 June is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 June is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 June is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 June is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 June is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 June is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 June is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 June is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 June is the month of wonder and wisdom.", author: "Unknown" }
            },
            7: { // July
                1: { text: "🎆 July is the month of fireworks and freedom.", author: "Unknown" },
                2: { text: "🌱 July is the month of growth and gratitude.", author: "Unknown" },
                3: { text: "⭐ July is the month of dreams and desires.", author: "Unknown" },
                4: { text: "🔥 July is the month of love and laughter.", author: "Unknown" },
                5: { text: "💫 July is the month of peace and prosperity.", author: "Unknown" },
                6: { text: "🌟 July is the month of joy and jubilation.", author: "Unknown" },
                7: { text: "🌈 July is the month of success and satisfaction.", author: "Unknown" },
                8: { text: "🎯 July is the month of triumph and triumph.", author: "Unknown" },
                9: { text: "💎 July is the month of victory and valor.", author: "Unknown" },
                10: { text: "🌅 July is the month of wonder and wisdom.", author: "Unknown" },
                11: { text: "🦋 July is the month of beauty and bliss.", author: "Unknown" },
                12: { text: "🌸 July is the month of hope and happiness.", author: "Unknown" },
                13: { text: "⚡ July is the month of dreams and desires.", author: "Unknown" },
                14: { text: "🎨 July is the month of love and laughter.", author: "Unknown" },
                15: { text: "🌙 July is the month of peace and prosperity.", author: "Unknown" },
                16: { text: "💖 July is the month of joy and jubilation.", author: "Unknown" },
                17: { text: "🔥 July is the month of success and satisfaction.", author: "Unknown" },
                18: { text: "🌊 July is the month of triumph and triumph.", author: "Unknown" },
                19: { text: "🌟 July is the month of victory and valor.", author: "Unknown" },
                20: { text: "🎯 July is the month of wonder and wisdom.", author: "Unknown" },
                21: { text: "🌱 July is the month of beauty and bliss.", author: "Unknown" },
                22: { text: "💫 July is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 July is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 July is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 July is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 July is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 July is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 July is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 July is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 July is the month of wonder and wisdom.", author: "Unknown" },
                31: { text: "🌸 July is the month of beauty and bliss.", author: "Unknown" }
            },
            8: { // August
                1: { text: "☀️ August is the Sunday of summer.", author: "Unknown" },
                2: { text: "🌱 August is the month of harvest and happiness.", author: "Unknown" },
                3: { text: "⭐ August is the month of dreams and desires.", author: "Unknown" },
                4: { text: "🔥 August is the month of love and laughter.", author: "Unknown" },
                5: { text: "💫 August is the month of peace and prosperity.", author: "Unknown" },
                6: { text: "🌟 August is the month of joy and jubilation.", author: "Unknown" },
                7: { text: "🌈 August is the month of success and satisfaction.", author: "Unknown" },
                8: { text: "🎯 August is the month of triumph and triumph.", author: "Unknown" },
                9: { text: "💎 August is the month of victory and valor.", author: "Unknown" },
                10: { text: "🌅 August is the month of wonder and wisdom.", author: "Unknown" },
                11: { text: "🦋 August is the month of beauty and bliss.", author: "Unknown" },
                12: { text: "🌸 August is the month of hope and happiness.", author: "Unknown" },
                13: { text: "⚡ August is the month of dreams and desires.", author: "Unknown" },
                14: { text: "🎨 August is the month of love and laughter.", author: "Unknown" },
                15: { text: "🌙 August is the month of peace and prosperity.", author: "Unknown" },
                16: { text: "💖 August is the month of joy and jubilation.", author: "Unknown" },
                17: { text: "🔥 August is the month of success and satisfaction.", author: "Unknown" },
                18: { text: "🌊 August is the month of triumph and triumph.", author: "Unknown" },
                19: { text: "🌟 August is the month of victory and valor.", author: "Unknown" },
                20: { text: "🎯 August is the month of wonder and wisdom.", author: "Unknown" },
                21: { text: "🌱 August is the month of beauty and bliss.", author: "Unknown" },
                22: { text: "💫 August is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 August is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 August is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 August is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 August is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 August is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 August is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 August is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 August is the month of wonder and wisdom.", author: "Unknown" },
                31: { text: "🌸 August is the month of beauty and bliss.", author: "Unknown" }
            },
            9: { // September
                1: { text: "🍂 September is the month of new beginnings.", author: "Unknown" },
                2: { text: "🌱 September is the month of growth and gratitude.", author: "Unknown" },
                3: { text: "⭐ September is the month of dreams and desires.", author: "Unknown" },
                4: { text: "🔥 September is the month of love and laughter.", author: "Unknown" },
                5: { text: "💫 September is the month of peace and prosperity.", author: "Unknown" },
                6: { text: "🌟 September is the month of joy and jubilation.", author: "Unknown" },
                7: { text: "🌈 September is the month of success and satisfaction.", author: "Unknown" },
                8: { text: "🎯 September is the month of triumph and triumph.", author: "Unknown" },
                9: { text: "💎 September is the month of victory and valor.", author: "Unknown" },
                10: { text: "🌅 September is the month of wonder and wisdom.", author: "Unknown" },
                11: { text: "🦋 September is the month of beauty and bliss.", author: "Unknown" },
                12: { text: "🌸 September is the month of hope and happiness.", author: "Unknown" },
                13: { text: "⚡ September is the month of dreams and desires.", author: "Unknown" },
                14: { text: "🎨 September is the month of love and laughter.", author: "Unknown" },
                15: { text: "🌙 September is the month of peace and prosperity.", author: "Unknown" },
                16: { text: "💖 September is the month of joy and jubilation.", author: "Unknown" },
                17: { text: "🔥 September is the month of success and satisfaction.", author: "Unknown" },
                18: { text: "🌊 September is the month of triumph and triumph.", author: "Unknown" },
                19: { text: "🌟 September is the month of victory and valor.", author: "Unknown" },
                20: { text: "🎯 September is the month of wonder and wisdom.", author: "Unknown" },
                21: { text: "🌱 September is the month of beauty and bliss.", author: "Unknown" },
                22: { text: "💫 September is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 September is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 September is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 September is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 September is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 September is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 September is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 September is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 September is the month of wonder and wisdom.", author: "Unknown" }
            },
            10: { // October
                1: { text: "🍂 October is the month of colors and change.", author: "Unknown" },
                2: { text: "🌱 October is the month of growth and gratitude.", author: "Unknown" },
                3: { text: "⭐ October is the month of dreams and desires.", author: "Unknown" },
                4: { text: "🔥 October is the month of love and laughter.", author: "Unknown" },
                5: { text: "💫 October is the month of peace and prosperity.", author: "Unknown" },
                6: { text: "🌟 October is the month of joy and jubilation.", author: "Unknown" },
                7: { text: "🌈 October is the month of success and satisfaction.", author: "Unknown" },
                8: { text: "🎯 October is the month of triumph and triumph.", author: "Unknown" },
                9: { text: "💎 October is the month of victory and valor.", author: "Unknown" },
                10: { text: "🌅 October is the month of wonder and wisdom.", author: "Unknown" },
                11: { text: "🦋 October is the month of beauty and bliss.", author: "Unknown" },
                12: { text: "🌸 October is the month of hope and happiness.", author: "Unknown" },
                13: { text: "⚡ October is the month of dreams and desires.", author: "Unknown" },
                14: { text: "🎨 October is the month of love and laughter.", author: "Unknown" },
                15: { text: "🌙 October is the month of peace and prosperity.", author: "Unknown" },
                16: { text: "💖 October is the month of joy and jubilation.", author: "Unknown" },
                17: { text: "🔥 October is the month of success and satisfaction.", author: "Unknown" },
                18: { text: "🌊 October is the month of triumph and triumph.", author: "Unknown" },
                19: { text: "🌟 October is the month of victory and valor.", author: "Unknown" },
                20: { text: "🎯 October is the month of wonder and wisdom.", author: "Unknown" },
                21: { text: "🌱 October is the month of beauty and bliss.", author: "Unknown" },
                22: { text: "💫 October is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 October is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 October is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 October is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 October is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 October is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 October is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 October is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 October is the month of wonder and wisdom.", author: "Unknown" },
                31: { text: "🎃 October ends with a night of magic and mystery.", author: "Unknown" }
            },
            11: { // November
                1: { text: "🍂 November is the month of gratitude and giving.", author: "Unknown" },
                2: { text: "🌱 November is the month of growth and gratitude.", author: "Unknown" },
                3: { text: "⭐ November is the month of dreams and desires.", author: "Unknown" },
                4: { text: "🔥 November is the month of love and laughter.", author: "Unknown" },
                5: { text: "💫 November is the month of peace and prosperity.", author: "Unknown" },
                6: { text: "🌟 November is the month of joy and jubilation.", author: "Unknown" },
                7: { text: "🌈 November is the month of success and satisfaction.", author: "Unknown" },
                8: { text: "🎯 November is the month of triumph and triumph.", author: "Unknown" },
                9: { text: "💎 November is the month of victory and valor.", author: "Unknown" },
                10: { text: "🌅 November is the month of wonder and wisdom.", author: "Unknown" },
                11: { text: "🦋 November is the month of beauty and bliss.", author: "Unknown" },
                12: { text: "🌸 November is the month of hope and happiness.", author: "Unknown" },
                13: { text: "⚡ November is the month of dreams and desires.", author: "Unknown" },
                14: { text: "🎨 November is the month of love and laughter.", author: "Unknown" },
                15: { text: "🌙 November is the month of peace and prosperity.", author: "Unknown" },
                16: { text: "💖 November is the month of joy and jubilation.", author: "Unknown" },
                17: { text: "🔥 November is the month of success and satisfaction.", author: "Unknown" },
                18: { text: "🌊 November is the month of triumph and triumph.", author: "Unknown" },
                19: { text: "🌟 November is the month of victory and valor.", author: "Unknown" },
                20: { text: "🎯 November is the month of wonder and wisdom.", author: "Unknown" },
                21: { text: "🌱 November is the month of beauty and bliss.", author: "Unknown" },
                22: { text: "💫 November is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 November is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 November is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 November is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 November is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 November is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 November is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 November is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 November is the month of wonder and wisdom.", author: "Unknown" }
            },
            12: { // December
                1: { text: "❄️ December is the month of joy and celebration.", author: "Unknown" },
                2: { text: "🌱 December is the month of growth and gratitude.", author: "Unknown" },
                3: { text: "⭐ December is the month of dreams and desires.", author: "Unknown" },
                4: { text: "🔥 December is the month of love and laughter.", author: "Unknown" },
                5: { text: "💫 December is the month of peace and prosperity.", author: "Unknown" },
                6: { text: "🌟 December is the month of joy and jubilation.", author: "Unknown" },
                7: { text: "🌈 December is the month of success and satisfaction.", author: "Unknown" },
                8: { text: "🎯 December is the month of triumph and triumph.", author: "Unknown" },
                9: { text: "💎 December is the month of victory and valor.", author: "Unknown" },
                10: { text: "🌅 December is the month of wonder and wisdom.", author: "Unknown" },
                11: { text: "🦋 December is the month of beauty and bliss.", author: "Unknown" },
                12: { text: "🌸 December is the month of hope and happiness.", author: "Unknown" },
                13: { text: "⚡ December is the month of dreams and desires.", author: "Unknown" },
                14: { text: "🎨 December is the month of love and laughter.", author: "Unknown" },
                15: { text: "🌙 December is the month of peace and prosperity.", author: "Unknown" },
                16: { text: "💖 December is the month of joy and jubilation.", author: "Unknown" },
                17: { text: "🔥 December is the month of success and satisfaction.", author: "Unknown" },
                18: { text: "🌊 December is the month of triumph and triumph.", author: "Unknown" },
                19: { text: "🌟 December is the month of victory and valor.", author: "Unknown" },
                20: { text: "🎯 December is the month of wonder and wisdom.", author: "Unknown" },
                21: { text: "🌱 December is the month of beauty and bliss.", author: "Unknown" },
                22: { text: "💫 December is the month of hope and happiness.", author: "Unknown" },
                23: { text: "🌈 December is the month of dreams and desires.", author: "Unknown" },
                24: { text: "🎉 December is the month of love and laughter.", author: "Unknown" },
                25: { text: "🦋 December is the month of peace and prosperity.", author: "Unknown" },
                26: { text: "🌅 December is the month of joy and jubilation.", author: "Unknown" },
                27: { text: "💎 December is the month of success and satisfaction.", author: "Unknown" },
                28: { text: "🌟 December is the month of triumph and triumph.", author: "Unknown" },
                29: { text: "🔥 December is the month of victory and valor.", author: "Unknown" },
                30: { text: "🌊 December is the month of wonder and wisdom.", author: "Unknown" },
                31: { text: "🎆 December ends with a night of celebration and new beginnings.", author: "Unknown" }
            }
        },
        videos: [
            {
                title: "5-Minute Morning Meditation",
                description: "Start your day with intention and clarity",
                thumbnail: "https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg",
                videoId: "inpok4MKVLM",
                duration: "5:00",
                category: "meditation"
            },
            {
                title: "Positive Energy Guidance",
                description: "Guided meditation for a positive day",
                thumbnail: "https://img.youtube.com/vi/j734gLbQFbU/hqdefault.jpg",
                videoId: "j734gLbQFbU",
                duration: "5:00",
                category: "meditation"
            },
            {
                title: "7-Minute Yoga for Stress",
                description: "Quick yoga flow to melt away stress",
                thumbnail: "https://img.youtube.com/vi/sK_sV3o2k0k/hqdefault.jpg",
                videoId: "sK_sV3o2k0k",
                duration: "7:00",
                category: "stress"
            },
            {
                title: "5-Minute Stoic Gratitude",
                description: "Negative visualization for gratitude",
                thumbnail: "https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg",
                videoId: "ZToicYcHIOU",
                duration: "5:00",
                category: "stress"
            },
            {
                title: "10-Minute Morning Workout",
                description: "Energizing no-equipment full body routine",
                thumbnail: "https://img.youtube.com/vi/w01_496J9yU/hqdefault.jpg",
                videoId: "w01_496J9yU",
                duration: "10:00",
                category: "energy"
            },
            {
                title: "10-Minute Morning Yoga",
                description: "Gentle yoga to wake up your body",
                thumbnail: "https://img.youtube.com/vi/klmBssEYkdU/hqdefault.jpg",
                videoId: "klmBssEYkdU",
                duration: "10:00",
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
        currentDate: new Date(),
        currentQuote: null,
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
        quoteLabel: document.getElementById('quoteLabel'),
        quoteDate: document.getElementById('quoteDate'),
        quoteText: document.getElementById('quoteText'),
        quoteAuthor: document.getElementById('quoteAuthor'),
        videoGrid: document.getElementById('videoGrid'),
        exerciseGrid: document.getElementById('exerciseGrid'),
        currentPageVideo: document.getElementById('currentPageVideo'),
        totalPagesVideo: document.getElementById('totalPagesVideo'),
        currentPageExercise: document.getElementById('currentPageExercise'),
        totalPagesExercise: document.getElementById('totalPagesExercise'),
        breathingCircle: document.getElementById('breathingCircle'),
        breathingText: document.getElementById('breathingText'),
        infoTitle: document.getElementById('infoTitle'),
        infoDescription: document.getElementById('infoDescription'),
        currentDate: document.getElementById('currentDate')
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
        // Get today's quote
        getQuoteForDate(state.currentDate);

        // Navigation buttons
        document.getElementById('prevDay').addEventListener('click', () => {
            const newDate = new Date(state.currentDate);
            newDate.setDate(newDate.getDate() - 1);
            state.currentDate = newDate;
            getQuoteForDate(state.currentDate);
        });

        document.getElementById('nextDay').addEventListener('click', () => {
            const newDate = new Date(state.currentDate);
            newDate.setDate(newDate.getDate() + 1);
            state.currentDate = newDate;
            getQuoteForDate(state.currentDate);
        });

        document.getElementById('todayQuote').addEventListener('click', () => {
            state.currentDate = new Date();
            getQuoteForDate(state.currentDate);
        });

        // Action buttons
        document.getElementById('shareQuote').addEventListener('click', shareQuote);
        document.getElementById('saveQuote').addEventListener('click', saveQuote);
        document.getElementById('favoriteQuote').addEventListener('click', toggleFavorite);
    }

    function getQuoteForDate(date) {
        const month = date.getMonth() + 1; // getMonth() is 0-indexed
        const day = date.getDate();

        // Get the quote for this date
        if (appData.quotes[month] && appData.quotes[month][day]) {
            state.currentQuote = appData.quotes[month][day];
        } else {
            // Fallback to a default quote if date not found
            state.currentQuote = {
                text: "🌟 Every day is a gift. That's why they call it the present.",
                author: "Unknown"
            };
        }

        renderQuote();
    }

    function renderQuote() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        const month = state.currentDate.getMonth();
        const day = state.currentDate.getDate();
        const year = state.currentDate.getFullYear();

        // Update date display
        elements.currentDate.textContent = `${monthNames[month]} ${day}, ${year}`;
        elements.quoteDate.textContent = `${monthNames[month]} ${day}`;

        // Update quote content
        elements.quoteText.textContent = state.currentQuote.text;
        elements.quoteAuthor.textContent = `- ${state.currentQuote.author}`;

        // Update favorite button
        const isFavorite = state.favorites.some(f =>
            f.text === state.currentQuote.text && f.author === state.currentQuote.author
        );
        document.getElementById('favoriteQuote').innerHTML = `<span class="btn-emoji">${isFavorite ? '❤️' : '🤍'}</span>`;
    }

    function shareQuote() {
        const quote = state.currentQuote;
        const text = `"${quote.text}" - ${quote.author}`;

        if (navigator.share) {
            navigator.share({
                title: 'Daily Spark Quote',
                text: text
            });
        } else {
            navigator.clipboard.writeText(text);
            showNotification('Quote copied to clipboard', 'info');
        }
    }

    function saveQuote() {
        const quote = state.currentQuote;

        if (!state.favorites.some(f => f.text === quote.text && f.author === quote.author)) {
            state.favorites.push(quote);
            localStorage.setItem('motivationFavorites', JSON.stringify(state.favorites));
            showNotification('Quote saved to favorites', 'success');
        } else {
            showNotification('Quote already in favorites', 'info');
        }
    }

    function toggleFavorite() {
        const quote = state.currentQuote;
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
          <div class="video-duration">⏱️ ${video.duration}</div>
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
          <div class="exercise-duration">⏱️ ${exercise.duration}</div>
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
    localStorage.setItem("currentPage", "page_chatbot")
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
      height: 100%;
      max-height: calc(100vh - 120px);
      background: var(--gradient-primary);
      border-radius: clamp(10px, 4vw, 25px);
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
      position: relative;
      transition: all 0.3s ease;
      width: 100%;
      box-sizing: border-box;
    }
    
    .chatbot-header {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      padding: clamp(8px, 2vw, 15px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 10;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: clamp(8px, 2vw, 12px);
      min-width: 0;
      flex: 1;
    }
    
    .bot-avatar {
      width: clamp(32px, 7vw, 42px);
      height: clamp(32px, 7vw, 42px);
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.3);
      position: relative;
      flex-shrink: 0;
    }
    
    .bot-image {
      font-size: clamp(16px, 4vw, 22px);
    }
    
    .bot-info h3 {
      margin: 0;
      color: white;
      font-size: clamp(13px, 3vw, 16px);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .bot-status {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: clamp(9px, 2vw, 11px);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .header-actions {
      display: flex;
      gap: clamp(3px, 1vw, 8px);
      flex-shrink: 0;
    }
    
    .action-btn {
      width: clamp(28px, 6vw, 36px);
      height: clamp(28px, 6vw, 36px);
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .btn-emoji {
      font-size: clamp(12px, 3vw, 16px);
    }
    
    /* Chat Window & Messages - COMPACT VERSION */
    .chat-window {
      flex: 1;
      overflow-y: auto;
      padding: clamp(8px, 2vw, 15px);
      display: flex;
      flex-direction: column;
      gap: clamp(10px, 2vw, 15px);
      max-height: calc(100vh - 280px);
    }
    
    .message-content {
      max-width: clamp(60%, 75vw, 75%); /* Reduced from 70-90% to 60-75% */
      padding: clamp(8px, 2vw, 12px) clamp(10px, 2.5vw, 15px); /* Reduced padding */
      border-radius: 16px; /* Slightly smaller border radius */
      font-size: clamp(12px, 3vw, 14px); /* Reduced font size */
      line-height: 1.4; /* Slightly tighter line height */
      position: relative;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .bot-message .message-content {
      background: rgba(139, 92, 246, 0.9);
      color: white;
      border-bottom-left-radius: 4px;
    }
    
    .user-message .message-content {
      background: linear-gradient(135deg, #f093fb, #f5576c);
      color: #000 !important;
      border-bottom-right-radius: 4px;
    }

    .user-message .message-content p { color: #000 !important; }

    .mood-selector {
      margin: 10px 0; /* Reduced from 15px */
      padding: 8px; /* Reduced from 12px */
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px; /* Reduced from 12px */
    }

    .mood-options {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px; /* Reduced from 10px */
    }

    .mood-option {
      flex: 1 1 55px; /* Reduced from 70px */
      min-width: 50px; /* Reduced from 60px */
      max-width: 85px; /* Reduced from 100px */
      padding: 8px 4px; /* Reduced padding */
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px; /* Reduced from 10px */
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px; /* Reduced from 5px */
      cursor: pointer;
    }

    .message-suggestions {
      display: flex;
      flex-direction: column;
      gap: 6px; /* Reduced from 8px */
      margin-top: 10px; /* Reduced from 15px */
    }

    .suggestion-btn {
      width: 100%;
      padding: 8px 12px; /* Reduced padding */
      border-radius: 16px; /* Reduced from 20px */
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      text-align: left;
      font-size: clamp(11px, 2.5vw, 12px); /* Reduced font size */
      cursor: pointer;
    }
    
    /* Input Area */
    .chat-input-container {
      padding: clamp(8px, 2vw, 15px); /* Reduced padding */
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: clamp(4px, 1.5vw, 8px); /* Reduced gap */
      background: white;
      border-radius: clamp(18px, 4vw, 25px); /* Reduced border radius */
      padding: clamp(4px, 1.5vw, 8px) clamp(8px, 2vw, 12px); /* Reduced padding */
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .chat-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 6px 0; /* Reduced padding */
      font-size: clamp(12px, 3vw, 14px); /* Reduced font size */
      outline: none;
      resize: none;
      max-height: 100px; /* Reduced from 120px */
      color: #333;
    }
    
    .emoji-btn, .voice-btn, .attach-btn {
      width: clamp(24px, 5vw, 30px); /* Reduced size */
      height: clamp(24px, 5vw, 30px); /* Reduced size */
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      cursor: pointer;
      opacity: 0.7;
    }

    .send-btn {
      width: clamp(30px, 6vw, 36px); /* Reduced size */
      height: clamp(30px, 6vw, 36px); /* Reduced size */
      border-radius: 50%;
      background: var(--gradient-primary);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    /* History & Search Overlay */
    .history-container, .search-container {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(139, 92, 246, 0.98);
      backdrop-filter: blur(15px);
      z-index: 100;
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
    }

    /* Small Screen Adjustments */
    @media (max-width: 380px) {
      .input-wrapper { gap: 2px; padding: 4px 8px; }
      .attach-btn { display: none; }
      .mood-option { flex: 1 1 25%; }
      .chatbot-header { padding: 8px; }
    }
    
    /* Chat History Styles */
    .history-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(139, 92, 246, 0.95);
      backdrop-filter: blur(10px);
      z-index: 20;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease;
      width: 100%;
      box-sizing: border-box;
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
      padding: 12px 15px; /* Reduced padding */
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      flex-wrap: wrap;
    }
    
    .chatbot-container.dark-theme .history-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .history-title {
      display: flex;
      align-items: center;
      gap: 6px; /* Reduced gap */
      margin: 0;
      color: #ffffff;
      font-size: clamp(14px, 3.5vw, 16px); /* Reduced font size */
      font-weight: 600;
    }
    
    .chatbot-container.dark-theme .history-title {
      color: #e0e0e0;
    }
    
    .history-emoji {
      font-size: 18px; /* Reduced from 20px */
    }
    
    .history-close {
      width: 26px; /* Reduced from 30px */
      height: 26px; /* Reduced from 30px */
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.1);
      color: #ffffff;
      font-size: 14px; /* Reduced from 16px */
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
      gap: 8px; /* Reduced gap */
      padding: 8px 15px; /* Reduced padding */
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      flex-wrap: wrap;
    }
    
    .chatbot-container.dark-theme .history-controls {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .history-control-btn {
      display: flex;
      align-items: center;
      gap: 4px; /* Reduced gap */
      padding: 6px 10px; /* Reduced padding */
      border: none;
      border-radius: 16px; /* Reduced from 20px */
      background: rgba(139, 92, 246, 0.1);
      color: var(--primary-color);
      font-size: 11px; /* Reduced from 12px */
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
      font-size: 12px; /* Reduced from 14px */
    }
    
    .history-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px 15px; /* Reduced padding */
    }
    
    .history-loading {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 15px; /* Reduced padding */
    }
    
    .chatbot-container.dark-theme .history-loading {
      color: #aaa;
    }
    
    .history-item {
      margin-bottom: 12px; /* Reduced from 15px */
      padding: 10px; /* Reduced from 12px */
      border-radius: 8px; /* Reduced from 10px */
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
      font-size: 11px; /* Reduced from 12px */
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 4px; /* Reduced from 5px */
    }
    
    .chatbot-container.dark-theme .history-date {
      color: #aaa;
    }
    
    .history-preview {
      font-size: 13px; /* Reduced from 14px */
      color: #ffffff;
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
      padding: 15px; /* Reduced padding */
    }
    
    .chatbot-container.dark-theme .history-empty {
      color: #aaa;
    }
    
    .search-container {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 12px; /* Reduced from 15px */
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      animation: slideDown 0.3s ease;
      width: 100%;
      box-sizing: border-box;
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
      gap: 8px; /* Reduced gap */
      align-items: center;
      position: relative;
      flex-wrap: wrap;
    }
    
    .search-emoji {
      position: absolute;
      left: 12px; /* Reduced from 15px */
      font-size: 14px; /* Reduced from 16px */
      z-index: 1;
      filter: opacity(0.7);
    }
    
    .search-input {
      flex: 1;
      padding: 8px 12px 8px 35px; /* Reduced padding */
      border: none;
      border-radius: 20px; /* Reduced from 25px */
      background: rgba(139, 92, 246, 0.2);
      color: #ffffff;
      font-size: 13px; /* Reduced from 14px */
      outline: none;
      transition: all 0.3s ease;
      min-width: 180px; /* Reduced from 200px */
    }
    
    .search-input:focus {
      background: rgba(139, 92, 246, 0.4);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .search-close {
      width: 26px; /* Reduced from 30px */
      height: 26px; /* Reduced from 30px */
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      font-size: 14px; /* Reduced from 16px */
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .search-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
    
    .search-results {
      margin-top: 8px; /* Reduced from 10px */
      max-height: 80px; /* Reduced from 100px */
      overflow-y: auto;
    }
    
    .search-result-item {
      padding: 6px 10px; /* Reduced padding */
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px; /* Reduced from 8px */
      margin-bottom: 4px; /* Reduced from 5px */
      color: white;
      font-size: 12px; /* Reduced from 13px */
      cursor: pointer;
      transition: background 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px; /* Reduced gap */
    }
    
    .search-result-item:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .search-result-item .result-emoji {
      font-size: 12px; /* Reduced from 14px */
      opacity: 0.7;
    }
    
    .chat-window {
      flex: 1;
      overflow-y: auto;
      padding: 15px; /* Reduced from 20px */
      background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
      display: flex;
      flex-direction: column;
      gap: 12px; /* Reduced from 15px */
      position: relative;
      max-height: calc(100vh - 260px); /* Adjusted for smaller layout */
    }
    
    .chat-window::-webkit-scrollbar {
      width: 6px; /* Reduced from 8px */
    }
    
    .chat-window::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px; /* Reduced from 4px */
    }
    
    .chat-window::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px; /* Reduced from 4px */
      transition: background 0.3s ease;
    }
    
    .chat-window::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.4);
    }
    
    .bot-message, .user-message {
      display: flex;
      gap: 10px; /* Reduced from 12px */
      animation: messageSlide 0.4s ease-out;
      position: relative;
    }
    
    .user-message {
      flex-direction: row-reverse;
    }
    
    .message-avatar {
      width: 32px; /* Reduced from 38px */
      height: 32px; /* Reduced from 38px */
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px; /* Reduced from 20px */
      flex-shrink: 0;
      transition: transform 0.3s ease;
      cursor: pointer;
    }
    
    .message-avatar:hover {
      transform: scale(1.1);
    }
    
    .bot-message .message-avatar {
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      box-shadow: 0 3px 6px rgba(255, 154, 158, 0.3); /* Reduced shadow */
    }
    
    .user-message .message-avatar {
      background: linear-gradient(135deg, #f093fb, #f5576c);
      box-shadow: 0 3px 6px rgba(240, 147, 251, 0.3); /* Reduced shadow */
    }
    
    .message-content {
      max-width: 65%; /* Reduced from 70% */
      padding: 10px 12px; /* Reduced padding */
      border-radius: 16px; /* Reduced from 20px */
      position: relative;
      transition: all 0.3s ease;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .message-content:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Reduced shadow */
    }
    
    .bot-message .message-content {
      background: rgba(139, 92, 246, 0.8);
      color: #ffffff;
      border-bottom-left-radius: 4px;
    }
    
    .user-message .message-content {
      background: linear-gradient(135deg, #f093fb, #f5576c);
      color: #000000 !important;
      border-bottom-right-radius: 4px;
    }
    
    /* More specific selector for user message text */
    .user-message .message-content p {
      color: #000000 !important;
    }
    
    /* Even more specific for dark theme */
    .chatbot-container.dark-theme .user-message .message-content p {
      color: #000000 !important;
    }
    
    /* Specific for message header in user messages */
    .user-message .message-content .message-time,
    .user-message .message-content .message-status {
      color: #000000 !important;
    }
    
    /* Dark theme overrides for user message */
    .chatbot-container.dark-theme .user-message .message-content {
      color: #000000 !important;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px; /* Reduced from 8px */
      font-size: 10px; /* Reduced from 11px */
      opacity: 0.7;
    }
    
    .message-time {
      color: inherit;
    }
    
    .message-status {
      color: #4ade80;
      font-size: 11px; /* Reduced from 12px */
    }
    
    .message-content p {
      margin: 0;
      line-height: 1.4; /* Reduced from 1.5 */
      font-size: 13px; /* Reduced from 14px */
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .mood-selector {
      margin: 10px 0; /* Reduced from 15px */
      padding: 8px; /* Reduced from 12px */
      background: rgba(139, 92, 246, 0.05);
      border-radius: 10px; /* Reduced from 12px */
    }
    
    .mood-label {
      font-size: 12px; /* Reduced from 13px */
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 8px; /* Reduced from 10px */
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px; /* Reduced from 8px */
    }
    
    .mood-label-emoji {
      font-size: 14px; /* Reduced from 16px */
    }
    
    .mood-options {
      display: flex;
      justify-content: space-between;
      gap: 6px; /* Reduced from 8px */
      flex-wrap: wrap;
    }
    
    .mood-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 4px; /* Reduced padding */
      border: none;
      border-radius: 8px; /* Reduced from 10px */
      background: rgba(139, 92, 246, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 50px; /* Reduced from 60px */
      flex: 1 1 50px;
    }
    
    .mood-option:hover {
      background: rgba(139, 92, 246, 0.2);
      transform: translateY(-2px); /* Reduced from -3px */
      box-shadow: 0 3px 6px rgba(139, 92, 246, 0.2); /* Reduced shadow */
    }
    
    .mood-option.selected {
      background: rgba(139, 92, 246, 0.3);
      box-shadow: 0 3px 6px rgba(139, 92, 246, 0.3); /* Reduced shadow */
    }
    
    .mood-emoji {
      font-size: 18px; /* Reduced from 20px */
      margin-bottom: 3px; /* Reduced from 4px */
    }
    
    .mood-text {
      font-size: 9px; /* Reduced from 10px */
      font-weight: 500;
      color: #ffffff;
    }
    
    .message-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px; /* Reduced from 8px */
      margin-top: 10px; /* Reduced from 12px */
    }
    
    .suggestion-btn {
      padding: 6px 10px; /* Reduced padding */
      border: none;
      border-radius: 14px; /* Reduced from 18px */
      background: rgba(139, 92, 246, 0.1);
      color: var(--primary-color);
      font-size: 11px; /* Reduced from 12px */
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 4px; /* Reduced from 6px */
      flex: 1 1 120px; /* Reduced from 150px */
    }
    
    .suggestion-emoji {
      font-size: 12px; /* Reduced from 14px */
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
      box-shadow: 0 3px 6px rgba(139, 92, 246, 0.2); /* Reduced shadow */
    }
    
    .message-actions {
      display: flex;
      gap: 6px; /* Reduced from 8px */
      margin-top: 8px; /* Reduced from 10px */
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .message-content:hover .message-actions {
      opacity: 1;
    }
    
    .reaction-btn, .copy-btn, .share-btn {
      width: 24px; /* Reduced from 28px */
      height: 24px; /* Reduced from 28px */
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
      font-size: 12px; /* Reduced from 14px */
    }
    
    .reaction-btn:hover, .copy-btn:hover, .share-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: scale(1.1);
    }
    
    .chat-input-container {
      padding: 15px; /* Reduced from 20px */
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 6px; /* Reduced from 8px */
      background: rgba(139, 92, 246, 0.15);
      border-radius: 22px; /* Reduced from 28px */
      padding: 8px 12px; /* Reduced padding */
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12); /* Reduced shadow */
      transition: all 0.3s ease;
    }
    
    .input-wrapper:focus-within {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); /* Reduced shadow */
      transform: translateY(-2px);
    }
    
    .attach-btn, .emoji-btn, .voice-btn {
      width: 30px; /* Reduced from 36px */
      height: 30px; /* Reduced from 36px */
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
      70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); } /* Reduced from 10px */
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    
    @keyframes recordBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .send-btn {
      width: 34px; /* Reduced from 40px */
      height: 34px; /* Reduced from 40px */
      border-radius: 50%;
      border: none;
      background: var(--gradient-primary);
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
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); /* Reduced shadow */
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
      font-size: 16px; /* Reduced from 18px */
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
    }
    
    .send-emoji {
      font-size: 18px; /* Reduced from 20px */
      filter: drop-shadow(0 1px 2px rgba(255,255,255,0.3));
    }
    
    .chat-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px; /* Reduced from 14px */
      padding: 6px 3px; /* Reduced padding */
      background: transparent;
      color: #333;
      resize: none;
      max-height: 80px; /* Reduced from 100px */
      line-height: 1.4; /* Reduced from 1.4 */
      font-family: inherit;
    }
    
    .chat-input::placeholder {
      color: #999;
    }
    
    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px; /* Reduced from 8px */
      padding: 0 3px; /* Reduced from 5px */
      flex-wrap: wrap;
    }
    
    .left-footer, .right-footer {
      display: flex;
      align-items: center;
      gap: 4px; /* Reduced from 5px */
    }
    
    .char-counter, .typing-hint {
      font-size: 10px; /* Reduced from 11px */
      color: rgba(255, 255, 255, 0.7);
      transition: color 0.3s ease;
      display: flex;
      align-items: center;
      gap: 3px; /* Reduced from 4px */
    }
    
    .counter-emoji, .hint-emoji {
      font-size: 10px; /* Reduced from 12px */
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
      gap: 10px; /* Reduced from 12px */
      padding: 0 15px 12px; /* Reduced padding */
      animation: fadeIn 0.3s ease;
    }
    
    .typing-indicator.active {
      display: flex;
    }
    
    .typing-avatar {
      width: 28px; /* Reduced from 32px */
      height: 28px; /* Reduced from 32px */
      border-radius: 50%;
      background: linear-gradient(135deg, #ff9a9e, #fad0c4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px; /* Reduced from 16px */
      animation: bounce 1.5s infinite;
    }
    
    .typing-content {
      display: flex;
      align-items: center;
      gap: 8px; /* Reduced from 10px */
      background: rgba(255, 255, 255, 0.9);
      padding: 8px 12px; /* Reduced padding */
      border-radius: 16px; /* Reduced from 20px */
      border-bottom-left-radius: 4px;
    }
    
    .typing-dots {
      display: flex;
      gap: 3px; /* Reduced from 4px */
    }
    
    .typing-dots span {
      width: 6px; /* Reduced from 8px */
      height: 6px; /* Reduced from 8px */
      border-radius: 50%;
      background: var(--primary-color);
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
      font-size: 12px; /* Reduced from 13px */
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
      bottom: 60px; /* Reduced from 70px */
      left: 15px; /* Reduced from 20px */
      background: white;
      border-radius: 10px; /* Reduced from 12px */
      padding: 12px; /* Reduced from 15px */
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15); /* Reduced shadow */
      z-index: 1000;
      width: clamp(260px, 75vw, 300px); /* Reduced width */
      max-height: 280px; /* Reduced from 300px */
      overflow-y: auto;
      box-sizing: border-box;
    }
    
    .emoji-categories {
      display: flex;
      gap: 4px; /* Reduced gap */
      margin-bottom: 8px; /* Reduced from 10px */
      border-bottom: 1px solid #eee;
      padding-bottom: 6px; /* Reduced from 8px */
      flex-wrap: wrap;
    }
    
    .emoji-category {
      padding: 4px 8px; /* Reduced padding */
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 12px; /* Reduced from 15px */
      font-size: 16px; /* Reduced from 18px */
      transition: background 0.2s ease;
    }
    
    .emoji-category:hover, .emoji-category.active {
      background: #f0f0f0;
    }
    
    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(30px, 1fr)); /* Reduced from 35px */
      gap: 4px; /* Reduced from 5px */
    }
    
    .emoji-item {
      width: 30px; /* Reduced from 35px */
      height: 30px; /* Reduced from 35px */
      border: none;
      background: none;
      font-size: 18px; /* Reduced from 20px */
      cursor: pointer;
      border-radius: 5px; /* Reduced from 6px */
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
        height: 100%;
        border-radius: 12px; /* Reduced from 15px */
        max-height: calc(100vh - 90px); /* Adjusted */
      }
      
      .message-content {
        max-width: 80%; /* Slightly increased for mobile */
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
        width: clamp(240px, 85vw, 260px); /* Reduced */
        left: 10px;
        right: 10px;
      }
      
      .emoji-grid {
        grid-template-columns: repeat(auto-fill, minmax(28px, 1fr)); /* Reduced */
      }
      
      .action-btn {
        width: 30px; /* Reduced from 35px */
        height: 30px; /* Reduced from 35px */
      }
      
      .btn-emoji {
        font-size: 14px; /* Reduced from 16px */
      }
      
      .attach-btn, .emoji-btn, .voice-btn {
        width: 28px; /* Reduced from 32px */
        height: 28px; /* Reduced from 32px */
      }
      
      .input-emoji {
        font-size: 14px; /* Reduced from 16px */
      }
      
      .send-btn {
        width: 32px; /* Reduced from 36px */
        height: 32px; /* Reduced from 36px */
      }
      
      .send-emoji {
        font-size: 16px; /* Reduced from 18px */
      }
      
      .chat-window {
        max-height: calc(100vh - 230px); /* Adjusted */
      }
    }
    
    @media (max-width: 480px) {
      .chatbot-container {
        border-radius: 8px; /* Reduced from 10px */
        max-height: calc(100vh - 70px); /* Further adjusted */
      }
      
      .chatbot-header {
        padding: 8px; /* Reduced from 10px */
      }
      
      .header-content {
        gap: 6px; /* Reduced from 8px */
      }
      
      .bot-avatar {
        width: 36px; /* Reduced from 40px */
        height: 36px; /* Reduced from 40px */
      }
      
      .bot-image {
        font-size: 18px; /* Reduced from 20px */
      }
      
      .bot-info h3 {
        font-size: 14px; /* Reduced from 16px */
      }
      
      .bot-status {
        font-size: 10px; /* Reduced from 11px */
      }
      
      .header-actions {
        gap: 4px; /* Reduced from 5px */
      }
      
      .action-btn {
        width: 26px; /* Reduced from 30px */
        height: 26px; /* Reduced from 30px */
      }
      
      .btn-emoji {
        font-size: 12px; /* Reduced from 14px */
      }
      
      .chat-window {
        padding: 12px; /* Reduced from 15px */
        max-height: calc(100vh - 200px); /* Further adjusted */
      }
      
      .message-content {
        max-width: 85%; /* Increased for very small screens */
        padding: 8px 10px; /* Reduced */
      }
      
      .message-avatar {
        width: 28px; /* Reduced from 32px */
        height: 28px; /* Reduced from 32px */
        font-size: 14px; /* Reduced from 16px */
      }
      
      .mood-option {
        min-width: 45px; /* Reduced from 50px */
        padding: 5px 3px; /* Reduced */
      }
      
      .mood-emoji {
        font-size: 16px; /* Reduced from 18px */
      }
      
      .mood-text {
        font-size: 8px; /* Reduced from 9px */
      }
      
      .suggestion-btn {
        padding: 5px 8px; /* Reduced */
        font-size: 10px; /* Reduced from 11px */
      }
      
      .suggestion-emoji {
        font-size: 10px; /* Reduced from 12px */
      }
      
      .chat-input-container {
        padding: 12px; /* Reduced from 15px */
      }
      
      .input-wrapper {
        padding: 6px 10px; /* Reduced */
        gap: 4px; /* Reduced from 5px */
      }
      
      .attach-btn, .emoji-btn, .voice-btn {
        width: 24px; /* Reduced from 28px */
        height: 24px; /* Reduced from 28px */
      }
      
      .input-emoji {
        font-size: 12px; /* Reduced from 14px */
      }
      
      .send-btn {
        width: 28px; /* Reduced from 32px */
        height: 28px; /* Reduced from 32px */
      }
      
      .send-emoji {
        font-size: 14px; /* Reduced from 16px */
      }
      
      .chat-input {
        font-size: 12px; /* Reduced from 13px */
        padding: 5px 2px; /* Reduced */
      }
      
      .input-footer {
        margin-top: 4px; /* Reduced from 5px */
        padding: 0 2px; /* Reduced from 3px */
      }
      
      .char-counter, .typing-hint {
        font-size: 9px; /* Reduced from 10px */
      }
      
      .counter-emoji, .hint-emoji {
        font-size: 9px; /* Reduced from 10px */
      }
      
      .emoji-picker {
        width: calc(100vw - 30px); /* Reduced margins */
        left: 15px;
        right: 15px;
        bottom: 50px; /* Reduced from 60px */
        padding: 8px; /* Reduced from 10px */
      }
      
      .emoji-categories {
        gap: 2px; /* Reduced from 3px */
        margin-bottom: 6px; /* Reduced from 8px */
        padding-bottom: 4px; /* Reduced from 6px */
      }
      
      .emoji-category {
        padding: 2px 4px; /* Reduced */
        font-size: 14px; /* Reduced from 16px */
      }
      
      .emoji-grid {
        grid-template-columns: repeat(auto-fill, minmax(25px, 1fr)); /* Reduced */
        gap: 2px; /* Reduced from 3px */
      }
      
      .emoji-item {
        width: 25px; /* Reduced from 28px */
        height: 25px; /* Reduced from 28px */
        font-size: 14px; /* Reduced from 16px */
      }
      
      .history-header, .history-controls {
        padding: 8px 12px; /* Reduced */
      }
      
      .history-title {
        font-size: 14px; /* Reduced from 16px */
      }
      
      .history-control-btn {
        padding: 5px 8px; /* Reduced */
        font-size: 10px; /* Reduced from 11px */
      }
      
      .search-container {
        padding: 8px; /* Reduced from 10px */
      }
      
      .search-input {
        padding: 6px 10px 6px 30px; /* Reduced */
        font-size: 12px; /* Reduced from 13px */
      }
      
      .search-emoji {
        left: 10px; /* Reduced from 12px */
        font-size: 12px; /* Reduced from 14px */
      }
    }
    
    /* Dark Theme Styles */
    .chatbot-container.dark-theme .bot-message .message-content {
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
        this.style.height = Math.min(this.scrollHeight, 80) + 'px'; // Reduced from 100px
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
        padding: 8px 12px; /* Reduced padding */
        border-radius: 4px; /* Reduced border radius */
        box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* Reduced shadow */
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-size: 13px; /* Reduced font size */
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
            // Add inline style to force black text for user messages
            const textStyle = who === 'You' ? 'style="color: #000000 !important;"' : '';
            const headerStyle = who === 'You' ? 'style="color: #000000 !important;"' : '';

            content.innerHTML = `
        <div class="message-header" ${headerStyle}>
          <span class="message-time" ${headerStyle}>${formatTimestamp()}</span>
          <span class="message-status" ${headerStyle}>${who === 'You' ? '✓✓' : ''}</span>
        </div>
        <p ${textStyle}>${escapeHtml(text)}</p>
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
        gestures: ['👋', '🤝', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️'],
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

    // Theme toggle - now linked to global changeTheme
    themeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        changeTheme(newTheme);
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
            const res = await fetch(API_BASE + "/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + getToken(),
                },
                body: JSON.stringify({ message }),
            });

            // NEW → handle expired token
            if (handleAuthError(res)) return;


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
                    'Authorization': 'Bearer ' + localStorage.getItem('moodGardenToken')

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
    localStorage.setItem("currentPage", "page_notes")
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
      
      <div class="notes-list-container">
        <div id="notesList" class="notes-list"></div>
      </div>
    </div>
  `;

    const notesStyles = document.createElement('style');
    notesStyles.id = 'notes-enhanced-styles';
    notesStyles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    .notes-container {
      padding: 20px;
      font-family: 'Poppins', sans-serif;
      background: transparent;
      height: 100%;
      box-sizing: border-box;
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
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
      z-index: 0;
    }
    
    .notes-header {
      position: relative;
      z-index: 1;
    }
    
    .notes-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 28px;
      font-weight: 600;
      color: white;
      margin-bottom: 16px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .title-icon {
      font-size: 32px;
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    
    .controls {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
      border: 1px solid var(--border-main);
      flex-wrap: wrap;
    }
    
    .search-container {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 300px;
    }
    
    .search-input {
      width: 100%;
      padding: 10px 30px 10px 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 16px;
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
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      font-size: 14px;
      display: none;
      transition: all 0.2s ease;
      width: 22px;
      height: 22px;
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
      padding: 8px 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 120px;
    }
    
    .filter-select:focus {
      border-color: rgba(255, 255, 255, 0.5);
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.25);
    }
    
    .filter-select option {
      background: var(--primary-color);
      color: white;
      padding: 6px;
    }
    
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .action-btn {
      padding: 8px 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }
    
    .stats-bar {
      display: flex;
      justify-content: space-around;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 1;
      flex-wrap: wrap;
      gap: 12px;
      flex-shrink: 0;
    }
    
    .stat-item {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 80px;
    }
    
    .stat-number {
      font-size: 20px;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    
    .stat-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    
    .notes-list-container {
      position: relative;
      z-index: 1;
      border-radius: 12px;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 20px;
    }
    
    .notes-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      padding: 20px;
      padding-bottom: 40px;
      box-sizing: border-box;
      /* Smooth scrolling */
      scroll-behavior: smooth;
      /* Ensure proper grid layout */
      align-content: start;
    }
    
    /* Enhanced Webkit scrollbar styling */
    .notes-list::-webkit-scrollbar {
      width: 12px;
    }
    
    .notes-list::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin: 4px 0;
    }
    
    .notes-list::-webkit-scrollbar-thumb {
      background: var(--primary-color);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }
    
    .notes-list::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(168, 85, 247, 1));
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .notes-list::-webkit-scrollbar-corner {
      background: rgba(255, 255, 255, 0.1);
    }
    
    /* Fixed Size Entry Cards */
    .note-card {
      width: 100%;
      max-width: 320px;
      min-height: 200px;
      background: var(--bg-section);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      margin: 0;
    }
    
    .note-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--gradient-primary);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .note-card:hover::before {
      opacity: 1;
    }
    
    .note-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--border-main);
    }
    
    .note-mood {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      background: var(--glass-bg);
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .note-date {
      font-size: 11px;
      color: #6b7280;
      font-weight: 600;
      background: var(--glass-bg);
      padding: 4px 8px;
      border-radius: 6px;
      flex-shrink: 0;
      border: 1px solid rgba(107, 114, 128, 0.2);
    }
    
    .note-text {
      font-size: 14px;
      line-height: 1.4;
      color: #374151;
      padding: 16px;
      word-wrap: break-word;
      font-weight: 400;
      flex: 1;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      background: rgba(255, 255, 255, 0.1);
    }
    
    .note-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      margin-top: auto;
      flex-shrink: 0;
    }
    
    .note-mood-label {
      font-size: 11px;
      font-weight: 600;
      color: #ffffff;
      text-transform: capitalize;
      background: linear-gradient(135deg, #a855f7, #8b5cf6);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
    }
    
    .note-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    
    .delete-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #f87171, #ef4444);
      color: white;
      font-size: 11px;
      font-weight: 600;
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
      padding: 40px 20px;
      color: white;
      font-size: 18px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 1;
      grid-column: 1 / -1;
    }
    
    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.9;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .emoji-container {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
    }
    
    /* Scroll to top button */
    .scroll-to-top {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 10;
      font-size: 18px;
    }
    
    .scroll-to-top.visible {
      opacity: 1;
    }
    
    .scroll-to-top:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    @media (max-width: 768px) {
      .notes-container {
        padding: 16px;
      }
      
      .controls {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .search-container {
        max-width: 100%;
      }
      
      .notes-list {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        padding: 16px;
        padding-right: 16px;
      }
      
      .stats-bar {
        flex-direction: column;
        gap: 12px;
      }
      
      .notes-title {
        font-size: 24px;
        margin-bottom: 12px;
      }
      
      /* Thinner scrollbar on mobile */
      .notes-list::-webkit-scrollbar {
        width: 8px;
      }
      
      .scroll-to-top {
        width: 35px;
        height: 35px;
        bottom: 16px;
        right: 16px;
      }
      
      /* Fixed card size on mobile */
      .note-card {
        width: 280px;
        height: 180px;
      }
      
      .note-header {
        padding: 12px;
      }
      
      .note-mood {
        width: 32px;
        height: 32px;
      }
      
      .emoji-container {
        width: 32px;
        height: 32px;
        font-size: 1.5rem;
      }
      
      .note-text {
        font-size: 13px;
        padding: 12px;
      }
      
      .note-footer {
        padding: 10px 12px;
      }
    }
    
    @media (max-width: 480px) {
      .notes-list {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      /* Fixed card size on small screens */
      .note-card {
        width: 100%;
        height: 160px;
      }
      
      .note-text {
        font-size: 12px;
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
    let lottieAvailable = typeof lottie !== 'undefined';
    let moodAnimations = {};

    // Mood options with Lottie animations and fallback emojis
    const moods = [
        { k: 'happy', e: 'smiley emoji.json', label: 'Happy', emoji: '😊', color: '#fbbf24' },
        { k: 'sad', e: 'Sad Emoji.json', label: 'Sad', emoji: '😢', color: '#60a5fa' },
        { k: 'anxious', e: 'emoji head explosion.json', label: 'Anxious', emoji: '😰', color: '#c084fc' },
        { k: 'angry', e: 'Exploding Emoji.json', label: 'Angry', emoji: '😠', color: '#f87171' },
        { k: 'neutral', e: 'Yelly Emoji No.json', label: 'Neutral', emoji: '😐', color: '#9ca3af' },
        { k: 'hopeful', e: 'Party.json', label: 'Hopeful', emoji: '🌟', color: '#34d399' }
    ];

    // Create scroll to top button
    const scrollToTopBtn = document.createElement('div');
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.title = 'Scroll to top';
    document.querySelector('.notes-list-container').appendChild(scrollToTopBtn);

    // Show/hide scroll to top button based on scroll position
    list.addEventListener('scroll', () => {
        if (list.scrollTop > 200) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top functionality
    scrollToTopBtn.addEventListener('click', () => {
        list.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Check if Lottie is already loaded
    if (!lottieAvailable) {
        // Add Lottie library if not already loaded
        if (!document.getElementById('lottie-script')) {
            const lottieScript = document.createElement('script');
            lottieScript.id = 'lottie-script';
            lottieScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
            document.head.appendChild(lottieScript);

            lottieScript.onload = () => {
                lottieAvailable = true;
                loadAndRenderEntries();
            };

            // Fallback in case script fails to load
            lottieScript.onerror = () => {
                console.warn('Lottie library failed to load, using fallback emojis');
                loadAndRenderEntries();
            };
        } else {
            // Script tag exists but lottie not loaded yet
            const checkLottie = setInterval(() => {
                if (typeof lottie !== 'undefined') {
                    clearInterval(checkLottie);
                    lottieAvailable = true;
                    loadAndRenderEntries();
                }
            }, 100);

            // Timeout after 3 seconds
            setTimeout(() => {
                clearInterval(checkLottie);
                console.warn('Lottie loading timeout, using fallback emojis');
                loadAndRenderEntries();
            }, 3000);
        }
    } else {
        // Lottie is already loaded
        loadAndRenderEntries();
    }

    // Load entries from localStorage
    function loadEntries() {
        try {
            const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
            console.log('Loaded entries from localStorage:', entries);
            return entries;
        } catch (error) {
            console.error('Error loading entries from localStorage:', error);
            return [];
        }
    }

    function loadAndRenderEntries() {
        // Get entries and convert them to expected format
        const rawEntries = loadEntries();
        const entries = rawEntries.map((entry, index) => {
            // Convert to timestamp to createdAt if it doesn't exist
            if (!entry.createdAt && entry.timestamp) {
                entry.createdAt = entry.timestamp;
            }

            // Add an ID if it doesn't exist
            if (!entry.id) {
                entry.id = `entry-${index}-${Date.now()}`;
            }

            return entry;
        });

        if (!entries || entries.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div><h3>No memories yet</h3><p>Start documenting your journey to see your memories here.</p></div>';
            return;
        }

        // Initialize rest of functionality
        initializeNotesFunctionality(entries);
    }

    function initializeNotesFunctionality(entries) {
        function applyFiltersAndSearch() {
            filteredEntries = [...entries];

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

            // Create a document fragment for better performance
            const fragment = document.createDocumentFragment();

            filteredEntries.forEach(entry => {
                const card = document.createElement('div');
                card.className = 'note-card';

                // Find mood data
                const moodData = moods.find(mood => mood.k === entry.mood) || moods[0];

                // Create header
                const header = document.createElement('div');
                header.className = 'note-header';

                // Create mood container
                const moodContainer = document.createElement('div');
                moodContainer.className = 'note-mood';

                if (lottieAvailable) {
                    // Create Lottie container
                    const lottieContainer = document.createElement('div');
                    lottieContainer.className = 'lottie-container';
                    lottieContainer.id = `lottie-${entry.id}`;
                    lottieContainer.style.width = '40px';
                    lottieContainer.style.height = '40px';
                    moodContainer.appendChild(lottieContainer);

                    // Initialize Lottie animation
                    try {
                        const animation = lottie.loadAnimation({
                            container: lottieContainer,
                            renderer: 'svg',
                            loop: true,
                            autoplay: true,
                            path: moodData.e
                        });

                        // Store animation reference
                        moodAnimations[entry.id] = animation;
                    } catch (error) {
                        console.warn(`Failed to load Lottie animation for ${entry.mood}:`, error);
                        // Fallback to emoji
                        lottieAvailable = false;
                        renderEmojiFallback(moodContainer, moodData.emoji);
                    }
                } else {
                    // Use emoji fallback
                    renderEmojiFallback(moodContainer, moodData.emoji);
                }

                // Create date element
                const dateElement = document.createElement('div');
                dateElement.className = 'note-date';
                dateElement.textContent = new Date(entry.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                // Assemble header
                header.appendChild(moodContainer);
                header.appendChild(dateElement);

                // Create text element
                const textElement = document.createElement('div');
                textElement.className = 'note-text';
                textElement.textContent = entry.text;

                // Create footer
                const footer = document.createElement('div');
                footer.className = 'note-footer';

                // Create mood label
                const moodLabel = document.createElement('div');
                moodLabel.className = 'note-mood-label';
                moodLabel.textContent = moodData.label;

                // Create delete button
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-btn';
                deleteButton.setAttribute('data-id', entry.id);
                deleteButton.textContent = 'Delete';

                // Create actions container
                const actions = document.createElement('div');
                actions.className = 'note-actions';
                actions.appendChild(deleteButton);

                // Assemble footer
                footer.appendChild(moodLabel);
                footer.appendChild(actions);

                // Assemble card
                card.appendChild(header);
                card.appendChild(textElement);
                card.appendChild(footer);

                // Add to fragment
                fragment.appendChild(card);
            });

            // Add all cards at once for better performance
            list.appendChild(fragment);
        }

        function renderEmojiFallback(container, emoji) {
            const emojiContainer = document.createElement('div');
            emojiContainer.className = 'emoji-container';
            emojiContainer.textContent = emoji;
            container.appendChild(emojiContainer);
        }

        function updateStats() {
            const totalEntries = entries.length;
            const filteredCountValue = filteredEntries.length;

            const moodCounts = {};
            entries.forEach(entry => {
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

        // Helper function to escape HTML
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };

            return text.replace(/[&<>"']/g, m => map[m]);
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
                        // Remove entry from array
                        const index = entries.findIndex(entry => entry.id === entryId);
                        if (index !== -1) {
                            entries.splice(index, 1);

                            // Update localStorage
                            saveEntries(entries);

                            // Clean up animation if it exists
                            if (moodAnimations[entryId]) {
                                moodAnimations[entryId].destroy();
                                delete moodAnimations[entryId];
                            }

                            card.style.transition = 'all 0.3s ease';
                            card.style.opacity = '0';
                            card.style.transform = 'scale(0.9)';

                            setTimeout(() => {
                                applyFiltersAndSearch();
                            }, 300);
                        } else {
                            alert('Memory not found');
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
            const dataStr = JSON.stringify(entries, null, 2);
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

        // Initial render
        applyFiltersAndSearch();
    }
}
// Add this new function anywhere in your app.js file
// Add this registration logic to your public/app.js file
document.addEventListener('DOMContentLoaded', () => {

    const emailForm = document.getElementById('email-form');
    const codeForm = document.getElementById('code-form');
    const emailInput = document.getElementById('email-input');
    const codeInput = document.getElementById('code-input');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const messageDiv = document.getElementById('message');
    const emailDisplay = document.getElementById('email-display');

    if (!emailForm || !codeForm) return;

    // -------------------------------------------------------------
    // STEP 1 — SEND VERIFICATION CODE
    // -------------------------------------------------------------
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        messageDiv.textContent = '';
        messageDiv.style.color = '';

        if (!email) {
            messageDiv.textContent = "Please enter an email.";
            messageDiv.style.color = "red";
            return;
        }

        try {
            sendCodeBtn.disabled = true;
            sendCodeBtn.textContent = 'Sending...';

            const result = await api('/auth/register/initiate', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            if (result.success) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = result.message;

                if (emailDisplay) emailDisplay.textContent = email;

                emailForm.style.display = 'none';
                codeForm.style.display = 'block';
            } else {
                throw new Error(result.message || "Failed to send code");
            }

        } catch (error) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = error.message;

        } finally {
            sendCodeBtn.disabled = false;
            sendCodeBtn.textContent = 'Send Verification Code';
        }
    });


    // -------------------------------------------------------------
    // STEP 2 — VERIFY CODE
    // -------------------------------------------------------------
    codeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const code = codeInput.value.trim();
        messageDiv.textContent = '';
        messageDiv.style.color = '';

        if (!code) {
            messageDiv.textContent = "Please enter the verification code.";
            messageDiv.style.color = "red";
            return;
        }

        try {
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verifying...';

            const result = await api('/auth/register/verify', {
                method: 'POST',
                body: JSON.stringify({ email, code })
            });

            if (result.success) {
                messageDiv.style.color = 'green';
                messageDiv.textContent = result.message;

                const container = document.getElementById('registration-container');
                if (container) container.style.display = 'none';

                if (result.token) {
                    setToken(result.token);
                    await loadProfile();
                    renderApp();
                }

            } else {
                throw new Error(result.message || "Verification failed");
            }

        } catch (error) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = error.message;

        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify & Register';
        }
    });

});
// =========================================
// UNIVERSAL API HELPER
// =========================================
function api(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    };

    const final = { ...defaultOptions, ...options };

    // Add token if available
    if (state.token) {
        final.headers.Authorization = `Bearer ${state.token}`;
    }

    // Always prefix "/api"
    const clean = endpoint.startsWith('/api/')
        ? endpoint
        : `/api${endpoint}`;

    return fetch(clean, final)
        .then(async (res) => {

            const type = res.headers.get("content-type");

            // Prevent JSON parsing errors
            if (!type || !type.includes("application/json")) {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Error ${res.status}`);
            }

            return data;
        })
        .catch(err => {
            console.error("API Error:", err);
            throw err;
        });
}
// ==========================================================
// LOGIN FUNCTION — fixed JSON + token issues
// ==========================================================
async function handleLogin() {
    try {
        const email = emailInput.value.trim();
        const password = pwdInput.value.trim();

        if (!email || !password) {
            msg.textContent = "Please enter email and password.";
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "⏳ Logging in...";

        const result = await api('/auth/login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (result.token) {
            setToken(result.token);
            await loadProfile();
            renderApp();
        }

    } catch (error) {
        msg.textContent = error.message;

    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "✨ Login";
    }
}
// ==========================================================
// REGISTER FUNCTION — updated & correct
// ==========================================================
async function handleRegister() {
    try {
        const email = regEmailInput.value.trim();
        const password = regPwdInput.value.trim();
        const confirm = regConfirmPwdInput.value.trim();
        const name = regNameInput.value.trim();

        if (!email || !password || !name || !confirm) {
            regMsg.textContent = "Please fill all fields";
            return;
        }

        if (password !== confirm) {
            regMsg.textContent = "Passwords do not match";
            return;
        }

        regBtn.disabled = true;
        regBtn.textContent = "⏳ Registering...";

        const response = await api('/auth/register', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name })
        });

        if (response.token) {
            setToken(response.token);
            await loadProfile();
            renderApp();
        }

    } catch (error) {
        regMsg.textContent = error.message;

    } finally {
        regBtn.disabled = false;
        regBtn.textContent = "🌱 Register";
    }
}
// Update the email verification code with better error handling
document.addEventListener('DOMContentLoaded', () => {
    const emailForm = document.getElementById('email-form');
    const codeForm = document.getElementById('code-form');
    const emailInput = document.getElementById('email-input');
    const codeInput = document.getElementById('code-input');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const messageDiv = document.getElementById('message');
    const emailDisplay = document.getElementById('email-display');

    if (emailForm && codeForm && emailInput && codeInput && sendCodeBtn && verifyBtn && messageDiv) {

        // --- Step 1: Send Verification Code ---
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            messageDiv.textContent = '';
            messageDiv.style.color = '';

            try {
                sendCodeBtn.disabled = true;
                sendCodeBtn.textContent = 'Sending...';

                const result = await api('/auth/register/initiate', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });

                if (result && result.success) {
                    messageDiv.style.color = 'green';
                    messageDiv.textContent = result.message;

                    if (emailDisplay) emailDisplay.textContent = email;

                    emailForm.style.display = 'none';
                    codeForm.style.display = 'block';

                } else {
                    throw new Error(result.message || 'Failed to send verification code');
                }

            } catch (error) {
                messageDiv.style.color = 'red';
                messageDiv.textContent = error.message;

            } finally {
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = 'Send Verification Code';
            }
        });

        // --- Step 2: Verify Code ---
        codeForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const code = codeInput.value.trim();
            messageDiv.textContent = '';
            messageDiv.style.color = '';

            try {
                verifyBtn.disabled = true;
                verifyBtn.textContent = 'Verifying...';

                const result = await api('/auth/register/verify', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, code }),
                });

                if (result && result.success) {
                    messageDiv.style.color = 'green';
                    messageDiv.textContent = result.message;

                    // Hide registration UI
                    const registrationContainer = document.getElementById('registration-container');
                    if (registrationContainer) {
                        registrationContainer.style.display = 'none';
                    }

                    // Store token & continue login flow
                    if (result.token) {
                        setToken(result.token);
                        await loadProfile();
                        renderApp();
                    }

                } else {
                    throw new Error(result.message || 'Failed to verify code');
                }

            } catch (error) {
                messageDiv.style.color = 'red';
                messageDiv.textContent = error.message;

            } finally {
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify & Register';
            }
        });
    }
});
// Fix for renderHeaderAnimation function - add this if it doesn't exist
function renderHeaderAnimation() {
    // Empty function to prevent error
    console.log('Header animation called');
}
// =======================
//   APP INITIALIZATION
// =======================
function bootstrap() {
    console.log("🚀 Bootstrapping Mood Garden...");
    applyAppearanceSettings();

    // 1. Initial State Check
    if (!state.token) {
        console.log("No token found, showing login.");
        showLogin();
        return;
    }

    // 2. Load User Profile & Restore Page
    // Note: state.user might already have {id} from initial token decode, 
    // but we need the full profile here.
    loadProfile().then((user) => {
        // Handle unverified email
        if (user && user.verified === false) {
            console.warn("User email not verified.");
            clearToken();
            showLogin();
            return;
        }

        // 3. Render Dashboard (This will handle sub-page restoration)
        console.log("Profile loaded, rendering app.");
        if (typeof renderApp === 'function') {
            renderApp();
        }

        // Optional animation if exists
        if (typeof renderHeaderAnimation === "function") {
            renderHeaderAnimation();
        }
    }).catch(err => {
        console.error("Bootstrap error:", err);
        showLogin();
    });
}

// Global helper to return to dashboard home
function showHome() {
    saveCurrentPage('page_home');
    if (typeof renderApp === 'function') {
        renderApp();
    }
}

// Cleanup function to remove old/deleted page references
function cleanupOldReferences() {
    console.log("🧹 Cleaning up old references...");

    // List of deleted pages that should be removed from localStorage
    const deletedPages = [
        'nav_mood_statistics', 'page_mood_statistics',
        'nav_feedback', 'page_feedback',
        'nav_send_feedback', 'page_send_feedback',
        'page_stats', 'nav_stats'
    ];

    // Check if current page is a deleted page
    const currentPage = localStorage.getItem('currentPage');
    if (currentPage && (deletedPages.includes(currentPage) || (currentPage !== 'page_home' && !document.getElementById(currentPage)))) {
        console.log(`Removing deleted or abandoned page reference: ${currentPage}`);
        localStorage.removeItem('currentPage');
    }


    // DISABLED: CSS reload was causing stylesheet loading errors
    // const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    // cssLinks.forEach(link => {
    //     const href = link.getAttribute('href');
    //     if (href && !href.includes('?v=')) {
    //         link.setAttribute('href', `${href}?v=${Date.now()}`);
    //     }
    // });
}

// Start with the Loading Screen on EVERY Page Load/Refresh
document.addEventListener("DOMContentLoaded", () => {
    cleanupOldReferences(); // Clean up first
    applyAppearanceSettings();
    showLoadingScreen(bootstrap);
});

