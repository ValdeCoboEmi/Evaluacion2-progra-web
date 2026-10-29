const createApp = require('./app');

const app = createApp();
// El puerto sale del .env (PORT); si no existe se usa 3006.
const port = Number(process.env.PORT) || 3006;

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});