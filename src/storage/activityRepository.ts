import { activitySchema } from './models.ts'
import type { Activity } from './models.ts'
import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
export const activityRepository = {
  list() {
    return readRecords(storageKeys.activity, activitySchema)
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
    writeRecords(storageKeys.activity, activitySchema, [...this.list(), valid])
    return valid
  },
  removeForUser(userId: string) {
    writeRecords(
      storageKeys.activity,
      activitySchema,
      this.list().filter((event) => event.userId !== userId),
    )
  },
}
