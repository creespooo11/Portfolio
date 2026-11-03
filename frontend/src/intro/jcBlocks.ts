/**
 * Brick layout for the intro's "JC" monogram.
 *
 * Each letter is a 6x7 bitmap; every horizontal run of filled cells is laid
 * as masonry: bricks two cells wide, with odd rows shifted by one cell so
 * the joints don't line up vertically (that offset is what makes it read as
 * built rather than pixelated). Coordinates are in cell units, centred on
 * the origin, y up.
 */
const LETTERS: Record<'J' | 'C', string[]> = {
  J: [
    '######',
    '....##',
    '....##',
    '....##',
    '##..##',
    '##..##',
    '.####.',
  ],
  C: [
    '.#####',
    '##....',
    '##....',
    '##....',
    '##....',
    '##....',
    '.#####',
  ],
}

const LETTER_WIDTH = 6
const LETTER_GAP = 1.5
const ROWS = 7

export interface Brick {
  /** Centre of the brick once assembled. */
  x: number
  y: number
  /** Width in cells (1 or 2). */
  width: number
  /** 0 = bottom row; drives the bottom-up build order. */
  row: number
}

/**
 * A box of the glowing core. Cores stay inside the bricks' outer silhouette
 * (so the sides never show as a flat slab) but bridge every joint between
 * neighbouring bricks, which is where the red light leaks through.
 */
export interface CoreBox {
  x: number
  y: number
  width: number
  height: number
}

function splitRun(length: number, shifted: boolean): number[] {
  const parts: number[] = []
  let left = length
  if (shifted && left >= 3) {
    parts.push(1)
    left -= 1
  }
  while (left >= 2) {
    parts.push(2)
    left -= 2
  }
  if (left === 1) parts.push(1)
  return parts
}

export function buildMonogram(): { bricks: Brick[]; core: CoreBox[]; width: number; height: number } {
  const bricks: Brick[] = []
  const core: CoreBox[] = []
  const totalWidth = LETTER_WIDTH * 2 + LETTER_GAP
  const originX = -totalWidth / 2
  const originY = ROWS / 2

  ;(['J', 'C'] as const).forEach((letter, letterIndex) => {
    const offsetX = originX + letterIndex * (LETTER_WIDTH + LETTER_GAP)

    LETTERS[letter].forEach((line, rowFromTop) => {
      const row = ROWS - 1 - rowFromTop
      const y = originY - rowFromTop - 0.5

      const above = LETTERS[letter][rowFromTop - 1]
      for (let col = 0; col < line.length; col++) {
        // Bridge to the row above where both cells are filled.
        if (line[col] === '#' && above?.[col] === '#') {
          core.push({ x: offsetX + col + 0.5, y: y + 0.5, width: 0.78, height: 0.34 })
        }
      }

      let col = 0
      while (col < line.length) {
        if (line[col] !== '#') {
          col++
          continue
        }
        let end = col
        while (end < line.length && line[end] === '#') end++
        core.push({ x: offsetX + (col + end) / 2, y, width: end - col - 0.22, height: 0.78 })

        let cursor = col
        for (const width of splitRun(end - col, row % 2 === 1)) {
          bricks.push({ x: offsetX + cursor + width / 2, y, width, row })
          cursor += width
        }
        col = end
      }
    })
  })

  return { bricks, core, width: totalWidth, height: ROWS }
}
