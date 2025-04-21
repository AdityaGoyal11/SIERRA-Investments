const express = require('express');
const auth = require('../../Login/Local_register');

const router = express.Router();

// Every time user clicks option from quiz, triggers this endpoint
router.put('/:token/:questionId/submitAnswer', async (req, res) => {
    const { token, questionId } = req.params;
    const { answerId } = req.body;

    // Ensures the user exists
    if (!token) {
        res.status(404).json({ message: `Invalid user token ${token}` });
    }

    const response = await auth.questionnaireAnswer(token, questionId, answerId);
    return res.status(200).json(response);
});

router.get('/:token/completed', async (req, res) => {
    const { token } = req.params;

    // Check for is token is valid
    if (!token) {
        res.status(404).json({ message: `Invalid user token ${token}` });
    }

    const response = await auth.questionnaireComplete(token);
    return res.status(200).json(response);
});

module.exports = router;
