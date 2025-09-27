const form = document.getElementById('player-form');
const usernameInput = document.getElementById('username');
const resultDiv = document.getElementById('result');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) return; //reads input

    resultDiv.textContent = "Loading...";

    try {
        const response = await fetch('http://localhost:3000/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json(); //parses JSON response to js

        if (data.error) {
            resultDiv.textContent = `Error: ${data.error}`;
        } else {
            resultDiv.textContent = `Player ${username}'s score: ${data.score}`;
        } //in routes/playerRoutes.js
    } catch (err) {
        console.error(err);
        resultDiv.textContent = "Error: Could not reach server.";
    }
});
