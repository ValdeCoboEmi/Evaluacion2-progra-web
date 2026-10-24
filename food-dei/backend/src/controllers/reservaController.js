const reservaService = require('../services/reservaService');

// GET /api/reserva  (versión mínima; cambiarlo al que le toca)
function getReserva(req, res, next) {
  try {
    return res.json(reservaService.obtenerVistaReserva());
  } catch (error) {
    return next(error);
  }
}

// DELETE /api/reserva/eliminar/:id
function eliminarItem(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'El id del platillo debe ser un número entero positivo.',
      });
    }

    const liberado = reservaService.eliminarItem(id);

    return res.json({
      message: 'Platillo eliminado de tu reserva. Las unidades volvieron al stock.',
      liberado,
      reserva: reservaService.obtenerVistaReserva(),
    });
  } catch (error) {
    if (error.status) {
      return next(error);
    }

    // Cualquier otro fallo 500 
    //se guarda en el log
    console.error('[DELETE /api/reserva/eliminar/:id]', error);
    return next(
      reservaService.crearError(
        500,
        'No se pudo eliminar el platillo de la reserva. Intenta de nuevo en unos segundos.',
      ),
    );
  }
}

// POST /api/reserva/reiniciar  
function reiniciar(req, res, next) {
  try {
    reservaService.reiniciarReserva();
    return res.json(reservaService.obtenerVistaReserva());
  } catch (error) {
    console.error('[POST /api/reserva/reiniciar]', error);
    return next(
      reservaService.crearError(500, 'No se pudo iniciar una nueva reserva. Intenta de nuevo.'),
    );
  }
}

module.exports = { getReserva, eliminarItem, reiniciar };
