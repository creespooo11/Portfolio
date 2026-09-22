import { expect, test } from '@playwright/test'

/**
 * Fase 6 end-to-end check: drives a real browser against the frontend
 * (Nginx production build by default, see playwright.config.ts) and
 * exercises the full contact form flow through the real reverse proxy:
 * frontend -> contact-service -> Kafka -> notification-service.
 */
test.describe('Formulario de contacto', () => {
  test('envía un mensaje válido y muestra el mensaje de éxito', async ({ page }) => {
    await page.goto('/')

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

    await page.screenshot({ path: 'e2e/screenshots/contact-form-success.png', fullPage: true })
  })

  test('muestra un error claro si el email no es válido, sin perder lo escrito', async ({ page }) => {
    await page.goto('/')

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

    await page.screenshot({ path: 'e2e/screenshots/contact-form-error.png', fullPage: true })
  })
})
