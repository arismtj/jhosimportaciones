# Catálogo de referencia

Fuente revisada: `https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/tienda`.

La tienda carga sus productos mediante `GET /api/products`. Al momento de la auditoría se encontraron 271 registros distribuidos entre Importaciones, Detalles y Sublimación.

## Campos recuperables

- Identificador, nombre y descripción.
- Grupo y subcategoría.
- Precio fijo o precio «desde» con máximo opcional.
- Estado general de disponibilidad.
- Imagen principal y galería opcional.
- Versión y fecha de actualización.

## Información que no debe inferirse

- Cantidad exacta de existencias.
- SKU comerciales.
- Variantes estructuradas de talla, color o modelo.
- Recargos por variante.

Antes de importar el catálogo se debe confirmar que este endpoint es la fuente canónica y obtener una exportación adicional si existe información de variantes o stock detallado.
