import { Request, Response, NextFunction } from 'express';

// Logger middleware
const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

export default logger;