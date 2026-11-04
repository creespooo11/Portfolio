import { gsap } from '../../lib/gsap'
import { BRICK_DEPTH, createMonogram, smoothstep } from '../bricks'
import { createMarkerHud } from '../hud'
import type { StageFactory } from '../world'

const HUD_LABELS = ['Java', 'Spring Boot', 'Vue.js', 'PostgreSQL', 'MongoDB', 'Docker', 'Kafka', 'n8n', 'JavaScript']
const HUD_CYCLE = 3.2

interface IntroOptions {
  section: HTMLElement
  hud: SVGSVGElement | null
  onPlaced: (placed: number, total: number) => void
}

/**
 * The opening scene: "JC" bricks fly in and lock into place on load, the
 * red core glows through the joints, and scrolling pulls them apart while
 * the camera pushes in. A few bricks carry HUD tags with real stack items.
 */
export function introStage({ section, hud, onPlaced }: IntroOptions): StageFactory {
  return (ctx) => {
    const { THREE, camera, compact, reducedMotion } = ctx
    const monogram = createMonogram(ctx)
    const { group, pieces } = monogram

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.78, metalness: 0.15 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -3.62
    group.add(floor)

    const build = pieces.map(() => ({ value: reducedMotion ? 1 : 0 }))
    const scrollDelay = pieces.map(
      (piece) => Math.random() * 0.22 + ((monogram.topRow - piece.row) / monogram.topRow) * 0.16,
    )
    const indexOf = new Map(pieces.map((piece, i) => [piece, i]))
    let tweens: gsap.core.Tween[] = []
    let started = false

    const markers = createMarkerHud(hud, compact ? 3 : 4)
    const lookAt = new THREE.Vector3(0, -0.2, 0)
    const projected = new THREE.Vector3()
    let hudPicks: number[] = []
    let hudClock = -1
    const pickHud = () => {
      const pool = pieces.map((_, i) => i).filter((i) => !pieces[i].loose)
      hudPicks = []
      while (hudPicks.length < markers.marks.length && pool.length) {
        hudPicks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
      }
      hudPicks.sort((a, b) => pieces[a].target.x - pieces[b].target.x)
      const labels = [...HUD_LABELS]
      markers.marks.forEach((mark, i) => {
        const label = labels.splice(Math.floor(Math.random() * labels.length), 1)[0]
        mark.text.textContent = `${String(i + 1).padStart(2, '0')}  ${label}`
      })
    }

    let lastPlaced = -1
    const screen = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]

    return {
      group,
      // The intro is the top of the page: no entrance, and its scroll
      // choreography is tuned to the full-screen stretch.
      pinned: true,
      update(frame) {
        if (!started) {
          // The build-in starts on the first frame actually shown, not when
          // the stage was created (shaders were still compiling then).
          started = true
          if (!reducedMotion) {
            tweens = build.map((state, i) =>
              gsap.to(state, {
                value: 1,
                duration: 1.8,
                ease: 'expo.out',
                delay: 0.25 + pieces[i].row * 0.13 + Math.random() * 0.3,
              }),
            )
          }
        }

        const { time, ambient, progress: scroll, width, height } = frame
        section.style.setProperty('--intro-progress', scroll.toFixed(4))

        let dissolved = 0
        let placed = 0
        let assembled = 0
        monogram.pose(time, ambient, (piece) => {
          const i = indexOf.get(piece)!
          const dissolve = smoothstep(0, 1, (scroll - scrollDelay[i]) / 0.5)
          dissolved += dissolve
          assembled += build[i].value
          if (build[i].value > 0.97) placed++
          return build[i].value * (1 - dissolve * dissolve)
        })
        dissolved /= pieces.length
        assembled /= pieces.length
        if (placed !== lastPlaced) {
          lastPlaced = placed
          onPlaced(placed, pieces.length)
        }

        // Core glow: wakes as the monogram closes and dies with it as the
        // bricks are pulled apart (an exposed core is just a flat slab). The
        // ember light takes over, underlighting the bricks in flight.
        const glow =
          Math.pow(smoothstep(0.55, 1, assembled), 2) * 1.5 * (1 - smoothstep(0, 0.06, dissolved)) *
          (1 + Math.sin(time * 1.7) * 0.06 * ambient)
        monogram.setGlow(glow)
        ctx.lights.ember.position.set(0, -1.2, 1.4)
        ctx.lights.ember.intensity = glow * 6 + Math.sin(Math.min(scroll * 1.4, 1) * Math.PI) * 26
        frame.exposure = 1 - smoothstep(0.75, 1, scroll) * 0.7

        // Camera: three-quarter view so the bricks' depth reads, slow sway +
        // cursor parallax, pushes in and squares up on scroll.
        const viewTan = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        const widthShare = camera.aspect < 1 ? 0.88 : 0.6
        const baseDistance = Math.max(13.5 / (widthShare * viewTan * camera.aspect), 7 / (0.56 * viewTan))
        // Portrait screens push the camera much further back; thin the fog
        // to match so the monogram doesn't sink into it.
        frame.fogDensity = 0.035 * Math.min(1, 30 / baseDistance)
        const yaw = 0.34 * (1 - scroll) + Math.sin(time * 0.11) * 0.14 * ambient + frame.pointer.x * 0.14
        const pitch = 0.07 + frame.pointer.y * -0.05 + scroll * 0.06
        const distance = baseDistance * (1 - smoothstep(0, 1, scroll) * 0.5) + (1 - smoothstep(0, 1, assembled)) * 6 * ambient
        camera.position.set(
          Math.sin(yaw) * Math.cos(pitch) * distance,
          Math.sin(pitch) * distance + 0.6,
          Math.cos(yaw) * Math.cos(pitch) * distance,
        )
        camera.lookAt(lookAt)
        camera.updateMatrixWorld()

        // HUD: a few bricks tagged with real stack items, reshuffled every
        // few seconds; only once the monogram is whole and the visitor
        // hasn't started scrolling it apart.
        const hudAlpha = smoothstep(0.97, 1, assembled) * (1 - smoothstep(0.02, 0.12, scroll))
        markers.setOpacity(hudAlpha)
        if (hudAlpha > 0) {
          const cycle = Math.floor(time / HUD_CYCLE)
          if (cycle !== hudClock) {
            hudClock = cycle
            pickHud()
          }
          hudPicks.forEach((index, i) => {
            projected.copy(pieces[index].mesh.position)
            projected.z += BRICK_DEPTH / 2
            projected.applyMatrix4(group.matrixWorld).project(camera)
            screen[i].x = (projected.x * 0.5 + 0.5) * width
            screen[i].y = (-projected.y * 0.5 + 0.5) * height
          })
          markers.place(screen.slice(0, hudPicks.length), width)
        }
      },
      hide() {
        markers.setOpacity(0)
      },
      dispose() {
        tweens.forEach((tween) => tween.kill())
        markers.dispose()
        monogram.dispose()
        floor.geometry.dispose()
        floor.material.dispose()
      },
    }
  }
}
