import { Badge, ListGroup, ListGroupItem } from 'reactstrap';

const RESULT_INFO = {
  mayor: { label: 'El número es mayor', color: 'info' },
  menor: { label: 'El número es menor', color: 'warning' },
  correcto: { label: 'Correcto', color: 'success' },
};

/**
 * Lista con todos los intentos de la partida actual.
 * history: [{ value: number, result: 'mayor' | 'menor' | 'correcto' }]
 */
function GuessHistory({ history }) {
  return (
    <section aria-label="Historial de intentos">
      <h2 className="h5">Historial</h2>

      {history.length === 0 ? (
        <p className="text-muted mb-0">Todavía no has probado ningún número.</p>
      ) : (
        <ListGroup>
          {history.map((attempt, index) => {
            const info = RESULT_INFO[attempt.result];

            return (
              <ListGroupItem
                key={`${index}-${attempt.value}`}
                className="d-flex justify-content-between align-items-center"
              >
                <span>
                  <span className="text-muted me-2">#{index + 1}</span>
                  <strong className="fs-5">{attempt.value}</strong>
                </span>
                <Badge color={info.color}>{info.label}</Badge>
              </ListGroupItem>
            );
          })}
        </ListGroup>
      )}
    </section>
  );
}

export default GuessHistory;
