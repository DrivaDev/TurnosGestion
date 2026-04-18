const express = require('express');
const cors    = require('cors');
const { connectDB } = require('./db/connect');
const auth = require('./middleware/auth');

const authRouter         = require('./routes/auth');
const publicRouter       = require('./routes/public');
const superadminRouter   = require('./routes/superadmin');
const appointmentsRouter = require('./routes/appointments');
const scheduleRouter     = require('./routes/schedule');
const settingsRouter     = require('./routes/settings');
const cronRouter         = require('./routes/cron');
const superadminMw       = require('./middleware/superadmin');

const app = express();
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try { await connectDB(); next(); }
  catch { res.status(500).json({ error: 'No se pudo conectar a la base de datos' }); }
});

// Public (sin auth)
app.use('/api/auth',   authRouter);
app.use('/api/public', publicRouter);
app.use('/api/cron',   cronRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Super-admin (solo Driva Dev)
app.post('/api/admin/login', (req, res) => {
  req.url = '/login';
  superadminRouter(req, res, () => {});
});
app.use('/api/admin', superadminMw, superadminRouter);

// Protected
app.use('/api/appointments', auth, appointmentsRouter);
app.use('/api/schedule',     auth, scheduleRouter);
app.use('/api/settings',     auth, settingsRouter);

module.exports = app;
