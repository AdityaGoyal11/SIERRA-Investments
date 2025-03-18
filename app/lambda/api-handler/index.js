const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const ticker = event.pathParameters.ticker.toLowerCase();

        const params = {
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: 'ticker = :ticker',
            ExpressionAttributeValues: {
                ':ticker': ticker
            },
            ScanIndexForward: false
        };

        // Query DynamoDB
        const data = await dynamodb.query(params).promise();

        if (data.Items && data.Items.length > 0) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    ticker,
                    historical_ratings: data.Items
                })
            };
        }
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: `No ESG data found for ticker: ${ticker}` })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Error fetching ESG data', error: error.message })
        };
    }
};
