import { hydrateApplication } from '../applications/model.ts'
import { applicationSchema } from './models.ts'
import type { Application, User } from './models.ts'
import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
export const applicationRepository = {
  list() {
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
    writeRecords(
      storageKeys.applications,
      applicationSchema,
      this.list().filter((record) => record.id !== id),
    )
  },
  save(application: Application) {
    const valid = applicationSchema.parse(application)
    writeRecords(storageKeys.applications, applicationSchema, [
      ...this.list().filter((record) => record.id !== valid.id),
      valid,
    ])
    return hydrateApplication(valid)
  },
  removeForUser(userId: string) {
    writeRecords(
      storageKeys.applications,
      applicationSchema,
      this.list().filter((record) => record.userId !== userId),
    )
  },
}
