import { onMounted, onUnmounted, type Ref } from 'vue'
import { world, type StageFactory } from '../world/world'

/**
 * Registers a section's 3D stage with the shared world. The factory runs
 * once the world (and three.js) is ready; the stage is shown whenever this
 * section sits under the middle of the viewport.
 */
export function useStage(sectionEl: Ref<HTMLElement | null>, factory: StageFactory) {
  let unregister: (() => void) | null = null

  onMounted(() => {
    if (!world.supported || !sectionEl.value) return
    unregister = world.register(sectionEl.value, factory)
  })

  onUnmounted(() => unregister?.())

  return { supported: world.supported, ready: world.ready }
}
