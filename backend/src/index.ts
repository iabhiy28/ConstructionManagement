import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client interactions
app.use(cors({
  origin: '*', // Allow all origins for dev testing
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bypass-auth', 'x-mock-role', 'x-mock-user-id']
}));

app.use(express.json());

// Custom rate limiting middleware to protect endpoints
const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const maxRequestsPerWindow = 100;
const ipRequestCounts: { [ip: string]: { count: number; resetTime: number } } = {};

app.use((req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  if (!ipRequestCounts[ip] || now > ipRequestCounts[ip].resetTime) {
    ipRequestCounts[ip] = {
      count: 1,
      resetTime: now + rateLimitWindowMs
    };
    return next();
  }

  ipRequestCounts[ip].count++;

  if (ipRequestCounts[ip].count > maxRequestsPerWindow) {
    return res.status(429).json({ 
      error: 'Too many requests from this address. Rate limit exceeded, please retry in 15 minutes.' 
    });
  }

  next();
});

// Access logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register API Routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'Connected (Dual-Mode)' });
});

// Export app for Vercel serverless runtime
export default app;

// Run Server (only when not in serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` BuildFlow AI Backend Server active!     `);
    console.log(` Port: http://localhost:${PORT}          `);
    console.log(` Mode: TypeScript Development            `);
    console.log(`========================================`);
  });
}
