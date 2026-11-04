<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { gsap } from '../lib/gsap'

/**
 * The oversized red phrase bleeding behind a section's copy (cipharvin.ro
 * style): same "scroll-cycle" idea as SectionLabel.vue — tie a scrub tween
 * to the *section's* own scroll range, not this element's — but sweeping
 * horizontally across the whole section instead of cycling opacity.
 */
const props = defineProps<{ text: string; triggerEl?: HTMLElement | null }>()

const el = ref<HTMLElement | null>(null)
let tween: gsap.core.Tween | null = null

function build() {
  if (!el.value || !props.triggerEl || tween) return
  tween = gsap.fromTo(
    el.value,
    { xPercent: 14 },
    {
      xPercent: -38,
      ease: 'none',
      scrollTrigger: {
        trigger: props.triggerEl,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    },
  )
}

onMounted(() => {
  if (props.triggerEl) build()
})

watch(
  () => props.triggerEl,
  (target) => {
    if (target) build()
  },
)

onUnmounted(() => {
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<template>
  <div ref="el" class="huge-phrase" aria-hidden="true">{{ text }}</div>
</template>
