<script setup lang="ts">
import SystemClock from './SystemClock.vue'
import Marquee from './Marquee.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <Marquee class="footer-marquee" :items="['JAVIER CRESPO MOLL']" :speed="0.4" />

    <div class="section-wrap site-footer-inner">
      <a class="brand" href="#top" aria-label="Javier Crespo Moll, inicio">JC<span>.</span></a>
      <SystemClock label="ALICANTE, ES" />
      <nav class="footer-links" aria-label="Enlaces">
        <a href="https://github.com/creespooo11" target="_blank" rel="noreferrer">GitHub ↗</a>
        <a href="https://www.linkedin.com/in/javier-crespo-moll-b878a5398" target="_blank" rel="noreferrer"
          >LinkedIn ↗</a
        >
        <a href="mailto:crespomollj@gmail.com">crespomollj@gmail.com ↗</a>
      </nav>
      <span class="footer-year">© {{ year }} Javier Crespo Moll</span>
    </div>
  </footer>
</template>
