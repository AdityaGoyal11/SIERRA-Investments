import json
import boto3
import pandas as pd
import io
from datetime import datetime
import pytz

def handler(event, context):
    try:
        # Initialize AWS clients
        s3 = boto3.client('s3')
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('esg_processed')
        
        # Get bucket and key from the S3 event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']
        
        # Get the CSV file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_content))
        
        # Process each row and write to DynamoDB
        with table.batch_writer() as batch:
            for _, row in df.iterrows():
                # Create timestamp in ISO format with timezone
                current_time = datetime.now(pytz.UTC).isoformat()
                
                # Process and format the data
                item = {
                    'ticker': str(row['ticker']),
                    'timestamp': current_time,
                    'name': str(row['name']),
                    'total_score': int(row['total_score']),
                    'environment_score': int(row['environment_score']),
                    'social_score': int(row['social_score']),
                    'governance_score': int(row['governance_score']),
                    'environment_grade': str(row['environment_grade']),
                    'social_grade': str(row['social_grade']),
                    'governance_grade': str(row['governance_grade']),
                    'environment_level': str(row['environment_level']),
                    'social_level': str(row['social_level']),
                    'governance_level': str(row['governance_level'])
                }
                
                # Write to DynamoDB using batch writer
                batch.put_item(Item=item)
                print(f"Processed and stored data for ticker: {item['ticker']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'Successfully processed {len(df)} rows and stored in DynamoDB')
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error processing data: {str(e)}')
        }
