// Crea un Error con código HTTP. El manejador de app.js lo convierte en la respuesta JSON.
//  400 -> datos inválidos / regla de negocio (stock o saldo insuficiente)
//  404 -> el recurso no existe
//  409 -> conflicto con el estado actual (reserva expirada o ya confirmada)
function crearError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

module.exports = { crearError };
