const express = require('express');
const cors = require('cors');
const buzzRouter = require('./routes/buzz');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'BUZZ IT API' });
});

app.use('/api/buzz', buzzRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use((error, _req, res, _next) => {
  res.status(error.status || 500).json({ message: error.message || 'Server Error' });
});

module.exports = app;
