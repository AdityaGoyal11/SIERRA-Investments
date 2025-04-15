const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY;

exports.handler = async (event) => {
  try {
    const { email, password, name } = JSON.parse(event.body);
    
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email, password, and name are required' })
      };
    }
    
    const existingUser = await dynamoDB.get({
      TableName: USERS_TABLE,
      Key: { email }
    }).promise();
    
    if (existingUser.Item) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }
    
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const userId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const user = {
      email,
      user_id: userId,
      password_hash: passwordHash,
      name,
      account_status: 'ACTIVE',
      created_at: createdAt,
      last_login: createdAt
    };
    
    await dynamoDB.put({
      TableName: USERS_TABLE,
      Item: user
    }).promise();
    
    const token = jwt.sign(
      { email, user_id: userId, name },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({ token, user: { email, name, user_id: userId } })
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};