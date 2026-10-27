import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
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
      <h1 className="mb-3">Adivina el Número</h1>

      <Card className="mb-3">
        <CardBody>
          <div className={`alert alert-${won ? 'success' : 'primary'} mb-3`} role="status">
            {message}
          </div>

          {!won && (
            <div className="mb-3">
              <div className="d-flex justify-content-between small text-muted">
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
            <Alert color="danger" className="mt-3 mb-0" fade={false} role="alert">
              {error}
            </Alert>
          )}
        </CardBody>
      </Card>

      <Row className="align-items-center mb-3">
        <Col>
          Intentos fallidos <Badge color="secondary">{failedAttempts}</Badge>
          {won && (
            <span className="ms-3">
              Lo lograste en <strong>{history.length}</strong> {history.length === 1 ? 'intento' : 'intentos'}
            </span>
          )}
        </Col>
        <Col xs="auto">
          <Button color={won ? 'success' : 'outline-secondary'} onClick={() => startNewGame()} disabled={loading}>
            {won ? 'Jugar de nuevo' : 'Nuevo número'}
          </Button>
        </Col>
      </Row>

      <GuessHistory history={history} />
    </Container>
  );
}

export default HomePage;
