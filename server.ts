import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import authRoutes from './routes/auth.ts';
import menuRoutes from './routes/menu.ts';
import transaksiRoutes from './routes/transaksi.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add parser middlewares with custom limits to prevent issues when handling base64 image data
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API routes prefixing
  app.use('/api/auth', authRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/transaksi', transaksiRoutes);

  // Simple Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Serve /src/assets statically so dynamic images stored in database can be requested directly in both dev and prod
  app.use('/src/assets', express.static(path.join(process.cwd(), 'src/assets')));

  // Enable Vite request proxies in development mode.
  // In production, serve the compiled build assets directly.
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kasir Warkop backend server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start Kasir Warkop server:', error);
});
