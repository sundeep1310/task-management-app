const corsMiddleware = (req, res, next) => {
    // Allow specific origins
    const allowedOrigins = [
      'https://task-management-app-bice-one.vercel.app',
      'http://localhost:3000' // Keep for local development
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    return next();
  };
  
  module.exports = corsMiddleware;