import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import taskRoutes from './routes/taskRoutes';
import errorHandler from './middleware/errorHandler';
import logger from './middleware/logger';

// Create Express application
const app = express();
const corsMiddleware = require('./middleware/corsMiddleware');

// Middleware
app.use(corsMiddleware);
app.use(helmet()); // Security headers
app.use(cors({
    origin: ['https://task-management-app-sundeeps-projects-ad6b82fc.vercel.app/', 'https://task-management-app-mauve-two.vercel.app/', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })); // Enable CORS for frontend
app.use(express.json()); // Parse JSON request body
app.use(logger); // Request logging

// API routes
app.use('/', taskRoutes);

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