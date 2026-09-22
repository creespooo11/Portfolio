import { expect, test } from '@playwright/test'

/**
 * Fase 6 end-to-end check: drives a real browser against the frontend
 * (Nginx production build by default, see playwright.config.ts) and
 * exercises the full contact form flow through the real reverse proxy:
 * frontend -> contact-service -> Kafka -> notification-service.
 *
 * The page now runs Lenis (smooth scroll) and GSAP/ScrollTrigger/SplitText
 * (hero + scroll-reveal animations) on load. Playwright's own actionability
 * checks (auto-scroll-into-view, auto-wait) already handle interacting with
 * elements below the fold correctly even while those are running, but we
 * still give the hero's entrance animation a moment to settle before the
 * first interaction, so a slow CI runner can't catch it mid-animation.
 */
async function waitForPageReady(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.waitForSelector('.hero-name', { state: 'visible' })
  await page.waitForTimeout(1200)
}

test.describe('Formulario de contacto', () => {
  test('envía un mensaje válido y muestra el mensaje de éxito', async ({ page }) => {
    await waitForPageReady(page)

    const uniqueEmail = `ada.lovelace.${Date.now()}@example.com`

    await page.locator('#contact-name').fill('Ada Lovelace')
    await page.locator('#contact-email').fill(uniqueEmail)
    await page
      .locator('#contact-message')
      .fill('Mensaje de prueba end-to-end enviado por Playwright en la Fase 6.')

    await page.getByRole('button', { name: /Enviar mensaje/ }).click()

    const successMessage = page.getByRole('status')
    await expect(successMessage).toBeVisible({ timeout: 10_000 })
    await expect(successMessage).toContainText('se ha enviado correctamente')

    // The form is cleared after a successful submission.
    await expect(page.locator('#contact-name')).toHaveValue('')
    await expect(page.locator('#contact-email')).toHaveValue('')
    await expect(page.locator('#contact-message')).toHaveValue('')

    // Not fullPage: with Lenis driving scroll, a fullPage capture can grab
    // an intermediate frame mid-animation. The contact form is already
    // scrolled into view at this point, so the viewport shot is enough.
    await page.screenshot({ path: 'e2e/screenshots/contact-form-success.png' })
  })

  test('muestra un error claro si el email no es válido, sin perder lo escrito', async ({ page }) => {
    await waitForPageReady(page)

    await page.locator('#contact-name').fill('Grace Hopper')
    await page.locator('#contact-email').fill('esto-no-es-un-email')
    await page
      .locator('#contact-message')
      .fill('Este envío debería fallar por el formato de email.')

    await page.getByRole('button', { name: /Enviar mensaje/ }).click()

    const errorMessage = page.getByRole('alert')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('email')

    // The app must not crash, and must not throw away what the user typed.
    await expect(page.locator('#contact-name')).toHaveValue('Grace Hopper')
    await expect(page.locator('#contact-message')).toHaveValue(
      'Este envío debería fallar por el formato de email.',
    )

    await page.screenshot({ path: 'e2e/screenshots/contact-form-error.png' })
  })
})

test.describe('Animaciones (GSAP + Lenis)', () => {
  test('el hero divide el nombre en caracteres y los contadores cuentan hasta su valor real', async ({ page }) => {
    await waitForPageReady(page)

    // SplitText wraps every character of "JAVIER CRESPO" in its own element;
    // if this is empty, SplitText never ran.
    const charCount = await page.locator('.hero-name .char').count()
    expect(charCount).toBeGreaterThan(0)

    const stats = page.locator('.stat-value')
    await expect(stats.nth(0)).toHaveText('2', { timeout: 5000 })
    await expect(stats.nth(1)).toHaveText('3', { timeout: 5000 })
    await expect(stats.nth(2)).toHaveText('DESDE 2024', { timeout: 5000 })
    // The 4th stat depends on portfolio-service's async response (stack
    // size): it must count past its initial 0 once that data arrives.
    await expect(stats.nth(3)).not.toHaveText('0', { timeout: 8000 })
  })

  test('el hover sobre un proyecto revela su imagen con el overlay rojo', async ({ page }) => {
    await waitForPageReady(page)

    const firstProject = page.locator('.project-nav-item').first()
    await firstProject.scrollIntoViewIfNeeded()
    await firstProject.hover()

    // Confirms the GSAP tween actually reached its target state, not just
    // that the element exists in the DOM (which would pass even at opacity 0).
    await expect(page.locator('.project-preview-frame')).toHaveCSS('opacity', '1', { timeout: 3000 })
    await expect(page.locator('.project-preview-overlay')).toBeAttached()
  })
})
