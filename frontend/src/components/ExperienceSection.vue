<script setup lang="ts">
import { ref } from 'vue'
import { useStage } from '../composables/useStage'
import { experienceStage } from '../world/stages/experience'
import SectionLabel from './SectionLabel.vue'
import type { Experience } from '../api'

const props = defineProps<{ experience: Experience[] }>()

const sectionEl = ref<HTMLElement | null>(null)
const panelEls = ref<HTMLElement[]>([])

const { supported } = useStage(
  sectionEl,
  experienceStage({
    entries: props.experience.map((item) => ({ title: item.company, subtitle: item.role, tag: item.period })),
    panels: () => panelEls.value,
  }),
)
</script>

<template>
  <section
    id="formacion"
    ref="sectionEl"
    :class="['experience-section', 'stage-section', { 'is-static': !supported }]"
    :style="{ '--stage-height': `${130 + Math.max(0, experience.length - 1) * 80}vh` }"
  >
    <div class="stage-sticky">
      <div class="section-wrap stage-columns">
        <header class="stage-heading">
          <SectionLabel text="FORMACIÓN" :repeat="6" :trigger-el="sectionEl" />
          <h2>Formación.</h2>
        </header>

        <div class="stage-panels">
          <article
            v-for="(item, i) in experience"
            :key="item.id"
            :ref="(el) => el && (panelEls[i] = el as HTMLElement)"
            class="stage-panel"
          >
            <p class="panel-meta">
              <span class="panel-tag">{{ item.period }}</span>
            </p>
            <h3 class="panel-title panel-title--small">{{ item.role }}</h3>
            <p class="panel-company">{{ item.company }}</p>
            <p class="panel-text">{{ item.summary }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
