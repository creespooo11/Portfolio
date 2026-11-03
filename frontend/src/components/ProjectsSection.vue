<script setup lang="ts">
import { ref } from 'vue'
import { useStage } from '../composables/useStage'
import { projectsStage } from '../world/stages/projects'
import SectionLabel from './SectionLabel.vue'
import type { Project } from '../api'

const props = defineProps<{ projects: Project[] }>()

const sectionEl = ref<HTMLElement | null>(null)
const calloutsEl = ref<SVGSVGElement | null>(null)
const panelEls = ref<HTMLElement[]>([])

/**
 * portfolio-service doesn't model a "tag"/category for projects (only
 * name/description/urls/imageUrl), so the short label shown next to each
 * project name is a small presentation-only mapping here. Unknown project
 * names fall back to a generic label instead of breaking.
 */
const TAGS: Record<string, string> = {
  vitsync: 'MEDTECH',
  powersupps: 'E-COMMERCE',
  portfolio: 'FULLSTACK',
}

function tagFor(name: string): string {
  return TAGS[name.trim().toLowerCase()] ?? 'PROYECTO'
}

const { supported } = useStage(
  sectionEl,
  projectsStage({
    names: props.projects.map((project) => project.name),
    panels: () => panelEls.value,
    callouts: () => calloutsEl.value,
  }),
)

const total = String(props.projects.length).padStart(2, '0')
</script>

<template>
  <section
    id="work"
    ref="sectionEl"
    :class="['projects-section', 'stage-section', { 'is-static': !supported }]"
    :style="{ '--stage-height': `${100 + projects.length * 90}vh` }"
  >
    <div class="stage-sticky">
      <svg ref="calloutsEl" class="stage-callouts" aria-hidden="true"></svg>
      <div class="section-wrap stage-columns">
        <header class="stage-heading">
          <SectionLabel text="PROYECTOS" :repeat="6" :trigger-el="sectionEl" />
          <h2>Proyectos.</h2>
        </header>

        <div class="stage-panels">
          <article
            v-for="(project, i) in projects"
            :key="project.id"
            :ref="(el) => el && (panelEls[i] = el as HTMLElement)"
            class="stage-panel project-panel"
          >
            <p class="panel-meta">
              <span>{{ String(i + 1).padStart(2, '0') }} / {{ total }}</span>
              <span class="panel-tag">{{ tagFor(project.name) }}</span>
            </p>
            <h3 class="panel-title">{{ project.name }}</h3>
            <p class="panel-text">{{ project.description }}</p>
            <p class="panel-links">
              <a v-if="project.liveUrl" :href="project.liveUrl" target="_blank" rel="noreferrer">Ver web ↗</a>
              <a :href="project.repositoryUrl" target="_blank" rel="noreferrer">Código ↗</a>
            </p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
