import { activitySchema } from './models.ts'
import type { Activity } from './models.ts'
import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
import { isDemoSession, readDemoCollection, writeDemoCollection } from '../demo/storage.ts'
function write(records: Activity[]) {
  const valid = activitySchema.array().parse(records)
  if (isDemoSession()) writeDemoCollection('activity', valid)
  else writeRecords(storageKeys.activity, activitySchema, valid)
}
export const activityRepository = {
  list() {
    return isDemoSession() ? readDemoCollection<Activity>('activity') : readRecords(storageKeys.activity, activitySchema)
  },
  forUser(userId: string) {
    return this.list()
      .filter((event) => event.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  forApplication(applicationId: string) {
    return this.list()
      .filter((event) => event.applicationId === applicationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  add(event: Omit<Activity, 'id' | 'createdAt'>) {
    const valid = activitySchema.parse({
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
    write([...this.list(), valid])
    return valid
  },
  removeForUser(userId: string) {
    write(
      this.list().filter((event) => event.userId !== userId),
    )
  },
}
