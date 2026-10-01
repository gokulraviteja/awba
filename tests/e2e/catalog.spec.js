import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/#top')
  await expect(page.getByText('LIVE API')).toBeVisible()
})

test('loads the live Go catalog and filters models', async ({ page }) => {
  await expect(page.locator('.hero-metrics').getByText('MODELS LOADED')).toBeVisible()
  const loaded = Number(await page.locator('.hero-metrics strong').first().innerText())
  expect(loaded).toBeGreaterThan(10)

  await page.getByPlaceholder('Search model, publisher, or source ID').fill('Claude Sonnet 5.5')
  await expect(page.locator('.catalog-meta')).toContainText('matching records')
  await expect(page.getByRole('button', { name: /Claude Sonnet 5\.5 Anthropic/ }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /GPT-6\.1 Sol Pro/ })).toHaveCount(0)
})

test('opens a model record and compares two models', async ({ page }) => {
  await page.getByRole('button', { name: /Claude Sonnet 5\.5 Anthropic/ }).first().click()
  const drawer = page.getByRole('complementary', { name: 'Claude Sonnet 5.5 details' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('anthropic/claude-sonnet-5.5')
  await expect(drawer).toContainText('$2.00')
  await drawer.getByRole('button', { name: 'Close details' }).click()

  const checks = page.locator('.compare-check input[type="checkbox"]')
  await checks.nth(0).check()
  await checks.nth(1).check()
  await page.getByRole('button', { name: 'Compare models' }).click()
  await expect(page.getByRole('heading', { name: 'Model comparison' })).toBeVisible()
  await expect(page.locator('.comparison-table')).toContainText('Input / MTok')
  await expect(page.locator('.comparison-heading')).toHaveCount(3)
})

test('persists theme and exposes the detailed source mapping', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /Switch to .* theme/ })
  const initial = await page.locator('html').getAttribute('data-theme')
  await toggle.click()
  const changed = await page.locator('html').getAttribute('data-theme')
  expect(changed).not.toBe(initial)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', changed)

  await page.getByRole('link', { name: 'DATA MODEL' }).click()
  await expect(page.getByRole('heading', { name: 'Awba data model' })).toBeVisible()
  await page.getByRole('button', { name: /Source API mapping/i }).click()
  await expect(page.locator('.request-line')).toContainText('GET')
  await expect(page.locator('.request-line')).toContainText('https://openrouter.ai/api/v1/models')
  await expect(page.locator('.header-table')).toContainText('Bearer <OPENROUTER_API_KEY>')
  await expect(page.getByText('data[].canonical_slug', { exact: true }).first()).toBeVisible()
})
