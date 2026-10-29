const { crearError } = require('../utils/errores');

// Inventario en memoria. Lo comparte reservaService.
const menuInicial = [
  { id: 101, nombre: 'Menú Ejecutivo (Pollo)', precio: 5.5, stock: 12, categoria: 'Fuerte' },
  { id: 102, nombre: 'Pasta Alfredo', precio: 4.75, stock: 8, categoria: 'Fuerte' },
  { id: 103, nombre: 'Ensalada César', precio: 3.25, stock: 5, categoria: 'Entrada' },
  { id: 104, nombre: 'Jugo Natural', precio: 1.5, stock: 20, categoria: 'Bebida' },
  { id: 105, nombre: 'Tres Leches', precio: 2.75, stock: 0, categoria: 'Postre' },
  { id: 106, nombre: 'Sopa de Res', precio: 3.0, stock: 6, categoria: 'Entrada' },
  { id: 107, nombre: 'Carne Asada', precio: 6.5, stock: 10, categoria: 'Fuerte' },
  { id: 108, nombre: 'Dedos de Queso', precio: 3.5, stock: 15, categoria: 'Entrada' },
  { id: 109, nombre: 'Limonada con Hierbabuena', precio: 1.75, stock: 25, categoria: 'Bebida' },
  { id: 110, nombre: 'Flan de Caramelo', precio: 2.5, stock: 8, categoria: 'Postre' },
  { id: 111, nombre: 'Pechuga a la Plancha', precio: 5.0, stock: 14, categoria: 'Fuerte' },
  { id: 112, nombre: 'Crema de Loroco', precio: 2.75, stock: 10, categoria: 'Entrada' },
  { id: 113, nombre: 'Horchata', precio: 1.25, stock: 30, categoria: 'Bebida' },
  { id: 114, nombre: 'Brownie con Helado', precio: 3.0, stock: 7, categoria: 'Postre' },
  { id: 115, nombre: 'Camarones al Ajillo', precio: 7.25, stock: 5, categoria: 'Fuerte' }
];

// copia del inicial, para poder volver a los valores de fábrica.
const menu = menuInicial.map((plato) => ({ ...plato }));

// Devuelve una COPIA del menú
function obtenerMenu() {
  return menu.map((plato) => ({ ...plato }));
}

// Busca un plato por id. Devuelve el objeto o null si no existe.
function buscarPlato(id) {
  return menu.find((plato) => plato.id === id) || null;
}

// Suma unidades al stock (usado al eliminar un ítem, bajar porciones o al expirar la reserva).
function devolverStock(id, cantidad) {
  const plato = buscarPlato(id);

  if (!plato) {
    throw new Error(`El platillo ${id} no existe en el menú.`);
  }

  plato.stock += cantidad;
  return plato.stock;
}

// Resta unidades al stock. Lanza 404 si el plato no existe y 400 "Stock insuficiente" si no alcanza.
function tomarStock(id, cantidad) {
  const plato = buscarPlato(id);

  if (!plato) {
    throw crearError(404, `El platillo con id ${id} no existe en el menú.`);
  }

  if (plato.stock < cantidad) {
    throw crearError(400, 'Stock insuficiente');
  }

  plato.stock -= cantidad;
  return plato.stock;
}

// Rollback: vuelve el stock al valor de una copia previa obtenida con obtenerMenu().
// Restablece el stock de todos los platos a su valor inicial (reinicio total).
function restablecerMenu() {
  menuInicial.forEach((original) => {
    const plato = buscarPlato(original.id);
    if (plato) plato.stock = original.stock;
  });
}

function restaurarMenu(copia) {
  copia.forEach((platoCopia) => {
    const plato = buscarPlato(platoCopia.id);
    if (plato) plato.stock = platoCopia.stock;
  });
}

module.exports = { obtenerMenu, buscarPlato, devolverStock, tomarStock, restaurarMenu, restablecerMenu };