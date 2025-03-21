/**
 Error: creating SageMaker Endpoint Configuration: AccessDeniedException: 
 User: arn:aws:sts::249414161180:assumed-role/voclabs/user3881846=z5450330@unsw.edu.au 
 is not authorized to perform: sagemaker:CreateEndpointConfig on resource: 
 arn:aws:sagemaker:us-east-1:249414161180:endpoint-config/esg-endpoint-config 
 with an explicit deny in an identity-based policy
│       status code: 400, request id: 3f6539e7-e0e7-453c-b2d7-d41e3a9829c2
*/

/**
resource "aws_sagemaker_endpoint_configuration" "esg_endpoint_config" {
  name = "esg-endpoint-config"

  production_variants {
    variant_name           = "AllTraffic"
    model_name             = aws_sagemaker_model.esg_model.name
    initial_instance_count = 1
    instance_type          = "ml.t2.medium"
  }
}

resource "aws_sagemaker_endpoint" "esg_endpoint" {
  name                 = "esg-endpoint"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.esg_endpoint_config.name
}
*/
