const express = require('express');
const auth = require('../../../Login/Local_register');

const router = express.Router();

// Use johns local register function to create tables
router.get('/init', async (req, res) => {
    try {
        await auth.createTables();
        res.status(200).json({ message: 'Auth tables initialized successfully' });
    } catch (error) {
        console.error('Error initializing auth tables:', error);
        res.status(500).json({ message: 'Error initializing auth tables', error: error.message });
    }
});

// Endpoint to register a new user, this will call the registerUser function john made
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Email, password, and name are required' });
        }
        
        const result = await auth.registerUser(email, password, name);
        res.status(201).json(result);
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'User already exists') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Endpoint to login a user, this will call the loginUser function john made
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const result = await auth.loginUser(email, password);
        res.status(200).json(result);
    } catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

module.exports = router; 