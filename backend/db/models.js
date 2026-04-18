const { Schema, model, models } = require('mongoose');

// ── Tenant (negocio) ──────────────────────────────────────────────────────────
const tenantSchema = new Schema(
  { name: { type: String, required: true } },
  { timestamps: true, versionKey: false }
);
tenantSchema.set('toJSON', { virtuals: true, transform: (_, r) => { delete r._id; return r; } });

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    tenantId:     { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['admin', 'staff'], default: 'admin' },
  },
  { timestamps: true, versionKey: false }
);

// ── Config (settings + blocked_days por tenant) ───────────────────────────────
const configSchema = new Schema(
  {
    _id:          { type: Schema.Types.ObjectId },   // = tenantId
    settings:     { type: Map, of: String, default: {} },
    blocked_days: { type: [String], default: [] },
  },
  { _id: false, versionKey: false }
);

// ── Appointments ──────────────────────────────────────────────────────────────
const appointmentSchema = new Schema(
  {
    tenantId:          { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name:              { type: String, required: true },
    phone:             { type: String, required: true },
    date:              { type: String, required: true },
    time:              { type: String, required: true },
    notes:             { type: String, default: null },
    status:            { type: String, default: 'confirmado' },
    confirmation_sent: { type: Number, default: 0 },
    reminder_sent:     { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false }
);
appointmentSchema.set('toJSON', { virtuals: true, transform: (_, r) => { delete r._id; return r; } });

const Tenant      = models.Tenant      || model('Tenant',      tenantSchema);
const User        = models.User        || model('User',        userSchema);
const Config      = models.Config      || model('Config',      configSchema);
const Appointment = models.Appointment || model('Appointment', appointmentSchema);

module.exports = { Tenant, User, Config, Appointment };
