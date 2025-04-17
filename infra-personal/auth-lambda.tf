# Create a Lambda Function for new auth handler
resource "aws_lambda_function" "auth_handler" {
  function_name = "sierra-auth-handler-personal"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  filename      = "../app/lambda/auth-handler.zip"
  source_code_hash = filebase64sha256("../app/lambda/auth-handler.zip")
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_ENDPOINT = "https://dynamodb.us-east-1.amazonaws.com"
      JWT_SECRET = var.jwt_secret
    }
  }
}

# Grant permissions for API Gateway to invoke Auth Lambda
resource "aws_lambda_permission" "apigw_auth" {
  statement_id  = "AllowAPIGatewayInvokeAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/*"
}

# Add new DynamoDB tables for auth
resource "aws_dynamodb_table" "sierra_users" {
  name         = "sierra_users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "account_status"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "AccountStatusIndex"
    hash_key        = "account_status"
    range_key       = "email"
    projection_type = "ALL"
  }

  tags = {
    Name        = "sierra-users"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "sierra_saved_tickers" {
  name         = "sierra_saved_tickers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "ticker"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "ticker"
    type = "S"
  }

  global_secondary_index {
    name            = "TickerIndex"
    hash_key        = "ticker"
    projection_type = "ALL"
  }

  tags = {
    Name        = "sierra-saved-tickers"
    Environment = "production"
  }
}

# Add DynamoDB tables permissions to the Lambda role
resource "aws_iam_role_policy" "lambda_auth_dynamodb_policy" {
  name = "sierra-lambda-auth-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          aws_dynamodb_table.sierra_users.arn,
          "${aws_dynamodb_table.sierra_users.arn}/index/*",
          aws_dynamodb_table.sierra_saved_tickers.arn,
          "${aws_dynamodb_table.sierra_saved_tickers.arn}/index/*"
        ]
      }
    ]
  })
} 