const jwt = require('jsonwebtoken');

function superadminMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-production');
    if (payload.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida' });
  }
}

module.exports = superadminMiddleware;
