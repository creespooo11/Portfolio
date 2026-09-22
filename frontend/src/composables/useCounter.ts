import { isRef, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { gsap, ScrollTrigger } from '../lib/gsap'

interface CounterOptions {
  duration?: number
  prefix?: string
  suffix?: string
}

/**
 * Animated stat counter: counts from 0 up to `endValue` once the target
 * element scrolls into view, via a plain numeric tween whose onUpdate
 * writes into a ref the template renders (the Vue equivalent of mutating
 * textContent directly).
 *
 * `endValue` may be a plain number or a Ref<number>. This matters for
 * stats whose real value only arrives after an async fetch (e.g. "N
 * technologies", initially 0 while portfolio-service hasn't responded
 * yet): the ScrollTrigger/tween isn't built until the value is known
 * (> 0), so it animates to the real number instead of freezing at 0.
 */
export function useCounter(target: Ref<HTMLElement | null>, endValue: Ref<number> | number, options: CounterOptions = {}) {
  const { duration = 1.8, prefix = '', suffix = '' } = options
  const endRef = isRef(endValue) ? endValue : ref(endValue)
  const display = ref(`${prefix}0${suffix}`)

  let scrollTrigger: ScrollTrigger | null = null
  let tween: gsap.core.Tween | null = null
  let built = false

  function build() {
    if (built || !target.value || endRef.value <= 0) return
    built = true

    const counter = { value: 0 }
    tween = gsap.to(counter, {
      value: endRef.value,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: target.value,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        display.value = `${prefix}${Math.round(counter.value)}${suffix}`
      },
    })
    scrollTrigger = tween.scrollTrigger ?? null
  }

  onMounted(build)
  watch(endRef, build)

  onUnmounted(() => {
    scrollTrigger?.kill()
    tween?.kill()
  })

  return { display }
}
