import { useEffect, useRef, useState } from 'react';
import { Badge } from 'reactstrap';

const segundosHasta = (expiraEn) => Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));

function formatear(segundos) {
  const minutos = String(Math.floor(segundos / 60)).padStart(2, '0');
  const resto = String(segundos % 60).padStart(2, '0');
  return `${minutos}:${resto}`;
}

// Cuenta regresiva que se actualiza cada segundo. Al llegar a 0 avisa con onExpira().
// `expiraEn` es un timestamp local (ms); el servidor sigue siendo la fuente de verdad.
function Temporizador({ expiraEn, activa, onExpira }) {
  const [restante, setRestante] = useState(() => segundosHasta(expiraEn));
  const avisoEnviado = useRef(false);
  const onExpiraRef = useRef(onExpira);

  useEffect(() => {
    onExpiraRef.current = onExpira;
  }, [onExpira]);

  useEffect(() => {
    avisoEnviado.current = false;

    if (!activa) {
      setRestante(0);
      return undefined;
    }

    setRestante(segundosHasta(expiraEn));

    const intervalo = setInterval(() => {
      const segundos = segundosHasta(expiraEn);
      setRestante(segundos);

      if (segundos === 0 && !avisoEnviado.current) {
        avisoEnviado.current = true;
        clearInterval(intervalo);
        onExpiraRef.current();
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [expiraEn, activa]);

  if (!activa) {
    return (
      <Badge color="danger" pill>
        Reserva expirada
      </Badge>
    );
  }

  const urgente = restante <= 30;

  return (
    <Badge pill className={urgente ? 'badge-tiempo-urgente' : 'badge-tiempo'}>
      Tiempo restante: {formatear(restante)}
    </Badge>
  );
}

export default Temporizador;
