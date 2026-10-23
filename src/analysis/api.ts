import type { ApplicationRecord } from '../applications/model'
import type { User } from '../storage/models'
import { documentMetadataRepository } from '../storage/documentMetadataRepository'
import { documentService } from '../documents/service'
import { verificationReportSchema } from './model'

const apiBase = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '')

export async function runAnalysis(
  user: User,
  application: ApplicationRecord,
  signal?: AbortSignal,
) {
  const records = documentMetadataRepository.forApplication(application.id)
  if (!records.length)
    throw new Error('No supporting documents are available for analysis.')
  const form = new FormData()
  form.append(
    'metadata',
    JSON.stringify({
      applicationId: application.id,
      institutionDetails: application.institutionDetails,
      applicationDetails: application.applicationDetails,
      academicYear: application.academicYear,
    }),
  )
  for (const record of records) {
    const { blob } = await documentService.read(user, application.id, record.id)
    form.append('document_ids', record.id)
    form.append('document_types', record.documentType)
    form.append('files', blob, record.fileName)
  }
  let response: Response
  try {
    response = await fetch(`${apiBase}/api/verification/analyze`, {
      method: 'POST',
      body: form,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    throw new Error(
      'Verification service is unavailable. Start the local backend and try again.',
    )
  }
  if (!response.ok) {
    let detail = 'Analysis request failed.'
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* response was not JSON */
    }
    throw new Error(detail)
  }
  const result = verificationReportSchema.safeParse(await response.json())
  if (!result.success)
    throw new Error(
      'The verification service returned an invalid report. Nothing was saved.',
    )
  return {
    report: result.data,
    documentVersions: records.map((item) => ({
      documentId: item.id,
      storageKey: item.storageKey,
    })),
  }
}
