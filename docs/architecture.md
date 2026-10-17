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

La protección de rutas en React solo controla la experiencia de usuario. La autorización definitiva se implementará en PostgreSQL mediante Row Level Security (RLS).

El rol administrativo se leerá desde `app_metadata`, que debe ser asignado exclusivamente por un proceso seguro del servidor. Nunca se confiará en un rol enviado por el usuario ni se utilizará `service_role` en el navegador.

## Próxima etapa de Supabase

1. Crear tablas `profiles`, `categories`, `products`, `orders` y `order_items`.
2. Definir estados y restricciones de integridad.
3. Activar RLS en todas las tablas expuestas.
4. Permitir lectura pública únicamente de productos publicados.
5. Permitir a cada cliente leer y modificar solo sus propios datos.
6. Reservar gestión de catálogo y pedidos para usuarios con rol administrativo verificable.
7. Configurar buckets y políticas para imágenes de productos.
