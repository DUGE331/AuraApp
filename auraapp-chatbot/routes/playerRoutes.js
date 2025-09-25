//A route is simply a rule that tells your server:👉 “When someone makes an HTTP request (GET, POST, PUT, DELETE, etc.) to a certain URL path, run this code.”

const express = require('express'); //framework
const router = express.Router();
const { getPlayerScore } = require('../services/playerService');
//service layer that talks to DynamoDB and fetches a player’s data.

router.post('/player', async (req, res) => { //define the route
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    try {
        const player = await getPlayerScore(username);
        if (!player) return res.status(404).json({ error: 'Player not found' });

        res.json({ score: player.score });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
//Flow Summary

//Client sends POST → /player with JSON { "username": "Player1" }.

//Code checks username exists.

//Calls DynamoDB → getPlayerScore('Player1').

//If found → responds with { "score": 123 }.

//If not found → responds with 404.

//If error → responds with 500.