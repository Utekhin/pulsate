const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to set proper MIME types for ES6 modules
app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.type('application/javascript; charset=UTF-8');
    } else if (req.url.endsWith('.mjs')) {
        res.type('application/javascript; charset=UTF-8');
    }
    next();
});

// Enable CORS for local development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Serve static files from current directory
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        // Ensure .js files are served with correct MIME type
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
    }
}));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  Wave Circle Sound Game - Server Running                   ║
╚════════════════════════════════════════════════════════════╝

🌐 Server URL:    http://localhost:${PORT}
📁 Serving from:  ${__dirname}
✅ ES6 Modules:   Enabled
✅ CORS:          Enabled

Press Ctrl+C to stop the server
    `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});
