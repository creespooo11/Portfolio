<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from '../lib/gsap'
import { getLenis } from '../composables/useLenis'

/**
 * Pill-shaped, fixed nav docked to the right edge. Hidden over the hero on
 * purpose (the hero already owns that screen), it fades/slides in once the
 * visitor scrolls past it and stays put for the rest of the page.
 */
const links = [
  { href: '#about', label: 'Sobre mí' },
  { href: '#work', label: 'Proyectos' },
  { href: '#contact', label: 'Contacto' },
]

const navEl = ref<HTMLElement | null>(null)
let tween: gsap.core.Tween | null = null

function scrollToSection(target: string) {
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(target, { offset: -20 })
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  if (!navEl.value) return
  tween = gsap.from(navEl.value, {
    opacity: 0,
    x: 40,
    duration: 0.6,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.hero',
      start: 'bottom top',
      toggleActions: 'play none none reverse',
    },
  })
})

onUnmounted(() => {
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<template>
  <nav ref="navEl" class="floating-nav" aria-label="Navegación flotante">
    <a
      v-for="link in links"
      :key="link.href"
      :href="link.href"
      class="floating-nav-link"
      @click.prevent="scrollToSection(link.href)"
      >{{ link.label }}</a
    >
    <a
      href="#contact"
      class="floating-nav-cta"
      aria-label="Ir a contacto"
      @click.prevent="scrollToSection('#contact')"
    >
      <span></span>
    </a>
  </nav>
</template>
