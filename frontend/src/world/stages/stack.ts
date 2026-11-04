import { smoothstep } from '../bricks'
import type { StageFactory } from '../world'

interface StackOptions {
  count: number
  labels: () => HTMLElement[]
  section: HTMLElement
}

/**
 * "Stack": a gyroscope. A dark metal outer ring carries one node per
 * technology (each with its label); inside, thinner rings spin on
 * different axes around a small red core. Scrolling flies the camera
 * through the outer ring like a portal.
 */
export function stackStage({ count, labels, section }: StackOptions): StageFactory {
  return (ctx) => {
    const { THREE, camera, kit } = ctx
    const group = new THREE.Group()
    const outer = new THREE.Group()
    group.add(outer)

    const radius = 5.4
    const metal = new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.28, metalness: 0.9, envMapIntensity: 3 })
    const light = new THREE.MeshStandardMaterial({ color: 0x9a9a96, roughness: 0.4, metalness: 0.3 })
    const glow = kit.glowMaterial()
    kit.setGlow(glow, 1.4)

    const outerGeometry = new THREE.TorusGeometry(radius, 0.16, 12, 180)
    outer.add(new THREE.Mesh(outerGeometry, metal))
    // Fine graduation ticks around the outer ring, like a dial.
    const tickGeometry = new THREE.BoxGeometry(0.03, 0.42, 0.03)
    const ticks = new THREE.InstancedMesh(tickGeometry, light, 72)
    const matrix = new THREE.Matrix4()
    const rotation = new THREE.Quaternion()
    const axisZ = new THREE.Vector3(0, 0, 1)
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2
      rotation.setFromAxisAngle(axisZ, angle - Math.PI / 2)
      const r = radius + 0.42
      matrix.compose(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0), rotation, new THREE.Vector3(1, i % 6 ? 0.5 : 1, 1))
      ticks.setMatrixAt(i, matrix)
    }
    outer.add(ticks)

    // One node per technology on the outer ring.
    const n = Math.max(count, 1)
    const nodeGeometry = new THREE.OctahedronGeometry(0.38, 0)
    const nodes = Array.from({ length: count }, (_, i) => {
      const angle = (i / n) * Math.PI * 2 + Math.PI / 2
      const mesh = new THREE.Mesh(nodeGeometry, i % 3 === 0 ? glow : light)
      mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      outer.add(mesh)
      return { mesh, angle }
    })

    // Inner gimbals: thin rings spinning on different axes.
    const gimbalGeometryA = new THREE.TorusGeometry(3.6, 0.07, 8, 140)
    const gimbalGeometryB = new THREE.TorusGeometry(2.6, 0.05, 8, 120)
    const gimbalGeometryC = new THREE.TorusGeometry(1.7, 0.022, 6, 100)
    const gimbalA = new THREE.Mesh(gimbalGeometryA, metal)
    const gimbalB = new THREE.Mesh(gimbalGeometryB, light)
    const gimbalC = new THREE.Mesh(gimbalGeometryC, glow)
    const coreGeometry = new THREE.IcosahedronGeometry(0.55, 1)
    const core = new THREE.Mesh(coreGeometry, glow)
    group.add(gimbalA, gimbalB, gimbalC, core)

    const outward = new THREE.Vector3()
    const labelOpacity: number[] = []

    return {
      group,
      update(frame) {
        const { time, ambient, progress, pointer, width, height, presence } = frame
        const portrait = camera.aspect < 1
        const spin = time * 0.1 * ambient + progress * 1.4
        outer.rotation.z = spin
        outer.rotation.x = pointer.y * 0.12
        outer.rotation.y = pointer.x * 0.12
        gimbalA.rotation.set(time * 0.4 * ambient + 0.6, time * 0.15 * ambient, 0)
        gimbalB.rotation.set(-time * 0.3 * ambient, time * 0.5 * ambient + 1.2, 0)
        gimbalC.rotation.set(time * 0.7 * ambient, 0, time * 0.4 * ambient)
        core.rotation.set(time * 0.5, time * 0.8, 0)
        core.scale.setScalar(1 + Math.sin(time * 2.2) * 0.06 * ambient)
        for (const node of nodes) node.mesh.rotation.set(time * 0.8 * ambient, time * 0.6 * ambient, 0)

        // Camera: far enough for the whole ring at first, then through it.
        const start = portrait ? 62 : 29
        // The dive spans the whole section: every bit of scroll moves the
        // camera towards (and finally through) the ring.
        const dive = smoothstep(0, 1, progress)
        // Ends just in front of the gimbals, core still in view: the exit
        // flight is what carries the camera through, so the black moment
        // before the next section is only that instant (past the ring there
        // was nothing left to look at).
        const z = start - dive * (start - 9)
        // Desktop: ring sits right of the heading, recentres for the dive.
        const viewW = start * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect
        group.position.x = portrait ? 0 : viewW * 0.075 * (1 - dive)
        // Portrait: below the heading block.
        group.position.y = portrait ? -start * 0.09 * (1 - dive) : 0
        camera.position.set(pointer.x * 0.8 * (1 - dive), -pointer.y * 0.5 * (1 - dive), z)
        camera.lookAt(0, 0, z - 10)
        camera.updateMatrixWorld()
        group.updateMatrixWorld()

        ctx.lights.accent.position.set(0, 0, 1)
        ctx.lights.accent.intensity = 14
        ctx.lights.key.position.set(-6, 8, z + 6)
        ctx.lights.rim.position.set(6, -4, z - 4)
        frame.fogDensity = 0.022
        section.style.setProperty('--stack-progress', progress.toFixed(4))

        // Labels: pinned just outside each node, gone before the dive.
        const fade = (1 - smoothstep(0.42, 0.58, progress)) * smoothstep(0.6, 1, presence)
        const elements = labels()
        nodes.forEach((node, i) => {
          const element = elements[i]
          if (!element) return
          const opacity = Math.round(fade * 100) / 100
          if (opacity !== labelOpacity[i]) {
            labelOpacity[i] = opacity
            element.style.opacity = String(opacity)
            element.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
          }
          if (opacity <= 0.01) return
          outward.copy(node.mesh.position).multiplyScalar((radius + 1.3) / radius)
          outward.applyMatrix4(outer.matrixWorld).project(camera)
          const x = (outward.x * 0.5 + 0.5) * width
          const y = (-outward.y * 0.5 + 0.5) * height
          if (portrait) {
            // Narrow screens: centred on the node and kept inside the
            // viewport, instead of hanging off the ring's sides.
            const clampedX = Math.min(width - 64, Math.max(64, x))
            element.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`
          } else {
            const anchor = x < width / 2 ? 'translate(-100%, -50%)' : 'translate(0, -50%)'
            element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) ${anchor}`
          }
        })
      },
      hide() {
        labels().forEach((element, i) => {
          if (!element) return
          element.style.opacity = '0'
          element.style.visibility = 'hidden'
          labelOpacity[i] = 0
        })
      },
      dispose() {
        ;[outerGeometry, tickGeometry, nodeGeometry, gimbalGeometryA, gimbalGeometryB, gimbalGeometryC, coreGeometry].forEach((g) =>
          g.dispose(),
        )
        metal.dispose()
        light.dispose()
        glow.dispose()
      },
    }
  }
}
