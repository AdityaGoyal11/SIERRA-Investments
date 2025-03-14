import json
import boto3
import pandas as pd
import io
from datetime import datetime
import pytz

def is_valid_row(row):
    # Check if a row has all required scores
    required_fields = ['total_score', 'environment_score', 'social_score', 'governance_score']
    try:
        return all(pd.notna(row[field]) for field in required_fields)
    except KeyError:
        return False

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
        
        # Filter out rows with missing scores
        df = df[df.apply(is_valid_row, axis=1)]
        
        # Get current timestamp for processing date if not in CSV
        current_time = datetime.now(pytz.UTC).isoformat()
        
        # Process each row and write to DynamoDB
        with table.batch_writer() as batch:
            for _, row in df.iterrows():
                try:
                    # Process and format the data
                    item = {
                        'ticker': str(row['ticker']).lower(),
                        'timestamp': str(row['timestamp']),
                        'last_processed_date': str(row.get('last_processing_date', current_time)),
                        'total_score': int(float(row['total_score'])),
                        'environmental_score': int(float(row['environment_score'])),
                        'social_score': int(float(row['social_score'])),
                        'governance_score': int(float(row['governance_score']))
                    }
                    
                    # Write to DynamoDB using batch writer
                    batch.put_item(Item=item)
                    print(f"Processed and stored data for ticker: {item['ticker']}, timestamp: {item['timestamp']}")
                except (KeyError, ValueError) as e:
                    print(f"Error processing row: {row}")
                    print(f"Error details: {str(e)}")
                    continue
        
        processed_count = len(df)
        return {
            'statusCode': 200,
            'body': json.dumps(f'Successfully processed {processed_count} valid rows and stored in DynamoDB')
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error processing data: {str(e)}')
        }
