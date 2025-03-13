const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

// Set up our connection to DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Helper function to query DynamoDB and return unique companies
 */
async function getUniqueCompanies(params) {
    try {
        // Query DynamoDB
        const data = await dynamodb.scan(params).promise();

        if (data.Items && data.Items.length > 0) {

            // Group by ticker and keep only the latest timestamp entry
            const uniqueCompanies = {};
            data.Items.forEach(item => {
                const ticker = item.ticker;
                if (!uniqueCompanies[ticker] || item.timestamp > uniqueCompanies[ticker].timestamp) {
                    uniqueCompanies[ticker] = item;
                }
            });

            // Return last unique company records
            return Object.values(uniqueCompanies);
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error:", error);
        throw new Error("Error fetching ESG data");
    }
}
/**
 * @route GET /api/search/level/:type
 * @description Search companies based on their ESG levels
 * @assigned Kosar
 *
 * TODO MVP:
 * - Implement search by total level
 * - Implement search by environmental level
 * - Implement search by social level
 * - Implement search by governance level
 * OPTIONAL (IF WE HAVE TIME):
 * - Maybe adding sorting by ascending or descending
 */

// Search by total level
router.get('/total_level/:level', async (req, res) => {

    const { level } = req.params;

    // Ensure level is valid
    const validLevels = ["High", "Medium", "Low"];
    if (!validLevels.includes(level)) {
        return res.status(400).json({ message: "Invalid total level. Choose from: High, Medium, Low." });
    }

    // Query for total_level
    const params = {
        TableName: "esg_processed",
        FilterExpression: "total_level = :levelValue",
        ExpressionAttributeValues: {
            ":levelValue": level
        },
        // Sorts the dynamodb data in descending order
        ScanIndexForward: false,

    };

    try {
        // Query DynamoDB
        const data = await dynamodb.scan(params).promise();

        if (data.Items && data.Items.length > 0) {

            const companies = await getUniqueCompanies(data);
            res.json(companies);
        } else {
            res.status(404).json({ message: `No companies found for total_level = ${level}` });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error fetching ESG data", error: error.message });
    }
});

// Search by level(E,S,G)
// route: GET api/search/level/environment_level/High
router.get("/:levelType/:level", async (req, res) => {
    const { levelType, level } = req.params;

    // Ensure valid level category
    const validCat = ["environment_level", "social_level", "governance_level"];
    if (!validCat.includes(levelType)) {
        return res.status(500).json({ message: "Invalid level type. Choose from: environment_level, social_level, governance_level." });
    }

    // Ensure level is valid
    validLevels = ["High", "Medium", "Low"];
    if (!validLevels.includes(level)) {
        return res.status(500).json({ message: "Invalid level value. Choose from: High, Medium, Low." });
    }

    // Query parameters for levels
    const params = {
        TableName: "esg_processed",
        FilterExpression: "#levelAttr = :levelValue",
        ExpressionAttributeNames: {
            "#levelAttr": levelType
        },
        ExpressionAttributeValues: {
            ":levelValue": level
        }
    };

    try {
        // Query DynamoDB
        //const data = await dynamodb.scan(params).promise();

        const companies = await getUniqueCompanies(params);
        if (companies.length > 0) {
            res.json(companies);
        } else {
            res.status(404).json({ message: `No companies found for ${levelType} = ${level}` });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error fetching ESG data", error: error.message });
    }
});

module.exports = router;
