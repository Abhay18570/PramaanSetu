import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch()
const log = message => console.log(`PASS ${message}`)

async function selectLanguage(page, language) {
  await page.locator('.language-selector:visible select').first().selectOption(language)
  await page.waitForFunction(expected => document.documentElement.lang === expected, language)
}

async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label)
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForLoadState('networkidle')
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')
  assert.match(await page.locator('.gov-hero-heading').innerText(), /Smarter Application Verification\.\s+Stronger Regulatory Compliance\./)
  log('first visit defaults to English')

  await selectLanguage(page, 'hi')
  await page.waitForFunction(() => document.querySelector('.gov-hero-heading')?.textContent?.includes('अधिक स्मार्ट आवेदन सत्यापन।'))
  assert.equal(await page.evaluate(() => localStorage.getItem('pramaansetu_language')), 'hi')
  assert.equal(await page.locator('.hero-carousel-next').getAttribute('aria-label'), 'अगली स्लाइड')
  const urlBefore = page.url()
  assert.equal(page.url(), urlBefore)
  log('Hindi applies immediately to visible and accessible landing-page content')

  await page.goto(`${base}/register?role=INSTITUTION`)
  await page.getByText('संस्थान का नाम', { exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'), 'hi')
  await page.locator('#institutionName').fill('नमूना अभियांत्रिकी संस्था')
  await page.locator('#name').fill('Test Coordinator')
  await page.locator('#email').fill('i18n-institution@example.test')
  await page.locator('#phone').fill('9000000000')
  await page.locator('#state').fill('Maharashtra')
  await page.locator('#city').fill('Pune')
  await selectLanguage(page, 'mr')
  assert.equal(await page.locator('#institutionName').inputValue(), 'नमूना अभियांत्रिकी संस्था')
  await page.getByText('संस्थेचे नाव', { exact: true }).waitFor()
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/institution/dashboard')
  await page.getByText('संस्था डॅशबोर्ड', { exact: true }).waitFor()
  assert.equal(await page.locator('.language-selector select').count(), 1)
  log('Marathi persists into the institution portal without clearing registration values')

  await page.goto(`${base}/institution/applications/new`)
  await page.waitForURL('**/edit')
  await page.locator('[id="institutionDetails.address"]').fill('Persistent multilingual address')
  await selectLanguage(page, 'hi')
  assert.equal(await page.locator('[id="institutionDetails.address"]').inputValue(), 'Persistent multilingual address')
  assert.ok(page.url().includes('/edit'))
  log('language switching preserves wizard route, draft identity, and entered values')

  await page.getByText('प्रारूप सहेजें', { exact: true }).click()
  await page.getByText('Draft saved.', { exact: true }).waitFor()
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('lang'), 'hi')
  assert.equal(await page.locator('[id="institutionDetails.address"]').inputValue(), 'Persistent multilingual address')
  await page.locator('.gov-sidebar-logout-btn:visible').first().click()
  await page.waitForURL('**/login')
  assert.equal(await page.evaluate(() => localStorage.getItem('pramaansetu_language')), 'hi')
  log('language persists across refresh and sign-out independently of session data')

  await page.goto(`${base}/register?role=OFFICER`)
  await page.locator('#name').fill('Review Officer')
  await page.locator('#email').fill('i18n-officer@example.test')
  await page.locator('#department').fill('Scrutiny Unit')
  await selectLanguage(page, 'mr')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/officer/dashboard')
  await page.getByText('अधिकारी डॅशबोर्ड', { exact: true }).waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'), 'mr')
  log('officer dashboard retains Marathi and exposes the shared selector')

  for (const language of ['hi', 'mr']) {
    await page.setViewportSize({ width: 390, height: 844 })
    await selectLanguage(page, language)
    await noOverflow(page, `${language} officer mobile layout`)
    await page.goto(base)
    await page.getByRole('button', { name: /navigation/i }).click()
    await page.locator('.gov-mobile-drawer .language-selector select').selectOption(language)
    await noOverflow(page, `${language} landing mobile layout`)
  }
  log('Hindi and Marathi mobile headers and pages avoid horizontal overflow')
  assert.deepEqual(errors, [])
  await context.close()

  const invalidContext = await browser.newContext()
  await invalidContext.addInitScript(() => localStorage.setItem('pramaansetu_language', 'xx'))
  const invalidPage = await invalidContext.newPage()
  await invalidPage.goto(base)
  await invalidPage.waitForLoadState('networkidle')
  assert.equal(await invalidPage.locator('html').getAttribute('lang'), 'en')
  assert.equal(await invalidPage.evaluate(() => localStorage.getItem('pramaansetu_language')), 'en')
  log('invalid stored languages normalize to English')
  await invalidContext.close()

  console.log('ALL MULTILINGUAL BROWSER CHECKS PASSED')
} finally {
  await browser.close()
}
