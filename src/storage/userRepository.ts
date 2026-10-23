import { normalizedEmail, userSchema } from './models.ts'
import type { User } from './models.ts'
import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
export const userRepository = {
  list() {
    const users = readRecords(storageKeys.users, userSchema)
    if (new Set(users.map(user => user.id)).size !== users.length || new Set(users.map(user => user.email)).size !== users.length) throw new Error('Stored accounts contain duplicate identifiers. Clear local prototype data to start again.')
    return users
  },
  findById(id: string) { return this.list().find(user => user.id === id) ?? null },
  findByEmail(email: string) { const normalized = normalizedEmail.parse(email); return this.list().find(user => user.email === normalized) ?? null },
  save(user: User) {
    const valid = userSchema.parse(user)
    const users = this.list()
    if (users.some(item => item.email === valid.email && item.id !== valid.id)) throw new Error('An account with this email already exists in this browser. Use another email or sign in.')
    const existing = users.find(item => item.id === valid.id)
    if (existing && (existing.role !== valid.role || existing.createdAt !== valid.createdAt)) throw new Error('Account role and creation date cannot be changed.')
    writeRecords(storageKeys.users, userSchema, [...users.filter(item => item.id !== valid.id), valid])
    return valid
  },
  remove(id: string) { writeRecords(storageKeys.users, userSchema, this.list().filter(user => user.id !== id)) },
}
