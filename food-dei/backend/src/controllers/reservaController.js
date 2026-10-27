const reservaService = require('../services/reservaService');

// GET /api/reserva  -> { saldo, itemsReservados, total, estado, segundosRestantes }
function getReserva(req, res, next) {
  try {
    return res.json(reservaService.obtenerVistaReserva());
  } catch (error) {
    console.error('[GET /api/reserva]', error);
    return next(reservaService.crearError(500, 'No se pudo obtener tu reserva.'));
  }
}

// POST /api/reserva/agregar   body: { alimentoId, cantidad }
function agregarItem(req, res, next) {
  try {
    const { alimentoId, cantidad } = req.body ?? {};
    const id = Number(alimentoId);
    const unidades = Number(cantidad);

    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(unidades) || unidades < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'alimentoId y cantidad deben ser números enteros positivos.',
      });
    }

    const agregado = reservaService.agregarItem(id, unidades);

    return res.status(201).json({
      message: 'Platillo agregado a tu reserva.',
      agregado,
      reserva: reservaService.obtenerVistaReserva(),
    });
  } catch (error) {
    if (error.status) {
      return next(error);
    }

    console.error('[POST /api/reserva/agregar]', error);
    return next(
      reservaService.crearError(500, 'No se pudo agregar el platillo. Intenta de nuevo.'),
    );
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

module.exports = { getReserva, agregarItem, eliminarItem, reiniciar };
