const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/Schema');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update Last Login
        user.lastLogin = new Date();
        await user.save();

        // Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' } // Token valid for 7 days
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Profile Routes ---

// GET /profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { mobile, schoolName, className } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // If mobile changes, reset verification
        if (mobile && mobile !== user.mobile) {
            user.mobile = mobile;
            user.isMobileVerified = false;
        }

        if (schoolName) user.schoolName = schoolName;
        if (className) user.className = className;

        await user.save();
        res.json({ success: true, message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /verify-mobile (Simulation)
router.post('/verify-mobile', authenticateToken, async (req, res) => {
    try {
        const { otp } = req.body;
        // Simulate OTP check (Always 1234)
        if (otp === '1234') {
            await User.findByIdAndUpdate(req.user.id, { isMobileVerified: true });
            res.json({ success: true, message: 'Mobile verified successfully' });
        } else {
            res.status(400).json({ error: 'Invalid OTP' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// POST /google (Google Login)
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        const { email, name, sub: googleId } = payload;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // Register new user
            user = new User({
                name,
                email,
                password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
                role: 'student',
                isMobileVerified: true // Trust Google
            });
            await user.save();
        }

        // Generate Token
        const jwtToken = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(400).json({ error: 'Google authentication failed' });
    }
});

module.exports = router;
