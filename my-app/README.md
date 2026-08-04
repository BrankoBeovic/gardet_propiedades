# GARDET Propiedades

SPA de corredora inmobiliaria (Create React App + React Router v7 + Supabase + Tailwind).

## Requisitos

- Node.js 18+
- Proyecto Supabase con las tablas/funciones del negocio

## Configuración

1. Entra a `my-app/`:

```bash
cd my-app
npm install
```

2. Copia las variables de entorno:

```bash
cp .env.example .env
```

3. Completa `.env` (ver `.env.example`):

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de desarrollo (por defecto **5500**) |
| `REACT_APP_SUPABASE_URL` | URL del proyecto Supabase |
| `REACT_APP_SUPABASE_ANON_KEY` | Anon/public key de Supabase |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Opcional; mapas aún no cableados en el formulario |

4. Aplica seguridad en Supabase (SQL Editor), en este orden:

- `supabase_rls.sql` — RLS, policies de tablas y storage bucket `propiedades`
- `supabase_functions.sql` — RPCs PostGIS con chequeo de ownership

Verifica en el dashboard que RLS esté activo en `propiedades` y `propiedades_imagenes`.

## Scripts

```bash
npm start   # http://localhost:5500 (si PORT=5500 en .env)
npm test
npm run build
```

## Estructura relevante

- `src/auth/` — AuthProvider / useAuth
- `src/pages/` — Home, listados, detalle, login, dashboard
- `src/components/` — UI compartida + ProtectedRoute
- `src/lib/` — helpers de propiedades e uploads
- `src/constants/contact.js` — placeholders de contacto (mailto / WhatsApp)

## Contacto en la UI

Los CTAs usan placeholders en `src/constants/contact.js` (`contacto@gardetpropiedades.cl`). Actualízalos con datos reales del negocio.
