variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "demo"
}

variable "default_tags" {
  description = "Default tags to use"
  type        = map(string)
  default = {
    CostCenter = "AWSCB"
    CreatedBy  = "Terraform"
    env        = "demo"
  }
}

variable "region" {
  description = "AWS Region to use"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_name" {
  description = "Name used on VPC"
  type        = string
  default     = "demo"
}

variable "vpc_cidr" {
  description = "CIDR block used on VPC"
  type        = string
  default     = "10.0.0.0/16"
}

