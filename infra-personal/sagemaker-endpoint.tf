resource "aws_sagemaker_endpoint" "esg_endpoint" {
  name                 = "esg-xgboost-endpoint-v3"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.esg_endpoint_config.name
}
