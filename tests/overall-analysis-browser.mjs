import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()

const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(msg.text())
  }
})

const base = 'http://127.0.0.1:5173'

try {
  console.log('1. Navigating to home and starting Officer Demo...')
  await page.goto(base)
  await page.waitForLoadState('networkidle')

  // Click explore officer demo
  await page.getByRole('button', { name: 'Explore Officer Demo' }).click()
  await page.waitForURL('**/officer/dashboard')
  await page.waitForLoadState('networkidle')

  console.log('2. Verifying existing Officer Dashboard elements remain intact...')
  // Header
  await page.getByRole('heading', { name: 'Officer Dashboard', exact: true }).waitFor()
  // Scope callout
  await page.getByText('Scrutiny Committee Scope:').waitFor()
  // Summary cards
  await page.getByText('Pending Reviews').waitFor()
  await page.getByText('Flagged Applications').waitFor()
  await page.getByText('Completed Reviews').waitFor()
  // Active review queue
  await page.getByRole('heading', { name: 'Active Review Queue', exact: true }).waitFor()
  // Bottom status distribution & activity log
  await page.getByRole('heading', { name: 'Scrutiny Activity Log', exact: true }).waitFor()

  console.log('3. Verifying Overall Data Analysis section is present...')
  const section = page.locator('.gov-analytics-section')
  await section.waitFor()
  await page.getByRole('heading', { name: 'Overall Data Analysis', exact: true }).waitFor()
  await page.getByText('Application, document, verification and compliance insights').waitFor()
  await page.getByText('Demo Data', { exact: true }).waitFor()

  console.log('4. Verifying Top 4 KPI Cards...')
  await page.getByText('Total Applications').waitFor()
  await page.getByText('Documents Analysed').waitFor()
  await page.getByText('Verified Documents').waitFor()
  await page.getByText('Issues Detected').waitFor()

  console.log('5. Verifying Circular Graphs (Donuts)...')
  await page.getByRole('heading', { name: 'Application Status', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Document Verification', exact: true }).waitFor()

  console.log('6. Verifying Horizontal Bar Graphs...')
  await page.getByRole('heading', { name: 'Applications by Category', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Top Validation Findings', exact: true }).waitFor()
  await page.getByText('Extension of Approval').waitFor()

  console.log('7. Verifying Verification Source Status & Compliance...')
  await page.getByRole('heading', { name: 'Verification Source Status', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Compliance Overview', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Review Processing Trend', exact: true }).waitFor()

  console.log('8. Verifying Key Insights Panel...')
  await page.getByRole('heading', { name: 'Key Insights', exact: true }).waitFor()
  await page.getByText('Most Common Issue').waitFor()
  await page.getByText('Highest Flagged Category').waitFor()
  await page.getByText('Documents Requiring Manual Review').waitFor()

  console.log('9. Testing Interactive Filtering: Clicking Flagged in Application Status donut...')
  const initialRowCount = await page.locator('.gov-data-table tbody tr').count()
  console.log(`Initial review queue rows: ${initialRowCount}`)

  // Click "Flagged" in Application Status legend
  const flaggedItem = page.locator('.gov-donut-legend-item').filter({ hasText: 'Flagged' }).first()
  await flaggedItem.click()
  await page.waitForTimeout(300)

  // Verify Filtered by indicator appears with Clear Filters button
  await page.getByText('Filtered by: Flagged').waitFor()
  await page.getByRole('button', { name: 'Clear Filters' }).waitFor()

  const filteredRowCount = await page.locator('.gov-data-table tbody tr').count()
  console.log(`Filtered review queue rows: ${filteredRowCount}`)

  // Clear filters
  await page.getByRole('button', { name: 'Clear Filters' }).click()
  await page.waitForTimeout(300)
  const restoredRowCount = await page.locator('.gov-data-table tbody tr').count()
  console.log(`Restored review queue rows: ${restoredRowCount}`)
  if (restoredRowCount !== initialRowCount) {
    throw new Error(`Queue row count not restored: expected ${initialRowCount}, got ${restoredRowCount}`)
  }

  console.log('10. Testing Responsive Widths (1440, 1280, 1024, 768, 390)...')
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.waitForTimeout(200)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    if (overflow) {
      throw new Error(`Horizontal overflow detected at ${width}px!`)
    }
    console.log(`  ✓ ${width}px: clean responsive layout, no horizontal overflow`)
  }

  if (errors.length > 0) {
    throw new Error(`Console/Page errors encountered: ${JSON.stringify(errors)}`)
  }

  console.log('ALL OVERALL DATA ANALYSIS VERIFICATION CHECKS PASSED!')
} finally {
  await browser.close()
}
