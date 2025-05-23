resource "aws_sagemaker_model" "esg_model" {
  name               = "esg-xgboost-model"
  execution_role_arn = aws_iam_role.sagemaker_execution_role.arn

  primary_container {
    //image = "811284229777.dkr.ecr.us-east-1.amazonaws.com/xgboost:1.3-1"
    image = data.aws_sagemaker_prebuilt_ecr_image.xgboost_image.registry_path
    # XGBoost container
    model_data_url = "s3://sierra-personal-bucket-2025/models/esg-model.tar.gz" 
  }
}