#!/bin/bash
set -e

echo "=== Starting EC2 bootstrap for k3s ==="

# Update system
sudo yum update -y

# Install git and docker
sudo yum install -y git docker

# Start docker
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group
sudo usermod -aG docker ec2-user

# Install k3s
echo "Installing k3s..."
curl -sfL https://get.k3s.io | sh -

# Wait for k3s to be ready
sleep 10
sudo systemctl status k3s

# Clone repo and deploy app
echo "Cloning repository..."
cd /home/ec2-user
git clone ${git_repo}
cd proops2026/demo-task-api

# Build Docker image
echo "Building Docker image..."
docker build -t task-api:latest .

# Deploy to k3s
echo "Deploying to k3s..."
kubectl apply -f k8s-deployment.yaml

# Wait for pods
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=task-api -n demo --timeout=60s || true

# Show status
echo "=== Deployment complete ==="
kubectl get pods -n demo
kubectl get svc -n demo
echo "Task API available at http://$(hostname -I | awk '{print $1}'):30080/api/tasks"

echo "Bootstrap complete!"
