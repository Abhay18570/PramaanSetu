import {
  ClipboardList,
  SearchCheck,
  FileCheck2,
  LayoutDashboard,
  UserPlus,
  FilePlus2,
  Sparkles,
  CheckCircle2,
  FileUp,
  Scale,
  Search,
  Building2,
  History,
  FileSpreadsheet,
} from 'lucide-react'

export const navigation = [
  ['Home', 'home'],
  ['About Platform', 'about'],
  ['How It Works', 'how-it-works'],
  ['Verification Services', 'services'],
  ['Updates', 'updates'],
  ['FAQs', 'faqs'],
  ['Contact', 'contact'],
] as const

export const quickAccessCards = [
  {
    id: 'submit-app',
    title: 'Submit Application',
    description: 'Submit institutional approval dossiers and statutory clearances.',
    icon: FilePlus2,
    badge: 'Available in Module 03',
    link: '/institution/new-application',
  },
  {
    id: 'verify-docs',
    title: 'Verify Documents',
    description: 'Run local PDF/OCR extraction, field comparison and SHA-256 fingerprinting.',
    icon: FileCheck2,
    badge: 'Available in Module 04',
    action: 'Document Verification',
  },
  {
    id: 'check-compliance',
    title: 'Check Compliance',
    description: 'Cross-check institutional parameters against regulatory norms.',
    icon: Scale,
    badge: 'Planned in Module 05',
    action: 'Compliance Verification',
  },
  {
    id: 'track-app',
    title: 'Track Application',
    description: 'Monitor scrutiny status, review notes and milestone progression.',
    icon: SearchCheck,
    badge: 'Available in Module 03',
    link: '/institution/applications',
  },
] as const

export const platformServices = [
  {
    id: 'app-validation',
    icon: ClipboardList,
    title: 'Application Validation',
    description: 'Planned application-to-document consistency checks and identification of missing or inconsistent information.',
    status: 'Available in Module 04',
  },
  {
    id: 'doc-auth',
    icon: FileCheck2,
    title: 'Document Authentication',
    description: 'Local OCR/text extraction, document field comparison, review signals and file fingerprints.',
    status: 'Available in Module 04',
  },
  {
    id: 'reg-compliance',
    icon: Scale,
    title: 'Regulatory Compliance',
    description: 'Planned rule-based checks against configurable regulatory requirements.',
    status: 'Planned in Module 05',
  },
  {
    id: 'app-tracking',
    icon: Search,
    title: 'Application Tracking',
    description: 'Track draft and submission status, with submitted applications connected to the officer review queue.',
    status: 'Available in Module 03',
  },
  {
    id: 'verif-reports',
    icon: FileSpreadsheet,
    title: 'Verification Reports',
    description: 'Structured, evidence-backed inspection summaries detailing validated findings, observations, and recommendations.',
    status: 'Planned in Module 05',
  },
  {
    id: 'officer-review',
    icon: LayoutDashboard,
    title: 'Officer Review',
    description: 'Available officer dashboard and local review queue. Review decisions and reporting are planned in Module 05.',
    status: 'Active Console (Module 02)',
  },
] as const

export const fourSteps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Account',
    description: 'Register as an Institution Coordinator or Review Officer in your local prototype workspace.',
    detail: 'Completed in Module 02.1.',
  },
  {
    step: '02',
    icon: FileUp,
    title: 'Submit Application',
    description: 'Enter institutional parameters and upload required supporting dossiers and statutory clearances.',
    detail: 'Available in Module 03: Submission & Upload.',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Validate Documents',
    description: 'OCR text extraction, document anomaly detection, and AI-assisted verification analysis.',
    detail: 'Available in Module 04: Local Document Analysis.',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Review Results',
    description: 'Rule-based compliance checks, verification summaries, and human officer scrutiny decisions.',
    detail: 'Planned in Module 05: Regulatory Compliance.',
  },
] as const

export const institutionalBenefits = [
  {
    icon: Building2,
    title: 'Structured Application Processing',
    description: 'Browser-local applications, supporting document uploads, and editable drafts are available in Module 03.',
  },
  {
    icon: History,
    title: 'Document Review & Traceability',
    description: 'Explainable document analysis and file fingerprints support traceable human review.',
  },
  {
    icon: Scale,
    title: 'Clear Compliance Findings',
    description: 'Planned rule-linked findings and verification reports in Module 05 to support officer review.',
  },
] as const

export const platformUpdates = [
  {
    date: 'AVAILABLE',
    tag: 'COMPLETED',
    title: 'Local Account Registration & Role-Based Dashboards',
    summary: 'Dedicated institutional and scrutiny officer workspaces with persistent local sessions, profile editing, and empty-state collection handling.',
  },
  {
    date: 'UPCOMING',
    tag: 'MODULE 03',
    title: 'Application Submission & Document Upload',
    summary: 'Create applications, enter details, upload documents, save and edit drafts, submit, track status, and connect submissions to the officer review queue.',
  },
  {
    date: 'PLANNED',
    tag: 'MODULE 04',
    title: 'AI Document Analysis & Validation',
    summary: 'Local OCR/text and field extraction, application consistency checks, conservative review signals, and SHA-256 fingerprints.',
  },
  {
    date: 'PLANNED',
    tag: 'MODULE 05',
    title: 'Regulatory Compliance & Verification Reports',
    summary: 'Planned rule-based regulatory checks, compliance findings, verification summaries, downloadable reports, and officer review and decision support.',
  },
] as const

export const faqs = [
  {
    q: 'What is PramaanSetu?',
    a: 'PramaanSetu is an independent prototype developed for Smart India Hackathon 2026 (Problem Statement SIH26261). Local accounts, applications, document upload, and explainable localhost document analysis are available. It does not authenticate documents or make regulatory decisions; compliance verification remains planned for Module 05.',
  },
  {
    q: 'How does the platform handle user accounts and security?',
    a: 'For this prototype phase, PramaanSetu uses password-free local browser storage. Accounts and sessions are stored only in this browser. This provides no secure authentication or identity verification.',
  },
  {
    q: 'Does PramaanSetu replace human regulatory officers?',
    a: 'No. PramaanSetu is designed around human-in-the-loop governance. Planned AI features will assist with data extraction, anomaly detection, and evidence organization. Review and decision support are planned in Module 05; the prototype does not issue official approvals.',
  },
  {
    q: 'What regulatory standards are supported?',
    a: 'Configurable regulatory checks are planned in Module 05. No regulatory rule evaluation or compliance verification is currently connected.',
  },
] as const
