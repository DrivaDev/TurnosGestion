const express = require('express');
const cors    = require('cors');
const { connectDB } = require('./db/connect');
const auth = require('./middleware/auth');

const authRouter         = require('./routes/auth');
const appointmentsRouter = require('./routes/appointments');
const scheduleRouter     = require('./routes/schedule');
const settingsRouter     = require('./routes/settings');
const cronRouter         = require('./routes/cron');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure DB connected on every request (safe for serverless cold starts)
app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch { res.status(500).json({ error: 'No se pudo conectar a la base de datos' }); }
});

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/cron', cronRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Protected routes — require valid JWT
app.use('/api/appointments', auth, appointmentsRouter);
app.use('/api/schedule',     auth, scheduleRouter);
app.use('/api/settings',     auth, settingsRouter);

module.exports = app;
