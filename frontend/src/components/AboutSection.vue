<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from '../lib/gsap'
import { useScrollReveal } from '../composables/useScrollReveal'
import SectionLabel from './SectionLabel.vue'
import HugePhrase from './HugePhrase.vue'
import aboutPhoto from '../assets/photos/javi-vaticano.webp'

const sectionEl = ref<HTMLElement | null>(null)
const imageEl = ref<HTMLElement | null>(null)
const textEl = ref<HTMLElement | null>(null)

useScrollReveal(sectionEl)

const tweens: gsap.core.Tween[] = []

onMounted(() => {
  if (imageEl.value) {
    tweens.push(
      gsap.from(imageEl.value, {
        scale: 1.1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: imageEl.value,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }),
    )
  }

  if (textEl.value) {
    tweens.push(
      gsap.from(textEl.value, {
        opacity: 0,
        x: 60,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: textEl.value,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }),
    )
  }
})

onUnmounted(() => {
  tweens.forEach((tween) => {
    tween.scrollTrigger?.kill()
    tween.kill()
  })
})
</script>

<template>
  <section id="about" ref="sectionEl" class="about-section section--light">
    <HugePhrase text="PROGRAMADOR" :trigger-el="sectionEl" />
    <div class="section-wrap about-grid">
      <div class="about-media">
        <img ref="imageEl" :src="aboutPhoto" alt="Javier Crespo Moll en la Plaza de San Pedro, Roma" />
      </div>
      <div ref="textEl" class="about-copy">
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
  </section>
</template>
