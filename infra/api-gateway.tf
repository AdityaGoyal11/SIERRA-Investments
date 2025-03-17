# Create API Gateway REST API
resource "aws_api_gateway_rest_api" "sierra_api" {
  name = "sierra-api"
  description = "SIERRA Investments API Gateway"
}

# Create API Gateway resource for /esg
resource "aws_api_gateway_resource" "esg" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_rest_api.sierra_api.root_resource_id
  path_part   = "esg"
}

# Create API Gateway resource for /esg/{ticker}
resource "aws_api_gateway_resource" "ticker" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.esg.id
  path_part   = "{ticker}"
}

# Create API Gateway method for GET /esg/{ticker}
resource "aws_api_gateway_method" "get_ticker" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  resource_id   = aws_api_gateway_resource.ticker.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  resource_id = aws_api_gateway_resource.ticker.id
  http_method = aws_api_gateway_method.get_ticker.http_method
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Deploy the API Gateway
resource "aws_api_gateway_deployment" "sierra_api" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  
  depends_on = [
    aws_api_gateway_integration.lambda_integration
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Create API Gateway stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.sierra_api.id
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  stage_name    = "prod"
}

# Output the API Gateway URL
output "api_url" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/esg/{ticker}"
} 