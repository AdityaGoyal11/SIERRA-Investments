# SIERRA-Investments

## Project Overview
SIERRA-Investments is a microservice built on AWS for processing ESG (Environmental, Social, Governance) data. The system automatically ingests raw ESG data, processes it, and provides an API for querying and visualizing the processed information.

### Key Features
- S3 services for automatic data input
- Serverless data processing with Lambda
- Persistent storage in DynamoDB
- RESTful API endpoints with Express
- Docker containerization for local development

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
- Docker and Docker Compose

### Initial development setup

#### Option 1: Local Setup
1. Install dependencies:
   ```
   cd app
   npm install
   ```

2. Run the Express API locally:
   ```
   npm run dev
   ```

#### Option 2: Docker Setup
1. From the project root directory (`SIERRA-Investments`), build and start the containers:
   ```
   docker-compose up --build
   ```

2. The API will be available at http://localhost:3000

### Deploying Terraform infrastructure

The ECS infrastructure is managed using Terraform and includes:
- ECS Cluster
- ECS Task Definition
- ECS Service
- ECR Repository
- CloudWatch Log Group

#### For new setup
1. Clone the repository
2. Navigate to the infrastructure directory:
   ```
   cd SIERRA-Investments/infra
   ```
3. Initialize Terraform (this will use the shared state in S3):
   ```
   terraform init
   ```
4. Review the planned changes:
   ```
   terraform plan
   ```
5. Apply the infrastructure:
   ```
   terraform apply
   ```

#### For existing setup (previously did the terraform init, plan and apply with old .tf setup)
1. Navigate to the infrastructure directory:
   ```
   cd SIERRA-Investments/infra
   ```
2. Destroy existing local state and resources:
   ```
   terraform destroy -auto-approve
   ```
3. Initialize Terraform with the new shared state (THE -migrate-state OPTION TELLS TERRAFORM TO MOVE FROM LOCAL STATE TO S3 STATE):
   ```
   terraform init -migrate-state
   ```
4. Review the planned changes:
   ```
   terraform plan
   ```
5. Apply the infrastructure:
   ```
   terraform apply
   ```

The Terraform state is stored in a shared S3 bucket (`sierra-terraform-state-249414161180`). 
This ensures all team members are working with the same infrastructure state.


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
2. Test locally using either:
   - Local setup: `npm run dev`
   - Docker setup: `docker-compose up`
3. Add new endpoints in `app/express/src/app.js`

## Docker Commands
- Build containers: `docker-compose build`
- Start containers: `docker-compose up`
- Stop containers: `docker-compose down`
- View logs: `docker-compose logs -f`
- Rebuild and restart: `docker-compose up --build`

## Docker Usage

### When to Use Docker

Docker should be used in the following scenarios:

1. **Local Development**
   - Testing the API in a containerized environment
   - Ensuring code works in a production-like environment
   - Avoiding "it works on my machine" problems

2. **Pre-deployment Testing**
   - Testing Docker images locally before pushing to ECR
   - Verifying production Dockerfile configuration

### Docker Workflows

#### During Development
```
# From the project root directory (SIERRA-Investments)
docker-compose up --build

# If you make changes to the code
docker-compose up --build  # Rebuilds and restarts with changes

# To stop the containers
docker-compose down
```

#### Before Deploying to ECS
```
# From the app directory
cd app
docker build -t sierra-api:latest -f Dockerfile.prod .

# Test the production image locally
docker run -p 3000:3000 sierra-api:latest
```

#### When Deploying to ECS
```
# Push to ECR (this is also handled by GitHub Actions)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
docker tag sierra-api:latest $ECR_REPOSITORY_URI:latest
docker push $ECR_REPOSITORY_URI:latest
```

### Benefits of Using Docker
- Consistent development environment
- Easy testing of production-like conditions
- Simple deployment to ECS
- Isolation of dependencies

## Next Steps
- Add lambda function to process ESG data
- Add lambda function testing
- Add ESLint for code quality
- Set up Jest for testing
- Implement CI/CD with GitHub Actions, automate eslint and jest for each merge request
- Develop the ESG data processing logic
- Implement Express API with more endpoints
- Add analytical model?

## Deployment

### Manual Deployment

To deploy your application to ECS:

1. Build the Docker image:
```
cd app
docker build -t sierra-api:latest -f Dockerfile.prod .
```

2. Push to Amazon ECR:
```
# Get the ECR repository URI
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
docker tag sierra-api:latest $ECR_REPOSITORY_URI:latest
docker push $ECR_REPOSITORY_URI:latest
```

3. Update the ECS service:
```
aws ecs update-service --cluster sierra-cluster --service sierra-api --force-new-deployment
```