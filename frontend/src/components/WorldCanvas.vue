<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { world } from '../world/world'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const ready = world.ready

// Without WebGL there's no director to fade sections in: they fall back
// to plain flowing pages (see .no-world in style.css).
document.documentElement.classList.toggle('no-world', !world.supported)

onMounted(() => {
  if (canvasEl.value) void world.start(canvasEl.value)
})

onUnmounted(() => world.stop())
</script>

<template>
  <canvas v-if="world.supported" ref="canvasEl" :class="['world-canvas', { 'is-ready': ready }]" aria-hidden="true"></canvas>
</template>
