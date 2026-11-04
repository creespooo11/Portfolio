import { ref } from 'vue'
import type * as THREE from 'three'
import type { RoundedBoxGeometry as RoundedBoxGeometryClass } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { createBrickKit, smoothstep, type BrickKit } from './bricks'

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}

export interface WorldContext {
  THREE: typeof import('three')
  RoundedBoxGeometry: typeof RoundedBoxGeometryClass
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  /**
   * Every light lives here and is always in the scene: stages only change
   * intensities/positions. A stage adding or hiding its own lights would
   * change the light count and force every material to recompile (a hitch
   * at each section change).
   */
  lights: {
    key: THREE.DirectionalLight
    rim: THREE.DirectionalLight
    ember: THREE.PointLight
    accent: THREE.PointLight
  }
  kit: BrickKit
  compact: boolean
  reducedMotion: boolean
  finePointer: boolean
}

export interface Frame {
  dt: number
  time: number
  /**
   * 0-1 through the section: from the moment it appears (its top reaches
   * the middle of the screen) to the moment it leaves (its bottom does),
   * so the stage responds to scroll from its very first frame. Stages with
   * `pinned` get the old 0-1 over just the stretch where the section fills
   * the screen.
   */
  progress: number
  /** 0 at the section's edges (where the view cuts through black), 1 inside. */
  presence: number
  /** Smoothed cursor, -1..1 on both axes. */
  pointer: { x: number; y: number }
  width: number
  height: number
  /** 0 with reduced motion: stages drop all autonomous movement. */
  ambient: number
  /** Stages may lower these for the frame; reset before every update. */
  exposure: number
  fogDensity: number
}

export interface Stage {
  group: THREE.Group
  /**
   * Progress over the section's full-screen stretch only (the intro, which
   * starts at the very top of the page and has no entrance to animate).
   */
  pinned?: boolean
  /** Owns the camera pose and its own animation for the frame. */
  update(frame: Frame, ctx: WorldContext): void
  /** Called once when the stage leaves the screen (hide HUD, etc.). */
  hide?(): void
  dispose(): void
}

export type StageFactory = (ctx: WorldContext) => Stage | Promise<Stage>

interface Entry {
  section: HTMLElement
  factory: StageFactory
  stage: Stage | null
  top: number
  height: number
  removed: boolean
  /** Progress eased towards the scroll position, for silky motion. */
  smooth: number
  /** Last --presence written to the section, to skip redundant writes. */
  shownPresence: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

/**
 * One fixed WebGL canvas behind the whole page. Each section registers a
 * stage (its own group of objects + camera choreography); every frame the
 * director finds the section under the middle of the viewport and renders
 * only that stage, so the cost per frame stays flat however many sections
 * there are. Crossing from one section to the next fades through black,
 * like a dive between scenes.
 */
class World {
  readonly supported = hasWebGL()
  readonly ready = ref(false)

  private entries: Entry[] = []
  private ctx: WorldContext | null = null
  private starting = false
  private teardown: (() => void) | null = null
  private buildQueue: Promise<void> = Promise.resolve()
  private warmTarget: THREE.WebGLRenderTarget | null = null
  /**
   * Background stage builds wait until this time (the intro's build-in
   * must not be interrupted: every build is a main-thread task long enough
   * to make a time-based animation skip). Reset to 0 once the visitor
   * scrolls, so stages are ready when needed.
   */
  private holdUntil = 0

  /** Resolves when the build hold is over and the browser is idle. */
  private idle() {
    return new Promise<void>((resolve) => {
      const whenIdle = () =>
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(() => resolve(), { timeout: 700 })
          : setTimeout(resolve, 60)
      const wait = () => (performance.now() >= this.holdUntil ? whenIdle() : window.setTimeout(wait, 120))
      wait()
    })
  }

  register(section: HTMLElement, factory: StageFactory): () => void {
    const entry: Entry = { section, factory, stage: null, top: 0, height: 0, removed: false, smooth: 0, shownPresence: -1 }
    this.entries.push(entry)
    this.measure()
    if (this.ctx) this.build(entry)
    return () => {
      entry.removed = true
      this.entries = this.entries.filter((e) => e !== entry)
      if (entry.stage && this.ctx) {
        this.ctx.scene.remove(entry.stage.group)
        entry.stage.dispose()
      }
    }
  }

  /** Section positions, cached so the frame loop never forces a layout. */
  measure = () => {
    const scrollY = window.scrollY
    for (const entry of this.entries) {
      const rect = entry.section.getBoundingClientRect()
      entry.top = rect.top + scrollY
      entry.height = rect.height
    }
    this.entries.sort((a, b) => a.top - b.top)
  }

  private build(entry: Entry, first = false) {
    // Stages are built one after another, each split into idle-time
    // chunks: the first (the intro) right away, the rest once its build-in
    // has played (see holdUntil).
    this.buildQueue = this.buildQueue.then(async () => {
      if (!first) await this.idle()
      const ctx = this.ctx
      if (!ctx || entry.removed) return
      const stage = await entry.factory(ctx)
      if (entry.removed || !this.ctx) {
        stage.dispose()
        return
      }
      ctx.scene.add(stage.group)
      // Compile (and upload textures) while the group is briefly visible,
      // so its first real frame doesn't stall.
      stage.group.visible = true
      const pending = ctx.renderer.compileAsync(stage.group, ctx.camera, ctx.scene)
      stage.group.visible = false
      await pending
      if (!first) await this.idle()
      if (entry.removed || !this.ctx) return
      // Warm-up: draw the stage once into a tiny offscreen target with
      // culling off, so geometry, instance buffers and textures are on the
      // GPU before the visitor scrolls to it (otherwise the first frame of
      // each section stalls ~100ms uploading them).
      const culled: THREE.Object3D[] = []
      stage.group.traverse((object) => {
        if (object.frustumCulled) {
          object.frustumCulled = false
          culled.push(object)
        }
      })
      const shown = ctx.scene.children.filter((child) => child.visible)
      shown.forEach((child) => (child.visible = false))
      stage.group.visible = true
      if (this.warmTarget) {
        const previousTarget = ctx.renderer.getRenderTarget()
        ctx.renderer.setRenderTarget(this.warmTarget)
        ctx.renderer.render(ctx.scene, ctx.camera)
        ctx.renderer.setRenderTarget(previousTarget)
      }
      stage.group.visible = false
      shown.forEach((child) => (child.visible = true))
      culled.forEach((object) => (object.frustumCulled = true))
      entry.stage = stage
      this.measure()
    })
    return this.buildQueue
  }

  async start(canvas: HTMLCanvasElement) {
    if (!this.supported || this.starting) return
    this.starting = true

    const [
      THREE,
      { RoundedBoxGeometry },
      { RoomEnvironment },
      { EffectComposer },
      { RenderPass },
      { UnrealBloomPass },
      { OutputPass },
    ] = await Promise.all([
      import('three'),
      import('three/addons/geometries/RoundedBoxGeometry.js'),
      import('three/addons/environments/RoomEnvironment.js'),
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
    ])
    if (!this.starting) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const compact = window.matchMedia('(max-width: 760px)').matches

    // No canvas-level MSAA: everything goes through the composer, so the
    // multisampling lives on its render target instead.
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
    // Internal resolution is capped below the screen's: with MSAA on top,
    // 1.25x is visually sharp and costs ~30% fewer pixels than 1.5x.
    let pixelRatio = Math.min(window.devicePixelRatio, compact ? 1 : 1.25)
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

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400)

    scene.add(new THREE.HemisphereLight(0x9aa0aa, 0x050505, 0.35))
    const key = new THREE.DirectionalLight(0xf5f5f0, 2.8)
    const rim = new THREE.DirectionalLight(0xb8c0d0, 1.2)
    const ember = new THREE.PointLight(0xc8102e, 0, 22, 1.6)
    const accent = new THREE.PointLight(0xc8102e, 0, 30, 1.4)
    scene.add(key, rim, ember, accent)
    const lightDefaults = () => {
      key.position.set(-7, 9, 11)
      key.intensity = 2.8
      rim.position.set(9, 4, -6)
      rim.intensity = 1.2
      ember.intensity = 0
      accent.intensity = 0
    }
    lightDefaults()

    // ---------- Shared space: dust + embers around the camera ----------
    // Static geometry that drifts by moving the whole cloud, so no vertex
    // buffer is re-uploaded per frame. It follows the camera, so every
    // stage floats in the same space.
    const makeDust = (count: number, color: number, size: number, opacity: number, glow: boolean) => {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60
        positions[i * 3 + 1] = (Math.random() - 0.5) * 34
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false, toneMapped: !glow }),
      )
      points.frustumCulled = false
      scene.add(points)
      return points
    }
    const dust = makeDust(compact ? 220 : 480, 0x9a9a9a, 0.05, 0.55, false)
    const embers = makeDust(compact ? 24 : 50, 0xff2a45, 0.07, 0.9, true)

    // ---------- Post-processing ----------
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 })
    const composer = new EffectComposer(renderer, target)
    composer.addPass(new RenderPass(scene, camera))
    // Threshold high enough that only the red glow parts (pushed well past
    // 1, see kit.setGlow) bloom; lit grey/white surfaces stay crisp.
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.5, 0.42)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    this.warmTarget = new THREE.WebGLRenderTarget(4, 4)
    const kit = createBrickKit(THREE, RoundedBoxGeometry)
    const ctx: WorldContext = {
      THREE,
      RoundedBoxGeometry,
      renderer,
      scene,
      camera,
      lights: { key, rim, ember, accent },
      kit,
      compact,
      reducedMotion,
      finePointer,
    }

    // ---------- Sizing ----------
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
      this.measure()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    // Page height changes (data arriving, fonts) move every section below.
    const layoutObserver = new ResizeObserver(this.measure)
    layoutObserver.observe(document.body)
    ScrollTrigger.addEventListener('refresh', this.measure)
    resize()

    // ---------- Pointer ----------
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    if (finePointer && !reducedMotion) window.addEventListener('pointermove', onPointerMove, { passive: true })

    // ---------- Adaptive quality ----------
    // Averages ~1.5s of frames at a time; while the device can't hold
    // ~55fps it steps quality down: first resolution, then bloom.
    let sampleTime = 0
    let sampleFrames = 0
    let level = 0
    const maybeDowngrade = (dt: number) => {
      if (level >= 2) return
      sampleTime += dt
      sampleFrames++
      if (sampleFrames < 90) return
      const slow = sampleTime / sampleFrames > 1 / 55
      sampleTime = 0
      sampleFrames = 0
      if (!slow) return
      level++
      if (level === 1 && pixelRatio > 1) {
        pixelRatio = 1
        resize()
      } else {
        level = 2
        bloom.enabled = false
      }
    }

    // ---------- Director ----------
    const frameState: Frame = {
      dt: 0,
      time: 0,
      progress: 0,
      presence: 0,
      pointer: { x: 0, y: 0 },
      width: 1,
      height: 1,
      ambient: reducedMotion ? 0 : 1,
      exposure: 1,
      fogDensity: 0.035,
    }
    let lastTime = performance.now()
    let time = 0
    let shown: Entry | null = null
    let blank = false

    const setPresence = (entry: Entry, value: number) => {
      if (Math.abs(entry.shownPresence - value) < 0.004 && value !== 0 && value !== 1) return
      if (entry.shownPresence === value) return
      entry.shownPresence = value
      entry.section.style.setProperty('--presence', value.toFixed(3))
      entry.section.classList.toggle('is-active', value > 0.02)
    }

    const frame = () => {
      const now = performance.now()
      // Clamp so a tab switch or a long GC pause doesn't make things jump.
      const dt = Math.min((now - lastTime) / 1000, 1 / 20)
      lastTime = now
      time += dt

      const vh = window.innerHeight
      const scrollY = window.scrollY
      if (scrollY > 40) this.holdUntil = 0
      let active: Entry | null = null
      let presence = 0
      let progress = 0
      let entering = false
      for (const entry of this.entries) {
        const top = entry.top - scrollY
        const bottom = top + entry.height
        const fromTop = vh / 2 - top
        const fromBottom = bottom - vh / 2
        const distance = Math.min(fromTop, fromBottom)
        if (distance > 0 && !active) {
          active = entry
          presence = smoothstep(0, vh * 0.14, distance)
          progress = entry.stage?.pinned
            ? clamp01(-top / Math.max(1, entry.height - vh))
            : clamp01(fromTop / Math.max(1, entry.height))
          entering = fromTop < fromBottom
          setPresence(entry, presence)
        } else {
          setPresence(entry, 0)
        }
      }
      if (active && !active.stage) active = null

      if (active !== shown) {
        // Switch first, then clean up: if a stage's hide() ever threw, the
        // switch must not be retried (and re-thrown) on every frame.
        const previous = shown
        shown = active
        if (active?.stage) {
          active.stage.group.visible = true
          active.smooth = progress
        }
        if (previous?.stage) {
          previous.stage.group.visible = false
          previous.stage.hide?.()
        }
      }

      if (!active?.stage) {
        // Nothing to show (e.g. over the footer): one black frame, then idle.
        if (!blank) {
          renderer.toneMappingExposure = 0
          composer.render(dt)
          blank = true
        }
        return
      }
      blank = false

      const follow = damp(3, dt)
      pointer.sx += (pointer.x - pointer.sx) * follow
      pointer.sy += (pointer.y - pointer.sy) * follow

      lightDefaults()
      frameState.dt = dt
      frameState.time = time
      // Eased towards the real scroll: wheel ticks, keyboard and scrollbar
      // jumps all turn into continuous motion.
      active.smooth += (progress - active.smooth) * damp(7, dt)
      frameState.progress = active.smooth
      frameState.presence = presence
      frameState.pointer.x = pointer.sx
      frameState.pointer.y = pointer.sy
      frameState.width = viewWidth
      frameState.height = viewHeight
      frameState.exposure = 1
      frameState.fogDensity = 0.035
      active.stage.update(frameState, ctx)
      // Transitions as flights: arriving, the camera comes in from behind;
      // leaving, it carries on forward into the dark.
      // The only entrance/exit motion (stages don't add their own): a short
      // flight that eases out as the stage arrives, so the figure is
      // readable almost immediately instead of zooming in from far away.
      const away = 1 - presence
      camera.translateZ(away * away * 6 * (entering ? 1 : -1))

      fog.density = frameState.fogDensity
      // Brightens fast (sqrt): the dark moment between stages stays short.
      renderer.toneMappingExposure = Math.sqrt(presence) * frameState.exposure

      if (frameState.ambient) {
        dust.rotation.y = time * 0.012
        dust.position.y = Math.sin(time * 0.07) * 0.6
        embers.rotation.y = -time * 0.02
        embers.position.y = Math.sin(time * 0.11 + 1) * 0.9
      }
      // The dust cloud travels with the camera so every stage sits in it.
      dust.position.x = embers.position.x = camera.position.x
      dust.position.z = embers.position.z = camera.position.z - 10

      composer.render(dt)
      maybeDowngrade(dt)

    }

    this.ctx = ctx
    // The first registered stage (the intro) is built, compiled and drawn
    // before the loop starts; the rest follow in the background.
    this.measure()
    const pending = [...this.entries]
    if (pending[0]) await this.build(pending[0], true)
    if (!this.ctx) return
    await renderer.compileAsync(scene, camera)
    lastTime = performance.now()
    gsap.ticker.add(frame)
    this.ready.value = true
    // Let the intro's build-in (~3s) play before anything else is built.
    this.holdUntil = window.scrollY > 40 ? 0 : performance.now() + 3400
    pending.slice(1).forEach((entry) => this.build(entry))

    this.teardown = () => {
      gsap.ticker.remove(frame)
      resizeObserver.disconnect()
      layoutObserver.disconnect()
      ScrollTrigger.removeEventListener('refresh', this.measure)
      window.removeEventListener('pointermove', onPointerMove)
      for (const entry of this.entries) entry.stage?.dispose()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material as THREE.Material | undefined
        material?.dispose?.()
      })
      kit.dispose()
      envTexture.dispose()
      pmrem.dispose()
      composer.dispose()
      this.warmTarget?.dispose()
      renderer.dispose()
    }
  }

  stop() {
    this.starting = false
    this.teardown?.()
    this.teardown = null
    this.ctx = null
    this.ready.value = false
    for (const entry of this.entries) entry.stage = null
  }
}

export const world = new World()
