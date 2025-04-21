const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// For local development setup
// This doesnt really matter for local development since
// We will be using the local DynamoDB instance
// We will send this to lambda when we deploy anyways

// forgot we already have env variables in docker compose setup
// No need for fallback keys
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const docClient = new AWS.DynamoDB.DocumentClient({ service: dynamodb });

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const TOKEN_EXPIRY = '24h';
const TABLES = {
    USERS: 'sierra_users',
    TICKERS: 'sierra_saved_tickers' 
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

<<<<<<< HEAD
async function saveTicker(token, ticker) {
    // Added error handling for missing token and ticker symbol
    try {
      if (!token) {
        throw new Error('Missing token');
      }
      
      if (!ticker) {
        throw new Error('Missing ticker symbol');
      }
      
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const createdAt = new Date().toISOString();
      
      await docClient.put({
        TableName: TABLES.TICKERS,
        Item: {
          user_id: decoded.user_id,
          ticker,
          created_at: createdAt
        }
      }).promise();
  
      return { message: 'Ticker saved successfully', ticker, timestamp: createdAt };
    } catch (err) {
      console.error('Save ticker error:', err);
      throw err;
    }
}

=======
async function questionnaireAnswer(token, questionId, answerId) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.user_id;

        // Find if user exists based on active token
        const existingUser = await docClient.get({
            TableName: TABLES.USERS,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        if (!existingUser.Item) {
            throw new Error('User does not exist');
        }

        // Updates the user's answers every time they submit a new one
        const submittedAnswers = {
            ...(existingUser.Item.submittedAnswers || {}),
            [questionId]: answerId
        };

        await docClient.update({
            TableName: TABLES.USERS,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'user_id = :userId',
            UpdateExpression: 'set submittedAnswers = :answers',
            ExpressionAttributeValues: {
                ':answers': submittedAnswers
            }
        }).promise();

        return {
            submittedAnswers
        };
    } catch (err) {
        console.error('Questionnaire answering error:', err);
        throw err;
    }
}

async function questionnaireComplete(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.user_id;

        // Find if user exists based on active token
        const existingUser = await docClient.get({
            TableName: TABLES.USERS,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'user_id = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        if (!existingUser.Item) {
            throw new Error('User does not exist');
        }

        console.log(existingUser.Item);

        const submittedAnswers = existingUser.Item.submittedAnswers || {};

        // const tickersMap = {
        //     // Environmental
        //     '2_1': ['TSLA', 'NIO'],
        //     // Social
        //     '2_2': ['AAPL', 'MSFT'],
        //     // Governance
        //     '2_3': ['JPM', 'BAC'],
        //     // News companies
        //     '3_2': ['NYT', 'GOOGL'],
        //     // Tech companies
        //     '3_1': ['META', 'MSFT'],
        //     // Finance
        //     '3_3': ['GS', 'V'],
        //     // Food
        //     '3_4': ['MCD', 'SBUX']
        // };

        return {
            submittedAnswers
        };
    } catch (err) {
        console.error('Questionnaire error:', err);
        throw err;
    }
}
>>>>>>> eef692f446dd1cc843d83bd1cdbe358ed3cfe044

module.exports = {
    createTables,
    registerUser,
    loginUser,
<<<<<<< HEAD
    saveTicker
=======
    questionnaireAnswer,
    questionnaireComplete
>>>>>>> eef692f446dd1cc843d83bd1cdbe358ed3cfe044
};
