# this config helps to prevent state-locking (basically preventing multiple users from simultaneously accessing same state file)
terraform {
  backend "s3" {
    bucket         = "sierra-terraform-state-2025"
    key            = "terraform/state/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "sierra-terraform-lock"
    encrypt        = true
  }
}
