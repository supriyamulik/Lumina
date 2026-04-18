/**
 * BACKEND API SETUP
 * Express server with Leo endpoints
 */

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Leo handlers
const leoController = require('../api/leo');

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE ====================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
}));

// Logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== LEO ROUTES ====================

/**
 * POST /api/leo-assist
 * Main Leo endpoint for adaptive responses
 */
app.post('/api/leo-assist', leoController.handleLeoAssist);

/**
 * POST /api/leo/hint
 * Get a hint for activity
 */
app.post('/api/leo/hint', leoController.handleGetHint);

/**
 * POST /api/leo/parse-intent
 * Parse user intent from voice command
 */
app.post('/api/leo/parse-intent', leoController.handleParseIntent);

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Leo Backend', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        path: req.path,
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});

// ==================== SERVER START ====================

// Start the Express server directly for development
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════╗
║     🐯 LEO BACKEND SERVICE READY 🐯    ║
║                                       ║
║  Port: ${PORT}                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                ║
║  Claude Model: Groq (claude-compatible)║
║  Ready for requests!                  ║
╚═══════════════════════════════════════╝
    `);
});

// For Firebase deployment
if (process.env.NODE_ENV === 'production') {
    exports.api = functions.http.onRequest(app);
}
