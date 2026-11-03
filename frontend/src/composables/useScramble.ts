import { onMounted, onUnmounted, ref } from 'vue'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_*#'

/**
 * Terminal-style decode: the text starts as random glyphs and resolves
 * left to right. The final string is what screen readers and the first
 * paint get when motion is reduced.
 */
export function useScramble(text: string, delay = 0, duration = 900) {
  const output = ref(text)
  let frame = 0
  let timer: number | undefined

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const scramble = (resolved: number) =>
      [...text]
        .map((char, i) => (i < resolved || char === ' ' ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join('')

    output.value = scramble(0)
    timer = window.setTimeout(() => {
      const start = performance.now()
      const tick = () => {
        const progress = Math.min(1, (performance.now() - start) / duration)
        output.value = progress < 1 ? scramble(Math.floor(progress * text.length)) : text
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, delay)
  })

  onUnmounted(() => {
    window.clearTimeout(timer)
    cancelAnimationFrame(frame)
  })

  return output
}
