require('dotenv').config();  // MUST be first

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const playerRoutes = require('./routes/playerRoutes');
const { testConnections } = require('./config/awsConfig');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(generalLimiter);

// Test route to debug
app.get('/test', (req, res) => {
    res.json({ message: 'Test route works!' });
});

// Health check endpoint (before everything else)
app.get('/health', (req, res) => {
    console.log('Health endpoint hit!');
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0'
    });
});

// CORS Configuration
const corsOptions = {
    origin: NODE_ENV === 'production'
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint moved to top of file

// API Routes
app.use('/api/player', playerRoutes);

// Legacy routes for backward compatibility
app.use('/player', playerRoutes);

// Static file serving
app.use(express.static(path.join(__dirname, 'client'), {
    maxAge: NODE_ENV === 'production' ? '1d' : '0'
}));

// Default routes to serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'admin.html'));
});

// 404 handler for unmatched API routes (will be caught by the global handler below)

// Global error handler
app.use((error, req, res, next) => {
    console.error('❌ Global error handler:', error);

    res.status(error.status || 500).json({
        success: false,
        error: NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        ...(NODE_ENV === 'development' && { stack: error.stack })
    });
});

// 404 handler - will be handled by the static file middleware above

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
const startServer = async () => {
    try {
        // Test database connections
        await testConnections();
        console.log('✅ Database connections tested successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Environment: ${NODE_ENV}`);
            console.log(`🔧 AWS Region: ${process.env.AWS_REGION}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
