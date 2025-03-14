import boto3
import pytz
from datetime import datetime
from index import clear_pre_2020_data

# Initialize DynamoDB resource (adjust region and endpoint as needed)
dynamodb = boto3.resource('dynamodb', region_name='us-east-1', endpoint_url='http://localhost:8000')
table = dynamodb.Table('esg_processed')

# Call the cleanup function directly (make sure to import or include clear_pre_2020_data definition)
clear_pre_2020_data(table)
