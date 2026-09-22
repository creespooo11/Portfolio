<script setup lang="ts">
import { ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'
import { useContactForm } from '../composables/useContactForm'
import contactPhoto from '../assets/photos/javi-budapest.webp'

const sectionEl = ref<HTMLElement | null>(null)
useScrollReveal(sectionEl)

const { form, submitting, error, success, submit } = useContactForm()
</script>

<template>
  <section id="contact" ref="sectionEl" class="contact-section">
    <div class="contact-bg">
      <img :src="contactPhoto" alt="" />
      <div class="contact-bg-overlay"></div>
    </div>

    <div class="section-wrap">
      <h2 class="contact-headline">
        Hablemos<br />
        de tu<br />
        próximo<br />
        <em>proyecto.</em>
      </h2>

      <form class="contact-form" novalidate @submit.prevent="submit">
        <div class="underline-field">
          <label for="contact-name">Nombre</label>
          <input
            id="contact-name"
            v-model.trim="form.name"
            type="text"
            name="name"
            autocomplete="name"
            :disabled="submitting"
            required
          />
        </div>
        <div class="underline-field">
          <label for="contact-email">Email</label>
          <input
            id="contact-email"
            v-model.trim="form.email"
            type="email"
            name="email"
            autocomplete="email"
            :disabled="submitting"
            required
          />
        </div>
        <div class="underline-field">
          <label for="contact-message">Mensaje</label>
          <textarea
            id="contact-message"
            v-model.trim="form.message"
            name="message"
            rows="2"
            :disabled="submitting"
            required
          ></textarea>
        </div>

        <p v-if="error" class="form-message form-message-error" role="alert">{{ error }}</p>
        <p v-if="success" class="form-message form-message-success" role="status">
          Gracias, tu mensaje se ha enviado correctamente. Te responderé en cuanto pueda.
        </p>

        <button type="submit" class="button button-outline" :disabled="submitting">
          <span>{{ submitting ? 'Enviando…' : 'Enviar mensaje' }}</span>
        </button>
      </form>
    </div>
  </section>
</template>
