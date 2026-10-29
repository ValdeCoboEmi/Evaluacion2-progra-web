const { Router } = require('express');
const { guess, reset } = require('../controllers/guessController');

const router = Router();

// Ruta de prueba: GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'API funcionando' });
});

// TODO: registrar aquí las rutas del proyecto
// POST /api/guess -> compara el intento con el número oculto
router.post('/guess', guess);

// POST /api/reset -> genera un nuevo número oculto
router.post('/reset', reset);


module.exports = router;
