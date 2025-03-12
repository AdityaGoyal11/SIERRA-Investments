const AWS = require('aws-sdk');

// Set up connection to our local DynamoDB
// (running in Docker container 'dynamodb-local' on port 8000)
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-1',
    // Our local DynamoDB address
    endpoint: 'http://dynamodb-local:8000',
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
    // How we'll look up data
    KeySchema: [
        // Main lookup key (index)
        { AttributeName: 'ticker', KeyType: 'HASH' },
        // Secondary lookup key
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
        // Define our columns
        // ticker is a string
        { AttributeName: 'ticker', AttributeType: 'S' },
        // timestamp is a string
        { AttributeName: 'timestamp', AttributeType: 'S' },
        // total_score is a number
        { AttributeName: 'total_score', AttributeType: 'N' }
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
            },
            // How much power this view needs
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    // How much power the main table needs
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
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
