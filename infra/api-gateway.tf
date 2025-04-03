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

# Create API Gateway resource for /api/search
resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "search"
}

# Create API Gateway resource for /api/search/score
resource "aws_api_gateway_resource" "score" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.search.id
  path_part   = "score"
}

# Create API Gateway resource for /api/search/score/greater
resource "aws_api_gateway_resource" "greater" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.score.id
  path_part   = "greater"
}

# Create API Gateway resource for /api/search/score/greater/{scoreType}
resource "aws_api_gateway_resource" "greater_score_type" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.greater.id
  path_part   = "{scoreType}"
}

# Create API Gateway resource for /api/search/score/greater/{scoreType}/{score}
resource "aws_api_gateway_resource" "greater_score_value" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.greater_score_type.id
  path_part   = "{score}"
}

# Create API Gateway method for GET /api/search/score/greater/{scoreType}/{score}
resource "aws_api_gateway_method" "get_greater_score" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  resource_id   = aws_api_gateway_resource.greater_score_value.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for greater score endpoint
resource "aws_api_gateway_integration" "lambda_integration_greater_score" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  resource_id = aws_api_gateway_resource.greater_score_value.id
  http_method = aws_api_gateway_method.get_greater_score.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create API Gateway resource for /api/search/score/lesser
resource "aws_api_gateway_resource" "lesser" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.score.id
  path_part   = "lesser"
}

# Create API Gateway resource for /api/search/score/lesser/{scoreType}
resource "aws_api_gateway_resource" "lesser_score_type" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.lesser.id
  path_part   = "{scoreType}"
}

# Create API Gateway resource for /api/search/score/lesser/{scoreType}/{score}
resource "aws_api_gateway_resource" "lesser_score_value" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.lesser_score_type.id
  path_part   = "{score}"
}

# Create API Gateway method for GET /api/search/score/lesser/{scoreType}/{score}
resource "aws_api_gateway_method" "get_lesser_score" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  resource_id   = aws_api_gateway_resource.lesser_score_value.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for lesser score endpoint
resource "aws_api_gateway_integration" "lambda_integration_lesser_score" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  resource_id = aws_api_gateway_resource.lesser_score_value.id
  http_method = aws_api_gateway_method.get_lesser_score.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create API Gateway resource for /api/search/score/{scoreType}
resource "aws_api_gateway_resource" "score_type" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.score.id
  path_part   = "{scoreType}"
}

# Create API Gateway resource for /api/search/score/{scoreType}/{score1}
resource "aws_api_gateway_resource" "score_value1" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.score_type.id
  path_part   = "{score1}"
}

# Create API Gateway resource for /api/search/score/{scoreType}/{score1}/{score2}
resource "aws_api_gateway_resource" "score_value2" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.score_value1.id
  path_part   = "{score2}"
}

# Create API Gateway method for GET /api/search/score/{scoreType}/{score1}/{score2}
resource "aws_api_gateway_method" "get_score_range" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  resource_id   = aws_api_gateway_resource.score_value2.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for score range endpoint
resource "aws_api_gateway_integration" "lambda_integration_score_range" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  resource_id = aws_api_gateway_resource.score_value2.id
  http_method = aws_api_gateway_method.get_score_range.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create API Gateway resource for /api/search/company
resource "aws_api_gateway_resource" "company" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.search.id
  path_part   = "company"
}

# Create API Gateway resource for /api/search/company/{name}
resource "aws_api_gateway_resource" "company_name" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  parent_id   = aws_api_gateway_resource.company.id
  path_part   = "{name}"
}

# Create API Gateway method for GET /api/search/company/{name}
resource "aws_api_gateway_method" "get_company" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_api.id
  resource_id   = aws_api_gateway_resource.company_name.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for company search endpoint
resource "aws_api_gateway_integration" "lambda_integration_company" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  resource_id = aws_api_gateway_resource.company_name.id
  http_method = aws_api_gateway_method.get_company.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Deploy the API Gateway
resource "aws_api_gateway_deployment" "sierra_api" {
  rest_api_id = aws_api_gateway_rest_api.sierra_api.id
  
  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration.lambda_integration_data,
    aws_api_gateway_integration.lambda_integration_greater_score,
    aws_api_gateway_integration.lambda_integration_lesser_score,
    aws_api_gateway_integration.lambda_integration_score_range,
    aws_api_gateway_integration.lambda_integration_company
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