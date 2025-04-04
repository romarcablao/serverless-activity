provider "aws" {
  region = var.region

  default_tags {
    tags = merge(
      var.default_tags,
      {
        Environment = var.environment
      }
    )
  }
}
