<script setup lang="ts">
import { ref } from 'vue'
import { useStage } from '../composables/useStage'
import { aboutStage } from '../world/stages/about'
import SectionLabel from './SectionLabel.vue'
import HugePhrase from './HugePhrase.vue'

const sectionEl = ref<HTMLElement | null>(null)
useStage(sectionEl, aboutStage())
</script>

<template>
  <section id="about" ref="sectionEl" class="about-section stage-section">
    <div class="stage-sticky">
      <HugePhrase text="PROGRAMADOR" :trigger-el="sectionEl" />
      <div class="section-wrap about-layout">
        <div class="about-copy stage-panel">
          <SectionLabel text="SOBRE MÍ" :repeat="6" :trigger-el="sectionEl" />
          <h2>Sobre <em>mí.</em></h2>
          <p>
            Soy Javier Crespo Moll, desarrollador web junior en Alicante. He completado el grado de DAM y
            ahora curso Desarrollo de Aplicaciones Web: empecé en el sector en 2024 y me interesa el
            sistema completo, no solo la pantalla que se ve.
          </p>
          <p>
            He hecho dos prácticas profesionales: en Sweet Code Chef desarrollando plugins de
            WordPress para formularios y automatizaciones de email, y en Ryofit construyendo
            powersupps.es de principio a fin, con automatizaciones n8n sincronizando pedidos con
            Miravia, Temu y TikTok Shop.
          </p>
          <p>
            Construyo cosas que funcionan de verdad en producción, no solo ejercicios: VitSync,
            PowerSupps y este mismo portfolio son la prueba.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
