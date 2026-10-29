import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import GuessForm from '../components/GuessForm';
import GuessHistory from '../components/GuessHistory';
import { resetGame, sendGuess } from '../services/guessApi';

const MIN = 1;
const MAX = 100;
const INITIAL_MESSAGE = `Estoy pensando en un número entre ${MIN} y ${MAX}.`;

function HomePage() {
  const [history, setHistory] = useState([]); // [{ value, result }]
  const [message, setMessage] = useState(INITIAL_MESSAGE);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const failedAttempts = history.filter((attempt) => attempt.result !== 'correcto').length;

  // Rango posible deducido del historial
  const low = Math.max(MIN, ...history.filter((a) => a.result === 'mayor').map((a) => a.value + 1));
  const high = Math.min(MAX, ...history.filter((a) => a.result === 'menor').map((a) => a.value - 1));
  const fillStart = ((low - MIN) / (MAX - MIN)) * 100;
  const fillWidth = Math.max(((high - low) / (MAX - MIN)) * 100, 2);

  async function startNewGame() {
    setLoading(true);
    setError('');

    try {
      await resetGame();
      setHistory([]);
      setWon(false);
      setMessage(INITIAL_MESSAGE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Cada vez que se abre la página se empieza una partida nueva,
  // así el historial en pantalla siempre corresponde al número oculto.
  useEffect(() => {
    startNewGame();
  }, []);

  // Devuelve true si el intento fue aceptado por el servidor
  async function handleGuess(number) {
    setLoading(true);
    setError('');

    try {
      const data = await sendGuess(number);
      setHistory((previous) => [...previous, { value: number, result: data.result }]);
      setMessage(data.message);
      setWon(data.result === 'correcto');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="game mt-4 mb-5">
      <h1 className="game-title mb-4">Adivina el Número</h1>

      <Row className="g-4">
        {/* Izquierda: parte interactiva */}
        <Col md="7">
          <Card className="play-card h-100">
            <CardBody className="d-flex flex-column">
              <div className={`message ${won ? 'message--won' : ''}`} role="status">
                {message}
              </div>

              {!won && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span>Rango posible</span>
                    <span>
                      {low} - {high}
                    </span>
                  </div>
                  <div className="range-track" role="img" aria-label={`Rango posible de ${low} a ${high}`}>
                    <div className="range-fill" style={{ left: `${fillStart}%`, width: `${fillWidth}%` }} />
                  </div>
                </div>
              )}

              <GuessForm
                onGuess={handleGuess}
                triedNumbers={history.map((attempt) => attempt.value)}
                won={won}
                loading={loading}
              />

              {error && (
                <div className="fd-error" role="alert">
                  {error}
                </div>
              )}

              <div className="play-footer mt-auto pt-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  Intentos fallidos <Badge color="dark">{failedAttempts}</Badge>
                  {won && (
                    <span className="ms-3">
                      Lo lograste en <strong>{history.length}</strong>{' '}
                      {history.length === 1 ? 'intento' : 'intentos'}
                    </span>
                  )}
                </div>
                <Button
                  color={won ? 'success' : 'dark'}
                  outline={!won}
                  onClick={() => startNewGame()}
                  disabled={loading}
                >
                  {won ? 'Jugar de nuevo' : 'Nuevo número'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Derecha: historial */}
        <Col md="5">
          <GuessHistory history={history} />
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;
