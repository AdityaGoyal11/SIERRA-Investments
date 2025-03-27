const request = require('supertest');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDynamoDb = {
        scan: jest.fn().mockReturnThis(),
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
                        ticker: 'luv',
                        company_name: 'Southwest Airlines Co',
                        timestamp: '2024-03-14',
                        total_score: 28,
                        rating: 'C'
                    },
                    {
                        ticker: 'luv',
                        company_name: 'Southwest Airlines Co',
                        timestamp: '2024-02-14',
                        total_score: 25,
                        rating: 'C'
                    }
                ]
            };

            dynamoDb.promise.mockResolvedValue(mockResponse);

            const res = await request(app).get('/api/search/company/southwest');

            expect(res.status).toBe(200);
            expect(res.body).toBeDefined();
            expect(res.body.companyNameQuery).toBe('southwest');
            // Should only return latest record
            expect(res.body.companies).toHaveLength(1);
            expect(res.body.companies[0]).toMatchObject({
                ticker: 'luv',
                company_name: 'Southwest Airlines Co',
                timestamp: '2024-03-14',
                total_score: 28,
                rating: 'C'
            });
        });

        test('Companies should be sorted alphabetically', async () => {
            const mockResponse = {
                Items: [
                    { company_name: 'Zebra Corp', timestamp: '2024-03-14' },
                    { company_name: 'Apple Inc', timestamp: '2024-03-14' },
                    { company_name: 'Microsoft Corp', timestamp: '2024-03-14' }
                ]
            };
            dynamoDb.promise.mockResolvedValue(mockResponse);
            
            const res = await request(app).get('/api/search/company/corp');
            
            expect(res.body.companies).toEqual([
                expect.objectContaining({ company_name: 'Microsoft Corp' }),
                expect.objectContaining({ company_name: 'Zebra Corp' })
            ]);
        });

        test('Case-insensitive search should return correct result', async () => {
            const mockResponse = {
                Items: [
                    {
                        ticker: 'luv',
                        company_name: 'Southwest Airlines Co',
                        timestamp: '2024-03-14',
                        total_score: 28,
                        rating: 'C'
                    }
                ]
            };

            dynamoDb.promise.mockResolvedValue(mockResponse);

            const res = await request(app).get('/api/search/company/SOUTHWEST');

            expect(res.status).toBe(200);
            expect(res.body.companyNameQuery).toBe('southwest');
            expect(res.body.companies).toHaveLength(1);
            expect(res.body.companies[0]).toMatchObject({
                ticker: 'luv',
                company_name: 'Southwest Airlines Co'
            });
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

            const res = await request(app).get('/api/search/company/apple');

            expect(res.status).toBe(500);
            expect(res.body).toEqual({
                message: 'Internal Server Error',
                error: 'DynamoDB scan failed'
            });
        });

        test('Multiple companies should be deduplicated and sorted', async () => {
            const mockResponse = {
                Items: [
                    {
                        ticker: 'aapl',
                        company_name: 'Apple Inc',
                        timestamp: '2024-03-14',
                        total_score: 85,
                        rating: 'A'
                    },
                    {
                        ticker: 'aapl',
                        company_name: 'Apple Inc',
                        timestamp: '2024-02-14',
                        total_score: 82,
                        rating: 'A'
                    },
                    {
                        ticker: 'msft',
                        company_name: 'Microsoft Corporation',
                        timestamp: '2024-03-14',
                        total_score: 78,
                        rating: 'B'
                    }
                ]
            };

            dynamoDb.promise.mockResolvedValue(mockResponse);

            const res = await request(app).get('/api/search/company/inc');

            expect(res.status).toBe(200);
            expect(res.body.companies).toHaveLength(1);
            expect(res.body.companies[0].company_name).toBe('Apple Inc');
        });
    });
});
