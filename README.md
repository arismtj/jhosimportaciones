# JHOS Importaciones

Aplicación web de comercio electrónico construida con React, TypeScript y Vite.

El archivo `JHOS_Importaciones_Tienda_CORREGIDA.html` es el prototipo original aprobado y debe conservarse sin modificaciones.

## Desarrollo local

```bash
cd app
npm install
npm run dev
```

La aplicación funciona sin credenciales para explorar el catálogo y comprar como invitado. Para habilitar autenticación real, copia `app/.env.example` como `app/.env.local` y completa exclusivamente las variables públicas.

## Variables de entorno

- `VITE_SUPABASE_URL`: URL pública del proyecto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: clave publicable del proyecto.
- `VITE_WHATSAPP_NUMBER`: número comercial con indicativo, sin `+` ni espacios.

Nunca se debe exponer `service_role` ni otra clave secreta dentro de variables `VITE_*`.

## Base de datos

El esquema versionado está en `supabase/migrations`. Su diseño, políticas de acceso y procedimiento de aplicación se documentan en `docs/database.md`. Las migraciones deben revisarse y probarse antes de aplicarlas a un proyecto remoto.

## Compilación

```bash
cd app
npm run build
```

Para Cloudflare Pages, el directorio raíz será `app`, el comando de compilación `npm run build` y la salida `dist`.
