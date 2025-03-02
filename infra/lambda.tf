resource "aws_lambda_function" "esg_etl" {
  function_name = "esg-etl-lambda"
  role          = "arn:aws:iam::249414161180:role/LabRole"
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  filename        = "../app/lambda/esg-etl.zip"
  source_code_hash = filebase64sha256("../app/lambda/esg-etl.zip")
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.esg_processed.name
    }
  }
}

# Grant permission for S3 to invoke your Lambda function
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.esg_etl.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.sierra.arn
}
