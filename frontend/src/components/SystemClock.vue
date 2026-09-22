<script setup lang="ts">
import { useClock } from '../composables/useClock'

withDefaults(defineProps<{ label?: string }>(), { label: 'ALICANTE, ES' })

const { time } = useClock()
</script>

<template>
  <div class="system-clock">
    <span class="system-clock-dot" aria-hidden="true"></span>
    <span class="system-clock-time">{{ time }}</span>
    <span class="system-clock-label">{{ label }}</span>
  </div>
</template>
