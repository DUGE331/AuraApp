class PlayerManager {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.form = document.getElementById('addPlayerForm');
        this.resultDiv = document.getElementById('result');
        this.submitButton = this.form.querySelector('button[type="submit"]');

        this.init();
    }

    getBaseURL() {
        // Auto-detect the correct base URL
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:${port || 3000}`;
        }

        // For production, use the same origin
        return window.location.origin;
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Real-time validation
        document.getElementById('username').addEventListener('input', this.validateUsername.bind(this));
        document.getElementById('score').addEventListener('input', this.validateScore.bind(this));

        // Test server connection on page load
        this.testConnection();
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('✅ Server connection successful');
                this.showMessage('Connected to server successfully', 'success');
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            this.showMessage('Warning: Cannot connect to server. Please check if the server is running.', 'warning');
        }
    }

    validateUsername(event) {
        const username = event.target.value.trim();
        const usernameError = document.getElementById('username-error');

        if (!usernameError) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'username-error';
            errorDiv.className = 'error-message';
            event.target.parentNode.appendChild(errorDiv);
        }

        const errorDiv = document.getElementById('username-error');

        if (username.length === 0) {
            errorDiv.textContent = '';
            return false;
        }

        if (username.length < 1 || username.length > 50) {
            errorDiv.textContent = 'Username must be between 1 and 50 characters';
            return false;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            errorDiv.textContent = 'Username can only contain letters, numbers, hyphens, and underscores';
            return false;
        }

        errorDiv.textContent = '';
        return true;
    }

    validateScore(event) {
        const scoreValue = event.target.value;
        const scoreError = document.getElementById('score-error');

        if (!scoreError) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'score-error';
            errorDiv.className = 'error-message';
            event.target.parentNode.appendChild(errorDiv);
        }

        const errorDiv = document.getElementById('score-error');

        if (scoreValue === '') {
            errorDiv.textContent = '';
            return false;
        }

        const score = parseFloat(scoreValue);

        if (isNaN(score)) {
            errorDiv.textContent = 'Score must be a number';
            return false;
        }

        if (score < 0) {
            errorDiv.textContent = 'Score must be non-negative';
            return false;
        }

        errorDiv.textContent = '';
        return true;
    }

    async handleSubmit(event) {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const scoreValue = document.getElementById('score').value;

        // Client-side validation
        if (!this.validateForm(username, scoreValue)) {
            return;
        }

        const score = parseFloat(scoreValue);

        // Set loading state
        this.setLoading(true);

        try {
            console.log('🎮 Adding player:', { username, score });

            const response = await fetch(`${this.baseURL}/api/player/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, score })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            if (data.success) {
                this.showMessage(`Player "${data.data.username}" added successfully with score ${data.data.score}!`, 'success');
                this.form.reset();

                // Clear any validation errors
                this.clearValidationErrors();
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('❌ Error adding player:', error);

            let errorMessage = 'Error: Could not add player.';

            if (error.message.includes('fetch')) {
                errorMessage = 'Error: Could not reach server. Please check your connection.';
            } else if (error.message.includes('Username') || error.message.includes('Score')) {
                errorMessage = error.message;
            } else if (error.message.includes('rate limit') || error.message.includes('Too many')) {
                errorMessage = 'Error: Too many requests. Please wait a moment and try again.';
            }

            this.showMessage(errorMessage, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    validateForm(username, scoreValue) {
        let isValid = true;

        if (!username || username.length === 0) {
            this.showMessage('Please enter a username.', 'error');
            isValid = false;
        }

        if (!scoreValue || scoreValue.trim() === '') {
            this.showMessage('Please enter a score.', 'error');
            isValid = false;
        }

        const score = parseFloat(scoreValue);
        if (isNaN(score)) {
            this.showMessage('Please enter a valid number for the score.', 'error');
            isValid = false;
        }

        if (score < 0) {
            this.showMessage('Score cannot be negative.', 'error');
            isValid = false;
        }

        return isValid;
    }

    setLoading(loading) {
        if (loading) {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Adding Player...';
            this.submitButton.classList.add('loading');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Add Player';
            this.submitButton.classList.remove('loading');
        }
    }

    showMessage(message, type = 'info') {
        this.resultDiv.textContent = message;
        this.resultDiv.className = `message ${type}`;

        // Auto-clear success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.resultDiv.textContent = '';
                this.resultDiv.className = '';
            }, 5000);
        }
    }

    clearValidationErrors() {
        const errors = document.querySelectorAll('.error-message');
        errors.forEach(error => error.textContent = '');
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PlayerManager();
    });
} else {
    new PlayerManager();
}
