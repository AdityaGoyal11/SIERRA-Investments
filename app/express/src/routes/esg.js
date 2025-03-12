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
        // Look in the esg_processed table in DynamoDB (both AWS and local)
        TableName: 'esg_processed',
        // Find where ticker matches
        KeyConditionExpression: 'ticker = :ticker',
        // The ticker we're looking for
        ExpressionAttributeValues: {
            ':ticker': ticker
        },
        // Sorts the dynamodb data in descending order
        ScanIndexForward: false,
        // Limits the number of results to 1
        Limit: 1 

        // Note: The ScanIndexForward and Limit is used because everytime the data is processed, it is added to the end of the table
        // So we end up with multiple entries for the same ticker (one for each time the data was processed)
        // This is why we sort in descending (most recent) and limit it to retrieve the most recent entry (1 entry)
        // Look at the photo I sent on discord in #screenshots with the title "esg_processed table"
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

module.exports = router;
