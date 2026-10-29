const menuService = require('./menuService');
const { crearError } = require('../utils/errores');

// Tiempo máximo de la reserva (segundos) y saldo del usuario. Se pueden cambiar en backend/.env
const TTL_SEGUNDOS = Number(process.env.RESERVA_TTL_SEGUNDOS) || 300;
const SALDO_INICIAL = Number(process.env.SALDO_INICIAL) || 25;

// Estado de la reserva del usuario, en memoria.
const reserva = {
  saldoInicial: SALDO_INICIAL,
  items: [], // [{ id, cantidad }]
  estado: 'activa', // 'activa' | 'expirada' | 'confirmada'
  expiraEn: 0, // timestamp (ms)
};

// ---------- Utilidades ----------

// Redondea a 2 decimales para evitar errores de coma flotante (ej. 0.1 + 0.2).
const redondear = (numero) => Math.round(numero * 100) / 100;

// Total de la reserva = suma de precio * cantidad de cada ítem (reduce sobre el arreglo).
function calcularTotal() {
  const total = reserva.items.reduce((acumulado, item) => {
    const plato = menuService.buscarPlato(item.id);
    return acumulado + (plato ? plato.precio * item.cantidad : 0);
  }, 0);

  return redondear(total);
}

// "Transacción" en memoria: guarda una copia del stock y de los ítems y, si la
// operación lanza un error, los restaura. Así ambas escrituras (ítem + stock)
// se aplican juntas o no se aplica ninguna. Es síncrona (sin await), por lo que
// ninguna otra petición puede ejecutarse a la mitad
function ejecutarAtomico(operacion) {
  const respaldoMenu = menuService.obtenerMenu();
  const respaldoItems = reserva.items.map((item) => ({ ...item }));
  const respaldoEstado = reserva.estado;

  try {
    return operacion();
  } catch (error) {
    menuService.restaurarMenu(respaldoMenu);
    reserva.items = respaldoItems;
    reserva.estado = respaldoEstado;
    throw error;
  }
}

// Marca la reserva como activa y fija el momento en que vence.
function iniciarVentanaDeTiempo() {
  reserva.estado = 'activa';
  reserva.expiraEn = Date.now() + TTL_SEGUNDOS * 1000;
}

// Solo se puede modificar una reserva activa. 409 Conflict si ya expiró o ya se confirmó.
function validarActiva() {
  if (reserva.estado === 'expirada') {
    throw crearError(409, 'Tu reserva expiró. Inicia una nueva reserva para continuar.');
  }

  if (reserva.estado === 'confirmada') {
    throw crearError(409, 'Tu reserva ya fue confirmada. Inicia una nueva reserva para continuar.');
  }
}

// ---------- Expiración ----------

// DECISIÓN: la expiración se verifica en cada petición
// a /api (ver routes/index.js), y no con un setInterval:
//  - El estado vive en la memoria de un único proceso, así que revisar justo antes de
//    responder garantiza que cualquier lectura (menú o reserva) ya ve el stock liberado.
//  - Como el frontend consulta al llegar a 0, la liberación ocurre al instante en la práctica.
// Es idempotente: solo actúa si la reserva sigue 'activa' y su tiempo ya venció.
function liberarSiExpirada() {
  if (reserva.estado !== 'activa' || Date.now() < reserva.expiraEn) {
    return false;
  }

  ejecutarAtomico(() => {
    reserva.items.forEach((item) => menuService.devolverStock(item.id, item.cantidad));
    reserva.items = [];
    reserva.estado = 'expirada';
  });

  return true;
}

// Confirma la reserva: el stock queda bloqueado definitivamente (ya no vuelve al menú)
// y el total se descuenta del saldo del usuario para las próximas reservas.
// Errores: 409 si ya expiró o ya estaba confirmada, 400 si la reserva está vacía.
function confirmarReserva() {
  validarActiva();

  if (reserva.items.length === 0) {
    throw crearError(400, 'Tu reserva está vacía. Agrega al menos un platillo para confirmar.');
  }

  return ejecutarAtomico(() => {
    const confirmada = {
      items: reserva.items.map((item) => ({ ...item })),
      total: calcularTotal(),
    };

    reserva.saldoInicial = redondear(reserva.saldoInicial - confirmada.total); // el gasto es definitivo
    reserva.items = []; // NO se devuelve stock: los platillos quedaron reservados
    reserva.estado = 'confirmada';

    return confirmada;
  });
}

// Reinicio TOTAL: vuelve todo al estado de fábrica.
// Saldo = SALDO_INICIAL, stock del menú = inicial, reserva vacía y con el tiempo reiniciado.
function restablecerTodo() {
  menuService.restablecerMenu();
  reserva.saldoInicial = SALDO_INICIAL;
  reserva.items = [];
  iniciarVentanaDeTiempo();
}

// Inicia una reserva nueva. Si había ítems activos, devuelve sus unidades al stock.
function reiniciarReserva() {
  ejecutarAtomico(() => {
    reserva.items.forEach((item) => menuService.devolverStock(item.id, item.cantidad));
    reserva.items = [];
    iniciarVentanaDeTiempo();
  });
}

// Agrega a ka reserva.
// Errores: 409 expirada/confirmada, 404 no existe, 400 stock o saldo insuficiente.
function agregarItem(id, cantidad) {
  validarActiva();

  return ejecutarAtomico(() => {
    const stock = menuService.tomarStock(id, cantidad);

    // el total nuevo no puede superar el saldo.
    const plato = menuService.buscarPlato(id);
    const totalNuevo = redondear(calcularTotal() + plato.precio * cantidad);

    if (totalNuevo > reserva.saldoInicial) {
      throw crearError(400, 'Saldo insuficiente para esta cantidad');
    }

    const existente = reserva.items.find((item) => item.id === id);

    if (existente) {
      existente.cantidad += cantidad;
    } else {
      reserva.items.push({ id, cantidad });
    }

    return { id, cantidad, stock };
  });
}

// Cambia la cantidad de porciones de un ítem que ya está en la reserva.
// Errores: 409 expirada/confirmada, 404 no está en la reserva, 400 saldo o stock insuficiente.
function actualizarPorciones(id, nuevaCantidad) {
  validarActiva();

  const item = reserva.items.find((candidato) => candidato.id === id);

  if (!item) {
    throw crearError(404, `El platillo con id ${id} no existe en tu reserva.`);
  }

  const plato = menuService.buscarPlato(id);
  const diferencia = nuevaCantidad - item.cantidad; // positivo = sube, negativo = baja

  //  el total nuevo no puede superar el saldo.
  if (diferencia > 0) {
    const totalNuevo = redondear(calcularTotal() + diferencia * plato.precio);

    if (totalNuevo > reserva.saldoInicial) {
      throw crearError(400, 'Saldo insuficiente para esta cantidad');
    }
  }

  return ejecutarAtomico(() => {
    let stock = plato.stock;

    if (diferencia > 0) {
      stock = menuService.tomarStock(id, diferencia);
    } else if (diferencia < 0) {
      stock = menuService.devolverStock(id, -diferencia);
    }

    item.cantidad = nuevaCantidad;

    return { id, cantidad: nuevaCantidad, stock };
  });
}

// ---------- Consultas y eliminación ----------

// Misma estructura del enunciado ({ saldo, itemsReservados, total }) más estado y tiempo.
// "saldo" = saldo disponible: se descuenta en tiempo real con el total de la reserva.
function obtenerVistaReserva() {
  const total = calcularTotal();
  const segundosRestantes =
    reserva.estado === 'activa'
      ? Math.max(0, Math.ceil((reserva.expiraEn - Date.now()) / 1000))
      : 0;

  return {
    saldo: redondear(reserva.saldoInicial - total),
    itemsReservados: reserva.items.map((item) => ({ id: item.id, cantidad: item.cantidad })),
    total,
    estado: reserva.estado,
    segundosRestantes,
  };
}

// Elimina el platillo de la reserva y devuelve sus unidades al stock (atómico).
// Errores: 409 reserva expirada/confirmada, 404 el platillo no está en la reserva.
function eliminarItem(id) {
  validarActiva();

  const indice = reserva.items.findIndex((item) => item.id === id);

  if (indice === -1) {
    throw crearError(404, `El platillo con id ${id} no existe en tu reserva.`);
  }

  return ejecutarAtomico(() => {
    const [item] = reserva.items.splice(indice, 1);
    const stock = menuService.devolverStock(item.id, item.cantidad);

    return { id: item.id, cantidad: item.cantidad, stock };
  });
}

// Al arrancar el servidor ya existe una reserva activa con su cuenta regresiva.
iniciarVentanaDeTiempo();

module.exports = {
  restablecerTodo,
  confirmarReserva,
  liberarSiExpirada,
  reiniciarReserva,
  obtenerVistaReserva,
  agregarItem,
  actualizarPorciones,
  eliminarItem,
};