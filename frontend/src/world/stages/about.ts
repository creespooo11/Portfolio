import { smoothstep } from '../bricks'
import { cubeSphere } from '../figures'
import type { StageFactory } from '../world'

/**
 * "Sobre mí": a sphere of small cubes breathing in slow waves, circled by
 * two thin orbits (one glowing red). It turns with the scroll and leans
 * towards the cursor.
 */
export function aboutStage(): StageFactory {
  return (ctx) => {
    const { THREE, camera, kit } = ctx
    const group = new THREE.Group()
    const holder = new THREE.Group()
    group.add(holder)

    const sphere = cubeSphere(ctx, ctx.compact ? 380 : 560)
    holder.add(sphere.group)

    const orbitGeometry = new THREE.TorusGeometry(3.7, 0.016, 6, 160)
    const orbitGlow = kit.glowMaterial()
    kit.setGlow(orbitGlow, 1.2)
    const orbitLine = new THREE.MeshBasicMaterial({ color: 0x6d6d70 })
    const orbitA = new THREE.Mesh(orbitGeometry, orbitGlow)
    const orbitB = new THREE.Mesh(orbitGeometry, orbitLine)
    orbitA.rotation.set(1.2, 0.3, 0)
    orbitB.rotation.set(-0.9, -0.6, 0)
    orbitB.scale.setScalar(1.15)
    holder.add(orbitA, orbitB)

    // A small satellite cube riding the red orbit.
    const satellite = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), orbitGlow)
    orbitA.add(satellite)

    return {
      group,
      update(frame) {
        const { time, ambient, progress, presence, pointer } = frame
        const viewTan = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        const distance = 17
        const viewH = distance * viewTan
        const viewW = viewH * camera.aspect
        const portrait = camera.aspect < 1

        // Desktop: figure on the left, text on the right. Portrait: top band.
        const scale = portrait ? Math.min(0.85, (viewW * 0.8) / 8) : Math.min(1.1, (viewW * 0.38) / 8)
        holder.scale.setScalar(scale * (0.85 + 0.15 * presence))
        holder.position.set(portrait ? 0 : -viewW * 0.24, portrait ? viewH * 0.24 : 0, -6 * (1 - presence))
        holder.position.y += Math.sin(time * 0.6) * 0.12 * ambient
        holder.rotation.y = progress * 1.4 + pointer.x * 0.25
        holder.rotation.x = -pointer.y * 0.12

        sphere.update(time, ambient)
        orbitA.rotation.z = time * 0.35 * ambient
        orbitB.rotation.z = -time * 0.22 * ambient
        const angle = time * 0.9
        satellite.position.set(Math.cos(angle) * 3.7, Math.sin(angle) * 3.7, 0)
        satellite.rotation.set(time, time * 0.7, 0)

        ctx.lights.accent.position.set(holder.position.x, holder.position.y, holder.position.z + 4)
        ctx.lights.accent.intensity = 8 * smoothstep(0.3, 1, presence)
        ctx.lights.key.position.set(-4, 7, 12)

        camera.position.set(pointer.x * 0.6, 0.4 - pointer.y * 0.3, distance)
        camera.lookAt(0, 0, 0)
        frame.fogDensity = 0.02
      },
      dispose() {
        sphere.dispose()
        orbitGeometry.dispose()
        orbitGlow.dispose()
        orbitLine.dispose()
        satellite.geometry.dispose()
      },
    }
  }
}
