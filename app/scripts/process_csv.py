import pandas as pd
from datetime import datetime
from dateutil import parser
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(script_dir)
csv_filename = os.path.join(app_dir, "data", "historical_esg_data.csv")

def is_valid_row(row):
    required_fields = ['total_score', 'environment_score', 'social_score', 'governance_score']
    try:
        return all(pd.notna(row[field]) for field in required_fields)
    except KeyError:
        return False

def format_timestamp(ts):
    if not ts:
        return datetime.now().strftime('%Y-%m-%d')

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

def process_csv_file(csv_file):
    """Process the entire CSV file: remove pre-2020 data, add rating column."""
    print(f"Processing CSV file: {csv_file}")

    df = pd.read_csv(csv_file)

    # Filter valid rows
    df = df[df.apply(is_valid_row, axis=1)]

    # Convert timestamps
    df['timestamp'] = df['timestamp'].apply(format_timestamp)

    # Remove data before 2020
    original_row_count = len(df)
    df = df[df['timestamp'] >= "2020-01-01"]
    removed_count = original_row_count - len(df) 

    print(f"Removed {removed_count} rows with timestamps before 2020.")

    # Apply rating system
    df['rating'] = df['total_score'].apply(lambda x: rating(float(x) if pd.notna(x) else 0))

    # verify
    print(df.head(10))

    # Save the cleaned CSV file
    output_directory = os.path.join(app_dir, "processed_data")
    os.makedirs(output_directory, exist_ok=True)
    output_file = os.path.join(output_directory, "processed_historical_esg_data.csv")
    print(f"Saving processed CSV to: {output_file}")

    df.to_csv(output_file, index=False)
    print(f"Processed CSV file saved successfully")

if __name__ == "__main__":
    process_csv_file(csv_filename)
