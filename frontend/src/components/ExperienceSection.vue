<script setup lang="ts">
import { ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'
import SectionLabel from './SectionLabel.vue'
import type { Experience } from '../api'

defineProps<{ experience: Experience[] }>()

const sectionEl = ref<HTMLElement | null>(null)
useScrollReveal(sectionEl)
</script>

<template>
  <section ref="sectionEl" class="experience-section">
    <div class="section-wrap">
      <SectionLabel text="EXPERIENCIA" :repeat="6" :trigger-el="sectionEl" />
      <h2>Experiencia.</h2>
      <div class="experience-list">
        <article v-for="item in experience" :key="item.id">
          <span class="period">{{ item.period }}</span>
          <div>
            <h3>{{ item.role }}</h3>
            <p class="company">{{ item.company }}</p>
            <p>{{ item.summary }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
