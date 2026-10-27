import {
  Badge,
  Button,
  Card,
  CardBody,
  CardSubtitle,
  CardTitle,
  Col,
  Row,
  Spinner,
} from 'reactstrap';

const moneda = (valor) => `$${Number(valor).toFixed(2)}`;

function Menu({ menu, estado, cargando, agregandoId, onAgregar }) {
  if (cargando) {
    return (
      <div className="text-center py-4">
        <Spinner size="sm" /> Cargando...
      </div>
    );
  }

  return (
    <>
      <h2 className="h4 mb-3">Menú del Día</h2>

      <Row>
        {menu.map((plato) => {
          const agotado = plato.stock === 0;
          const agregando = agregandoId === plato.id;

          return (
            <Col xs="12" md="4" key={plato.id}>
              <Card className="mb-3 h-100">
                <CardBody className="d-flex flex-column">
                  <CardTitle tag="h5">{plato.nombre}</CardTitle>
                  <CardSubtitle className="mb-2 text-muted">{plato.categoria}</CardSubtitle>

                  <h4>
                    <Badge color="success">{moneda(plato.precio)}</Badge>
                  </h4>
                  <p className="mb-3">Stock disponible: {plato.stock}</p>

                  <div className="mt-auto">
                    {agotado ? (
                      <Button color="secondary" disabled>
                        Agotado
                      </Button>
                    ) : (
                      <Button
                        color="success"
                        disabled={estado === 'expirada' || agregandoId !== null}
                        onClick={() => onAgregar(plato.id)}
                      >
                        {agregando ? <Spinner size="sm" /> : 'Añadir a la Reserva'}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );
}

export default Menu;
