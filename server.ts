import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/routes/authRoutes';
import { workspaceRouter } from './server/routes/workspaceRoutes';
import { boardRouter } from './server/routes/boardRoutes';
import { taskRouter } from './server/routes/taskRoutes';
import { db } from './server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'CollabBoard API',
      timestamp: new Date().toISOString(),
    });
  });

  // Database reset endpoint (for testing/demo purposes)
  app.post('/api/reset-demo', (_req, res) => {
    db.resetToDefaults();
    res.json({ message: 'Database reset to default seed data successfully' });
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/workspaces', workspaceRouter);
  app.use('/api/boards', boardRouter);
  app.use('/api/tasks', taskRouter);

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ message: err?.message || 'Internal Server Error' });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CollabBoard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
