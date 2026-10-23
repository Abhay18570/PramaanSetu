import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { localAccountService } from '../src/auth/service.ts'
import { accountFields, registrationSchema, routeAccess } from '../src/auth/model.ts'
import { userRepository } from '../src/storage/userRepository.ts'
import { sessionRepository } from '../src/storage/sessionRepository.ts'
import { applicationRepository } from '../src/storage/applicationRepository.ts'
import { activityRepository } from '../src/storage/activityRepository.ts'
import { clearPrototypeData, storageKeys } from '../src/storage/localStorage.ts'
import type { Application } from '../src/storage/models.ts'
class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
}
let memory: MemoryStorage
beforeEach(() => { memory = new MemoryStorage(); Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true }) })
const institution = { ...accountFields(), role: 'INSTITUTION' as const, institutionName: 'Local Institute', name: 'Local Coordinator', email: 'owner@example.test', phone: '9000000000', state: 'Maharashtra', city: 'Pune' }
const officer = { ...accountFields(), role: 'OFFICER' as const, name: 'Local Officer', email: 'reviewer@example.test', department: 'Review Unit' }
async function createInstitution(email = institution.email) { return localAccountService.register({ ...institution, email }) }
function application(userId: string, status: Application['status']): Application { const now = new Date().toISOString(); return { id: crypto.randomUUID(), userId, institutionName: 'Local Institute', type: 'Annual Extension', status, createdAt: now, updatedAt: now } }

test('registration stores normalized metadata and a minimal persistent session', async () => {
  const user = await createInstitution('  OWNER@EXAMPLE.TEST  ')
  assert.equal(user.email, 'owner@example.test'); assert.match(user.id, /^[0-9a-f-]{36}$/)
  assert.equal(userRepository.list().length, 1); assert.deepEqual(sessionRepository.restore(), user)
  assert.deepEqual(Object.keys(JSON.parse(memory.getItem(storageKeys.session)!)).sort(), ['createdAt', 'sessionVersion', 'userId'])
  assert.equal(activityRepository.forUser(user.id)[0].kind, 'ACCOUNT_CREATED')
  assert.deepEqual(applicationRepository.forUser(user), [])
  for (const raw of memory.data.values()) assert.doesNotMatch(raw, /password|token|hash/i)
})
test('logout preserves accounts and email lookup restores access without credentials', async () => {
  const user = await createInstitution(); await localAccountService.signOut()
  assert.equal(sessionRepository.restore(), null); assert.equal(userRepository.list().length, 1)
  assert.equal((await localAccountService.findAccount(' OWNER@example.test '))?.id, user.id)
  await localAccountService.signIn(user.id); assert.equal(sessionRepository.restore()?.id, user.id)
  assert.equal(await localAccountService.findAccount('missing@example.test'), null)
})
test('duplicates are rejected across roles without modifying an existing account or session', async () => {
  const user = await createInstitution()
  await assert.rejects(localAccountService.register({ ...officer, email: ' OWNER@EXAMPLE.TEST ' }), /already exists/)
  assert.equal(userRepository.list().length, 1); assert.equal(sessionRepository.restore()?.id, user.id)
})
test('institution and officer registrations validate their own required fields', () => {
  assert.equal(registrationSchema.safeParse(institution).success, true)
  assert.equal(registrationSchema.safeParse(officer).success, true)
  for (const change of [{name:''},{email:'bad'},{institutionName:''},{phone:'123'},{state:''},{city:''}]) assert.equal(registrationSchema.safeParse({...institution,...change}).success,false)
  assert.equal(registrationSchema.safeParse({...officer,department:''}).success,false)
})
test('role-based navigation remains a UI convenience', async () => {
  const user = await createInstitution(); const reviewer = await localAccountService.register(officer)
  assert.equal(routeAccess(null,'OFFICER'), '/login?role=OFFICER')
  assert.equal(routeAccess(user,'OFFICER'), '/institution/dashboard')
  assert.equal(routeAccess(reviewer,'INSTITUTION'), '/officer/dashboard')
  assert.equal(routeAccess(user,'INSTITUTION'),null)
})
test('ownership filtering excludes another institution and hides drafts from officers', async () => {
  const first = await createInstitution(); const second = await createInstitution('second@example.test'); const reviewer = await localAccountService.register(officer)
  const draft = application(first.id,'DRAFT'); const submitted = application(second.id,'SUBMITTED')
  applicationRepository.save(draft); applicationRepository.save(submitted)
  assert.deepEqual(applicationRepository.forUser(first).map(row=>row.id),[draft.id])
  assert.deepEqual(applicationRepository.forUser(second).map(row=>row.id),[submitted.id])
  assert.deepEqual(applicationRepository.forUser(reviewer).map(row=>row.id),[submitted.id])
})
test('profile changes persist, normalize email and keep it unique across local accounts', async () => {
  const first = await createInstitution(); await createInstitution('second@example.test')
  const updated = await localAccountService.updateProfile(first.id, {...accountFields(first), name:'Updated Person', email:' CHANGED@example.test '})
  assert.equal(userRepository.findById(first.id)?.name,'Updated Person'); assert.equal(updated.email,'changed@example.test')
  assert.equal(await localAccountService.findAccount(institution.email),null)
  await assert.rejects(localAccountService.updateProfile(first.id,{...accountFields(updated),email:'SECOND@example.test'}),/already exists/)
  assert.equal(userRepository.findById(first.id)?.email,'changed@example.test')
  assert.equal(activityRepository.forUser(first.id).length,2)
})
test('account deletion removes owned data and session while keeping other accounts', async () => {
  const first = await createInstitution(); const second = await createInstitution('second@example.test')
  applicationRepository.save(application(first.id,'DRAFT')); applicationRepository.save(application(second.id,'SUBMITTED'))
  await localAccountService.signIn(first.id); await localAccountService.deleteAccount(first.id)
  assert.equal(userRepository.findById(first.id),null); assert.equal(userRepository.list().length,1)
  assert.equal(applicationRepository.list().length,1); assert.equal(activityRepository.forUser(first.id).length,0); assert.equal(sessionRepository.restore(),null)
})
test('reset clears only versioned prototype keys', async () => {
  await createInstitution(); memory.setItem('unrelated-site-data','keep')
  clearPrototypeData()
  for(const key of Object.values(storageKeys)) assert.equal(memory.getItem(key),null)
  assert.equal(memory.getItem('unrelated-site-data'),'keep')
})
test('corrupt data is reported without overwriting it; malformed or orphaned sessions are removed', async () => {
  memory.setItem(storageKeys.users,'{broken')
  await assert.rejects(createInstitution(),/unreadable/)
  assert.equal(memory.getItem(storageKeys.users),'{broken')
  clearPrototypeData(); const user = await createInstitution()
  memory.setItem(storageKeys.session,'bad'); assert.equal(sessionRepository.restore(),null); assert.equal(memory.getItem(storageKeys.session),null)
  await localAccountService.signIn(user.id); memory.setItem(storageKeys.users,JSON.stringify({version:1,data:[]}))
  assert.equal(sessionRepository.restore(),null); assert.equal(memory.getItem(storageKeys.session),null)
})
test('unsupported versions and invalid application records are never silently accepted', () => {
  memory.setItem(storageKeys.applications,JSON.stringify({version:2,data:[]})); assert.throws(()=>applicationRepository.list(),/unreadable/)
  memory.setItem(storageKeys.applications,JSON.stringify({version:1,data:[{status:'APPROVED'}]})); assert.throws(()=>applicationRepository.list(),/unreadable/)
})
test('failed writes roll back registration rather than reporting success', async () => {
  const original = memory.setItem.bind(memory)
  memory.setItem = (key,value) => { if(key === storageKeys.activity) throw new Error('quota'); original(key,value) }
  await assert.rejects(createInstitution(),/Could not save/)
  assert.equal(memory.getItem(storageKeys.users),null); assert.equal(memory.getItem(storageKeys.session),null)
})
test('blocked browser storage reports an actionable error', async () => {
  Object.defineProperty(globalThis,'localStorage',{get(){throw new Error('blocked')},configurable:true})
  await assert.rejects(createInstitution(),/storage is unavailable/)
})
