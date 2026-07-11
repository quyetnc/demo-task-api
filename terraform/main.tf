terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Owner       = var.owner
      Day         = var.day
      Project     = "proops2026"
      Environment = "study"
      ManagedBy   = "Terraform"
    }
  }
}

# Security Group
resource "aws_security_group" "k3s" {
  name        = "proops2026-k3s-${var.owner}"
  description = "Security group for k3s cluster"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubernetes API"
  }

  ingress {
    from_port   = 30080
    to_port     = 30080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "NodePort for task-api"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "proops2026-k3s"
  }
}

# EC2 Instance
resource "aws_instance" "k3s" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids      = [aws_security_group.k3s.id]
  associate_public_ip_address = true

  root_block_device {
    volume_type           = "gp2"
    volume_size           = 8
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    git_repo = var.git_repo
  }))

  tags = {
    Name = "proops2026-day31-${var.owner}"
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# Data source for Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Outputs
output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.k3s.id
}

output "public_ip" {
  description = "EC2 Public IP Address"
  value       = aws_instance.k3s.public_ip
}

output "public_dns" {
  description = "EC2 Public DNS"
  value       = aws_instance.k3s.public_dns
}

output "security_group_id" {
  description = "Security Group ID"
  value       = aws_security_group.k3s.id
}

output "ssh_command" {
  description = "SSH command to connect to instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_instance.k3s.public_ip}"
}

output "kubeconfig_update" {
  description = "Command to update kubeconfig with new IP"
  value       = "sed -i.bak 's/127.0.0.1/${aws_instance.k3s.public_ip}/' ~/.kube/config-day31"
}
