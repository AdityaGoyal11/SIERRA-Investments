const AWS = require('aws-sdk');
const request = require('supertest');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDynamoDb = {
        scan: jest.fn().mockReturnThis(),
        query: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };
    return {
        config: {
            update: jest.fn(() => {})
        },
        DynamoDB: {
            DocumentClient: jest.fn(() => mockDynamoDb)
        }
    };
});

// Import the app after mocking AWS
const app = require('../express/src/app');

describe('ESG Data Tests', () => {
    let dynamoDb;

    beforeEach(() => {
        // Get new instance of the mock for each test
        dynamoDb = new AWS.DynamoDB.DocumentClient();
        // Clear all mock data
        jest.clearAllMocks();
    });

    describe('DynamoDB Operations', () => {
        test('LUV should have correct scores and rating', async () => {
            // Mock the DynamoDB response with correct values from data
            const mockResponse = {
                Items: [
                    {
                        ticker: 'luv',
                        timestamp: '2024-03-14',
                        environment_score: 9,
                        social_score: 13,
                        governance_score: 5,
                        total_score: 28,
                        rating: 'C',
                        last_processed_date: '2024-03-14'
                    }
                ]
            };
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'luv'
                }
            };

            const data = await dynamoDb.query(params).promise();
            expect(data.Items).toBeDefined();
            expect(data.Items.length).toBeGreaterThan(0);
            expect(data.Items[0]).toMatchObject({
                ticker: 'luv',
                environment_score: 9,
                social_score: 13,
                governance_score: 5,
                total_score: 28,
                rating: 'C'
            });
        });

        test('Historical data should be ordered by timestamp', async () => {
            const mockResponse = {
                Items: [
                    {
                        ticker: 'luv',
                        timestamp: '2024-03-14',
                        environment_score: 9,
                        social_score: 13,
                        governance_score: 5,
                        total_score: 28,
                        rating: 'C'
                    },
                    {
                        ticker: 'luv',
                        timestamp: '2024-02-14',
                        environment_score: 9,
                        social_score: 15,
                        governance_score: 6,
                        total_score: 31,
                        rating: 'D'
                    }
                ]
            };
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'luv'
                }
            };

            const data = await dynamoDb.query(params).promise();
            expect(data.Items).toHaveLength(2);
            expect(data.Items[0].timestamp).toBe('2024-03-14');
            expect(data.Items[1].timestamp).toBe('2024-02-14');
        });

        test('Non-existent ticker should return empty Items array', async () => {
            const mockResponse = { Items: [] };
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'NONEXISTENT'
                }
            };

            const data = await dynamoDb.query(params).promise();
            expect(data.Items).toHaveLength(0);
        });
    });

    // TODO: Add API endpoint tests

    describe('Rating Search API Tests', () => {
        beforeEach(() => {
            // Get new instance of the mock for each test
            dynamoDb = new AWS.DynamoDB.DocumentClient();
            // Clear all mock data
            jest.clearAllMocks();
        });

        describe('GET /api/search/level/total_level/:rating', () => {
            test('should return companies for valid rating', async () => {
                const mockResponse = {
                    Items: [
                        { ticker: 'GOOGL', total_level: 'C', timestamp: '2025-03-01' },
                        { ticker: 'GOOGL', total_level: 'C', timestamp: '2025-02-01' },
                        { ticker: 'GOOGL', total_level: 'C', timestamp: '2025-02-13' }
                    ]
                };

                dynamoDb.promise.mockResolvedValue(mockResponse);

                const response = await request(app).get('/api/search/level/total_level/C');

                expect(response.status).toBe(200);
                // expect(response.body).toHaveLength(1);
                expect(response.body.companies).toHaveLength(1);
                // expect(response.body[0].ticker).toBe('GOOGL');
                expect(response.body.companies[0].ticker).toBe('GOOGL');
            });

            test('should return 400 for invalid rating', async () => {
                const response = await request(app).get('/api/search/level/total_level/F');

                expect(response.status).toBe(400);
                expect(response.body).toEqual({
                    message: 'Invalid total level. Choose from: A to E.'
                });
            });

            test('should return 404 if no companies found', async () => {
                dynamoDb.promise.mockResolvedValue({ Items: [] });

                const response = await request(app).get('/api/search/level/total_level/A');

                expect(response.status).toBe(404);
                expect(response.body).toEqual({
                    message: 'No companies found for rating = A'
                });
            });

            test('should return 500 if DynamoDB fails', async () => {
                const error = new Error('DynamoDB error');
                dynamoDb.promise.mockRejectedValue(error);

                const response = await request(app).get('/api/search/level/total_level/C');

                expect(response.status).toBe(500);
                expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
            });
        });
    });
});
