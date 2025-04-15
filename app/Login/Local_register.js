const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const dynamodb = new AWS.DynamoDB({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'ASIATUER6CMOLEPA7GEN', 
    secretAccessKey: 'fbf8IUwIQrEmdVgTMzzewbTO2A3rnj4IXB1/YvHP' 
});

const docClient = new AWS.DynamoDB.DocumentClient({ service: dynamodb });

// Configuration
const JWT_SECRET = 'APOISDUJSIDUQWDJW'; 
const TOKEN_EXPIRY = '24h';
const TABLES = {
  USERS: 'sierra_users',
  TICKERS: 'sierra_saved_tickers' // not yet implemented
};

async function createTables() {
    try {
        // Users Table
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

        // Tickers Table
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

        console.log('Tables created successfully');
    } catch (err) {
        if (err.code === 'ResourceInUseException') {
        console.log('Tables already exist');
        } else {
        console.error('Error creating tables:', err);
        }
    }
}


async function registerUser(email, password, name) {
  try {
    const existingUser = await docClient.get({
      TableName: TABLES.USERS,
      Key: { email }
    }).promise();

    if (existingUser.Item) {
      throw new Error('User already exists');
    }

    // hashing
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const userId = require('crypto').randomUUID();
    const createdAt = new Date().toISOString();

    await docClient.put({
      TableName: TABLES.USERS,
      Item: {
        email,
        user_id: userId,
        password_hash: passwordHash,
        name,
        account_status: 'ACTIVE',
        created_at: createdAt,
        last_login: createdAt
      }
    }).promise();

    const token = jwt.sign(
      { email, user_id: userId, name },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return { token, user: { email, name, user_id: userId } };
  } catch (err) {
    console.error('Registration error:', err);
    throw err;
  }
}



module.exports = {
    createTables,
    registerUser
}