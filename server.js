require('dotenv').config();
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

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
