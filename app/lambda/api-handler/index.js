const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
    },
    body: JSON.stringify(body)
});

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        if (event.httpMethod === 'OPTIONS') {
            return createResponse(200, {});
        }

        const pathParameters = event.pathParameters || {};
        const ticker = pathParameters.ticker;

        if (event.path === '/api/esg-data' && event.httpMethod === 'GET') {
            console.log('Handling /api/esg-data request');
            const params = {
                TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                Select: 'ALL_ATTRIBUTES'
            };

            const data = await dynamodb.scan(params).promise();
            console.log('DynamoDB response:', JSON.stringify(data, null, 2));

            if (data.Items && data.Items.length > 0) {
                return createResponse(200, {
                    message: 'All ESG data retrieved successfully',
                    data: data.Items
                });
            } else {
                return createResponse(404, { message: 'No ESG data found' });
            }
        }

        // /api/esg/{ticker} endpoint
        if (ticker) {
            console.log('Handling /api/esg/{ticker} request for ticker:', ticker);
            const params = {
                TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': ticker.toLowerCase()
                },
                ScanIndexForward: false
            };

            console.log('DynamoDB params:', JSON.stringify(params, null, 2));
            const data = await dynamodb.query(params).promise();
            console.log('DynamoDB response:', JSON.stringify(data, null, 2));

            if (data.Items && data.Items.length > 0) {
                return createResponse(200, {
                    ticker,
                    historical_ratings: data.Items
                });
            } else {
                return createResponse(404, { message: `No ESG data found for ticker: ${ticker}` });
            }
        }

        return createResponse(404, { message: 'Not Found' });

    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { 
            message: 'Error fetching ESG data', 
            error: error.message,
            stack: error.stack
        });
    }
};
