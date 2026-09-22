<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { usePortfolioData } from './composables/usePortfolioData'
import { useLenis } from './composables/useLenis'
import { ScrollTrigger } from './lib/gsap'
import SiteHeader from './components/SiteHeader.vue'
import FloatingNav from './components/FloatingNav.vue'
import HeroSection from './components/HeroSection.vue'
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
    <SiteHeader />
    <FloatingNav />

    <main id="top">
      <HeroSection :skills-count="skills.length" />

      <AboutSection />

      <div v-if="loading" class="loading-state section-wrap">Cargando proyectos desde portfolio-service...</div>
      <div v-else-if="error" class="error-state section-wrap">{{ error }}</div>
      <ProjectsSection v-else :projects="projects" />

      <StackSection :skills="skills" />
      <ExperienceSection :experience="experience" />
      <ContactSection />
    </main>

    <SiteFooter />
  </div>
</template>
