resource "aws_api_gateway_rest_api" "sierra_personal" {
  name = "sierra-api-personal"
  description = "SIERRA Investments API - Personal Deployment"
}

resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_rest_api.sierra_personal.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "esg" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "esg"
}

# Resource for /api/all (changed from esg-all to match Express routes)
resource "aws_api_gateway_resource" "all" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "all"
}

# Resource for /api/esg/{ticker}
resource "aws_api_gateway_resource" "ticker" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.esg.id
  path_part   = "{ticker}"
}

# GET method for /api/esg/{ticker}
resource "aws_api_gateway_method" "get_ticker" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.ticker.id
  http_method   = "GET"
  authorization = "NONE"
}

# Integration with Lambda for /api/esg/{ticker}
resource "aws_api_gateway_integration" "lambda_ticker" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.ticker.id
  http_method = aws_api_gateway_method.get_ticker.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# GET method for /api/all
resource "aws_api_gateway_method" "get_all" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.all.id
  http_method   = "GET"
  authorization = "NONE"
}

# Integration with Lambda for /api/all
resource "aws_api_gateway_integration" "lambda_all" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.all.id
  http_method = aws_api_gateway_method.get_all.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create API Gateway resource for /api/search
resource "aws_api_gateway_resource" "search" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "search"
}

# Create API Gateway resource for /api/search/score
resource "aws_api_gateway_resource" "score" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.search.id
  path_part   = "score"
}

# Create API Gateway resource for /api/search/level
resource "aws_api_gateway_resource" "level" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.search.id
  path_part   = "level"
}

# Create API Gateway resource for /api/search/level/total_level
resource "aws_api_gateway_resource" "total_level" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.level.id
  path_part   = "total_level"
}

# Create API Gateway resource for /api/search/level/total_level/{rating}
resource "aws_api_gateway_resource" "rating" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.total_level.id
  path_part   = "{rating}"
}

# Create API Gateway method for GET /api/search/level/total_level/{rating}
resource "aws_api_gateway_method" "get_level_rating" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.rating.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for level rating endpoint
resource "aws_api_gateway_integration" "lambda_integration_level_rating" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.rating.id
  http_method = aws_api_gateway_method.get_level_rating.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create API Gateway resource for /api/search/score/greater
resource "aws_api_gateway_resource" "greater" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.score.id
  path_part   = "greater"
}

# Create API Gateway resource for /api/search/score/greater/{scoreType}
resource "aws_api_gateway_resource" "greater_score_type" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.greater.id
  path_part   = "{scoreType}"
}

# Create API Gateway resource for /api/search/score/greater/{scoreType}/{score}
resource "aws_api_gateway_resource" "greater_score_value" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.greater_score_type.id
  path_part   = "{score}"
}

# Create API Gateway method for GET /api/search/score/greater/{scoreType}/{score}
resource "aws_api_gateway_method" "get_greater_score" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.greater_score_value.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for greater score endpoint
resource "aws_api_gateway_integration" "lambda_integration_greater_score" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.greater_score_value.id
  http_method = aws_api_gateway_method.get_greater_score.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create API Gateway resource for /api/search/score/lesser
resource "aws_api_gateway_resource" "lesser" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.score.id
  path_part   = "lesser"
}

# Create API Gateway resource for /api/search/score/lesser/{scoreType}
resource "aws_api_gateway_resource" "lesser_score_type" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.lesser.id
  path_part   = "{scoreType}"
}

# Create API Gateway resource for /api/search/score/lesser/{scoreType}/{score}
resource "aws_api_gateway_resource" "lesser_score_value" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.lesser_score_type.id
  path_part   = "{score}"
}

# Create API Gateway method for GET /api/search/score/lesser/{scoreType}/{score}
resource "aws_api_gateway_method" "get_lesser_score" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.lesser_score_value.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for lesser score endpoint
resource "aws_api_gateway_integration" "lambda_integration_lesser_score" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.lesser_score_value.id
  http_method = aws_api_gateway_method.get_lesser_score.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Create API Gateway resource for /api/search/score/{scoreType}
resource "aws_api_gateway_resource" "score_type" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.score.id
  path_part   = "{scoreType}"
}

# Create API Gateway resource for /api/search/score/{scoreType}/{score1}
resource "aws_api_gateway_resource" "score_value1" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.score_type.id
  path_part   = "{score1}"
}

# Create API Gateway resource for /api/search/score/{scoreType}/{score1}/{score2}
resource "aws_api_gateway_resource" "score_value2" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.score_value1.id
  path_part   = "{score2}"
}

# Create API Gateway method for GET /api/search/score/{scoreType}/{score1}/{score2}
resource "aws_api_gateway_method" "get_score_range" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.score_value2.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for score range endpoint
resource "aws_api_gateway_integration" "lambda_integration_score_range" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.score_value2.id
  http_method = aws_api_gateway_method.get_score_range.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Enable CORS for ticker endpoint
resource "aws_api_gateway_method" "options_ticker" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.ticker.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_ticker" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.ticker.id
  http_method = aws_api_gateway_method.options_ticker.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_ticker" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.ticker.id
  http_method = aws_api_gateway_method.options_ticker.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_ticker" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.ticker.id
  http_method = aws_api_gateway_method.options_ticker.http_method
  status_code = aws_api_gateway_method_response.options_200_ticker.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for all endpoint
resource "aws_api_gateway_method" "options_all" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.all.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_all" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.all.id
  http_method = aws_api_gateway_method.options_all.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_all" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.all.id
  http_method = aws_api_gateway_method.options_all.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_all" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.all.id
  http_method = aws_api_gateway_method.options_all.http_method
  status_code = aws_api_gateway_method_response.options_200_all.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for level rating endpoint
resource "aws_api_gateway_method" "options_level_rating" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.rating.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_level_rating" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.rating.id
  http_method = aws_api_gateway_method.options_level_rating.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_level_rating" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.rating.id
  http_method = aws_api_gateway_method.options_level_rating.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_level_rating" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.rating.id
  http_method = aws_api_gateway_method.options_level_rating.http_method
  status_code = aws_api_gateway_method_response.options_200_level_rating.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /api/search/score endpoints
resource "aws_api_gateway_method" "options_score_range" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.score_value2.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_score_range" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.score_value2.id
  http_method = aws_api_gateway_method.options_score_range.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_score_range" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.score_value2.id
  http_method = aws_api_gateway_method.options_score_range.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_score_range" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.score_value2.id
  http_method = aws_api_gateway_method.options_score_range.http_method
  status_code = aws_api_gateway_method_response.options_200_score_range.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Add output for the level search endpoint
output "api_url_level_search" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/api/search/level/total_level"
}

# Add output for the company search endpoint
output "api_url_company_search" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/api/search/company"
}

# Create API Gateway resource for /api/search/company
resource "aws_api_gateway_resource" "company" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.search.id
  path_part   = "company"
}

# Create API Gateway resource for /api/search/company/{name}
resource "aws_api_gateway_resource" "company_name" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.company.id
  path_part   = "{name}"
}

# Create API Gateway method for GET /api/search/company/{name}
resource "aws_api_gateway_method" "get_company_name" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.company_name.id
  http_method   = "GET"
  authorization = "NONE"
}

# Create API Gateway integration with Lambda for company name endpoint
resource "aws_api_gateway_integration" "lambda_integration_company_name" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.company_name.id
  http_method = aws_api_gateway_method.get_company_name.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Enable CORS for company name endpoint
resource "aws_api_gateway_method" "options_company_name" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.company_name.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_company_name" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.company_name.id
  http_method   = aws_api_gateway_method.options_company_name.http_method
  status_code   = "200"
  
  response_models = {
    "application/json" = "Empty"
  }
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration" "options_company_name" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.company_name.id
  http_method = aws_api_gateway_method.options_company_name.http_method
  
  type = "MOCK"
  
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_company_name" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.company_name.id
  http_method = aws_api_gateway_method.options_company_name.http_method
  status_code = aws_api_gateway_method_response.options_200_company_name.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

# Deployment
resource "aws_api_gateway_deployment" "sierra_personal" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id

  triggers = {
    redeployment = timestamp()
  }
  
  depends_on = [
    aws_api_gateway_integration.lambda_ticker,
    aws_api_gateway_integration.lambda_all,
    aws_api_gateway_integration.lambda_integration_level_rating,
    aws_api_gateway_integration.lambda_integration_greater_score,
    aws_api_gateway_integration.lambda_integration_lesser_score,
    aws_api_gateway_integration.lambda_integration_score_range,
    aws_api_gateway_integration.lambda_integration_company_name,
    aws_api_gateway_integration.lambda_integration_predict,
    aws_api_gateway_integration.options_ticker,
    aws_api_gateway_integration.options_all,
    aws_api_gateway_integration.options_level_rating,
    aws_api_gateway_integration.options_score_range,
    aws_api_gateway_integration.options_company_name
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.sierra_personal.id
  rest_api_id  = aws_api_gateway_rest_api.sierra_personal.id
  stage_name   = "prod"
}

# /predict
resource "aws_api_gateway_resource" "predict" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "predict"
}

resource "aws_api_gateway_method" "get_predict" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.predict.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration_predict" {
  rest_api_id             = aws_api_gateway_rest_api.sierra_personal.id
  resource_id             = aws_api_gateway_resource.predict.id
  http_method             = aws_api_gateway_method.get_predict.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.predict_handler.invoke_arn
}

resource "aws_lambda_permission" "apigw_predict" {
  statement_id  = "AllowAPIGatewayInvokePredict"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.predict_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/*"
}

# Add output for the predict endpoint
output "api_url_predict" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/api/predict"
}

# Lambda permission for API Gateway - this is now moved to lambda.tf
# Keeping this commented out as reference
# resource "aws_lambda_permission" "apigw" {
#   statement_id  = "AllowAPIGatewayInvoke"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.api_handler.function_name
#   principal     = "apigateway.amazonaws.com"
#   source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/*"
# }
