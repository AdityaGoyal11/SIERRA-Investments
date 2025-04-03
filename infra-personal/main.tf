terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  skip_metadata_api_check = true
  skip_region_validation = true
}

resource "aws_s3_bucket" "sierra_personal" {
  bucket = "sierra-personal-bucket-2025"
} 