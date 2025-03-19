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
    apple: 'aapl',
    'texas instruments': 'txn',
    'coca-cola': 'ko',
    'coca cola': 'ko',
    pepsi: 'pep',
    pepsico: 'pep',
    'procter & gamble': 'pg',
    'procter and gamble': 'pg',
    walmart: 'wmt',
    costco: 'cost',
    target: 'tgt',
    'home depot': 'hd',
    mcdonalds: 'mcd',
    'mcdonald\'s': 'mcd',
    starbucks: 'sbux',
    nike: 'nke',
    'jpmorgan chase': 'jpm',
    jpmorgan: 'jpm',
    'bank of america': 'bac',
    'wells fargo': 'wfc',
    'goldman sachs': 'gs',
    'morgan stanley': 'ms',
    'american express': 'axp',
    amex: 'axp',
    visa: 'v',
    mastercard: 'ma',
    'johnson & johnson': 'jnj',
    'johnson and johnson': 'jnj',
    pfizer: 'pfe',
    merck: 'mrk',
    abbvie: 'abbv'
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
                },
                ScanIndexForward: false
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

        // We want to return the most recent one.
        const sorted = data.Items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return res.json(sorted[0]);
    } catch (error) {
        console.error('Error fetching company:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
