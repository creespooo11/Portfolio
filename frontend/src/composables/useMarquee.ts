import { nextTick, onMounted, onUnmounted, ref } from 'vue'

/**
 * Infinite horizontal marquee driven by requestAnimationFrame.
 *
 * Renders as: a hidden "measure" pass (to know one unit's width), followed by
 * two adjacent visible passes that are shifted left together; once the first
 * pass has fully scrolled out, the position wraps by one cycle width so the
 * loop reads as seamless. Originally built for the tech-stack ticker, reused
 * here for any scrolling line of text (see Marquee.vue).
 */
export function useMarquee(speed = 0.6) {
  const measureBlock = ref<HTMLElement | null>(null)
  const cycleBlock = ref<HTMLElement | null>(null)
  const position = ref(0)
  const repeatCount = ref(1)
  let cycleWidth = 0
  let rafId = 0
  let resizeTimeout: number | undefined

  function step() {
    position.value += speed
    if (cycleWidth > 0 && position.value >= cycleWidth) {
      position.value -= cycleWidth
    }
    rafId = requestAnimationFrame(step)
  }

  function measure() {
    if (!measureBlock.value) return
    const blockWidth = measureBlock.value.offsetWidth
    if (blockWidth <= 0) return

    repeatCount.value = Math.ceil((window.innerWidth * 2) / blockWidth) + 1
    void nextTick().then(() => {
      cycleWidth = cycleBlock.value?.offsetWidth ?? 0
      if (cycleWidth > 0) {
        position.value %= cycleWidth
      }
    })
  }

  function scheduleMeasure() {
    if (resizeTimeout !== undefined) window.clearTimeout(resizeTimeout)
    resizeTimeout = window.setTimeout(measure, 150)
  }

  onMounted(async () => {
    await nextTick()
    measure()
    window.addEventListener('resize', scheduleMeasure)
    rafId = requestAnimationFrame(step)
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', scheduleMeasure)
    if (resizeTimeout !== undefined) window.clearTimeout(resizeTimeout)
  })

  return { measureBlock, cycleBlock, position, repeatCount }
}
