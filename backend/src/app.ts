import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import taskRoutes from './routes/taskRoutes';
import errorHandler from './middleware/errorHandler';
import logger from './middleware/logger';
import cors from 'cors';
import config from './config';

// Create Express application
const app = express();

// Log CORS configuration on startup
console.log('Configured allowed origins:', config.allowedOrigins);

// Configure CORS middleware
const corsOptions: cors.CorsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, Postman, or curl requests)
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (config.allowedOrigins.includes(origin)) {
      console.log(`Allowing request from origin: ${origin}`);
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.warn(`CORS blocked for origin: ${origin}`);
    console.warn('Allowed origins are:', config.allowedOrigins);
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
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply middleware
app.use(cors(corsOptions)); // CORS must be first

// Special route for health checks with more permissive CORS
app.get('/health', (req: Request, res: Response) => {
  // Add CORS headers manually for health endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodeEnv: config.nodeEnv,
    allowedOrigins: config.allowedOrigins
  });
});

// Apply remaining middleware
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(logger); // Request logging

// Enable preflight requests for all routes
app.options('*', cors(corsOptions));

// API routes
app.use('/api', taskRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler (should be last)
app.use(errorHandler);

export default app;