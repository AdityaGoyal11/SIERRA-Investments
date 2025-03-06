terraform {
  backend "s3" {
    bucket = "sierra-terraform-state-249414161180"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
} 