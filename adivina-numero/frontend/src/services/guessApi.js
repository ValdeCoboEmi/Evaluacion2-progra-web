const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

async function post(path, body) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está encendido el backend?');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Ocurrió un error en el servidor.');
  }

  return data;
}

// -> { status, result: 'mayor' | 'menor' | 'correcto', message }
export const sendGuess = (number) => post('/guess', { number });

// -> { status, message }
export const resetGame = () => post('/reset');
