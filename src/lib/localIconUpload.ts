const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_ICON_BYTES = 128 * 1024
const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

/** 在本机完成缩放和压缩，仅将处理后的图标交给保存流程。 */
export async function prepareLocalIcon(file: File): Promise<string> {
  if (!SUPPORTED_TYPES.has(file.type)) throw new Error('请选择 PNG、JPG、WebP 或 SVG 图片。')
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error('请选择不超过 10 MB 的有效图片。')

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error('图片尺寸过大或无效，请选择不超过 4000 万像素的图片。')
    }
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器无法处理图片，请换用新版 Chrome 或 Edge。')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    // 非正方形图片直接拉伸，不留边、不裁切，也不填充背景色。
    context.drawImage(image, 0, 0, 256, 256)
    for (const quality of [0.85, 0.65, 0.45]) {
      const dataUri = canvas.toDataURL('image/webp', quality)
      const base64 = dataUri.split(',')[1] ?? ''
      if (base64 && base64.length * 3 / 4 <= MAX_ICON_BYTES) return dataUri
    }
    throw new Error('图片压缩后仍超过 128 KB，请选择内容更简单的图片。')
  } catch (error) {
    if (error instanceof DOMException) throw new Error('图片无法读取，请选择有效的 PNG、JPG、WebP 或 SVG 文件。')
    throw error
  } finally {
    URL.revokeObjectURL(url)
  }
}
