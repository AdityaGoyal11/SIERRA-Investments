const express = require('express');

const router = express.Router();

/**
 * @route GET /api/search/score/:type
 * @description Search companies based on their ESG scores
 * @assigned Annie
 *
 * TODO MVP:
 * - Implement search by total score
 * - Implement search by environmental score
 * - Implement search by social score
 * - Implement search by governance score
 * OPTIONAL (IF WE HAVE TIME):
 * - Maybe adding range (between 400 and 600 for each score)
 * - Add sorting by ascending or descending
 */

// Search by total score
router.get('/total', async (req, res) => {
    // TODO: Implement total score search functionality
});

// Search by environmental score
router.get('/environmental', async (req, res) => {
    // TODO: Implement environmental score search functionality
});

// Search by social score
router.get('/social', async (req, res) => {
    // TODO: Implement social score search functionality
});

// Search by governance score
router.get('/governance', async (req, res) => {
    // TODO: Implement governance score search functionality
});

module.exports = router;
