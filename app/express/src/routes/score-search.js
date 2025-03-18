const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();

// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * @route GET /api/search/score/:type
 * @description Search companies based on their ESG scores
 * @assigned Annie
 *
 * TODO MVP:
 * - Implement search by total score
 * - Implement search by environmental score
 * - Implement search by social score
 * - Implement search by governance score
 * OPTIONAL (IF WE HAVE TIME):
 * - Maybe adding range (between 400 and 600 for each score)
 * - Add sorting by ascending or descending
 */

// Search for companys with a score (total, E, G, S) greater than the parameter
router.get('/greater/:scoreType/:score', async (req, res) => {
    const { scoreType, score } = req.params;

    const validType = ['total_score', 'environmental_score', 'social_score', 'governance_score'];
    if (!validType.includes(scoreType)) {
        return res.status(500).json({ message: 'Invalid score type. Choose from: total_score, environment_score, social_score, governance_score.' });
    }

    if (score < 0) {
        return res.status(500).json({ message: 'Invalid score value, must be greater or equal to 0.' });
    }

    const params = {
        // Look in the esg_processed table in DynamoDB (both AWS and local)
        TableName: 'esg_processed',
        ExpressionAttributeValues: {
            ':score': score
        },
        ExpressionAttributeNames: {
            '#scoreType': scoreType
        },
        KeyConditionExpression: '#scoreType >= :score',
        ScanIndexForward: false
    };

    try {
        // Ask DynamoDB for the data (asking dynamodb for info)
        const data = await dynamodb.scan(params).promise();

        const validCompanies = [];

        data.Items.forEach((item) => {
            if (item[scoreType] >= score) {
                validCompanies.push({
                    ticker: item.ticker,
                    score: item[scoreType],
                    timestamp: item.timestamp
                });
            }
        });

        if (validCompanies.length === 0) {
            return res.status(404).json({ message: `No companies found with ${scoreType} greater than ${score}.` });
        }

        res.json({
            scoreType,
            validCompanies
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching ESG data', error: error.message });
    }

    return res;
});

// Search for companys with a score (total, E, G, S) lesser than the parameter
router.get('/lesser/:scoreType/:score', async (req, res) => {
    const { scoreType, score } = req.params;

    const validType = ['total_score', 'environmental_score', 'social_score', 'governance_score'];
    if (!validType.includes(scoreType)) {
        return res.status(500).json({ message: 'Invalid score type. Choose from: total_score, environment_score, social_score, governance_score.' });
    }

    if (score < 0) {
        return res.status(500).json({ message: 'Invalid score value, must be greater or equal to 0.' });
    }

    const params = {
        // Look in the esg_processed table in DynamoDB (both AWS and local)
        TableName: 'esg_processed',
        ExpressionAttributeValues: {
            ':score': score
        },
        ExpressionAttributeNames: {
            '#scoreType': scoreType
        },
        KeyConditionExpression: '#scoreType <= :score',
        ScanIndexForward: false
    };

    try {
        // Ask DynamoDB for the data (asking dynamodb for info)
        const data = await dynamodb.scan(params).promise();

        const validCompanies = [];

        data.Items.forEach((item) => {
            if (item[scoreType] <= score) {
                validCompanies.push({
                    ticker: item.ticker,
                    score: item[scoreType],
                    timestamp: item.timestamp
                });
            }
        });

        if (validCompanies.length === 0) {
            return res.status(404).json({ message: `No companies found with ${scoreType} less than ${score}.` });
        }

        res.json({
            scoreType,
            validCompanies
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching ESG data', error: error.message });
    }

    return res;
});

// Search for companys with a score (total, E, G, S) between than the two
router.get('/:scoreType/:score1/:score2', async (req, res) => {
    const { scoreType, score1, score2 } = req.params;

    const validType = ['total_score', 'environmental_score', 'social_score', 'governance_score'];
    if (!validType.includes(scoreType)) {
        return res.status(500).json({ message: 'Invalid score type. Choose from: total_score, environment_score, social_score, governance_score.' });
    }

    if (score1 < 0 || score2 < 0) {
        return res.status(500).json({ message: 'Invalid score value, must be greater or equal to 0.' });
    }

    if (Number(score1) > Number(score2)) {
        return res.status(500).json({ message: 'Invalid score range, first score must be less than second score.' });
    }

    const params = {
        // Look in the esg_processed table in DynamoDB (both AWS and local)
        TableName: 'esg_processed',
        ExpressionAttributeValues: {
            ':score1': score1,
            ':score2': score2
        },
        ExpressionAttributeNames: {
            '#scoreType': scoreType
        },
        FilterExpression: '#scoreType BETWEEN :score1 AND :score2',
        ScanIndexForward: false
    };

    try {
        // Ask DynamoDB for the data (asking dynamodb for info)
        const data = await dynamodb.scan(params).promise();

        const validCompanies = [];

        data.Items.forEach((item) => {
            if (item[scoreType] >= score1 && item[scoreType] <= score2) {
                validCompanies.push({
                    ticker: item.ticker,
                    score: item[scoreType],
                    timestamp: item.timestamp
                });
            }
        });

        if (validCompanies.length === 0) {
            return res.status(404).json({ message: `No companies found with ${scoreType} between ${score1} and ${score2}.` });
        }

        res.json({
            scoreType,
            validCompanies
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching ESG data', error: error.message });
    }

    return res;
});

module.exports = router;
