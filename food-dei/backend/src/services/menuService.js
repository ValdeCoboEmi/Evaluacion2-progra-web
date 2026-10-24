// Inventario en memoria. Lo comparte reservaService.
// MODIFICAR ARCHIVO AL RESPONSABLE, esto solo fue de prube para hacer funcional el eliminar

const menu = [
  { id: 101, nombre: 'Menú Ejecutivo (Pollo)', precio: 5.5, stock: 12, categoria: 'Fuerte' },
  { id: 102, nombre: 'Pasta Alfredo', precio: 4.75, stock: 8, categoria: 'Fuerte' },
  { id: 103, nombre: 'Ensalada César', precio: 3.25, stock: 5, categoria: 'Entrada' },
  { id: 104, nombre: 'Jugo Natural', precio: 1.5, stock: 20, categoria: 'Bebida' },
  { id: 105, nombre: 'Tres Leches', precio: 2.75, stock: 0, categoria: 'Postre' },
];

function obtenerMenu() {
  return menu.map((plato) => ({ ...plato }));
}

function buscarPlato(id) {
  return menu.find((plato) => plato.id === id) || null;
}

// Suma unidades al stock (usado al eliminar un ítem o al expirar la reserva).
function devolverStock(id, cantidad) {
  const plato = buscarPlato(id);

  if (!plato) {
    throw new Error(`El platillo ${id} no existe en el menú.`);
  }

  plato.stock += cantidad;
  return plato.stock;
}

// Resta unidades al stock (B puede reutilizarla en POST /reserva/agregar).
function tomarStock(id, cantidad) {
  const plato = buscarPlato(id);

  if (!plato || plato.stock < cantidad) {
    throw new Error('Stock insuficiente');
  }

  plato.stock -= cantidad;
  return plato.stock;
}

// Rollback: vuelve el stock al valor de una copia previa obtenida con obtenerMenu().
function restaurarMenu(copia) {
  copia.forEach((platoCopia) => {
    const plato = buscarPlato(platoCopia.id);
    if (plato) plato.stock = platoCopia.stock;
  });
}

module.exports = { obtenerMenu, buscarPlato, devolverStock, tomarStock, restaurarMenu };
