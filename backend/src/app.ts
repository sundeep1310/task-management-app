import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import taskRoutes from './routes/taskRoutes';
import errorHandler from './middleware/errorHandler';
import logger from './middleware/logger';
import cors from 'cors';
import config from './config';

// Create Express application
const app = express();

// Configure CORS middleware
const corsOptions: cors.CorsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked for origin: ${origin}`);
    const msg = 'The CORS policy for this site does not allow access from the specified origin.';
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Access-Control-Allow-Origin', 
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply middleware
app.use(cors(corsOptions)); // CORS must be first
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(logger); // Request logging

// Enable preflight requests for all routes
app.options('*', cors(corsOptions));

// API routes
app.use('/api', taskRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodeEnv: config.nodeEnv,
    allowedOrigins: config.allowedOrigins
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler (should be last)
app.use(errorHandler);

export default app;