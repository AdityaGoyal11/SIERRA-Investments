variable "jwt_secret" {
  description = "Storing secret for JWT token generation and retrieval"
  type        = string
  default     = "sierra_jwt_secret_for_production"
  sensitive   = true
} 