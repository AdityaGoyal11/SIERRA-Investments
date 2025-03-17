resource "aws_lambda_function" "esg_etl" {
  function_name = "esg-etl-lambda"
  role          = "arn:aws:iam::249414161180:role/LabRole"
  handler       = "index.handler"
  runtime       = "python3.9"
  filename        = "../app/lambda/esg-etl.zip"
  source_code_hash = filebase64sha256("../app/lambda/esg-etl.zip")
  # Increased timeout for processing
  timeout       = 60
  # Increased memory for pandas
  memory_size   = 256
  
  layers = [
    "arn:aws:lambda:us-east-1:336392948345:layer:AWSSDKPandas-Python39:9"
  ]
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.esg_processed.name
    }
  }
}

# Allow s3 to call lambda function
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.esg_etl.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.sierra.arn
}
