# SIERRA-Investments

## Project Overview
SIERRA-Investments is a microservice built on AWS for processing ESG (Environmental, Social, Governance) data. The system automatically takes raw ESG data, processes it, and provides an API for querying and visualizing the processed information.

### Key Features
- S3 services for automatic data input
- Serverless data processing with Lambda
- Persistent storage in DynamoDB
- RESTful API endpoints with Express
- Docker containerization for local development
- Test coverage

## Architecture
The application follows a serverless event-driven architecture:
1. **Collection**: Raw ESG data is uploaded to an S3 bucket
2. **Processing**: S3 events trigger a Lambda function that performs ETL on the data
3. **Storage**: Processed data is stored in DynamoDB
4. **API**: Express application provides endpoints to query the processed data

## Setup Instructions

### Prerequisites
- AWS configured with aws credentials setup
- Node.js (version 18+) and npm
- Docker and Docker Compose
- Jest for testing

### Setup the repository

1. Clone the repository:
   ```
   git clone https://github.com/your-username/SIERRA-Investments.git
   cd SIERRA-Investments
   ```

2. Install dependencies:
   ```
   cd app
   npm install
   ```

3. Start the development environment with Docker:
   ```
   # Navigate to the project root first
   cd .. 
   docker-compose up --build
   ```

This will:
- Start a local DynamoDB instance
- Create necessary tables
- Seed (seed/seeding is just populating the local DynamoDB with sample data) sample ESG data
- Start the Express API server

### Setting Up with Existing Infrastructure

If have an existing project where infrastructure is already set up:

1. First, stop any running Docker containers:
   ```
   docker-compose down
   ```

2. Initialize Terraform (but don't apply yet):
   ```
   cd infra
   terraform init
   ```

3. Start the local development environment:
   ```
   cd ..
   docker-compose up --build
   ```

4. Test the local setup:
   ```
   cd app
   npm test
   ```

### Important Notes
- Do NOT run `terraform destroy` unless you want to completely remove all AWS resources
- The local development environment (Docker) is separate from the AWS infrastructure
- You can develop and test locally without affecting the production environment
- If you need to deploy changes to AWS, use `terraform apply` in the `infra` directory

### Testing

There is testing for express routes and DynamoDB

1. Run all tests:
   ```
   cd app
   npm test
   ```

2. Run tests with coverage:
   ```
   npm run test:coverage
   ```

Coverage reports will be generated in the `coverage` directory

### Setting Up Tests with AWS Endpoints

To run tests that work with AWS and DynamoDB, you'll need to set up the environment in the tests (SEE esg.test.js or app.test.js for examples):

1. **Mock AWS SDK**
   ```javascript
   // In your test file
   jest.mock('aws-sdk', () => {
       const mockDynamoDb = {
           query: jest.fn().mockReturnThis(),
           promise: jest.fn()
       };
       return {
           DynamoDB: {
               DocumentClient: jest.fn(() => mockDynamoDb)
           },
           config: {
               update: jest.fn()
           }
       };
   });
   ```

2. **Environment Setup**
   ```javascript
   describe('Your Test Suite', () => {
       let originalEnv;

       beforeEach(() => {
           // Store original environment
           originalEnv = process.env;
           process.env = { ...originalEnv };
           // Clear all mock data
           jest.clearAllMocks();
       });

       afterEach(() => {
           // Restore original environment
           process.env = originalEnv;
       });
   });
   ```

3. **Mock DynamoDB Responses**
   ```javascript
   test('your test case', async () => {
       const mockResponse = {
           Items: [{
               ticker: 'dis',
               name: 'Walt Disney Co',
               // ... other fields
           }]
       };

       const dynamoDb = new AWS.DynamoDB.DocumentClient();
       dynamoDb.promise.mockResolvedValue(mockResponse);

       // Your test code here
   });
   ```

4. **Testing Different Environments**
   - For local development:
     ```javascript
     process.env.NODE_ENV = 'development';
     process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
     process.env.AWS_ACCESS_KEY_ID = 'local';
     process.env.AWS_SECRET_ACCESS_KEY = 'local';
     ```
   - For production:
     ```javascript
     process.env.NODE_ENV = 'production';
     ```

Remember to:
- Mock AWS SDK before importing app
- Reset environment variables after each test
- Provide mock responses for DynamoDB queries

### Development Workflow

#### Lambda Function Development
1. Modify the Lambda function in `app/lambda/index.py`
2. Package the function:
   ```
   cd app/lambda
   zip -r esg-etl.zip index.py
   ```
3. Deploy using Terraform:
   ```
   # Navigate to /infra directory
   cd ../../infra
   terraform apply
   ```

#### Express API Development
1. Modify files in `app/express/src/`
2. Tests with coverage
   ```
   npm run test:coverage
   ```

## Docker Usage

### Development Environment
```
# Start the program
docker-compose up --build

# Stop services
docker-compose down
```

### Local Testing
The test suite is configured to work with the local DynamoDB instance:
- Tests run outside Docker container
- Connects to DynamoDB on localhost:8000
- Includes API endpoint tests
- Verifies data processing and storage

## Infrastructure

### DynamoDB Schema
- Primary Key: `ticker` (String)
- Sort Key: `timestamp` (String)
- Secondary Indexes (GSI): ScoreIndex
  - Primary Key: `total_score` (Number)
  - Sort Key: `timestamp` (String)

### Sample Data
The local environment comes sample ESG data for S&P 500 companies with ESG values from 2014-CURRENT.
- Data is automatically seeded from local csv file

## Next Steps
- Add more test cases for edge cases
- Complete code coverage
- Setup auth endpoints (JWT)?

