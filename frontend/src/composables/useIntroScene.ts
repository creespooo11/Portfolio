import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import type * as THREE from 'three'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { buildMonogram } from '../intro/jcBlocks'

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const HUD_LABELS = ['Java', 'Spring Boot', 'Vue.js', 'PostgreSQL', 'MongoDB', 'Docker', 'Kafka', 'n8n', 'JavaScript']
const HUD_CYCLE = 3.2
const SVG_NS = 'http://www.w3.org/2000/svg'

// Deeper than --red on purpose: the composer tone-maps the core too, and
// any green/blue in a bright red drifts to pink once it's pushed past 1.
const RED = { r: 0.9, g: 0.012, b: 0.045 }
const BRICK_DEPTH = 1.6

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** Frame-rate independent exponential smoothing factor. */
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

/** Speckled grey noise used as bump + roughness map so bricks read as stone, not plastic. */
function stoneTexture(THREE: typeof import('three')): THREE.CanvasTexture {
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
 * The intro's centrepiece: a "JC" monogram built from stone bricks that fly
 * in and lock into place on load, with a red core glowing through the
 * joints. Scrolling through the intro section pulls the bricks apart again
 * and pushes the camera in, handing over to the rest of the page.
 *
 * Built for a steady frame rate: shaders are compiled before anything
 * moves, nothing per-frame goes through Vue (the HUD and the scroll-driven
 * CSS are written straight to the DOM), dust moves as whole objects instead
 * of re-uploading buffers, and quality steps down once if the device can't
 * hold ~50fps. `three` is imported dynamically so it lands in its own chunk.
 */
export function useIntroScene(
  canvasEl: Ref<HTMLCanvasElement | null>,
  sectionEl: Ref<HTMLElement | null>,
  hudEl: Ref<SVGSVGElement | null>,
) {
  const supported = ref(hasWebGL())
  const ready = ref(false)
  const placed = ref(0)
  const total = ref(0)

  let disposed = false
  let cleanup: (() => void) | null = null

  onMounted(async () => {
    if (!supported.value || !canvasEl.value || !sectionEl.value) return
    const canvas = canvasEl.value
    const section = sectionEl.value

    const [THREE, { RoundedBoxGeometry }, { RoomEnvironment }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] =
      await Promise.all([
        import('three'),
        import('three/addons/geometries/RoundedBoxGeometry.js'),
        import('three/addons/environments/RoomEnvironment.js'),
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/OutputPass.js'),
      ])
    if (disposed) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const compact = window.matchMedia('(max-width: 760px)').matches

    // ---------- Renderer, scene, camera ----------
    // No canvas-level MSAA: everything goes through the composer, so the
    // multisampling lives on its render target instead (see below).
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
    let pixelRatio = Math.min(window.devicePixelRatio, compact ? 1.25 : 1.5)
    renderer.setPixelRatio(pixelRatio)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070707)
    const fog = new THREE.FogExp2(0x070707, 0.035)
    scene.fog = fog

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTexture
    scene.environmentIntensity = 0.22

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200)
    const lookAt = new THREE.Vector3(0, -0.2, 0)

    // ---------- Lights ----------
    scene.add(new THREE.HemisphereLight(0x9aa0aa, 0x050505, 0.35))
    const key = new THREE.DirectionalLight(0xf5f5f0, 2.8)
    key.position.set(-7, 9, 11)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xb8c0d0, 1.2)
    rim.position.set(9, 4, -6)
    scene.add(rim)
    const ember = new THREE.PointLight(0xc8102e, 0, 22, 1.6)
    ember.position.set(0, -1.2, 1.4)
    scene.add(ember)

    // ---------- Monogram ----------
    const { bricks, core } = buildMonogram()
    total.value = bricks.length
    const monogram = new THREE.Group()
    scene.add(monogram)

    const stone = stoneTexture(THREE)
    const geometryByWidth = new Map<number, THREE.BufferGeometry>()
    const brickGeometry = (width: number) => {
      let geometry = geometryByWidth.get(width)
      if (!geometry) {
        geometry = new RoundedBoxGeometry(width - 0.09, 0.91, BRICK_DEPTH, 4, 0.13)
        geometryByWidth.set(width, geometry)
      }
      return geometry
    }

    // Three shades shared by all bricks: enough variation to read as stone,
    // far fewer material switches than one material per brick.
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

    const topRow = Math.max(...bricks.map((b) => b.row))
    const looseCandidates = bricks.map((b, i) => (b.row === topRow ? i : -1)).filter((i) => i >= 0)
    const loose = new Set([looseCandidates[1], looseCandidates[looseCandidates.length - 2]])

    const pieces = bricks.map((brick, i) => {
      const mesh = new THREE.Mesh(brickGeometry(brick.width), materials[i % materials.length])
      monogram.add(mesh)

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
      const reach = 8 + Math.random() * 9
      const exploded = target
        .clone()
        .add(outward.multiplyScalar(reach))
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
        build: { value: reducedMotion ? 1 : 0 },
        row: brick.row,
        phase: Math.random() * Math.PI * 2,
        scrollDelay: Math.random() * 0.22 + ((topRow - brick.row) / topRow) * 0.16,
      }
    })

    // Glowing core: sits inside the bricks and only shows through the joints.
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false })
    const coreMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, BRICK_DEPTH * 0.62), coreMaterial, core.length)
    const matrix = new THREE.Matrix4()
    const noRotation = new THREE.Quaternion()
    core.forEach((box, i) =>
      coreMesh.setMatrixAt(
        i,
        matrix.compose(new THREE.Vector3(box.x, box.y, 0), noRotation, new THREE.Vector3(box.width, box.height, 1)),
      ),
    )
    monogram.add(coreMesh)

    // ---------- Floor + particles ----------
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.78, metalness: 0.15 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -3.62
    scene.add(floor)

    // Dust is static geometry; it drifts by moving/rotating the whole cloud,
    // so no vertex buffer is re-uploaded per frame.
    const makeDust = (count: number, color: number, size: number, opacity: number, glow: boolean) => {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 46
        positions[i * 3 + 1] = -3.5 + Math.random() * 16
        positions[i * 3 + 2] = (Math.random() - 0.5) * 34
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, toneMapped: !glow }),
      )
      scene.add(points)
      return points
    }
    const dust = makeDust(compact ? 260 : 620, 0x9a9a9a, 0.045, 0.55, false)
    const embers = makeDust(compact ? 24 : 60, 0xff2a45, 0.07, 0.9, true)

    // ---------- Post-processing ----------
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
    const composer = new EffectComposer(renderer, target)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.5, 0.25)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    // ---------- Sizing ----------
    let baseDistance = 30
    let viewWidth = 1
    let viewHeight = 1
    const resize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return
      viewWidth = width
      viewHeight = height
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
      composer.setPixelRatio(pixelRatio)
      composer.setSize(width, height)
      bloom.resolution.set(width / 2, height / 2)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      const viewTan = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const widthShare = camera.aspect < 1 ? 0.88 : 0.6
      const fitWidth = 13.5 / (widthShare * viewTan * camera.aspect)
      const fitHeight = 7 / (0.56 * viewTan)
      baseDistance = Math.max(fitWidth, fitHeight)
      // Portrait screens push the camera much further back; thin the fog to
      // match so the monogram doesn't sink into it.
      fog.density = 0.035 * Math.min(1, 30 / baseDistance)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    // ---------- HUD (plain DOM, no Vue re-render per frame) ----------
    const hud = hudEl.value
    const hudSize = compact ? 3 : 4
    const hudLine = document.createElementNS(SVG_NS, 'polyline')
    const hudMarks = Array.from({ length: hudSize }, () => {
      const group = document.createElementNS(SVG_NS, 'g')
      const cross = document.createElementNS(SVG_NS, 'path')
      cross.setAttribute('d', 'M-5 0H5M0 -5V5')
      const text = document.createElementNS(SVG_NS, 'text')
      text.setAttribute('y', '-9')
      group.append(cross, text)
      return { group, text }
    })
    hud?.append(hudLine, ...hudMarks.map((mark) => mark.group))

    const projected = new THREE.Vector3()
    let hudPicks: number[] = []
    let hudClock = -1
    const pickHud = () => {
      const pool = pieces.map((_, i) => i).filter((i) => !loose.has(i))
      hudPicks = []
      while (hudPicks.length < hudSize && pool.length) {
        hudPicks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
      }
      hudPicks.sort((a, b) => pieces[a].target.x - pieces[b].target.x)
      const labels = [...HUD_LABELS]
      hudMarks.forEach((mark, i) => {
        const label = labels.splice(Math.floor(Math.random() * labels.length), 1)[0]
        mark.text.textContent = `${String(i + 1).padStart(2, '0')}  ${label}`
      })
    }
    let hudShown = -1

    // ---------- Scroll hand-off ----------
    let scrollTarget = 0
    let scroll = 0
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => (scrollTarget = self.progress),
    })

    // ---------- Pointer ----------
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    if (finePointer && !reducedMotion) window.addEventListener('pointermove', onPointerMove, { passive: true })

    // ---------- Visibility ----------
    let visible = true
    const visibilityObserver = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    visibilityObserver.observe(section)

    // ---------- Adaptive quality ----------
    // After the build-in settles, average a couple of seconds of frames; if
    // the device can't hold ~50fps, drop resolution and bloom once.
    let sampleTime = 0
    let sampleFrames = 0
    let downgraded = false
    const maybeDowngrade = (dt: number) => {
      if (downgraded) return
      sampleTime += dt
      sampleFrames++
      if (sampleFrames < 120) return
      if (sampleTime / sampleFrames > 1 / 50) {
        downgraded = true
        pixelRatio = 1
        bloom.enabled = false
        resize()
      } else {
        sampleTime = 0
        sampleFrames = 0
      }
    }

    // ---------- Frame ----------
    let lastPlaced = -1
    let lastTime = performance.now()
    let time = 0
    let assembledDone = false

    const frame = () => {
      const now = performance.now()
      // Clamp so a tab switch or a long GC pause doesn't make things jump.
      const dt = Math.min((now - lastTime) / 1000, 1 / 20)
      lastTime = now
      if (!visible) return
      time += dt
      const ambient = reducedMotion ? 0 : 1

      scroll += (scrollTarget - scroll) * damp(9, dt)
      section.style.setProperty('--intro-progress', scroll.toFixed(4))

      let assembled = 0
      let dissolved = 0
      let placedNow = 0
      for (const piece of pieces) {
        const dissolve = smoothstep(0, 1, (scroll - piece.scrollDelay) / 0.5)
        const t = piece.build.value * (1 - dissolve * dissolve)
        piece.mesh.position.lerpVectors(piece.exploded, piece.target, t)
        piece.mesh.quaternion.slerpQuaternions(piece.explodedQuat, piece.targetQuat, t)
        // Idle breathing once settled; fades out while bricks are in flight.
        const settle = smoothstep(0.92, 1, t) * ambient
        piece.mesh.position.z += Math.sin(time * 0.9 + piece.phase) * 0.035 * settle
        piece.mesh.rotation.x += Math.sin(time * 0.6 + piece.phase) * 0.012 * settle
        assembled += piece.build.value
        dissolved += dissolve
        if (piece.build.value > 0.97) placedNow++
      }
      assembled /= pieces.length
      dissolved /= pieces.length

      if (placedNow !== lastPlaced) {
        lastPlaced = placedNow
        placed.value = placedNow
      }
      if (!assembledDone && assembled > 0.999) assembledDone = true
      if (assembledDone) maybeDowngrade(dt)

      // Core glow: wakes as the monogram closes and dies with it as the
      // bricks are pulled apart (an exposed core is just a flat slab). The
      // ember light takes over, underlighting the bricks in flight.
      const glow =
        Math.pow(smoothstep(0.55, 1, assembled), 2) * 1.5 * (1 - smoothstep(0, 0.06, dissolved)) *
        (1 + Math.sin(time * 1.7) * 0.06 * ambient)
      coreMaterial.color.setRGB(RED.r * glow, RED.g * glow, RED.b * glow)
      ember.intensity = glow * 6 + Math.sin(Math.min(scroll * 1.4, 1) * Math.PI) * 26
      // At zero glow the core would render as solid black boxes over the
      // bricks still in flight. Its shader was compiled up front, so
      // toggling this never stalls a frame.
      coreMesh.visible = glow > 0.02
      renderer.toneMappingExposure = 1 - smoothstep(0.75, 1, scroll) * 0.7

      if (ambient) {
        dust.rotation.y = time * 0.012
        dust.position.y = Math.sin(time * 0.07) * 0.6
        embers.rotation.y = -time * 0.02
        embers.position.y = Math.sin(time * 0.11 + 1) * 0.9
      }

      // Camera: three-quarter view so the bricks' depth reads, slow sway +
      // cursor parallax, pushes in and squares up on scroll.
      const follow = damp(3, dt)
      pointer.sx += (pointer.x - pointer.sx) * follow
      pointer.sy += (pointer.y - pointer.sy) * follow
      const yaw = 0.34 * (1 - scroll) + Math.sin(time * 0.11) * 0.14 * ambient + pointer.sx * 0.14
      const pitch = 0.07 + pointer.sy * -0.05 + scroll * 0.06
      const distance = baseDistance * (1 - smoothstep(0, 1, scroll) * 0.5) + (1 - smoothstep(0, 1, assembled)) * 6 * ambient
      camera.position.set(
        Math.sin(yaw) * Math.cos(pitch) * distance,
        Math.sin(pitch) * distance + 0.6,
        Math.cos(yaw) * Math.cos(pitch) * distance,
      )
      camera.lookAt(lookAt)

      composer.render(dt)

      // HUD: a few bricks tagged with real stack items, reshuffled every few
      // seconds; only once the monogram is whole and the visitor hasn't
      // started scrolling it apart.
      const hudAlpha = smoothstep(0.97, 1, assembled) * (1 - smoothstep(0.02, 0.12, scroll))
      if (hud) {
        const rounded = Math.round(hudAlpha * 100) / 100
        if (rounded !== hudShown) {
          hudShown = rounded
          hud.style.opacity = String(rounded)
        }
        if (hudAlpha > 0) {
          const cycle = Math.floor(time / HUD_CYCLE)
          if (cycle !== hudClock) {
            hudClock = cycle
            pickHud()
          }
          let points = ''
          hudPicks.forEach((index, i) => {
            projected.copy(pieces[index].mesh.position)
            projected.z += BRICK_DEPTH / 2
            projected.applyMatrix4(monogram.matrixWorld).project(camera)
            const x = (projected.x * 0.5 + 0.5) * viewWidth
            const y = (-projected.y * 0.5 + 0.5) * viewHeight
            points += `${x.toFixed(1)},${y.toFixed(1)} `
            const { group, text } = hudMarks[i]
            group.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
            // Labels near the right edge sit left of their marker.
            const flip = x > viewWidth - 160
            text.setAttribute('x', flip ? '-10' : '10')
            text.setAttribute('text-anchor', flip ? 'end' : 'start')
          })
          hudLine.setAttribute('points', points)
        }
      }
    }

    // Compile every shader (core included, while it's still visible) before
    // the first frame, so nothing stalls once bricks start moving.
    await renderer.compileAsync(scene, camera)
    if (disposed) {
      renderer.dispose()
      return
    }
    composer.render()
    ready.value = true
    lastTime = performance.now()
    gsap.ticker.add(frame)

    // ---------- Build-in on load ----------
    const buildTweens = reducedMotion
      ? []
      : pieces.map((piece) =>
          gsap.to(piece.build, {
            value: 1,
            duration: 1.8,
            ease: 'expo.out',
            delay: 0.25 + piece.row * 0.13 + Math.random() * 0.3,
          }),
        )

    cleanup = () => {
      gsap.ticker.remove(frame)
      buildTweens.forEach((tween) => tween.kill())
      trigger.kill()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      hudLine.remove()
      hudMarks.forEach((mark) => mark.group.remove())
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material as THREE.Material | undefined
        material?.dispose?.()
      })
      stone.dispose()
      envTexture.dispose()
      pmrem.dispose()
      composer.dispose()
      renderer.dispose()
    }
  })

  onUnmounted(() => {
    disposed = true
    cleanup?.()
  })

  return { supported, ready, placed, total }
}
