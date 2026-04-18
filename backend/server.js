require('dotenv').config();
const cron = require('node-cron');
const app  = require('./app');
const { connectDB } = require('./db/connect');
const { sendReminders } = require('./services/whatsapp');

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    });
    // Recordatorios cada minuto (solo en desarrollo local)
    cron.schedule('* * * * *', () => {
      sendReminders().catch(err => console.error('[Cron]', err));
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });
