const express = require('express');

const router = express.Router();

/**
 * @route GET /api/search/level/:type
 * @description Search companies based on their ESG levels
 * @assigned Kosar
 *
 * TODO MVP:
 * - Implement search by total level
 * - Implement search by environmental level
 * - Implement search by social level
 * - Implement search by governance level
 * OPTIONAL (IF WE HAVE TIME):
 * - Maybe adding sorting by ascending or descending
 */

// Search by total level
router.get('/total', async (req, res) => {
    // TODO: Implement total level search functionality
});

// Search by environmental level
router.get('/environmental', async (req, res) => {
    // TODO: Implement environmental level search functionality
});

// Search by social level
router.get('/social', async (req, res) => {
    // TODO: Implement social level search functionality
});

// Search by governance level
router.get('/governance', async (req, res) => {
    // TODO: Implement governance level search functionality
});
module.exports = router;
