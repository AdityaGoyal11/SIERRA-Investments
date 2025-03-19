// Get AWS tools
const AWS = require('aws-sdk');
const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');

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
const isValidRow = (record) => {
    const requiredFields = ['total_score', 'environment_score', 'social_score', 'governance_score'];
    return requiredFields.every((field) => record[field] && record[field].trim() !== '');
};

// Function to read and parse the CSV file
const readHistoricalData = () => {
    try {
        const scriptDir = path.dirname(__filename);
        const appDir = path.dirname(scriptDir);
        const csvPath = path.join(appDir, 'processed_data', 'processed_historical_esg_data.csv');

        if (!fs.existsSync(csvPath)) {
            throw new Error(`CSV file not found at ${csvPath}`);
        }

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
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
const transformData = (records) => records
    .filter(isValidRow)
    .map((record) => ({
        ticker: record.ticker?.toLowerCase(),
        timestamp: record.timestamp,
        last_processed_date: record.last_processing_date,
        total_score: parseInt(record.total_score, 10),
        environmental_score: parseInt(record.environment_score, 10),
        social_score: parseInt(record.social_score, 10),
        governance_score: parseInt(record.governance_score, 10),
        rating: record.rating
    }));

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
