locals {
  private_subnets = [for k, v in local.azs : cidrsubnet(var.vpc_cidr, 2, k + 2)]
  public_subnets  = [for k, v in local.azs : cidrsubnet(var.vpc_cidr, 2, k)]
  regional_azs    = [for az in data.aws_availability_zones.available.names : az if !can(regex(".*-[a-z]{3}-\\d{1,2}[a-z]$", az))]
  azs             = slice(local.regional_azs, 0, 2)
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.19"

  name = var.project_name
  cidr = var.vpc_cidr

  azs                   = local.azs
  public_subnets        = local.public_subnets
  private_subnets       = local.private_subnets
  public_subnet_suffix  = "public"
  private_subnet_suffix = "private"

  enable_nat_gateway   = true
  create_igw           = true
  enable_dns_hostnames = true
  single_nat_gateway   = true

  manage_default_network_acl    = true
  default_network_acl_tags      = { Name = "${var.project_name}-default" }
  manage_default_route_table    = true
  default_route_table_tags      = { Name = "${var.project_name}-default" }
  manage_default_security_group = true
  default_security_group_tags   = { Name = "${var.project_name}-default" }

  public_subnet_tags = merge(var.default_tags, {
    "subnet" = "public"
  })
  private_subnet_tags = merge(var.default_tags, {
    "subnet" = "private"
  })

  tags = var.default_tags
}