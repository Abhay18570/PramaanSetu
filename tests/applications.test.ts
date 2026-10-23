import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { localAccountService } from '../src/auth/service.ts'
import { accountFields } from '../src/auth/model.ts'
import { applicationService } from '../src/applications/service.ts'
import { applicationRepository } from '../src/storage/applicationRepository.ts'
import { validateApplication } from '../src/applications/model.ts'
import { validateFile } from '../src/documents/validation.ts'
import { getApplication } from '../src/documents/service.ts'
import { storageKeys } from '../src/storage/localStorage.ts'
class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}
let memory: MemoryStorage
beforeEach(() => {
  memory = new MemoryStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
  })
})
const register = (email = 'sample@example.test') =>
  localAccountService.register({
    ...accountFields(),
    role: 'INSTITUTION',
    institutionName: 'Sample Institute',
    name: 'Sample Coordinator',
    email,
    phone: '9000000000',
    state: 'Maharashtra',
    city: 'Pune',
  })
test('creates unique UUID drafts and references, persists incomplete edits and detects stale writes', async () => {
  const user = await register(),
    one = await applicationService.create(user),
    two = await applicationService.create(user)
  assert.notEqual(one.id, two.id)
  assert.notEqual(one.referenceNumber, two.referenceNumber)
  assert.match(one.referenceNumber, /^PS-\d{4}-\d{6}$/)
  const saved = await applicationService.save(user, {
    ...one,
    institutionDetails: {
      ...one.institutionDetails,
      address: 'Sample address',
    },
  })
  assert.equal(
    applicationRepository.find(one.id)?.institutionDetails.address,
    'Sample address',
  )
  assert.equal(saved.status, 'DRAFT')
  await assert.rejects(
    applicationService.save(user, one),
    /changed in another tab/,
  )
  await assert.rejects(
    applicationService.submit(user, one.id, true),
    /required institution/,
  )
  assert.equal(applicationRepository.find(one.id)?.status, 'DRAFT')
})
test('ownership, deleted account and workflow restrictions apply to service calls', async () => {
  const user = await register(),
    other = await register('other@example.test'),
    app = await applicationService.create(user)
  assert.throws(() => getApplication(other, app.id), /unavailable/)
  assert.throws(() => getApplication(user, 'invalid-id'), /unavailable/)
  applicationRepository.save({ ...app, status: 'SUBMITTED' })
  await assert.rejects(applicationService.save(user, app), /drafts/)
  await assert.rejects(applicationService.submit(user, app.id, true), /drafts/)
  await assert.rejects(
    applicationService.startReview(user, app.id),
    /submitted application/,
  )
  await localAccountService.deleteAccount(user.id)
  assert.throws(() => getApplication(user, app.id), /no longer exists/)
})
test('legacy records hydrate without rewriting stored v1 data', async () => {
  const user = await register(),
    now = new Date().toISOString()
  const raw = JSON.stringify({
    version: 1,
    data: [
      {
        id: crypto.randomUUID(),
        userId: user.id,
        institutionName: 'Sample',
        type: 'Annual Extension',
        status: 'DRAFT',
        createdAt: now,
        updatedAt: now,
      },
    ],
  })
  memory.setItem(storageKeys.applications, raw)
  const record = applicationRepository.list()[0]
  assert.equal(record.documentIds.length, 0)
  assert.deepEqual(record.statusHistory, [])
  assert.equal(memory.getItem(storageKeys.applications), raw)
})
test('academic year, PIN and intake validation reject invalid values', async () => {
  const user = await register(),
    record = await applicationService.create(user)
  record.academicYear = '2026-2028'
  record.institutionDetails.pincode = '000000'
  record.applicationDetails.proposedIntake = -1
  const errors = validateApplication(record)
  assert.ok(errors.academicYear)
  assert.ok(errors['institutionDetails.pincode'])
  assert.ok(errors['applicationDetails.proposedIntake'])
})
test('signature validation accepts PDF, PNG and JPEG; rejects MIME spoofing, empty and oversized files', async () => {
  assert.equal(
    await validateFile(
      new File(['%PDF-1.4 sample'], 'sample.pdf', { type: 'application/pdf' }),
    ),
    'application/pdf',
  )
  assert.equal(
    await validateFile(
      new File([new Uint8Array([255, 216, 255, 224])], 'sample.jpg', {
        type: 'image/jpeg',
      }),
    ),
    'image/jpeg',
  )
  assert.equal(
    await validateFile(
      new File(
        [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
        'sample.png',
        { type: 'image/png' },
      ),
    ),
    'image/png',
  )
  await assert.rejects(
    validateFile(new File(['fake'], 'sample.png', { type: 'image/png' })),
  )
  await assert.rejects(
    validateFile(new File([], 'empty.pdf', { type: 'application/pdf' })),
  )
  await assert.rejects(
    validateFile(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf', {
        type: 'application/pdf',
      }),
    ),
    /10 MB/,
  )
})
test('failed draft writes roll back sequence and application records', async () => {
  const user = await register(),
    set = memory.setItem.bind(memory)
  memory.setItem = (key, value) => {
    if (key === storageKeys.applications) throw new Error('full')
    set(key, value)
  }
  await assert.rejects(applicationService.create(user), /Could not save/)
  assert.equal(memory.getItem(storageKeys.applications), null)
  assert.equal(memory.getItem(storageKeys.sequence), null)
})
