const express = require('express');
const auth = require('./Local_register');

const app = express();
// Use a different port than main app
// This is just for local development since theres
// A bunch of overlapping errors from ESG dynamodb and auth dynamodb
const PORT = process.env.AUTH_PORT || 3001;

app.use(express.json());

// Initialize auth tables route
app.get('/init', async (req, res) => {
    try {
        await auth.createTables();
        return res.status(200).json({ message: 'Auth tables initialized successfully' });
    } catch (error) {
        console.error('Error initializing auth tables:', error);
        return res.status(500).json({ message: 'Error initializing auth tables', error: error.message });
    }
});

// Route for registering a new user
app.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Email, password, and name are required' });
        }

        const result = await auth.registerUser(email, password, name);
        return res.status(201).json(result);
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'User already exists') {
            return res.status(409).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Route for logging in a user
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const result = await auth.loginUser(email, password);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Endpoint to add tickers to a user
app.post('/user/ticker', async (req, res) => {
    try {
        const { userId, ticker } = req.body;
        if (!userId, !ticker) {
            return res.status(400).json({ message: 'userId or ticker is missing' });
        }

        const result = await auth.addTickerToUser(userId, ticker);
        return res.status(201).json(result);
    }
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok to use auth' }));

// Start the server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Auth server running on port ${PORT}`);
    });
}

module.exports = app;
