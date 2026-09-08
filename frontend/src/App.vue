<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { portfolioApi, type Experience, type Project, type Skill } from './api'

const projects = ref<Project[]>([])
const skills = ref<Skill[]>([])
const experience = ref<Experience[]>([])
const loading = ref(true)
const error = ref('')
const activeFilter = ref('Todos')
const techStack = ['JAVA', 'SPRING BOOT', 'VUE.JS', 'POSTGRESQL', 'DOCKER', 'KAFKA']
const tickerBlock = ref<HTMLElement | null>(null)
const tickerCycleBlock = ref<HTMLElement | null>(null)
const tickerPosition = ref(0)
const repeatCount = ref(1)
let tickerBlockWidth = 0
let tickerCycleWidth = 0
let tickerRafId = 0
let tickerResizeTimeout: number | undefined

function tickerStep() {
  tickerPosition.value += 0.6
  if (tickerCycleWidth > 0 && tickerPosition.value >= tickerCycleWidth) {
    tickerPosition.value -= tickerCycleWidth
  }
  tickerRafId = requestAnimationFrame(tickerStep)
}

function measureTicker() {
  if (tickerBlock.value) {
    tickerBlockWidth = tickerBlock.value.offsetWidth
    if (tickerBlockWidth > 0) {
      repeatCount.value = Math.ceil((window.innerWidth * 2) / tickerBlockWidth) + 1
      void nextTick().then(() => {
        tickerCycleWidth = tickerCycleBlock.value?.offsetWidth ?? 0
        if (tickerCycleWidth > 0) {
          tickerPosition.value %= tickerCycleWidth
        }
      })
    }
  }
}

function scheduleTickerMeasurement() {
  if (tickerResizeTimeout !== undefined) {
    window.clearTimeout(tickerResizeTimeout)
  }
  tickerResizeTimeout = window.setTimeout(measureTicker, 150)
}

const skillCategories = computed(() => ['Todos', ...new Set(skills.value.map((skill) => skill.category))])
const visibleSkills = computed(() => activeFilter.value === 'Todos'
  ? skills.value
  : skills.value.filter((skill) => skill.category === activeFilter.value))

onMounted(async () => {
  await nextTick()
  measureTicker()
  window.addEventListener('resize', scheduleTickerMeasurement)
  tickerRafId = requestAnimationFrame(tickerStep)

  try {
    ;[projects.value, skills.value, experience.value] = await Promise.all([
      portfolioApi.projects(),
      portfolioApi.skills(),
      portfolioApi.experience(),
    ])
  } catch {
    error.value = 'No se ha podido cargar el contenido. Comprueba que la API esté activa.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  cancelAnimationFrame(tickerRafId)
  window.removeEventListener('resize', scheduleTickerMeasurement)
  if (tickerResizeTimeout !== undefined) {
    window.clearTimeout(tickerResizeTimeout)
  }
})
</script>

<template>
  <div class="site-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Javier Crespo, inicio">JC<span>.</span></a>
      <nav aria-label="Navegación principal">
        <a href="#work">Trabajo</a>
        <a href="#about">Sobre mí</a>
        <a href="#contact">Contacto</a>
      </nav>
      <a class="availability" href="#contact"><i></i> Disponible para colaborar</a>
    </header>

    <main id="top">
      <section class="hero section-wrap">
        <div class="hero-copy reveal">
          <p class="eyebrow">Desarrollador fullstack · Alicante</p>
          <h1>Construyo productos digitales <em>con intención.</em></h1>
          <p class="hero-intro">Soy Javier, desarrollador web y estudiante de DAW. Me muevo entre interfaces claras, APIs robustas y sistemas que tienen algo que decir.</p>
          <div class="hero-actions">
            <a class="button button-dark" href="#work">Ver proyectos <span>↘</span></a>
            <a class="text-link" href="https://github.com/Crespooo11" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
        <div class="hero-art reveal" aria-label="Composición abstracta de interfaz y código">
          <div class="art-grid"></div>
          <div class="art-card art-card-main"><span class="code-dot"></span><span class="code-line long"></span><span class="code-line medium"></span><span class="code-line short"></span><strong>build<br>something<br>useful.</strong></div>
          <div class="art-note">01 / 03<br><b>Portfolio<br>system</b></div>
          <div class="art-orbit">✳</div>
        </div>
      </section>

      <section class="ticker" aria-label="Tecnologías"><div ref="tickerBlock" class="ticker-content ticker-measure" aria-hidden="true"><span v-for="tech in techStack" :key="`measure-${tech}`">{{ tech }} <span class="dot">✳</span> </span></div><div class="ticker-track" :data-repeat-count="repeatCount" :data-pass-width="tickerBlockWidth" :data-cycle-width="tickerCycleWidth" :style="{ transform: `translateX(-${tickerPosition}px)` }"><div ref="tickerCycleBlock" class="ticker-content"><template v-for="repeat in repeatCount" :key="`first-${repeat}`"><span v-for="tech in techStack" :key="`first-${repeat}-${tech}`">{{ tech }} <span class="dot">✳</span> </span></template></div><div class="ticker-content" aria-hidden="true"><template v-for="repeat in repeatCount" :key="`second-${repeat}`"><span v-for="tech in techStack" :key="`second-${repeat}-${tech}`">{{ tech }} <span class="dot">✳</span> </span></template></div></div></section>

      <section id="work" class="section-wrap work-section">
        <div class="section-heading"><div><p class="eyebrow">Selección de trabajo</p><h2>Proyectos que <em>mueven cosas.</em></h2></div><span class="section-index">01 — 03</span></div>
        <div v-if="loading" class="loading-state">Cargando proyectos desde portfolio-service...</div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else class="project-list">
          <article v-for="(project, index) in projects" :key="project.id" class="project-row">
            <div class="project-number">0{{ index + 1 }}</div>
            <div class="project-info"><p class="project-type">{{ project.featured ? 'Proyecto destacado' : 'Proyecto personal' }}</p><h3>{{ project.name }}</h3><p>{{ project.description }}</p></div>
            <a class="round-arrow" :href="project.repositoryUrl" target="_blank" rel="noreferrer" :aria-label="`Ver ${project.name} en GitHub`">↗</a>
          </article>
        </div>
      </section>

      <section id="about" class="about-section">
        <div class="section-wrap about-grid">
          <div><p class="eyebrow">Un poco de contexto</p><h2>Del modelo de datos a la <em>última interacción.</em></h2></div>
          <div class="about-copy"><p>He completado el grado de DAM y actualmente estudio Desarrollo de Aplicaciones Web en el IES La Mola. Me interesa entender el sistema completo, no solo la pantalla que se ve.</p><p>Este portfolio es también un laboratorio: una aplicación real para aprender, probar decisiones y compartir el resultado.</p><a class="text-link" href="#contact">Hablemos de tu proyecto ↗</a></div>
        </div>
      </section>

      <section class="section-wrap skill-section">
        <div class="section-heading"><div><p class="eyebrow">Caja de herramientas</p><h2>Stack con <em>criterio.</em></h2></div><span class="section-index">02 — 03</span></div>
        <div class="filter-list"><button v-for="category in skillCategories" :key="category" :class="{ active: activeFilter === category }" @click="activeFilter = category">{{ category }}</button></div>
        <div v-if="loading" class="loading-state">Cargando stack...</div>
        <div v-else class="skill-grid"><div v-for="skill in visibleSkills" :key="skill.id" class="skill-item"><span>✳</span>{{ skill.name }}<small v-if="activeFilter !== 'Todos'">{{ skill.category }}</small></div></div>
      </section>

      <section class="experience-section"><div class="section-wrap experience-grid"><div><p class="eyebrow">Dónde estoy ahora</p><h2>Experiencia &<br><em>aprendizaje.</em></h2></div><div v-if="loading" class="loading-state">Cargando trayectoria...</div><div v-else class="experience-list"><article v-for="item in experience" :key="item.id"><span class="period">{{ item.period }}</span><div><h3>{{ item.role }}</h3><p class="company">{{ item.company }}</p><p>{{ item.summary }}</p></div></article></div></div></section>

      <section id="contact" class="contact-section"><div class="section-wrap contact-inner"><p class="eyebrow">¿Tienes una idea?</p><h2>Hagamos algo<br><em>que importe.</em></h2><a class="contact-email" href="mailto:crespomollj@gmail.com">crespomollj@gmail.com ↗</a><div class="contact-footer"><span>Javier Crespo · 2026</span><span>Diseñado y construido con curiosidad.</span></div></div></section>
    </main>
    <footer class="site-footer section-wrap"><span>JC.</span><span>Scroll to explore ↗</span></footer>
  </div>
</template>
