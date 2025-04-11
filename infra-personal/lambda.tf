# ETL Lambda for processing S3 data
resource "aws_lambda_function" "esg_etl" {
  function_name = "esg-etl-lambda-personal"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  filename      = "../app/lambda/esg-etl.zip"
  source_code_hash = filebase64sha256("../app/lambda/esg-etl.zip")
  timeout       = 60
  memory_size   = 256
  
  layers = [
    "arn:aws:lambda:us-east-1:336392948345:layer:AWSSDKPandas-Python39:9"
  ]
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.esg_processed.name
      SAGEMAKER_ENDPOINT = "esg-xgboost-endpoint-v3"
    }
  }

}

resource "aws_lambda_function" "predict_handler" {
  function_name = "sierra-predict-handler"
  runtime       = "python3.9"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_role.arn
  filename      = "../app/lambda/predict-lambda.zip"


  source_code_hash = filebase64sha256("../app/lambda/predict-lambda.zip")

  environment {
    variables = {
      SAGEMAKER_ENDPOINT = "esg-xgboost-endpoint-v3"
    }
  }

  layers = [
  "arn:aws:lambda:us-east-1:336392948345:layer:AWSSDKPandas-Python39:9"
  ]

}

# API Handler Lambda for handling HTTP requests
resource "aws_lambda_function" "api_handler" {
  function_name = "sierra-api-handler-personal"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  filename      = "../app/lambda/api-handler.zip"
  source_code_hash = filebase64sha256("../app/lambda/api-handler.zip")
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.esg_processed.name
    }
  }
}

# Allow s3 to call ETL lambda function
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.esg_etl.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.sierra_personal.arn
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "sierra-lambda-role-personal"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# DynamoDB permissions for Lambda
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "sierra-lambda-dynamodb-policy-personal"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
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
          aws_dynamodb_table.esg_processed.arn,
          "${aws_dynamodb_table.esg_processed.arn}/index/*"
        ]
      }
    ]
  })
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Add S3 read permissions to the role
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "lambda_s3_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::sierra-personal-bucket-2025",
          "arn:aws:s3:::sierra-personal-bucket-2025/*"
        ]
      }
    ]
  })
}

# Lambda permission for API Gateway - for all HTTP methods
resource "aws_lambda_permission" "apigw_all" {
  statement_id  = "AllowAPIGatewayInvokeAll"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/*"
}

# More specific Lambda permissions for score search endpoints
resource "aws_lambda_permission" "apigw_score_search" {
  statement_id  = "AllowAPIGatewayInvokeScoreSearch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/GET/api/search/score/*"
}

# Lambda permission for the range score search endpoint
resource "aws_lambda_permission" "apigw_score_range" {
  statement_id  = "AllowAPIGatewayInvokeScoreRange"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/GET/api/search/score/*/*"
}

# Lambda permission for the level search endpoint
resource "aws_lambda_permission" "apigw_level_search" {
  statement_id  = "AllowAPIGatewayInvokeLevelSearch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/GET/api/search/level/*"
}

# Lambda permission for the company search endpoint
resource "aws_lambda_permission" "apigw_company_search" {
  statement_id  = "AllowAPIGatewayInvokeCompanySearch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.sierra_personal.execution_arn}/*/GET/api/search/company/*"
} 

resource "aws_iam_role_policy" "lambda_invoke_sagemaker" {
  name = "sagemaker-invoke"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "sagemaker:InvokeEndpoint",
        Resource = "arn:aws:sagemaker:us-east-1:797976479464:endpoint/esg-xgboost-endpoint-v3"
      }
    ]
  })
}
