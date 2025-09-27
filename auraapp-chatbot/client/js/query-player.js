class PlayerQuery {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.form = document.getElementById('queryForm');
        this.resultDiv = document.getElementById('queryResult');
        this.submitButton = this.form.querySelector('button[type="submit"]');

        this.init();
    }

    getBaseURL() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:${port || 3000}`;
        }

        return window.location.origin;
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Real-time validation
        document.getElementById('queryUsername').addEventListener('input', this.validateUsername.bind(this));

        // Test server connection
        this.testConnection();
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (response.ok) {
                console.log('✅ Server connection successful');
            }
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            this.showMessage('Warning: Cannot connect to server. Please check if the server is running.', 'warning');
        }
    }

    validateUsername(event) {
        const username = event.target.value.trim();
        const usernameError = document.getElementById('query-username-error');

        if (!usernameError) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'query-username-error';
            errorDiv.className = 'error-message';
            event.target.parentNode.appendChild(errorDiv);
        }

        const errorDiv = document.getElementById('query-username-error');

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

    async handleSubmit(event) {
        event.preventDefault();

        const username = document.getElementById('queryUsername').value.trim();

        if (!username) {
            this.showMessage('Please enter a username to search for.', 'error');
            return;
        }

        // Set loading state
        this.setLoading(true);

        try {
            console.log('🔍 Querying player:', username);

            const response = await fetch(`${this.baseURL}/api/player/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    this.showMessage(`Player "${username}" not found. Please check the username and try again.`, 'warning');
                } else {
                    throw new Error(data.error || `HTTP error! status: ${response.status}`);
                }
                return;
            }

            if (data.success && data.data) {
                const player = data.data;
                const createdDate = player.createdAt ? new Date(player.createdAt).toLocaleDateString() : 'Unknown';
                const updatedDate = player.updatedAt ? new Date(player.updatedAt).toLocaleDateString() : createdDate;

                this.showPlayerResult({
                    username: player.username,
                    score: player.score,
                    createdAt: createdDate,
                    updatedAt: updatedDate
                });
            } else {
                throw new Error('Invalid response format');
            }

        } catch (error) {
            console.error('❌ Error querying player:', error);

            let errorMessage = 'Error: Could not retrieve player information.';

            if (error.message.includes('fetch')) {
                errorMessage = 'Error: Could not reach server. Please check your connection.';
            } else if (error.message.includes('rate limit') || error.message.includes('Too many')) {
                errorMessage = 'Error: Too many requests. Please wait a moment and try again.';
            }

            this.showMessage(errorMessage, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    showPlayerResult(player) {
        this.resultDiv.innerHTML = `
            <div class="message success">
                <h3>Player Found!</h3>
                <div style="margin-top: 10px;">
                    <strong>Username:</strong> ${this.escapeHtml(player.username)}<br>
                    <strong>Score:</strong> ${player.score}<br>
                    <strong>First Added:</strong> ${player.createdAt}<br>
                    <strong>Last Updated:</strong> ${player.updatedAt}
                </div>
            </div>
        `;
    }

    setLoading(loading) {
        if (loading) {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'Searching...';
            this.submitButton.classList.add('loading');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Find Score';
            this.submitButton.classList.remove('loading');
        }
    }

    showMessage(message, type = 'info') {
        this.resultDiv.innerHTML = `<div class="message ${type}">${this.escapeHtml(message)}</div>`;

        // Auto-clear success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.resultDiv.innerHTML = '';
            }, 5000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PlayerQuery();
    });
} else {
    new PlayerQuery();
}