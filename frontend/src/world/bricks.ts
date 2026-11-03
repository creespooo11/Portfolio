import type * as THREE from 'three'
import { buildMonogram } from '../intro/jcBlocks'
import type { WorldContext } from './world'

export const BRICK_DEPTH = 1.6

// Deeper than --red on purpose: the composer tone-maps the core too, and
// any green/blue in a bright red drifts to pink once it's pushed past 1.
export const GLOW_RED = { r: 0.9, g: 0.012, b: 0.045 }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Speckled grey noise used as bump + roughness map so bricks read as stone, not plastic. */
export function stoneTexture(THREE: typeof import('three')): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const v = 140 + Math.random() * 70
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  for (let i = 0; i < 90; i++) {
    const r = 4 + Math.random() * 22
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return texture
}

/**
 * Stone bricks shared by every stage: one noise texture, three shades of
 * material (enough variation to read as stone, few material switches) and
 * a rounded-box geometry cached per size.
 */
export function createBrickKit(THREE: typeof import('three'), RoundedBoxGeometry: WorldContext['RoundedBoxGeometry']) {
  const stone = stoneTexture(THREE)
  const materials = [0.1, 0.125, 0.15].map(
    (lightness) =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.62, 0.04, lightness),
        roughness: 0.82,
        metalness: 0.04,
        bumpMap: stone,
        bumpScale: 2.2,
        roughnessMap: stone,
      }),
  )
  const geometries = new Map<string, THREE.BufferGeometry>()
  const geometry = (width: number, height = 0.91, depth = BRICK_DEPTH, radius = 0.13) => {
    const key = `${width}|${height}|${depth}|${radius}`
    let cached = geometries.get(key)
    if (!cached) {
      cached = new RoundedBoxGeometry(width, height, depth, 4, radius)
      geometries.set(key, cached)
    }
    return cached
  }
  // Glow for joints and cores: never tone-mapped down, so bloom picks it up.
  const glowMaterial = () => new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false })
  // Red is boosted so a glow of ~1 clears the bloom threshold (red carries
  // little luminance); not further, or tone mapping turns it salmon.
  const setGlow = (material: THREE.MeshBasicMaterial, glow: number) =>
    material.color.setRGB(GLOW_RED.r * glow * 1.55, GLOW_RED.g * glow * 0.5, GLOW_RED.b * glow * 0.6)

  return {
    stone,
    materials,
    geometry,
    glowMaterial,
    setGlow,
    dispose() {
      stone.dispose()
      materials.forEach((material) => material.dispose())
      geometries.forEach((g) => g.dispose())
    },
  }
}

export type BrickKit = ReturnType<typeof createBrickKit>

/**
 * The "JC" monogram: masonry bricks around a red core that only shows
 * through the joints. Each brick interpolates between a scattered pose and
 * its place in the wall; callers decide how far along each brick is (load
 * tween in the intro, scroll in the contact stage).
 */
export function createMonogram(ctx: WorldContext) {
  const { THREE, kit } = ctx
  const { bricks, core } = buildMonogram()
  const group = new THREE.Group()

  const topRow = Math.max(...bricks.map((b) => b.row))
  const looseCandidates = bricks.map((b, i) => (b.row === topRow ? i : -1)).filter((i) => i >= 0)
  const loose = new Set([looseCandidates[1], looseCandidates[looseCandidates.length - 2]])

  const pieces = bricks.map((brick, i) => {
    const mesh = new THREE.Mesh(kit.geometry(brick.width - 0.09), kit.materials[i % kit.materials.length])
    group.add(mesh)

    const target = new THREE.Vector3(brick.x, brick.y, 0)
    const targetQuat = new THREE.Quaternion()
    if (loose.has(i)) {
      // A couple of top bricks sit slightly proud and tilted, so the
      // monogram reads as hand-built rather than extruded.
      target.z += 0.32
      target.y += 0.06
      targetQuat.setFromEuler(new THREE.Euler(0.12, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.18))
    }

    const outward = new THREE.Vector3(brick.x, brick.y, 0).normalize()
    const exploded = target
      .clone()
      .add(outward.multiplyScalar(8 + Math.random() * 9))
      .add(new THREE.Vector3((Math.random() - 0.5) * 6, -2 + Math.random() * 8, -6 + Math.random() * 16))
    const explodedQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler((Math.random() - 0.5) * Math.PI * 2, (Math.random() - 0.5) * Math.PI * 2, (Math.random() - 0.5) * Math.PI),
    )

    return {
      mesh,
      target,
      targetQuat,
      exploded,
      explodedQuat,
      row: brick.row,
      loose: loose.has(i),
      phase: Math.random() * Math.PI * 2,
      jitter: Math.random(),
    }
  })

  const coreMaterial = kit.glowMaterial()
  const coreMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, BRICK_DEPTH * 0.62), coreMaterial, core.length)
  const matrix = new THREE.Matrix4()
  const noRotation = new THREE.Quaternion()
  core.forEach((box, i) =>
    coreMesh.setMatrixAt(i, matrix.compose(new THREE.Vector3(box.x, box.y, 0), noRotation, new THREE.Vector3(box.width, box.height, 1))),
  )
  group.add(coreMesh)

  /**
   * Places every brick for this frame. `amount(piece)` is how assembled
   * that brick is (0 scattered, 1 in place). Returns the average.
   */
  function pose(time: number, ambient: number, amount: (piece: (typeof pieces)[number]) => number) {
    let total = 0
    for (const piece of pieces) {
      const t = amount(piece)
      piece.mesh.position.lerpVectors(piece.exploded, piece.target, t)
      piece.mesh.quaternion.slerpQuaternions(piece.explodedQuat, piece.targetQuat, t)
      // Idle breathing once settled; fades out while bricks are in flight.
      const settle = smoothstep(0.92, 1, t) * ambient
      piece.mesh.position.z += Math.sin(time * 0.9 + piece.phase) * 0.035 * settle
      piece.mesh.rotation.x += Math.sin(time * 0.6 + piece.phase) * 0.012 * settle
      total += t
    }
    return total / pieces.length
  }

  function setGlow(glow: number) {
    kit.setGlow(coreMaterial, glow)
    // At zero glow the core would render as solid black boxes over the
    // bricks still in flight. Its shader is compiled up front, so toggling
    // this never stalls a frame.
    coreMesh.visible = glow > 0.02
  }

  return {
    group,
    pieces,
    topRow,
    pose,
    setGlow,
    dispose() {
      coreMesh.geometry.dispose()
      coreMaterial.dispose()
    },
  }
}
