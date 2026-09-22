<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'
import SectionLabel from './SectionLabel.vue'
import type { Skill } from '../api'

const props = defineProps<{ skills: Skill[] }>()

const sectionEl = ref<HTMLElement | null>(null)
useScrollReveal(sectionEl)

const activeFilter = ref('Todos')

const categories = computed(() => ['Todos', ...new Set(props.skills.map((skill) => skill.category))])
const visibleSkills = computed(() =>
  activeFilter.value === 'Todos' ? props.skills : props.skills.filter((skill) => skill.category === activeFilter.value),
)
</script>

<template>
  <section ref="sectionEl" class="stack-section section--light">
    <div class="section-wrap">
      <SectionLabel text="STACK" :repeat="6" :trigger-el="sectionEl" />
      <h2>Stack.</h2>

      <div class="filter-list">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          :class="{ active: activeFilter === category }"
          @click="activeFilter = category"
        >
          {{ category }}
        </button>
      </div>

      <ul class="stack-list">
        <li v-for="(skill, i) in visibleSkills" :key="skill.id">
          <span class="stack-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="stack-name">{{ skill.name }}</span>
          <span class="stack-category">{{ skill.category }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
