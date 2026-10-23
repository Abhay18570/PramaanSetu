import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch()
const errors = []
const log = message => console.log(`PASS ${message}`)

async function activeIndex(carousel) {
  const label = await carousel.locator('.hero-carousel-pagination [aria-current="true"]').getAttribute('aria-label')
  return Number(label?.match(/\d+/)?.[0])
}

async function headingPosition(page) {
  const box = await page.getByRole('heading', { name: /Smarter Application Verification/ }).boundingBox()
  return { x: Math.round(box.x), y: Math.round(box.y) }
}

function assertFixed(actual, expected) {
  assert.ok(Math.abs(actual.x - expected.x) <= 1 && Math.abs(actual.y - expected.y) <= 1)
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base)
  await page.waitForLoadState('networkidle')

  const carousel = page.getByRole('region', { name: 'PramaanSetu platform highlights' })
  await carousel.waitFor()
  assert.equal(await carousel.locator('.hero-carousel-slide').count(), 5)
  assert.equal(await carousel.getByRole('button', { name: /^Go to slide/ }).count(), 5)
  assert.equal(await carousel.locator('.hero-carousel-caption').count(), 0)
  assert.equal(await activeIndex(carousel), 1)
  const dimensions = await carousel.locator('img').evaluateAll(images =>
    images.map(image => ({ complete: image.complete, width: image.naturalWidth })),
  )
  assert.ok(dimensions.every(image => image.complete && image.width > 0))
  const presentation = await carousel.evaluate(element => {
    const style = getComputedStyle(element)
    const imageStyle = getComputedStyle(element.querySelector('img'))
    return {
      radius: style.borderRadius,
      shadow: style.boxShadow,
      fit: imageStyle.objectFit,
      filter: imageStyle.filter,
    }
  })
  assert.equal(presentation.radius, '0px')
  assert.equal(presentation.shadow, 'none')
  assert.equal(presentation.fit, 'cover')
  assert.match(presentation.filter, /brightness\(1\.08\).*saturate\(0\.8\)/)
  log('five local images render as a full-width, filtered background without card styling')

  const fixedHeading = await headingPosition(page)
  await carousel.getByRole('button', { name: 'Next slide' }).click()
  assert.equal(await activeIndex(carousel), 2)
  assertFixed(await headingPosition(page), fixedHeading)
  await carousel.getByRole('button', { name: 'Go to slide 5' }).click()
  assert.equal(await activeIndex(carousel), 5)
  await carousel.getByRole('button', { name: 'Next slide' }).click()
  assert.equal(await activeIndex(carousel), 1)
  await carousel.getByRole('button', { name: 'Previous slide' }).click()
  assert.equal(await activeIndex(carousel), 5)
  assertFixed(await headingPosition(page), fixedHeading)
  log('controls loop while foreground content remains fixed')

  await carousel.getByRole('button', { name: 'Go to slide 1' }).click()
  await carousel.hover()
  await page.waitForTimeout(4800)
  assert.equal(await activeIndex(carousel), 1)
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
  await page.mouse.move(1, 1)
  await page.waitForFunction(() => document.querySelector('.hero-carousel-pagination [aria-current="true"]')?.getAttribute('aria-label') === 'Go to slide 2', null, { timeout: 6000 })
  log('autoplay pauses on hover and resumes after pointer exit')

  const nextButton = carousel.getByRole('button', { name: 'Next slide' })
  await nextButton.focus()
  const focusedIndex = await activeIndex(carousel)
  await page.waitForTimeout(4800)
  assert.equal(await activeIndex(carousel), focusedIndex)
  await page.keyboard.press('ArrowLeft')
  assert.notEqual(await activeIndex(carousel), focusedIndex)
  log('focus pauses autoplay and keyboard navigation works')

  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const box = await carousel.boundingBox()
    assert.ok(box && Math.abs(box.x) <= 1 && Math.abs(box.width - width) <= 1, `${width}px bounds: ${JSON.stringify(box)}`)
    for (let slide = 1; slide <= 5; slide += 1) {
      await carousel.getByRole('button', { name: `Go to slide ${slide}` }).click()
      assert.equal(await activeIndex(carousel), slide)
      const slideBox = await carousel.locator('.hero-carousel-slide.is-active').boundingBox()
      assert.ok(slideBox && Math.abs(slideBox.width - box.width) <= 1 && Math.abs(slideBox.height - box.height) <= 1)
    }
  }
  log('all five backgrounds fill the hero at 1440, 1280, 768, and 390px without overflow')

  await carousel.getByRole('button', { name: 'Access Portal' }).click()
  await page.waitForURL('**/select-role')
  await page.goBack()
  await page.getByRole('link', { name: 'Explore Services' }).click()
  assert.equal(new URL(page.url()).hash, '#services')
  log('existing Access Portal and Explore Services behavior is preserved')
  assert.deepEqual(errors, [])
  await context.close()

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const reducedPage = await reducedContext.newPage()
  await reducedPage.goto(base)
  await reducedPage.waitForLoadState('networkidle')
  const reducedCarousel = reducedPage.getByRole('region', { name: 'PramaanSetu platform highlights' })
  await reducedPage.waitForTimeout(4800)
  assert.equal(await activeIndex(reducedCarousel), 1)
  await reducedCarousel.getByRole('button', { name: 'Next slide' }).click()
  assert.equal(await activeIndex(reducedCarousel), 2)
  log('reduced-motion disables autoplay while preserving manual controls')
  await reducedContext.close()

  const fallbackContext = await browser.newContext()
  await fallbackContext.route('**/assets/carousel/document-verification.webp', route => route.abort())
  const fallbackPage = await fallbackContext.newPage()
  await fallbackPage.goto(base)
  await fallbackPage.locator('.hero-carousel-fallback').waitFor()
  log('failed background requests render the navy fallback')
  await fallbackContext.close()

  console.log('ALL FULL-WIDTH HERO CAROUSEL CHECKS PASSED')
} finally {
  await browser.close()
}
