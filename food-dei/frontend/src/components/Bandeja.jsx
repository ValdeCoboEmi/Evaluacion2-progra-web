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

// Formatea un número como dinero: 5.5 -> "$5.50"
const moneda = (valor) => `$${Number(valor).toFixed(2)}`;

// Carrito lateral. Props:
//  items: [{ id, nombre, precio, cantidad }]
//  estado: 'activa' | 'expirada' | 'confirmada'
//  quitandoId: id del ítem que se está eliminando (o null)
//  onQuitar(id)  -> Endpoint 5 (DELETE)
//  onCambiarPorciones(id, nuevaCantidad) -> Endpoint 4 (PUT), botones - y +
//  onConfirmar() -> POST /reserva/confirmar (bloquea el stock y descuenta el saldo)
//  onReiniciar() -> inicia una reserva nueva cuando la anterior expiró o fue confirmada
function Bandeja({
  items, estado, cargando, quitandoId, actualizandoId, confirmando,
  onQuitar, onCambiarPorciones, onReiniciar, onConfirmar,
}) {
  // true mientras haya una petición en curso (evita clics repetidos)
  const ocupado = quitandoId !== null || actualizandoId !== null || confirmando;

  // Reserva expirada o confirmada: no se puede editar; se invita a iniciar otra.
  if (estado !== 'activa') {
    const confirmada = estado === 'confirmada';

    return (
      <Card>
        <CardHeader className="bandeja-titulo">Tu Bandeja de Reserva</CardHeader>
        <CardBody>
          <p className="mb-3">
            {confirmada
              ? '¡Reserva confirmada! Tus platillos quedaron apartados y el total se descontó de tu saldo. Puedes hacer otra reserva.'
              : 'Tu reserva expiró y los platillos volvieron al stock. Puedes iniciar una nueva.'}
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

      {/* Confirmar: solo aparece si hay platos en la reserva */}
      {!cargando && items.length > 0 && (
        <CardBody>
          <Button color="success" block disabled={ocupado} onClick={onConfirmar}>
            {confirmando ? <Spinner size="sm" /> : 'Confirmar reserva'}
          </Button>
        </CardBody>
      )}
    </Card>
  );
}

export default Bandeja;