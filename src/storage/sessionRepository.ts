import { sessionSchema } from './models.ts'
import { readRaw, removeValue, storageKeys, writeValue } from './localStorage.ts'
import { userRepository } from './userRepository.ts'
import { demoUser } from '../demo/service.ts'
export const sessionRepository = {
  restore() {
    const raw = readRaw(storageKeys.session)
    if (!raw) return null
    let session
    try { session = sessionSchema.parse(JSON.parse(raw)) } catch { removeValue(storageKeys.session); return null }
    if(session.isDemo&&session.demoRole)return demoUser(session.demoRole)
    const user = userRepository.findById(session.userId)
    if (!user) removeValue(storageKeys.session)
    return user
  },
  start(userId: string) {
    if (!userRepository.findById(userId)) throw new Error('This local account no longer exists. Create an account to continue.')
    writeValue(storageKeys.session, sessionSchema.parse({ userId, createdAt: new Date().toISOString(), sessionVersion: 1 }))
  },
  clear() { removeValue(storageKeys.session) },
}
