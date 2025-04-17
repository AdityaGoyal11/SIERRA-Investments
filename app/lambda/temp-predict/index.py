import json
import boto3
import pandas as pd
import io
from datetime import datetime
import pytz
from dateutil import parser

sagemaker = boto3.client("sagemaker-runtime", region_name="us-east-1")

def is_valid_row(row):
    # Check if a row has all required scores
    required_fields = ['total_score', 'environment_score', 'social_score', 'governance_score', 'company_name']
    try:
        return all(pd.notna(row[field]) for field in required_fields)
    except KeyError:
        return False
    
def format_timestamp(ts):
    if not ts:
        return datetime.now().strftime('%Y-%m-%d')  # Default if missing
    try:
        return parser.parse(str(ts)).strftime('%Y-%m-%d')
    except Exception as e:
        print(f"Warning: Invalid timestamp {ts}, defaulting to current date.")
        return datetime.now().strftime('%Y-%m-%d')
    
def rating(total_score):

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
    
lambda_client = boto3.client("lambda")

def invoke_lambda_again(bucket, key):
    # Triggers Lambda for remaining data
    payload = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": bucket},
                    "object": {"key": key}
                }
            }
        ]
    }
    response = lambda_client.invoke(
        FunctionName="esg-etl-lambda",
        InvocationType="Event",  # Runs asynchronously
        Payload=json.dumps(payload)
    )
    print("Lambda invoked again:", response)

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
        if 'LastEvaluatedKey' in response:
            scan['ExclusiveStartKey'] = response['LastEvaluatedKey']

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

def handle_prediction(event):
    try:
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            "body": json.dumps({
                "message": "Prediction functionality disabled to not incur charges.",
                "status": "unavailable"
            })
        }

    except Exception as e:
        print("Prediction error:", e)
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
            },
            "body": json.dumps({"error": str(e)})
        }

def handler(event, context):
    try:
        print("Full incoming event:")
        print(json.dumps(event, indent=2))

        #route = event.get("rawPath", "")
        route = event.get("rawPath") or event.get("path") or event.get("requestContext", {}).get("resourcePath", "")
        print("rawPath:", route)

        # If it's an API Gateway request
        if "/api/predict" in route:
            return handle_prediction(event)
        elif "Records" in event:
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
        
            # Filter out rows with missing scores and pre-2020 data
            df = df[df.apply(is_valid_row, axis=1)]
            df['timestamp'] = df['timestamp'].apply(format_timestamp)
            df = df[df['timestamp'] >= "2020-01-01"]
        
            # Get current timestamp for processing date if not in CSV
            current_time = datetime.now(pytz.UTC).isoformat()

            # Process data in batches
            batch_size = 500  # Limit to 500 items per Lambda execution
            total_rows = len(df)
            print(f"Processing {total_rows} rows...")
        
            for start in range(0, total_rows, batch_size):
                batch_df = df.iloc[start:start + batch_size]
                # Process each row and write to DynamoDB
                with table.batch_writer() as batch:
                    for _, row in batch_df.iterrows():
                        try:
                            # Process and format the data

                            # zero if missing
                            total_score = float(row.get('total_score', 0)) 
                    
                            item = {
                                'ticker': str(row['ticker']).lower(),
                                'timestamp': format_timestamp(row['timestamp']),
                                'last_processed_date': str(row.get('last_processing_date', current_time)),
                                'total_score': int(total_score),
                                'environmental_score': int(float(row['environment_score'])),
                                'social_score': int(float(row['social_score'])),
                                'governance_score': int(float(row['governance_score'])),
                                'rating': rating(total_score),
                                'company_name': str(row['company_name'])
                            }
                    
                            # Write to DynamoDB using batch writer
                            batch.put_item(Item=item)
                            print(f"Processed and stored data for ticker: {item['ticker']}, timestamp: {item['timestamp']}")
                        except (KeyError, ValueError) as e:
                            print(f"Error processing row: {row}")
                            print(f"Error details: {str(e)}")
                            continue

            print(f"Processed and stored {len(batch_df)} rows.")

            # If more data remains, re-trigger Lambda for the next batch
            if start + batch_size < total_rows:
                invoke_lambda_again(bucket, key)

            #route = event.get("rawPath", "")

            processed_count = len(df)
            return {
                'statusCode': 200,
                'body': json.dumps(f'Successfully processed {processed_count} valid rows and stored in DynamoDB')
            }
        else:
            return{
                'statusCode': 404,
                'body': json.dumps(f'error: Unknown route:{route}')
            }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error processing data: {str(e)}')
        }
