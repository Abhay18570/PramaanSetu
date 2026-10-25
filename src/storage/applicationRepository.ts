import { hydrateApplication } from '../applications/model.ts'
import { applicationSchema } from './models.ts'
import type { Application, User } from './models.ts'
import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
import { isDemoSession, readDemoCollection, writeDemoCollection } from '../demo/storage.ts'
function write(applications: Application[]) {
  const valid = applicationSchema.array().parse(applications)
  if (isDemoSession()) writeDemoCollection('applications', valid)
  else writeRecords(storageKeys.applications, applicationSchema, valid)
}
export const applicationRepository = {
  list() {
    if (isDemoSession()) return readDemoCollection<Application>('applications').map(hydrateApplication)
    return readRecords(storageKeys.applications, applicationSchema).map(
      hydrateApplication,
    )
  },
  forUser(user: User) {
    return this.list().filter((record) =>
      user.role === 'INSTITUTION'
        ? record.userId === user.id
        : record.status !== 'DRAFT',
    )
  },
  find(id: string) {
    return this.list().find((record) => record.id === id) ?? null
  },
  remove(id: string) {
    write(
      this.list().filter((record) => record.id !== id),
    )
  },
  save(application: Application) {
    const valid = applicationSchema.parse(application)
    write([
      ...this.list().filter((record) => record.id !== valid.id),
      valid,
    ])
    return hydrateApplication(valid)
  },
  removeForUser(userId: string) {
    write(
      this.list().filter((record) => record.userId !== userId),
    )
  },
}
