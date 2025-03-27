#!/bin/bash

# Set environment to local, no need to update AWS data anymore hopefully
ENV="development"
export NODE_ENV=$ENV

echo "Updating dynamodb data in local environment"

echo "Initializing DynamoDB table"
node init-dynamodb.js

echo "Processing new csv data"
python3 process_csv.py

echo "Clearing existing DynamoDB data"
python3 clear_dynamodb.py

echo "Seeding DynamoDB with processed data"
python3 seed_dynamodb.py