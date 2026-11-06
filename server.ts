import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiHandler from './api/index';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Forward all /api requests to apiHandler with full error catching
app.use('/api', async (req, res) => {
  try {
    await apiHandler(req, res);
  } catch (error: any) {
    console.error('API Error in server.ts:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || 'Internal Server Error' });
    }
  }
});

async function startServer() {
  if (process.env.VERCEL || process.env.NOW_REGION) return;

  const distPath = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(indexHtmlPath));
  }

  app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
}

startServer().catch((error) => console.error('Failed to start server:', error));
export default app;
