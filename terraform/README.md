# Terraform Configuration for Demo Task API

Provisions an EC2 instance with k3s and deploys the demo task API automatically.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with credentials
- EC2 key pair created in your AWS region (e.g., `quyet-climax-kp`)

## Quick Start

```bash
# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Create resources
terraform apply

# Get outputs (including SSH command and kubeconfig update)
terraform output
```

## Configuration

Edit `terraform.tfvars` to customize:

```hcl
aws_region   = "ap-southeast-2"  # AWS region
instance_type = "t3.micro"        # EC2 instance type
key_name      = "quyet-climax-kp" # EC2 key pair name
owner         = "quyet"           # Owner tag
git_repo      = "https://..."     # Your GitHub repo
```

## What Gets Created

1. **Security Group** — Opens ports 22 (SSH), 6443 (kubectl), 30080 (NodePort)
2. **EC2 Instance** (t3.micro) — Amazon Linux 2023, free tier
3. **Bootstrap Script** — Installs k3s, clones repo, builds Docker image, deploys to k3s

## Post-Deploy

After `terraform apply` completes:

```bash
# Get outputs
terraform output

# Example output:
# ssh_command = "ssh -i ~/.ssh/quyet-climax-kp.pem ec2-user@3.106.132.156"

# SSH to instance
ssh -i ~/.ssh/quyet-climax-kp.pem ec2-user@$(terraform output -raw public_ip)

# Update kubeconfig (run this command on your laptop)
sed -i.bak 's/127.0.0.1/$(terraform output -raw public_ip)/' ~/.kube/config-day31

# Test the API
curl http://$(terraform output -raw public_ip):30080/health
```

## Cleanup

```bash
# Destroy all resources
terraform destroy

# Confirm with 'yes'
```

## Best Practices Applied

✅ Infrastructure as Code (IaC)  
✅ Modular configuration (main.tf, variables.tf)  
✅ Default tags for all resources  
✅ Auto-retrieve latest Amazon Linux 2023 AMI  
✅ Security group allows only necessary ports  
✅ Bootstrap automation via user_data  
✅ State file tracked in .gitignore  
✅ Outputs for common operations  

## Week 4 Learning

This Terraform config demonstrates:
- Provider configuration
- Resource provisioning (EC2, Security Group)
- Data sources (AMI lookup)
- Variables and outputs
- User data scripting
- Tagging strategy
