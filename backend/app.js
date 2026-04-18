const express = require('express');
const cors    = require('cors');
const { connectDB } = require('./db/connect');

const appointmentsRouter = require('./routes/appointments');
const scheduleRouter     = require('./routes/schedule');
const settingsRouter     = require('./routes/settings');
const cronRouter         = require('./routes/cron');

const app = express();

app.use(cors());
app.use(express.json());

// Ensure DB is connected on every request (safe for serverless cold starts)
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { res.status(500).json({ error: 'No se pudo conectar a la base de datos' }); }
});

app.use('/api/appointments', appointmentsRouter);
app.use('/api/schedule',     scheduleRouter);
app.use('/api/settings',     settingsRouter);
app.use('/api/cron',         cronRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

module.exports = app;
