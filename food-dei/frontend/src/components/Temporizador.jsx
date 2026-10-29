import { useEffect, useRef, useState } from 'react';
import { Badge } from 'reactstrap';

// ---------------------------------------------------------------------------
// FUNCIONES AUXILIARES (fuera del componente: no dependen de React)
// ---------------------------------------------------------------------------

// Calcula cuántos segundos faltan para `expiraEn`.
//  - `expiraEn` es un timestamp en milisegundos (el momento exacto en que vence la reserva).
//  - Date.now() es el momento actual, también en milisegundos.
//  - (expiraEn - Date.now()) son los milisegundos que faltan; se divide entre 1000 para
//    pasarlos a segundos.
//  - Math.ceil redondea hacia arriba: si faltan 0.4 s se sigue mostrando 1, así el
//    contador nunca marca "00:00" antes de que el tiempo realmente se acabe.
//  - Math.max(0, ...) evita números negativos cuando el tiempo ya pasó.
const segundosHasta = (expiraEn) => Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));

// Convierte segundos a texto "mm:ss" (ej. 125 -> "02:05").
//  - Math.floor(segundos / 60) -> minutos completos (125 / 60 = 2.08 -> 2).
//  - segundos % 60             -> segundos sobrantes (125 % 60 = 5).
//  - String(...).padStart(2, '0') agrega un cero a la izquierda para que siempre
//    tenga 2 dígitos ("5" -> "05").
function formatear(segundos) {
  const minutos = String(Math.floor(segundos / 60)).padStart(2, '0');
  const resto = String(segundos % 60).padStart(2, '0');
  return `${minutos}:${resto}`;
}

// ---------------------------------------------------------------------------
// COMPONENTE
// ---------------------------------------------------------------------------
//
// Muestra la cuenta regresiva de la reserva. Props:
//  - expiraEn : timestamp (ms) en que vence la reserva. App.jsx lo calcula así:
//               Date.now() + segundosRestantes * 1000, usando los segundos que
//               informa el servidor (así no importa si el reloj del navegador
//               está desfasado respecto al del servidor).
//  - estado   : 'activa' | 'expirada' | 'confirmada'. Decide qué se dibuja.
//  - onExpira : función que se llama UNA sola vez cuando el contador llega a 0.
//               App.jsx la usa para preguntarle al servidor, que es quien libera
//               el stock y marca la reserva como expirada.
//
// IMPORTANTE: el servidor es la fuente de verdad. Este contador es solo visual;
// aunque alguien lo manipulara en el navegador, el backend revisa el tiempo real
// en cada petición (liberarSiExpirada) y rechazaría la operación.
function Temporizador({ expiraEn, estado, onExpira }) {
  const activa = estado === 'activa';

  // useState: guarda los segundos restantes que se muestran en pantalla.
  // Cada vez que se llama a setRestante con un valor distinto, React vuelve a
  // dibujar el componente y el número cambia. Se pasa una función a useState
  // (lazy initializer) para que el cálculo inicial se haga una sola vez.
  const [restante, setRestante] = useState(() => segundosHasta(expiraEn));

  // useRef: guarda un valor que sobrevive entre renders SIN provocar un nuevo render
  // al cambiarlo (a diferencia de useState).
  //  - avisoEnviado evita llamar a onExpira() más de una vez cuando llega a 0.
  const avisoEnviado = useRef(false);

  //  - onExpiraRef guarda siempre la versión MÁS RECIENTE de onExpira. Lo necesitamos
  //    porque el setInterval de abajo se crea una sola vez y, si usara onExpira
  //    directamente, recordaría una versión vieja de la función (problema llamado
  //    "closure obsoleta").
  const onExpiraRef = useRef(onExpira);

  // EFECTO 1: cada vez que el padre nos pasa una nueva onExpira, se actualiza la ref.
  // No reinicia el intervalo, solo cambia la función guardada.
  useEffect(() => {
    onExpiraRef.current = onExpira;
  }, [onExpira]);

  // EFECTO 2: es el que hace funcionar la cuenta regresiva.
  // Se vuelve a ejecutar cuando cambia `expiraEn` (se agregó un plato, se reinició la
  // reserva, etc.) o `activa` (la reserva expiró o se confirmó).
  useEffect(() => {
    // Nueva reserva o nuevo tiempo: se permite avisar de nuevo cuando llegue a 0.
    avisoEnviado.current = false;

    // Si la reserva ya no está activa (expirada o confirmada) no hay nada que contar.
    // `return undefined` = este efecto no necesita limpieza.
    if (!activa) {
      setRestante(0);
      return undefined;
    }

    // Se muestra el valor correcto de inmediato, sin esperar el primer segundo.
    setRestante(segundosHasta(expiraEn));

    // setInterval ejecuta la función cada 1000 ms (1 segundo).
    // En lugar de restar 1 a `restante`, se RECALCULA con la hora real. Así el
    // contador no se desfasa aunque el navegador retrase algún tick (por ejemplo,
    // si la pestaña estaba en segundo plano).
    const intervalo = setInterval(() => {
      const segundos = segundosHasta(expiraEn);
      setRestante(segundos);

      // Llegó a 0 y todavía no se avisó: se detiene el reloj y se notifica al padre.
      if (segundos === 0 && !avisoEnviado.current) {
        avisoEnviado.current = true;
        clearInterval(intervalo);
        onExpiraRef.current(); // llama a la versión más reciente de onExpira
      }
    }, 1000);

    // FUNCIÓN DE LIMPIEZA: React la ejecuta antes de repetir el efecto o cuando el
    // componente se desmonta. Cancela el intervalo para que no queden relojes
    // duplicados corriendo en segundo plano (fuga de memoria).
    return () => clearInterval(intervalo);
  }, [expiraEn, activa]);

  // ---------------------------------------------------------------------------
  // RENDER: según el estado se dibuja una insignia (Badge) distinta
  // ---------------------------------------------------------------------------

  // Reserva confirmada: insignia verde, ya no hay cuenta regresiva.
  if (estado === 'confirmada') {
    return (
      <Badge color="success" pill>
        Reserva confirmada
      </Badge>
    );
  }

  // Reserva expirada: insignia roja.
  if (!activa) {
    return (
      <Badge color="danger" pill>
        Reserva expirada
      </Badge>
    );
  }

  // Reserva activa: cuenta regresiva. Cuando quedan 30 s o menos se cambia la clase CSS
  // (definida en styles.css) para resaltar la urgencia.
  const urgente = restante <= 30;

  return (
    <Badge pill className={urgente ? 'badge-tiempo-urgente' : 'badge-tiempo'}>
      Tiempo restante: {formatear(restante)}
    </Badge>
  );
}

export default Temporizador;