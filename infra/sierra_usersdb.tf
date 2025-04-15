# Create dynamodb for users and their tickers


resource "aws_dynamodb_table" "sierra_users" {
  name         = "sierra_users"
  billing_mode = "PAY_PER_REQUEST"
  
  hash_key     = "email"
  
  attribute {
    name = "email"
    type = "S"  # String
  }

  attribute {
    name = "user_id"
    type = "S"  # String
  }

  attribute {
    name = "account_status"
    type = "S" 
  }

  attribute {
    name = "created_at"
    type = "S" 
  }

  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"  
  }

  global_secondary_index {
    name               = "AccountStatusIndex"
    hash_key           = "account_status"
    range_key          = "created_at"
    projection_type    = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name    = "Sierra Users Database"
    Project = "SIERRA"
    Purpose = "User Authentication and Management"
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

  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name            = "TickerIndex"
    hash_key        = "ticker"
    projection_type = "ALL"
  }


  server_side_encryption {
    enabled = true
  }


  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name    = "Sierra Saved Tickers"
    Project = "SIERRA"
    Purpose = "User Saved Company Tickers"
  }
}


output "users_table_name" {
  value = aws_dynamodb_table.sierra_users.name
}

output "tickers_table_name" {
  value = aws_dynamodb_table.sierra_saved_tickers.name
}