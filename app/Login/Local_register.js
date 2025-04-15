const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// For local development setup
// This doesnt really matter for local development since
// We will be using the local DynamoDB instance
// We will send this to lambda when we deploy anyways
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local'
    }
});

const docClient = new AWS.DynamoDB.DocumentClient({ service: dynamodb });

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
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

async function loginUser(email, password) {
    try {
      const result = await docClient.get({
        TableName: TABLES.USERS,
        Key: { email }
      }).promise();
  
      const user = result.Item;
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        throw new Error('Invalid credentials');
      }
  
      await docClient.update({
        TableName: TABLES.USERS,
        Key: { email },
        UpdateExpression: 'set last_login = :last_login',
        ExpressionAttributeValues: {
          ':last_login': new Date().toISOString()
        }
      }).promise();
  
      const token = jwt.sign(
        { email, user_id: user.user_id, name: user.name },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
  
      return { token, user: { email, name: user.name, user_id: user.user_id } };
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }
  



module.exports = {
    createTables,
    registerUser,
    loginUser
}