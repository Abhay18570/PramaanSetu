import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || '@playwright/test'
)
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
page.setDefaultTimeout(10000)
page.on('dialog', (dialog) => dialog.accept())
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
)
const file = (name) => ({ name, mimeType: 'image/png', buffer: png })
const go = async (path) => {
  await page.goto(base + path)
  await page.waitForLoadState('networkidle')
}
const click = (name) => page.getByRole('button', { name, exact: true }).click()
const log = (text) => console.log('PASS ' + text)
const records = () =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('pramaansetu_applications_v1')).data,
  )
const blobs = () =>
  page.evaluate(async () =>
    (
      await import('/src/storage/documentBlobRepository.ts')
    ).documentBlobRepository.keys(),
  )
async function logout() {
  await click('User profile options')
  await page
    .locator('#gov-header-profile-popover')
    .getByRole('button', { name: 'Sign Out', exact: true })
    .click()
  await page.waitForURL('**/login')
}
async function login(email, role) {
  await go('/login')
  await page.locator('#email').fill(email)
  await click('Find Local Account')
  await click('Continue to Local Workspace')
  await page.waitForURL('**/' + role + '/dashboard')
  await page.locator('.gov-stat-value').first().waitFor()
}
async function register(role, email) {
  await go('/register?role=' + role)
  for (const [id, value] of Object.entries(
    role === 'INSTITUTION'
      ? {
          institutionName: 'Sample Institute',
          name: 'Sample Coordinator',
          email,
          phone: '9000000000',
          state: 'Maharashtra',
          city: 'Pune',
        }
      : { name: 'Sample Reviewer', email, department: 'Review Unit' },
  ))
    await page.locator('#' + id).fill(value)
  await click('Create Local Account')
  await page.waitForURL('**/' + role.toLowerCase() + '/dashboard')
}
async function upload(category, name = category + '.png') {
  await page.locator('#document-category').selectOption(category)
  await page
    .getByLabel('Browse files', { exact: true })
    .setInputFiles(file(name))
  await page.getByText(name + ' ·', { exact: false }).waitFor()
  await page
    .getByText('Document saved in this browser.', { exact: true })
    .waitFor()
}
try {
  await register('INSTITUTION', 'institution@example.test')
  await go('/institution/applications/new')
  await page.waitForURL('**/edit')
  const id = (await records())[0].id
  await click('Save Draft')
  await page.getByText('Draft saved.', { exact: true }).waitFor()
  assert.equal((await records())[0].status, 'DRAFT')
  await click('Continue')
  await page
    .getByRole('alert')
    .filter({ hasText: 'Check the highlighted fields' })
    .waitFor()
  await page
    .locator('[id="institutionDetails.institutionType"]')
    .selectOption('Engineering College')
  await page
    .locator('[id="institutionDetails.address"]')
    .fill('Sample Campus, Pune')
  await page.locator('[id="institutionDetails.pincode"]').fill('411001')
  await click('Save & Exit')
  await page.waitForURL('**/institution/applications')
  await page.reload()
  await page.getByRole('link', { name: 'Resume Draft', exact: true }).click()
  assert.equal(
    await page.locator('[id="institutionDetails.address"]').inputValue(),
    'Sample Campus, Pune',
  )
  await page
    .locator('[id="institutionDetails.address"]')
    .fill('Updated Sample Campus, Pune')
  await click('Continue')
  await page.locator('#academicYear').fill('2026-2027')
  await click('Continue')
  await click('Continue')
  await page
    .getByRole('alert')
    .filter({ hasText: 'Complete the required document checklist' })
    .waitFor()
  log(
    'create, incomplete save, resume, edit, field validation and required document validation',
  )
  await page.getByLabel('Browse files', { exact: true }).setInputFiles({
    name: 'invalid.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('sample'),
  })
  await page.getByRole('alert').filter({ hasText: 'Only PDF' }).waitFor()
  await page.getByLabel('Browse files', { exact: true }).setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  })
  await page.getByRole('alert').filter({ hasText: '10 MB' }).waitFor()
  const drop = await page.evaluateHandle(
    (bytes) => {
      const transfer = new DataTransfer()
      transfer.items.add(
        new File([new Uint8Array(bytes)], 'APPROVAL_LETTER.png', {
          type: 'image/png',
        }),
      )
      return transfer
    },
    [...png],
  )
  await page
    .locator('.document-dropzone')
    .dispatchEvent('drop', { dataTransfer: drop })
  await drop.dispose()
  await page
    .getByText('Document saved in this browser.', { exact: true })
    .waitFor()
  assert.equal((await blobs()).length, 1)
  await page.reload()
  await page.getByText('APPROVAL_LETTER.png ·', { exact: false }).waitFor()
  await page
    .getByRole('button', { name: 'Preview', exact: true })
    .first()
    .click()
  await page.getByRole('dialog', { name: 'Document preview' }).waitFor()
  await click('Close')
  const download = page.waitForEvent('download')
  await click('Download')
  assert.equal((await download).suggestedFilename(), 'APPROVAL_LETTER.png')
  await page
    .getByLabel('Replace Existing Approval Letter')
    .setInputFiles(file('replacement.png'))
  await page.getByText('replacement.png ·', { exact: false }).waitFor()
  assert.equal((await blobs()).length, 1)
  await click('Remove')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm Action' })
    .click()
  await page.getByText('Document removed.', { exact: true }).waitFor()
  assert.equal((await blobs()).length, 0)
  for (const category of [
    'APPROVAL_LETTER',
    'REGISTRATION',
    'AFFILIATION',
    'LAND_BUILDING',
    'FIRE_SAFETY',
  ])
    await upload(category)
  await click('Save Draft')
  await page.getByText('Draft saved.', { exact: true }).waitFor()
  await page.reload()
  assert.equal((await blobs()).length, 5)
  log(
    'unsupported and oversized rejection; real IndexedDB upload, refresh, preview, download, replacement and removal',
  )
  // Exercise partial persistence failure and a missing actual blob using the same production services.
  const recovery = await page.evaluate(async () => {
    const { applicationService: a } =
      await import('/src/applications/service.ts')
    const { documentService: d } = await import('/src/documents/service.ts')
    const { documentBlobRepository: b } =
      await import('/src/storage/documentBlobRepository.ts')
    const { documentMetadataRepository: m } =
      await import('/src/storage/documentMetadataRepository.ts')
    const { userRepository: u } = await import('/src/storage/userRepository.ts')
    const user = u.list()[0],
      app = JSON.parse(localStorage.getItem('pramaansetu_applications_v1'))
        .data[0]
    const record = m.forApplication(app.id)[0],
      original = await b.get(record.storageKey)
    await b.remove(record.storageKey)
    let missing = false
    try {
      await a.submit(user, app.id, true)
    } catch (e) {
      missing = e.message.includes('required documents')
    }
    await b.put(record.storageKey, original)
    const before = await b.keys(),
      set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'pramaansetu_documents_v1')
        throw new DOMException('full', 'QuotaExceededError')
      return set.call(this, key, value)
    }
    let failed = false
    try {
      await d.upload(
        user,
        app.id,
        'FACULTY',
        new File([original], 'sample.png', { type: 'image/png' }),
      )
    } catch {
      failed = true
    } finally {
      Storage.prototype.setItem = set
    }
    return {
      missing,
      failed,
      before: before.length,
      after: (await b.keys()).length,
      metadata: m.forApplication(app.id).length,
    }
  })
  assert.deepEqual(recovery, {
    missing: true,
    failed: true,
    before: 5,
    after: 5,
    metadata: 5,
  })
  assert.match(
    await page.evaluate(async () => {
      const { documentBlobRepository: b } =
        await import('/src/storage/documentBlobRepository.ts')
      const original = IDBFactory.prototype.open
      IDBFactory.prototype.open = function () {
        throw new DOMException('blocked', 'SecurityError')
      }
      try {
        await b.keys()
        return ''
      } catch (error) {
        return error.message
      } finally {
        IDBFactory.prototype.open = original
      }
    }),
    /storage is unavailable/,
  )
  log(
    'missing blob blocks submission and metadata quota failure rolls back new blob',
  )
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    )
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      'wizard overflow ' +
        width +
        ' ' +
        JSON.stringify(
          await page.evaluate(() =>
            [...document.querySelectorAll('body *')]
              .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
              .map((e) => [
                e.tagName,
                e.className,
                e.getBoundingClientRect().width,
                e.getBoundingClientRect().x,
              ])
              .slice(0, 15),
          ),
        ),
    )
  }
  await mkdir('/tmp/pramaansetu-module03', { recursive: true })
  await page.screenshot({
    path: '/tmp/pramaansetu-module03/wizard-mobile.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await click('Continue')
  await page.getByLabel(/I confirm that these are sample documents/).check()
  await click('Submit Application')
  await page.waitForURL('**/institution/applications/' + id)
  assert.equal((await records())[0].status, 'SUBMITTED')
  const locks = await page.evaluate(async (id) => {
    const { applicationService: a } =
      await import('/src/applications/service.ts')
    const { applicationRepository: r } =
      await import('/src/storage/applicationRepository.ts')
    const { userRepository: u } = await import('/src/storage/userRepository.ts')
    const user = u.list()[0]
    let submit = false,
      edit = false
    try {
      await a.submit(user, id, true)
    } catch {
      submit = true
    }
    try {
      await a.save(user, r.find(id))
    } catch {
      edit = true
    }
    return { submit, edit }
  }, id)
  assert.deepEqual(locks, { submit: true, edit: true })
  await go('/institution/applications/new')
  await page.waitForURL('**/edit')
  const draftId = (await records()).find((app) => app.status === 'DRAFT').id
  await logout()
  await register('INSTITUTION', 'other@example.test')
  await go('/institution/applications')
  assert.equal(await page.locator('.gov-data-table tbody tr').count(), 0)
  await go('/institution/applications/' + id)
  await page.getByRole('heading', { name: 'Application unavailable' }).waitFor()
  await logout()
  await register('OFFICER', 'officer@example.test')
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of [
      '/officer/review-queue',
      '/officer/applications/' + id,
    ]) {
      await go(path)
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        'officer overflow ' + width,
      )
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({
    path: '/tmp/pramaansetu-module03/officer-desktop.png',
    fullPage: true,
  })
  await go('/officer/review-queue')
  assert.equal(await page.locator('.gov-data-table tbody tr').count(), 1)
  await go('/officer/applications/' + draftId)
  await page.getByRole('heading', { name: 'Application unavailable' }).waitFor()
  await go('/officer/review-queue')
  await page
    .getByRole('link', { name: 'View Application', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Preview', exact: true })
    .first()
    .click()
  await page.getByRole('dialog', { name: 'Document preview' }).waitFor()
  await click('Close')
  await click('Start Review')
  await page
    .locator('.gov-status-badge')
    .filter({ hasText: 'Under Review' })
    .waitFor()
  await go('/officer/dashboard')
  assert.equal(await page.locator('.gov-stat-value').first().innerText(), '0')
  await logout()
  await login('institution@example.test', 'institution')
  assert.deepEqual(await page.locator('.gov-stat-value').allTextContents(), [
    '2',
    '1',
    '0',
    '0',
  ])
  await go('/institution/applications/' + id)
  await page
    .locator('.gov-status-badge')
    .filter({ hasText: 'Under Review' })
    .waitFor()
  log(
    'valid submit, duplicate/edit guards, account isolation, officer draft exclusion, review action, institution status and live counts',
  )
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    )
    for (const path of [
      '/institution/applications/' + id,
      '/institution/applications',
    ]) {
      await go(path)
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        'layout overflow ' + width + ' ' + path,
      )
    }
  }
  await page.screenshot({
    path: '/tmp/pramaansetu-module03/applications-mobile.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  // Real-file cleanup for draft deletion and account removal.
  const cleanup = await page.evaluate(async () => {
    const { applicationService: a } =
      await import('/src/applications/service.ts')
    const { documentService: d } = await import('/src/documents/service.ts')
    const { documentBlobRepository: b } =
      await import('/src/storage/documentBlobRepository.ts')
    const { userRepository: u } = await import('/src/storage/userRepository.ts')
    const { localAccountService: auth } = await import('/src/auth/service.ts')
    const owner = u.list()[0],
      other = u.list()[1],
      blob = await b.get((await b.keys())[0])
    const draft = await a.create(owner)
    await d.upload(
      owner,
      draft.id,
      'FACULTY',
      new File([blob], 'sample.png', { type: 'image/png' }),
    )
    const before = (await b.keys()).length
    await a.deleteDraft(owner, draft.id)
    const after = (await b.keys()).length
    const otherDraft = await a.create(other)
    await d.upload(
      other,
      otherDraft.id,
      'FACULTY',
      new File([blob], 'sample.png', { type: 'image/png' }),
    )
    await auth.deleteAccount(other.id)
    return { before, after, afterAccount: (await b.keys()).length }
  })
  assert.deepEqual(cleanup, { before: 6, after: 5, afterAccount: 5 })
  await login('institution@example.test', 'institution')
  await go('/institution/profile')
  await page.evaluate(() => localStorage.setItem('unrelated-data', 'keep'))
  await click('Clear All Prototype Data')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm Action' })
    .click()
  await page.waitForURL('**/login')
  assert.equal((await blobs()).length, 0)
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem('pramaansetu_applications_v1'),
    ),
    null,
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem('unrelated-data')),
    'keep',
  )
  log(
    'draft/account deletion and full reset clean up actual blobs, preserving unrelated storage; four responsive widths',
  )
  assert.deepEqual(errors, [])
  console.log('ALL MODULE 03 BROWSER CHECKS PASSED')
} catch (error) {
  await page.screenshot({
    path: '/tmp/pramaansetu-module03-failure.png',
    fullPage: true,
  })
  throw error
} finally {
  await browser.close()
}
