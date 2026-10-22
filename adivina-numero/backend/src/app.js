const express = require('express');
const cors = require('cors');
const routes = require('./routes');

function createApp() {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('El origen no está permitido por CORS.'));
    },
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', routes);

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
      status: 'error',
      message: error.message || 'Ocurrió un error inesperado.',
    });
  });

  return app;
}

module.exports = createApp;
