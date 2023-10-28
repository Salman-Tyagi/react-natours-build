import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import limit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';

import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import globalErrorHandlerMiddleware from './controllers/globalErrorHandlerMiddleware.js';
import AppError from './utils/appError.js';

dotenv.config({ path: '.env' });

const app = express();

app.set('trust proxy', ip => {
  return true;
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Body-parser, reading data from the req.body object
app.use(express.json({ limit: '10kb' }));
// For payments by third party
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.options('*', cors());

app.use(mongoSanitize());

app.use(
  hpp({
    whitelist: [
      'price',
      'averageRating,',
      'maxGroupSize',
      'duration',
      'difficulty',
    ],
  })
);

const limiter = limit({
  max: 1000,
  windowMs: 24 * 60 * 60 * 1000,
});

app.use(limiter);

// Serve static files
app.use(express.static('public'));

app.use(cookieParser());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(compression());

// Testing middlewares
app.use((req, res, next) => {
  // console.log(req.cookies);
  next();
});

// Routes middleware functions
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Undefined middleware function
app.all('*', (req, res, next) =>
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
);

// Global error handler middleware
app.use(globalErrorHandlerMiddleware);

export default app;
