const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const playerService = require('../services/playerService');

// Rate limiting for player operations
const playerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Validation middleware
const validatePlayerInput = [
    body('username')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Username must be between 1 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
    body('score')
        .isNumeric()
        .withMessage('Score must be a number')
        .isFloat({ min: 0 })
        .withMessage('Score must be non-negative')
        .toFloat()
];

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// POST /player/add - Add or update a player
router.post('/add', playerLimiter, validatePlayerInput, handleValidationErrors, async (req, res) => {
    try {
        const { username, score } = req.body;

        console.log(`🎮 Adding player: ${username} with score: ${score}`);

        const player = await playerService.addPlayer(username, score);

        res.status(201).json({
            success: true,
            message: 'Player added successfully',
            data: {
                username: player.username,
                score: player.score,
                timestamp: player.updatedAt || player.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Error in add player route:', error);

        if (error.message.includes('Username') || error.message.includes('Score')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /player/get - Get player score (keeping for backward compatibility)
router.post('/get', playerLimiter, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: 'Username required'
            });
        }

        console.log(`🔍 Getting player: ${username}`);

        const player = await playerService.getPlayerScore(username);

        if (!player) {
            return res.status(404).json({
                success: false,
                error: 'Player not found'
            });
        }

        res.json({
            success: true,
            data: {
                username: player.username,
                score: player.score
            }
        });

    } catch (error) {
        console.error('❌ Error in get player route:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /player/:username - Get player by username (RESTful endpoint)
router.get('/:username', playerLimiter, async (req, res) => {
    try {
        const { username } = req.params;

        if (!username || username.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Username parameter required'
            });
        }

        console.log(`🔍 Getting player: ${username}`);

        const player = await playerService.getPlayerScore(username);

        if (!player) {
            return res.status(404).json({
                success: false,
                error: 'Player not found'
            });
        }

        res.json({
            success: true,
            data: {
                username: player.username,
                score: player.score,
                createdAt: player.createdAt,
                updatedAt: player.updatedAt
            }
        });

    } catch (error) {
        console.error('❌ Error in get player route:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /player - Get all players (with optional limit)
router.get('/', playerLimiter, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;

        if (limit > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Limit cannot exceed 1000'
            });
        }

        console.log(`📊 Getting all players (limit: ${limit})`);

        const players = await playerService.getAllPlayers(limit);

        res.json({
            success: true,
            data: players,
            count: players.length
        });

    } catch (error) {
        console.error('❌ Error in get all players route:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Player service is healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;