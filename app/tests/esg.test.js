const AWS = require('aws-sdk');
const request = require('supertest');
const app = require('../express/src/app');

// Configure AWS SDK for local DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000', // Note: Using localhost instead of dynamodb-local since test runs outside Docker
    credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});

describe('ESG Data Tests', () => {
    // DynamoDB Tests
    describe('DynamoDB Operations', () => {
        test('Disney (DIS) should have governance score of 85', async () => {
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'dis'
                }
            };

            try {
                const data = await dynamodb.query(params).promise();
                expect(data.Items).toBeDefined();
                expect(data.Items.length).toBeGreaterThan(0);
                expect(data.Items[0].governance_score).toBe(85);
            } catch (error) {
                console.error('Error querying DynamoDB:', error);
                throw error;
            }
        });

        test('Disney (DIS) should have correct ESG metrics', async () => {
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'dis'
                }
            };

            try {
                const data = await dynamodb.query(params).promise();
                const disney = data.Items[0];
                
                expect(disney).toMatchObject({
                    ticker: 'dis',
                    name: 'Disney',
                    environment_score: 82,
                    social_score: 88,
                    governance_score: 85,
                    total_score: 85,
                    environment_grade: 'A',
                    social_grade: 'A+',
                    governance_grade: 'A',
                    environment_level: 'Leader',
                    social_level: 'Leader',
                    governance_level: 'Leader'
                });
            } catch (error) {
                console.error('Error querying DynamoDB:', error);
                throw error;
            }
        });

        test('Non-existent ticker should return empty Items array', async () => {
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'NONEXISTENT'
                }
            };

            const data = await dynamodb.query(params).promise();
            expect(data.Items).toHaveLength(0);
        });
    });

    // API Endpoint Tests
    describe('API Endpoints', () => {
        test('GET /health should return healthy status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: 'ok' });
        });

        test('GET /api/esg/dis should return Disney data', async () => {
            const response = await request(app).get('/api/esg/dis');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('governance_score', 85);
        });

        test('GET /api/esg/NONEXISTENT should return 404', async () => {
            const response = await request(app).get('/api/esg/NONEXISTENT');
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message');
        });
    });
}); 