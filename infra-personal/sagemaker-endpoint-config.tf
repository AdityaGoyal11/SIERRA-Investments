resource "aws_sagemaker_endpoint_configuration" "esg_endpoint_config" {
  name = "esg-endpoint-config"

  production_variants {
    variant_name           = "AllTraffic"
    model_name             = aws_sagemaker_model.esg_model.name
    initial_instance_count = 1
    instance_type          = "ml.m5.large" //ml.t3.medium
  }
}
