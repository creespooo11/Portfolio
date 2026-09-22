import { expect, test } from '@playwright/test'

/**
 * The floating pill nav is driven by a ScrollTrigger tied to the hero's own
 * bounds, and its links scroll via Lenis's own scrollTo (not the native
 * scrollIntoView/scrollTo, which Lenis silently overrides once it takes
 * over the page — see the frontend README). So this suite drives scroll
 * with real wheel events, the same way a visitor's trackpad/mouse would,
 * instead of Playwright's scrollIntoView-based auto-scroll.
 */
async function waitForPageReady(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.waitForSelector('.hero-name', { state: 'visible' })
  await page.waitForTimeout(1200)
}

test.describe('Navegación flotante', () => {
  test('está oculta sobre el hero y aparece al pasar de sección', async ({ page }) => {
    await waitForPageReady(page)

    await expect(page.locator('.floating-nav')).toHaveCSS('opacity', '0')

    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(250)
    }
    await page.waitForTimeout(500)

    await expect(page.locator('.floating-nav')).toHaveCSS('opacity', '1', { timeout: 5000 })
  })

  test('el link "Proyectos" hace scroll suave hasta la sección de proyectos', async ({ page }) => {
    await waitForPageReady(page)

    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(250)
    }
    await expect(page.locator('.floating-nav')).toHaveCSS('opacity', '1', { timeout: 5000 })

    await page.locator('.floating-nav-link', { hasText: 'Proyectos' }).click()
    await page.waitForTimeout(1500)

    await expect(page.locator('#work')).toBeInViewport()
  })

  test('el botón de acento rojo hace scroll suave hasta contacto', async ({ page }) => {
    await waitForPageReady(page)

    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(250)
    }
    await expect(page.locator('.floating-nav')).toHaveCSS('opacity', '1', { timeout: 5000 })

    await page.locator('.floating-nav-cta').click()
    await page.waitForTimeout(1500)

    await expect(page.locator('#contact')).toBeInViewport()
  })
})
