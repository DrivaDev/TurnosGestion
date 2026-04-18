const { Schema, model, models } = require('mongoose');

// ── Config (settings + blocked_days en un único documento) ──────────────────
const configSchema = new Schema(
  {
    _id:          { type: String, default: 'main' },
    settings:     { type: Map, of: String, default: {} },
    blocked_days: { type: [String], default: [] },
  },
  { _id: false, versionKey: false }
);

// ── Appointments ─────────────────────────────────────────────────────────────
const appointmentSchema = new Schema(
  {
    name:              { type: String, required: true },
    phone:             { type: String, required: true },
    date:              { type: String, required: true }, // YYYY-MM-DD
    time:              { type: String, required: true }, // HH:MM
    notes:             { type: String, default: null },
    status:            { type: String, default: 'confirmado' },
    confirmation_sent: { type: Number, default: 0 },
    reminder_sent:     { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false }
);

appointmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => { delete ret._id; return ret; },
});

const Config      = models.Config      || model('Config',      configSchema);
const Appointment = models.Appointment || model('Appointment', appointmentSchema);

module.exports = { Config, Appointment };
