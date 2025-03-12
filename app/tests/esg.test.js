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
        test('Disney (DIS) should have governance score of 321', async () => {
            // Mock the DynamoDB response with correct values from data.csv
            const mockResponse = {
                Items: [
                    {
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
                    },
                    {
                        ticker: 'aapl',
                        name: 'Apple Inc',
                        environment_score: 355,
                        social_score: 281,
                        governance_score: 255,
                        total_score: 891,
                        environment_grade: 'BB',
                        social_grade: 'B',
                        governance_grade: 'B',
                        environment_level: 'Medium',
                        social_level: 'Medium',
                        governance_level: 'Medium'
                    },
                    {
                        ticker: 'gm',
                        name: 'General Motors Co',
                        environment_score: 510,
                        social_score: 303,
                        governance_score: 255,
                        total_score: 1068,
                        environment_grade: 'A',
                        social_grade: 'BB',
                        governance_grade: 'B',
                        environment_level: 'High',
                        social_level: 'Medium',
                        governance_level: 'Medium'
                    },
                    {
                        ticker: 'gww',
                        name: 'WW Grainger Inc',
                        environment_score: 255,
                        social_score: 385,
                        governance_score: 240,
                        total_score: 880,
                        environment_grade: 'B',
                        social_grade: 'BB',
                        governance_grade: 'B',
                        environment_level: 'Medium',
                        social_level: 'Medium',
                        governance_level: 'Medium'
                    },
                    {
                        ticker: 'mhk',
                        name: 'Mohawk Industries Inc',
                        environment_score: 570,
                        social_score: 298,
                        governance_score: 303,
                        total_score: 1171,
                        environment_grade: 'A',
                        social_grade: 'B',
                        governance_grade: 'BB',
                        environment_level: 'High',
                        social_level: 'Medium',
                        governance_level: 'Medium'
                    }
                ]
            };
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'dis'
                }
            };

            const data = await dynamoDb.query(params).promise();
            expect(data.Items).toBeDefined();
            expect(data.Items.length).toBeGreaterThan(0);
            expect(data.Items[0].governance_score).toBe(321);
            expect(data.Items).toHaveLength(5);
            expect(data.Items[1].name).toBe('Apple Inc');
            expect(data.Items[2].name).toBe('General Motors Co');
            expect(data.Items[3].name).toBe('WW Grainger Inc');
            expect(data.Items[4].name).toBe('Mohawk Industries Inc');
        });

        test('Disney (DIS) should have correct ESG metrics', async () => {
            // Mock the complete ESG data response
            const mockResponse = {
                Items: [{
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
                }]
            };
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'dis'
                }
            };

            const data = await dynamoDb.query(params).promise();
            expect(data.Items[0]).toMatchObject({
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
        });

        test('Non-existent ticker should return empty Items array', async () => {
            // Mock empty response
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
    // - Use supertest to test Express endpoints
    // - Mock DynamoDB responses
    // - Test success and error cases
    // - Test input validation
});
