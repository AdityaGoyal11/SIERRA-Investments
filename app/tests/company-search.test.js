const request = require('supertest');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDynamoDb = {
        scan: jest.fn().mockReturnThis(),
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
            dynamoDb.scan.mockReturnThis();
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
            dynamoDb.scan.mockReturnThis();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const res = await request(app).get('/api/search/company/EXAMPLE NAME');

            expect(res.status).toBe(200);
            expect(res.body.ticker).toBe('luv');
            expect(res.body.name).toBe('Example Name');
        });

        test('Non-existent company should return 404', async () => {
            const mockResponse = { Items: [] };
            dynamoDb.scan.mockReturnThis();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const res = await request(app).get('/api/search/company/nonexistent');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Company not found' });
        });

        test('Server error should return 500', async () => {
            // Force DynamoDB to reject with an error
            dynamoDb.scan.mockReturnThis();
            dynamoDb.promise.mockRejectedValue(new Error('DynamoDB scan failed'));

            const res = await request(app).get('/api/search/company/example name');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: 'Internal Server Error' });
        });
        test('Company in mapping but no DynamoDB data should continue to fallback search', async () => {
            // aapl in mapping but not in dynamodb, scan entire db to find match
            // using aapl example because it's in the mapping (its not in S&P 500 though)
            // but same concept applies to a company in S&P 500 that is not in the mapping
            dynamoDb.query.mockReturnValueOnce({
                promise: jest.fn().mockResolvedValue({ Items: [] })
            });
            dynamoDb.scan.mockReturnValueOnce({
                promise: jest.fn().mockResolvedValue({
                    Items: [
                        {
                            ticker: 'aapl',
                            name: 'apple',
                            timestamp: '2024-03-14',
                            total_score: 25
                        }
                    ]
                })
            });

            const res = await request(app).get('/api/search/company/apple');

            expect(res.status).toBe(200);
            expect(res.body.ticker).toBe('aapl');
        });

        test('Company in mapping but no data in either lookup should return 404', async () => {
            // Need to mock query for ticker lookup, then scan for reason mentioned in test prior
            // using apple as example because it's in the mapping and has no data in either lookup
            dynamoDb.query.mockReturnValueOnce({
                promise: jest.fn().mockResolvedValue({ Items: [] })
            });
            dynamoDb.scan.mockReturnValueOnce({
                promise: jest.fn().mockResolvedValue({ Items: [] })
            });

            const res = await request(app).get('/api/search/company/apple');

            expect(res.status).toBe(404);
            expect(res.body).toEqual({ message: 'Company not found' });
        });
    });
});
