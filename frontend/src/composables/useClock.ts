import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Real-time clock formatted for a given IANA timezone, ticking every second.
 * Used for the "system" widget in the hero corner and repeated in the footer.
 */
export function useClock(timeZone = 'Europe/Madrid', locale = 'es-ES') {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const time = ref(formatter.format(new Date()))
  let intervalId: number | undefined

  onMounted(() => {
    intervalId = window.setInterval(() => {
      time.value = formatter.format(new Date())
    }, 1000)
  })

  onUnmounted(() => {
    if (intervalId !== undefined) window.clearInterval(intervalId)
  })

  return { time }
}
