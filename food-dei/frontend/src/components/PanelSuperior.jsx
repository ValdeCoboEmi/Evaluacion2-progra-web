import { Badge, Navbar, NavbarBrand } from 'reactstrap';
import Temporizador from './Temporizador';

const moneda = (valor) => `$${Number(valor).toFixed(2)}`;

function PanelSuperior({ saldo, total, estado, expiraEn, onExpira }) {
  return (
    <Navbar light sticky="top" container="lg" className="panel-superior shadow-sm">
      <NavbarBrand href="/" className="me-auto">
        <img src="/logo-food-dei.png" alt="Food DEI S.A. de R.L." />
      </NavbarBrand>

      <div className="d-flex flex-wrap align-items-center gap-3">
        <span>
          Tu saldo actual: <strong>{moneda(saldo)}</strong>
        </span>
        <span>
          Total de tu Reserva:{' '}
          <Badge color="dark" pill>
            {moneda(total)}
          </Badge>
        </span>
        <Temporizador expiraEn={expiraEn} estado={estado} onExpira={onExpira} />
      </div>
    </Navbar>
  );
}

export default PanelSuperior;