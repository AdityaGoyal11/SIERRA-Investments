terraform {
  backend "s3" {
    bucket = "sierra-personal-terraform-state"
    key    = "terraform.personal.tfstate"
    region = "us-east-1"
  }
}