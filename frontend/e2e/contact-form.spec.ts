import { expect, test } from '@playwright/test'

/**
 * Fase 6 end-to-end check: drives a real browser against the frontend
 * (Nginx production build by default, see playwright.config.ts) and
 * exercises the full contact form flow through the real reverse proxy:
 * frontend -> contact-service -> Kafka -> notification-service.
 *
 * The page now runs Lenis (smooth scroll) and GSAP/ScrollTrigger
 * (scroll-reveal animations) on load. Playwright's own actionability
 * checks (auto-scroll-into-view, auto-wait) already handle interacting with
 * elements below the fold correctly even while those are running, but we
 * still give the intro's entrance animation a moment to settle before the
 * first interaction, so a slow CI runner can't catch it mid-animation.
 */
async function waitForPageReady(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.waitForSelector('.intro-name', { state: 'visible' })
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
  test('el nombre de la intro se muestra completo desde el primer frame', async ({ page }) => {
    await waitForPageReady(page)

    // The intro's h1 is never scrambled or animated in: it must already
    // show the full text.
    await expect(page.locator('.intro-name')).toHaveText('Javier Crespo Moll')
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
