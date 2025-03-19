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
            update: jest.fn()
        }
    };
});

const app = require('../express/src/app');

describe('Company Search API Tests', () => {
    let dynamoDb;

    beforeEach(() => {
        dynamoDb = new AWS.DynamoDB.DocumentClient();
        jest.clearAllMocks();
    });

    describe('GET /api/search/company/:name', () => {
        test('Valid company name should return correct ticker and details', async () => {
            const mockResponse = {
                Items: [
                    {
                        name: 'Example Name',
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

            const res = await request(app).get('/api/search/company/example name');

            expect(res.status).toBe(200);
            expect(res.body).toBeDefined();
            expect(res.body.ticker).toBe('luv');
            expect(res.body.name).toBe('Example Name');
            expect(res.body.environment_score).toBe(9);
            expect(res.body.social_score).toBe(13);
            expect(res.body.governance_score).toBe(5);
            expect(res.body.total_score).toBe(28);
            expect(res.body.rating).toBe('C');
        });

        test('Case-insensitive search should return correct result', async () => {
            const mockResponse = {
                Items: [
                    {
                        name: 'Example Name',
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

            const res = await request(app).get('/api/search/company/EXAMPLE NAME');

            expect(res.status).toBe(200);
            expect(res.body.ticker).toBe('luv');
            expect(res.body.name).toBe('Example Name');
        });

        test('Non-existent company should return 404', async () => {
            const mockResponse = { Items: [] };
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const res = await request(app).get('/api/search/company/nonexistent');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Company not found' });
        });
        
        test('Server error should return 500', async () => {
            // Force DynamoDB to reject with an error
            dynamoDb.promise.mockRejectedValue(new Error('DynamoDB scan failed'));

            const res = await request(app).get('/api/search/company/example name');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal Server Error' });
        });
    });
});