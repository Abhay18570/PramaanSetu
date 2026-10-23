import assert from 'node:assert/strict'
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || '@playwright/test'
)
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173'

function pdf(lines) {
  const escaped = lines.map((line) =>
    line.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)'),
  )
  const stream = `BT\n/F1 10 Tf\n72 760 Td\n${escaped.map((line, index) => `${index ? '0 -18 Td\n' : ''}(${line}) Tj`).join('\n')}\nET`
  const objects = [
    null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let output = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(output)
    output += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = Buffer.byteLength(output)
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i++)
    output += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(output)
}
const bytes = pdf([
  'Institution Name: Apex Institute of Technology',
  'Registration Number: REG-2026-101',
  'Academic Year: 2026-2027',
  'Address: Sample Campus Pune',
  'PIN Code: 411001',
  'Phone: 9000000000',
  'Institution Registration Certificate',
])
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const ids = {
  institution: '11111111-1111-4111-8111-111111111111',
  officer: '22222222-2222-4222-8222-222222222222',
  application: '33333333-3333-4333-8333-333333333333',
  document: '44444444-4444-4444-8444-444444444444',
  storage: '55555555-5555-4555-8555-555555555555',
}
async function seed() {
  await page.goto(base)
  await page.evaluate(
    async ({ ids, bytes }) => {
      const now = new Date().toISOString()
      const institution = {
        id: ids.institution,
        name: 'Sample Coordinator',
        email: 'institution@example.test',
        role: 'INSTITUTION',
        institutionName: 'Different Institute',
        phone: '9000000000',
        state: 'Maharashtra',
        city: 'Pune',
        createdAt: now,
        updatedAt: now,
      }
      const officer = {
        id: ids.officer,
        name: 'Sample Reviewer',
        email: 'officer@example.test',
        role: 'OFFICER',
        department: 'Review Unit',
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem(
        'pramaansetu_users_v1',
        JSON.stringify({ version: 1, data: [institution, officer] }),
      )
      localStorage.setItem(
        'pramaansetu_session_v1',
        JSON.stringify({
          userId: officer.id,
          createdAt: now,
          sessionVersion: 1,
        }),
      )
      localStorage.setItem(
        'pramaansetu_activity_v1',
        JSON.stringify({ version: 1, data: [] }),
      )
      localStorage.setItem(
        'pramaansetu_applications_v1',
        JSON.stringify({
          version: 1,
          data: [
            {
              id: ids.application,
              userId: institution.id,
              institutionUserId: institution.id,
              referenceNumber: 'PS-2026-000001',
              institutionName: 'Different Institute',
              type: 'Extension of Approval — Institutional Application',
              applicationType: 'EXTENSION_OF_APPROVAL',
              academicYear: '2026-2027',
              institutionDetails: {
                institutionName: 'Different Institute',
                institutionType: 'Engineering College',
                contactPerson: 'Sample Coordinator',
                email: 'institution@example.test',
                phone: '9000000000',
                state: 'Maharashtra',
                city: 'Pune',
                address: 'Sample Campus Pune',
                pincode: '411001',
              },
              applicationDetails: {
                approvalType: 'EXTENSION_OF_APPROVAL',
                institutionCode: '',
                universityAffiliation: '',
                establishmentYear: '2020',
                existingApprovalReference: '',
                remarks: '',
              },
              documentIds: [ids.document],
              status: 'UNDER_REVIEW',
              createdAt: now,
              updatedAt: now,
              submittedAt: now,
              currentStep: 4,
              revision: 1,
              statusHistory: [
                { status: 'DRAFT', timestamp: now },
                { status: 'SUBMITTED', timestamp: now },
                {
                  status: 'UNDER_REVIEW',
                  timestamp: now,
                  actorUserId: officer.id,
                },
              ],
            },
          ],
        }),
      )
      localStorage.setItem(
        'pramaansetu_documents_v1',
        JSON.stringify({
          version: 1,
          data: [
            {
              id: ids.document,
              applicationId: ids.application,
              documentType: 'REGISTRATION',
              fileName: 'synthetic-registration.pdf',
              mimeType: 'application/pdf',
              fileSize: bytes.length,
              uploadedAt: now,
              storageKey: ids.storage,
            },
          ],
        }),
      )
      const { documentBlobRepository } =
        await import('/src/storage/documentBlobRepository.ts')
      await documentBlobRepository.put(
        ids.storage,
        new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
      )
    },
    { ids, bytes: [...bytes] },
  )
}
try {
  await seed()
  await page.goto(`${base}/officer/applications/${ids.application}`)
  await page.getByRole('heading', { name: 'Document Analysis' }).waitFor()
  await page.getByRole('button', { name: 'Run Document Analysis' }).click()
  await page
    .getByText('Review Required', { exact: true })
    .waitFor({ timeout: 20000 })
  await page.getByText('institutionName differs', { exact: true }).waitFor()
  assert.match(
    await page.locator('.analysis-document-grid code').innerText(),
    /^[a-f0-9]{64}$/,
  )
  assert.ok(
    (await page
      .locator('.analysis-table tbody')
      .first()
      .getByText('Apex Institute of Technology', { exact: false })
      .count()) > 0,
  )
  await page
    .getByRole('button', { name: 'Open source', exact: true })
    .first()
    .click()
  await page.getByRole('dialog', { name: 'Analysis evidence source' }).waitFor()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  console.log(
    'PASS actual PDF extraction, mismatch, fingerprint, report display and evidence preview',
  )
  await page.reload()
  await page.getByText('Review Required', { exact: true }).waitFor()
  assert.ok(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('pramaansetu_analysis_reports_v1')).data
          .length === 1,
    ),
  )
  console.log('PASS report persistence after refresh')
  await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('pramaansetu_documents_v1'))
    value.data[0].storageKey = '66666666-6666-4666-8666-666666666666'
    localStorage.setItem('pramaansetu_documents_v1', JSON.stringify(value))
  })
  await page.reload()
  await page.getByText(/report is stale/i).waitFor()
  console.log('PASS stale report detection')
  await page.evaluate(
    async ({ ids, bytes }) => {
      const value = JSON.parse(localStorage.getItem('pramaansetu_documents_v1'))
      value.data[0].storageKey = ids.storage
      localStorage.setItem('pramaansetu_documents_v1', JSON.stringify(value))
      const { documentBlobRepository } =
        await import('/src/storage/documentBlobRepository.ts')
      await documentBlobRepository.put(
        ids.storage,
        new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
      )
      const apps = JSON.parse(
        localStorage.getItem('pramaansetu_applications_v1'),
      )
      apps.data[0].institutionDetails.institutionName =
        'Apex Institute of Technology'
      apps.data[0].institutionName = 'Apex Institute of Technology'
      localStorage.setItem('pramaansetu_applications_v1', JSON.stringify(apps))
    },
    { ids, bytes: [...bytes] },
  )
  await page.reload()
  const response = page.waitForResponse((value) =>
    value.url().endsWith('/api/verification/analyze'),
  )
  await page.getByRole('button', { name: 'Run Document Analysis' }).click()
  assert.equal((await response).status(), 200)
  await page
    .getByText('No Issues Detected', { exact: true })
    .waitFor({ timeout: 20000 })
  const matching = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem('pramaansetu_analysis_reports_v1'),
      ).data.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0],
  )
  assert.equal(matching.overallStatus, 'NO_ISSUES_DETECTED')
  console.log('PASS matching-document scenario')
  await page.route('http://127.0.0.1:8000/**', (route) => route.abort())
  await page.getByRole('button', { name: 'Run Document Analysis' }).click()
  await page
    .getByRole('alert')
    .filter({ hasText: 'Verification service is unavailable' })
    .waitFor()
  console.log('PASS actionable backend unavailable state without mock fallback')
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.reload()
    await page.getByRole('heading', { name: 'Document Analysis' }).waitFor()
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter(
          (element) => element.getBoundingClientRect().right > innerWidth + 1,
        )
        .map((element) => [
          element.tagName,
          element.className,
          element.getBoundingClientRect().x,
          element.getBoundingClientRect().width,
        ])
        .slice(0, 12),
    )
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `analysis overflow ${width}: ${JSON.stringify(overflow)}`,
    )
  }
  await page.unrouteAll()
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.screenshot({
    path: '/tmp/pramaansetu-module04-mobile.png',
    fullPage: true,
  })
  assert.deepEqual(errors, [])
  console.log('ALL MODULE 04 BROWSER CHECKS PASSED')
} finally {
  await browser.close()
}
