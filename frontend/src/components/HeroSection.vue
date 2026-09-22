<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap, ScrollTrigger, SplitText } from '../lib/gsap'
import SystemClock from './SystemClock.vue'
import Marquee from './Marquee.vue'
import StatCounter from './StatCounter.vue'
import heroPhoto from '../assets/photos/javi-londres.webp'

defineProps<{ skillsCount: number }>()

const introText =
  'DESARROLLO PRODUCTOS DIGITALES CON ARQUITECTURAS REALES: MICROSERVICIOS, EVENTOS ASÍNCRONOS, BASES DE DATOS DISTRIBUIDAS.'

const heroEl = ref<HTMLElement | null>(null)
const bgImageEl = ref<HTMLElement | null>(null)
const nameEl = ref<HTMLElement | null>(null)
const subtitleEl = ref<HTMLElement | null>(null)

let split: SplitText | null = null
let parallaxTween: gsap.core.Tween | null = null

onMounted(() => {
  if (nameEl.value) {
    split = new SplitText(nameEl.value, { type: 'chars', charsClass: 'char' })
    gsap.from(split.chars, {
      y: 100,
      opacity: 0,
      stagger: 0.03,
      duration: 0.8,
      ease: 'power4.out',
    })
  }

  if (subtitleEl.value) {
    gsap.from(subtitleEl.value, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: 'power2.out',
      delay: 0.4,
    })
  }

  if (bgImageEl.value && heroEl.value) {
    // Background scrolls slower than the content: a smaller yPercent shift
    // than the page's own scroll distance reads as "lagging behind" it.
    parallaxTween = gsap.to(bgImageEl.value, {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: heroEl.value,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
  }
})

onUnmounted(() => {
  split?.revert()
  parallaxTween?.scrollTrigger?.kill()
  parallaxTween?.kill()
})
</script>

<template>
  <section ref="heroEl" class="hero">
    <div class="hero-bg">
      <img ref="bgImageEl" :src="heroPhoto" alt="" class="hero-bg-image" />
      <div class="hero-bg-overlay"></div>
    </div>

    <div class="hero-system">
      <SystemClock label="ALICANTE, ES" />
    </div>

    <div class="hero-copy">
      <h1 ref="nameEl" class="hero-name">JAVIER CRESPO MOLL</h1>
      <p ref="subtitleEl" class="hero-subtitle">DESARROLLADOR WEB FULLSTACK. JAVA · SPRING BOOT · VUE.JS.</p>

      <div class="hero-stats">
        <StatCounter :end="2" label="PRÁCTICAS PROFESIONALES" />
        <StatCounter :end="3" label="PROYECTOS EN PRODUCCIÓN" />
        <StatCounter :end="2024" prefix="DESDE " label="EN EL SECTOR" />
        <StatCounter :end="skillsCount" label="TECNOLOGÍAS EN EL STACK" />
      </div>
    </div>

    <Marquee class="hero-marquee" :items="[introText]" />
  </section>
</template>
