const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 10 files.',
        code: 'TOO_MANY_FILES'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      code: err.code
    });
  }

  // Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
        code: 'NOT_FOUND'
      });
    }
    if (err.code === 'PGRST104') {
      return res.status(400).json({
        success: false,
        error: 'Invalid filter parameter',
        code: 'INVALID_FILTER'
      });
    }
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      code: 'DUPLICATE'
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced resource does not exist',
      code: 'FOREIGN_KEY_VIOLATION'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
