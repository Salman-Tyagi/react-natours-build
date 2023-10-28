import AppError from '../utils/appError.js';

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateErrorDB = err => {
  const duplicates = Object.keys(err.keyValue)
    .map(key => `${key}: ${err.keyValue[key]}`)
    .join('. ');
  const message = `Duplicate value ${duplicates}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const message = Object.values(err.errors)
    .map(el => el.message)
    .join('. ');
  return new AppError(message, 400);
};

const handleJWTExpireError = () =>
  new AppError('Token expired! Please login again.', 401);

const handleJWTTokenError = () =>
  new AppError('Invalid token! Please login again.', 401);

const sendErrorDev = (err, req, res) => {
  // API Error
  console.log('ERROR ❌', err);
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Render error
  else {
    res.status(err.statusCode).render('error', {
      msg: err.message,
      title: 'Page not found',
      user: req.user,
    });
  }
};

const sendErrorPro = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.log('ERROR ❌', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    let error = err;

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateErrorDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError();
    if (err.name === 'JsonWebTokenError') error = handleJWTTokenError();

    sendErrorDev(error, req, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let error = err;

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateErrorDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError();
    if (err.name === 'JsonWebTokenError') error = handleJWTTokenError();

    sendErrorPro(error, req, res);
  }
};

export default globalErrorHandler;
