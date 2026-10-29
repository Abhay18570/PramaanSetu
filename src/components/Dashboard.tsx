import {
  CheckCircle2,
  FileSearch,
  Scale,
  Building,
  UserCheck,
  Check,
  Sparkles,
  LayoutDashboard,
  Files,
  FileCheck2,
  FileSpreadsheet,
  Clock,
  Info,
} from 'lucide-react'
import { PramaanSetuLogo } from './Shared'

export function HeroDashboard() {
  return (
    <div className="gov-hero-illustration" aria-label="Illustrative application verification workflow — sample data">
      {/* Required Clarification Banner */}
      <div className="gov-hero-preview-banner">
        <Info size={13} />
        <span>Illustrative Preview — Sample Data</span>
      </div>

      <div className="gov-hero-doc-card">
        {/* Document Header */}
        <div className="gov-doc-topbar">
          <div className="gov-doc-id-pill">
            <span className="gov-status-dot-active" />
            <span>SAMPLE APPLICATION REF: PS-2026-8941</span>
          </div>
          <span className="gov-doc-type-badge">Illustrative Approval Dossier</span>
        </div>

        {/* Institutional Application Details */}
        <div className="gov-doc-meta-row">
          <div className="gov-doc-meta-icon">
            <Building size={20} />
          </div>
          <div className="gov-doc-meta-info">
            <h4>Example Institute of Engineering &amp; Technology</h4>
            <p>Sample institution details · Not an actual submission</p>
          </div>
          <span className="gov-doc-ready-tag">
            <CheckCircle2 size={13} />
            <span>Example State: Submitted</span>
          </span>
        </div>

        {/* Verification Checklist */}
        <div className="gov-doc-section-title">
          <FileSearch size={14} />
          <span>Simulated Verification Checklist (Workflow Preview)</span>
        </div>

        <div className="gov-checklist-grid">
          <div className="gov-check-item verified">
            <div className="gov-check-icon">
              <Check size={13} />
            </div>
            <div className="gov-check-text">
              <strong>Land &amp; Built-up Norms</strong>
              <span>Sample land and built-up area details</span>
            </div>
            <span className="gov-check-badge pass">Sample: Verified</span>
          </div>

          <div className="gov-check-item verified">
            <div className="gov-check-icon">
              <Check size={13} />
            </div>
            <div className="gov-check-text">
              <strong>Faculty Cadre &amp; Cadre Ratio</strong>
              <span>Sample faculty cadre details for review</span>
            </div>
            <span className="gov-check-badge pass">Sample: Verified</span>
          </div>

          <div className="gov-check-item verified">
            <div className="gov-check-icon">
              <Check size={13} />
            </div>
            <div className="gov-check-text">
              <strong>Statutory Fire NOC &amp; Occupancy</strong>
              <span>Sample fire clearance and occupancy documents</span>
            </div>
            <span className="gov-check-badge pass">Sample: Verified</span>
          </div>

          <div className="gov-check-item pending">
            <div className="gov-check-icon amber">
              <Clock size={13} />
            </div>
            <div className="gov-check-text">
              <strong>State Government Affiliation</strong>
              <span>Sample affiliation document awaiting review</span>
            </div>
            <span className="gov-check-badge review">Sample: Pending Scrutiny</span>
          </div>
        </div>

        {/* Planned Analysis Strip & Sample Workflow Indicator */}
        <div className="gov-analysis-footer">
          <div className="gov-analysis-box">
            <div className="gov-analysis-icon">
              <Sparkles size={16} />
            </div>
            <div className="gov-analysis-details">
              <strong>OCR Analysis Preview</strong>
              <p>File Integrity Check Preview</p>
            </div>
          </div>

          <div className="gov-compliance-meter">
            <div className="gov-meter-info">
              <span>Sample Compliance Overview</span>
              <strong>Workflow Preview</strong>
            </div>
            <div className="gov-meter-track" aria-hidden="true">
              <div className="gov-meter-fill" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Review Workflow Footer */}
        <div className="gov-workflow-foot">
          <div className="gov-workflow-badge">
            <UserCheck size={14} />
            <span>Sample Reviewer: Example Review Panel</span>
          </div>
          <span className="gov-workflow-note">Illustrative Demonstration Dossier</span>
        </div>
      </div>

      {/* Required Clarification Note */}
      <div className="gov-hero-illustration-note">
        <p>This preview uses sample information. Automated document verification and compliance analysis are under development.</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="gov-preview-workbench" aria-label="Regulatory verification workbench preview">
      <div className="gov-preview-frame">
        {/* Top App bar */}
        <div className="gov-preview-topbar">
          <div className="gov-preview-top-left">
            <span className="gov-preview-badge">SAMPLE REVIEW WORKBENCH</span>
            <span className="gov-preview-title">PramaanSetu · Planned Officer Review Console</span>
          </div>
          <div className="gov-preview-top-right">
            <span className="gov-preview-live-tag">Illustrative Preview — Sample Data</span>
          </div>
        </div>

        <div className="gov-preview-layout">
          {/* Sidebar */}
          <aside className="gov-preview-sidebar">
            <div className="gov-preview-brand-tag">
              <PramaanSetuLogo variant="emblem" size={20} />
              <span>PramaanSetu</span>
            </div>

            <nav className="gov-preview-nav">
              <div className="gov-preview-nav-item active">
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </div>
              <div className="gov-preview-nav-item">
                <Files size={15} />
                <span>Review Queue</span>
                <span className="gov-preview-pill">3</span>
              </div>
              <div className="gov-preview-nav-item">
                <FileCheck2 size={15} />
                <span>Flagged Cases</span>
                <span className="gov-preview-pill warn">1</span>
              </div>
              <div className="gov-preview-nav-item">
                <FileSpreadsheet size={15} />
                <span>Audit Reports</span>
              </div>
            </nav>

            <div className="gov-preview-sidebar-bottom">
              <span className="gov-preview-officer-tag">Example Officer Panel</span>
            </div>
          </aside>

          {/* Workbench Body */}
          <div className="gov-preview-content">
            <div className="gov-preview-header">
              <div>
                <h3>Institutional Verification Queue</h3>
                <p>Sample records illustrating the planned review workflow</p>
              </div>
              <div className="gov-preview-stats-row">
                <div className="gov-preview-stat">
                  <span>Sample Queue</span>
                  <strong>24</strong>
                </div>
                <div className="gov-preview-stat">
                  <span>Sample Flags</span>
                  <strong className="text-amber">2</strong>
                </div>
                <div className="gov-preview-stat">
                  <span>Sample Reviewed</span>
                  <strong className="text-green">148</strong>
                </div>
              </div>
            </div>

            {/* Structured Table */}
            <div className="gov-preview-table-container">
              <table className="gov-preview-table">
                <thead>
                  <tr>
                    <th>Application Ref</th>
                    <th>Institution Name</th>
                    <th>Program Type</th>
                    <th>Rule Compliance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>PS-2026-8941</strong>
                    </td>
                    <td>Example Institute of Technology</td>
                    <td>Engineering &amp; Tech (UG)</td>
                    <td>
                      <span className="gov-score-badge high">Sample: Consistent</span>
                    </td>
                    <td>
                      <span className="gov-badge-gov blue">Under Review</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>PS-2026-8812</strong>
                    </td>
                    <td>Example College of Pharmacy</td>
                    <td>Pharmacy (UG/PG)</td>
                    <td>
                      <span className="gov-score-badge high">Sample: Consistent</span>
                    </td>
                    <td>
                      <span className="gov-badge-gov green">Reviewed</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>PS-2026-8790</strong>
                    </td>
                    <td>Example Polytechnic Institute</td>
                    <td>Diploma Engineering</td>
                    <td>
                      <span className="gov-score-badge warn">Sample: Flagged</span>
                    </td>
                    <td>
                      <span className="gov-badge-gov red">Action Required</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Evidence Drawer preview */}
            <div className="gov-preview-finding-card">
              <div className="gov-finding-top">
                <Scale size={16} />
                <strong>Sample Compliance Finding — Workflow Preview</strong>
              </div>
              <p>
                Example finding: supporting land records and faculty details would be compared with configured
                requirements. No document analysis or regulatory check has been performed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
