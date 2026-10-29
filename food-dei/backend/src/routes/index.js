const { Router } = require('express');
const menuController = require('../controllers/menuController');
const reservaController = require('../controllers/reservaController');
const reservaService = require('../services/reservaService');

const router = Router();

// GET /api/health -> 200 OK. Sirve para comprobar que el servidor está vivo.
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API funcionando' });
});

// Antes de cada petición se libera la reserva si su tiempo ya venció
router.use((req, res, next) => {
  try {
    reservaService.liberarSiExpirada();
    next();
  } catch (error) {
    next(error);
  }
});

// ---- Endpoints obligatorios del enunciado
//Lista el menú
router.get('/menu', menuController.getMenu);      
// Reserva activa + saldo                                        
router.get('/reserva', reservaController.getReserva);                                     
//Agrega un plato
router.post('/reserva/agregar', reservaController.agregarItem);         
//Sube/baja porciones                 
router.put('/reserva/actualizar-porciones/:id', reservaController.actualizarPorciones);   
//Quita un plato
router.delete('/reserva/eliminar/:id', reservaController.eliminarItem);                   

// confirma la reserva (bloquea el stock y descuenta el saldo) ----
router.post('/reserva/confirmar', reservaController.confirmarReserva);

// inicia una reserva nueva cuando la anterior expiró o fue confirmada ----
router.post('/reserva/reiniciar', reservaController.reiniciar);
router.post('/reserva/restablecer', reservaController.restablecer);

module.exports = router;