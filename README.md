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

### Testing

The app has testing for both DynamoDB and Express routes.

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

### API Endpoints

#### Health check to ensure API working
```
GET /health
Response: { "status": "ok" }
```

#### Get ESG Data by Ticker (see data.csv for ticker)
```
GET /api/esg/:ticker
Response: {
    "ticker": "dis",
    "name": "Disney",
    "total_score": 85,
    "environment_score": 82,
    "social_score": 88,
    "governance_score": 85,
    ...
}
```

### Development Workflow

#### Lambda Function Development
1. Modify the Lambda function in `app/lambda/index.py`
2. Package the function:
   ```bash
   cd app/lambda
   zip -r esg-etl.zip index.py
   ```
3. Deploy using Terraform:
   ```bash
   # Navigate to /infra directory
   cd ../../infra
   terraform apply
   ```

#### Express API Development
1. Modify files in `app/express/src/`
2. Tests with coverage
   ```bash
   npm run test:coverage
   ```

## Docker Usage

### Development Environment
```bash
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
The local environment comes pre-seeded with sample ESG data for:
- Disney (DIS)
- Albemarle Corporation (ALB)

## Next Steps
- Add more test cases for edge cases
- Complete code coverage
- Setup auth endpoints (JWT)?

