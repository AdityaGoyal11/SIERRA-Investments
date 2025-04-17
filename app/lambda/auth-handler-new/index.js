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

// Get auth header and extract token
function getAuthToken(headers) {
    if (!headers) {
        return null;
    }
    
    // Try both casing variants since API Gateway might normalize headers
    let authHeader = null;
    if (headers.Authorization) {
        authHeader = headers.Authorization;
    } else if (headers.authorization) {
        authHeader = headers.authorization;
    }
    
    if (!authHeader) {
        return null;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
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
        console.log('DynamoDB Endpoint:', process.env.DYNAMODB_ENDPOINT);
        console.log('JWT Secret Length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');

        let body = {};
        if (event.body) {
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                console.error('Error parsing request body:', e);
                return createResponse(400, { message: 'Invalid request body' });
            }
        }

        // Debug route - simple response to check if Lambda is responding properly
        if ((event.path === '/auth/debug' || event.path === '/debug') && event.httpMethod === 'GET') {
            return createResponse(200, { 
                message: 'Debug route working', 
                path: event.path,
                method: event.httpMethod,
                timestamp: new Date().toISOString(),
                environment: {
                    region: process.env.AWS_REGION || 'us-east-1',
                    dbEndpoint: process.env.DYNAMODB_ENDPOINT || 'not set',
                    jwtSecretPresent: !!process.env.JWT_SECRET
                }
            });
        }

        // Health check endpoint - verify AWS services are accessible
        if ((event.path === '/auth/health' || event.path === '/health') && event.httpMethod === 'GET') {
            try {
                // Test if we can connect to DynamoDB
                const tables = await dynamodb.listTables({}).promise();
                
                return createResponse(200, { 
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    tables: tables.TableNames,
                    region: process.env.AWS_REGION || 'us-east-1'
                });
            } catch (err) {
                console.error('Health check error:', err);
                return createResponse(500, { 
                    status: 'unhealthy',
                    message: 'Error connecting to DynamoDB',
                    error: err.message
                });
            }
        }

        // Create Tables (Init) Endpoint
        if ((event.path === '/auth/init' || event.path === '/init') && event.httpMethod === 'GET') {
            try {
                console.log('Attempting to create tables...');
                
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
                console.log('Users table created or already exists');

                // Tickers table
                await dynamodb.createTable({
                    TableName: TABLES.TICKERS,
                    AttributeDefinitions: [
                        { AttributeName: 'user_id', AttributeType: 'S' },
                        { AttributeName: 'ticker', AttributeType: 'S' }
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
                console.log('Tickers table created or already exists');

                return createResponse(200, { message: 'Tables created successfully' });
            } catch (err) {
                console.error('Error creating tables:', err);
                console.error('Error stack:', err.stack);
                
                if (err.code === 'ResourceInUseException') {
                    return createResponse(200, { message: 'Tables already exist' });
                } else {
                    return createResponse(500, { 
                        message: 'Error creating tables',
                        error: err.message,
                        code: err.code,
                        statusCode: err.statusCode
                    });
                }
            }
        }

        // Register endpoint
        if ((event.path === '/auth/register' || event.path === '/register') && event.httpMethod === 'POST') {
            if (!body.email || !body.password || !body.name) {
                return createResponse(400, { message: 'Missing required fields' });
            }
            
            const result = await registerUser(body.email, body.password, body.name);
            return createResponse(result.statusCode, result.statusCode === 201 ? result.data : { message: result.message });
        }

        // Login endpoint
        if ((event.path === '/auth/login' || event.path === '/login') && event.httpMethod === 'POST') {
            if (!body.email || !body.password) {
                return createResponse(400, { message: 'Missing required fields' });
            }
            
            const result = await loginUser(body.email, body.password);
            return createResponse(result.statusCode, result.statusCode === 200 ? result.data : { message: result.message });
        }

        // Save ticker endpoint
        if ((event.path === '/auth/tickers' || event.path === '/tickers') && event.httpMethod === 'POST') {
            const token = getAuthToken(event.headers);
            if (!token) {
                return createResponse(401, { message: 'Authorization token required' });
            }
            
            if (!body.ticker) {
                return createResponse(400, { message: 'Ticker is required' });
            }
            
            const result = await saveTicker(token, body.ticker);
            return createResponse(result.statusCode, result.statusCode === 200 ? result.data : { message: result.message });
        }

        // Fallback for undefined routes
        return createResponse(404, { 
            message: 'Endpoint not found',
            requestedPath: event.path,
            method: event.httpMethod 
        });
    } catch (error) {
        console.error('Error handling request:', error);
        console.error('Error stack:', error.stack);
        return createResponse(500, { 
            message: 'Internal server error',
            error: error.message,
            path: event.path,
            method: event.httpMethod
        });
    }
}; 