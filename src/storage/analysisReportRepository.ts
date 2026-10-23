import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
import { savedReportSchema } from '../analysis/model.ts'
import type { SavedReport } from '../analysis/model.ts'
import type { DocumentMetadata } from './documentMetadataRepository.ts'

export function isAnalysisReportStale(
  report: SavedReport | null,
  documents: DocumentMetadata[],
) {
  return (
    !!report &&
    (report.documentVersions.length !== documents.length ||
      report.documentVersions.some(
        (version) =>
          !documents.some(
            (item) =>
              item.id === version.documentId &&
              item.storageKey === version.storageKey,
          ),
      ))
  )
}

export const analysisReportRepository = {
  list() {
    return readRecords(storageKeys.analysisReports, savedReportSchema)
  },
  latest(applicationId: string) {
    return (
      this.list()
        .filter((item) => item.applicationId === applicationId)
        .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0] ?? null
    )
  },
  save(report: SavedReport) {
    writeRecords(storageKeys.analysisReports, savedReportSchema, [
      ...this.list().filter(
        (item) => item.applicationId !== report.applicationId,
      ),
      report,
    ])
    return report
  },
  removeApplications(ids: string[]) {
    writeRecords(
      storageKeys.analysisReports,
      savedReportSchema,
      this.list().filter((item) => !ids.includes(item.applicationId)),
    )
  },
}
