const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set up AWS DynamoDB client
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT
});

const docClient = new AWS.DynamoDB.DocumentClient({ service: dynamodb });

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const TOKEN_EXPIRY = '24h';
const TABLES = {
    USERS: 'sierra_users',
    TICKERS: 'sierra_saved_tickers'
};

// CORS Headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

const createResponse = function(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        },
        body: JSON.stringify(body)
    };
};

async function registerUser(email, password, name) {
    try {
        const existingUser = await docClient.get({
            TableName: TABLES.USERS,
            Key: { email: email }
        }).promise();

        if (existingUser.Item) {
            return { statusCode: 409, message: 'User already exists' };
        }

        // hashing
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        const crypto = require('crypto');
        const userId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        await docClient.put({
            TableName: TABLES.USERS,
            Item: {
                email: email,
                user_id: userId,
                password_hash: passwordHash,
                name: name,
                account_status: 'ACTIVE',
                created_at: createdAt,
                last_login: createdAt
            }
        }).promise();

        const token = jwt.sign(
            { email: email, user_id: userId, name: name },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        return { 
            statusCode: 201, 
            data: { token: token, user: { email: email, name: name, user_id: userId } }
        };
    } catch (err) {
        console.error('Registration error:', err);
        return { statusCode: 500, message: 'Error registering user', error: err.message };
    }
}

async function loginUser(email, password) {
    try {
        const result = await docClient.get({
            TableName: TABLES.USERS,
            Key: { email: email }
        }).promise();

        const user = result.Item;
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return { statusCode: 401, message: 'Invalid credentials' };
        }

        await docClient.update({
            TableName: TABLES.USERS,
            Key: { email: email },
            UpdateExpression: 'set last_login = :last_login',
            ExpressionAttributeValues: {
                ':last_login': new Date().toISOString()
            }
        }).promise();

        const token = jwt.sign(
            { email: email, user_id: user.user_id, name: user.name },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        return { 
            statusCode: 200, 
            data: { token: token, user: { email: email, name: user.name, user_id: user.user_id } }
        };
    } catch (err) {
        console.error('Login error:', err);
        return { statusCode: 500, message: 'Error logging in', error: err.message };
    }
}

async function saveTicker(token, ticker) {
    try {
        if (!token) {
            return { statusCode: 401, message: 'Missing token' };
        }
        
        if (!ticker) {
            return { statusCode: 400, message: 'Missing ticker symbol' };
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const createdAt = new Date().toISOString();
        
        await docClient.put({
            TableName: TABLES.TICKERS,
            Item: {
                user_id: decoded.user_id,
                ticker: ticker,
                created_at: createdAt
            }
        }).promise();
    
        return { 
            statusCode: 200, 
            data: { message: 'Ticker saved successfully', ticker: ticker, timestamp: createdAt }
        };
    } catch (err) {
        console.error('Save ticker error:', err);
        if (err.name === 'JsonWebTokenError') {
            return { statusCode: 401, message: 'Invalid token' };
        }
        return { statusCode: 500, message: 'Error saving ticker', error: err.message };
    }
}

// New function to retrieve tickers for a user
async function retrieveTickers(token) {
    try {
        if (!token) {
            return { statusCode: 401, message: 'Missing token' };
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const params = {
            TableName: TABLES.TICKERS,
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': decoded.user_id
            }
        };
        
        const result = await docClient.query(params).promise();
        
        if (!result.Items || result.Items.length === 0) {
            return { 
                statusCode: 200, 
                data: { message: 'No saved tickers found', tickers: [] }
            };
        }
        
        // Format the response
        const tickers = result.Items.map(item => ({
            ticker: item.ticker,
            created_at: item.created_at
        }));
        
        return { 
            statusCode: 200, 
            data: { 
                message: 'Tickers retrieved successfully', 
                count: tickers.length,
                tickers: tickers 
            }
        };
    } catch (err) {
        console.error('Retrieve tickers error:', err);
        if (err.name === 'JsonWebTokenError') {
            return { statusCode: 401, message: 'Invalid token' };
        }
        return { statusCode: 500, message: 'Error retrieving tickers', error: err.message };
    }
}

// Get auth header and extract token
function getAuthToken(headers, event) {
    if (!headers) {
        return null;
    }
    
    // Try both casing variants since API Gateway might normalize headers
    let authHeader = null;
    if (headers.Authorization) {
        authHeader = headers.Authorization;
    } else if (headers.authorization) {
        authHeader = headers.authorization;
    } else if (headers.Auth) {
        authHeader = headers.Auth;
    } else if (headers.auth) {
        authHeader = headers.auth;
    }
    
    if (!authHeader) {
        // Check if token is in query parameters
        if (event && event.queryStringParameters && event.queryStringParameters.token) {
            return event.queryStringParameters.token;
        }
        return null;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        // Return the header value as the auth header could only be just the token
        return authHeader;
    }
    
    return parts[1];
}

// Main Lambda handler function
exports.handler = async function(event) {
    console.log('Event received:', JSON.stringify(event, null, 2));

    try {
        if (event.httpMethod === 'OPTIONS') {
            return createResponse(200, {});
        }

        console.log('HTTP Method:', event.httpMethod);
        console.log('Path:', event.path);
        console.log('Path Parameters:', JSON.stringify(event.pathParameters));
        console.log('Body:', event.body);

        let body = {};
        if (event.body) {
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                console.error('Error parsing request body:', e);
                return createResponse(400, { message: 'Invalid request body' });
            }
        }

        // Extract the path without the /auth prefix
        const path = event.path.replace(/^\/auth/, '');
        console.log('Normalized path:', path);

        // Create Tables (Init) Endpoint
        if ((path === '/init' || event.path === '/auth/init') && event.httpMethod === 'GET') {
            try {
                // Users table
                await dynamodb.createTable({
                    TableName: TABLES.USERS,
                    AttributeDefinitions: [
                        { AttributeName: 'email', AttributeType: 'S' },
                        { AttributeName: 'user_id', AttributeType: 'S' },
                        { AttributeName: 'account_status', AttributeType: 'S' }
                    ],
                    KeySchema: [
                        { AttributeName: 'email', KeyType: 'HASH' }
                    ],
                    GlobalSecondaryIndexes: [
                        {
                            IndexName: 'UserIdIndex',
                            KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
                            Projection: { ProjectionType: 'ALL' }
                        },
                        {
                            IndexName: 'AccountStatusIndex',
                            KeySchema: [
                                { AttributeName: 'account_status', KeyType: 'HASH' },
                                { AttributeName: 'email', KeyType: 'RANGE' }
                            ],
                            Projection: { ProjectionType: 'ALL' }
                        }
                    ],
                    BillingMode: 'PAY_PER_REQUEST'
                }).promise();

                // Tickers table
                await dynamodb.createTable({
                    TableName: TABLES.TICKERS,
                    AttributeDefinitions: [
                        { AttributeName: 'user_id', AttributeType: 'S' },
                        { AttributeName: 'ticker', AttributeType: 'S' },
                        { AttributeName: 'created_at', AttributeType: 'S' }
                    ],
                    KeySchema: [
                        { AttributeName: 'user_id', KeyType: 'HASH' },
                        { AttributeName: 'ticker', KeyType: 'RANGE' }
                    ],
                    GlobalSecondaryIndexes: [
                        {
                            IndexName: 'TickerIndex',
                            KeySchema: [{ AttributeName: 'ticker', KeyType: 'HASH' }],
                            Projection: { ProjectionType: 'ALL' }
                        }
                    ],
                    BillingMode: 'PAY_PER_REQUEST'
                }).promise();

                return createResponse(200, { message: 'Tables created successfully' });
            } catch (err) {
                if (err.code === 'ResourceInUseException') {
                    console.log('Tables already exist');
                    return createResponse(200, { message: 'Tables already exist' });
                } else {
                    console.error('Error creating tables:', err);
                    return createResponse(500, { message: 'Error creating tables', error: err.message });
                }
            }
        }

        // Register Endpoint
        if ((path === '/register' || event.path === '/auth/register') && event.httpMethod === 'POST') {
            const email = body.email;
            const password = body.password;
            const name = body.name;

            if (!email || !password || !name) {
                return createResponse(400, { message: 'Email, password, and name are required' });
            }

            const result = await registerUser(email, password, name);
            if (result.statusCode === 201) {
                return createResponse(result.statusCode, result.data);
            } else {
                return createResponse(result.statusCode, { message: result.message, error: result.error });
            }
        }

        // Login Endpoint
        if ((path === '/login' || event.path === '/auth/login') && event.httpMethod === 'POST') {
            const email = body.email;
            const password = body.password;

            if (!email || !password) {
                return createResponse(400, { message: 'Email and password are required' });
            }

            const result = await loginUser(email, password);
            if (result.statusCode === 200) {
                return createResponse(result.statusCode, result.data);
            } else {
                return createResponse(result.statusCode, { message: result.message, error: result.error });
            }
        }

        // Save Ticker Endpoint
        if ((path === '/tickers' || event.path === '/auth/tickers') && event.httpMethod === 'POST') {
            const ticker = body.ticker;
            
            if (!ticker) {
                return createResponse(400, { message: 'Ticker is required' });
            }
            
            // Extract token from Authorization header
            const token = getAuthToken(event.headers, event);
            if (!token) {
                return createResponse(401, { message: 'Authorization token required' });
            }
            
            const result = await saveTicker(token, ticker);
            if (result.statusCode === 200) {
                return createResponse(result.statusCode, result.data);
            } else {
                return createResponse(result.statusCode, { message: result.message, error: result.error });
            }
        }

        // Retrieve Tickers Endpoint (NEW)
        if ((path === '/tickers' || event.path === '/auth/tickers') && event.httpMethod === 'GET') {
            // Extract token from Authorization header
            const token = getAuthToken(event.headers, event);
            if (!token) {
                return createResponse(401, { message: 'Authorization token required' });
            }
            
            const result = await retrieveTickers(token);
            if (result.statusCode === 200) {
                return createResponse(result.statusCode, result.data);
            } else {
                return createResponse(result.statusCode, { message: result.message, error: result.error });
            }
        }

        // Health Check Endpoint
        if ((path === '/health' || event.path === '/auth/health') && event.httpMethod === 'GET') {
            return createResponse(200, { status: 'ok' });
        }

        return createResponse(404, { message: 'Endpoint not found' });
    } catch (error) {
        console.error('Error processing request:', error);
        return createResponse(500, {
            message: 'Error processing request',
            error: error.message,
            stack: error.stack
        });
    }
}; 