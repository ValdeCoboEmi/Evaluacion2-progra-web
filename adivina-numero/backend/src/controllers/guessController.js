const { guessService, MIN, MAX } = require('../services/guessService');

const MESSAGES = {
  mayor: 'El número oculto es mayor.',
  menor: 'El número oculto es menor.',
  correcto: '¡Correcto! Adivinaste el número.',
};

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

// Acepta un entero como número o como texto numérico ("42").
function parseGuess(value) {
  const isNumeric = typeof value === 'number'
    || (typeof value === 'string' && value.trim() !== '');
  const number = isNumeric ? Number(value) : NaN;

  if (!Number.isInteger(number) || number < MIN || number > MAX) {
    throw badRequest(`Envía un número entero entre ${MIN} y ${MAX}.`);
  }

  return number;
}

// POST /api/guess  { "number": 42 }
function guess(req, res, next) {
  try {
    const number = parseGuess(req.body?.number);
    const result = guessService.check(number);

    res.json({ status: 'success', result, message: MESSAGES[result] });
  } catch (error) {
    next(error);
  }
}

// POST /api/reset
function reset(req, res) {
  guessService.reset();
  res.json({ status: 'success', message: 'Nuevo número generado. ¡A jugar!' });
}

module.exports = { guess, reset };
