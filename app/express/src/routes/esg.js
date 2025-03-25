const express = require('express');
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient({
    endpoint: "http://dynamodb-local:8000",
    region: "us-east-1"
});  

const router = express.Router();


// Root ESG endpoint
router.get('/', (req, res) => {
    res.json({ message: 'ESG endpoint placeholder' });
});

// When someone wants to get ESG data for a specific company (like /api/esg/dis for Disney)
router.get('/:ticker', async (req, res) => {
    // Get the ticker from the URL ('dis' from /api/esg/dis)
    const { ticker } = req.params;

    const params = {
        // Look in the esg_processed table in DynamoDB (both AWS and local)
        TableName: 'esg_processed',
        // Find where ticker matches
        KeyConditionExpression: 'ticker = :ticker',
        // The ticker we're looking for
        ExpressionAttributeValues: {
            ':ticker': ticker.toLowerCase()
        },
        // Sort by timestamp in descending order (most recent first)
        ScanIndexForward: false
    };

    try {
        // Ask DynamoDB for the data (asking dynamodb for info)
        const data = await dynamodb.query(params).promise();

        // If data found, send it back
        if (data.Items && data.Items.length > 0) {
            // Return all historical entries for this ticker
            res.json({
                ticker,
                historical_ratings: data.Items
            });
        } else {
            res.status(404).json({ message: `No ESG data found for ticker: ${ticker}` });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching ESG data', error: error.message });
    }
});

module.exports = router;
