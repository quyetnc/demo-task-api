variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "EC2 Key Pair name (without .pem)"
  type        = string
  default     = "quyet-climax-kp"
}

variable "owner" {
  description = "Owner tag value"
  type        = string
  default     = "quyet"
}

variable "day" {
  description = "Day tag value"
  type        = string
  default     = "31"
}

variable "git_repo" {
  description = "Git repository URL to clone"
  type        = string
  default     = "https://github.com/quyetnc/proops2026.git"
}
