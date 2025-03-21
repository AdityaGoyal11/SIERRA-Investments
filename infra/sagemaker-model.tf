resource "aws_sagemaker_model" "esg_model" {
  name               = "esg-xgboost-model"
  execution_role_arn = "arn:aws:iam::249414161180:role/LabRole"

  primary_container {
    image = "811284229777.dkr.ecr.us-east-1.amazonaws.com/xgboost:1"  # XGBoost container
    model_data_url = "s3://sierra-bucket-2025/models/esg-model.tar.gz"  # trained model location
  }
}
