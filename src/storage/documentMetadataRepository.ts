import { z } from 'zod'
import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
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
const schema: z.ZodType<DocumentMetadata> = z.object({
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
    return readRecords(storageKeys.documents, schema)
  },
  forApplication(id: string) {
    return this.list().filter((item) => item.applicationId === id)
  },
  save(record: DocumentMetadata) {
    writeRecords(storageKeys.documents, schema, [
      ...this.list().filter((item) => item.id !== record.id),
      record,
    ])
  },
  remove(id: string) {
    writeRecords(
      storageKeys.documents,
      schema,
      this.list().filter((item) => item.id !== id),
    )
  },
  removeApplications(ids: string[]) {
    writeRecords(
      storageKeys.documents,
      schema,
      this.list().filter((item) => !ids.includes(item.applicationId)),
    )
  },
}
