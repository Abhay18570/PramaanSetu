import { z } from 'zod'
import { applicationRepository } from '../storage/applicationRepository.ts'
import { userRepository } from '../storage/userRepository.ts'
import { documentMetadataRepository } from '../storage/documentMetadataRepository.ts'
import { withStorageLock } from '../storage/documentBlobRepository.ts'
import {
  readValue,
  storageKeys,
  transaction,
  writeValue,
} from '../storage/localStorage.ts'
import {
  collectOrphans,
  documentService,
  getApplication,
  recordActivity,
} from '../documents/service.ts'
import { applicationType } from './config.ts'
import { emptyDetails, emptyInstitution, validateApplication } from './model.ts'
import type { ApplicationRecord } from './model.ts'
import type { User } from '../storage/models.ts'
import { analysisReportRepository } from '../storage/analysisReportRepository.ts'
import { complianceRepository, reviewRepository } from '../storage/complianceRepository.ts'
import { isDemoSession, readDemoNumber, writeDemoNumber } from '../demo/storage.ts'
export const applicationService = {
  async create(user: User) {
    return withStorageLock(async () => {
      if (user.role !== 'INSTITUTION' || (!user.isDemo && !userRepository.findById(user.id)))
        throw new Error('An institution account is required.')
      return transaction(() => {
        const year = new Date().getFullYear()
        const demo = isDemoSession()
        const sequence = demo ? null : readValue(
          storageKeys.sequence,
          z.object({ version: z.literal(1), next: z.number().int().positive() }),
          { version: 1, next: 1 },
        )
        let number = demo ? readDemoNumber('nextApplicationSequence', 1) : sequence!.next
        const refs = new Set(
          applicationRepository.list().map((item) => item.referenceNumber),
        )
        while (refs.has(`PS-${year}-${String(number).padStart(6, '0')}`))
          number++
        if (demo) writeDemoNumber('nextApplicationSequence', number + 1)
        else writeValue(storageKeys.sequence, { version: 1, next: number + 1 })
        const now = new Date().toISOString()
        const id = crypto.randomUUID()
        const app = applicationRepository.save({
          id,
          userId: user.id,
          institutionUserId: user.id,
          referenceNumber: `PS-${year}-${String(number).padStart(6, '0')}`,
          institutionName: user.institutionName || '',
          type: applicationType.name,
          applicationType: applicationType.id,
          academicYear: '',
          institutionDetails: emptyInstitution(user),
          applicationDetails: emptyDetails(),
          documentIds: [],
          status: 'DRAFT',
          createdAt: now,
          updatedAt: now,
          currentStep: 1,
          revision: 0,
          statusHistory: [
            { status: 'DRAFT', timestamp: now, actorUserId: user.id },
          ],
        })
        recordActivity(user, id, 'APPLICATION_CREATED', 'Application created')
        return app
      })
    })
  },
  async save(user: User, input: ApplicationRecord) {
    return withStorageLock(async () =>
      transaction(() => {
        const current = getApplication(user, input.id, true)
        if (current.revision !== input.revision)
          throw new Error(
            'This draft changed in another tab. Your input is kept here; reload to get the latest saved version before editing again.',
          )
        const next = applicationRepository.save({
          ...current,
          institutionName: input.institutionDetails.institutionName,
          type: applicationType.name,
          applicationType: input.applicationType,
          academicYear: input.academicYear,
          institutionDetails: input.institutionDetails,
          applicationDetails: input.applicationDetails,
          currentStep: input.currentStep,
          revision: current.revision + 1,
          updatedAt: new Date().toISOString(),
        })
        recordActivity(user, input.id, 'DRAFT_SAVED', 'Draft saved')
        return next
      }),
    )
  },
  async submit(user: User, id: string, declaration: boolean) {
    return withStorageLock(async () => {
      const app = getApplication(user, id, true)
      if (!declaration) throw new Error('Confirm the submission declaration.')
      const fields = validateApplication(app)
      if (Object.keys(fields).length)
        throw new Error(
          'Complete required institution and application fields before submitting.',
        )
      const documents = await documentService.checkRequired(user, id)
      if (Object.keys(documents).length)
        throw new Error(
          'Upload all required documents and replace any missing files before submitting.',
        )
      getApplication(user, id, true)
      return transaction(() => {
        const now = new Date().toISOString()
        const next = applicationRepository.save({
          ...app,
          status: 'SUBMITTED',
          submittedAt: now,
          updatedAt: now,
          revision: app.revision + 1,
          statusHistory: [
            ...app.statusHistory,
            { status: 'SUBMITTED', timestamp: now, actorUserId: user.id },
          ],
        })
        recordActivity(
          user,
          id,
          'APPLICATION_SUBMITTED',
          'Application submitted',
        )
        return next
      })
    })
  },
  async startReview(user: User, id: string) {
    return withStorageLock(async () =>
      transaction(() => {
        const app = getApplication(user, id)
        if (user.role !== 'OFFICER' || app.status !== 'SUBMITTED')
          throw new Error('Only a submitted application can start review.')
        const now = new Date().toISOString()
        const next = applicationRepository.save({
          ...app,
          status: 'UNDER_REVIEW',
          updatedAt: now,
          revision: app.revision + 1,
          statusHistory: [
            ...app.statusHistory,
            { status: 'UNDER_REVIEW', timestamp: now, actorUserId: user.id },
          ],
        })
        recordActivity(user, id, 'REVIEW_STARTED', 'Officer started review')
        return next
      }),
    )
  },
  async deleteDraft(user: User, id: string) {
    return withStorageLock(async () => {
      getApplication(user, id, true)
      transaction(() => {
        recordActivity(user, id, 'DRAFT_DELETED', 'Draft deleted')
        documentMetadataRepository.removeApplications([id])
        analysisReportRepository.removeApplications([id])
        complianceRepository.removeApplications([id])
        reviewRepository.removeApplications([id])
        applicationRepository.remove(id)
      })
      return collectOrphans()
    })
  },
}
