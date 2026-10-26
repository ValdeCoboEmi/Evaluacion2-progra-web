const menuService = require('./menuService');

// Tiempo máximo de la reserva (segundos). Se puede cambiar en backend/.env
const TTL_SEGUNDOS = Number(process.env.RESERVA_TTL_SEGUNDOS) || 300;
const SALDO_INICIAL = Number(process.env.SALDO_INICIAL) || 25;

// Estado de la reserva del usuario, en memoria.
const reserva = {
  saldoInicial: SALDO_INICIAL,
  items: [], // [{ id, cantidad }]
  estado: 'activa', // 'activa' | 'expirada'
  expiraEn: 0, // timestamp (ms)
};

// ---------- Utilidades ----------

function crearError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

const redondear = (numero) => Math.round(numero * 100) / 100;

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

function iniciarVentanaDeTiempo() {
  reserva.estado = 'activa';
  reserva.expiraEn = Date.now() + TTL_SEGUNDOS * 1000;
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

// Inicia una reserva nueva. Si había ítems activos, devuelve sus unidades al stock.
function reiniciarReserva() {
  ejecutarAtomico(() => {
    reserva.items.forEach((item) => menuService.devolverStock(item.id, item.cantidad));
    reserva.items = [];
    iniciarVentanaDeTiempo();
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
function eliminarItem(id) {
  if (reserva.estado === 'expirada') {
    throw crearError(409, 'Tu reserva expiró. Inicia una nueva reserva para continuar.');
  }

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

// ---------- Datos de demostración (solo si DEMO_SEED=true en .env) ----------
// Precarga 2 ítems para poder probar la eliminación mientras B no tenga POST /agregar.
// Borrar este bloque (y DEMO_SEED del .env) cuando el equipo integre todo.
function sembrarDemo() {
  [
    { id: 101, cantidad: 2 },
    { id: 102, cantidad: 1 },
  ].forEach((item) => {
    menuService.tomarStock(item.id, item.cantidad);
    reserva.items.push(item);
  });
}

iniciarVentanaDeTiempo();

if (process.env.DEMO_SEED === 'true') {
  sembrarDemo();
}

module.exports = {
  crearError,
  liberarSiExpirada,
  reiniciarReserva,
  obtenerVistaReserva,
  eliminarItem,
};
