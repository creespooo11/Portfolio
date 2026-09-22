import { reactive, ref } from 'vue'
import { ContactValidationError, contactApi } from '../api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * State and submit logic for the contact form. Calls contact-service's
 * POST /api/contact exactly as before the redesign: 202 Accepted clears the
 * form and shows a success message, 400 shows the field-level validation
 * errors, anything else (network/server) shows a generic error — in every
 * case without losing what the user already typed.
 */
export function useContactForm() {
  const form = reactive({
    name: '',
    email: '',
    message: '',
  })
  const submitting = ref(false)
  const error = ref('')
  const success = ref(false)

  function validate(): string | null {
    if (!form.name.trim()) return 'El nombre es obligatorio.'
    if (!form.email.trim() || !EMAIL_PATTERN.test(form.email.trim())) {
      return 'Introduce un email con un formato válido.'
    }
    if (!form.message.trim()) return 'El mensaje es obligatorio.'
    return null
  }

  async function submit() {
    success.value = false

    const clientError = validate()
    if (clientError) {
      error.value = clientError
      return
    }

    submitting.value = true
    error.value = ''

    try {
      await contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      })
      success.value = true
      form.name = ''
      form.email = ''
      form.message = ''
    } catch (err) {
      if (err instanceof ContactValidationError) {
        error.value = err.details.length
          ? err.details.map((detail) => detail.message).join(' ')
          : 'Revisa los datos del formulario e inténtalo de nuevo.'
      } else {
        error.value = 'No se ha podido enviar el mensaje. Comprueba tu conexión e inténtalo de nuevo.'
      }
    } finally {
      submitting.value = false
    }
  }

  return { form, submitting, error, success, submit }
}
