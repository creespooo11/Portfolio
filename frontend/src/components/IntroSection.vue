<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStage } from '../composables/useStage'
import { useScramble } from '../composables/useScramble'
import { scrollToSection } from '../composables/useScrollTo'
import { introStage } from '../world/stages/intro'
import SystemClock from './SystemClock.vue'

const sectionEl = ref<HTMLElement | null>(null)
const hudEl = ref<SVGSVGElement | null>(null)
const placed = ref(0)
const total = ref(0)

const { supported } = useStage(sectionEl, (ctx) =>
  introStage({
    section: sectionEl.value!,
    hud: hudEl.value,
    onPlaced(count, of) {
      placed.value = count
      total.value = of
    },
  })(ctx),
)

const manifestoText =
  'Construyo productos web de principio a fin: APIs en Java y Spring Boot, eventos con Kafka e interfaces en Vue.'

// The name itself is never scrambled: it's the page's h1 and must be
// complete and legible from the very first frame.
const role = useScramble('Desarrollador web fullstack', 500, 700)
const manifesto = useScramble(manifestoText, 800, 1300)

const counter = computed(() => `${String(placed.value).padStart(2, '0')}/${total.value || '--'}`)
const complete = computed(() => total.value > 0 && placed.value === total.value)
</script>

<template>
  <section id="intro" ref="sectionEl" class="intro">
    <div class="intro-stage">
      <div v-if="!supported" class="intro-fallback" aria-hidden="true">JC<span>.</span></div>

      <svg ref="hudEl" class="intro-hud" aria-hidden="true"></svg>

      <div class="intro-chrome">
        <div class="intro-corner intro-corner--tl">
          <a class="intro-brand" href="#intro" aria-label="Volver al inicio">JC<span>.</span></a>
          <div>
            <h1 class="intro-name">Javier Crespo Moll</h1>
            <p class="intro-role" aria-label="Desarrollador web fullstack">{{ role }}</p>
          </div>
        </div>

        <div class="intro-corner intro-corner--tr">
          <p class="intro-manifesto" :aria-label="manifestoText">{{ manifesto }}</p>
        </div>

        <div class="intro-corner intro-corner--bl">
          <p v-if="supported" class="intro-count">
            <span :class="['intro-status', { 'is-complete': complete }]" aria-hidden="true"></span>
            {{ counter }} bloques
          </p>
          <button type="button" class="intro-enter" @click="scrollToSection('#about')">
            Scroll para entrar <span aria-hidden="true">↓</span>
          </button>
        </div>

        <div class="intro-corner intro-corner--br">
          <SystemClock label="Alicante, ES" />
        </div>
      </div>
    </div>
  </section>
</template>
