import 'dotenv/config';
import app from './app';

// Define server port
const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on ${process.env.NODE_ENV} mode`);
  console.log(`Port: ${PORT}`);
  console.log(`API is available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});