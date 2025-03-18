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

describe('Testing Score Search', () => {
    let originalEnv;
    const mockResponse = {
        Items: [
            {
                ticker: 'dis',
                timestamp: '2024-03-12',
                last_processed_date: '2024-03-12',
                total_score: 85,
                environmental_score: 80,
                social_score: 90,
                governance_score: 85
            },
            {
                ticker: 'dis',
                timestamp: '2023-03-12',
                last_processed_date: '2023-03-12',
                total_score: 82,
                environmental_score: 78,
                social_score: 88,
                governance_score: 80
            }
        ]
    };

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

    describe('Searching scores greater than the input', () => {
        test('Returning all valid companies within the total score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/greater/total_score/80');

            const expectedResponse = {
                scoreType: 'total_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 85,
                        timestamp: '2024-03-12'
                    },
                    {
                        ticker: 'dis',
                        score: 82,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('Returning all valid companies within the environmental score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/greater/environmental_score/90');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No companies found with environmental_score greater than 90.' });
        });

        test('Returning all valid companies within the social score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/greater/social_score/90');

            const expectedResponse = {
                scoreType: 'social_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 90,
                        timestamp: '2024-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('Returning all valid companies within the governance score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/greater/governance_score/80');

            const expectedResponse = {
                scoreType: 'governance_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 85,
                        timestamp: '2024-03-12'
                    },
                    {
                        ticker: 'dis',
                        score: 80,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('should return 500 for invalid type', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/greater/invalid_score/80');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Invalid score type. Choose from: total_score, environment_score, social_score, governance_score.' });
        });

        test('should return 500 for invalid score value', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/greater/total_score/-1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Invalid score value, must be greater than or equal to 0.' });
        });

        test('should return 500 for DynamoDB error', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/search/score/greater/total_score/80');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
        });
    });

    describe('Searching scores lesser than the input', () => {
        test('Returning all valid companies within the total score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/lesser/total_score/90');

            const expectedResponse = {
                scoreType: 'total_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 85,
                        timestamp: '2024-03-12'
                    },
                    {
                        ticker: 'dis',
                        score: 82,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('Returning all valid companies within the environmental score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/lesser/environmental_score/79');

            const expectedResponse = {
                scoreType: 'environmental_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 78,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('Returning all valid companies within the social score search range. Return 404 for no companies found.', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/lesser/social_score/85');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No companies found with social_score less than 85.' });
        });

        test('Returning all valid companies within the governance score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/lesser/governance_score/85');

            const expectedResponse = {
                scoreType: 'governance_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 85,
                        timestamp: '2024-03-12'
                    },
                    {
                        ticker: 'dis',
                        score: 80,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('should return 500 for invalid type', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/lesser/invalid_score/80');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Invalid score type. Choose from: total_score, environment_score, social_score, governance_score.' });
        });

        test('should return 500 for invalid score value', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/lesser/total_score/-1');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Invalid score value, must be greater or equal to 0.' });
        });

        test('should return 500 for DynamoDB error', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/search/score/lesser/total_score/80');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
        });
    });

    describe('Searching scores between two inputs', () => {
        test('Returning all valid companies within the total score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/total_score/50/100');

            const expectedResponse = {
                scoreType: 'total_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 85,
                        timestamp: '2024-03-12'
                    },
                    {
                        ticker: 'dis',
                        score: 82,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('Returning all valid companies within the environmental score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/environmental_score/75/79');

            const expectedResponse = {
                scoreType: 'environmental_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 78,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('Returning all valid companies within the social score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/social_score/88/90');

            const expectedResponse = {
                scoreType: 'social_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 90,
                        timestamp: '2024-03-12'
                    },
                    {
                        ticker: 'dis',
                        score: 88,
                        timestamp: '2023-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('Returning all valid companies within the governance score search range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/governance_score/81/85');

            const expectedResponse = {
                scoreType: 'governance_score',
                validCompanies: [
                    {
                        ticker: 'dis',
                        score: 85,
                        timestamp: '2024-03-12'
                    }
                ]
            };

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('should return 404 for no companies found in the score range', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/total_score/30/50');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No companies found with total_score between 30 and 50.' });
        });

        test('should return 500 for invalid type', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/invalid_score/80/90');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Invalid score type. Choose from: total_score, environment_score, social_score, governance_score.' });
        });

        test('should return 500 for negative score value', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/total_score/-1/80');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Invalid score value, must be greater or equal to 0.' });
        });

        test('should return 500 when score1 is greather than score2', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/search/score/total_score/90/80');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Invalid score range, first score must be less than second score.' });
        });

        test('should return 500 for DynamoDB error', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/search/score/total_score/80/90');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
        });
    });
});
