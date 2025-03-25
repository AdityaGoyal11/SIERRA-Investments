const express = require('express');
const AWS = require('aws-sdk');

const app = express();

// Check if we're running locally or in the AWS cloud
const isLocal = process.env.NODE_ENV === 'development';

/** Prediction error: UnknownEndpoint: Inaccessible host: `sierra-bucket-2025.dynamodb-local' at port
 `undefined'. This service may not be available in the `us-east-1' region.*/
// Set up AWS (modify this based on if we're running locally or in AWS)
/**if (isLocal) {
    // If we're running locally, connect to our fake AWS setup
    AWS.config.update({
        region: 'us-east-1',
        // Points to our local DynamoDB
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: {
            // Fake keys for local testing
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });
} else {
    // This is for if we are running in AWS, AWS will use the LabRole automatically
    AWS.config.update({
        region: 'us-east-1'
    });
}*/

if (isLocal) {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'fake-key';
    process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'fake-secret';
}


// Use json in express to handle data
app.use(express.json());

// Import routes
const esgRoutes = require('./routes/esg');
const companySearchRoutes = require('./routes/company-search');
const esgDataRoutes = require('./routes/esg-data');
const levelSearchRoutes = require('./routes/level-search');
const scoreSearchRoutes = require('./routes/score-search');
const predictRoutes = require('./routes/predict');

// Mount routes
app.use('/api/esg', esgRoutes);
app.use('/api/search/company', companySearchRoutes); // Adi's routes
app.use('/api', esgDataRoutes); // John's routes
app.use('/api/search/level', levelSearchRoutes); // Kosar's routes
app.use('/api/search/score', scoreSearchRoutes); // Annie's routes
app.use('/api/predict', predictRoutes);

// Check if server online
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = app;
