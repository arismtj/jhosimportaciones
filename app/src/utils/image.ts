/** Reduce fotos grandes del celular (máx. 1600 px) y las convierte a WebP para que carguen rápido. */
export async function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('No pudimos leer esa foto. Usa una imagen JPG o PNG.')
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (!blob) return file
  if (blob.size >= file.size && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
}
