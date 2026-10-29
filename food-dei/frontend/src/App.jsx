import { useEffect, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import PanelSuperior from './components/PanelSuperior';
import Bandeja from './components/Bandeja';
import Menu from './components/Menu';
import AlertaError from './components/AlertaError';

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

async function request(path, options) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'La petición no pudo completarse.');
  }

  return data;
}

// Componente raíz: guarda el estado global (menú, reserva, errores) y reparte funciones a los hijos.
function App() {
  const [menu, setMenu] = useState([]);
  const [reserva, setReserva] = useState({
    saldo: 0,
    itemsReservados: [],
    total: 0,
    estado: 'activa',
    segundosRestantes: 0,
  });
  const [expiraEn, setExpiraEn] = useState(0); // timestamp local en que vence la reserva
  const [cargando, setCargando] = useState(true);
  const [quitandoId, setQuitandoId] = useState(null);
  const [agregandoId, setAgregandoId] = useState(null);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState(null);

  const mostrarError = (mensaje) => setError({ id: Date.now(), mensaje });

  // Guarda la reserva y calcula cuándo vence usando los segundos que informa el servidor
  const aplicarReserva = (datos) => {
    setReserva(datos);
    setExpiraEn(Date.now() + datos.segundosRestantes * 1000);
  };

  // Vuelve a pedir menú y reserva. Devuelve la reserva (o null si falló).
  const cargarDatos = async () => {
    try {
      const [menuActual, reservaActual] = await Promise.all([
        request('/menu'),
        request('/reserva'),
      ]);

      setMenu(menuActual);
      aplicarReserva(reservaActual);
      return reservaActual;
    } catch (fallo) {
      mostrarError(fallo.message);
      return null;
    } finally {
      setCargando(false);
    }
  };

  // Al abrir la página (GET /api/menu y GET /api/reserva = Endpoints 1 y 2).
  useEffect(() => {
    cargarDatos();
  }, []);

  // POST /api/reserva/agregar  (Endpoint 3). Responde 201; si falta stock o saldo, 400 -> catch.
  const agregarPlato = async (alimentoId) => {
    setAgregandoId(alimentoId);
    setError(null);

    try {
      const resultado = await request('/reserva/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alimentoId, cantidad: 1 }),
      });

      aplicarReserva(resultado.reserva);
      setMenu(await request('/menu'));
    } catch (fallo) {
      mostrarError(fallo.message);
      await cargarDatos();
    } finally {
      setAgregandoId(null);
    }
  };

  // DELETE /api/reserva/eliminar/:id  (Endpoint 5). Responde 200; si no existe en la reserva, 404 -> catch.
  const quitarItem = async (id) => {
    setQuitandoId(id);
    setError(null);

    try {
      const resultado = await request(`/reserva/eliminar/${id}`, { method: 'DELETE' });

      aplicarReserva(resultado.reserva);
      setMenu(await request('/menu')); // el stock del platillo ya volvió al inventario
    } catch (fallo) {
      mostrarError(fallo.message);
      await cargarDatos(); // re-sincroniza por si el carrito estaba desactualizado
    } finally {
      setQuitandoId(null);
    }
  };

  // PUT /api/reserva/actualizar-porciones/:id  (Endpoint 4). Responde 200; 400 si no hay saldo o stock.
  const actualizarPorciones = async (id, nuevaCantidad) => {
    setActualizandoId(id);
    setError(null);

    try {
      const resultado = await request(`/reserva/actualizar-porciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });

      aplicarReserva(resultado.reserva);
      setMenu(await request('/menu')); // el stock visual del menú cambia
    } catch (fallo) {
      mostrarError(fallo.message); // aquí llega "Saldo insuficiente para esta cantidad"
      await cargarDatos();
    } finally {
      setActualizandoId(null);
    }
  };

  // El contador llegó a 0: se consulta al servidor, que libera el stock y marca la reserva expirada.
  const manejarExpiracion = async () => {
    const reservaActual = await cargarDatos();

    if (reservaActual?.estado === 'expirada') {
      mostrarError('Tu reserva expiró y los platillos volvieron al stock. Inicia una nueva reserva.');
    }
  };

  // POST /api/reserva/confirmar. Bloquea el stock y descuenta el saldo; responde 200.
  // Si la reserva está vacía responde 400 y el mensaje se muestra en <AlertaError>.
  const confirmarReserva = async () => {
    setConfirmando(true);
    setError(null);

    try {
      const resultado = await request('/reserva/confirmar', { method: 'POST' });

      aplicarReserva(resultado.reserva);
      setMenu(await request('/menu'));
    } catch (fallo) {
      mostrarError(fallo.message);
      await cargarDatos();
    } finally {
      setConfirmando(false);
    }
  };

  // POST /api/reserva/reiniciar. Inicia una reserva nueva cuando la anterior expiró o se confirmó.
  const reiniciarReserva = async () => {
    setError(null);

    try {
      const resultado = await request('/reserva/reiniciar', { method: 'POST' });

      aplicarReserva(resultado.reserva);
      setMenu(await request('/menu'));
    } catch (fallo) {
      mostrarError(fallo.message);
    }
  };

  // POST /api/reserva/restablecer. Vuelve todo a cero: saldo inicial, stock inicial, reserva nueva.
// Se pide confirmación porque borra el progreso actual.
const restablecerTodo = async () => {
  if (!window.confirm('¿Restablecer todo desde cero? Se pierde tu reserva y el saldo vuelve a su valor inicial.')) {
    return;
  }

  setError(null);

  try {
    const resultado = await request('/reserva/restablecer', { method: 'POST' });

    aplicarReserva(resultado.reserva);
    setMenu(await request('/menu'));
  } catch (fallo) {
    mostrarError(fallo.message);
  }
};

  // Une cada ítem de la reserva ({ id, cantidad }) con los datos del menú.
  const itemsDetallados = reserva.itemsReservados.map((item) => {
    const plato = menu.find((candidato) => candidato.id === item.id);

    return {
      ...item,
      nombre: plato ? plato.nombre : `Platillo #${item.id}`,
      precio: plato ? plato.precio : 0,
    };
  });

  return (
    <>
      <PanelSuperior
        saldo={reserva.saldo}
        total={reserva.total}
        estado={reserva.estado}
        expiraEn={expiraEn}
        onExpira={manejarExpiracion}
        onRestablecer={restablecerTodo}
      />

      <Container className="py-3">
        <AlertaError error={error} />

        <Row className="mt-3">
          <Col xs="12" lg="8" className="mb-3">
            <Menu
              menu={menu}
              estado={reserva.estado}
              cargando={cargando}
              agregandoId={agregandoId}
              onAgregar={agregarPlato}
            />
          </Col>
          <Col xs="12" lg="4">
            <Bandeja
              items={itemsDetallados}
              total={reserva.total}
              saldo={reserva.saldo}
              estado={reserva.estado}
              cargando={cargando}
              quitandoId={quitandoId}
              actualizandoId={actualizandoId}
              onQuitar={quitarItem}
              onCambiarPorciones={actualizarPorciones}
              onReiniciar={reiniciarReserva}
              onConfirmar={confirmarReserva}
              confirmando={confirmando}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;