# Create ECS cluster
resource "aws_ecs_cluster" "sierra_cluster" {
  name = "sierra-cluster"
}

# Create ECS task definition
resource "aws_ecs_task_definition" "sierra_api" {
  family                   = "sierra-api"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = 256
  memory                  = 512
  execution_role_arn      = "arn:aws:iam::249414161180:role/LabRole"

  container_definitions = jsonencode([
    {
      name  = "sierra-api"
      image = "${aws_ecr_repository.sierra_repo.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/sierra-api"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# Create ECR repository
resource "aws_ecr_repository" "sierra_repo" {
  name = "sierra-api"
}

# Create CloudWatch log group
resource "aws_cloudwatch_log_group" "sierra_api" {
  name              = "/ecs/sierra-api"
  retention_in_days = 30
}

# Create ECS service
resource "aws_ecs_service" "sierra_api" {
  name            = "sierra-api"
  cluster         = aws_ecs_cluster.sierra_cluster.id
  task_definition = aws_ecs_task_definition.sierra_api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = ["subnet-06e50ed96e5c43a64"] # Replace with your subnet ID
    security_groups = ["sg-0abbe4d2f8e585b5e"]    # Replace with your security group ID
    assign_public_ip = true
  }
} 