import {
  accountFields,
  profileFormSchema,
  registrationSchema,
} from './model.ts'
import type { AccountFields, Registration, User } from './model.ts'
import { userRepository } from '../storage/userRepository.ts'
import { sessionRepository } from '../storage/sessionRepository.ts'
import { activityRepository } from '../storage/activityRepository.ts'
import { applicationRepository } from '../storage/applicationRepository.ts'
import { withStorageLock } from '../storage/documentBlobRepository.ts'
import { documentMetadataRepository } from '../storage/documentMetadataRepository.ts'
import { collectOrphans } from '../documents/service.ts'
import { clearPrototypeData, transaction } from '../storage/localStorage.ts'
import { analysisReportRepository } from '../storage/analysisReportRepository.ts'
import { complianceRepository, reviewRepository } from '../storage/complianceRepository.ts'
// Replace this adapter with FastAPI services later. Email lookup is not authentication.
export interface AccountService {
  findAccount(email: string): Promise<User | null>
  signIn(userId: string): Promise<User>
  register(data: Registration): Promise<User>
  updateProfile(userId: string, data: AccountFields): Promise<User>
  signOut(): Promise<void>
  deleteAccount(userId: string): Promise<void>
  clearData(): Promise<void>
}
function roleFields(data: Registration) {
  return data.role === 'INSTITUTION'
    ? {
        institutionName: data.institutionName,
        phone: data.phone,
        state: data.state,
        city: data.city,
      }
    : { department: data.department }
}
export const localAccountService: AccountService = {
  async findAccount(email) {
    return userRepository.findByEmail(email)
  },
  async signIn(userId) {
    const user = userRepository.findById(userId)
    if (!user)
      throw new Error(
        'This local account no longer exists. Create an account to continue.',
      )
    sessionRepository.start(user.id)
    return user
  },
  async register(data) {
    const values = registrationSchema.parse(data)
    return transaction(() => {
      const now = new Date().toISOString()
      const user = userRepository.save({
        id: crypto.randomUUID(),
        name: values.name,
        email: values.email,
        role: values.role,
        ...roleFields(values),
        createdAt: now,
        updatedAt: now,
      })
      activityRepository.add({
        userId: user.id,
        kind: 'ACCOUNT_CREATED',
        message: 'Local account created',
      })
      sessionRepository.start(user.id)
      return user
    })
  },
  async updateProfile(userId, data) {
    const user = userRepository.findById(userId)
    if (!user) throw new Error('This local account no longer exists.')
    const values = profileFormSchema(user.role).parse(data)
    if (JSON.stringify(values) === JSON.stringify(accountFields(user)))
      return user
    return transaction(() => {
      const updated = userRepository.save({
        ...user,
        name: values.name,
        email: values.email,
        ...roleFields({ ...values, role: user.role }),
        updatedAt: new Date().toISOString(),
      })
      activityRepository.add({
        userId,
        kind: 'PROFILE_UPDATED',
        message: 'Profile updated',
      })
      return updated
    })
  },
  async signOut() {
    sessionRepository.clear()
  },
  async deleteAccount(userId) {
    await withStorageLock(async () => {
      transaction(() => {
        const ids = applicationRepository
          .list()
          .filter((item) => item.userId === userId)
          .map((item) => item.id)
        documentMetadataRepository.removeApplications(ids)
        analysisReportRepository.removeApplications(ids)
        complianceRepository.removeApplications(ids)
        reviewRepository.removeApplications(ids)
        userRepository.remove(userId)
        applicationRepository.removeForUser(userId)
        activityRepository.removeForUser(userId)
        sessionRepository.clear()
      })
      if (globalThis.indexedDB) await collectOrphans()
    })
  },
  async clearData() {
    await withStorageLock(async () => {
      clearPrototypeData()
      if (globalThis.indexedDB) await collectOrphans()
    })
  },
}
