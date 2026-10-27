const { Router } = require('express');
const menuController = require('../controllers/menuController');
const reservaController = require('../controllers/reservaController');
const reservaService = require('../services/reservaService');

const router = Router();

// Ruta de prueba: GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'API funcionando' });
});

// Antes de cada petición se libera la reserva si su tiempo ya venció
// (ver la justificación en reservaService.liberarSiExpirada).
router.use((req, res, next) => {
  try {
    reservaService.liberarSiExpirada();
    next();
  } catch (error) {
    next(error);
  }
});

router.get('/menu', menuController.getMenu);
router.get('/reserva', reservaController.getReserva);
router.post('/reserva/reiniciar', reservaController.reiniciar);
router.delete('/reserva/eliminar/:id', reservaController.eliminarItem);
router.post('/reserva/agregar', reservaController.agregarItem);

// TODO PUT /reserva/actualizar-porciones/:id

module.exports = router;
