import { expect, test } from '@playwright/test'

/**
 * Regression coverage for a reported bug: on some plain hard reloads (F5, no
 * HMR/editing involved), the old hero's SplitText name animation was seen
 * stalling partway through, e.g. showing "JA" or "JAVI" instead of the full
 * name, at a different cutoff each time, particularly in Brave.
 *
 * The name now lives in the 3D intro as its h1 and still runs no entrance
 * animation at all (the scrambled lines around it are separate elements).
 * This reloads the page repeatedly and asserts the full name is present and
 * painted immediately after every load, and that the intro's canvas mounts.
 */
test('el nombre de la intro se muestra completo e inmediato en recargas repetidas', async ({ page }) => {
  // Every reload also boots the intro's WebGL scene, which headless
  // Chromium renders in software: ~5s per reload instead of ~2s.
  test.setTimeout(120_000)
  const RELOADS = 12

  for (let i = 0; i < RELOADS; i++) {
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForSelector('.intro-name', { state: 'visible' })

    await expect(page.locator('.intro-name')).toHaveText('Javier Crespo Moll')
    await expect(page.locator('.intro-name')).toBeVisible()
    await expect(page.locator('.intro-canvas, .intro-fallback')).toHaveCount(1)
  }
})
