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

        do {
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
            } catch (error) {
                console.error('Error scanning DynamoDB:', error);
                throw error;
            }
        } while (lastEvaluatedKey);

        const matchingItems = allItems.filter((item) => {
            const companyName = item.company_name.toLowerCase();
            return companyName.includes(companyNameQuery);
        });

        if (!matchingItems || matchingItems.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Group by company name and get the most recent record for each
        const latestRecords = {};
        matchingItems.forEach((item) => {
            const cName = item.company_name;
            if (!latestRecords[cName]
                || new Date(item.timestamp) > new Date(latestRecords[cName].timestamp)) {
                latestRecords[cName] = item;
            }
        });

        // Convert to array and sort by company name
        const companies = Object.values(latestRecords);
        // Bubble sort implementation for company names
        // Cant reduce line length to < 100 with the built in sort function WTF
        for (let i = 0; i < companies.length - 1; i += 1) {
            for (let j = 0; j < companies.length - i - 1; j += 1) {
                if (companies[j].company_name > companies[j + 1].company_name) {
                    const temp = companies[j];
                    companies[j] = companies[j + 1];
                    companies[j + 1] = temp;
                }
            }
        }

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
