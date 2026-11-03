<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { usePortfolioData } from './composables/usePortfolioData'
import { useLenis } from './composables/useLenis'
import { ScrollTrigger } from './lib/gsap'
import WorldCanvas from './components/WorldCanvas.vue'
import IntroSection from './components/IntroSection.vue'
import FloatingNav from './components/FloatingNav.vue'
import AboutSection from './components/AboutSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import StackSection from './components/StackSection.vue'
import ExperienceSection from './components/ExperienceSection.vue'
import ContactSection from './components/ContactSection.vue'
import SiteFooter from './components/SiteFooter.vue'

useLenis()

const { projects, skills, experience, loading, error } = usePortfolioData()

// Sections below the hero only mount once the data has arrived, so their
// own ScrollTriggers measure correct positions already; this is just a
// safety net in case anything above them shifted layout after that.
watch(loading, async (isLoading) => {
  if (isLoading) return
  await nextTick()
  ScrollTrigger.refresh()
})
</script>

<template>
  <div class="site-shell">
    <WorldCanvas />
    <IntroSection />
    <FloatingNav />

    <main id="top">
      <AboutSection />

      <div v-if="loading" class="loading-state section-wrap">Cargando proyectos desde portfolio-service...</div>
      <div v-else-if="error" class="error-state section-wrap">{{ error }}</div>
      <!-- Each of these builds its 3D stage from the data on mount, so they
           only mount once it has arrived. -->
      <template v-else>
        <ProjectsSection :projects="projects" />
        <StackSection :skills="skills" />
        <ExperienceSection :experience="experience" />
      </template>
      <ContactSection />
    </main>

    <SiteFooter />
  </div>
</template>
