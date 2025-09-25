// Front-end JS to handle form submission
document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const score = parseInt(document.getElementById('score').value);

  if (!username || isNaN(score)) {
    document.getElementById('result').textContent = 'Please enter a valid username and score.';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/add-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, score })
    });

    const data = await response.json();
    document.getElementById('result').textContent = data.message || data.error;
  } catch (err) {
    console.error(err);
    document.getElementById('result').textContent = 'Error connecting to server.';
  }
});
