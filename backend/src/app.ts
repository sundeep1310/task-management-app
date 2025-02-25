import express from 'express';
import helmet from 'helmet';
import taskRoutes from './routes/taskRoutes';
import errorHandler from './middleware/errorHandler';
import logger from './middleware/logger';
import cors from 'cors';

// Create Express application
const app = express();

// Configure CORS
const allowedOrigins = [
  'https://task-management-app-sundeeps-projects-ad6b82fc.vercel.app',
  'https://task-management-app-mauve-two.vercel.app',
  'https://task-management-app-bice-one.vercel.app/',
  'http://localhost:3000'
];

// Apply CORS middleware first
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Other middleware
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON request body
app.use(logger); // Request logging

// API routes
app.use('/api', taskRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use(errorHandler);

export default app;