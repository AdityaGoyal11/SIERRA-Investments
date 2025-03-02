# SIERRA-Investments

## Project Overview
SIERRA-Investments is a microservice built on AWS for processing ESG (Environmental, Social, Governance) data. The system automatically ingests raw ESG data, processes it, and provides an API for querying and visualizing the processed information.

### Key Features
- S3 services for automatic data input
- Serverless data processing with Lambda
- Persistent storage in DynamoDB
- RESTful API endpoints with Express

## Architecture
The application follows a serverless event-driven architecture:
1. **Collection**: Raw ESG data is uploaded to an S3 bucket
2. **Retrieval**: S3 events trigger a Lambda function that performs ETL on the data
3. **Processing**: Processed data is stored in DynamoDB
4. **API**: Express application provides endpoints to query the processed data

## Setup Instructions

### Prerequisites
- AWS configured with aws credentials setup (have to go through this together)
- Node.js (version 18+) and npm
- Terraform

### Initial development setup

1. Install dependencies:
   ```
   cd app
   npm install
   ```

2. Run the Express API locally:
   ```
   npm run dev
   ```

### Deploying Terraform infrastructure
1. Initialize Terraform:
   ```
   cd infra
   terraform init
   ```

2. Preview the infrastructure changes:
   ```
   terraform plan
   ```

3. Apply the infrastructure:
   ```
   terraform apply
   ```

## Development Workflow

### Lambda Function Development
1. Modify the Lambda function in `app/lambda/index.js`
2. Test locally using the AWS SAM CLI or by running Jest tests (when added)
3. Package the function for deployment:
   ```
   cd app/lambda
   zip -r esg-etl.zip index.js node_modules
   ```
4. Deploy using Terraform:
   ```
   cd ../../infra
   terraform apply
   ```

### Express API Development
1. Modify the Express application in `app/express/src/`
2. Test locally using:
   ```
   cd app
   npm run dev
   ```
3. Add new endpoints in `app/express/src/app.js`

## Next Steps
- Add lambda function to process ESG data
- Add lambda function testing
- Add ESLint for code quality
- Set up Jest for testing
- Implement CI/CD with GitHub Actions, automate eslint and jest for each merge request
- Develop the ESG data processing logic
- Implement Express API with more endpoints
- Add analytical model?
