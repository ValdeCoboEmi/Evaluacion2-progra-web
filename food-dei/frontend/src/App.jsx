import { useEffect, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import PanelSuperior from './components/PanelSuperior';
import Bandeja from './components/Bandeja';
import Menu from './components/Menu';
import AlertaError from './components/AlertaError';

const API_URL = import.meta.env.VITE_API_URL;

// Petición al backend con promesas (async/await). Si el servidor rechaza la petición
// (404, 409, 400...) lanza un Error con el mensaje de la regla de negocio.
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
  const [error, setError] = useState(null);

  const mostrarError = (mensaje) => setError({ id: Date.now(), mensaje });

  // Guarda la reserva y calcula cuándo vence usando los segundos que informa el servidor
  // (así no dependemos de que el reloj del navegador coincida con el del servidor).
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

  useEffect(() => {
    cargarDatos();
  }, []);

  // POST /api/reserva/agregar  (Endpoint 3)
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

  // DELETE /api/reserva/eliminar/:id
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

  // El contador llegó a 0: se consulta al servidor, que libera el stock y marca la reserva expirada.
  const manejarExpiracion = async () => {
    const reservaActual = await cargarDatos();

    if (reservaActual?.estado === 'expirada') {
      mostrarError('Tu reserva expiró y los platillos volvieron al stock. Inicia una nueva reserva.');
    }
  };

  // POST /api/reserva/reiniciar
  const reiniciarReserva = async () => {
    setError(null);

    try {
      aplicarReserva(await request('/reserva/reiniciar', { method: 'POST' }));
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
              estado={reserva.estado}
              cargando={cargando}
              quitandoId={quitandoId}
              onQuitar={quitarItem}
              onReiniciar={reiniciarReserva}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
