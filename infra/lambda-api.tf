# Grant permission for API Gateway to invoke Lambda
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn    = "${aws_api_gateway_rest_api.sierra_api.execution_arn}/*/*"
}

# Create Lambda function for API handling
resource "aws_lambda_function" "api_handler" {
  function_name = "sierra-api-handler"
  role          = "arn:aws:iam::249414161180:role/LabRole"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  filename      = "../app/lambda/api-handler.zip"
  source_code_hash = filebase64sha256("../app/lambda/api-handler.zip")
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.esg_processed.name
      NODE_ENV = "production"
    }
  }
}