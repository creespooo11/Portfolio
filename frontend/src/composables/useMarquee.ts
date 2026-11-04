import { nextTick, onMounted, onUnmounted, ref } from 'vue'

/**
 * Infinite horizontal marquee driven by requestAnimationFrame.
 *
 * Renders as: a hidden "measure" pass (to know one unit's width), followed by
 * two adjacent visible passes that are shifted left together; once the first
 * pass has fully scrolled out, the position wraps by one cycle width so the
 * loop reads as seamless. Originally built for the tech-stack ticker, reused
 * here for any scrolling line of text (see Marquee.vue).
 *
 * The transform is written straight to the track element (no reactive
 * state per frame), speed is per 60fps frame but scaled by real elapsed
 * time so it's identical on 60/120/144Hz screens, and the loop sleeps while
 * the marquee is off screen.
 */
export function useMarquee(speed = 0.6) {
  const rootEl = ref<HTMLElement | null>(null)
  const measureBlock = ref<HTMLElement | null>(null)
  const cycleBlock = ref<HTMLElement | null>(null)
  const trackEl = ref<HTMLElement | null>(null)
  const repeatCount = ref(1)
  let position = 0
  let cycleWidth = 0
  let rafId = 0
  let lastTime = 0
  let running = false
  let resizeTimeout: number | undefined
  let observer: IntersectionObserver | null = null

  function step(now: number) {
    const elapsed = Math.min(now - lastTime, 50)
    lastTime = now
    position += speed * (elapsed / (1000 / 60))
    if (cycleWidth > 0 && position >= cycleWidth) position -= cycleWidth
    if (trackEl.value) trackEl.value.style.transform = `translate3d(${-position}px, 0, 0)`
    rafId = requestAnimationFrame(step)
  }

  function start() {
    if (running) return
    running = true
    lastTime = performance.now()
    rafId = requestAnimationFrame(step)
  }

  function stop() {
    running = false
    cancelAnimationFrame(rafId)
  }

  function measure() {
    if (!measureBlock.value) return
    const blockWidth = measureBlock.value.offsetWidth
    if (blockWidth <= 0) return

    repeatCount.value = Math.ceil((window.innerWidth * 2) / blockWidth) + 1
    void nextTick().then(() => {
      cycleWidth = cycleBlock.value?.offsetWidth ?? 0
      if (cycleWidth > 0) position %= cycleWidth
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    if (rootEl.value) observer.observe(rootEl.value)
    else start()
  })

  onUnmounted(() => {
    stop()
    observer?.disconnect()
    window.removeEventListener('resize', scheduleMeasure)
    if (resizeTimeout !== undefined) window.clearTimeout(resizeTimeout)
  })

  return { rootEl, measureBlock, cycleBlock, trackEl, repeatCount }
}
