import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const base = 'http://127.0.0.1:5173'

try {
  await page.goto(`${base}/select-role`)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('pramaansetu_users_v1', 'regular-users-safe')
    localStorage.setItem('pramaansetu_applications_v1', 'regular-applications-safe')
  })
  await page.reload()
  await page.getByRole('button', { name: 'Try Institution Demo' }).click()
  await page.waitForURL('**/institution/dashboard')

  await page.getByRole('link', { name: 'New Application', exact: true }).click()
  await page.waitForURL(/\/institution\/applications\/.+\/edit$/)
  await page.getByRole('heading', { name: 'Institution Information' }).waitFor()
  assert.equal(await page.getByText('Opening draft…').count(), 0)
  let workspace = await page.evaluate(() => JSON.parse(localStorage.getItem('pramaansetu_demo_v1')))
  const firstDraft = workspace.applications.find(application => application.status === 'DRAFT')
  assert.ok(firstDraft)
  assert.equal(workspace.applications.length, 5)

  await page.getByLabel('Full Address').fill('Fictional demo draft address')
  await page.getByRole('button', { name: 'Save & Exit' }).click()
  await page.waitForURL('**/institution/applications')
  await page.getByRole('link', { name: 'Resume Draft' }).click()
  await page.waitForURL(`**/institution/applications/${firstDraft.id}/edit`)
  assert.equal(await page.getByLabel('Full Address').inputValue(), 'Fictional demo draft address')
  await page.reload()
  await page.getByRole('heading', { name: 'Institution Information' }).waitFor()

  await page.goto(`${base}/institution/dashboard`)
  await page.getByRole('link', { name: 'Create Application', exact: true }).first().click()
  await page.waitForURL(/\/institution\/applications\/.+\/edit$/)
  await page.getByRole('heading', { name: 'Institution Information' }).waitFor()
  workspace = await page.evaluate(() => JSON.parse(localStorage.getItem('pramaansetu_demo_v1')))
  assert.equal(workspace.applications.filter(application => application.status === 'DRAFT').length, 2)
  assert.equal(await page.evaluate(() => localStorage.getItem('pramaansetu_applications_v1')), 'regular-applications-safe')
  assert.equal(await page.evaluate(() => localStorage.getItem('pramaansetu_users_v1')), 'regular-users-safe')

  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.getByRole('button', { name: 'Open sidebar navigation' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'New Application', exact: true }).click()
  await page.waitForURL(/\/institution\/applications\/.+\/edit$/)
  await page.getByRole('heading', { name: 'Institution Information' }).waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))

  console.log('ALL DEMO DRAFT INITIALIZATION CHECKS PASSED')
} finally {
  await browser.close()
}
