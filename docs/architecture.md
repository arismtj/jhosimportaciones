# Arquitectura inicial

## Alcance actual

- Tienda pública responsive.
- Catálogo local tipado, filtros, búsqueda y ordenamiento.
- Detalle de producto y notas de personalización.
- Carrito persistido en el navegador.
- Pedido como invitado mediante WhatsApp o copia del resumen.
- Pantallas de inicio de sesión y registro conectables a Supabase.
- Rutas diferenciadas para clientes y administradores.

## Seguridad

La protección de rutas en React solo controla la experiencia de usuario. La autorización definitiva se implementa en PostgreSQL mediante Row Level Security (RLS).

El rol administrativo se lee desde `profiles.role`, protegido por RLS y permisos de columna. La app no permite modificar esa columna: cualquier promoción debe ejecutarse desde un entorno de confianza. Nunca se confía en un rol enviado por el usuario ni se utiliza `service_role` en el navegador.

## Modelo Supabase preparado en la fase 2

Las migraciones locales de `supabase/migrations` modelan perfiles, categorías, productos, imágenes, variantes, favoritos y pedidos. RLS permite la lectura pública solo del catálogo publicado, limita datos privados al propietario y reserva las operaciones administrativas para perfiles con rol `admin`.

El checkout persistente usará la función `create_order`, que vuelve a consultar precios y disponibilidad en PostgreSQL antes de registrar cada línea. Esto evita confiar en importes manipulables desde el navegador y conserva la compra como invitado.

Las migraciones aún no se aplicaron al Supabase remoto. Consulta `docs/database.md` para el procedimiento de revisión y aplicación futura.
