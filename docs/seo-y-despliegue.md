# SEO y despliegue

## Qué hace el build

`npm run build` (dentro de `app`) ejecuta:

1. `tsc -b` y `vite build`.
2. `scripts/prerender.mjs`, que genera HTML estático con título, descripción, canonical,
   Open Graph, datos estructurados (Schema.org) y contenido visible para:
   - la portada (`/`),
   - cada producto (`/producto/<slug>`),
   - cada familia y subcategoría (`/categoria/<slug>`),
   - `/promociones` y `/regalos-navidad`;

   además de `sitemap.xml` y `robots.txt`.

Los datos se leen de Supabase con la clave pública (`VITE_SUPABASE_URL` y
`VITE_SUPABASE_PUBLISHABLE_KEY`). Si Supabase no responde, usa el snapshot
`catalog-source/reference-products.json` y lo avisa en el log.

**Cuando cambies productos en Supabase, vuelve a desplegar** (desde Cloudflare: Deployments → «Retry build», o con un `git push`) para regenerar páginas y sitemap.

## Variables de build (Cloudflare)

Workers & Pages → `jhosimportaciones` → Settings → Build → Variables:

| Variable | Obligatoria | Ejemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | Sí | `https://padlarnhwvvugxoftpnf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sí | `sb_publishable_…` |
| `VITE_SITE_URL` | Recomendada | `https://jhosimportaciones.com` |
| `NODE_VERSION` | Recomendada | `22` |
| `VITE_GA_MEASUREMENT_ID` | Opcional | `G-XXXXXXXXXX` (Google Analytics 4) |
| `VITE_META_PIXEL_ID` | Opcional | `123456789012345` (Meta Pixel) |

Nunca pongas la clave `service_role`/`sb_secret_` en estas variables.

## Cloudflare Workers (hosting)

- Repositorio: `arismtj/jhosimportaciones`, rama `main`. Cada `git push` publica automáticamente.
- Path (root directory): `/app` · Build command: `npm run build` · Deploy command: `npx wrangler deploy`.
- `app/wrangler.jsonc` publica la carpeta `dist` como archivos estáticos: `/producto/x` sirve
  `producto/x.html` y las rutas sin archivo cargan la app (SPA).
- `public/_headers` define caché larga para `/assets/*`.
- Dirección temporal: `https://jhosimportaciones.arismartintj.workers.dev`.

## Dominio `jhosimportaciones.com` (Spaceship → Cloudflare)

1. Cloudflare → Account home → «Add a domain» → `jhosimportaciones.com` → plan Free.
2. En Spaceship cambia los nameservers por los 2 que indica Cloudflare (desactiva DNSSEC si está activo).
3. Cuando el dominio figure como «Active»: Workers & Pages → `jhosimportaciones` → Settings →
   Domains & Routes → Add → Custom domain → `jhosimportaciones.com` y `www.jhosimportaciones.com`.

## Supabase

- Auth → URL Configuration: Site URL `https://jhosimportaciones.com`; Redirect URLs
  `https://jhosimportaciones.com/**`, `https://www.jhosimportaciones.com/**` y
  `https://jhosimportaciones.arismartintj.workers.dev/**` (inicio de sesión con Google).
- Migra las imágenes a Storage (una vez) con `npm run catalog:import` y la clave secreta
  en el entorno del proceso; hoy siguen enlazadas a la tienda temporal.

## Después de publicar (pasos manuales)

1. **Google Search Console**: verifica el dominio (registro TXT en Spaceship), envía
   `https://jhosimportaciones.com/sitemap.xml` y revisa «Páginas» y «Mejoras».
2. **Perfil de Empresa en Google** (Google Maps): categoría «Tienda de regalos»,
   dirección de Chorrillos, horario, teléfono, web, fotos reales. Pide reseñas.
3. **Bing Webmaster Tools**: importa el sitio desde Search Console.
4. **Google Analytics 4 / Meta Pixel**: crea las propiedades y coloca los IDs en las variables.
5. **Google Merchant Center**: cuando los precios estén verificados, registra la tienda
   para aparecer gratis en la pestaña «Compras».
6. Prueba las páginas con la [Prueba de resultados enriquecidos](https://search.google.com/test/rich-results).

## Eventos de analítica

`view_item`, `add_to_cart`, `begin_checkout`, `generate_lead` (clic en «Continuar en
WhatsApp» del carrito) y `contact_whatsapp` (botón flotante o ficha de producto).
En Meta Pixel se envían como ViewContent, AddToCart, InitiateCheckout, Lead y Contact.

## Textos SEO

- `app/shared/seo-content.json`: títulos, descripciones y textos de portada, categorías y páginas.
- `app/shared/site.json`: datos del negocio usados en los datos estructurados.
