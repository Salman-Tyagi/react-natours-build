import mongoose from 'mongoose';
import app from './app.js';

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXECPTION, app is terminating');
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
// const DB = process.env.DATABASE;

(async () => {
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
  }
  await mongoose.connect(DB);
  console.log('DB connected successfully!');
})();

const port = process.env.PORT || 8000;
const server = app.listen(port, () =>
  console.log('Listening to the port', port, 'in', process.env.NODE_ENV)
);

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION, Server shutting down');
  server.close(() => {
    console.log(err.name, err.message);
    process.exit(1);
  });
});

// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, app is shutting down gracefully');
//   server.close(() => console.log('Server closed'));
// });
