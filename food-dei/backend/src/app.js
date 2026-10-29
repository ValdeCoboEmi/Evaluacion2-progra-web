const express = require('express');
const cors = require('cors');
const routes = require('./routes');

// Orígenes permitidos si no existe CORS_ORIGIN en el .env
const ORIGENES_POR_DEFECTO = 'http://localhost:5174,http://127.0.0.1:5174';

// Crea y configura la aplicación Express (se separa de server.js para poder probarla).
function createApp() {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN || ORIGENES_POR_DEFECTO)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // CORS: solo el frontend autorizado puede llamar a la API desde el navegador.
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 403 Forbidden: el origen existe pero no tiene permiso.
      const error = new Error('El origen no está permitido por CORS.');
      error.status = 403;
      return callback(error);
    },
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', routes);

  // 404 Not Found: ninguna ruta coincidió (
  app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Ruta no encontrada.' });
  });

  // Manejador central de errores: todo `next(error)` termina aquí.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    // JSON mal formado en el body -> 400 Bad Request.
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ status: 'error', message: 'El cuerpo de la petición no es un JSON válido.' });
    }

    const status = error.status || 500;
    // En un 500 no se expone el detalle interno al cliente.
    const message = status === 500 ? 'Ocurrió un error inesperado.' : error.message;

    if (status === 500) console.error(error);

    return res.status(status).json({ status: 'error', message });
  });

  return app;
}

module.exports = createApp;