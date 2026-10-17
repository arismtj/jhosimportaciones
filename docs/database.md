# Base de datos de JHOS Importaciones

## Alcance de la fase 2

Las migraciones locales definen el modelo comercial, pero no se han aplicado al proyecto remoto de Supabase. Tampoco contienen productos, precios, existencias ni fotografías inventadas.

- `001_store_schema.sql`: perfiles, categorías jerárquicas, productos, imágenes, variantes, favoritos, pedidos y personalizaciones.
- `002_rls_policies.sql`: permisos mínimos, políticas RLS, función segura de creación de pedidos y bucket público `product-images` con escritura exclusiva para administradores.
- `003_catalog_import_support.sql`: trazabilidad del origen, ejecuciones de importación, errores y reemplazo transaccional de galerías para el proceso administrativo.
- `app/src/types/database.ts`: contrato TypeScript usado por el cliente Supabase.
- `catalog.ts` y `orders.ts`: capa de acceso a datos preparada para las siguientes fases.

## Decisiones de seguridad

- El navegador utiliza únicamente la URL y la clave publicable de Supabase.
- El rol se obtiene de `profiles.role`; no se confía en `user_metadata` ni en datos enviados por el cliente.
- Cada usuario puede leer su perfil y actualizar únicamente `display_name` y `phone`.
- El catálogo publicado es público; cualquier escritura de catálogo requiere el rol `admin` validado dentro de PostgreSQL.
- Los favoritos y el historial de pedidos están limitados al propietario.
- La creación de pedidos admite invitados, valida los datos y recalcula precios desde `products` y `product_variants` dentro de una transacción. El cliente nunca fija el precio final.
- `price_verified` comienza en `false` para cualquier producto importado. Un trigger impide registrar líneas de pedido hasta que el precio haya sido confirmado administrativamente.
- Un pedido con entrega mantiene `total = null` hasta que exista una tarifa de envío validada. No se inventa un costo de entrega.
- Las funciones `security definer` viven en el esquema no expuesto `private`, fijan `search_path = ''`, usan nombres de esquema explícitos y tienen permisos de ejecución restringidos. La API pública de pedidos es un wrapper `security invoker`.

## Aplicación futura de las migraciones

Antes de aplicar los archivos al Supabase remoto:

1. Revisar el proyecto de destino y crear un respaldo.
2. Probar las migraciones en un proyecto de desarrollo o con Supabase CLI local.
3. Aplicar `001_store_schema.sql`, `002_rls_policies.sql` y `003_catalog_import_support.sql`, en ese orden.
4. Regenerar los tipos desde el esquema remoto y comparar el resultado con `app/src/types/database.ts`.
5. Ejecutar pruebas de RLS para visitantes, clientes y administradores.

Este procedimiento requiere una autorización separada porque modifica la base de datos remota.

## Alta inicial de administrador

El primer administrador debe promoverse desde un entorno de confianza, por ejemplo el SQL Editor de Supabase, después de que esa persona haya iniciado sesión al menos una vez:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'correo-del-administrador'
);
```

No se debe implementar una opción pública para que un usuario se asigne este rol.
