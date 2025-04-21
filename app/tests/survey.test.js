// Mock AWS SDK before importing the module
jest.mock('aws-sdk', () => {
    const mockDocClient = {
        get: jest.fn().mockReturnThis(),
        put: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };

    const mockDynamoDB = {
        createTable: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };

    const aws = {
        config: {
            update: jest.fn()
        }
    };

    aws.DynamoDB = jest.fn(() => mockDynamoDB);
    // We have to mock document client now because
    // We are handling operations like createTable for auth
    aws.DynamoDB.DocumentClient = jest.fn(() => mockDocClient);

    return aws;
});

// Now import the module that uses AWS SDK
const request = require('supertest');
const AWS = require('aws-sdk');
const auth = require('../Login/Local_register');

// Import the app after mocking AWS
const app = require('../express/src/app');

// Higher timeout for CI environments
jest.setTimeout(30000);

describe('Testing Survey Results', () => {
    beforeAll(async () => {
        try {
            // Mock the creation of a successful table
            const mockDynamoDB = new AWS.DynamoDB();
            mockDynamoDB.promise.mockResolvedValue({});

            await auth.createTables();
            console.log('Mock tables created');
        } catch (error) {
            console.error('Error creating tables:', error.message);
        }
    });

    // Test user credentials to use throughout tests
    const fakeData = {
        email: 'johnharry@gmail.com',
        password: 'iLOVEkevinsomuch',
        name: 'John Harry'
    };

    describe('Success tests for answering questionnaire', () => {
        beforeEach(() => {
            // Reset mocks between tests
            jest.clearAllMocks();
        });

        test('Submit one answer correctly', async () => {
            // Mock non-existent user (for new registration)
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({ Item: null });
            dcMock.promise.mockResolvedValueOnce({});

            const result = await auth.registerUser(
                fakeData.email,
                fakeData.password,
                fakeData.name
            );

            const { token, user } = result;
            const questionId = '1';
            const answerId = '2';

            // Mock user registration
            dcMock.promise.mockResolvedValueOnce({
                Item: {
                    user_id: user.user_id,
                    email: fakeData.email
                }
            });

            const response = await request(app)
                .put(`/api/questionnaire/${token}/${questionId}/submitAnswer`)
                .send({ answerId });

            const expected = {
                submittedAnswers: {
                    1: '2'
                }
            };

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(expected);
        });

        test('Update answer correctly', async () => {
            // Mock non-existent user (for new registration)
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({ Item: null });
            dcMock.promise.mockResolvedValueOnce({});

            const result = await auth.registerUser(
                fakeData.email,
                fakeData.password,
                fakeData.name
            );

            const { token, user } = result;
            const questionId = '1';
            const answerId = '3';

            // Mock user registration
            dcMock.promise.mockResolvedValueOnce({
                Item: {
                    user_id: user.user_id,
                    email: fakeData.email,
                    submittedAnswers: {
                        1: '2'
                    }
                }
            });

            const response = await request(app)
                .put(`/api/questionnaire/${token}/${questionId}/submitAnswer`)
                .send({ answerId });

            const expected = {
                submittedAnswers: {
                    1: '3'
                }
            };

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(expected);
        });

        test('All answers submitted correctly', async () => {
            // Mock non-existent user (for new registration)
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({ Item: null });
            dcMock.promise.mockResolvedValueOnce({});

            const result = await auth.registerUser(
                fakeData.email,
                fakeData.password,
                fakeData.name
            );

            const { token, user } = result;

            // Mock user registration
            dcMock.promise.mockResolvedValue({
                Item: {
                    user_id: user.user_id,
                    email: fakeData.email
                }
            });

            let response = await request(app)
                .put(`/api/questionnaire/${token}/1/submitAnswer`)
                .send({ answerId: '1' });

            let expected = {
                submittedAnswers: {
                    1: '1'
                }
            };
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(expected);

            response = await request(app)
                .put(`/api/questionnaire/${token}/2/submitAnswer`)
                .send({ answerId: '2' });

            expected = {
                submittedAnswers: {
                    2: '2'
                }
            };
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(expected);

            response = await request(app)
                .put(`/api/questionnaire/${token}/3/submitAnswer`)
                .send({ answerId: '3' });

            expected = {
                submittedAnswers: {
                    3: '3'
                }
            };
            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual(expected);
        });
    });

    describe('Successly completion questionnaire', () => {
        beforeEach(() => {
            // Reset mocks between tests
            jest.clearAllMocks();
        });

        test('Retrieve submitted answers', async () => {
            // Mock non-existent user (for new registration)
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({ Item: null });
            dcMock.promise.mockResolvedValueOnce({});

            const result = await auth.registerUser(
                fakeData.email,
                fakeData.password,
                fakeData.name
            );

            const { token, user } = result;
            console.log(token);

            // Mock user registration
            dcMock.promise.mockResolvedValueOnce({
                Item: {
                    user_id: user.user_id,
                    email: fakeData.email,
                    submittedAnswers: {
                        1: '2',
                        2: '3',
                        3: '1'
                    }
                }
            });

            // const response = await request(app)
            //     .get(`/api/questionnaire/${token}/completed`);
        });
    });
});
