import {
  documentBlobRepository,
  withStorageLock,
} from '../storage/documentBlobRepository.ts'
import { documentMetadataRepository } from '../storage/documentMetadataRepository.ts'
import { applicationRepository } from '../storage/applicationRepository.ts'
import { activityRepository } from '../storage/activityRepository.ts'
import { transaction } from '../storage/localStorage.ts'
import { userRepository } from '../storage/userRepository.ts'
import type { User } from '../storage/models.ts'
import { documentCategories } from '../applications/config.ts'
import { validateFile } from './validation.ts'
import { isDemoSession } from '../demo/storage.ts'
export function getApplication(user: User, id: string, editable = false) {
  if (!user.isDemo && !userRepository.findById(user.id))
    throw new Error('This local account no longer exists.')
  const record = applicationRepository.find(id)
  if (
    !record ||
    (user.role === 'INSTITUTION'
      ? record.userId !== user.id
      : record.status === 'DRAFT')
  )
    throw new Error('Application not found or unavailable to this account.')
  if (editable && (user.role !== 'INSTITUTION' || record.status !== 'DRAFT'))
    throw new Error('Only institution drafts can be edited.')
  return record
}
export function recordActivity(
  user: User,
  applicationId: string,
  action: string,
  message: string,
) {
  const record = applicationRepository.find(applicationId)
  activityRepository.add({
    userId: record?.userId ?? user.id,
    actorUserId: user.id,
    applicationId,
    kind: 'APPLICATION_UPDATED',
    action,
    message: message.slice(0, 200),
  })
}
// Metadata is the source of truth. Interrupted uploads/deletions leave unreferenced
// blobs, which are safely collected on the next document operation or page visit.
export async function collectOrphans(): Promise<string> {
  if (isDemoSession()) return ''
  try {
    const keep = new Set(
      documentMetadataRepository.list().map((item) => item.storageKey),
    )
    for (const key of await documentBlobRepository.keys())
      if (!keep.has(key)) await documentBlobRepository.remove(key)
    return ''
  } catch {
    return 'File cleanup is pending. Reopen Documents to retry; referenced files have been kept.'
  }
}
export const documentService = {
  async upload(
    user: User,
    applicationId: string,
    documentType: string,
    file: File,
  ) {
    const mimeType = await validateFile(file)
    return withStorageLock(async () => {
      const application = getApplication(user, applicationId, true)
      if (!documentCategories.some((category) => category.id === documentType))
        throw new Error('Choose a document type.')
      const old = documentMetadataRepository
        .forApplication(applicationId)
        .find((item) => item.documentType === documentType)
      const record = {
        id: crypto.randomUUID(),
        applicationId,
        documentType,
        fileName: file.name,
        mimeType,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        storageKey: crypto.randomUUID(),
      }
      await documentBlobRepository.put(
        record.storageKey,
        new Blob([file], { type: mimeType }),
      )
      try {
        transaction(() => {
          getApplication(user, applicationId, true)
          if (old) documentMetadataRepository.remove(old.id)
          documentMetadataRepository.save(record)
          applicationRepository.save({
            ...application,
            documentIds: [
              ...application.documentIds.filter((id) => id !== old?.id),
              record.id,
            ],
            updatedAt: record.uploadedAt,
            revision: application.revision + 1,
          })
          recordActivity(
            user,
            applicationId,
            old ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED',
            `${old ? 'Document replaced' : 'Document uploaded'}: ${documentCategories.find((c) => c.id === documentType)?.label}`,
          )
        })
      } catch (error) {
        try {
          await documentBlobRepository.remove(record.storageKey)
        } catch {
          /* Next collection retries the orphan. */
        }
        throw error
      }
      return { record, warning: await collectOrphans() }
    })
  },
  async remove(user: User, applicationId: string, id: string) {
    return withStorageLock(async () => {
      const app = getApplication(user, applicationId, true)
      const record = documentMetadataRepository
        .forApplication(applicationId)
        .find((item) => item.id === id)
      if (!record) throw new Error('Document no longer exists.')
      transaction(() => {
        documentMetadataRepository.remove(id)
        applicationRepository.save({
          ...app,
          documentIds: app.documentIds.filter((item) => item !== id),
          updatedAt: new Date().toISOString(),
          revision: app.revision + 1,
        })
        recordActivity(
          user,
          applicationId,
          'DOCUMENT_REMOVED',
          `Document removed: ${record.fileName}`,
        )
      })
      return collectOrphans()
    })
  },
  async read(user: User, applicationId: string, id: string) {
    getApplication(user, applicationId)
    const record = documentMetadataRepository
      .forApplication(applicationId)
      .find((item) => item.id === id)
    if (!record) throw new Error('Document metadata is missing.')
    const blob = await documentBlobRepository.get(record.storageKey)
    if (!blob)
      throw new Error(
        'This file is missing from browser storage. Replace it in the draft before submitting.',
      )
    return { record, blob }
  },
  async checkRequired(user: User, applicationId: string) {
    getApplication(user, applicationId)
    const records = documentMetadataRepository.forApplication(applicationId)
    const errors: Record<string, string> = {}
    for (const category of documentCategories) {
      const record = records.find((item) => item.documentType === category.id)
      if (!record) {
        if (category.required)
          errors[category.id] = 'Upload the required document.'
      } else if (!(await documentBlobRepository.get(record.storageKey)))
        errors[category.id] = 'Stored file is missing. Replace this document.'
    }
    return errors
  },
  async recover() {
    return withStorageLock(collectOrphans)
  },
}
