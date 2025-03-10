const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();

// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

// When someone wants to get ESG data for a specific company (like /api/esg/dis for Disney)
router.get('/:ticker', async (req, res) => {
    // Get the ticker from the URL ('dis' from /api/esg/dis)
    const { ticker } = req.params;

    // Set up our database query (search request)
    const params = {
        // Look in this table
        TableName: 'esg_processed',
        // Find where ticker matches
        KeyConditionExpression: 'ticker = :ticker',
        // The ticker we're looking for
        ExpressionAttributeValues: {
            ':ticker': ticker
        }
    };

    try {
        // Ask DynamoDB for the data (asking dynamodb for info)
        const data = await dynamodb.query(params).promise();

        // If data found, send it back
        if (data.Items && data.Items.length > 0) {
            res.json(data.Items[0]);
        } else {
            // If we didn't find anything, error message
            res.status(404).json({ message: `No ESG data found for ticker: ${ticker}` });
        }
    } catch (error) {
        // If something went wrong, output error message
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching ESG data', error: error.message });
    }
});

// Request to get ALL ESG data (dd this feature later)
router.get('/', (req, res) => {
    res.json({ message: 'ESG endpoint placeholder' });
});

module.exports = router;
