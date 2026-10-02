import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/#/latest')
  await expect(page.getByText('LIVE', { exact: true })).toBeVisible()
})

test('shows a production latest-models homepage backed by the live API', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Know what’s new/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Latest by provider' })).toBeVisible()
  const loaded = Number(await page.locator('.hero-metrics strong').first().innerText())
  expect(loaded).toBeGreaterThan(10)
  await expect(page.locator('.latest-card')).toHaveCount(8)
  await expect(page.getByRole('link', { name: 'Data model' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'API', exact: true })).toHaveCount(0)
})

test('filters the complete model catalog and opens a model profile', async ({ page }) => {
  await page.getByRole('link', { name: 'Models', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Explore every model' })).toBeVisible()
  await page.getByPlaceholder('Search model, provider, or source ID').fill('Claude Sonnet 5.5')
  await expect(page.locator('.catalog-meta')).toContainText('matching models')
  const model = page.getByRole('button', { name: /Claude Sonnet 5\.5/ }).first()
  await expect(model).toBeVisible()
  await model.click()
  const drawer = page.getByRole('complementary', { name: 'Claude Sonnet 5.5 details' })
  await expect(drawer).toContainText('At a glance')
  await expect(drawer).toContainText('anthropic/claude-sonnet-5.5')
  await drawer.getByRole('button', { name: 'Close details' }).click()
})

test('drills from the provider directory into all models for a provider', async ({ page }) => {
  await page.getByRole('link', { name: 'Providers', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Models, by provider' })).toBeVisible()
  await page.getByPlaceholder('Find a provider').fill('Anthropic')
  await page.getByRole('link', { name: /Anthropic/ }).click()
  await expect(page.getByRole('heading', { name: 'Anthropic', exact: true })).toBeVisible()
  await expect(page.getByText('LATEST OBSERVED MODEL')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'All Anthropic models' })).toBeVisible()
  await expect(page.locator('.model-row').first()).toBeVisible()
})

test('compares selected models and persists the theme', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /Switch to .* theme/ })
  const initial = await page.locator('html').getAttribute('data-theme')
  await toggle.click()
  const changed = await page.locator('html').getAttribute('data-theme')
  expect(changed).not.toBe(initial)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', changed)

  await page.getByRole('link', { name: 'Models', exact: true }).click()
  const checks = page.locator('.compare-check input[type="checkbox"]')
  await checks.nth(0).check()
  await checks.nth(1).check()
  await page.getByRole('link', { name: 'Compare models' }).click()
  await expect(page.getByRole('heading', { name: 'Compare what matters' })).toBeVisible()
  await expect(page.locator('.comparison-table')).toContainText('Input / MTok')
  await expect(page.locator('.comparison-heading')).toHaveCount(3)
})
