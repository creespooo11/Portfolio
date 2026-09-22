<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'
import { gsap } from '../lib/gsap'
import { useScrollReveal } from '../composables/useScrollReveal'
import SectionLabel from './SectionLabel.vue'
import type { Project } from '../api'

const props = defineProps<{ projects: Project[]; }>()

const sectionEl = ref<HTMLElement | null>(null)
useScrollReveal(sectionEl)

/**
 * portfolio-service doesn't model a "tag"/category for projects (only
 * name/description/urls/imageUrl), so the short label shown next to each
 * project name in the hover list is a small presentation-only mapping here.
 * Unknown project names fall back to a generic label instead of breaking.
 */
const TAGS: Record<string, string> = {
  vitsync: 'MEDTECH',
  powersupps: 'E-COMMERCE',
  portfolio: 'FULLSTACK',
}

function tagFor(name: string): string {
  return TAGS[name.trim().toLowerCase()] ?? 'PROYECTO'
}

function linkFor(project: Project): string {
  return project.liveUrl || project.repositoryUrl
}

function resolveImage(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  return new URL(`../assets/projects/${imageUrl}`, import.meta.url).href
}

const listEl = ref<HTMLElement | null>(null)
// The image and its red overlay are animated together as one unit (the
// overlay has no visibility of its own) so they can never drift out of
// sync or show up before/without an actual hover.
const previewFrameEl = ref<HTMLElement | null>(null)
const cursor = ref({ x: 0, y: 0 })
const currentImage = ref<string | null>(null)
let previewTween: gsap.core.Tween | null = null

function onMouseMove(event: MouseEvent) {
  const rect = listEl.value?.getBoundingClientRect()
  if (!rect) return
  cursor.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onEnter(project: Project) {
  const image = resolveImage(project.imageUrl)
  if (!image) return
  currentImage.value = image
  // On the very first hover the frame doesn't exist in the DOM yet (v-if
  // just turned true): wait for Vue to patch before handing it to GSAP.
  void nextTick(() => {
    if (previewFrameEl.value) {
      previewTween?.kill()
      previewTween = gsap.to(previewFrameEl.value, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' })
    }
  })
}

function onLeave() {
  if (previewFrameEl.value) {
    previewTween?.kill()
    previewTween = gsap.to(previewFrameEl.value, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power2.out' })
  }
}

onUnmounted(() => {
  previewTween?.kill()
})
</script>

<template>
  <section id="work" ref="sectionEl" class="projects-section">
    <div class="section-wrap">
      <SectionLabel text="PROYECTOS" :repeat="6" :trigger-el="sectionEl" />
      <h2>Proyectos.</h2>

      <nav ref="listEl" class="project-nav" @mousemove="onMouseMove" @mouseleave="onLeave">
        <a
          v-for="project in props.projects"
          :key="project.id"
          :href="linkFor(project)"
          target="_blank"
          rel="noreferrer"
          class="project-nav-item"
          @mouseenter="onEnter(project)"
          @focus="onEnter(project)"
          @blur="onLeave"
        >
          <span class="project-nav-name">{{ project.name }}</span>
          <span class="project-nav-tag">{{ tagFor(project.name) }}</span>
        </a>

        <div class="project-preview" :style="{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }">
          <div v-if="currentImage" ref="previewFrameEl" class="project-preview-frame">
            <img :src="currentImage" alt="" class="project-preview-image" />
            <div class="project-preview-overlay"></div>
          </div>
        </div>
      </nav>
    </div>
  </section>
</template>
