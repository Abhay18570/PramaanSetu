# PramaanSetu — SIH26261

A React + Vite + TypeScript portal with a localhost Python/FastAPI document-analysis service. Module 04 adds real PDF extraction, optional local OCR, structured comparison, explainable findings and file fingerprints. This is an independent SIH concept, not an official AICTE service.

## Run and check

```sh
npm install
npm run dev
npm run build
npm run lint
npm test
```

The build includes TypeScript checks. Tests use Node's native TypeScript support (tested with Node 26). No new project dependencies are required.

## Local accounts

1. Choose Institution or Officer at `/select-role`.
2. Create an account at `/register?role=INSTITUTION` or `/register?role=OFFICER`.
3. After registration, the appropriate dashboard opens with zero applications and a real account-created activity event.
4. Sign out without deleting the account. Return through `/login`, enter its registered email, select **Find Local Account**, then **Continue to Local Workspace**.
5. Edit details under Profile. Changes persist, including the normalized sign-in email. Email uniqueness is enforced across both roles.

There are no predefined accounts, password fields, passwords, password hashes, authentication tokens or backend requests. Anyone who can access this browser's data can open these workspaces. Email lookup and role routing are **not secure authentication, identity verification or authorization**. Creating an officer workspace does not grant AICTE authority. Do not enter sensitive institutional information.

## Storage architecture

| Key | Shape |
| --- | --- |
| `pramaansetu_users_v1` | `{ version: 1, data: User[] }` |
| `pramaansetu_session_v1` | `{ userId, createdAt, sessionVersion: 1 }` |
| `pramaansetu_applications_v1` | `{ version: 1, data: Application[] }` |
| `pramaansetu_activity_v1` | `{ version: 1, data: Activity[] }` |
| `pramaansetu_analysis_reports_v1` | `{ version: 1, data: SavedReport[] }` |

Repositories live in `src/storage/`, with typed entities and Zod validation in `models.ts`. `localStorage.ts` centralizes reads, writes, removal, change notifications, error reporting and best-effort synchronous rollback. Missing collections read as empty. Malformed data and unsupported versions produce visible errors and are not silently overwritten. Invalid or orphaned sessions are cleared. Storage failures do not produce false success messages.

User IDs are generated with `crypto.randomUUID()`. Emails are trimmed and lowercased. Registration stores role-specific metadata and timestamps; profiles do not store passwords or secrets. The active session references the account rather than duplicating its profile. Changes in the same page and browser storage events refresh the UI. This does not provide database transactions, secure isolation, conflict resolution or multi-user synchronization.

`src/auth/service.ts` defines the `AccountService` interface for a future FastAPI adapter. Replace the local repository operations with server requests and server-enforced authentication/authorization when a backend is introduced.

Old Module 02 demo sessions are ignored; no demo accounts are imported.

## Development Roadmap

### Module 01 — Landing Page
- **Status:** Completed
- Public-facing institutional portal with government-grade design, accessibility controls, SIH 2026 problem framing, and responsive layout.

### Module 02 — Authentication & Role-Based Dashboards
- **Status:** Completed
- Authentication foundations and dedicated dashboards for Institutional Coordinators and Regulatory Scrutiny Officers.

### Module 02.1 — Local Accounts & UI Simplification
- **Status:** Completed
- Zero-password local account system stored in browser localStorage. Independent registration, email-based local login, profile editing, and account deletion without demo accounts or invented statistics.

### Government Portal UI Redesign
- **Status:** Completed
- Visual redesign inspired by the National Single Window System (NSWS) and Ministry of Corporate Affairs (MCA). Features a 3-level institutional-style header, tricolor accents, high-contrast navy navigation, accessibility controls, and standardized componentry.

### Module 03 — Application Submission & Document Upload
- **Status:** Completed (browser-local prototype)
- **Features:**
  - Create institutional applications
  - Enter application details
  - Upload supporting documents
  - Save and edit drafts
  - Submit applications
  - Track submission status
  - Connect submissions to officer review queue

### Module 04 — AI Document Analysis & Validation
- **Status:** Completed (localhost prototype)
- **Features:**
  - OCR-based document text extraction
  - Document field extraction
  - Application-to-document consistency checks
  - Document anomaly detection
  - File integrity checks
  - AI-assisted verification findings

### Module 05 — Regulatory Compliance & Verification Reports
- **Status:** Completed (localhost/browser-local prototype)
- **Features:**
  - Rule-based regulatory compliance checks
  - Compliance findings
  - Verification summaries
  - Downloadable reports
  - Officer review and decision support

## Module 05 — deterministic compliance and human review

Module 05 evaluates submitted applications with a versioned, declarative rule catalog after Module 04 analysis. The bundled `demo-2026.1` catalog contains ten rules marked `DEMONSTRATION`; these rules are engineering examples and do not represent current AICTE regulations. The engine supports required-value, document-presence, field-consistency, expiry-date and readability operators. It emits stable explanation codes, source references, document/page evidence, and one of `PASS`, `FAIL`, `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE` or `ERROR` for every rule.

Overall results are deterministic: any failure yields **Issues Detected**; missing evidence or a partial error yields **Incomplete Evaluation**; an entirely failed/non-applicable run yields **Evaluation Failed**; otherwise the result is **No Failures Detected**. Every evaluation records the catalog version, source analysis ID, application/document snapshot fingerprint and generation time. A change to the application revision, analysis report, document set or catalog version marks the saved result as outdated and requires re-evaluation. Up to ten historical evaluations are retained per application.

Officers can review each finding, record an assessment and note, keep private officer notes, publish separate institution-visible feedback, save a draft, and finalize an immutable review revision. A correction creates a new revision rather than rewriting the finalized record. Institutions receive read-only access to their own evaluation and published feedback; private officer notes are omitted. This remains browser-local role routing, so production authorization must be enforced by a server.

The FastAPI service exposes:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/compliance/rules` | Active versioned demonstration catalog |
| `GET /api/compliance/capabilities` | Supported operators, results and report languages |
| `POST /api/compliance/evaluate` | Deterministic JSON evaluation from an application/document/analysis snapshot |
| `POST /api/compliance/report/pdf` | Multi-page English, Hindi or Marathi verification report |

Reports show the automated assessment separately from the human review, include evidence and staleness warnings, and repeat that the rules are illustrative. Hindi and Marathi PDFs embed Noto Sans Devanagari under its OFL license and use ReportLab shaping. Reports are generated from schema-validated snapshots but are not digitally signed; a production system should generate them from authenticated server-side records and add tamper-evident signing.

Module 05 metadata uses `pramaansetu_compliance_evaluations_v1` and `pramaansetu_officer_reviews_v1`. Deleting an application or account and performing the scoped prototype reset also removes associated records. The actual document availability check reads IndexedDB before evaluation; document bytes stay in the browser and the compliance API receives metadata and Module 04 evidence rather than uploaded file bodies.

To change the demonstration rules, edit `backend/app/rules/demonstration_rules.json`, increment its catalog version and retain stable rule IDs when semantics remain compatible. Add new operators explicitly in the validated schema and engine; unknown operators are rejected. User-facing rule titles and explanation codes are translated in `src/i18n/catalog.ts`. Fixed PDF report text is translated in `backend/app/services/pdf_report_generator.py`.

Run `npm test`, `npm run lint`, `npm run build`, and `cd backend && .venv/bin/pytest`. With both development servers running, `npm run test:compliance-browser` covers the officer analysis/evaluation/review flow, multilingual report downloads, refresh persistence, institution privacy, stale-result detection, and responsive layouts in all three languages.

## Module 06 — document relationship intelligence

The officer-only `/officer/intelligence` workspace constructs an explainable graph from submitted applications visible on the current browser origin. It reuses Module 03 application/document metadata, Module 04 SHA-256 fingerprints and extracted registration identifiers, and relevant Module 04/05 findings. It never reads document blobs while scanning and does not send the local account collection or graph to an external service.

The deterministic engine in `src/intelligence/engine.ts` creates institution, application, document, typed identifier and contextual finding nodes. Edges record submission, document containment, exact fingerprint matches, shared identifiers, identifier/name conflicts and source findings. Node and edge IDs are stable, repeated evidence is deduplicated, ordering and initial layout are deterministic, and connected components reveal related applications. Exact byte matches are classified separately from normalized identifier matches and potential identity conflicts. None of these signals is treated as proof of fraud.

The dependency-free SVG graph was selected to keep this browser-local prototype small and auditable. It supports pan, zoom, reset/fit, node and edge selection, search, and filters for node type, relationship and priority. A detail panel, evidence-backed signal table and side-by-side application comparison link officers back to the existing application, document analysis and compliance views. The network is capped by officer filters rather than uploading data to a graph provider.

Investigation status is stored in the versioned `pramaansetu_investigations_v1` repository with Zod validation. Supported states are `NEW`, `UNDER_INVESTIGATION`, `EXPLAINED`, `NEEDS_FOLLOW_UP` and `DISMISSED`. Dismissal requires a reason. Every change records the officer ID, timestamp, note and revision history; it does not modify Module 04 evidence, Module 05 reviews or application status. Stable signal identity reconnects saved investigations after a scan, while a changed evidence fingerprint requires reassessment. Input snapshots include relevant application revisions, document storage keys, analysis/fingerprint references and compliance evaluation references. Changed source data marks the displayed graph stale until **Refresh Intelligence Network** is selected.

The optional **Investigation Demo** adds four clearly fictional applications through existing repositories only after confirmation. It produces an exact document-reuse relationship between A1/B1 and a normalized registration-identifier conflict between A1/C1; A2 remains independent. Cleanup removes only those fixed demo users, applications, document metadata, analysis reports and related compliance data, while preserving unrelated records and historical investigation notes. The demo metadata intentionally has no backing file blobs, so it cannot be mistaken for uploaded evidence.

The page and navigation are translated in English, Hindi and Marathi. Institution accounts cannot access the officer route. This remains browser-local role gating rather than secure authorization: it compares only records on one browser origin, cannot correlate separate browsers/devices, and must move to authenticated server-side access and durable audited storage before real cross-institution use.

Run `npm run test:intelligence-browser` with Vite running to verify empty state, real demo detection, graph rendering, investigation persistence, dismissal validation, snapshot staleness, explicit refresh, multilingual mobile layout and scoped demo cleanup. Unit tests cover normalization, deterministic graph output, exact reuse, identifier conflict, connected components, fingerprint changes and reassessment.

## Module 07 — explainable evidence inspector

Officers can open `/officer/applications/:id/evidence` from application review, Module 04 source actions, Module 05 evidence actions and Module 06 comparisons. Query parameters accept only internal finding/document IDs and a positive page number; extracted values and source quotations are never placed in URLs. Institution role routes cannot open the inspector.

The three-panel workspace resolves current evidence directly from saved Module 04 reports, Module 05 evaluations and Module 06 signals. It shows submitted and extracted values, comparison outcome, original quotation, document category and filename, SHA-256 fingerprint, source page, extraction method, report/evaluation/signal references, location quality and a supported provenance trace. Missing references, deleted documents, replaced files and stale analysis/evaluations are displayed explicitly rather than silently presenting historical evidence as current.

PDF.js is loaded only when the lazy officer-only inspector route renders. It reads the existing IndexedDB blob, renders one page at a time, supports previous/next page, zoom, fit width, rotation and original download, cancels obsolete render tasks, destroys PDF resources and releases image/download object URLs. JPG/JPEG and PNG use the same local blob path. No document is uploaded to a viewing service.

New native-PDF analyses can include actual PyMuPDF word geometry in `PDF_POINTS_TOP_LEFT` coordinates with original page dimensions. The overlay scales and rotates those boxes with the rendered page. If exact geometry is unavailable, the viewer uses a real PDF text-item match where possible, then page-level evidence, then a clearly labeled unlocated fallback. OCR remains page-level because the current OCR adapter does not return trustworthy coordinates. Older reports remain valid because all location fields are optional.

Evidence notes reuse existing records: relationship notes update Module 06 investigations, compliance notes update a mutable Module 05 review draft, and analysis evidence notes enter the existing application activity history. Finalized compliance reviews remain immutable. Marking evidence reviewed does not approve or reject an application and does not alter extracted evidence.

The inspector is translated in English, Hindi and Marathi and switches to tabbed Findings, Source Document and Evidence Details panels on mobile. Source quotations, filenames, identifiers and fingerprints remain unchanged across languages.

Module 07 also improves loading architecture. Before this module the main build chunk was approximately **664 kB**. With Module 06 and Module 07 route splitting, the main chunk is approximately **442 kB**; the inspector is about **20 kB**, and PDF.js is isolated in a separate approximately **409 kB** lazy chunk with its worker emitted separately. The former main-chunk size warning no longer appears.

Run `npm run test:evidence-browser` with FastAPI and Vite running. It analyzes a real synthetic PDF, opens the actual mismatch and correct page, verifies a coordinate-backed highlight and value comparison, exercises zoom/rotation, saves an officer note, refreshes, switches languages, checks mobile tabs, verifies missing-source fallback and confirms institution access is rejected. Frontend tests cover schema validation, quotation preservation, source resolution, staleness and coordinate transforms; backend tests verify real PyMuPDF geometry.

## Verification preview transparency

The landing-page hero remains labeled **Illustrative Preview — Sample Data**. Its visual examples are not live results. Actual Module 04 results appear only inside a submitted application's Document Analysis section after an officer explicitly runs the local backend.

Module 04 performs extraction and application consistency checks. Regulatory compliance evaluation and final decisions remain outside this module and belong to Module 05.

## Applications and activity

Module 03 provides real draft creation, document upload, submission and officer review initiation. Module 04 adds an explicit analysis action after an officer starts review.

Application entities include a UUID, owning `userId`, institution name, type, created/updated timestamps and one of:

`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `ACTION_REQUIRED`, `REVIEWED`.

Institutions see only their own stored records. Officers see non-draft records from the same browser origin. Review queues exclude completed reviews; flagged cases use `ACTION_REQUIRED`. Counts and charts derive from repository records. Empty data produces empty states, not invented progress or metrics. Registration and profile saves produce actual activity events. Reviewed is a local workflow state, not official approval.

localStorage is browser-origin-specific: accounts and applications on another browser, device, port or origin do not appear automatically. Use accounts within the same browser origin for cross-role demonstrations.

## Data management

Profile includes Sign out, Delete my account and Clear local prototype data.

- Sign out removes only the active session.
- Account deletion requires confirmation and removes that account's applications and activity while keeping other accounts.
- Full reset requires explicit confirmation and removes only the PramaanSetu metadata keys and its document blobs, preserving unrelated site storage.
- Clearing site storage in browser settings can erase all local data. There is no server backup.

When corrupt account storage prevents access, the sign-in screen provides a confirmed reset option.

## Routes

- `/`, `/select-role`, `/login`, `/register`.
- `/institution/dashboard`, `/institution/applications`, `/institution/new-application`, `/institution/reports`, `/institution/profile`.
- `/officer/dashboard`, `/officer/review-queue`, `/officer/flagged`, `/officer/reports`, `/officer/profile`.
- Legacy `/forgot-password` explains that no password is needed. Previous document/findings URLs remain simple placeholders, but are removed from the navigation.
- Unauthenticated portal navigation returns to login; a different role redirects to its own dashboard. Unknown URLs show a 404.

Static hosting requires an SPA fallback to `index.html` for direct navigation and refreshed routes. The Vite development server provides this automatically.

## Automated verification

`tests/local-accounts.test.ts` covers registration, normalized duplicate checks, sessions, logout/returning sign-in, role routing, ownership, draft visibility, profile persistence, deletion, scoped reset, corrupted/versioned records, blocked storage and failed-write rollback.

`tests/module03-browser.mjs` exercises the current institution-to-officer UI journey in an isolated browser context, using synthetic sample files and real IndexedDB. It covers ownership, filtering, upload persistence, cleanup and responsive widths of 1440, 1280, 768 and 390 pixels. The app never seeds accounts or application records.

Optional browser tooling can be installed outside the project:

```sh
npm install --prefix /tmp/pramaansetu-browser-qa --no-audit --no-fund --package-lock=false @playwright/test
PLAYWRIGHT_BROWSERS_PATH=/tmp/pramaansetu-browser-qa/browsers /tmp/pramaansetu-browser-qa/node_modules/.bin/playwright install chromium
# Keep npm run dev running in another terminal, then:
PLAYWRIGHT_MODULE=/tmp/pramaansetu-browser-qa/node_modules/@playwright/test/index.mjs PLAYWRIGHT_BROWSERS_PATH=/tmp/pramaansetu-browser-qa/browsers npm run test:browser
```

`QA_BASE_URL` optionally overrides the local URL. Screenshots are written to `/tmp/pramaansetu-module03`. Module 03 browser checks are documented below.

## Module 03 — working applications and documents

The government portal now supports **Extension of Approval — Institutional Application**, a representative workflow configured in `src/applications/config.ts`. Its fields and checklist are illustrative, not official AICTE requirements. No OCR, AI findings, document authentication, compliance determination, approval or rejection is performed.

### Workflow and routes

| Route | Function |
| --- | --- |
| `/institution/applications/new` | Create a UUID draft with a unique human-readable reference, for example PS-2026-000001 |
| `/institution/applications/:id/edit` | Resume the saved wizard step and edit an owned draft |
| `/institution/applications` | Search reference, filter status, sort creation date, view, resume or delete owned drafts |
| `/institution/applications/:id` | Read-only summary, documents, actual status history, activity and print |
| `/officer/review-queue` | Shared browser-local submissions; drafts excluded |
| `/officer/applications/:id` | Inspect submitted details and files; explicitly Start Review |

The four wizard steps are Institution Information, Application Details, Supporting Documents, and Review & Submit. Account fields prefill the application; application edits do not modify the account. Save Draft permits incomplete records; Save & Exit returns to the list. Continue validates the current step. Save explicitly before refreshing or closing the browser. Required files are checked against actual IndexedDB blobs before advancing and again before submission. Submission requires a declaration and confirmation, persists a submission timestamp, and locks ordinary institution edits.

Implemented transitions are **DRAFT → SUBMITTED → UNDER_REVIEW**. ACTION_REQUIRED and REVIEWED remain recognized states for future review workflows; Module 03 does not create them. Timelines show only recorded transitions. Officers explicitly start review; opening a record does not change its status. Activity uses the existing `createdAt` and `message` fields as timestamp and description, plus `applicationId`, `actorUserId` and `action`. Counts and recent activity derive from stored records.

### Storage and recovery

- Existing v1 application fields remain compatible. Optional additive fields include referenceNumber, institutionUserId, applicationType, academicYear, nested institution/application details, documentIds, currentStep, revision, submittedAt and statusHistory. Legacy records hydrate defaults in memory without rewriting stored data or inventing event timestamps. The legacy userId remains the ownership key.
- `pramaansetu_documents_v1` in **localStorage** stores a versioned metadata collection: id, applicationId, documentType, fileName, mimeType, fileSize, uploadedAt, storageKey.
- `pramaansetu_reference_sequence_v1` stores a versioned reference counter. UUIDs remain the internal identities.
- The separate **IndexedDB** database `pramaansetu_documents_v1`, object store `files`, holds actual Blobs under UUID keys. File contents are never serialized into localStorage or sent to external APIs.
- PDF, JPG/JPEG and PNG are supported, up to **10 MB per file**, one per configurable checklist item. Extension, MIME and signatures are checked; this is basic format validation, not document authentication, antivirus scanning or complete file parsing.
- New blobs persist before metadata. Metadata failures trigger blob rollback. Replacement/deletion removes metadata first, then collects unreferenced files. A startup/metadata-change recovery pass and a visible retry action handle interrupted cleanup. Corrupt metadata stops collection rather than risking referenced files.
- Preview and download retrieve the actual Blob and report missing files. Object URLs are revoked. PDF previews are sandboxed; image previews use image elements.
- Draft deletion, account deletion and confirmed prototype reset remove associated metadata and files. Reset preserves unrelated origin storage and databases.
- Web Locks serialize application/document mutations across tabs where supported; revision checks reject stale draft saves while retaining current form input. Browsers without Web Locks fall back to a per-tab queue; simultaneous tabs are not fully coordinated there. localStorage and IndexedDB are not one atomic database, and localStorage rollback is best effort.

### Test the institution → officer journey

1. Register an Institution account with sample details. Create an application.
2. Complete institution and application fields. Upload sample documents for all five required categories.
3. Save Draft, refresh, and resume. Preview/download files to confirm persistence.
4. Continue to review, check the declaration, and submit.
5. Sign out. Register or sign in to an Officer account **on the same browser origin**.
6. Open Review Queue, find the reference, inspect details and preview files. Select Start Review.
7. Sign out and return to the Institution account. Its application and dashboard now show Under Review.

Run `npm test` for the account, application and analysis-report unit tests, `npm run lint`, and `npm run build` (includes TypeScript). With Vite running, run `npm run test:browser` using an available Playwright installation. To keep Playwright outside this application's dependencies:

```sh
npm install --prefix /tmp/pramaansetu-browser-qa @playwright/test
PLAYWRIGHT_BROWSERS_PATH=/tmp/pramaansetu-browser-qa/browsers /tmp/pramaansetu-browser-qa/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/pramaansetu-browser-qa/node_modules/@playwright/test/index.mjs PLAYWRIGHT_BROWSERS_PATH=/tmp/pramaansetu-browser-qa/browsers npm run test:browser
```

The Module 03 browser suite uses an isolated browser context and synthetic files, real IndexedDB persistence, refresh/resume, replacement/removal, download/preview, missing blobs, metadata-write failure rollback, submission guards, ownership, officer review, dashboard counts, draft/account/reset cleanup, and 1440/1280/768/390px layout checks. It does not touch the developer's existing browser profile. Screenshots are written under `/tmp/pramaansetu-module03`. The older `tests/browser-checks.mjs` targets the pre-redesign account UI; use the Module 03 suite for current integrated browser verification.

### Implementation map

New:
- `src/applications/`: configuration, typed model and validation, service, wizard, shared summary, details and responsive styles.
- `src/documents/`: signature validation, document service, shared upload/checklist/preview panel and recovery banner.
- `src/storage/documentBlobRepository.ts` and `documentMetadataRepository.ts`.
- `tests/applications.test.ts` and `tests/module03-browser.mjs`.

Updated:
- `src/App.tsx` routes and recovery integration.
- `src/storage/models.ts`, `localStorage.ts`, `applicationRepository.ts`, `activityRepository.ts`; `src/auth/service.ts` for cleanup.
- `src/portals/Widgets.tsx`, `DashboardPages.tsx`, `data.ts`, `useLocalData.ts`, `portal.css` for live application actions, counts and responsive navigation.
- `src/LandingPage.tsx`, `src/data/content.ts`, `src/components/Sections.tsx` for current Module 03 availability.
- `package.json` test scripts and this README.

### Limits

This is browser-local, passwordless prototype storage, not secure authentication or server-enforced authorization. Accounts on different origins, browsers or devices do not synchronize. Browser eviction, clearing site data or private browsing can remove files; there is no backup service. Use only synthetic records and sample documents.

Before any public or real-data use, add server-side authentication and authorization, durable encrypted storage, malware scanning, rate limits, audit controls, and a privacy/retention policy. Establish applicable official requirements before claiming regulatory coverage.

## Module 04 — local document analysis

The Python service under `backend/` accepts browser-held documents only when an officer selects **Run Document Analysis** on an application in `UNDER_REVIEW`. It does not receive files merely because a page opens. Files are processed in memory and are not retained by the backend.

### Setup and startup

Python 3.11 or newer is supported. On macOS, optional image/scanned-page OCR requires local Tesseract:

```sh
brew install tesseract
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Without Tesseract, text PDFs still work. Images and scanned PDF pages return explicit OCR-unavailable warnings. The service never invents extracted content.

### API and processing

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Service readiness and extraction/OCR availability |
| `GET /api/verification/capabilities` | Formats, language, size and PDF page limits |
| `POST /api/verification/analyze` | Multipart application metadata, document IDs/types and files |

The API accepts PDF, JPG/JPEG and PNG, with a 10 MB limit per file, at most 12 files and 30 PDF pages by default. Environment settings use the `PRAMAANSETU_` prefix; see `backend/.env.example`. CORS defaults only to the localhost Vite origins.

PyMuPDF extracts page-specific text. Pages with insufficient embedded text use bounded 1.5× rendering and Tesseract when available. Images are orientation-normalized, converted to grayscale, bounded to 2400×2400 and passed to Tesseract with a timeout. Extraction methods are `PDF_TEXT`, `OCR`, `MIXED` or `UNAVAILABLE`.

Regex and keyword rules extract institution name/code, registration and approval references, academic year, issue/expiry dates, affiliation, address, PIN and contact values. Normalized application comparisons return `MATCH`, `MISMATCH`, `NOT_FOUND` or `UNABLE_TO_DETERMINE`. Content classification is deliberately conservative: `CONSISTENT`, `POSSIBLE_MISMATCH` or `INSUFFICIENT_EVIDENCE`. Cross-document differences, expired dates, unreadable files and possible category mismatches are review signals, never fraud or authenticity findings.

Every document receives a SHA-256 fingerprint. This detects byte-for-byte identity only; it does not prove the issuer or authenticity. Reports use `NO_ISSUES_DETECTED`, `REVIEW_REQUIRED`, `INCOMPLETE_ANALYSIS` or `ANALYSIS_FAILED`, all describing automated analysis rather than regulatory status.

### Frontend reports

Responses are validated with Zod before saving under `pramaansetu_analysis_reports_v1`. Each saved report includes document IDs and storage keys; replacements make older reports visibly stale. Compact findings and bounded evidence excerpts are saved, while full OCR page text is not stored in localStorage.

Both roles can view the latest report. Officers can rerun analysis after review starts, filter findings by severity/document, and open the cited source file with its page reference. Analysis records activity but never changes the application to `REVIEWED` and never approves or rejects it.

### Verification

```sh
cd backend && .venv/bin/pytest -q
npm run build
npm run lint
npm test
# With frontend and backend running and temporary Playwright available:
PLAYWRIGHT_MODULE=/tmp/pramaansetu-browser-qa/node_modules/@playwright/test/index.mjs \
PLAYWRIGHT_BROWSERS_PATH=/tmp/pramaansetu-browser-qa/browsers \
npm run test:analysis-browser
```

The backend suite covers endpoints, valid and malformed PDFs, limits, extraction, normalization, matching/mismatching, missing fields, cross-document conflicts, expiry, classification, hashing and partial results. OCR execution is skipped when Tesseract is absent while its explicit-unavailable path is tested. The browser suite uses a generated synthetic PDF and real IndexedDB/API traffic to cover button visibility, multipart upload, mismatch and matching reports, evidence preview, persistence, stale detection, backend failure and 1440/1280/768/390px layouts.

Module 05 has not been started. Module 04 does not implement regulatory rules, official verification, forgery/tampering detection, signature validation, or final approval decisions.
# Multilingual interface

PramaanSetu supports English (`en`), Hindi (`hi`) and Marathi (`mr`) across public, authentication, institution and officer routes. The shared i18next instance lives in `src/i18n/index.ts`; `src/i18n/catalog.ts` is the typed translation catalog, and `DocumentLocalizer.tsx` applies catalog entries to existing interface text and accessibility attributes without remounting pages. All header variants use the reusable `LanguageSelector` component.

The selected language is stored independently at `pramaansetu_language`. English is the default, and invalid stored values are normalized to English. Language changes update `<html lang>`, survive refresh and sign-out, and do not modify account, application, document or analysis storage.

To add or change copy, add one semantic entry with `en`, `hi` and `mr` values to `catalog.ts`. The catalog test rejects empty locale values. A future language requires adding its language code, locale, selector label and a value on every catalog entry. Hindi and Marathi use the system `Noto Sans Devanagari`/`Nirmala UI` fallback stack.

Only known interface and backend presentation labels are localized. Institution names, identifiers, filenames, hashes, OCR evidence, source quotations and unknown backend messages remain unchanged. Dates and numbers use `Intl` with `en-IN`, `hi-IN` or `mr-IN` while stored values remain unchanged.

Run `npm test` for catalog, localization and repository tests. Run `npm run test:browser` for the established application workflow and the multilingual browser check documented with the other browser suites.
# Module 08 — What-If Compliance Simulator

Module 08 adds an institution-owned workspace at `/institution/applications/:id/simulator`. It creates a compact baseline fingerprint from the application revision, document versions, latest analysis, official compliance evaluation and demonstration rule catalog. Hypothetical changes are stored separately under `pramaansetu_simulation_scenarios_v1`; application records, IndexedDB blobs, analysis reports, official evaluations, reviews and investigations are never written by simulator actions.

The simulator supports application-field changes, assumed document presence, replacement metadata and corrected extracted-value assumptions. `POST /api/compliance/simulate` copies the request, applies validated overrides, and calls the same pure Module 05 `evaluate()` function and active catalog used by official evaluation. Assumed documents always have `blobAvailable: false`, carry `HYPOTHETICAL_USER_ASSUMPTION` provenance, and cannot become verified evidence. Returned rules are annotated as actual, hypothetical, insufficient, or not evaluable.

The workspace compares baseline and simulated rule results, classifies potential improvements and regressions, displays an accessible outcome distribution, and derives a severity-ordered correction roadmap from returned findings. Users can save, duplicate, rename, reset and delete up to eight scenarios per application. Ownership is scoped to the signed-in institution. Fingerprint changes mark saved scenarios outdated; rebasing preserves assumptions and discards the old simulated result for an explicit rerun.

The route is lazy loaded and adds about 17 kB of JavaScript (about 5.3 kB gzip). It uses the existing English, Hindi and Marathi catalog and responsive layouts for desktop, tablet and mobile. Browser-local authentication and storage remain prototype conveniences rather than production security boundaries. Production migration requires server-side identity, authorization, encrypted persistence, catalog history and an auditable scenario service.

Validation commands include `npm run lint`, `npm run build`, `npm test`, `cd backend && .venv/bin/pytest -q`, and `npm run test:simulator-browser`.
# Module 09 — Evidence-Grounded Multilingual Copilot

Module 09 adds lazy-loaded institution and officer assistant routes at `/institution/applications/:id/assistant` and `/officer/applications/:id/assistant`. The browser first applies the existing role and ownership rules, classifies English, Hindi or Marathi questions, and retrieves a maximum of 30 normalized evidence items from the selected application’s Module 03–08 records. It never reads document blobs for chat and never gives institution accounts officer investigation data or private officer notes.

The default `DeterministicEvidenceProvider` is exposed through `GET /api/copilot/capabilities`, `GET /api/copilot/health` and `POST /api/copilot/chat`. The chat API accepts bounded structured evidence plus a citation ID allowlist; it does not accept file paths, remote URLs, raw documents or trusted client role claims. Retrieved text is treated only as untrusted data. Returned citation IDs are revalidated in the browser and mapped to internal institution or officer routes. Unknown IDs and external URLs are discarded.

Hosted model configuration is represented by `PRAMAANSETU_AI_PROVIDER`, `PRAMAANSETU_AI_MODEL`, `PRAMAANSETU_AI_API_KEY` and `PRAMAANSETU_AI_BASE_URL` in `backend/.env.example`. No hosted provider is enabled or called by this module. Enabling one in production requires a fixed provider integration, server-side identity and authorization, explicit user consent, redaction, contractual retention review, timeouts, structured response validation and deterministic fallback.

Conversation history uses the versioned `pramaansetu_copilot_conversations_v1` browser key. It is scoped by account, role and application, limited to 12 conversations and 60 messages, and stores compact answers and validated citation metadata rather than document content. The copilot is read only: it cannot modify applications, documents, evaluations, reviews, investigations or scenarios.

The assistant reports stale, missing and hypothetical evidence, labels demonstration rules and simulation limits, and does not claim official approval, authenticity or fraud. Browser-local access controls remain prototype conveniences. Production use requires trusted server sessions, authorization at retrieval time, encrypted server persistence, audit logging and evidence-version checks.

Validation commands include `npm run lint`, `npm run build`, `npm test`, `cd backend && .venv/bin/pytest -q`, and `npm run test:copilot-browser`.
