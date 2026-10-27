import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  ListGroup,
  ListGroupItem,
  Spinner,
} from 'reactstrap';

const moneda = (valor) => `$${Number(valor).toFixed(2)}`;

// Carrito lateral. Props:
//  items: [{ id, nombre, precio, cantidad }]
//  estado: 'activa' | 'expirada'
//  quitandoId: id del ítem que se está eliminando (o null)
//  onQuitar(id), onReiniciar()
function Bandeja({ items, estado, cargando, quitandoId, actualizandoId, onQuitar, onCambiarPorciones, onReiniciar }) {
  // true mientras haya una petición en curso (evita clics repetidos)
  const ocupado = quitandoId !== null || actualizandoId !== null;
  if (estado === 'expirada') {
    return (
      <Card>
        <CardHeader className="bandeja-titulo">Tu Bandeja de Reserva</CardHeader>
        <CardBody>
          <p className="mb-3">
            Tu reserva expiró y los platillos volvieron al stock. Puedes iniciar una nueva.
          </p>
          <Button color="success" onClick={onReiniciar}>
            Iniciar nueva reserva
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bandeja-titulo">Tu Bandeja de Reserva</CardHeader>

      {cargando && (
        <CardBody className="text-center">
          <Spinner size="sm" /> Cargando...
        </CardBody>
      )}

      {!cargando && items.length === 0 && (
        <CardBody className="text-muted">Aún no has agregado platillos a tu reserva.</CardBody>
      )}

      {!cargando && items.length > 0 && (
        <ListGroup flush>
          {items.map((item) => (
            <ListGroupItem
              key={item.id}
              className="d-flex justify-content-between align-items-center gap-2"
            >
              <div>
                <strong>{item.nombre}</strong>
                <div className="small text-muted">
                  {moneda(item.precio)} c/u · {item.cantidad} porción(es)
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {actualizandoId === item.id ? (
                  <span className="small">
                    <Spinner size="sm" /> Cargando...
                  </span>
                ) : (
                  <ButtonGroup size="sm">
                    <Button
                      outline
                      color="secondary"
                      disabled={ocupado || item.cantidad <= 1}
                      onClick={() => onCambiarPorciones(item.id, item.cantidad - 1)}
                    >
                      -
                    </Button>
                    <Button
                      outline
                      color="secondary"
                      disabled={ocupado}
                      onClick={() => onCambiarPorciones(item.id, item.cantidad + 1)}
                    >
                      +
                    </Button>
                  </ButtonGroup>
                )}

                <Button
                  color="danger"
                  outline
                  size="sm"
                  disabled={ocupado}
                  onClick={() => onQuitar(item.id)}
                >
                  {quitandoId === item.id ? <Spinner size="sm" /> : 'Quitar'}
                </Button>
              </div>
            </ListGroupItem>
          ))}
        </ListGroup>
      )}
    </Card>
  );
}

export default Bandeja;
