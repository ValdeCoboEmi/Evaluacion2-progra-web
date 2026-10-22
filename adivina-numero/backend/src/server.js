const createApp = require('./app');

const app = createApp();
const port = Number(process.env.PORT) || 3005;

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
