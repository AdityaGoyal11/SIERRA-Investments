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
    
def parse_timestamp(ts_str):

    # Parse a timestamp that can be either in full format with time or a simple date.

    try:
        # If the timestamp has a 'T', assume full format with ms and a 'Z'
        if "T" in ts_str:
            # "2025-03-13T06:33:19.812Z"
            dt = datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%S.%fZ")
            # Make it timezone-aware in UTC
            return dt.replace(tzinfo=pytz.UTC)
        else:
            # Otherwise, a simple date format like "1/11/2024" or "2024-01-11"
            try:
                dt = datetime.strptime(ts_str, "%m/%d/%Y")
            except ValueError:
                # "YYYY-MM-DD"
                dt = datetime.strptime(ts_str, "%Y-%m-%d")
            return pytz.UTC.localize(dt)
    except Exception as e:
        print(f"Error parsing timestamp: {ts_str}: {e}")
        raise e
    
def clear_pre_2020_data(table):

    # Scan and delete items with a timestamp before 2020-01-01.

    cutoff_date = datetime(2020, 1, 1, tzinfo=pytz.UTC)
    print(f"Deleting items with timestamp before {cutoff_date.isoformat()}...")
    
    # Scan the table
    scan = {}
    items_to_delete = []
    
    while True:
        response = table.scan(**scan)
        for item in response.get('Items', []):
            try:
                item_timestamp = parse_timestamp(item['timestamp'])

                if item_timestamp < cutoff_date:
                    items_to_delete.append(item)
            except Exception as e:
                print(f"Error parsing timestamp for item {item}: {e}")

        # Check if there are more items to scan
        if 'lastKey' in response:
            scan['startKey'] = response['lastKey']
        else:
            break

    print(f"Found {len(items_to_delete)} items to delete.")

    # Delete the found items
    with table.batch_writer() as batch:
        for item in items_to_delete:

            # primary key is 'ticker' and 'timestamp'
            batch.delete_item(
                Key={
                    'ticker': item['ticker'],
                    'timestamp': item['timestamp']
                }
            )
    print(f"Deleted {len(items_to_delete)} items.")

def rating(total_score):
    """
    Given a total_score, returns the rating:
      0-10  --> 'A'
      10-20 --> 'B'
      20-30 --> 'C'
      30-40 --> 'D'
      40+ --> 'E'
    """

    total_score = float(total_score)
    
    if total_score < 10:
        return 'A'
    elif total_score < 20:
        return 'B'
    elif total_score < 30:
        return 'C'
    elif total_score < 40:
        return 'D'
    else:
        return 'E'

def handler(event, context):
    try:
        # Initialize AWS clients
        s3 = boto3.client('s3')
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('esg_processed')

        # First, clear old data (pre-2020)
        clear_pre_2020_data(table)

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
                        'governance_score': int(float(row['governance_score'])),
                        'rating': rating(row['total_score'])
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
