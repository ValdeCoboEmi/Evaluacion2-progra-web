import { useEffect, useRef } from 'react';
import { Badge, Card, CardHeader, ListGroup, ListGroupItem } from 'reactstrap';

const RESULT_INFO = {
  mayor: { label: 'Es mayor', arrow: '▲' },
  menor: { label: 'Es menor', arrow: '▼' },
  correcto: { label: 'Correcto', arrow: '✓' },
};

/**
 * Lista con todos los intentos de la partida actual.
 * history: [{ value: number, result: 'mayor' | 'menor' | 'correcto' }]
 */
function GuessHistory({ history }) {
  const scrollRef = useRef(null);

  // Mantiene visible el último intento cuando la lista crece
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [history.length]);

  return (
    <Card className="history-card h-100" aria-label="Historial de intentos">
      <CardHeader className="d-flex justify-content-between align-items-center">
        <h2 className="h5 mb-0">Historial</h2>
        <Badge color="dark" pill>
          {history.length}
        </Badge>
      </CardHeader>

      {history.length === 0 ? (
        <p className="history-empty">Todavía no has probado ningún número.</p>
      ) : (
        <div className="history-scroll" ref={scrollRef}>
          <ListGroup flush>
            {history.map((attempt, index) => {
              const info = RESULT_INFO[attempt.result];

              return (
                <ListGroupItem
                  key={`${index}-${attempt.value}`}
                  className={`attempt attempt--${attempt.result} d-flex justify-content-between align-items-center`}
                >
                  <span>
                    <span className="attempt-index me-2">#{index + 1}</span>
                    <strong className="attempt-value">{attempt.value}</strong>
                  </span>
                  <span className={`result-badge result-badge--${attempt.result}`}>
                    <span aria-hidden="true">{info.arrow}</span> {info.label}
                  </span>
                </ListGroupItem>
              );
            })}
          </ListGroup>
        </div>
      )}
    </Card>
  );
}

export default GuessHistory;
