import { gsap } from '../../lib/gsap'
import { createMonogram, smoothstep } from '../bricks'
import type { StageFactory } from '../world'

/**
 * "Contacto": the JC monogram builds itself again next to the form, closing
 * the loop with the intro. It assembles the first time the section is
 * shown and then just breathes and follows the cursor.
 */
export function contactStage(): StageFactory {
  return (ctx) => {
    const { THREE, camera, reducedMotion } = ctx
    const monogram = createMonogram(ctx)
    const holder = new THREE.Group()
    holder.add(monogram.group)
    const group = new THREE.Group()
    group.add(holder)

    const build = monogram.pieces.map(() => ({ value: reducedMotion ? 1 : 0 }))
    const indexOf = new Map(monogram.pieces.map((piece, i) => [piece, i]))
    let tweens: gsap.core.Tween[] = []
    let started = false

    return {
      group,
      update(frame) {
        const { time, ambient, pointer, presence } = frame
        // Bricks start flying in the moment the stage shows, so they're
        // already in motion while it fades in (not still, then a jolt).
        if (!started && presence > 0) {
          started = true
          if (!reducedMotion) {
            tweens = build.map((state, i) =>
              gsap.to(state, {
                value: 1,
                duration: 1.5,
                ease: 'expo.out',
                delay: monogram.pieces[i].row * 0.06 + Math.random() * 0.15,
              }),
            )
          }
        }

        let assembled = 0
        monogram.pose(time, ambient, (piece) => {
          const value = build[indexOf.get(piece)!].value
          assembled += value
          return value
        })
        assembled /= monogram.pieces.length
        const glow = Math.pow(smoothstep(0.55, 1, assembled), 2) * 1.4 * (1 + Math.sin(time * 1.7) * 0.06 * ambient)
        monogram.setGlow(glow)

        const portrait = camera.aspect < 1
        // Layout is sized for the base distance; the camera pushes in from it.
        const baseDistance = portrait ? 40 : 30
        const distance = baseDistance - frame.progress * 5
        const viewTan = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        const viewW = baseDistance * viewTan * camera.aspect
        const viewH = baseDistance * viewTan
        // Desktop: monogram on the right half, form on the left.
        const scale = portrait ? Math.min(0.62, (viewW * 0.8) / 13.5) : Math.min(0.8, (viewW * 0.34) / 13.5)
        holder.scale.setScalar(scale)
        // Right half, clear of the floating nav on the far right.
        holder.position.set(portrait ? 0 : viewW * 0.17, portrait ? viewH * 0.26 : 0, 0)
        holder.rotation.y = -0.32 + pointer.x * 0.2 + Math.sin(time * 0.15) * 0.08 * ambient
        holder.rotation.x = pointer.y * 0.08

        ctx.lights.ember.position.set(holder.position.x, holder.position.y - 2, 2)
        ctx.lights.ember.intensity = glow * 8

        camera.position.set(pointer.x * 0.8, 0.8 - pointer.y * 0.4, distance)
        camera.lookAt(0, 0, 0)
        frame.fogDensity = 0.012
      },
      dispose() {
        tweens.forEach((tween) => tween.kill())
        monogram.dispose()
      },
    }
  }
}
