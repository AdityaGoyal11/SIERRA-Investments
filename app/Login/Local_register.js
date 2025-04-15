const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const dynamodb = new AWS.DynamoDB({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'NotUsed', 
    secretAccessKey: 'NotUsed' 
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