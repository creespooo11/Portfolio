<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useCounter } from '../composables/useCounter'

const props = withDefaults(
  defineProps<{ end: number; label: string; prefix?: string; suffix?: string }>(),
  { prefix: '', suffix: '' },
)

const el = ref<HTMLElement | null>(null)
// toRef (not props.end) so a value that arrives after an async fetch
// (e.g. the stack size) still reaches the counter once it's known.
const { display } = useCounter(el, toRef(props, 'end'), { prefix: props.prefix, suffix: props.suffix })
</script>

<template>
  <div class="stat-item">
    <span ref="el" class="stat-value">{{ display }}</span>
    <span class="stat-label">{{ label }}</span>
  </div>
</template>
