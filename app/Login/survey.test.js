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
const AWS = require('aws-sdk');
const auth = require('./Local_register');

// Import the app after mocking AWS

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

            // Mock user registration
            dcMock.promise.mockResolvedValueOnce({
                Item: {
                    user_id: user.user_id,
                    email: fakeData.email
                }
            });

            const response = await auth.questionnaireComplete(
                token,
                '2',
                '3'
            );

            expect(response).toHaveProperty('recommendedTickers');
        });
    });
});
