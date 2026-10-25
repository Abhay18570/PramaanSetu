import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const base = 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  await page.goto(`${base}/select-role`)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('pramaansetu_users_v1', 'regular-users-safe')
    localStorage.setItem('pramaansetu_applications_v1', 'regular-applications-safe')
  })
  await page.reload()

  await page.getByRole('button', { name: 'Try Institution Demo' }).waitFor()
  await page.getByRole('button', { name: 'Try Officer Demo' }).waitFor()
  assert.equal(await page.getByText('Instant access — no account required').count(), 2)
  assert.equal(await page.getByRole('link', { name: 'Create Institution Account' }).getAttribute('href'), '/register?role=INSTITUTION')
  assert.equal(await page.getByRole('link', { name: 'Create Officer Account' }).getAttribute('href'), '/register?role=OFFICER')
  assert.equal((await page.getByRole('link', { name: 'Already registered? Access workspace' }).all()).length, 2)

  await page.getByRole('button', { name: 'Try Institution Demo' }).click()
  await page.waitForURL('**/institution/dashboard')
  await page.getByText('Demo Mode').waitFor()
  let session = await page.evaluate(() => JSON.parse(localStorage.getItem('pramaansetu_session_v1')))
  assert.equal(session.demoRole, 'INSTITUTION')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pramaansetu_demo_v1')).applications.length), 4)
  await page.goto(`${base}/officer/dashboard`)
  await page.waitForURL('**/institution/dashboard')

  await page.evaluate(() => localStorage.removeItem('pramaansetu_session_v1'))
  await page.goto(`${base}/select-role`)
  await page.getByRole('button', { name: 'Try Officer Demo' }).click()
  await page.waitForURL('**/officer/dashboard')
  await page.getByText('Demo Mode').waitFor()
  session = await page.evaluate(() => JSON.parse(localStorage.getItem('pramaansetu_session_v1')))
  assert.equal(session.demoRole, 'OFFICER')
  await page.goto(`${base}/institution/dashboard`)
  await page.waitForURL('**/officer/dashboard')

  assert.equal(await page.evaluate(() => localStorage.getItem('pramaansetu_users_v1')), 'regular-users-safe')
  assert.equal(await page.evaluate(() => localStorage.getItem('pramaansetu_applications_v1')), 'regular-applications-safe')

  for (const width of [1440, 1280, 768, 390]) {
    await page.evaluate(() => localStorage.removeItem('pramaansetu_session_v1'))
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`${base}/select-role`)
    assert.equal(await page.getByRole('button', { name: /Try .* Demo/ }).count(), 2)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px role selection overflow`)
  }

  console.log('ALL ROLE SELECTION DEMO CHECKS PASSED')
} finally {
  await browser.close()
}
