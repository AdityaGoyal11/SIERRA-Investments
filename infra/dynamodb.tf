# create dynamodb for ADAGE 3.0 event dataset
resource "aws_dynamodb_table" "esg_processed" {
    name = "esg_processed"
    billing_mode = "PAY_PER_REQUEST"
    # Company identifier
    hash_key = "ticker"
    # Timestamp of the data
    range_key = "timestamp"

    attribute {
        name = "ticker"
        type = "S"
    }

    attribute {
        name = "timestamp"
        type = "S"
    }

    attribute {
        name = "total_score"
        type = "N"
    }

    attribute {
        name = "ratting"
        type = "S"
    }

    attribute {
        name = "last_processed_date"
        type = "S"
    }

    global_secondary_index {
        name = "ScoreIndex"
        hash_key = "total_score"
        range_key = "timestamp"
        projection_type = "ALL"
    }

    global_secondary_index {
        name = "DateIndex"
        hash_key = "last_processed_date"
        range_key = "ticker"
        projection_type = "ALL"
    }

    tags = {
        Name = "ESG Dataset"
        Project = "SIERRA"
        DataSource = "SIERRA_Investments"
        DatasetType = "ESG_Scores"
    }
}