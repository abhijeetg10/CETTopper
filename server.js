console.log("Starting Server initialization...");
require('dotenv').config();
console.log("Environment variables loaded.");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(helmet()); // Security headers
app.use(cors()); // Allow cross-origin requests
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, '.'))); // Serve static files (frontend)

// --- Database Connection ---
// For development without a local MongoDB instance, we can use a mock or prompt user.
// Assuming user has MongoDB installed or a URI.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cettopper';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Routes (Placeholder) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Import Routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// --- Global Error Handling for Deployment Debugging ---
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR: Uncaught Exception:', err);
    // Keep process alive for a moment to ensure logs are flushed if possible, but usually best to exit.
    // For debugging Render loops, we want to see this.
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// --- Start Server ---
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Using Node Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
    console.error('SERVER LISTEN ERROR:', err);
});
