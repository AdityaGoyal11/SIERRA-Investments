import boto3
import pytz
from datetime import datetime
from index import clear_pre_2020_data

dynamodb = boto3.resource('dynamodb', region_name='us-east-1', endpoint_url='http://localhost:8000')
table = dynamodb.Table('esg_processed')

clear_pre_2020_data(table)
