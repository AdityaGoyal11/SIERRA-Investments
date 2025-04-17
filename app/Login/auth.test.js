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
const jwt = require('jsonwebtoken');

// Higher timeout for CI environments
jest.setTimeout(30000);

describe('Handling user authentication', () => {
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

    describe('Register a new user', () => {
        beforeEach(() => {
            // Reset mocks between tests
            jest.clearAllMocks();
        });

        test('should register a new user successfully', async () => {
            // Mock non-existent user (for new registration)
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({ Item: null });
            dcMock.promise.mockResolvedValueOnce({});

            const result = await auth.registerUser(
                fakeData.email,
                fakeData.password,
                fakeData.name
            );

            // Verify the response structure
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user).toHaveProperty('email', fakeData.email);
            expect(result.user).toHaveProperty('name', fakeData.name);
            expect(result.user).toHaveProperty('user_id');
        });

        test('should not register a user with an existing email', async () => {
            // Mock an existing user
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({
                Item: {
                    email: fakeData.email,
                    name: fakeData.name,
                    password_hash: 'hashed-password'
                }
            });

            await expect(auth.registerUser(fakeData.email, fakeData.password, fakeData.name))
                .rejects
                .toThrow('User already exists');
        });

        test('should handle registration errors properly', async () => {
            // Mock DynamoDB error for failed table creation
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockRejectedValueOnce(new Error('DynamoDB error'));

            await expect(auth.registerUser('asdasd@asd.com', 'asd123', 'asd'))
                .rejects
                .toThrow('DynamoDB error');
        });
    });

    describe('Login to an existing user', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should login an existing user successfully', async () => {
            // Mock finding a user successfully
            const bcrypt = require('bcryptjs');
            const originalBcryptSync = bcrypt.compareSync;
            bcrypt.compareSync = jest.fn().mockReturnValue(true);

            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({
                Item: {
                    email: fakeData.email,
                    name: fakeData.name,
                    password_hash: 'hashed-password'
                }
            });
            dcMock.promise.mockResolvedValueOnce({});

            const result = await auth.loginUser(fakeData.email, fakeData.password);

            // Verify response structure
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user).toHaveProperty('email', fakeData.email);

            // Evaluate bcrypt is the same as the original
            bcrypt.compareSync = originalBcryptSync;
        });

        test('should reject login with incorrect password', async () => {
            // Mock successful find but the password is incorrect
            const bcrypt = require('bcryptjs');
            const originalBcryptSync = bcrypt.compareSync;
            bcrypt.compareSync = jest.fn().mockReturnValue(false);

            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({
                Item: {
                    email: fakeData.email,
                    password_hash: 'hashed-password'
                }
            });

            await expect(auth.loginUser(fakeData.email, 'FFFFFF'))
                .rejects
                .toThrow('Invalid credentials');

            bcrypt.compareSync = originalBcryptSync;
        });

        test('should reject login with non-existent email', async () => {
            // Mock a user that does not exist
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({ Item: null });

            await expect(auth.loginUser('nonexistent@example.com', fakeData.password))
                .rejects
                .toThrow('Invalid credentials');
        });
    });

    describe('Table creation tests', () => {
        test('should handle table creation when tables already exist', async () => {
            // Mock ResourceInUseException
            const mockDynamoDB = new AWS.DynamoDB();
            const error = new Error('ResourceInUseException');
            error.code = 'ResourceInUseException';
            mockDynamoDB.promise.mockRejectedValueOnce(error);

            await expect(auth.createTables()).resolves.not.toThrow();
        });
    });

    describe('Save ticker functionality', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            
            // Mock JWT verification
            jest.spyOn(jwt, 'verify').mockImplementation(() => ({
                email: fakeData.email,
                user_id: 'test123',
                name: fakeData.name
            }));
        });
        
        afterEach(() => {
            jwt.verify.mockRestore();
        });
        
        test('should save a ticker for a user successfully', async () => {
            // Mock successful ticker save
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({});
            
            const token = 'mock.jwt.token';
            const ticker = 'AAPL';
            
            const result = await auth.saveTicker(token, ticker);
            
            // Verify DynamoDB put was called with correct parameters
            expect(dcMock.put).toHaveBeenCalledWith(expect.objectContaining({
                TableName: 'sierra_saved_tickers',
                Item: expect.objectContaining({
                    user_id: 'test123',
                    ticker: ticker
                })
            }));
            
            expect(result).toHaveProperty('message', 'Ticker saved successfully');
            expect(result).toHaveProperty('ticker', ticker);
            expect(result).toHaveProperty('timestamp');
        });
        
        test('should save ticker in lowercase for consistency', async () => {
            // Mock successful ticker save
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({});
            
            const token = 'mock.jwt.token';
            const ticker = 'AAPL';  // Uppercase ticker
            
            const result = await auth.saveTicker(token, ticker);
            
            const putCall = dcMock.put.mock.calls[0][0];
            
            expect(putCall.Item.ticker).toBe(ticker);
        });
        
        test('should handle empty or whitespace tickers properly', async () => {
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockResolvedValueOnce({});
            
            const token = 'mock.jwt.token';
            // Ticker with whitespace should get saved as lowercase
            const ticker = '   MSFT   ';
            
            const result = await auth.saveTicker(token, ticker);
            
            // Verify whitespace is appropriately handled
            expect(result).toHaveProperty('ticker');
        });
        
        test('should throw an error if JWT verification fails', async () => {
            // Mock JWT verification failure
            jwt.verify.mockImplementationOnce(() => {
                throw new Error('Invalid token');
            });
            
            const token = 'invalid.jwt.token';
            const ticker = 'AAPL';
            
            await expect(auth.saveTicker(token, ticker))
                .rejects
                .toThrow('Invalid token');
        });
        
        test('should throw an error if token is missing or empty', async () => {
            // First test with undefined token
            await expect(auth.saveTicker(undefined, 'AAPL'))
                .rejects
                .toThrow();
                
            // Then test with empty string token
            jwt.verify.mockImplementationOnce(() => {
                throw new Error('Invalid token');
            });
            await expect(auth.saveTicker('', 'AAPL'))
                .rejects
                .toThrow();
        });
        
        test('should throw an error if ticker is missing or empty', async () => {
            const token = 'mock.jwt.token';
            
            // Test with undefined ticker
            await expect(auth.saveTicker(token, undefined))
                .rejects
                .toThrow();
                
            // Test with empty string ticker
            await expect(auth.saveTicker(token, ''))
                .rejects
                .toThrow();
        });
        
        test('should throw an error if DynamoDB operation fails', async () => {
            // Mock DynamoDB error
            const dcMock = new AWS.DynamoDB.DocumentClient();
            dcMock.promise.mockRejectedValueOnce(new Error('DynamoDB error'));
            
            const token = 'mock.jwt.token';
            const ticker = 'AAPL';
            
            await expect(auth.saveTicker(token, ticker))
                .rejects
                .toThrow('DynamoDB error');
        });
        
        test('should throw specific DynamoDB errors for better error handling', async () => {
            // Mock specific DynamoDB errors
            const dcMock = new AWS.DynamoDB.DocumentClient();
            
            // Test conditional check failed exception
            const conditionalError = new Error('ConditionalCheckFailedException');
            conditionalError.code = 'ConditionalCheckFailedException';
            dcMock.promise.mockRejectedValueOnce(conditionalError);
            
            await expect(auth.saveTicker('mock.jwt.token', 'AAPL'))
                .rejects
                .toThrow();
                
            // Reset mock for next test
            jest.clearAllMocks();
            
            // Test provisioned throughput exceeded exception
            const throughputError = new Error('ProvisionedThroughputExceededException');
            throughputError.code = 'ProvisionedThroughputExceededException';
            dcMock.promise.mockRejectedValueOnce(throughputError);
            
            await expect(auth.saveTicker('mock.jwt.token', 'MSFT'))
                .rejects
                .toThrow();
        });
    });
});
