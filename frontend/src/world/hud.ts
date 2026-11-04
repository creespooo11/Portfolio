import type * as THREE from 'three'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** World position -> CSS pixels in the canvas, written into `out`. */
export function toScreen(
  point: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number,
  out: { x: number; y: number; behind: boolean },
) {
  const p = point.clone().project(camera)
  out.x = (p.x * 0.5 + 0.5) * width
  out.y = (-p.y * 0.5 + 0.5) * height
  out.behind = p.z > 1
  return out
}

/**
 * Crosshair markers joined by a thin line, each with a text label: the
 * "HUD" pinned onto 3D objects. Plain SVG written straight to the DOM, so
 * moving it every frame never goes through Vue.
 */
export function createMarkerHud(svg: SVGSVGElement | null, count: number) {
  const line = document.createElementNS(SVG_NS, 'polyline')
  const marks = Array.from({ length: count }, () => {
    const group = document.createElementNS(SVG_NS, 'g')
    const cross = document.createElementNS(SVG_NS, 'path')
    cross.setAttribute('d', 'M-5 0H5M0 -5V5')
    const text = document.createElementNS(SVG_NS, 'text')
    text.setAttribute('y', '-9')
    group.append(cross, text)
    return { group, text }
  })
  svg?.append(line, ...marks.map((mark) => mark.group))

  let opacity = -1
  return {
    marks,
    setOpacity(value: number) {
      const rounded = Math.round(value * 100) / 100
      if (!svg || rounded === opacity) return
      opacity = rounded
      svg.style.opacity = String(rounded)
    },
    /** Points in screen pixels, one per mark (extra marks are hidden). */
    place(points: { x: number; y: number }[], width: number) {
      let path = ''
      marks.forEach((mark, i) => {
        const point = points[i]
        if (!point) {
          mark.group.setAttribute('visibility', 'hidden')
          return
        }
        mark.group.setAttribute('visibility', 'visible')
        path += `${point.x.toFixed(1)},${point.y.toFixed(1)} `
        mark.group.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`)
        // Labels near the right edge sit left of their marker.
        const flip = point.x > width - 160
        mark.text.setAttribute('x', flip ? '-10' : '10')
        mark.text.setAttribute('text-anchor', flip ? 'end' : 'start')
      })
      line.setAttribute('points', path)
    },
    dispose() {
      line.remove()
      marks.forEach((mark) => mark.group.remove())
    },
  }
}
