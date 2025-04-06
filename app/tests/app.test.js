const request = require('supertest');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDynamoDb = {
        query: jest.fn().mockReturnThis(),
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

        test('should return historical ESG data for valid ticker', async () => {
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

            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/esg/dis');

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.ticker).toBe('dis');
            expect(response.body.historical_ratings).toHaveLength(2);
            expect(response.body.historical_ratings[0].timestamp).toBe('2024-03-12');
            expect(response.body.historical_ratings[1].timestamp).toBe('2023-03-12');
        });

        test('should return 404 for non-existent ticker', async () => {
            const mockResponse = {
                Items: []
            };

            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/esg/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No ESG data found for ticker: nonexistent' });
        });

        test('should return 500 for DynamoDB error', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/esg/dis');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
        });

        test('should return all ESG data', async () => {
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
                    },
                    {
                        ticker: 'aapl',
                        timestamp: '2024-04-11',
                        last_processed_date: '2024-04-11',
                        total_score: 85,
                        environmental_score: 77,
                        social_score: 92,
                        governance_score: 80
                    },
                    {
                        ticker: 'aapl',
                        timestamp: '2023-04-11',
                        last_processed_date: '2023-04-11',
                        total_score: 70,
                        environmental_score: 56,
                        social_score: 80,
                        governance_score: 75
                    },
                    {
                        ticker: 'aapl',
                        timestamp: '2022-05-19',
                        last_processed_date: '2022-05-19',
                        total_score: 49,
                        environmental_score: 60,
                        social_score: 40,
                        governance_score: 30
                    },
                    {
                        ticker: 'mcd',
                        timestamp: '2023-12-09',
                        last_processed_date: '2023-12-09',
                        total_score: 80,
                        environmental_score: 81,
                        social_score: 79,
                        governance_score: 80
                    },
                    {
                        ticker: 'mcd',
                        timestamp: '2022-05-07',
                        last_processed_date: '2022-05-07',
                        total_score: 52,
                        environmental_score: 40,
                        social_score: 33,
                        governance_score: 60
                    },
                    {
                        ticker: 'xom',
                        timestamp: '2022-08-13',
                        last_processed_date: '2022-08-13',
                        total_score: 42,
                        environmental_score: 60,
                        social_score: 90,
                        governance_score: 10
                    },
                    {
                        ticker: 'xom',
                        timestamp: '2023-04-11',
                        last_processed_date: '2023-04-11',
                        total_score: 69,
                        environmental_score: 70,
                        social_score: 68,
                        governance_score: 70
                    },
                    {
                        ticker: 'xom',
                        timestamp: '2022-05-19',
                        last_processed_date: '2022-05-19',
                        total_score: 50,
                        environmental_score: 25,
                        social_score: 75,
                        governance_score: 55
                    }
                ]
            };

            const expectedResponse = {
                data: [
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
                    },
                    {
                        ticker: 'aapl',
                        timestamp: '2024-04-11',
                        last_processed_date: '2024-04-11',
                        total_score: 85,
                        environmental_score: 77,
                        social_score: 92,
                        governance_score: 80
                    },
                    {
                        ticker: 'aapl',
                        timestamp: '2023-04-11',
                        last_processed_date: '2023-04-11',
                        total_score: 70,
                        environmental_score: 56,
                        social_score: 80,
                        governance_score: 75
                    },
                    {
                        ticker: 'aapl',
                        timestamp: '2022-05-19',
                        last_processed_date: '2022-05-19',
                        total_score: 49,
                        environmental_score: 60,
                        social_score: 40,
                        governance_score: 30
                    },
                    {
                        ticker: 'mcd',
                        timestamp: '2023-12-09',
                        last_processed_date: '2023-12-09',
                        total_score: 80,
                        environmental_score: 81,
                        social_score: 79,
                        governance_score: 80
                    },
                    {
                        ticker: 'mcd',
                        timestamp: '2022-05-07',
                        last_processed_date: '2022-05-07',
                        total_score: 52,
                        environmental_score: 40,
                        social_score: 33,
                        governance_score: 60
                    },
                    {
                        ticker: 'xom',
                        timestamp: '2022-08-13',
                        last_processed_date: '2022-08-13',
                        total_score: 42,
                        environmental_score: 60,
                        social_score: 90,
                        governance_score: 10
                    },
                    {
                        ticker: 'xom',
                        timestamp: '2023-04-11',
                        last_processed_date: '2023-04-11',
                        total_score: 69,
                        environmental_score: 70,
                        social_score: 68,
                        governance_score: 70
                    },
                    {
                        ticker: 'xom',
                        timestamp: '2022-05-19',
                        last_processed_date: '2022-05-19',
                        total_score: 50,
                        environmental_score: 25,
                        social_score: 75,
                        governance_score: 55
                    }
                ],
                message: 'All ESG data retrieved successfully'
            };

            const dynamoDb = new AWS.DynamoDB.DocumentClient();

            dynamoDb.promise.mockResolvedValue(mockResponse);
            const response = await request(app).get('/api/all');

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toBeInstanceOf(Object);
            expect(response.body).toStrictEqual(expectedResponse);
        });

        test('should return 404 for non-existent ticker', async () => {
            const mockResponse = {
                Items: []
            };

            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            dynamoDb.promise.mockResolvedValue(mockResponse);

            const response = await request(app).get('/api/all');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'No ESG data found' });
        });

        test('should return 500 for DynamoDB error when fetching all ESG data', async () => {
            const dynamoDb = new AWS.DynamoDB.DocumentClient();
            const error = new Error('DynamoDB error');
            dynamoDb.promise.mockRejectedValue(error);

            const response = await request(app).get('/api/all');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
        });
    });

    describe('Testing api/v2/esg/recent/:ticker Routes', () => {
        test('should return most recent ESG data', async () => {
            const mockResponse = {
                Items: [
                    {
                        ticker: 'dis',
                        timestamp: '2023-03-12',
                        last_processed_date: '2023-03-12',
                        total_score: 82,
                        environmental_score: 78,
                        social_score: 88,
                        governance_score: 80
                    },
                    {
                        ticker: 'dis',
                        timestamp: '2024-03-12',
                        last_processed_date: '2024-03-12',
                        total_score: 85,
                        environmental_score: 80,
                        social_score: 90,
                        governance_score: 85
                    }
                ]
            };

            const expectedResponse = {
                ticker: 'dis',
                timestamp: '2024-03-12',
                last_processed_date: '2024-03-12',
                total_score: 85,
                environmental_score: 80,
                social_score: 90,
                governance_score: 85
            };

            const dynamoDb = new AWS.DynamoDB.DocumentClient();

            dynamoDb.promise.mockResolvedValue(mockResponse);
            const response = await request(app).get('/api/v2/esg/recent/dis');

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body).toStrictEqual(expectedResponse);
        });
    });

    test('should return 404 for non-existent ticker', async () => {
        const mockResponse = {
            Items: []
        };

        const dynamoDb = new AWS.DynamoDB.DocumentClient();
        dynamoDb.promise.mockResolvedValue(mockResponse);

        const response = await request(app).get('/api/v2/esg/recent/nonexistent');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'No ESG data found for ticker: nonexistent' });
    });

    test('should return 500 for DynamoDB error when fetching all ESG data', async () => {
        const dynamoDb = new AWS.DynamoDB.DocumentClient();
        const error = new Error('DynamoDB error');
        dynamoDb.promise.mockRejectedValue(error);

        const response = await request(app).get('/api/v2/esg/recent/dis');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Error fetching ESG data', error: error.message });
    });
});
