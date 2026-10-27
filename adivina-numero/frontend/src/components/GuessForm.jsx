import { useEffect, useRef, useState } from 'react';
import { Button, Form, FormFeedback, FormGroup, Input, InputGroup, Label } from 'reactstrap';

const MIN = 1;
const MAX = 100;

/**
 * Formulario para enviar un intento.
 * - onGuess(number): función (puede ser async) que procesa el intento.
 * - triedNumbers: números ya probados, para evitar repetidos.
 * - won: la partida terminó, se bloquea el formulario.
 * - loading: hay una petición en curso.
 */
function GuessForm({ onGuess, triedNumbers, won, loading }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Devuelve el foco al input cuando se puede volver a escribir
  useEffect(() => {
    if (!won && !loading) inputRef.current?.focus();
  }, [won, loading]);

  async function handleSubmit(event) {
    event.preventDefault();

    const number = Number(value);

    if (value.trim() === '' || !Number.isInteger(number) || number < MIN || number > MAX) {
      setError(`Escribe un número entero entre ${MIN} y ${MAX}.`);
      return;
    }

    if (triedNumbers.includes(number)) {
      setError(`Ya probaste el ${number}. Elige otro número.`);
      return;
    }

    setError('');
    const accepted = await onGuess(number);
    if (accepted) setValue('');
  }

  // Al terminar una partida nueva el formulario se limpia
  useEffect(() => {
    if (triedNumbers.length === 0) {
      setValue('');
      setError('');
    }
  }, [triedNumbers.length]);

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <FormGroup>
        <Label for="guess">Tu número</Label>
        <InputGroup>
          <Input
            id="guess"
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            placeholder={`${MIN} - ${MAX}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            innerRef={inputRef}
            invalid={Boolean(error)}
            disabled={won}
          />
          <Button type="submit" color="primary" disabled={won || loading}>
            {loading ? 'Enviando...' : 'Probar'}
          </Button>
          <FormFeedback>{error}</FormFeedback>
        </InputGroup>
      </FormGroup>
    </Form>
  );
}

export default GuessForm;
