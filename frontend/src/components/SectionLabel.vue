<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { gsap, ScrollTrigger } from '../lib/gsap'

/**
 * The small label that precedes a big section heading (e.g. "PROYECTOS").
 * Stacks `repeat` dim, decorative copies behind the always-fully-visible
 * live label, and uses a scrubbed ScrollTrigger — tied to the *section's*
 * scroll range via `triggerEl`, not this small element's own bounds — to
 * sweep a soft highlight through the stack as the section scrolls by.
 * Subtle on purpose: the live label is always readable on its own.
 */
const props = withDefaults(
  defineProps<{ text: string; repeat?: number; triggerEl?: HTMLElement | null }>(),
  { repeat: 6, triggerEl: null },
)

const copyEls = ref<HTMLElement[]>([])
function setCopyEl(el: unknown, i: number) {
  if (el instanceof HTMLElement) copyEls.value[i] = el
}

let scrollTrigger: ScrollTrigger | null = null
let timeline: gsap.core.Timeline | null = null

function build() {
  const copies = copyEls.value.filter(Boolean)
  if (!copies.length || !props.triggerEl || timeline) return

  gsap.set(copies, { opacity: 0.14, scale: 0.98 })

  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: props.triggerEl,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  })
  scrollTrigger = timeline.scrollTrigger ?? null

  const step = 1 / copies.length
  copies.forEach((el, i) => {
    timeline!
      .to(el, { opacity: 1, scale: 1.04, duration: step * 0.6 }, i * step)
      .to(el, { opacity: 0.14, scale: 0.98, duration: step * 0.4 }, i * step + step * 0.6)
  })
}

onMounted(() => {
  if (props.triggerEl) build()
})

watch(
  () => props.triggerEl,
  (el) => {
    if (el) build()
  },
)

onUnmounted(() => {
  scrollTrigger?.kill()
  timeline?.kill()
})
</script>

<template>
  <span class="section-label">
    <span
      v-for="i in repeat"
      :key="i"
      :ref="(el) => setCopyEl(el, i - 1)"
      class="section-label-copy"
      :style="{ top: `${(i - 1) * 3}px` }"
      aria-hidden="true"
      >{{ text }}</span
    >
    <span class="section-label-live">{{ text }}</span>
  </span>
</template>
