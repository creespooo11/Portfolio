import type * as THREE from 'three'

/**
 * A stone tablet face with text "engraved" on it: dark speckled ground,
 * the main line large in Anton, details below. Decorative mirror of the
 * DOM panel (which stays the accessible copy).
 */
export async function engravedTablet(
  THREE: typeof import('three'),
  { title, subtitle, tag }: { title: string; subtitle: string; tag: string },
) {
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#17171a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < 9000; i++) {
    const shade = Math.random() > 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${Math.random() * 0.05})`
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2)
  }

  const pad = 72
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#c8102e'
  ctx.font = '500 30px "Space Grotesk", sans-serif'
  ctx.fillText(tag.toUpperCase(), pad, pad)

  ctx.fillStyle = '#e9e9e3'
  let size = 120
  ctx.font = `400 ${size}px "Anton", sans-serif`
  while (ctx.measureText(title.toUpperCase()).width > canvas.width - pad * 2 && size > 60) {
    size -= 6
    ctx.font = `400 ${size}px "Anton", sans-serif`
  }
  ctx.fillText(title.toUpperCase(), pad, pad + 70)

  ctx.fillStyle = '#9a9a96'
  ctx.font = '400 36px "Space Grotesk", sans-serif'
  const words = subtitle.split(' ')
  let line = ''
  let y = pad + 90 + size
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > canvas.width - pad * 2) {
      ctx.fillText(line, pad, y)
      line = word
      y += 48
    } else {
      line = next
    }
  }
  if (line) ctx.fillText(line, pad, y)

  const texture: THREE.CanvasTexture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
