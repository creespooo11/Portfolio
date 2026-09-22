import { onMounted, onUnmounted, type Ref } from 'vue'
import { gsap, ScrollTrigger } from '../lib/gsap'

interface ScrollRevealOptions {
  y?: number
  duration?: number
  start?: string
}

/**
 * The one entrance animation every section on the page uses: fade in +
 * translateY(y) -> 0 as it scrolls into view, reversing if the user
 * scrolls back up past it. Shared here so every section behaves
 * identically instead of each component re-implementing it slightly
 * differently.
 */
export function useScrollReveal(target: Ref<HTMLElement | null>, options: ScrollRevealOptions = {}) {
  const { y = 40, duration = 0.8, start = 'top 80%' } = options

  let scrollTrigger: ScrollTrigger | null = null
  let tween: gsap.core.Tween | null = null

  onMounted(() => {
    if (!target.value) return
    tween = gsap.from(target.value, {
      opacity: 0,
      y,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: target.value,
        start,
        toggleActions: 'play none none reverse',
      },
    })
    scrollTrigger = tween.scrollTrigger ?? null
  })

  onUnmounted(() => {
    scrollTrigger?.kill()
    tween?.kill()
  })
}
