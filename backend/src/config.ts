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
    'https://task-management-mdkrowuty-sundeeps-projects-ad6b82fc.vercel.app',
    'https://task-management-app-sandy-omega.vercel.app',
    'https://task-management-app-bice-one.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  isProd: process.env.NODE_ENV === 'production'
};

export default config;