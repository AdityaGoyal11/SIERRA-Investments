const AWS = require('aws-sdk');

// Configure AWS SDK for local DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-1',
    // Note: Using localhost instead of dynamodb-local since test runs outside Docker
    endpoint: 'http://localhost:8000',
    credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});

describe('ESG Data Tests', () => {
    // TODO: Implement tests for:
    // 1. DynamoDB queries
    // 2. API endpoints
    // 3. Data validation
    // 4. Error handling

    test('Placeholder test', () => {
        expect(true).toBe(true);
    });

    // DynamoDB Tests
    describe('DynamoDB Operations', () => {
        test('Disney (DIS) should have governance score of 85', async () => {
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'dis'
                }
            };

            try {
                const data = await dynamodb.query(params).promise();
                expect(data.Items).toBeDefined();
                expect(data.Items.length).toBeGreaterThan(0);
                expect(data.Items[0].governance_score).toBe(85);
            } catch (error) {
                console.error('Error querying DynamoDB:', error);
                throw error;
            }
        });

        test('Disney (DIS) should have correct ESG metrics', async () => {
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'dis'
                }
            };

            try {
                const data = await dynamodb.query(params).promise();
                const disney = data.Items[0];

                expect(disney).toMatchObject({
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
            } catch (error) {
                console.error('Error querying DynamoDB:', error);
                throw error;
            }
        });

        test('Non-existent ticker should return empty Items array', async () => {
            const params = {
                TableName: 'esg_processed',
                KeyConditionExpression: 'ticker = :ticker',
                ExpressionAttributeValues: {
                    ':ticker': 'NONEXISTENT'
                }
            };

            const data = await dynamodb.query(params).promise();
            expect(data.Items).toHaveLength(0);
        });
    });

    // TODO: API Endpoint Tests
});
