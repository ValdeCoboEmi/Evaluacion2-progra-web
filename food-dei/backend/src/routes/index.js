const { Router } = require('express');

const router = Router();

// Ruta de prueba: GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'API funcionando' });
});

// TODO: registrar aquí las rutas del proyecto

module.exports = router;
