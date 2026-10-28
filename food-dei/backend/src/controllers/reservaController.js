const reservaService = require('../services/reservaService');
const { crearError } = require('../utils/errores');

// Un "entero positivo" válido: 1, 2, 3... (rechaza texto, decimales, 0 y negativos).
const esEnteroPositivo = (valor) => Number.isInteger(valor) && valor >= 1;

// Si el error ya trae código (400, 404, 409) se reenvía tal cual;
// si no, es un fallo inesperado: se registra y se responde 500.
function manejarError(error, ruta, mensaje500, next) {
  if (error.status) return next(error);

  console.error(`[${ruta}]`, error);
  return next(crearError(500, mensaje500));
}

// GET /api/reserva
//  200 OK -> { saldo, itemsReservados, total, estado, segundosRestantes }
function getReserva(req, res, next) {
  try {
    return res.status(200).json(reservaService.obtenerVistaReserva());
  } catch (error) {
    return manejarError(error, 'GET /api/reserva', 'No se pudo obtener tu reserva.', next);
  }
}

// POST /api/reserva/agregar   body: { alimentoId, cantidad }
//  201 Created     -> el plato se agregó a la reserva
//  400 Bad Request -> datos inválidos, "Stock insuficiente" o "Saldo insuficiente..."
//  404 Not Found   -> el platillo no existe en el menú
//  409 Conflict    -> la reserva ya expiró o ya fue confirmada
function agregarItem(req, res, next) {
  try {
    const { alimentoId, cantidad } = req.body ?? {};
    const id = Number(alimentoId);
    const unidades = Number(cantidad);

    if (!esEnteroPositivo(id) || !esEnteroPositivo(unidades)) {
      throw crearError(400, 'alimentoId y cantidad deben ser números enteros positivos.');
    }

    const agregado = reservaService.agregarItem(id, unidades);

    return res.status(201).json({
      status: 'success',
      message: 'Platillo agregado a tu reserva.',
      agregado,
      reserva: reservaService.obtenerVistaReserva(),
    });
  } catch (error) {
    return manejarError(
      error,
      'POST /api/reserva/agregar',
      'No se pudo agregar el platillo. Intenta de nuevo.',
      next,
    );
  }
}

// PUT /api/reserva/actualizar-porciones/:id   body: { cantidad }
//  200 OK          -> porciones actualizadas
//  400 Bad Request -> datos inválidos, "Stock insuficiente" o "Saldo insuficiente para esta cantidad"
//  404 Not Found   -> el platillo no está en la reserva
//  409 Conflict    -> la reserva ya expiró o ya fue confirmada
function actualizarPorciones(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cantidad = Number(req.body?.cantidad);

    if (!esEnteroPositivo(id) || !esEnteroPositivo(cantidad)) {
      throw crearError(400, 'El id y la cantidad deben ser números enteros positivos.');
    }

    const actualizado = reservaService.actualizarPorciones(id, cantidad);

    return res.status(200).json({
      status: 'success',
      message: 'Porciones actualizadas.',
      actualizado,
      reserva: reservaService.obtenerVistaReserva(),
    });
  } catch (error) {
    return manejarError(
      error,
      'PUT /api/reserva/actualizar-porciones/:id',
      'No se pudieron actualizar las porciones. Intenta de nuevo.',
      next,
    );
  }
}

// DELETE /api/reserva/eliminar/:id
//  200 OK          -> platillo eliminado y unidades devueltas al stock
//  400 Bad Request -> id inválido
//  404 Not Found   -> el platillo no está en la reserva
//  409 Conflict    -> la reserva ya expiró o ya fue confirmada
// Se responde 200 con cuerpo (y no 204) porque el frontend necesita la reserva actualizada.
function eliminarItem(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!esEnteroPositivo(id)) {
      throw crearError(400, 'El id del platillo debe ser un número entero positivo.');
    }

    const liberado = reservaService.eliminarItem(id);

    return res.status(200).json({
      status: 'success',
      message: 'Platillo eliminado de tu reserva. Las unidades volvieron al stock.',
      liberado,
      reserva: reservaService.obtenerVistaReserva(),
    });
  } catch (error) {
    return manejarError(
      error,
      'DELETE /api/reserva/eliminar/:id',
      'No se pudo eliminar el platillo de la reserva. Intenta de nuevo en unos segundos.',
      next,
    );
  }
}

// POST /api/reserva/confirmar
//  200 OK          -> reserva confirmada: stock bloqueado y saldo descontado
//  400 Bad Request -> la reserva está vacía
//  409 Conflict    -> la reserva ya expiró o ya estaba confirmada
function confirmarReserva(req, res, next) {
  try {
    const confirmada = reservaService.confirmarReserva();

    return res.status(200).json({
      status: 'success',
      message: 'Reserva confirmada. ¡Buen provecho!',
      confirmada,
      reserva: reservaService.obtenerVistaReserva(),
    });
  } catch (error) {
    return manejarError(
      error,
      'POST /api/reserva/confirmar',
      'No se pudo confirmar la reserva. Intenta de nuevo.',
      next,
    );
  }
}

// POST /api/reserva/reiniciar
//  200 OK -> reserva nueva con el tiempo reiniciado (devuelve las unidades al stock)
function reiniciar(req, res, next) {
  try {
    reservaService.reiniciarReserva();

    return res.status(200).json({
      status: 'success',
      message: 'Nueva reserva iniciada.',
      reserva: reservaService.obtenerVistaReserva(),
    });
  } catch (error) {
    return manejarError(
      error,
      'POST /api/reserva/reiniciar',
      'No se pudo iniciar una nueva reserva. Intenta de nuevo.',
      next,
    );
  }
}

module.exports = { getReserva, agregarItem, actualizarPorciones, eliminarItem, confirmarReserva, reiniciar };