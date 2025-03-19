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

        console.log('Extracted Parameters:', {
            ticker,
            scoreType,
            score,
            score1,
            score2,
            rating
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
                const itemTicker = item.ticker;

                // If the ticker is not in the dictionary, or this item has a later timestamp
                if (!latestRecords[itemTicker] || new Date(item.timestamp)
                    > new Date(latestRecords[itemTicker].timestamp)) {
                    latestRecords[itemTicker] = item;
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
                    ':score': Number(score)
                },
                ExpressionAttributeNames: {
                    '#scoreType': scoreType
                },
                FilterExpression: '#scoreType >= :score',
                ScanIndexForward: false
            };

            console.log('DynamoDB params:', JSON.stringify(params, null, 2));
            const data = await dynamodb.scan(params).promise();
            console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);

            const validCompanies = [];
            data.Items.forEach((item) => {
                if (item[scoreType] >= Number(score)) {
                    validCompanies.push({
                        ticker: item.ticker,
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
                if (item[scoreType] <= Number(score)) {
                    validCompanies.push({
                        ticker: item.ticker,
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
                if (item[scoreType] >= Number(score1) && item[scoreType] <= Number(score2)) {
                    validCompanies.push({
                        ticker: item.ticker,
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

        // Hard-coded mapping since our dataset doesn't include company names
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

        // Handle /api/search/company/{name} endpoint
        if (event.path.includes('/api/search/company/') && event.httpMethod === 'GET') {
            const companyName = decodeURIComponent(event.pathParameters.name.toLowerCase().trim());
            console.log(`Handling /api/search/company/${companyName} request`);

            // Check if company name exists in our mapping
            if (companyNameToTicker[companyName]) {
                const ticker = companyNameToTicker[companyName];
                
                // Fetch company data from DynamoDB using ticker
                const params = {
                    TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                    KeyConditionExpression: 'ticker = :ticker',
                    ExpressionAttributeValues: {
                        ':ticker': ticker
                    }
                };
                
                console.log('DynamoDB params:', JSON.stringify(params, null, 2));
                const data = await dynamodb.query(params).promise();
                console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);
                
                if (!data.Items || data.Items.length === 0) {
                    return createResponse(404, { message: `No ESG data found for ticker: ${ticker}` });
                }
                
                // Find the most recent record
                const latestRecord = data.Items.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                )[0];
                
                // Return with both name and ticker
                return createResponse(200, {
                    name: companyName,
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
                    TableName: process.env.DYNAMODB_TABLE || 'esg_processed',
                    KeyConditionExpression: 'ticker = :ticker',
                    ExpressionAttributeValues: {
                        ':ticker': ticker
                    }
                };
                
                console.log('DynamoDB params:', JSON.stringify(params, null, 2));
                const data = await dynamodb.query(params).promise();
                console.log('DynamoDB response items count:', data.Items ? data.Items.length : 0);
                
                if (!data.Items || data.Items.length === 0) {
                    return createResponse(404, { message: `No ESG data found for ticker: ${ticker}` });
                }
                
                // Find the most recent record
                const latestRecord = data.Items.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                )[0];
                
                return createResponse(200, {
                    name: bestMatch,
                    ticker: ticker,
                    suggested: true,
                    data: latestRecord
                });
            }

            return createResponse(404, { message: 'Company not found' });
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
