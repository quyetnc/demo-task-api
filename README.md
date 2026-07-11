# Demo Task API

A minimal task management API for studying observability, alerting, and CI/CD.

## Features

- REST API for CRUD operations on tasks
- SQLite in-memory database
- Prometheus metrics (`/metrics`)
- Health check endpoint (`/health`)
- Chaos engineering: error injection via `/chaos/error-rate` and `/chaos/error-mode`
- Structured logging with timestamps

## Local Development

```bash
npm install
node server.js
```

API runs on `http://localhost:3000`

### Endpoints

- `GET /health` — health check
- `GET /metrics` — Prometheus metrics
- `POST /api/tasks` — create task
- `GET /api/tasks` — list all tasks
- `GET /api/tasks/:id` — get task by ID
- `PUT /api/tasks/:id` — update task
- `DELETE /api/tasks/:id` — delete task
- `POST /chaos/error-rate` — set error rate (0-1)
- `POST /chaos/error-mode` — toggle error mode

### Test Locally

```bash
# Health
curl http://localhost:3000/health

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Study Day 32","description":"Create alerts"}'

# Get metrics
curl http://localhost:3000/metrics | grep http_requests_total
```

## Docker

```bash
docker build -t task-api:latest .
docker run -p 3000:3000 task-api:latest
```

## Kubernetes

```bash
# Build and load into k3s
docker build -t task-api:latest .

# Deploy
kubectl apply -f k8s-deployment.yaml

# Verify
kubectl get pods -n demo
kubectl port-forward -n demo svc/task-api 3000:3000
```

## Study Purposes

- **Day 31 (Observability)**: Monitor metrics with Grafana Cloud
- **Day 32 (Alerting)**: Create alerts on error rate > 5%
- **Day 33+ (CI/CD)**: Automated deployment, versioning, rollbacks
