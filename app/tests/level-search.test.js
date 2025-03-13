const request = require('supertest');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDynamoDb = {
        scan: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };
    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => mockDynamoDb)
        },
        config: {
            update: jest.fn() // Ensures AWS.config.update() doesn't cause errors
        }
    };
});

// Import the app after mocking AWS
const app = require('../express/src/app');

describe('Level Search API Tests', () => {
    let dynamoDb;

    beforeEach(() => {
        // Get new instance of the mock for each test
        dynamoDb = new AWS.DynamoDB.DocumentClient();
        // Clear all mock data
        jest.clearAllMocks();
    });

    describe('GET /api/search/level/total_level/:level', () => {
        test('should return companies for valid level', async () => {
            const mockResponse = {
                Items: [
                    { ticker: 'ABC', total_level: 'High', timestamp: 1700000000 }
                ]
            };

            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/level/total_level/High');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].ticker).toBe('ABC');
        });

        test('should return 400 for invalid level', async () => {
            const response = await request(app).get('/api/search/level/total_level/Invalid');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Invalid total level. Choose from: High, Medium, Low.'
            });
        });

        test('should return 404 if no companies found', async () => {
            dynamoDb.promise.mockResolvedValue({ Items: [] });

            const response = await request(app).get('/api/search/level/total_level/High');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'No companies found for total_level = High'
            });
        });

        test('should return 500 if DynamoDB fails', async () => {
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/search/level/total_level/High');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
        });
    });

    describe('GET /api/search/level/:levelType/:level', () => {
        test('should return companies for valid levelType and level', async () => {
            const mockResponse = {
                Items: [
                    { ticker: 'XYZ', environment_level: 'Medium', timestamp: 1700000000 }
                ]
            };

            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/level/environment_level/Medium');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].ticker).toBe('XYZ');
        });

        test('should return 500 for invalid levelType', async () => {
            const response = await request(app).get('/api/search/level/invalid_level/High');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Invalid level type. Choose from: environment_level, social_level, governance_level.'
            });
        });

        test('should return 500 for invalid level', async () => {
            const response = await request(app).get('/api/search/level/environment_level/Invalid');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Invalid level value. Choose from: High, Medium, Low.'
            });
        });

        test('should return 404 if no companies found', async () => {
            dynamoDb.promise.mockResolvedValue({ Items: [] });

            const response = await request(app).get('/api/search/level/environment_level/High');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'No companies found for environment_level = High'
            });
        });

        test('should return 500 if DynamoDB fails', async () => {
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/search/level/environment_level/High');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Error fetching ESG data',
                error: 'Error fetching ESG data'
            });
        });
    });
});
