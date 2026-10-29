const MIN = 1;
const MAX = 100;

/**
Crea una partida. Recibe el generador aleatorio para poder probarla
con valores controlados.
 */
function createGuessService(random = Math.random) {
  const generateSecret = () => Math.floor(random() * (MAX - MIN + 1)) + MIN;

  // Número oculto: vive en memoria mientras el servidor siga encendido.
  let secret = generateSecret();

  return {
    MIN,
    MAX,

    /*
    Compara el intento con el número oculto.
    >"mayor":    el número oculto es MAYOR que el intento (hay que subir)
    >"menor":    el número oculto es MENOR que el intento (hay que bajar)
    >"correcto": el intento coincide con el número oculto
    */
    check(guess) {
      if (secret > guess) return 'mayor';
      if (secret < guess) return 'menor';
      return 'correcto';
    },

    reset() {
      secret = generateSecret();
    },
  };
}

module.exports = {
  createGuessService,
  guessService: createGuessService(),
  MIN,
  MAX,
};
