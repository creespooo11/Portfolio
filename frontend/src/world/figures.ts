import type * as THREE from 'three'
import type { WorldContext } from './world'

/**
 * Standalone 3D figures for the sections after the intro. Each is its own
 * design (not the intro's stone-and-red bricks), and each is cheap: every
 * repeated part is one InstancedMesh (a single draw call), no transparent
 * glass, no textures.
 */
export interface Figure {
  group: THREE.Group
  update(time: number, ambient: number): void
  dispose(): void
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

function trackDisposables() {
  const items: { dispose(): void }[] = []
  return {
    add<T extends { dispose(): void }>(item: T) {
      items.push(item)
      return item
    },
    dispose() {
      items.forEach((item) => item.dispose())
    },
  }
}

/**
 * "Sobre mí": a sphere of small cubes, evenly spread (Fibonacci lattice),
 * that breathes in slow waves; a scattering of them glows red.
 */
export function cubeSphere(ctx: WorldContext, count = 560, radius = 2.7): Figure {
  const { THREE, kit } = ctx
  const own = trackDisposables()
  const group = new THREE.Group()
  const geometry = own.add(new THREE.BoxGeometry(0.17, 0.17, 0.17))
  const material = own.add(new THREE.MeshStandardMaterial({ color: 0x8f8f8c, roughness: 0.5, metalness: 0.3 }))
  const glow = own.add(kit.glowMaterial())
  kit.setGlow(glow, 1.4)

  const directions: THREE.Vector3[] = []
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = GOLDEN_ANGLE * i
    directions.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r))
  }
  const red = new Set(directions.map((_, i) => i).filter(() => Math.random() < 0.07))
  const grey = new THREE.InstancedMesh(geometry, material, count - red.size)
  const lit = new THREE.InstancedMesh(geometry, glow, red.size)
  group.add(grey, lit)

  const facing = directions.map((dir) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir))
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const scale = new THREE.Vector3()

  return {
    group,
    update(time, ambient) {
      let g = 0
      let l = 0
      directions.forEach((dir, i) => {
        const wave = Math.sin(time * 1.3 + dir.y * 3.2 + dir.x * 2.1) * ambient
        position.copy(dir).multiplyScalar(radius * (1 + wave * 0.09))
        scale.setScalar(0.75 + (wave + 1) * 0.35)
        matrix.compose(position, facing[i], scale)
        if (red.has(i)) lit.setMatrixAt(l++, matrix)
        else grey.setMatrixAt(g++, matrix)
      })
      grey.instanceMatrix.needsUpdate = true
      lit.instanceMatrix.needsUpdate = true
      group.rotation.y = time * 0.2 * ambient
      group.rotation.z = Math.sin(time * 0.3) * 0.14 * ambient
    },
    dispose: own.dispose,
  }
}

/** VitSync (health): a double helix, one strand bone-white, one glowing red. */
function helix(ctx: WorldContext): Figure {
  const { THREE, kit } = ctx
  const own = trackDisposables()
  const group = new THREE.Group()
  const steps = 34
  const height = 5.2
  const radius = 1.15
  const bead = own.add(new THREE.IcosahedronGeometry(0.15, 1))
  const rung = own.add(new THREE.CylinderGeometry(0.03, 0.03, 1, 6))
  const white = own.add(new THREE.MeshStandardMaterial({ color: 0xa6a6a2, roughness: 0.4, metalness: 0.2 }))
  const glow = own.add(kit.glowMaterial())
  kit.setGlow(glow, 1.3)
  const rungMaterial = own.add(new THREE.MeshStandardMaterial({ color: 0x55565c, roughness: 0.5, metalness: 0.6 }))

  const strandA = new THREE.InstancedMesh(bead, white, steps)
  const strandB = new THREE.InstancedMesh(bead, glow, steps)
  const rungs = new THREE.InstancedMesh(rung, rungMaterial, steps)
  const matrix = new THREE.Matrix4()
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const angle = t * Math.PI * 4
    const y = (t - 0.5) * height
    const a = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
    const b = new THREE.Vector3(-a.x, y, -a.z)
    strandA.setMatrixAt(i, matrix.makeTranslation(a.x, a.y, a.z))
    strandB.setMatrixAt(i, matrix.makeTranslation(b.x, b.y, b.z))
    const direction = b.clone().sub(a)
    const length = direction.length()
    const rotation = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize())
    rungs.setMatrixAt(i, matrix.compose(new THREE.Vector3(0, y, 0), rotation, new THREE.Vector3(1, length, 1)))
  }
  group.add(strandA, strandB, rungs)
  group.rotation.z = 0.35

  return {
    group,
    update(time, ambient) {
      group.rotation.y = time * 0.45 * ambient + 0.4
    },
    dispose: own.dispose,
  }
}

/** PowerSupps (supplements): a swirl of capsules, glossy red and black. */
function capsules(ctx: WorldContext): Figure {
  const { THREE } = ctx
  const own = trackDisposables()
  const group = new THREE.Group()
  const geometry = own.add(new THREE.CapsuleGeometry(0.2, 0.55, 4, 12))
  const redMaterial = own.add(new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.22, metalness: 0.15 }))
  const blackMaterial = own.add(new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.18, metalness: 0.4 }))
  const perColor = 22
  const reds = new THREE.InstancedMesh(geometry, redMaterial, perColor)
  const blacks = new THREE.InstancedMesh(geometry, blackMaterial, perColor)
  group.add(reds, blacks)

  const pills = Array.from({ length: perColor * 2 }, (_, i) => ({
    angle: (i / (perColor * 2)) * Math.PI * 2 * 3,
    radius: 0.8 + (i % 7) * 0.32,
    y: ((i * 37) % 44) / 44 * 4.4 - 2.2,
    spin: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3),
    speed: 0.25 + (i % 5) * 0.06,
  }))
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const rotation = new THREE.Quaternion()
  const euler = new THREE.Euler()
  const one = new THREE.Vector3(1, 1, 1)

  return {
    group,
    update(time, ambient) {
      pills.forEach((pill, i) => {
        // Tighter towards the middle, like a vortex.
        const angle = pill.angle + time * pill.speed * ambient
        const radius = pill.radius * (0.75 + 0.25 * Math.cos(pill.y * 0.7))
        position.set(Math.cos(angle) * radius, pill.y + Math.sin(time * 0.6 + i) * 0.08 * ambient, Math.sin(angle) * radius)
        euler.set(pill.spin.x + time * 0.5 * ambient, pill.spin.y + time * 0.3 * ambient, pill.spin.z)
        matrix.compose(position, rotation.setFromEuler(euler), one)
        ;(i % 2 ? blacks : reds).setMatrixAt(i >> 1, matrix)
      })
      reds.instanceMatrix.needsUpdate = true
      blacks.instanceMatrix.needsUpdate = true
      group.rotation.x = 0.25
    },
    dispose: own.dispose,
  }
}

/**
 * This portfolio (microservices): a geodesic network, nodes at the
 * vertices, edges as lines, and red pulses travelling along them like
 * events between services.
 */
function network(ctx: WorldContext): Figure {
  const { THREE, kit } = ctx
  const own = trackDisposables()
  const group = new THREE.Group()
  const shape = own.add(new THREE.IcosahedronGeometry(2.3, 1))

  // Unique vertices + edges of the geodesic sphere.
  const raw = shape.getAttribute('position')
  const nodes: THREE.Vector3[] = []
  const indexOf = (v: THREE.Vector3) => {
    let found = nodes.findIndex((n) => n.distanceToSquared(v) < 1e-6)
    if (found < 0) {
      nodes.push(v.clone())
      found = nodes.length - 1
    }
    return found
  }
  const edgeKeys = new Set<string>()
  const edges: [number, number][] = []
  for (let i = 0; i < raw.count; i += 3) {
    const tri = [0, 1, 2].map((k) => indexOf(new THREE.Vector3().fromBufferAttribute(raw, i + k)))
    for (const [a, b] of [[tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]]) {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key)
        edges.push([a, b])
      }
    }
  }

  const lineGeometry = own.add(new THREE.BufferGeometry().setFromPoints(edges.flatMap(([a, b]) => [nodes[a], nodes[b]])))
  const lineMaterial = own.add(new THREE.LineBasicMaterial({ color: 0xf5f5f0, transparent: true, opacity: 0.28 }))
  group.add(new THREE.LineSegments(lineGeometry, lineMaterial))

  const nodeGeometry = own.add(new THREE.OctahedronGeometry(0.11, 0))
  const nodeMaterial = own.add(new THREE.MeshStandardMaterial({ color: 0xa6a6a2, roughness: 0.35, metalness: 0.4 }))
  const nodeMesh = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodes.length)
  const matrix = new THREE.Matrix4()
  nodes.forEach((node, i) => nodeMesh.setMatrixAt(i, matrix.makeTranslation(node.x, node.y, node.z)))
  group.add(nodeMesh)

  const glow = own.add(kit.glowMaterial())
  kit.setGlow(glow, 1.6)
  const pulseGeometry = own.add(new THREE.SphereGeometry(0.07, 8, 8))
  const pulseCount = 14
  const pulseMesh = new THREE.InstancedMesh(pulseGeometry, glow, pulseCount)
  group.add(pulseMesh)
  const pulses = Array.from({ length: pulseCount }, () => ({
    edge: edges[Math.floor(Math.random() * edges.length)],
    offset: Math.random(),
    speed: 0.35 + Math.random() * 0.4,
  }))
  const position = new THREE.Vector3()

  return {
    group,
    update(time, ambient) {
      pulses.forEach((pulse, i) => {
        const t = (pulse.offset + time * pulse.speed * Math.max(ambient, 0.0001)) % 1
        if (t < pulse.speed * 0.02) pulse.edge = edges[Math.floor(Math.random() * edges.length)]
        position.lerpVectors(nodes[pulse.edge[0]], nodes[pulse.edge[1]], t)
        pulseMesh.setMatrixAt(i, matrix.makeTranslation(position.x, position.y, position.z))
      })
      pulseMesh.instanceMatrix.needsUpdate = true
      group.rotation.y = time * 0.24 * ambient
      group.rotation.x = 0.3 + Math.sin(time * 0.3) * 0.15 * ambient
    },
    dispose: own.dispose,
  }
}

/** Any other project: a slowly turning wireframe knot. */
function knot(ctx: WorldContext): Figure {
  const { THREE } = ctx
  const own = trackDisposables()
  const group = new THREE.Group()
  const geometry = own.add(new THREE.TorusKnotGeometry(1.6, 0.42, 120, 12))
  const material = own.add(new THREE.MeshStandardMaterial({ color: 0x9a9a96, roughness: 0.4, metalness: 0.3, wireframe: true }))
  group.add(new THREE.Mesh(geometry, material))
  return {
    group,
    update(time, ambient) {
      group.rotation.set(time * 0.2 * ambient, time * 0.3 * ambient, 0)
    },
    dispose: own.dispose,
  }
}

/** Picks the figure for a project by its name. */
export function projectFigure(ctx: WorldContext, name: string): Figure {
  switch (name.trim().toLowerCase()) {
    case 'vitsync':
      return helix(ctx)
    case 'powersupps':
      return capsules(ctx)
    case 'portfolio':
      return network(ctx)
    default:
      return knot(ctx)
  }
}

/**
 * "Formación": an open book whose pages keep turning on their own, a red
 * bookmark ribbon hanging from the spine, and a graduation cap floating
 * above it, tassel glowing red.
 */
export function studyBook(ctx: WorldContext): Figure {
  const { THREE, kit } = ctx
  const own = trackDisposables()
  const group = new THREE.Group()
  const book = new THREE.Group()
  group.add(book)

  const coverMaterial = own.add(new THREE.MeshStandardMaterial({ color: 0x24252b, roughness: 0.45, metalness: 0.6 }))
  const pageMaterial = own.add(
    new THREE.MeshStandardMaterial({ color: 0x9c9c98, roughness: 0.75, metalness: 0, side: THREE.DoubleSide }),
  )
  const glow = own.add(kit.glowMaterial())
  kit.setGlow(glow, 1.4)

  // Covers and page blocks hinge on the spine (x = 0): geometry is shifted
  // so it rotates around its inner edge.
  const width = 1.75
  const height = 2.4
  const coverGeometry = own.add(new THREE.BoxGeometry(width, height, 0.07))
  coverGeometry.translate(width / 2, 0, 0)
  const blockGeometry = own.add(new THREE.BoxGeometry(width - 0.1, height - 0.12, 0.16))
  blockGeometry.translate((width - 0.1) / 2, 0, 0.11)
  for (const side of [1, -1]) {
    const hinge = new THREE.Group()
    // Covers tilt their outer edges towards the viewer (a V, spine at the
    // back), like a book lying open in front of you.
    hinge.rotation.y = side === 1 ? -0.22 : Math.PI + 0.22
    hinge.add(new THREE.Mesh(coverGeometry, coverMaterial))
    const block = new THREE.Mesh(blockGeometry, pageMaterial)
    block.scale.z = side
    hinge.add(block)
    book.add(hinge)
  }

  const pageGeometry = own.add(new THREE.PlaneGeometry(width - 0.12, height - 0.16, 6, 1))
  pageGeometry.translate((width - 0.12) / 2, 0, 0)
  const pages = Array.from({ length: 5 }, (_, i) => {
    const page = new THREE.Mesh(pageGeometry, pageMaterial)
    page.position.z = 0.2
    book.add(page)
    return { page, offset: i / 5 }
  })

  const ribbonGeometry = own.add(new THREE.BoxGeometry(0.07, 1.5, 0.02))
  ribbonGeometry.translate(0, -0.75, 0)
  const ribbon = new THREE.Mesh(ribbonGeometry, glow)
  ribbon.position.set(0.05, -height / 2 + 0.3, 0.25)
  book.add(ribbon)
  book.rotation.x = -0.55

  // Graduation cap: flat square board on a short crown, with a tassel.
  const cap = new THREE.Group()
  const board = new THREE.Mesh(own.add(new THREE.BoxGeometry(2, 0.07, 2)), coverMaterial)
  board.rotation.y = Math.PI / 4
  const crown = new THREE.Mesh(own.add(new THREE.CylinderGeometry(0.62, 0.7, 0.5, 24)), coverMaterial)
  crown.position.y = -0.27
  const button = new THREE.Mesh(own.add(new THREE.SphereGeometry(0.07, 10, 10)), glow)
  button.position.y = 0.06
  const cordGeometry = own.add(new THREE.CylinderGeometry(0.018, 0.018, 1, 6))
  cordGeometry.translate(0, -0.5, 0)
  const cord = new THREE.Mesh(cordGeometry, glow)
  cord.position.set(0, 0.05, 0)
  const tassel = new THREE.Mesh(own.add(new THREE.ConeGeometry(0.09, 0.32, 10)), glow)
  tassel.position.y = -1.05
  cord.add(tassel)
  const cordPivot = new THREE.Group()
  cordPivot.position.set(0.95, 0.03, 0)
  cordPivot.add(cord)
  cap.add(board, crown, button, cordPivot)
  cap.position.y = 2.6
  group.add(cap)

  return {
    group,
    update(time, ambient) {
      // Each page lifts off the right, arcs towards the viewer and settles
      // on the left; staggered so one is always mid-turn.
      for (const { page, offset } of pages) {
        const t = (time * 0.28 * Math.max(ambient, 0.0001) + offset) % 1
        const turn = t < 0.15 ? 0 : t > 0.85 ? 1 : (t - 0.15) / 0.7
        const eased = turn * turn * (3 - 2 * turn)
        // Decreasing angle = the free edge swings towards the viewer.
        page.rotation.y = -0.22 - eased * (Math.PI - 0.44)
        page.position.z = 0.2 + Math.sin(eased * Math.PI) * 0.05
      }
      ribbon.rotation.z = Math.sin(time * 1.2) * 0.12 * ambient
      cap.rotation.y = time * 0.4 * ambient
      cap.rotation.z = Math.sin(time * 0.7) * 0.08 * ambient
      cap.position.y = 2.6 + Math.sin(time * 0.9) * 0.15 * ambient
      cordPivot.rotation.z = Math.sin(time * 1.6) * 0.25 * ambient
      book.rotation.y = Math.sin(time * 0.3) * 0.2 * ambient
    },
    dispose: own.dispose,
  }
}
