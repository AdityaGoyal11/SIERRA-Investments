const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * @route GET /api/esg/all
 * @description Retrieve all ESG data with grades and scores
 * @assigned John
 * 
 * TODO MVP:
 * - Implement retrieval of all ESG data
 * OPTIONAL (IF WE HAVE TIME):
 * - Consider: Include grade and score correlations, pagination for large datasets, sorting options, filtering capabilities 
 */
router.get('/all', async (req, res) => {

});

module.exports = router; 