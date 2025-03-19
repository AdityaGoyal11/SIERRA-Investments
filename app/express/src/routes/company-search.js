const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();
// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * @route GET /api/search/company/:name
 * @description Search for company name and return ticker
 * @assigned Adi
 *
 * TODO MVP:
 * - Implement company name search functionality
 * OPTIONAL (IF WE HAVE TIME):
 * - Add matching for similar company names
 * (for example Disney returns Walt Disney Co and 'dis' ticker)
 * - Add case-insensitive search
 */

// Dataset doesn't include company names, so we're hard-coding mapping
const companyNameToTicker = {
    'apple': 'aapl',
    'microsoft': 'msft',
    'alphabet': 'googl',
    'google': 'googl',
    'amazon': 'amzn',
    'meta': 'meta',
    'facebook': 'meta',
    'tesla': 'tsla',
    'walmart': 'wmt',
    'disney': 'dis',
    'walt disney': 'dis',
    'netflix': 'nflx',
    'southwest airlines': 'luv',
    'southwest': 'luv',
    'jpmorgan': 'jpm',
    'jpmorgan chase': 'jpm',
    'bank of america': 'bac',
    'nvidia': 'nvda',
    'coca cola': 'ko',
    'coca-cola': 'ko',
    'pepsi': 'pep',
    'pepsico': 'pep',
    'nike': 'nke',
    'starbucks': 'sbux',
    'goldman sachs': 'gs',
    'mcdonald\'s': 'mcd',
    'mcdonalds': 'mcd'
};

router.get('/:name', async (req, res) => {
    try {
        const companyName = req.params.name.toLowerCase();        
        if (companyNameToTicker[companyName]) {
            const ticker = companyNameToTicker[companyName];
            
            // Fetch ESG data for this ticker
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': ticker
                }
            };
            
            const data = await dynamodb.query(params).promise();
            
            if (data.Items && data.Items.length > 0) {
                const result = data.Items[0];
                result.name = companyName;
                return res.json(result);
            }
        }
        
        // If not found in mapping, fall back to the original search
        const params = {
            TableName: 'esg_processed',
            FilterExpression: 'LOWER(#name) = :name',
            ExpressionAttributeNames: {
                '#name': 'name'
            },
            ExpressionAttributeValues: {
                ':name': companyName
            }
        };

        const data = await dynamodb.scan(params).promise();

        if (!data.Items || data.Items.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        return res.json(data.Items[0]); // Return first matching result
    } catch (error) {
        console.error('Error fetching company:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;