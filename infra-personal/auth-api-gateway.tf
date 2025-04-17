# Create resource for the route API Gateway endpoint
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_rest_api.sierra_personal.root_resource_id
  path_part   = "auth"
}

# Create resources for authentication endpoints
resource "aws_api_gateway_resource" "register" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

resource "aws_api_gateway_resource" "login" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

resource "aws_api_gateway_resource" "init" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "init"
}

resource "aws_api_gateway_resource" "tickers" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "tickers"
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "health"
}

# Create endpoint for register which is POST
resource "aws_api_gateway_method" "post_register" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.register.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_register" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.register.id
  http_method = aws_api_gateway_method.post_register.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.auth_handler.invoke_arn
}

# Create endpoint for login which is POST
resource "aws_api_gateway_method" "post_login" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_login" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.post_login.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.auth_handler.invoke_arn
}

# Create endpoint for initializing table which is GET
resource "aws_api_gateway_method" "get_init" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.init.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_init" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.init.id
  http_method = aws_api_gateway_method.get_init.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.auth_handler.invoke_arn
}

# Create endpoint for saving tickers which is POST
resource "aws_api_gateway_method" "post_tickers" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.tickers.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_tickers" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.tickers.id
  http_method = aws_api_gateway_method.post_tickers.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.auth_handler.invoke_arn
}

# Add endpoint for retrieving tickers which is GET
resource "aws_api_gateway_method" "get_tickers" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.tickers.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_get_tickers" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.tickers.id
  http_method = aws_api_gateway_method.get_tickers.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.auth_handler.invoke_arn
}

# Endpoint just to check the service is running (GET)
resource "aws_api_gateway_method" "get_health" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_health" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.get_health.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.auth_handler.invoke_arn
}

# Add proper CORS headers to allow requests
resource "aws_api_gateway_method" "options_register" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.register.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_register" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.register.id
  http_method = aws_api_gateway_method.options_register.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_register" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.register.id
  http_method = aws_api_gateway_method.options_register.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_register" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.register.id
  http_method = aws_api_gateway_method.options_register.http_method
  status_code = aws_api_gateway_method_response.options_200_register.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for Login endpoint
resource "aws_api_gateway_method" "options_login" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_login" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.options_login.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_login" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.options_login.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_login" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.login.id
  http_method = aws_api_gateway_method.options_login.http_method
  status_code = aws_api_gateway_method_response.options_200_login.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for Tickers endpoint
resource "aws_api_gateway_method" "options_tickers" {
  rest_api_id   = aws_api_gateway_rest_api.sierra_personal.id
  resource_id   = aws_api_gateway_resource.tickers.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200_tickers" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.tickers.id
  http_method = aws_api_gateway_method.options_tickers.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_tickers" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.tickers.id
  http_method = aws_api_gateway_method.options_tickers.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_tickers" {
  rest_api_id = aws_api_gateway_rest_api.sierra_personal.id
  resource_id = aws_api_gateway_resource.tickers.id
  http_method = aws_api_gateway_method.options_tickers.http_method
  status_code = aws_api_gateway_method_response.options_200_tickers.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

output "api_url_auth_register" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/auth/register"
}

output "api_url_auth_login" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/auth/login"
}

output "api_url_auth_tickers" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/auth/tickers"
}

output "api_url_auth_init" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/auth/init"
} 