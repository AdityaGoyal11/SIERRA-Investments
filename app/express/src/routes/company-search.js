const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();
// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * @route GET /api/search/company/:name
 * @description Search for company name and return ESG data
 * @assigned Adi
 *
 * TODO MVP:
 * - Implement company name search functionality
 * OPTIONAL (IF WE HAVE TIME):
 * - Add matching for similar company names
 * (for example Disney returns Walt Disney Co and 'dis' ticker)
 * - Add case-insensitive search
 */

router.get('/:name', async (req, res) => {
    try {
        const companyNameQuery = req.params.name.toLowerCase();
        // Get all data from DynamoDB with pagination
        let allItems = [];
        let lastEvaluatedKey = null;
        
        while (true) {
            try {
                const params = {
                    TableName: 'esg_processed'
                };
                
                if (lastEvaluatedKey) {
                    params.ExclusiveStartKey = lastEvaluatedKey;
                }
                
                const data = await dynamodb.scan(params).promise();
                allItems = allItems.concat(data.Items);
                lastEvaluatedKey = data.LastEvaluatedKey;
                
                if (!lastEvaluatedKey) {
                    break;
                }
            } catch (error) {
                console.error('Error scanning DynamoDB:', error);
                throw error;
            }
        }

        const matchingItems = allItems.filter(item => {
            const companyName = item.company_name.toLowerCase();
            return companyName.includes(companyNameQuery);
        });

        if (!matchingItems || matchingItems.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Group by company name and get the most recent record for each
        const latestRecords = {};
        matchingItems.forEach((item) => {
            if (!latestRecords[item.company_name] || 
                new Date(item.timestamp) > new Date(latestRecords[item.company_name].timestamp)) {
                latestRecords[item.company_name] = item;
            }
        });

        // Convert to array and sort by company name
        const companies = Object.values(latestRecords).sort((a, b) => 
            a.company_name.localeCompare(b.company_name)
        );

        return res.json({
            companyNameQuery,
            companies
        });

    } catch (error) {
        return res.status(500).json({ 
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

module.exports = router;
