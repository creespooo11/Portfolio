import { expect, test } from '@playwright/test'

/**
 * Regression test for a reported bug: on some plain hard reloads (F5, no
 * HMR/editing involved), the hero's SplitText name animation was seen
 * stalling partway through — e.g. showing "JA" or "JAVI" instead of the
 * full "JAVIER CRESPO MOLL", at a different cutoff each time.
 *
 * This reloads the page repeatedly within a single test and asserts the
 * FULL final name text on every single reload — not just that the
 * `.hero-name`/`.char` elements exist (which would pass even mid-animation
 * or if the split silently failed to run to completion).
 */
test('el nombre del hero se completa entero en recargas repetidas', async ({ page }) => {
  const RELOADS = 12
  const results: string[] = []

  for (let i = 0; i < RELOADS; i++) {
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForSelector('.hero-name .char', { state: 'attached' })

    // Give the stagger animation (~1.1s) plus a real margin to settle,
    // matching how long a visitor would actually wait before judging the
    // hero "done" — this must not just check existence, but that every
    // character actually reached its final, fully-visible state.
    await page.waitForFunction(
      () => {
        const chars = Array.from(document.querySelectorAll('.hero-name .char'))
        return chars.length > 0 && chars.every((c) => getComputedStyle(c).opacity === '1')
      },
      { timeout: 4000 },
    )

    const text = await page.locator('.hero-name').textContent()
    results.push(text ?? '')
    expect(text?.replace(/\s+/g, ' ').trim()).toBe('JAVIER CRESPO MOLL')
  }

  expect(results).toHaveLength(RELOADS)
})
