# EFS File System
resource "aws_efs_file_system" "main" {
  creation_token = "${var.project_name}-${var.environment}-efs"
  encrypted      = true

  tags = {
    Name = "${var.project_name}-${var.environment}-efs"
  }
}

# EFS Access Point
resource "aws_efs_access_point" "lambda" {
  file_system_id = aws_efs_file_system.main.id

  # Root directory for the access point
  root_directory {
    path = "/lambda"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }

  # Enforce user identity
  posix_user {
    gid = 1000
    uid = 1000
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-ap"
  }
}

# Mount Targets in each private subnet
resource "aws_efs_mount_target" "main" {
  count = length(module.vpc.private_subnets)

  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = module.vpc.private_subnets[count.index]
  security_groups = [aws_security_group.efs.id]
}

# Security Group for EFS
resource "aws_security_group" "efs" {
  name        = "${var.project_name}-${var.environment}-efs-sg"
  description = "Security group for EFS mount targets"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "NFS from VPC"
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-efs-sg"
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda_efs" {
  name        = "${var.project_name}-${var.environment}-lambda-efs-sg"
  description = "Security group for Lambda to access EFS"
  vpc_id      = module.vpc.vpc_id

  # Outbound rule for EFS
  egress {
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnets_cidr_blocks
    description = "Allow NFS traffic to EFS"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-efs-sg"
  }
}

# Outputs
output "efs_id" {
  description = "The ID of the EFS File System"
  value       = aws_efs_file_system.main.id
}

output "efs_dns_name" {
  description = "The DNS name of the EFS File System"
  value       = aws_efs_file_system.main.dns_name
}

output "efs_lambda_ap" {
  description = "The Lambda Access Point of the EFS File System"
  value       = aws_efs_access_point.lambda.id
}

output "efs_security_group_id" {
  description = "The ID of the EFS Security Group"
  value       = aws_security_group.efs.id
}

output "lambda_security_group_id" {
  description = "The ID of the Lambda Security Group"
  value       = aws_security_group.lambda_efs.id
}
