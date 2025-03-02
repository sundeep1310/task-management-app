import 'dotenv/config';
import app from './app';
import { Server } from 'http';
import config from './config';
// Use require for axios to avoid TypeScript error
const axios = require('axios');

// Declare server variable
let server: Server;

// Start the server
function startServer(): void {
  server = app.listen(config.port, () => {
    console.log(`Server is running in ${config.nodeEnv} mode`);
    console.log(`Port: ${config.port}`);
    console.log(`Data Directory: ${config.dataDir}`);
    console.log(`API is available at http://localhost:${config.port}/api`);
    console.log(`Allowed origins: ${config.allowedOrigins.join(', ')}`);
  });
}

// Keep the server alive to prevent Render from sleeping
function setupKeepAlive(): void {
  if (config.isProd && process.env.KEEP_ALIVE === 'true') {
    const serverUrl = process.env.SERVER_URL || `http://localhost:${config.port}`;
    console.log(`Setting up keep-alive for: ${serverUrl}`);
    
    // Ping the server every 14 minutes to prevent it from sleeping
    setInterval(async () => {
      try {
        const response = await axios.get(`${serverUrl}/health`);
        console.log(`Keep-alive ping successful: ${response.status}`);
      } catch (error) {
        console.error('Keep-alive ping failed:', error);
      }
    }, 14 * 60 * 1000); // 14 minutes
  }
}

// Graceful shutdown
function gracefulShutdown(): void {
  console.log('Received shutdown signal');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds if not closed gracefully
    setTimeout(() => {
      console.error('Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Handle different termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately for unhandled rejections
});

// Start the server
startServer();

// Set up keep-alive to prevent service from sleeping (for render.com)
setupKeepAlive();