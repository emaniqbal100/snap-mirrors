import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { testConnection, closePool } from './config/database.js';
import { sendServerError, sendNotFound } from './utils/response.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import productsRoutes from './routes/products.public.routes.js';
import ordersRoutes from './routes/orders.route.js';
import categoryRoutes from './routes/category.routes.js';
import reviewRoutes from './routes/reviews.routes.js';

const app: Express = express();
app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: config.CORS_CREDENTIALS,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

app.use('/uploads', express.static('uploads'));

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: "Snap's Mirror Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: "Snap's Mirror API",
    version: '1.0.0',
    baseUrl: `${config.BASE_URL}/api`,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments',
      reviews: '/api/reviews',
      admin: '/api/admin',
      categories: '/api/categories',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  sendNotFound(res, `Route ${req.method} ${req.path} not found`);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  sendServerError(res, 'Internal server error', err);
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(config.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   SNAP'S MIRROR BACKEND SERVER        ║
╠════════════════════════════════════════╣
║  🚀 Server running on port ${config.PORT}
║  🌍 Environment: ${config.NODE_ENV}
║  📊 Database: Connected
║  📍 API Base: ${config.BASE_URL}/api
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

startServer();

export default app;