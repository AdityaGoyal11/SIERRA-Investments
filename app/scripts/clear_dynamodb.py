import boto3
from boto3.dynamodb.conditions import Key
import time
import os

def clear_dynamodb():
    # Check if we're running locally
    is_local = os.getenv('NODE_ENV') == 'development'
    
    if is_local:
        # Connect to local DynamoDB
        dynamodb = boto3.resource('dynamodb',
            endpoint_url='http://localhost:8000',
            region_name='us-east-1',
            aws_access_key_id='local',
            aws_secret_access_key='local'
        )
    else:
        # Connect to AWS DynamoDB
        dynamodb = boto3.resource('dynamodb')
    
    table = dynamodb.Table('esg_processed')
    
    try:
        scan = table.scan()
        
        with table.batch_writer() as batch:
            count = 0
            while True:
                for item in scan['Items']:
                    batch.delete_item(
                        Key={
                            'ticker': item['ticker'],
                            'timestamp': item['timestamp']
                        }
                    )
                    count += 1
                    print(f"Deleted {count} items...")
                
                # handle dynamodb pagination since each batch can only contain a fixed number of items
                if 'LastEvaluatedKey' in scan:
                    scan = table.scan(ExclusiveStartKey=scan['LastEvaluatedKey'])
                else:
                    break
                
                # add a small delay to avoid throttling
                time.sleep(0.1)
        
        print(f"Deleted {count} items from DynamoDB")
        
    except Exception as e:
        print(f"Error clearing DynamoDB: {str(e)}")

if __name__ == "__main__":
    clear_dynamodb() 