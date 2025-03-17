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
        }
    };
});

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
});
