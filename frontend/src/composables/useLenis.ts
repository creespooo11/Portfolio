import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'

// useLenis() is only ever called once, at the app root, so a module-level
// singleton is enough to let any other component (e.g. a "scroll to
// section" nav) trigger a smooth scroll via getLenis() without threading
// the instance through props/provide-inject.
let activeLenis: Lenis | null = null

export function getLenis(): Lenis | null {
  return activeLenis
}

/**
 * Global smooth scroll (Lenis), wired into GSAP's own ticker so every
 * ScrollTrigger instance in the app stays in sync with the smoothed scroll
 * position instead of the raw (unsmoothed) native scroll events.
 *
 * Call this exactly once, at the app root (see App.vue).
 */
export function useLenis() {
  let onTick: ((time: number) => void) | null = null

  onMounted(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    activeLenis = lenis

    lenis.on('scroll', ScrollTrigger.update)

    onTick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    // Lenis already smooths the scroll itself; disable GSAP's own lag
    // smoothing so the two don't fight each other on long frames.
    gsap.ticker.lagSmoothing(0)
  })

  onUnmounted(() => {
    if (onTick) gsap.ticker.remove(onTick)
    activeLenis?.destroy()
    activeLenis = null
  })
}
