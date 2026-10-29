import { UncontrolledAlert } from 'reactstrap';

// Muestra el mensaje de la regla de negocio (o del fallo de red) que rechazó la petición.
// El `key` cambia con cada error nuevo para que la alerta reaparezca aunque la hayan cerrado.
function AlertaError({ error }) {
  if (!error) return null;

  return (
    <UncontrolledAlert
      key={error.id}
      color="warning"
      className="mt-3"
      transition={{ timeout: 150, unmountOnExit: true }}
    >
      {error.mensaje}
    </UncontrolledAlert>
  );
}

export default AlertaError;
