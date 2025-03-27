const AWS = require('aws-sdk');

// Set up connection to our local DynamoDB
// (running in Docker container 'dynamodb-local' on port 8000)
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-1',
    // Our local DynamoDB address
    endpoint: 'http://localhost:8000',
    credentials: {
        // Fake key for local testing
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});

// Define how our table should look
const params = {
    // Name of our table
    TableName: 'esg_processed',
    // Pay per request billing mode instead of provisioned throughput
    BillingMode: 'PAY_PER_REQUEST',
    // How we'll look up data
    KeySchema: [
        // Main lookup key (index)
        { AttributeName: 'ticker', KeyType: 'HASH' },
        // Secondary lookup key
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    // environmental_score, social_score, governance_score, dont need to be defined here
    AttributeDefinitions: [
        { AttributeName: 'ticker', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' },
        { AttributeName: 'total_score', AttributeType: 'N' },
        { AttributeName: 'last_processed_date', AttributeType: 'S' },
        { AttributeName: 'rating', AttributeType: 'S' },
        { AttributeName: 'company_name', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        // Searching data using secondary index/attributes which isnt ticker or timestamp
        {
            // Name of this view
            IndexName: 'ScoreIndex',
            // How to organize this view
            KeySchema: [
                { AttributeName: 'total_score', KeyType: 'HASH' },
                { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            // Include all data in this view
            Projection: {
                ProjectionType: 'ALL'
            }
        },
        {
            IndexName: 'DateIndex',
            KeySchema: [
                { AttributeName: 'last_processed_date', KeyType: 'HASH' },
                { AttributeName: 'ticker', KeyType: 'RANGE' }
            ],
            Projection: {
                ProjectionType: 'ALL'
            }
        },
        {
            IndexName: 'RatingIndex',
            KeySchema: [
                { AttributeName: 'rating', KeyType: 'HASH' },
                { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: {
                ProjectionType: 'ALL'
            }
        },
        {
            IndexName: 'CompanyNameIndex',
            KeySchema: [
                { AttributeName: 'company_name', KeyType: 'HASH' },
                { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: {
                ProjectionType: 'ALL'
            }
        }
    ]
};

// Function to create our table
const createTable = async () => {
    try {
        // Try to create the table
        const result = await dynamodb.createTable(params).promise();
        console.log('Table created successfully:', result);
    } catch (error) {
        // If the table already exists, print table already exists
        if (error.code === 'ResourceInUseException') {
            console.log('Table already exists');
        } else {
            // If error, print error
            console.error('Error creating table:', error);
        }
    }
};
createTable();
