// src/config.ts
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  dataDir: string;
  allowedOrigins: string[];
  isProd: boolean;
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: process.env.DATA_DIR || './data',
  allowedOrigins: [
    // Your specific Vercel URLs
    'https://task-management-app-sandy-omega.vercel.app',
    'https://task-management-r0pvpvsbg-sundeeps-projects-ad6b82fc.vercel.app',
    // Allow custom origins from environment variable
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    // Local development URLs
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  isProd: process.env.NODE_ENV === 'production'
};

export default config;