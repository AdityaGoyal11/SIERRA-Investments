const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();

// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

// When someone wants to get ESG data for a specific company (like /api/esg/dis for Disney)
router.get('/recent/:ticker', async (req, res) => {
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
            let recent = data.Items[0];
            data.Items.forEach((item) => {
                if (new Date(item.timestamp) > new Date(recent.timestamp)) {
                    recent = item;
                }
            });

            res.json({
                ...recent
            });
        } else {
            res.status(404).json({ message: `No ESG data found for ticker: ${ticker}` });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching ESG data', error: error.message });
    }

    return res;
});

module.exports = router;
