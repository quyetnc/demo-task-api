const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const promClient = require('prom-client');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// ============ PROMETHEUS METRICS ============
const register = new promClient.Registry();

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'endpoint', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const dbOperationDuration = new promClient.Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Database operation duration',
  labelNames: ['operation'],
  registers: [register],
});

// ============ DATABASE ============
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ============ ERROR INJECTION ============
let errorMode = false;
let errorRate = 0; // 0 to 1

// ============ MIDDLEWARE ============
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      endpoint: req.route?.path || req.path,
      status: res.statusCode,
    });
    httpRequestDuration.observe(
      {
        method: req.method,
        endpoint: req.route?.path || req.path,
        status: res.statusCode,
      },
      duration
    );
  });
  next();
});

// ============ ROUTES ============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Create task
app.post('/api/tasks', (req, res) => {
  if (Math.random() < errorRate) {
    return res.status(500).json({ error: 'Injected error' });
  }

  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const id = uuidv4();
  const start = Date.now();

  db.run(
    'INSERT INTO tasks (id, title, description) VALUES (?, ?, ?)',
    [id, title, description],
    function (err) {
      const duration = (Date.now() - start) / 1000;
      dbOperationDuration.observe({ operation: 'insert' }, duration);

      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, title, description, status: 'pending' });
    }
  );
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  if (Math.random() < errorRate) {
    return res.status(500).json({ error: 'Injected error' });
  }

  const start = Date.now();

  db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, rows) => {
    const duration = (Date.now() - start) / 1000;
    dbOperationDuration.observe({ operation: 'select' }, duration);

    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Get task by ID
app.get('/api/tasks/:id', (req, res) => {
  if (Math.random() < errorRate) {
    return res.status(500).json({ error: 'Injected error' });
  }

  const start = Date.now();

  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, row) => {
    const duration = (Date.now() - start) / 1000;
    dbOperationDuration.observe({ operation: 'select' }, duration);

    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  if (Math.random() < errorRate) {
    return res.status(500).json({ error: 'Injected error' });
  }

  const { title, description, status } = req.body;
  const start = Date.now();

  db.run(
    'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, description, status, req.params.id],
    function (err) {
      const duration = (Date.now() - start) / 1000;
      dbOperationDuration.observe({ operation: 'update' }, duration);

      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Updated' });
    }
  );
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  if (Math.random() < errorRate) {
    return res.status(500).json({ error: 'Injected error' });
  }

  const start = Date.now();

  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function (err) {
    const duration = (Date.now() - start) / 1000;
    dbOperationDuration.observe({ operation: 'delete' }, duration);

    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  });
});

// Chaos engineering: toggle error mode
app.post('/chaos/error-mode', (req, res) => {
  errorMode = !errorMode;
  res.json({ errorMode, errorRate });
});

// Chaos engineering: set error rate (0-1)
app.post('/chaos/error-rate', (req, res) => {
  errorRate = Math.min(1, Math.max(0, req.body.rate || 0));
  res.json({ errorRate });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Task API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
  console.log(`API: http://localhost:${PORT}/api/tasks`);
});
