import { z } from 'zod'
import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
import { isDemoSession, readDemoCollection, writeDemoCollection } from '../demo/storage.ts'
function write(records: DocumentMetadata[]) {
  const valid = documentMetadataSchema.array().parse(records)
  if (isDemoSession()) writeDemoCollection('documents', valid)
  else writeRecords(storageKeys.documents, documentMetadataSchema, valid)
}
export interface DocumentMetadata {
  id: string
  applicationId: string
  documentType: string
  fileName: string
  mimeType: string
  fileSize: number
  uploadedAt: string
  storageKey: string
}
export const documentMetadataSchema: z.ZodType<DocumentMetadata> = z.object({
  id: z.uuid(),
  applicationId: z.uuid(),
  documentType: z.string(),
  fileName: z.string().max(255),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  fileSize: z.number().nonnegative(),
  uploadedAt: z.iso.datetime(),
  storageKey: z.uuid(),
})
export const documentMetadataRepository = {
  list() {
    if (isDemoSession()) return readDemoCollection<DocumentMetadata>('documents')
    return readRecords(storageKeys.documents, documentMetadataSchema)
  },
  forApplication(id: string) {
    return this.list().filter((item) => item.applicationId === id)
  },
  save(record: DocumentMetadata) {
    write([
      ...this.list().filter((item) => item.id !== record.id),
      record,
    ])
  },
  remove(id: string) {
    write(
      this.list().filter((item) => item.id !== id),
    )
  },
  removeApplications(ids: string[]) {
    write(
      this.list().filter((item) => !ids.includes(item.applicationId)),
    )
  },
}
