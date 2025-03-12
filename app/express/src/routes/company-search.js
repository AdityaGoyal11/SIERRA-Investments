const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * @route GET /api/search/company/:name
 * @description Search for company name and return ticker
 * @assigned Adi
 * 
 * TODO MVP:
 * - Implement company name search functionality
 * OPTIONAL (IF WE HAVE TIME):
 * - Add matching for similar company names (for example Disney returns Walt Disney Co and 'dis' ticker), case-insensitive search
 */
router.get('/:name', async (req, res) => {
    
});

module.exports = router; 