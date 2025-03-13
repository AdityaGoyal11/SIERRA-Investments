// Get AWS tools
const AWS = require('aws-sdk');
const fs = require('fs');
const csv = require('csv-parse/sync');

// Set up connection to our local DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-1',
    endpoint: 'http://dynamodb-local:8000',
    credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});

// Function to check if a row has all required scores
const is_valid_row = (record) => {
    const required_fields = ['total_score', 'environment_score', 'social_score', 'governance_score'];
    return required_fields.every(field => record[field] && record[field].trim() !== '');
};

// Function to read and parse the CSV file
const readHistoricalData = () => {
    try {
        const fileContent = fs.readFileSync('./data/historical_esg_data.csv', 'utf-8');
        const records = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });
        return records;
    } catch (error) {
        console.error('Error reading historical data:', error);
        throw error;
    }
};

// Function to transform the data to match our schema
const transformData = (records) => {
    return records
        .filter(is_valid_row)
        .map(record => ({
            ticker: record.ticker?.toLowerCase(),
            timestamp: record.timestamp,
            last_processed_date: record.last_processing_date,
            total_score: parseInt(record.total_score),
            environmental_score: parseInt(record.environment_score),
            social_score: parseInt(record.social_score),
            governance_score: parseInt(record.governance_score)
        }));
};

// Function to add our historical data to the local DynamoDB database
const seedData = async () => {
    console.log('Starting to add historical ESG data...');

    try {
        // Read and transform the data
        const rawData = readHistoricalData();
        const transformedData = transformData(rawData);

        console.log(`Found ${rawData.length} total rows, ${transformedData.length} valid rows`);

        // Go through each company in our historical data
        for (const item of transformedData) {
            const params = {
                TableName: 'esg_processed',
                Item: item
            };

            try {
                // Try to add this company's data
                await dynamodb.put(params).promise();
                console.log(`Added data for ${item.ticker}, timestamp: ${item.timestamp}`);
            } catch (error) {
                // If error, print error message for that company
                console.error(`Error adding data for ${item.ticker}, timestamp: ${item.timestamp}:`, error);
            }
        }

        console.log('Finished adding historical ESG data');
    } catch (error) {
        console.error('Error during seeding process:', error);
        process.exit(1);
    }
};

seedData();
