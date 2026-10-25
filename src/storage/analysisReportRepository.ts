import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
import { savedReportSchema } from '../analysis/model.ts'
import type { SavedReport } from '../analysis/model.ts'
import type { DocumentMetadata } from './documentMetadataRepository.ts'
import { isDemoSession, readDemoCollection, writeDemoCollection } from '../demo/storage.ts'
function write(reports: SavedReport[]) {
  const valid = savedReportSchema.array().parse(reports)
  if (isDemoSession()) writeDemoCollection('reports', valid)
  else writeRecords(storageKeys.analysisReports, savedReportSchema, valid)
}

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
    if (isDemoSession()) return readDemoCollection<SavedReport>('reports')
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
    write([
      ...this.list().filter(
        (item) => item.applicationId !== report.applicationId,
      ),
      report,
    ])
    return report
  },
  removeApplications(ids: string[]) {
    write(
      this.list().filter((item) => !ids.includes(item.applicationId)),
    )
  },
}
