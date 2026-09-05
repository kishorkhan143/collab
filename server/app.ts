import express from 'express';
import { authRouter } from './routes/authRoutes';
import { workspaceRouter } from './routes/workspaceRoutes';
import { boardRouter } from './routes/boardRoutes';
import { taskRouter } from './routes/taskRoutes';
import { db } from './db';

export function createExpressApp() {
  const app = express();

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

  // Database reset endpoint
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

  return app;
}
