# Importación del catálogo de referencia

## Estado preparado

La fuente congelada está en `app/catalog-source/reference-products.json`. Su archivo complementario contiene la fecha de recuperación, el hash SHA-256, los conteos y las advertencias detectadas.

El snapshot actual contiene:

- 271 productos.
- 151 productos de Importaciones.
- 63 productos de Detalles.
- 57 productos de Sublimación.
- 12 subcategorías.
- 268 productos disponibles y 3 agotados.
- 5 productos con precio `Desde`.
- 295 imágenes únicas: 282 JPEG y 13 SVG.

Los 295 recursos visuales respondieron correctamente durante la auditoría. Los SVG se convertirán a WebP antes de subirlos porque el bucket no admite SVG.

## Comandos seguros

Desde `app`:

```bash
npm run catalog:audit
```

Lee el snapshot y comprueba sus imágenes. No escribe en Supabase.

```bash
npm run catalog:fetch
```

Vuelve a descargar el catálogo, valida la respuesta y actualiza el snapshot y sus metadatos. No escribe en Supabase.

## Importación remota

La importación remota no debe ejecutarse hasta que las migraciones `001`, `002` y `003` estén aplicadas y las políticas RLS hayan sido verificadas.

El importador requiere credenciales exclusivamente en el entorno del proceso:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

La clave administrativa nunca debe guardarse en `.env.local`, variables `VITE_*`, archivos versionados ni código del navegador.

Con autorización explícita y las credenciales cargadas de forma temporal:

```bash
npm run catalog:import
```

El proceso realiza `upsert` por `external_id`, usa slugs deterministas, sube imágenes con rutas basadas en su hash y registra cada ejecución y error. Si todas las imágenes de un producto fallan, utiliza el logo oficial almacenado en el bucket como alternativa y conserva el error en `catalog_import_issues`.

La opción manual `--reconcile-missing` despublica productos previamente importados que ya no aparezcan en el snapshot. No forma parte del comando normal porque retirar productos requiere una decisión explícita.

## Datos deliberadamente pendientes

La fuente no proporciona cantidades exactas de inventario, variantes estructuradas ni una marca confiable de personalización. El importador deja `stock_quantity` en `null`, no crea variantes y registra esos campos como pendientes dentro de `source_metadata`.

Los nombres duplicados no se fusionan: cada registro conserva su `external_id` original.
