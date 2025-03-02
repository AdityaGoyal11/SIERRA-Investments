resource "aws_s3_bucket_notification" "esg_notification" {
  bucket = aws_s3_bucket.sierra.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.esg_etl.arn
    events              = ["s3:ObjectCreated:*"]
  }
}
