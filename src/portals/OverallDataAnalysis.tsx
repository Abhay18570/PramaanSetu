import { useState } from 'react'
import type { Application } from './data'
import {
  FolderKanban,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileSearch,
  Scale,
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react'
import {
  computeOverallAnalytics,
} from './analyticsHelper'
import './overall-analysis.css'

interface OverallDataAnalysisProps {
  applications: Application[]
  selectedStatusFilter?: string
  onSelectStatusFilter?: (status: string) => void
}

export function OverallDataAnalysis({
  applications,
  selectedStatusFilter = 'All',
  onSelectStatusFilter,
}: OverallDataAnalysisProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)

  const analytics = computeOverallAnalytics(applications)
  const {
    isDemo,
    kpis,
    applicationStatuses,
    documentVerifications,
    categories,
    validationFindings,
    verificationSources,
    complianceOverview,
    processingTrend,
    keyInsights,
  } = analytics

  const handleStatusClick = (statusKey: string) => {
    if (!onSelectStatusFilter) return
    if (selectedStatusFilter === statusKey) {
      onSelectStatusFilter('All')
    } else {
      onSelectStatusFilter(statusKey)
    }
  }

  return (
    <section className="gov-analytics-section" aria-label="Overall Data Analysis">
      {/* SECTION HEADER */}
      <div className="gov-analytics-header">
        <div className="gov-analytics-title-group">
          <div className="gov-analytics-eyebrow">
            <Scale size={13} />
            <span>Regulatory Scrutiny Analytics</span>
          </div>
          <div className="gov-analytics-title-row">
            <h2>Overall Data Analysis</h2>
            {isDemo && (
              <span className="gov-demo-badge" title="Synthesized regulatory test dossier dataset">
                <span className="gov-demo-badge-dot" />
                Demo Data
              </span>
            )}
          </div>
          <p className="gov-analytics-subtitle">
            Application, document, verification and compliance insights
          </p>
        </div>

        {selectedStatusFilter !== 'All' && (
          <div className="gov-analytics-actions">
            <div className="gov-filter-indicator">
              <span>
                Filtered by:{' '}
                <strong>
                  {applicationStatuses.find((s) => s.key === selectedStatusFilter)?.label ||
                    selectedStatusFilter}
                </strong>
              </span>
              <button
                type="button"
                className="gov-clear-filter-btn"
                onClick={() => onSelectStatusFilter?.('All')}
                aria-label="Clear active review queue filter"
              >
                <RotateCcw size={12} />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. TOP KPI CARDS */}
      <div className="gov-analytics-kpi-grid">
        {/* Total Applications */}
        <article className="gov-analytics-kpi-card gov-kpi-navy">
          <div className="gov-analytics-kpi-header">
            <span className="gov-analytics-kpi-label">Total Applications</span>
            <div className="gov-analytics-kpi-icon">
              <FolderKanban size={18} />
            </div>
          </div>
          <div className="gov-analytics-kpi-body">
            <strong className="gov-analytics-kpi-value">{kpis.totalApplications}</strong>
            <span className="gov-analytics-kpi-subtext">Dossiers in Scope</span>
          </div>
          <div className="gov-analytics-kpi-bar" />
        </article>

        {/* Documents Analysed */}
        <article className="gov-analytics-kpi-card">
          <div className="gov-analytics-kpi-header">
            <span className="gov-analytics-kpi-label">Documents Analysed</span>
            <div className="gov-analytics-kpi-icon">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="gov-analytics-kpi-body">
            <strong className="gov-analytics-kpi-value">{kpis.documentsAnalysed}</strong>
            <span className="gov-analytics-kpi-subtext">Processed by OCR & Engine</span>
          </div>
          <div className="gov-analytics-kpi-bar" />
        </article>

        {/* Verified Documents */}
        <article className="gov-analytics-kpi-card gov-kpi-positive">
          <div className="gov-analytics-kpi-header">
            <span className="gov-analytics-kpi-label">Verified Documents</span>
            <div className="gov-analytics-kpi-icon">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="gov-analytics-kpi-body">
            <strong className="gov-analytics-kpi-value">{kpis.verifiedDocumentsCount}</strong>
            <span className="gov-analytics-kpi-subtext">({kpis.verifiedDocumentsPct}% Passed)</span>
          </div>
          <div className="gov-analytics-kpi-bar" />
        </article>

        {/* Issues Detected */}
        <article className="gov-analytics-kpi-card gov-kpi-issues">
          <div className="gov-analytics-kpi-header">
            <span className="gov-analytics-kpi-label">Issues Detected</span>
            <div className="gov-analytics-kpi-icon">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="gov-analytics-kpi-body">
            <strong className="gov-analytics-kpi-value">{kpis.issuesDetectedCount}</strong>
            <span className="gov-analytics-kpi-subtext">
              ({kpis.issuesDetectedPct}% Applications Flagged)
            </span>
          </div>
          <div className="gov-analytics-kpi-bar" />
        </article>
      </div>

      {/* 2 & 3. CIRCULAR GRAPHS — APPLICATION STATUS & DOCUMENT VERIFICATION */}
      <div className="gov-analytics-row-2col">
        {/* Circular Graph 1: Application Status */}
        <div className="gov-analytics-card">
          <div className="gov-analytics-card-header">
            <div className="gov-analytics-card-title-group">
              <h3>Application Status</h3>
              <span className="gov-analytics-badge">{kpis.totalApplications} Dossiers</span>
            </div>
            <span className="gov-analytics-card-hint">Click category to filter queue</span>
          </div>

          <div className="gov-donut-chart-container">
            <DonutChart
              items={applicationStatuses}
              totalCount={kpis.totalApplications}
              centerLabel="Dossiers"
              onSelect={handleStatusClick}
              selectedKey={selectedStatusFilter}
              hoveredSlice={hoveredSlice}
              setHoveredSlice={setHoveredSlice}
            />

            <ul className="gov-donut-legend" aria-label="Application Status Legend">
              {applicationStatuses.map((item) => {
                const isSelected = selectedStatusFilter === item.key
                return (
                  <li
                    key={item.key}
                    className={`gov-donut-legend-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleStatusClick(item.key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleStatusClick(item.key)
                    }}
                    title={`Click to filter queue by ${item.label}`}
                  >
                    <div className="gov-legend-indicator">
                      <span
                        className="gov-legend-color-box"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="gov-legend-text">{item.label}</span>
                    </div>
                    <span className="gov-legend-metric">
                      {item.count}{' '}
                      <span className="gov-legend-pct">({item.pct}%)</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Circular Graph 2: Document Verification */}
        <div className="gov-analytics-card">
          <div className="gov-analytics-card-header">
            <div className="gov-analytics-card-title-group">
              <h3>Document Verification</h3>
              <span className="gov-analytics-badge">{kpis.documentsAnalysed} Total</span>
            </div>
            <span className="gov-analytics-card-hint">Validation Engine Outcomes</span>
          </div>

          <div className="gov-donut-chart-container">
            <DonutChart
              items={documentVerifications}
              totalCount={kpis.documentsAnalysed}
              centerLabel="Documents"
              hoveredSlice={hoveredSlice}
              setHoveredSlice={setHoveredSlice}
            />

            <ul className="gov-donut-legend" aria-label="Document Verification Legend">
              {documentVerifications.map((item) => (
                <li key={item.key} className="gov-donut-legend-item">
                  <div className="gov-legend-indicator">
                    <span
                      className="gov-legend-color-box"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="gov-legend-text">{item.label}</span>
                  </div>
                  <span className="gov-legend-metric">
                    {item.count}{' '}
                    <span className="gov-legend-pct">({item.pct}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 4 & 5. HORIZONTAL BAR GRAPHS — CATEGORIES & FINDINGS */}
      <div className="gov-analytics-row-2col">
        {/* Horizontal Bar Graph 1: Application Categories */}
        <div className="gov-analytics-card">
          <div className="gov-analytics-card-header">
            <div className="gov-analytics-card-title-group">
              <h3>Applications by Category</h3>
              <span className="gov-analytics-badge">Regulatory Submissions</span>
            </div>
            <span className="gov-analytics-card-hint">Single Blue Primary Tone</span>
          </div>

          <div className="gov-hbar-list" role="list" aria-label="Applications by Category">
            {categories.map((cat) => (
              <div key={cat.category} className="gov-hbar-item" role="listitem">
                <div className="gov-hbar-meta">
                  <span className="gov-hbar-label">{cat.category}</span>
                  <span className="gov-hbar-count-badge">
                    {cat.count}{' '}
                    <span className="gov-hbar-count-pct">({cat.pct}%)</span>
                  </span>
                </div>
                <div className="gov-hbar-track">
                  <div
                    className="gov-hbar-fill"
                    style={{ width: `${Math.max(cat.barPct, cat.count > 0 ? 5 : 0)}%` }}
                    title={`${cat.category}: ${cat.count} applications (${cat.pct}%)`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal Bar Graph 2: Top Validation Findings */}
        <div className="gov-analytics-card">
          <div className="gov-analytics-card-header">
            <div className="gov-analytics-card-title-group">
              <h3>Top Validation Findings</h3>
              <span className="gov-analytics-badge">Frequency Ranked</span>
            </div>
            <span className="gov-analytics-card-hint">Sorted High to Low</span>
          </div>

          <div className="gov-hbar-list" role="list" aria-label="Top Validation Findings">
            {validationFindings.map((finding) => (
              <div key={finding.findingType} className="gov-hbar-item" role="listitem">
                <div className="gov-hbar-meta">
                  <span className="gov-hbar-label">{finding.findingType}</span>
                  <span className="gov-hbar-count-badge">
                    {finding.count}{' '}
                    <span className="gov-hbar-count-pct">({finding.pct}%)</span>
                  </span>
                </div>
                <div className="gov-hbar-track">
                  <div
                    className="gov-hbar-fill gov-hbar-fill-accent"
                    style={{ width: `${Math.max(finding.barPct, finding.count > 0 ? 5 : 0)}%` }}
                    title={`${finding.findingType}: ${finding.count} occurrences (${finding.pct}%)`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. VERIFICATION SOURCE ANALYSIS */}
      <div className="gov-analytics-card">
        <div className="gov-analytics-card-header">
          <div className="gov-analytics-card-title-group">
            <Layers size={18} color="#0B1F54" />
            <h3>Verification Source Status</h3>
            <span className="gov-analytics-badge">Statutory Cross-Verification</span>
          </div>
          <span className="gov-analytics-card-hint">Authorized-Source Scrutiny</span>
        </div>

        <div className="gov-stacked-analysis">
          {/* Stacked Progress Bar */}
          <div
            className="gov-stacked-bar-track"
            role="progressbar"
            aria-label="Verification source distribution"
          >
            {verificationSources.map((item) => {
              const numPct = parseFloat(item.pct)
              if (numPct <= 0) return null
              return (
                <div
                  key={item.sourceStatus}
                  className="gov-stacked-bar-segment"
                  style={{
                    width: `${numPct}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.sourceStatus}: ${item.count} (${item.pct}%)`}
                />
              )
            })}
          </div>

          {/* Legend Cards */}
          <div className="gov-stacked-legend-grid">
            {verificationSources.map((item) => (
              <div key={item.sourceStatus} className="gov-stacked-legend-card">
                <div className="gov-stacked-legend-info">
                  <span
                    className="gov-stacked-legend-dot"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="gov-stacked-legend-label">{item.sourceStatus}</span>
                </div>
                <span className="gov-stacked-legend-stat">
                  {item.count}
                  <span className="gov-stat-sub-pct">({item.pct}%)</span>
                </span>
              </div>
            ))}
          </div>

          {/* Prototype Disclosure Note */}
          <div className="gov-source-disclosure">
            <HelpCircle size={14} color="#1769C2" />
            <span>
              <strong>Regulatory Scrutiny Protocol:</strong> Prototype evaluating dossiers against
              statutory baseline, simulated Directorate of Technical Education (DTE) registers and
              institution master records.
            </span>
          </div>
        </div>
      </div>

      {/* 7 & 8. COMPLIANCE OVERVIEW & REVIEW PROCESSING TREND */}
      <div className="gov-analytics-row-2col">
        {/* Compliance Overview */}
        <div className="gov-analytics-card">
          <div className="gov-analytics-card-header">
            <div className="gov-analytics-card-title-group">
              <CheckCircle2 size={16} color="#15803D" />
              <h3>Compliance Overview</h3>
              <span className="gov-analytics-badge">Audit Health</span>
            </div>
            <span className="gov-analytics-card-hint">Horizontal Stacked Distribution</span>
          </div>

          <div className="gov-compliance-meter">
            {/* Horizontal progress meter */}
            <div className="gov-compliance-meter-track" role="progressbar">
              {complianceOverview.map((item) => {
                const numPct = parseFloat(item.pct)
                if (numPct <= 0) return null
                return (
                  <div
                    key={item.status}
                    className="gov-compliance-meter-segment"
                    style={{
                      width: `${numPct}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.status}: ${item.count} (${item.pct}%)`}
                  />
                )
              })}
            </div>

            {/* Compliance chips */}
            <div className="gov-compliance-chips">
              {complianceOverview.map((item) => (
                <div key={item.status} className="gov-compliance-chip">
                  <div className="gov-compliance-chip-info">
                    <span
                      className="gov-legend-color-box"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="gov-legend-text">{item.status}</span>
                  </div>
                  <strong>
                    {item.count} <span className="gov-legend-pct">({item.pct}%)</span>
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Processing Trend */}
        <div className="gov-analytics-card">
          <div className="gov-analytics-card-header">
            <div className="gov-analytics-card-title-group">
              <TrendingUp size={16} color="#1769C2" />
              <h3>Review Processing Trend</h3>
              <span className="gov-analytics-badge">Scrutiny Lifecycle</span>
            </div>
            <span className="gov-analytics-card-hint">Current Demo Dataset Timeline</span>
          </div>

          <div className="gov-trend-list" role="list">
            {processingTrend.map((trend) => (
              <div key={trend.period} className="gov-trend-item" role="listitem">
                <div className="gov-trend-meta">
                  <div>
                    <span className="gov-trend-period">{trend.period}:</span>
                    <span className="gov-trend-description">{trend.label}</span>
                  </div>
                  <span className="gov-trend-count">{trend.count} Dossiers</span>
                </div>
                <div className="gov-trend-bar-track">
                  <div className="gov-trend-bar-fill" style={{ width: `${trend.barPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9. KEY INSIGHTS PANEL */}
      <div className="gov-insights-card">
        <div className="gov-analytics-card-header">
          <div className="gov-analytics-card-title-group">
            <FileSearch size={18} color="#0B1F54" />
            <h3>Key Insights</h3>
            <span className="gov-analytics-badge">Automated Diagnostic Synthesis</span>
          </div>
          <span className="gov-analytics-card-hint">Dynamically calculated from dashboard records</span>
        </div>

        <div className="gov-insights-grid">
          {/* Most Common Issue */}
          <div className="gov-insight-tile">
            <div className="gov-insight-tile-header">
              <AlertCircle size={14} className="gov-insight-tile-icon" />
              <span>{keyInsights.mostCommonIssue.title}</span>
            </div>
            <div className="gov-insight-tile-value">{keyInsights.mostCommonIssue.value}</div>
            <div className="gov-insight-tile-metric">
              {keyInsights.mostCommonIssue.count > 0
                ? `${keyInsights.mostCommonIssue.count} occurrence(s) flagged across dossier evaluations`
                : 'Zero discrepancy findings detected'}
            </div>
          </div>

          {/* Highest Flagged Category */}
          <div className="gov-insight-tile">
            <div className="gov-insight-tile-header">
              <FolderKanban size={14} className="gov-insight-tile-icon" />
              <span>{keyInsights.highestFlaggedCategory.title}</span>
            </div>
            <div className="gov-insight-tile-value">{keyInsights.highestFlaggedCategory.value}</div>
            <div className="gov-insight-tile-metric">
              {keyInsights.highestFlaggedCategory.count > 0
                ? `${keyInsights.highestFlaggedCategory.count} application(s) requiring officer scrutiny`
                : 'All application categories currently clear'}
            </div>
          </div>

          {/* Documents Requiring Manual Review */}
          <div className="gov-insight-tile">
            <div className="gov-insight-tile-header">
              <Clock size={14} className="gov-insight-tile-icon" />
              <span>{keyInsights.manualReviewRequiredDocs.title}</span>
            </div>
            <div className="gov-insight-tile-value">
              {keyInsights.manualReviewRequiredDocs.value}
            </div>
            <div className="gov-insight-tile-metric">
              High-priority verification queues awaiting committee decision
            </div>
          </div>

          {/* Verification Pending */}
          <div className="gov-insight-tile">
            <div className="gov-insight-tile-header">
              <Layers size={14} className="gov-insight-tile-icon" />
              <span>{keyInsights.verificationPending.title}</span>
            </div>
            <div className="gov-insight-tile-value">{keyInsights.verificationPending.value}</div>
            <div className="gov-insight-tile-metric">
              Dossiers uploaded and staged for automated OCR verification
            </div>
          </div>

          {/* Most Frequently Detected Inconsistency */}
          <div className="gov-insight-tile">
            <div className="gov-insight-tile-header">
              <AlertTriangle size={14} className="gov-insight-tile-icon" />
              <span>{keyInsights.frequentInconsistency.title}</span>
            </div>
            <div className="gov-insight-tile-value">{keyInsights.frequentInconsistency.value}</div>
            <div className="gov-insight-tile-metric">
              Field mismatch observed between application details and submitted documents
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Reusable Circular Donut SVG Chart
 */
interface DonutSliceItem {
  key: string
  label: string
  count: number
  pct: string
  color: string
}

function DonutChart({
  items,
  totalCount,
  centerLabel,
  onSelect,
  selectedKey,
  hoveredSlice,
  setHoveredSlice,
}: {
  items: DonutSliceItem[]
  totalCount: number
  centerLabel: string
  onSelect?: (key: string) => void
  selectedKey?: string
  hoveredSlice: string | null
  setHoveredSlice: (key: string | null) => void
}) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  let accumulatedFraction = 0

  return (
    <div className="gov-donut-svg-wrapper">
      <svg
        viewBox="0 0 160 160"
        className="gov-donut-svg"
        role="img"
        aria-label={`${centerLabel} status donut chart`}
      >
        {/* Background track */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#EAF2FB"
          strokeWidth="20"
        />

        {totalCount > 0 &&
          items.map((item) => {
            const fraction = item.count / totalCount
            if (fraction <= 0) return null

            const strokeLength = fraction * circumference
            const strokeGap = circumference - strokeLength
            const strokeDashoffset = -(accumulatedFraction * circumference)
            accumulatedFraction += fraction

            const isSelected = selectedKey === item.key
            const isHovered = hoveredSlice === item.key

            return (
              <circle
                key={item.key}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isSelected || isHovered ? 23 : 20}
                strokeDasharray={`${strokeLength} ${strokeGap}`}
                strokeDashoffset={strokeDashoffset}
                className="gov-donut-slice"
                onClick={() => onSelect?.(item.key)}
                onMouseEnter={() => setHoveredSlice(item.key)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <title>{`${item.label}: ${item.count} (${item.pct}%)`}</title>
              </circle>
            )
          })}
      </svg>

      <div className="gov-donut-center-info">
        <strong>{totalCount}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  )
}
