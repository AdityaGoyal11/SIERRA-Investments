const request = require('supertest');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDynamoDb = {
        query: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };
    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => mockDynamoDb)
        },
        config: {
            update: jest.fn()
        }
    };
});

// Import the app after mocking AWS
const app = require('../express/src/app');

describe('Testing express/src/app.js', () => {
    let originalEnv;

    beforeEach(() => {
        // Store original environment
        originalEnv = process.env;
        process.env = { ...originalEnv };
        // Clear all mock data
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Reset the environment to the original state
        process.env = originalEnv;
    });

    describe('AWS Config', () => {
        // Testing for local development, config should be the local
        test('should configure AWS for local development', () => {
            process.env.NODE_ENV = 'development';
            process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
            process.env.AWS_ACCESS_KEY_ID = 'local';
            process.env.AWS_SECRET_ACCESS_KEY = 'local';
            
            jest.isolateModules(() => {
                require('../express/src/app');
            });

            expect(AWS.config.update).toHaveBeenCalledWith({
                region: 'us-east-1',
                endpoint: 'http://localhost:8000',
                credentials: {
                    accessKeyId: 'local',
                    secretAccessKey: 'local'
                }
            });
        });

        // Retrigger the app to test the production environment
        test('should configure AWS for production', () => {
            process.env.NODE_ENV = 'production';
            jest.isolateModules(() => {
                require('../express/src/app');
            });

            // If AWS is configured, then region should be us-east-1
            expect(AWS.config.update).toHaveBeenCalledWith({
                region: 'us-east-1'
            });
        });
    });

    // This test should pass if we have endpoints
    describe('Express Middleware', () => {
        test('should use JSON middleware', async () => {
            const response = await request(app)
                .post('/api/esg/test')
                .send({ ticker: 'sigma' });
            // Should be 404 since we dont have a test endpoint
            expect(response.status).toBe(404);
        });
    });

    // Just testing for coverage purposes
    describe('Health Check Endpoint', () => {
        test('should return 200 status and ok message', async () => {
            const response = await request(app).get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: 'ok' });
        });
    });

    // /api/esg/dis should return a 200 status
    describe('ESG Routes', () => {
        test('should setup ESG routes at /api/esg', async () => {
            const response = await request(app).get('/api/esg');
            
            expect(response.status).toBe(200);
        });

        test('should return 200 for valid ticker', async () => {
            const mockResponse = {
                Items: [{
                    ticker: 'dis',
                    name: 'Walt Disney Co',
                    environment_score: 510,
                    social_score: 316,
                    governance_score: 321,
                    total_score: 1147,
                    environment_grade: 'A',
                    social_grade: 'BB',
                    governance_grade: 'BB',
                    environment_level: 'High',
                    social_level: 'Medium',
                    governance_level: 'Medium'
                }]
            };

            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/esg/dis');
            
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.ticker).toBe('dis');
        });

        test('should return 404 for non-existent ticker', async () => {
            const mockResponse = {
                Items: []
            };

            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/esg/nonexistent');
            
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: "No ESG data found for ticker: nonexistent" });
        });

        test('should return 500 for DynamoDB error', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/esg/dis');
            
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
        });
    });
});

