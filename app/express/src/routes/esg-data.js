const express = require('express');

const router = express.Router();


// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * @route GET /api/esg/all
 * @description Retrieve all ESG data with grades and scores
 * @assigned John
 *
 * TODO MVP:
 * - Implement retrieval of all ESG data
 * OPTIONAL (IF WE HAVE TIME):
 * - Consider: Include grade and score correlations, pagination for large datasets
 * sorting options, filtering capabilities
 */
router.get('/all', async (req, res) => {
    const params = {
        TableName: 'esg_processed',
    };

    try {
        const data = await dynamodb.scan(params).promise();

        if (data.Items && data.Items.length > 0) {
            res.json({
                message: 'All ESG data retrieved successfully',
                data: data.Items,
            });
        }

        else {
            res.status(404).json({ message: `No ESG data found` });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching ESG data', error: error.message });
    }
});
module.exports = router;
