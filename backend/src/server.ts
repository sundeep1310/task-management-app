import 'dotenv/config';
import app from './app';
import { Server } from 'http';

// Define server port
const PORT: number = process.env.PORT 
  ? parseInt(process.env.PORT, 10) 
  : 5000;

// Declare server variable
let server: Server;

// Start the server
function startServer(): void {
  server = app.listen(PORT, () => {
    console.log(`Server is running on ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`Port: ${PORT}`);
    console.log(`API is available at http://localhost:${PORT}/api`);
  });
}

// Graceful shutdown
function gracefulShutdown(): void {
  console.log('Received shutdown signal');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
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

// Start the server
startServer();