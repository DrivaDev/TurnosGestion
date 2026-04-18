# Gestor de Turnos

Sistema de gestión de turnos para locales comerciales con confirmaciones y recordatorios por WhatsApp.

## Requisitos

- Node.js 18+ (https://nodejs.org)

## Instalación

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Inicio rápido

Doble clic en `iniciar.bat` o correr manualmente:

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Luego abrir http://localhost:5173

## Configurar WhatsApp

1. Crear cuenta en https://twilio.com (tiene trial gratuito)
2. En el dashboard de Twilio ir a **Messaging → Try it out → Send a WhatsApp message**
3. Activar el sandbox y anotar el código de unirse
4. Copiar **Account SID** y **Auth Token** del dashboard principal
5. En la app ir a **Ajustes** y pegar las credenciales
6. El número de origen del sandbox es: `whatsapp:+14155238886`

### Para producción (WhatsApp Business real)
Reemplazar el número de sandbox por el número de WhatsApp Business aprobado en Twilio.

## Funcionalidades

- **Panel**: vista rápida de turnos del día y próximos
- **Turnos**: crear, editar, cancelar turnos. Horarios disponibles se generan automáticamente según la configuración
- **Horarios**: configurar días y horas de atención por día de semana, marcar días sin atención (feriados, vacaciones)
- **Ajustes**: credenciales de Twilio/WhatsApp, tiempo del recordatorio (30 min hasta 48 hs antes), mensajes personalizables

## Variables en mensajes

- `{nombre}` → nombre del cliente
- `{fecha}` → fecha del turno (ej: "lunes 20 de abril")
- `{hora}` → hora del turno (ej: "10:00")

## Datos

Los datos se guardan en `backend/turnos.json`. Hacer backup de este archivo para no perder los turnos.
