<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStage } from '../composables/useStage'
import { stackStage } from '../world/stages/stack'
import SectionLabel from './SectionLabel.vue'
import type { Skill } from '../api'

const props = defineProps<{ skills: Skill[] }>()

const sectionEl = ref<HTMLElement | null>(null)
const labelEls = ref<HTMLElement[]>([])

const categories = computed(() => [...new Set(props.skills.map((skill) => skill.category))])

const { supported } = useStage(sectionEl, (ctx) =>
  stackStage({ count: props.skills.length, labels: () => labelEls.value, section: sectionEl.value! })(ctx),
)
</script>

<template>
  <section ref="sectionEl" :class="['stack-section', 'stage-section', { 'is-static': !supported }]">
    <div class="stage-sticky">
      <div class="section-wrap stack-head stage-heading">
        <SectionLabel text="STACK" :repeat="6" :trigger-el="sectionEl" />
        <h2>Stack.</h2>
        <p class="stack-summary">
          {{ skills.length }} tecnologías con las que trabajo: {{ categories.join(', ').toLowerCase() }}.
        </p>
      </div>

      <!-- Each label is pinned onto its node of the ring by the 3D stage. -->
      <ul class="stack-labels">
        <li
          v-for="(skill, i) in skills"
          :key="skill.id"
          :ref="(el) => el && (labelEls[i] = el as HTMLElement)"
          class="stack-label"
        >
          <span class="stack-label-index">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="stack-label-name">{{ skill.name }}</span>
          <span class="stack-label-category">{{ skill.category }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
