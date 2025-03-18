# Create API Gateway REST API
resource "aws_api_gateway_rest_api" "sierra_api" {
  name = "sierra-api"
  description = "SIERRA Investments API Gateway"
}

# Create API Gateway resource for /api
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_rest_api.sierra_api.root_resource_id
  path_part   = "api"
}

# Create API Gateway resource for /api/esg
resource "aws_api_gateway_resource" "esg" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "esg"
}

# Create API Gateway resource for /api/esg-data
resource "aws_api_gateway_resource" "esg_data" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "esg-data"
}

# Create API Gateway resource for /api/esg/{ticker}
resource "aws_api_gateway_resource" "ticker" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.esg.id
  path_part   = "{ticker}"
}

# Create API Gateway method for GET /api/esg/{ticker}
resource "aws_api_gateway_method" "get_ticker" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  resource_id   = aws_api_gateway_resource.ticker.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for ticker endpoint
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  resource_id = aws_api_gateway_resource.ticker.id
  http_method = aws_api_gateway_method.get_ticker.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create method for GET /api/esg-data
resource "aws_api_gateway_method" "get_all_data" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  resource_id   = aws_api_gateway_resource.esg_data.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create Lambda integration for /api/esg-data
resource "aws_api_gateway_integration" "lambda_integration_data" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  resource_id = aws_api_gateway_resource.esg_data.id
  http_method = aws_api_gateway_method.get_all_data.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Deploy the API Gateway
resource "aws_api_gateway_deployment" "sierra_api" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  
  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration.lambda_integration_data
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
output "api_gateway_url" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/api/esg/{ticker}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_api.execution_arn}/*/*"
} 