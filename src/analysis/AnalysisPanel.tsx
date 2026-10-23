import { useMemo, useState } from 'react'
import type { ApplicationRecord } from '../applications/model'
import type { User } from '../storage/models'
import {
  analysisReportRepository,
  isAnalysisReportStale,
} from '../storage/analysisReportRepository'
import { documentMetadataRepository } from '../storage/documentMetadataRepository'
import { activityRepository } from '../storage/activityRepository'
import { runAnalysis } from './api'
import type { SavedReport } from './model'
import EvidencePreview from './EvidencePreview'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../i18n'

const labels = {
  NO_ISSUES_DETECTED: 'No Issues Detected',
  REVIEW_REQUIRED: 'Review Required',
  INCOMPLETE_ANALYSIS: 'Incomplete Analysis',
  ANALYSIS_FAILED: 'Analysis Failed',
}
export default function AnalysisPanel({
  application,
  user,
}: {
  application: ApplicationRecord
  user: User
}) {
  useTranslation()
  const [report, setReport] = useState<SavedReport | null>(() =>
    analysisReportRepository.latest(application.id),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('')
  const [severity, setSeverity] = useState('ALL')
  const [documentFilter, setDocumentFilter] = useState('ALL')
  const metadata = documentMetadataRepository.forApplication(application.id)
  const stale = isAnalysisReportStale(report, metadata)
  const findings = useMemo(
    () =>
      report?.findings.filter(
        (item) =>
          (severity === 'ALL' || item.severity === severity) &&
          (documentFilter === 'ALL' || item.documentId === documentFilter),
      ) ?? [],
    [report, severity, documentFilter],
  )
  async function analyze() {
    setBusy(true)
    setError('')
    setPhase('Preparing documents')
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      setPhase('Analyzing documents')
      const result = await runAnalysis(user, application)
      setPhase('Processing results')
      const saved = analysisReportRepository.save({
        ...result.report,
        documentVersions: result.documentVersions,
      })
      activityRepository.add({
        userId: application.userId,
        actorUserId: user.id,
        applicationId: application.id,
        kind: 'APPLICATION_UPDATED',
        action: 'DOCUMENT_ANALYSIS_RUN',
        message: `Document analysis completed: ${labels[saved.overallStatus]}`,
      })
      setReport(saved)
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError'))
        setError(
          err instanceof Error
            ? err.message
            : 'Analysis could not be completed.',
        )
    } finally {
      setBusy(false)
      setPhase('')
    }
  }
  return (
    <section className="gov-card application-panel analysis-panel">
      <div className="analysis-heading">
        <div>
          <h2>Document Analysis</h2>
          <p className="application-note">
            Automated extraction and comparison signals for human review. This
            is not an authenticity certificate, regulatory decision, or
            approval.
          </p>
        </div>
        {user.role === 'OFFICER' && application.status === 'UNDER_REVIEW' && (
          <button
            type="button"
            className="gov-btn gov-btn-primary"
            disabled={busy}
            onClick={() => void analyze()}
          >
            {busy ? phase : 'Run Document Analysis'}
          </button>
        )}
      </div>
      {user.role === 'OFFICER' &&
        application.status !== 'UNDER_REVIEW' &&
        !report && (
          <p className="application-note">
            Start Review before running document analysis.
          </p>
        )}
      {error && (
        <p className="gov-form-error" role="alert">
          {error}
        </p>
      )}
      {stale && (
        <p className="analysis-warning" role="alert">
          This report is stale because the stored document set changed. Run
          analysis again before relying on it.
        </p>
      )}
      {!report ? (
        <div className="gov-empty-state">
          <h3>No analysis report yet</h3>
          <p>
            An officer must explicitly run analysis while the local Python
            service is available.
          </p>
        </div>
      ) : (
        <>
          <div className="analysis-summary">
            <div>
              <span>Analysis status</span>
              <strong
                className={`analysis-status analysis-${report.overallStatus.toLowerCase()}`}
              >
                {labels[report.overallStatus]}
              </strong>
            </div>
            <div>
              <span>Last analyzed</span>
              <strong>{formatDate(report.generatedAt)}</strong>
            </div>
            <div>
              <span>Documents</span>
              <strong>
                {report.documentsAnalyzed} processed · {report.documentsFailed}{' '}
                failed
              </strong>
            </div>
            <div>
              <span>Engine</span>
              <strong>{report.engineVersion}</strong>
            </div>
          </div>
          <section className="analysis-section">
            <h3>Documents Processed & File Fingerprints</h3>
            <div className="analysis-document-grid">
              {report.documentResults.map((result) => (
                <article key={result.documentId}>
                  <strong>{result.fileName}</strong>
                  <dl>
                    <div>
                      <dt>Method</dt>
                      <dd>{result.extractionMethod}</dd>
                    </div>
                    <div>
                      <dt>Category check</dt>
                      <dd>{result.classification.replaceAll('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt>Pages</dt>
                      <dd>{result.pagesProcessed}</dd>
                    </div>
                  </dl>
                  <code title={result.fingerprint.sha256}>
                    {result.fingerprint.sha256}
                  </code>
                  <p>
                    File fingerprint generated. This does not establish
                    authenticity.
                  </p>
                  <EvidencePreview
                    applicationId={application.id}
                    documentId={result.documentId}
                  />
                </article>
              ))}
            </div>
          </section>
          <section className="analysis-section">
            <h3>Extracted Information</h3>
            {report.extractedFields.length ? (
              <div className="analysis-table-wrap">
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Extracted value</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.extractedFields.map((field, index) => (
                      <tr
                        key={`${field.sourceDocumentId}-${field.fieldName}-${index}`}
                      >
                        <td>{field.fieldName}</td>
                        <td>
                          {field.value || 'Not found'}
                          {field.evidenceText && (
                            <small>{field.evidenceText}</small>
                          )}
                        </td>
                        <td>
                          <EvidencePreview
                            applicationId={application.id}
                            documentId={field.sourceDocumentId}
                            pageNumber={field.pageNumber}
                            findingId={`comparison:${field.fieldName}`}
                            label={
                              field.pageNumber
                                ? `Page ${field.pageNumber}`
                                : 'Open'
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No structured fields were extracted.</p>
            )}
          </section>
          <section className="analysis-section">
            <h3>Application Field Comparisons</h3>
            <div className="analysis-table-wrap">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Result</th>
                    <th>Expected</th>
                    <th>Observed</th>
                  </tr>
                </thead>
                <tbody>
                  {report.comparisons.map((item) => (
                    <tr key={item.fieldName}>
                      <td>{item.fieldName}</td>
                      <td>
                        <span
                          className={`comparison comparison-${item.status.toLowerCase()}`}
                        >
                          {item.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td>{item.expectedValue || 'Not entered'}</td>
                      <td>{item.observedValue || 'Not found'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="analysis-section">
            <div className="analysis-filter-header">
              <h3>Detected Inconsistencies & Review Signals</h3>
              <div>
                <select
                  aria-label="Filter findings by severity"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                >
                  <option value="ALL">All severities</option>
                  <option>HIGH</option>
                  <option>WARNING</option>
                  <option>INFO</option>
                </select>
                <select
                  aria-label="Filter findings by document"
                  value={documentFilter}
                  onChange={(event) => setDocumentFilter(event.target.value)}
                >
                  <option value="ALL">All documents</option>
                  {report.documentResults.map((item) => (
                    <option key={item.documentId} value={item.documentId}>
                      {item.fileName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {findings.length ? (
              <div className="analysis-findings">
                {findings.map((item) => (
                  <article key={item.id}>
                    <span
                      className={`finding-severity severity-${item.severity.toLowerCase()}`}
                    >
                      {item.severity}
                    </span>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    {item.expectedValue && (
                      <p>
                        <strong>Expected:</strong> {item.expectedValue}
                      </p>
                    )}
                    {item.observedValue && (
                      <p>
                        <strong>Observed:</strong> {item.observedValue}
                      </p>
                    )}
                    {item.evidenceText && (
                      <blockquote>{item.evidenceText}</blockquote>
                    )}
                    <p>
                      <strong>Reviewer action:</strong> {item.recommendation}
                    </p>
                    {item.documentId && (
                      <EvidencePreview
                        applicationId={application.id}
                        documentId={item.documentId}
                        pageNumber={item.pageNumber}
                        findingId={item.id}
                      />
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p>No findings match the selected filters.</p>
            )}
          </section>
          <section className="analysis-section">
            <h3>Processing Warnings</h3>
            {report.processingWarnings.length ? (
              <ul>
                {report.processingWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p>No processing warnings were reported.</p>
            )}
          </section>
        </>
      )}
    </section>
  )
}
