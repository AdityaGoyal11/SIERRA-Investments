const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * @route GET /api/search/level/total_level/:level
 * @description Search companies based on their ESG rating, returning only the latest record per company.
 */

// Search by total level(A-E)
router.get('/total_level/:rating', async (req, res) => {

    const { rating } = req.params;

    // Ensure level is valid
    const validLevels = ["A", "B", "C", "D", "E"];
    if (!validLevels.includes(rating)) {
        return res.status(400).json({ message: "Invalid total level. Choose from: A to E." });
    }

    // Query for rating
    const params = {
        TableName: "esg_processed",
        FilterExpression: "attribute_exists(rating) AND rating = :rating",
        ExpressionAttributeValues: {
            ":rating": rating
        }
    };

    try {

        // Fetch data from DynamoDB
        const data = await dynamodb.scan(params).promise();

        if (!data.Items || data.Items.length === 0) {
            return res.status(404).json({ message: `No companies found for rating = ${rating}` });
        }

        // Group by Ticker and Keep the Latest Record
        const latestRecords = {};
        data.Items.forEach(item => {
            const ticker = item.ticker;

            // If the ticker is not in the dictionary, or this item has a later timestamp
            if (!latestRecords[ticker] || new Date(item.timestamp) > new Date(latestRecords[ticker].timestamp)) {
                latestRecords[ticker] = item;
            }
        });

        const companies = Object.values(latestRecords);

        res.json({
            rating: rating,
            companies: companies
        });

    } catch (error) {
        console.error("DynamoDB Query Error:", error);
        res.status(500).json({ message: "Error fetching ESG data", error: error.message });
    }
    
    
});

module.exports = router;
