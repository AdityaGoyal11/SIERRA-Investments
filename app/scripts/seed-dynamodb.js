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
        // Disney's stock symbol
        ticker: 'dis',
        // Current time
        timestamp: new Date().toISOString(),
        name: 'Disney',
        // Overall ESG score
        total_score: 85,
        // How well they treat the planet
        environment_score: 82,
        // How well they treat people
        social_score: 88,
        // How well they run the company
        governance_score: 85,
        // Letter grade for environment
        environment_grade: 'A',
        // Letter grade for social
        social_grade: 'A+',
        // Letter grade for governance
        governance_grade: 'A',
        // Their environmental ranking
        environment_level: 'Leader',
        // Their social ranking
        social_level: 'Leader',
        // Their governance ranking
        governance_level: 'Leader'
    },
    {
        // Albemarle stock symbol
        ticker: 'alb',
        timestamp: new Date().toISOString(),
        name: 'Albemarle Corporation',
        total_score: 78,
        environment_score: 75,
        social_score: 80,
        governance_score: 79,
        environment_grade: 'B+',
        social_grade: 'A-',
        governance_grade: 'B+',
        environment_level: 'Advanced',
        social_level: 'Leader',
        governance_level: 'Advanced'
    }
];

// Function to add our sample data to the database
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
