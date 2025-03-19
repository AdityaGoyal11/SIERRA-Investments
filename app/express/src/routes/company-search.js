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

// Our dataset doesn't include company names, so we're using a hard-coded mapping (ik it's not ideal)
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
        const companyName = req.params.name.toLowerCase().trim(); // Case-insensitive search
        
        // Check if company name exists in our mapping
        if (companyNameToTicker[companyName]) {
            const ticker = companyNameToTicker[companyName];
            
            // Fetch company data from DynamoDB using ticker
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': ticker
                }
            };
            
            const data = await dynamodb.query(params).promise();
            
            if (!data.Items || data.Items.length === 0) {
                return res.status(404).json({ message: `No ESG data found for ticker: ${ticker}` });
            }
            
            // Find the most recent record
            const latestRecord = data.Items.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            )[0];
            
            // Return with both name and ticker
            return res.json({
                name: req.params.name,
                ticker: ticker,
                data: latestRecord
            });
        }
        
        // Try partial matching if exact match not found
        const matchingCompanies = Object.keys(companyNameToTicker).filter(name => 
            name.includes(companyName) || companyName.includes(name)
        );
        
        if (matchingCompanies.length > 0) {
            const bestMatch = matchingCompanies[0]; // Take first match
            const ticker = companyNameToTicker[bestMatch];
            
            // Fetch data for best match
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': ticker
                }
            };
            
            const data = await dynamodb.query(params).promise();
            
            if (!data.Items || data.Items.length === 0) {
                return res.status(404).json({ message: `No ESG data found for ticker: ${ticker}` });
            }
            
            // Find the most recent record
            const latestRecord = data.Items.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            )[0];
            
            return res.json({
                name: bestMatch,
                ticker: ticker,
                suggested: true,
                data: latestRecord
            });
        }

        return res.status(404).json({ message: 'Company not found' });
    } catch (error) {
        console.error('Error fetching company:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;
