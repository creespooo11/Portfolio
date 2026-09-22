<script setup lang="ts">
import { useMarquee } from '../composables/useMarquee'

const props = withDefaults(defineProps<{ items: string[]; separator?: string; speed?: number }>(), {
  separator: '✳',
  speed: 0.6,
})

const { measureBlock, cycleBlock, position, repeatCount } = useMarquee(props.speed)
</script>

<template>
  <div class="marquee">
    <div ref="measureBlock" class="marquee-content marquee-measure" aria-hidden="true">
      <span v-for="(item, i) in items" :key="`measure-${i}`">{{ item }} <span class="marquee-dot">{{ separator }}</span> </span>
    </div>
    <div class="marquee-track" :style="{ transform: `translateX(-${position}px)` }">
      <div ref="cycleBlock" class="marquee-content">
        <template v-for="repeat in repeatCount" :key="`first-${repeat}`">
          <span v-for="(item, i) in items" :key="`first-${repeat}-${i}`">{{ item }} <span class="marquee-dot">{{ separator }}</span> </span>
        </template>
      </div>
      <div class="marquee-content" aria-hidden="true">
        <template v-for="repeat in repeatCount" :key="`second-${repeat}`">
          <span v-for="(item, i) in items" :key="`second-${repeat}-${i}`">{{ item }} <span class="marquee-dot">{{ separator }}</span> </span>
        </template>
      </div>
    </div>
  </div>
</template>
