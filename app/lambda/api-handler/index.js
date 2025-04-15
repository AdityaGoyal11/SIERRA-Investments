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
    console.log('Event received:', JSON.stringify(event, null, 2));

    try {
        if (event.httpMethod === 'OPTIONS') {
            return createResponse(200, {});
        }

        // Log detailed information about the request
        console.log('HTTP Method:', event.httpMethod);
        console.log('Path:', event.path);
        console.log('Path Parameters:', JSON.stringify(event.pathParameters));
        console.log('Query String Parameters:', JSON.stringify(event.queryStringParameters));

        const pathParameters = event.pathParameters || {};
        const { ticker } = pathParameters;
        const { scoreType } = pathParameters;
        const { score } = pathParameters;
        const { score1 } = pathParameters;
        const { score2 } = pathParameters;
        const { rating } = pathParameters;
        const { name } = pathParameters;

        console.log('Extracted Parameters:', {
            ticker,
            scoreType,
            score,
            score1,
            score2,
            rating,
            name
        });

        // /api/all endpoint (to match Express routes in esg-data.js)
        if (event.path === '/api/all' && event.httpMethod === 'GET') {
            console.log('Handling /api/all request');
            const params = {
                TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                Select: 'ALL_ATTRIBUTES'
            };

            const data = await dynamodb.scan(params).promise();
            console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);

            if (data.Items && data.Items.length > 0) {
                return createResponse(200, {
                    message: 'All ESG data retrieved successfully',
                    data: data.Items
                });
            }
            return createResponse(404, { message: 'No ESG data found' });
        }

        // Handle /api/esg/{ticker} endpoint
        if (event.path.startsWith('/api/esg/') && ticker && event.httpMethod === 'GET') {
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
            console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);

            if (data.Items && data.Items.length > 0) {
                return createResponse(200, {
                    ticker,
                    company_name: data.Items[0].company_name,
                    historical_ratings: data.Items
                });
            }
            return createResponse(404, { message: `No ESG data found for ticker: ${ticker}` });
        }

        // Handle /api/search/level/total_level/{rating} endpoint
        if (event.path.includes('/api/search/level/total_level/') && rating && event.httpMethod === 'GET') {
            console.log(`Handling /api/search/level/total_level/${rating} request`);

            // Ensure rating is valid
            const validLevels = ['A', 'B', 'C', 'D', 'E'];
            if (!validLevels.includes(rating)) {
                return createResponse(400, { message: 'Invalid total level. Choose from: A to E.' });
            }
            // Query for rating
            const params = {
                TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                FilterExpression: 'attribute_exists(rating) AND rating = :rating',
                ExpressionAttributeValues: {
                    ':rating': rating
                }
            };

            console.log('DynamoDB params:', JSON.stringify(params, null, 2));
            const data = await dynamodb.scan(params).promise();
            console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);

            if (!data.Items || data.Items.length === 0) {
                return createResponse(404, { message: `No companies found for rating = ${rating}` });
            }

            // Group by Ticker and Keep the Latest Record
            const latestRecords = {};
            data.Items.forEach((item) => {
                // If the ticker is not in the dictionary, or this item has a later timestamp
                if (!latestRecords[item.ticker]
                    || new Date(item.timestamp) > new Date(latestRecords[item.ticker].timestamp)) {
                    latestRecords[item.ticker] = {
                        ...item,
                        company_name: item.company_name
                    };
                }
            });

            const companies = Object.values(latestRecords);

            return createResponse(200, {
                rating,
                companies
            });
        }

        // Handle /api/search/score/greater/{scoreType}/{score} endpoint
        if (event.path.includes('/api/search/score/greater/') && scoreType && score && event.httpMethod === 'GET') {
            console.log(`Handling /api/search/score/greater/${scoreType}/${score} request`);

            const validType = ['total_score', 'environmental_score', 'social_score', 'governance_score'];
            if (!validType.includes(scoreType)) {
                return createResponse(500, {
                    message: 'Invalid score type. Choose from: total_score, environmental_score, social_score, governance_score.'
                });
            }

            if (Number(score) < 0) {
                return createResponse(500, { message: 'Invalid score value, must be greater than or equal to 0.' });
            }

            const params = {
                TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                ExpressionAttributeValues: {
                    ':score': parseInt(score, 10)
                },
                FilterExpression: '#scoreType >= :score',
                ExpressionAttributeNames: {
                    '#scoreType': scoreType
                }
            };

            const data = await dynamodb.scan(params).promise();

            const validCompanies = [];

            data.Items.forEach((item) => {
                if (item[scoreType] >= Number(score)) {
                    validCompanies.push({
                        ticker: item.ticker,
                        company_name: item.company_name,
                        score: item[scoreType],
                        timestamp: item.timestamp
                    });
                }
            });

            if (validCompanies.length === 0) {
                return createResponse(404, {
                    message: `No companies found with ${scoreType} greater than ${score}.`
                });
            }

            return createResponse(200, {
                scoreType,
                validCompanies
            });
        }

        // Handle /api/search/score/lesser/{scoreType}/{score} endpoint
        if (event.path.includes('/api/search/score/lesser/') && scoreType && score && event.httpMethod === 'GET') {
            console.log(`Handling /api/search/score/lesser/${scoreType}/${score} request`);

            const validType = ['total_score', 'environmental_score', 'social_score', 'governance_score'];
            if (!validType.includes(scoreType)) {
                return createResponse(500, {
                    message: 'Invalid score type. Choose from: total_score, environmental_score, social_score, governance_score.'
                });
            }

            if (Number(score) < 0) {
                return createResponse(500, { message: 'Invalid score value, must be greater or equal to 0.' });
            }

            const params = {
                TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                ExpressionAttributeValues: {
                    ':score': Number(score)
                },
                ExpressionAttributeNames: {
                    '#scoreType': scoreType
                },
                FilterExpression: '#scoreType <= :score',
                ScanIndexForward: false
            };

            console.log('DynamoDB params:', JSON.stringify(params, null, 2));
            const data = await dynamodb.scan(params).promise();
            console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);

            const validCompanies = [];

            data.Items.forEach((item) => {
                if (item[scoreType] <= score) {
                    validCompanies.push({
                        ticker: item.ticker,
                        company_name: item.company_name,
                        score: item[scoreType],
                        timestamp: item.timestamp
                    });
                }
            });

            if (validCompanies.length === 0) {
                return createResponse(404, {
                    message: `No companies found with ${scoreType} less than ${score}.`
                });
            }

            return createResponse(200, {
                scoreType,
                validCompanies
            });
        }

        // Handle /api/search/score/{scoreType}/{score1}/{score2} endpoint
        if (event.path.includes('/api/search/score/') && scoreType && score1 && score2 && event.httpMethod === 'GET') {
            console.log(`Handling /api/search/score/${scoreType}/${score1}/${score2} request`);
            console.log('Score range parameters:', { scoreType, score1, score2 });

            const validType = ['total_score', 'environmental_score', 'social_score', 'governance_score'];
            if (!validType.includes(scoreType)) {
                return createResponse(500, {
                    message: 'Invalid score type. Choose from: total_score, environmental_score, social_score, governance_score.'
                });
            }

            // Validate score values
            if (Number(score1) < 0 || Number(score2) < 0) {
                return createResponse(500, { message: 'Invalid score value, must be greater or equal to 0.' });
            }

            if (Number(score1) > Number(score2)) {
                return createResponse(500, { message: 'Invalid score range, first score must be less than second score.' });
            }

            const params = {
                TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                ExpressionAttributeValues: {
                    ':score1': Number(score1),
                    ':score2': Number(score2)
                },
                ExpressionAttributeNames: {
                    '#scoreType': scoreType
                },
                FilterExpression: '#scoreType BETWEEN :score1 AND :score2',
                ScanIndexForward: false
            };

            console.log('DynamoDB params:', JSON.stringify(params, null, 2));
            const data = await dynamodb.scan(params).promise();
            console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);

            const validCompanies = [];

            data.Items.forEach((item) => {
                if (item[scoreType] >= score1 && item[scoreType] <= score2) {
                    validCompanies.push({
                        ticker: item.ticker,
                        company_name: item.company_name,
                        score: item[scoreType],
                        timestamp: item.timestamp
                    });
                }
            });

            if (validCompanies.length === 0) {
                return createResponse(404, {
                    message: `No companies found with ${scoreType} between ${score1} and ${score2}.`
                });
            }

            return createResponse(200, {
                scoreType,
                validCompanies
            });
        }

        // Handle /api/search/company/{name} endpoint
        if (event.path.includes('/api/search/company/') && event.httpMethod === 'GET') {
            const cNameQuery = decodeURIComponent(event.pathParameters.name.toLowerCase().trim());
            console.log(`Handling /api/search/company/${cNameQuery} request`);

            // Get all data from DynamoDB with pagination
            let allItems = [];
            let lastEvaluatedKey = null;

            while (true) {
                try {
                    const params = {
                        TableName: process.env.DYNAMODB_TABLE || 'esg_processed'
                    };

                    if (lastEvaluatedKey) {
                        params.ExclusiveStartKey = lastEvaluatedKey;
                    }

                    console.log('DynamoDB scan params:', JSON.stringify(params, null, 2));
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

            console.log(`Retrieved ${allItems.length} total items from DynamoDB`);

            const matchingItems = allItems.filter((item) => {
                if (!item.company_name) return false;
                const companyName = item.company_name.toLowerCase();
                return companyName.includes(cNameQuery);
            });

            console.log(`Found ${matchingItems.length} matching items after filtering`);

            if (!matchingItems || matchingItems.length === 0) {
                return createResponse(404, { message: 'Company not found' });
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

            return createResponse(200, {
                cNameQuery,
                companies
            });
        }

        return createResponse(404, { message: 'Endpoint not found' });
    } catch (error) {
        console.error('Error processing request:', error);
        return createResponse(500, {
            message: 'Error fetching ESG data',
            error: error.message,
            stack: error.stack
        });
    }
};
