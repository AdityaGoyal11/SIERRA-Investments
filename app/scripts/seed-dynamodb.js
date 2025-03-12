// Get AWS tools
const AWS = require('aws-sdk');

// Set up connection to our local DynamoDB (but this time for adding data)
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-1',
    endpoint: 'http://dynamodb-local:8000',
    credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});

// Our test data (exact same as data.csv and the processed data in DynamoDB)
const sampleData = [
    {
        ticker: 'dis',
        timestamp: new Date().toISOString(),
        name: 'Walt Disney Co',
        total_level: 'High',
        total_score: 1147,
        environment_score: 510,
        social_score: 316,
        governance_score: 321,
        environment_grade: 'A',
        social_grade: 'BB',
        governance_grade: 'BB',
        environment_level: 'High',
        social_level: 'Medium',
        governance_level: 'Medium'
    },
    {
        ticker: 'aapl',
        timestamp: new Date().toISOString(),
        name: 'Apple Inc',
        total_level: 'Medium',
        total_score: 891,
        environment_score: 355,
        social_score: 281,
        governance_score: 255,
        environment_grade: 'BB',
        social_grade: 'B',
        governance_grade: 'B',
        environment_level: 'Medium',
        social_level: 'Medium',
        governance_level: 'Medium'
    },
    {
        ticker: 'gm',
        timestamp: new Date().toISOString(),
        name: 'General Motors Co',
        total_level: 'High',
        total_score: 1068,
        environment_score: 510,
        social_score: 303,
        governance_score: 255,
        environment_grade: 'A',
        social_grade: 'BB',
        governance_grade: 'B',
        environment_level: 'High',
        social_level: 'Medium',
        governance_level: 'Medium'
    },
    {
        ticker: 'gww',
        timestamp: new Date().toISOString(),
        name: 'WW Grainger Inc',
        total_level: 'Medium',
        total_score: 880,
        environment_score: 255,
        social_score: 385,
        governance_score: 240,
        environment_grade: 'B',
        social_grade: 'BB',
        governance_grade: 'B',
        environment_level: 'Medium',
        social_level: 'Medium',
        governance_level: 'Medium'
    },
    {
        ticker: 'mhk',
        timestamp: new Date().toISOString(),
        name: 'Mohawk Industries Inc',
        total_level: 'High',
        total_score: 1171,
        environment_score: 570,
        social_score: 298,
        governance_score: 303,
        environment_grade: 'A',
        social_grade: 'B',
        governance_grade: 'BB',
        environment_level: 'High',
        social_level: 'Medium',
        governance_level: 'Medium'
    }
];

// Function to add our sample data to the local DynamoDB database
const seedData = async () => {
    console.log('Starting to add sample data...');

    // Go through each company in our sample data
    for (const item of sampleData) {
        const params = {
            // Our table name
            TableName: 'esg_processed',
            // The company data to add
            Item: item
        };

        try {
            // Try to add this company's data
            await dynamodb.put(params).promise();
            console.log(`Added data for ${item.ticker}`);
        } catch (error) {
            // If error, print error message for that company
            console.error(`Error adding data for ${item.ticker}:`, error);
        }
    }

    console.log('Finished adding sample data');
};

seedData();
