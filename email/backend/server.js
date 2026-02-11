// Add this at the very top to load environment variables from the .env file
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development - change to your frontend URL in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

// In-memory storage for verification codes and users (use Redis or database in production)
const verificationCodes = new Map();
const users = new Map(); // Placeholder for users: { email: { password: 'hashed' } }

// Function to generate a random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a transporter for Gmail
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Show debug output
    logger: true // Log information in console
  });
  console.log('✅ Nodemailer transporter created successfully');
} catch (error) {
  console.error('❌ Failed to create nodemailer transporter:', error.message);
}

// Server Initialization
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email service configured for: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`🌐 CORS enabled for all origins`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Send verification code endpoint
app.post('/send-verification-code', async (req, res) => {
  console.log('📧 Verification request received:', req.body);

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const code = generateCode();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 30 * 60 * 1000  // Increased to 30 minutes for testing
    });

    const mailOptions = {
      from: `"Mood Garden" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #667eea;">🌸 Mood Garden</h2>
            <p style="color: #6c757d;">Your emotional wellness companion</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #495057; margin-bottom: 15px;">Email Verification</h3>
            <p style="color: #6c757d; margin-bottom: 15px;">Hello,</p>
            <p style="color: #6c757d; margin-bottom: 15px;">Your verification code is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 4px;">
              ${code}
            </div>
            <p style="color: #6c757d; margin-top: 15px;">This code will expire in 30 minutes.</p>
            <p style="color: #6c757d; margin-top: 10px;">If you didn't request this code, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            © 2024 Mood Garden. All rights reserved.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email, 'with code:', code);
    res.json({ message: 'Verification code sent successfully' });

  } catch (error) {
    console.error('❌ Verification email error:', error);
    if (error.code === 'EAUTH') {
      console.error('🔐 GMAIL AUTHENTICATION FAILED. Check your EMAIL_USER and EMAIL_PASS in the .env file.');
    } else if (error.code === 'ECONNECTION') {
      console.error('🔗 GMAIL CONNECTION FAILED. Check your network or firewall settings.');
    }
    res.status(500).json({ message: 'Failed to send verification code', error: error.message });
  }
});

// Send password reset endpoint
app.post('/send-password-reset', async (req, res) => {
  console.log('🔑 Password reset request received:', req.body);

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const code = generateCode();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 30 * 60 * 1000  // Increased to 30 minutes for testing
    });

    const mailOptions = {
      from: `"Mood Garden" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #667eea;">🌸 Mood Garden</h2>
            <p style="color: #6c757d;">Your emotional wellness companion</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #495057; margin-bottom: 15px;">Password Reset Request</h3>
            <p style="color: #6c757d; margin-bottom: 15px;">Your reset code is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 4px;">
              ${code}
            </div>
            <p style="color: #6c757d; margin-top: 15px;">This code will expire in 30 minutes.</p>
            <p style="color: #6c757d; margin-top: 10px;">If you didn't request this reset, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            © 2024 Mood Garden. All rights reserved.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email, 'with code:', code);
    res.json({ success: true, message: 'Password reset code sent!' });

  } catch (error) {
    console.error('❌ Password reset email error:', error);
    if (error.code === 'EAUTH') {
      console.error('🔐 GMAIL AUTHENTICATION FAILED. Check your EMAIL_USER and EMAIL_PASS in the .env file.');
    } else if (error.code === 'ECONNECTION') {
      console.error('🔗 GMAIL CONNECTION FAILED. Check your network or firewall settings.');
    }
    res.status(500).json({ success: false, message: 'Failed to send reset email', error: error.message });
  }
});

// Verify password reset endpoint - FIXED: removed password requirement
app.post('/verify-password-reset', (req, res) => {
  console.log('🔐 Password reset verification request:', req.body);

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      console.log('Missing required parameters:', { email, code });
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const stored = verificationCodes.get(email);
    if (!stored) {
      console.log('No reset code found for email:', email);
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    console.log('Code validation - stored:', stored.code, 'entered:', code, 'expiresAt:', stored.expiresAt, 'now:', Date.now());

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      console.log('Code expired for email:', email);
      return res.status(400).json({ success: false, message: 'Reset code expired' });
    }

    if (stored.code !== code) {
      console.log('Code mismatch for email:', email, 'stored:', stored.code, 'entered:', code);
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    // REMOVED: Password storage logic - Flask should handle password updates
    // users.set(email, { password: password });
    verificationCodes.delete(email);

    console.log('✅ Password reset verification successful for:', email);
    res.json({ success: true, message: 'Password reset verification successful!' });

  } catch (error) {
    console.error('❌ Password reset verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Verify code endpoint
app.post('/verify-code', (req, res) => {
  console.log('📧 Verification code check request:', req.body);

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'No verification code found for this email' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    verificationCodes.delete(email);
    console.log('✅ Email verified successfully for:', email);
    res.json({ success: true, message: 'Email verified successfully' });

  } catch (error) {
    console.error('❌ Verification code error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Clean up expired codes periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired verification codes`);
  }
}, 5 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});