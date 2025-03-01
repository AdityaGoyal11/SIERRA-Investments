# create dynamodb
resource "aws_dynamodb_table" "esg_processed"{
    name = "esg_processed"
    billing_mode = "PAY_PER_REQUEST"
    hash_key = "CompanyName"

    attribute {
        name = "CompanyName"
        type = "S"
    }
}

# TODO: Add other attributes, like ESG Scores