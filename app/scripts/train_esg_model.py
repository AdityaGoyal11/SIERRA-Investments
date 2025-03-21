import boto3
import pandas as pd
import xgboost as xgb
import tarfile
import os


file_path = "./processed_data/processed_historical_esg_data.csv"
df = pd.read_csv(file_path)

# Convert timestamp to datetime and sort
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values(['ticker', 'timestamp'])

# Create lag features per company
for lag in range(1, 4):
    df[f'lag_{lag}'] = df.groupby('ticker')['total_score'].shift(lag)

# Drop rows with missing lag features
df_model = df.dropna(subset=['lag_1', 'lag_2', 'lag_3'])

# Prepare training data
features = ["lag_1", "lag_2", "lag_3"]
target = "total_score"

X_train = df_model[features]
y_train = df_model[target]


# Train the Model
model = xgb.XGBRegressor(objective="reg:squarederror", n_estimators=100)
model.fit(X_train, y_train)

# Save the Model
model_dir = "model"
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, "xgboost-model.model")
model.save_model(model_path)

# Package as tar.gz for SageMaker
tar_model_path = "esg-model.tar.gz"
with tarfile.open(tar_model_path, "w:gz") as tar:
    tar.add(model_path, arcname="xgboost-model.model")

# Upload Model to S3
s3_bucket = "sierra-bucket-2025"
s3_model_path = "models/esg-model.tar.gz"

s3 = boto3.client("s3")
s3.upload_file(tar_model_path, s3_bucket, s3_model_path)

print(f"Model uploaded to S3: s3://{s3_bucket}/{s3_model_path}")
