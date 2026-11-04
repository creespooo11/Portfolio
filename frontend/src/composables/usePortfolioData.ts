import { onMounted, ref } from 'vue'
import { portfolioApi, type Experience, type Project, type Skill } from '../api'

/** Fetches portfolio-service content once on mount. */
export function usePortfolioData() {
  const projects = ref<Project[]>([])
  const skills = ref<Skill[]>([])
  const experience = ref<Experience[]>([])
  const loading = ref(true)
  const error = ref('')

  onMounted(async () => {
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

  return { projects, skills, experience, loading, error }
}
