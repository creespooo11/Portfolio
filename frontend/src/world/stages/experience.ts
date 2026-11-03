import { smoothstep } from '../bricks'
import { engravedTablet } from '../textures'
import { projectFocus } from './projects'
import type { StageFactory } from '../world'

const SPACING = 12

interface ExperienceOptions {
  entries: { title: string; subtitle: string; tag: string }[]
  panels: () => HTMLElement[]
}

/**
 * "Formación" (studies and titles): a red line of light running away into the dark, with a
 * stone plate floating at each entry. The camera travels along it, one
 * entry at a time.
 */
export function experienceStage({ entries, panels }: ExperienceOptions): StageFactory {
  return async (ctx) => {
    const count = entries.length
    const { THREE, camera, kit } = ctx
    const group = new THREE.Group()
    const glowMaterial = kit.glowMaterial()

    const length = Math.max(1, count) * SPACING + 60
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, length), glowMaterial)
    line.position.set(0, -2.4, -length / 2 + 20)
    group.add(line)

    const nodeGeometry = new THREE.BoxGeometry(0.16, 0.16, 0.16)
    const faces = await Promise.all(entries.map((entry) => engravedTablet(THREE, entry)))
    const faceMaterials = faces.map((map) => new THREE.MeshStandardMaterial({ map, color: 0x9a9a9a, roughness: 0.7, metalness: 0.05 }))
    const faceGeometry = new THREE.PlaneGeometry(4.3, 4.3 * (640 / 1024))
    const plates = Array.from({ length: count }, (_, i) => {
      const holder = new THREE.Group()
      holder.position.z = -i * SPACING
      const plate = new THREE.Mesh(kit.geometry(4.6, 3, 0.36, 0.1), kit.materials[(i + 1) % 3])
      const face = new THREE.Mesh(faceGeometry, faceMaterials[i])
      face.position.z = 0.185
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(4.82, 3.22), glowMaterial)
      halo.position.z = -0.25
      const plateGroup = new THREE.Group()
      plateGroup.add(halo, plate, face)
      const node = new THREE.Mesh(nodeGeometry, glowMaterial)
      node.position.y = -2.4
      holder.add(plateGroup, node)
      group.add(holder)
      return { holder, plateGroup, halo, phase: i * 1.3 }
    })

    // Loose bricks scattered along the line, for depth while travelling.
    const debris = Array.from({ length: 14 }, (_, i) => {
      const mesh = new THREE.Mesh(kit.geometry(0.9, 0.45, 0.6, 0.08), kit.materials[i % 3])
      mesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.3) * 7, 10 - Math.random() * length)
      mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)
      group.add(mesh)
      return { mesh, spin: 0.1 + Math.random() * 0.2 }
    })

    const panelOpacity: number[] = []

    return {
      group,
      update(frame) {
        const { time, ambient, progress, pointer, presence } = frame
        const portrait = camera.aspect < 1
        const focus = projectFocus(progress, count)
        const viewTan = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        const distance = portrait ? 15 : 11
        const viewW = distance * viewTan * camera.aspect
        const viewH = distance * viewTan

        kit.setGlow(glowMaterial, 0.6)

        plates.forEach((entry, i) => {
          entry.plateGroup.position.set(portrait ? 0 : -viewW * 0.22, portrait ? viewH * 0.22 : -0.4, 0)
          entry.plateGroup.position.y += Math.sin(time * 0.5 + entry.phase) * 0.12 * ambient
          entry.plateGroup.rotation.y = 0.45 + pointer.x * 0.15 + Math.sin(time * 0.25 + entry.phase) * 0.06 * ambient
          entry.plateGroup.rotation.x = -pointer.y * 0.08
          entry.plateGroup.scale.setScalar(portrait ? 0.6 : Math.min(0.85, (viewW * 0.34) / 4.6))

          const weight = 1 - smoothstep(0.2, 0.55, Math.abs(focus - i))
          const panel = panels()[i]
          const rounded = Math.round(weight * smoothstep(0.4, 1, presence) * 100) / 100
          if (panel && rounded !== panelOpacity[i]) {
            panelOpacity[i] = rounded
            panel.style.opacity = String(rounded)
            panel.style.transform = `translate3d(0, ${((1 - rounded) * 24).toFixed(1)}px, 0)`
            panel.style.visibility = rounded > 0.01 ? 'visible' : 'hidden'
          }
        })

        for (const piece of debris) {
          piece.mesh.rotation.x += piece.spin * frame.dt * ambient
          piece.mesh.rotation.y += piece.spin * 0.7 * frame.dt * ambient
        }

        const z = -focus * SPACING + distance - progress * 2
        camera.position.set(pointer.x * 0.5, 0.6 - pointer.y * 0.3, z)
        camera.lookAt(0, 0, z - distance)

        ctx.lights.accent.position.set(0, -1.6, z - distance + 1)
        ctx.lights.accent.intensity = 16
        ctx.lights.key.position.set(-6, 8, z + 4)
        frame.fogDensity = 0.03
      },
      hide() {
        panels().forEach((panel, i) => {
          if (!panel) return
          panel.style.opacity = '0'
          panelOpacity[i] = 0
        })
      },
      dispose() {
        glowMaterial.dispose()
        line.geometry.dispose()
        nodeGeometry.dispose()
        plates.forEach((entry) => entry.halo.geometry.dispose())
        faces.forEach((texture) => texture.dispose())
        faceMaterials.forEach((material) => material.dispose())
        faceGeometry.dispose()
      },
    }
  }
}
