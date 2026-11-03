import { smoothstep } from '../bricks'
import { projectFigure } from '../figures'
import type { StageFactory } from '../world'

// Projects sit one behind another; the camera flies forward through them.
export const PROJECT_SPACING = 15

interface ProjectsOptions {
  names: string[]
  panels: () => HTMLElement[]
  /** Read when the stage is built (after the section has mounted). */
  callouts: () => SVGSVGElement | null
}

/**
 * Where the camera is along the row of projects for a scroll progress.
 * Never stops: mostly linear (every bit of scroll moves the camera, like
 * the intro) with a gentle slow-down over each project so it can be read.
 */
export function projectFocus(progress: number, count: number) {
  if (count <= 1) return 0
  const f = progress * (count - 1)
  const base = Math.min(count - 2, Math.floor(f))
  const t = f - base
  return base + t * 0.6 + (0.5 - 0.5 * Math.cos(Math.PI * t)) * 0.4
}

/**
 * "Proyectos": each project gets its own 3D figure (see figures.ts) floating
 * over a thin red ring, one behind another in depth, with a dotted grid far
 * behind. Scrolling flies the camera forward from figure to figure (the
 * next one is always visible ahead in the fog); HUD lines tie the one in
 * focus to its panel.
 */
export function projectsStage({ names, panels, callouts }: ProjectsOptions): StageFactory {
  return (ctx) => {
    const { THREE, camera, kit } = ctx
    const group = new THREE.Group()
    const count = names.length

    const ringGeometry = new THREE.TorusGeometry(2.7, 0.018, 6, 120)
    const ringMaterial = kit.glowMaterial()
    kit.setGlow(ringMaterial, 1.1)
    const outerRingMaterial = new THREE.LineBasicMaterial({ color: 0xf5f5f0, transparent: true, opacity: 0.18 })
    const outerRingGeometry = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 129 }, (_, i) => {
        const angle = (i / 128) * Math.PI * 2
        return new THREE.Vector3(Math.cos(angle) * 3.4, 0, Math.sin(angle) * 3.4)
      }),
    )

    const items = names.map((name, i) => {
      const holder = new THREE.Group()
      const figure = projectFigure(ctx, name)
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      ring.position.y = -2.9
      const outer = new THREE.Line(outerRingGeometry, outerRingMaterial)
      outer.position.y = -2.9
      holder.add(figure.group, ring, outer)
      group.add(holder)
      return { holder, figure, phase: i * 1.7 }
    })

    // Dotted grid far behind; it travels with the camera.
    const cols = 60
    const rows = 26
    const gridPositions = new Float32Array(cols * rows * 3)
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const k = (c * rows + r) * 3
        gridPositions[k] = -45 + c * 1.5
        gridPositions[k + 1] = (r - rows / 2) * 1.5
        gridPositions[k + 2] = 0
      }
    }
    const gridGeometry = new THREE.BufferGeometry()
    gridGeometry.setAttribute('position', new THREE.BufferAttribute(gridPositions, 3))
    const gridMaterial = new THREE.PointsMaterial({ color: 0xf5f5f0, size: 0.05, transparent: true, opacity: 0.35, depthWrite: false })
    const grid = new THREE.Points(gridGeometry, gridMaterial)
    grid.frustumCulled = false
    group.add(grid)

    // HUD callouts: one path per project, from the figure to its panel.
    const calloutsEl = callouts()
    const paths = names.map(() => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      calloutsEl?.append(path)
      return path
    })
    const corner = new THREE.Vector3()
    const panelOpacity = names.map(() => -1)
    // Panel anchors only move when the layout does: cached per width so the
    // frame loop never reads layout.
    let anchorWidth = -1
    let anchors: { x: number; y: number }[] = []

    return {
      group,
      update(frame) {
        const { time, ambient, progress, pointer, width, height } = frame
        const focus = projectFocus(progress, count)
        const portrait = camera.aspect < 1
        const viewTan = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        const distance = portrait ? 19 : 13
        const viewW = distance * viewTan * camera.aspect
        const viewH = distance * viewTan
        // Desktop: figures sit left of centre, panels on the right.
        const offsetX = portrait ? 0 : -viewW * 0.21
        const offsetY = portrait ? viewH * 0.17 : -0.6

        if (anchorWidth !== width) {
          anchorWidth = width
          // Relative to the pinned stage, which sits at the top of the
          // viewport whenever this stage is shown.
          anchors = panels().map((panel) => {
            if (!panel) return { x: 0, y: 0 }
            const rect = panel.getBoundingClientRect()
            const stage = panel.closest('.stage-sticky')?.getBoundingClientRect()
            return { x: rect.left - (stage?.left ?? 0) - 18, y: rect.top - (stage?.top ?? 0) + 10 }
          })
        }

        items.forEach((item, i) => {
          const distanceToFocus = Math.abs(focus - i)
          const near = 1 - smoothstep(0, 0.9, distanceToFocus)
          // Only the figures near the camera are drawn and animated.
          // The one in focus plus the next ahead (visible in the fog).
          item.holder.visible = i - focus > -0.9 && i - focus < 1.9
          if (!item.holder.visible) return
          item.figure.update(time + item.phase, ambient)
          // Alternating slightly left/right so the next one isn't hidden
          // straight behind the current one.
          const side = portrait ? 0 : (i % 2 ? 0.9 : -0.9)
          item.holder.position.set(
            offsetX + side,
            offsetY + Math.sin(time * 0.5 + item.phase) * 0.15 * ambient,
            -i * PROJECT_SPACING,
          )
          item.holder.rotation.y = pointer.x * 0.25 + (i - focus) * 0.9 + Math.sin(time * 0.3 + item.phase) * 0.25 * ambient
          item.holder.rotation.x = -pointer.y * 0.1
          item.holder.scale.setScalar((portrait ? 0.7 : 0.86) * (0.8 + near * 0.2))
        })

        items.forEach((item, i) => {
          // Panels: only the project in focus is fully shown.
          const weight = 1 - smoothstep(0.2, 0.55, Math.abs(focus - i))
          const panel = panels()[i]
          const rounded = Math.round(weight * 100) / 100
          if (panel && rounded !== panelOpacity[i]) {
            panelOpacity[i] = rounded
            panel.style.opacity = String(rounded)
            panel.style.transform = `translate3d(0, ${((1 - rounded) * 24).toFixed(1)}px, 0)`
            panel.style.visibility = rounded > 0.01 ? 'visible' : 'hidden'
          }

          const path = paths[i]
          const anchor = anchors[i]
          if (!portrait && weight > 0.01 && anchor && item.holder.visible) {
            corner.set(2.4, 1.8, 0).applyMatrix4(item.holder.matrixWorld).project(camera)
            const x = (corner.x * 0.5 + 0.5) * width
            const y = (-corner.y * 0.5 + 0.5) * height
            path.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)} L${(x + 40).toFixed(1)} ${anchor.y.toFixed(1)} L${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}`)
            path.style.opacity = String(rounded)
          } else {
            path.style.opacity = '0'
          }
        })

        const focusZ = -focus * PROJECT_SPACING
        ctx.lights.accent.position.set(offsetX, offsetY - 2.4, focusZ + 2)
        ctx.lights.accent.intensity = 12
        ctx.lights.key.position.set(-6, 8, focusZ + 10)
        ctx.lights.rim.position.set(8, 3, focusZ - 6)

        // Flying forward, the camera banks out to the side between projects,
        // so the path is a gentle S-curve rather than a straight track.
        // Aimed at the centre line (figures sit left of it), so they stay in
        // the left half, clear of the panels, the whole way.
        const between = Math.sin(focus * Math.PI)
        const cameraZ = focusZ + distance
        camera.position.set(between * 1.2 + pointer.x * 0.5, 0.6 + Math.abs(between) * 0.6 - pointer.y * 0.3, cameraZ)
        camera.lookAt(between * 0.6, 0, cameraZ - distance - 2)
        camera.rotateZ(-between * 0.06)
        grid.position.z = cameraZ - 30
        frame.fogDensity = 0.018
      },
      hide() {
        paths.forEach((path) => (path.style.opacity = '0'))
      },
      dispose() {
        paths.forEach((path) => path.remove())
        items.forEach((item) => item.figure.dispose())
        ringGeometry.dispose()
        ringMaterial.dispose()
        outerRingGeometry.dispose()
        outerRingMaterial.dispose()
        gridGeometry.dispose()
        gridMaterial.dispose()
      },
    }
  }
}
