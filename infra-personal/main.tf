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

data "aws_sagemaker_prebuilt_ecr_image" "xgboost_image" {
  repository_name = "sagemaker-xgboost"
  image_tag       = "1.7-1"  # or 1.5-1, 1.3-1
  region          = "us-east-1"
}

