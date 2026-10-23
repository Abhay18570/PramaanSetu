import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  analysisReportRepository,
  isAnalysisReportStale,
} from '../src/storage/analysisReportRepository.ts'
import { verificationReportSchema } from '../src/analysis/model.ts'
import { storageKeys } from '../src/storage/localStorage.ts'

class MemoryStorage {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}
let memory: MemoryStorage
beforeEach(() => {
  memory = new MemoryStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
  })
})
const report = {
  reportId: 'r1',
  applicationId: 'a1',
  generatedAt: '2026-01-01T00:00:00Z',
  engineVersion: '1.0.0',
  overallStatus: 'REVIEW_REQUIRED' as const,
  documentsAnalyzed: 1,
  documentsFailed: 0,
  findings: [],
  extractedFields: [],
  comparisons: [],
  processingWarnings: [],
  documentResults: [
    {
      documentId: 'd1',
      documentType: 'REGISTRATION',
      fileName: 'sample.pdf',
      extractionMethod: 'PDF_TEXT' as const,
      classification: 'CONSISTENT' as const,
      pagesProcessed: 1,
      readable: true,
      warnings: [],
      fingerprint: {
        documentId: 'd1',
        fileName: 'sample.pdf',
        sha256: 'a'.repeat(64),
        fileSize: 10,
        processedAt: '2026-01-01T00:00:00Z',
      },
    },
  ],
}
const document = {
  id: 'd1',
  applicationId: 'a1',
  documentType: 'REGISTRATION',
  fileName: 'sample.pdf',
  mimeType: 'application/pdf' as const,
  fileSize: 10,
  uploadedAt: '2026-01-01T00:00:00Z',
  storageKey: 's1',
}

test('validates, persists and restores compact reports', () => {
  assert.equal(verificationReportSchema.parse(report).reportId, 'r1')
  analysisReportRepository.save({
    ...report,
    documentVersions: [{ documentId: 'd1', storageKey: 's1' }],
  })
  assert.equal(analysisReportRepository.latest('a1')?.reportId, 'r1')
  assert.ok(memory.getItem(storageKeys.analysisReports))
})
test('marks reports stale when document IDs or blob versions change', () => {
  const saved = {
    ...report,
    documentVersions: [{ documentId: 'd1', storageKey: 's1' }],
  }
  assert.equal(isAnalysisReportStale(saved, [document]), false)
  assert.equal(
    isAnalysisReportStale(saved, [{ ...document, storageKey: 's2' }]),
    true,
  )
  assert.equal(isAnalysisReportStale(saved, []), true)
})
test('rejects invalid API-shaped reports rather than persisting them', () => {
  assert.equal(
    verificationReportSchema.safeParse({ ...report, overallStatus: 'APPROVED' })
      .success,
    false,
  )
  assert.equal(analysisReportRepository.list().length, 0)
})
