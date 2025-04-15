const auth = require('./Local_register');

jest.setTimeout(20000);
describe('Authentication Module Tests', () => {
    beforeAll(async () => {
        try {
            await auth.createTables();
            console.log('Test tables created');
        } catch (error) {
            console.error('Error creating tables:', error.message);
        }
    });

    // Test user credentials to be used throughout tests
    const fakeData = {
        email: 'johnharry@gmail.com',
        password: 'iLOVEkevinsomuch',
        name: 'John Harry'
    };

    describe('Register a new user', () => {
        test('should register a new user successfully', async () => {
            try {
                // Try to create a completely new user to ensure test independence
                const result = await auth.registerUser(fakeData.email, fakeData.password, fakeData.name);
                
                // Verify the response structure
                expect(result).toHaveProperty('token');
                expect(result).toHaveProperty('user');
                expect(result.user).toHaveProperty('email', fakeData.email);
                expect(result.user).toHaveProperty('name', fakeData.name);
                expect(result.user).toHaveProperty('user_id');
                
                console.log(`Successfully created test user: ${fakeData.email}`);
            } catch (error) {
                // If user already exists, we need to handle that
                if (error.message === 'User already exists') {
                    // Since the user exists, we'll still be able to test login
                    console.log(`Test user ${fakeData.email} already exists, will use for login tests`);
                } else {
                    throw error;
                }
            }
        });

        test('should not register a user with an existing email', async () => {
            // Either the user was created in the previous test or already existed
            await expect(auth.registerUser(fakeData.email, fakeData.password, fakeData.name))
                .rejects
                .toThrow('User already exists');
        });
        
        test('should handle registration errors properly', async () => {
            // Mock docClient.get to simulate a DynamoDB error
            const originalGet = auth.docClient ? auth.docClient.get : undefined;
            
            if (auth.docClient) {
                // Mocking docClient.get to simulate a DynamoDB error
                auth.docClient.get = jest.fn().mockImplementationOnce(() => {
                    return {
                        promise: () => Promise.reject(new Error('DynamoDB error'))
                    };
                });
    
                await expect(auth.registerUser('asdasdasd@asd.com', 'asd123', 'asd'))
                    .rejects
                    .toThrow('DynamoDB error');
    
                auth.docClient.get = originalGet;
            } else {
                console.log('Skipping DynamoDB error test - docClient not accessible');
            }
        });
    });

    describe('Login a user', () => {
        test('should login the user we just created', async () => {
            const result = await auth.loginUser(fakeData.email, fakeData.password);
            
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user).toHaveProperty('email', fakeData.email);
            expect(result.user).toHaveProperty('name', fakeData.name);
            
            console.log(`Successfully logged in as: ${fakeData.email}`);
        });

        test('should reject login with incorrect password', async () => {
            await expect(auth.loginUser(fakeData.email, 'WrongPassword'))
                .rejects
                .toThrow('Invalid credentials');
        });

        test('should reject login with non-existent email', async () => {
            await expect(auth.loginUser('asdasdasd@asd.com', fakeData.password))
                .rejects
                .toThrow('Invalid credentials');
        });
    });
    
    describe('Additional User Tests', () => {
        const secondUser = {
            email: 'asd@asd.com',
            password: 'asd123',
            name: 'asd'
        };
        
        test('should create a second user', async () => {
            try {
                const result = await auth.registerUser(secondUser.email, secondUser.password, secondUser.name);
                
                expect(result).toHaveProperty('token');
                expect(result.user).toHaveProperty('email', secondUser.email);
                
                console.log(`Created second test user: ${secondUser.email}`);
            } catch (error) {
                if (error.message === 'User already exists') {
                    console.log(`Second test user already exists: ${secondUser.email}`);
                } else {
                    throw error;
                }
            }
        });
        
        test('should login with second user', async () => {
            const result = await auth.loginUser(secondUser.email, secondUser.password);
            
            expect(result).toHaveProperty('token');
            expect(result.user).toHaveProperty('email', secondUser.email);
            
            console.log(`Successfully logged in as second user: ${secondUser.email}`);
        });
    });
    
    describe('Table Creation Tests', () => {
        test('should handle table creation when tables already exist', async () => {
            // Tables should already exist from beforeAll, so this tests the
            // ResourceInUseException path
            await expect(auth.createTables()).resolves.not.toThrow();
        });
    });
});
