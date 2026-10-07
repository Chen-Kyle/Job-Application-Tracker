# Technical change log

This is the detailed engineering record for assistant-made changes. See `CHANGES.md` for the quick version and `docs/project_log.md` for ideas and TODOs.

## How to maintain this log

- Add a dated entry for each future code change, newest first, using America/New_York dates.
- Record the user request, resulting behavior, affected files, validation performed, and remaining limitations or follow-up work.
- Distinguish implemented code from verified browser behavior and external setup completed by the user.
- Update the short log with a brief matching entry. Do not include tokens, private keys, personal email contents, or backup data.
- Entries below are a retrospective baseline, not a commit-by-commit history. The initial work spans October 4–6; exact dates of earlier individual changes were not recorded.

## 2026-10-07 — Resume commits and publish pending changes

- Request: resume automatic commits/pushes and commit the pending assistant changes now.
- Scope: style/documentation directory organization, updated references and the manual email status override with its tests. The preceding local-only entries describe the state at the time; this entry authorizes their commit and push.
- Validation: all 10 Node tests passed; existing mocked email/matching/approval regression, HTML/manifest references and diff checks passed. Verified origin targets Chen-Kyle/Job-Application-Tracker. Unrelated user deletion of `Change`, installed skills directories and skills-lock.json excluded.
- Standing commit/push instructions in AGENTS.md apply again to future completed requested changes.

## 2026-10-07 — Manual email status override

- Request: correct the suggested status for emails strongly matched to a job before approval.
- Matched cards in `scripts/email/email-ui.js` offer a Status to approve selector with the original suggestion and all application statuses. Choice previews the transition and is submitted only on approval; sample preview supports the choice too.
- `scripts/background/background.js` validates manual overrides, rejects automatic/ambiguous overrides, and uses the selected status through existing activity, history and undo persistence. Requires the displayed application snapshot to avoid overwriting newer edits.
- Validation: existing mocked email regression and Node path/rescan tests, syntax and diff checks; targeted review tests for override validation and snapshot forwarding. No live Gmail/browser test performed. Work remains uncommitted/unpushed per the current session request.

## 2026-10-07 — Organize styles and supporting documentation

- Request: move CSS and supporting documentation into directories, without committing or pushing.
- Moved dashboard/popup/theme CSS to `styles/`; moved setup guide, email test cases and project notes to `docs/`. Keep HTML, manifest, README, license, instructions and change logs at root.
- Updated all HTML stylesheet links, README document links, code-guide layout description and setup-guide references in UI/service messages. Historical log paths remain unchanged.
- Validation: Node regression/path checks and existing mocked email/syntax/HTML asset checks; diff check. No live browser testing. No commit or push performed. Pre-existing user deletion of `Change` left untouched.

## 2026-10-07 — Organize and format scripts

- Request: make code readable, group scripts into directories and update references.
- Moved all 21 root JavaScript files into `scripts/{core,background,email,backup,dashboard,settings,sheets,popup}/` by responsibility. Root HTML/CSS and page URLs remain stable. Updated every HTML script source, manifest worker path, worker-relative imports, and test worker path.
- Formatted JavaScript and tests with Prettier 3.6.2 (one-off tool, no runtime dependency). Added responsibility headers and named check/rescan page-size and concurrency constants. Preserved global classic-script interfaces and dependency order; no feature changes intended.
- Added `scripts/README.md` with architecture, entry points, dependency order, editing guidance and test command; linked it from the main README. Historical log paths describe the old layout and are retained as history.
- Added `tests/project-paths.test.cjs` for syntax, local assets, required script ordering, manifest and relative worker imports. Updated the existing rescan tests and temporary legacy regression harness for moved source files.
- Validation: Node test suite, existing mocked email/matching/approval regression harness, HTML/manifest asset checks and diff checks. No authenticated browser test; reload the unpacked extension after the worker path change.

## 2026-10-07 — Set support email

- Request: use the user-provided public support address kylechenapps@gmail.com.
- `dashboard.html`: update the mailto recipient and visible address; remove the placeholder explanation while preserving report prompts. No email sent.
- Validation: checked recipient and visible address match, and diff formatting.

## 2026-10-07 — Feedback and bug reports

- Request: add a bottom-of-dashboard support section with a placeholder email and advise on a separate Gmail account.
- `dashboard.html`: themed section after Sheets export, accessible heading, mailto link with feedback/bug-report prompts, and explicitly labeled reserved example.com placeholder. Uses the user’s mail application; no messages are automatically sent and no new permissions are required. Replace the address before distribution.
- Validation: existing mocked regression harness, JavaScript syntax/HTML asset checks, and diff checks. No actual email sent or live browser test performed.

## 2026-10-06 — Remove Sheets setup dropdown

- Request: remove the dropdown in Google Sheets export.
- `dashboard.html`: remove the First-time setup disclosure and its content; retain export controls, permission explanation, feedback and spreadsheet link. Setup documentation remains in GMAIL_SETUP.md.
- Validation: existing syntax/HTML asset checks and diff check. Export logic unchanged.

## 2026-10-06 — Settings Info disclosures

- Request: prioritize Info explanations for automatic email updates and backup/restore.
- `settings.html`, `sample-settings.html`, `themes.css`: add compact native disclosures beside both section headings, replace the always-visible automatic-mode explanation, and describe eligibility/manual exceptions, conditional undo, backup contents/exclusions, merge behavior and optional settings restore. Keep essential form instructions, preview and errors visible. Sample settings explain the same features while retaining disabled backup controls.
- Validation: inspected actual eligibility and backup serialization/merge logic; existing syntax/HTML asset regression checks and diff checks. No browser visual testing performed.

## 2026-10-06 — Move Info beside Gmail heading

- Request: place Info to the right of Email suggestions.
- `dashboard.html`, `dashboard.css`, `email-ui.js`: place a compact native button beside the heading with wrapping on small screens. Toggle the existing details below the header using aria-expanded, aria-controls and hidden. The same live diagnostics remain available.
- Validation: JavaScript syntax, existing mocked email regression and HTML/asset checks, diff check. No browser visual test performed.

## 2026-10-06 — Declutter Gmail section

- Request: correct rescan progress margin and hide timer, check diagnostics and Gmail explanation behind a small clickable Info control.
- `dashboard.html`: wrap the existing live timer, results and approval/privacy description in a default-collapsed native details/summary disclosure. Preserve their IDs and updates; keep periodic-check controls and rescan progress visible.
- `dashboard.css`: compact Info label with decorative information icon and open/closed indicator; allow expanded content full width. Give rescan progress the same 24px horizontal inset as surrounding controls.
- Validation: HTML structure/assets and existing email regression checks; diff checks. Native summary supports keyboard toggling without custom JavaScript. No live browser visual test performed.

## 2026-10-06 — Speed up resumable rescans

- Request: rescans became much slower; remove the dashboard-closing explanation.
- `background.js`: restore 25-result rescan pages, read/analyze up to five messages concurrently with settled error handling, and request immediate initial/continuation alarms rather than waiting 30 seconds between quick batches. Preserve a recurring alarm for interruption recovery, saved cursors and atomic queue/checkpoint writes. Ordinary checks retain five-result pages.
- `email-ui.js`: remove the running-state sentence about closing the dashboard.
- Validation: portable rescan regression tests, existing mocked email regression harness, syntax/asset checks and diff checks. No live Gmail timing benchmark performed. Chrome can delay alarms; Gmail latency and quotas still affect duration.

## 2026-10-06 — Resumable rescans and clearer diagnostics

- Request: implement review recommendations 1 and 3: resilient rescans and clearer email check feedback.
- `background.js`: persist account, application identity, fixed search range, cursor, totals, lifecycle and errors in `emailRescan`. A recurring 30-second alarm processes five results per batch, commits queue/cache/cursor together, and restores scheduling on worker/browser startup. Errors pause with saved progress; submitting the same range resumes, while changed application identity starts fresh. Disconnect clears the job; account changes invalidate it. Expired page tokens restart pagination with dedupe preserved.
- `email-ui.js`, `dashboard.html`: show live cumulative progress and paused errors, disable duplicate starts, keep review available between batches, and explain that the dashboard can close. Separate normal diagnostics for unmatched, cached and already suggested/recorded emails; completion refers to search results, not the entire inbox.
- `tests/email-rescan.test.cjs`: portable Node tests for restart/cursor/range preservation, pause/retry totals, cache-versus-recorded diagnostics, and application identity changes.
- Validation: Node regression tests, JavaScript syntax, existing mocked email/matching/approval regression harness and HTML/manifest asset checks. No authenticated Chrome/Gmail session tested.
- Limits: Chrome must be running for batches; alarms may be delayed. Rescans visit Gmail search results in the chosen range, excluding sent/spam/trash; totals reflect committed batches. Stale cursor restarts may count unmatched emails again, but suggestions remain deduplicated. Automatic approval is still governed by existing settings and matching safeguards.

## 2026-10-06 — Authorize commits and pushes

- Request: after requested changes, update both logs, run appropriate checks, then commit and push automatically.
- Added standing authorization and safeguards to `AGENTS.md`, targeting `Chen-Kyle/Job-Application-Tracker`. Verified the transferred remote exists and will update local origin accordingly.
- Scope includes the outstanding assistant README/log edits from the preceding task; unrelated files are excluded.
- Validation: read repository status, inspected outstanding documentation changes, and verified the remote HEAD. This entry records setup; actual commit/push outcome is reported separately.

## 2026-10-06 — Rewrite README for first-time readers

- Request: make the repository README clear and accessible to other people, especially hiring managers.
- Replaced the outdated README with a product overview, motivation, feature summary, sample walkthrough, Chrome installation steps, email behavior, data/privacy details, technology summary, development status, documentation links, and MIT license link.
- Corrected obsolete claims about mandatory manual approval, fixed check frequency, and skipped non-status emails. Avoided claiming universal autofill, production readiness, or live Sheets synchronization.
- Updated both change logs. Validation: checked referenced local documents and license exist and compared key behavior against current implementation. Documentation-only change; no browser tests needed.

## 2026-10-06 — Put the extension inside the Git repository

- Request: fix the newly created repository that did not contain the extension code.
- Relocated the existing `.git` directory, license, Git attributes, logs, and empty `Change` file from the nested folder into the existing extension root. Preserved existing Git history and kept the extension source path unchanged.
- Updated root `AGENTS.md` and the quick log references. Added `.gitignore` for local backups, secrets, signing keys, downloaded packages, and OS/editor artifacts.
- Current layout: code, Git metadata, and both logs now share the `Job Application Tracker` root. Earlier entries below describe the historical nested layout and paths.
- Validation: checked destination collisions before moving, confirmed Git sees the extension files, and reran syntax/asset/regression checks. No remote exists; no commit or upload was performed.
- User follow-up: select the corrected folder in GitHub Desktop, review/commit files, then Publish repository.

## 2026-10-06 — Add quick-log navigation

- Added a table of contents to `CHANGES.md`, linking to its date heading and retrospective progress section using GitHub Markdown anchors.
- Updated both logs. Validation: checked each link against its existing heading; no extension code changed.
- Maintain the table of contents whenever a new dated section is added.

## 2026-10-06 — Rename the change logs

- Request: use `CHANGES.md` for the concise user log and `CHANGES_TECHNICAL.md` for the detailed assistant log.
- Renamed both files without removing their history. Updated their cross-references and `../AGENTS.md` to require both new filenames for every project change.
- Validation: confirmed both new files exist, the old `CHANGES_SUMMARY.md` is absent, and active instructions point to the correct logs. Historical references to the original names remain in the initial creation entry.
- No extension code or behavior changed.

## 2026-10-06 — Require both logs for future changes

- Request: update both change logs every time the assistant makes a project change.
- Added `../AGENTS.md` with a persistent requirement covering code, configuration, documentation, and instruction edits. Each task must update this detailed log and the concise log; file-free answers do not need entries.
- Validation: checked for existing project instructions before creating the file and updated both logs together. No extension behavior changed.

## 2026-10-06 — Retrospective baseline: progress so far

### Workspace and architecture

- Built a Chrome Manifest V3 extension, version 0.2.0, using HTML, CSS, and JavaScript. Application data lives in Chrome extension storage; there is no hosted backend or AI service.
- Current layout: the code and `manifest.json` are in the parent folder, `../`. This nested `Job Tracker Extension` folder contains the Git repository, license, and these logs. The source code still needs to be brought inside the repository before Git can track it; no files were moved as part of this logging task.
- Main files: `../manifest.json`, `../store.js`, `../popup.js`, `../dashboard.js`, `../background.js`.

### Capture and application dashboard

- Added saving listings from the extension popup, with editable role/company/link fields, a saved-jobs list, removal controls, and dashboard access above that list.
- Added autofill from structured JobPosting metadata, employer/page metadata, and conservative company-introduction rules. Handshake extraction identifies the selected detail panel and prefers the company-name link over an industry link.
- Added a dashboard with counts, search, status filtering, manual entry through a plus button, status changes, and deletion.
- Added a right-side job details window containing role, company, the listing link beneath the company, dates, status, next steps, email activity, and other activity/notes.
- Added inline edit controls, matching square pencil/close buttons, a fixed bottom save area, and cancellation that discards draft changes.
- Added editable role, company, job link, dates, status history, notes, next steps, and activity removal. Draft/saved changes have guarded undo; text fields retain native keyboard undo.
- Added trash icons at the top right of editable activity entries and next steps.
- Simplified the table Dates column to show the latest visible status transition and its date; detailed dates remain in the job window.
- Files: `../popup.js`, `../popup.html`, `../popup.css`, `../dashboard.js`, `../dashboard.html`, `../dashboard.css`, `../job-details.js`, `../manual-entry.js`, `../store.js`.

### Gmail search, matching, and review

- Added Google OAuth/Chrome Identity authorization and read-only Gmail access. Background checks run while Chrome is running, independently of an open dashboard.
- Added initial/on-demand checks, configurable periodic checks, a countdown to the next alarm, pending-review badges, and sidebar navigation to the Gmail section.
- Search normally covers the last 30 days, including archived mail, excluding spam/trash/sent, using job-related terms and normalized saved-company names. Ordinary checks fetch a newest page and an older backlog page, up to five candidates per page.
- Added general, case-insensitive local matching for explicit Applied, Interviewing, Offer, Rejected, and Withdrawn wording; company/role, saved links, and requisition IDs help identify an application. Uncertain matches offer a saved-application dropdown, ordered by compatible statuses and candidate relevance.
- Added full-body fallback when previews are incomplete; full bodies are processed locally, with only short excerpts retained.
- Added activity-only approval for relevant emails without a safe status transition, and support for attaching emails when the job already has the suggested status.
- Added next-step detection for assessments, interview scheduling, and recruiter replies, with reviewable deadlines. Action-bearing or uncertain suggestions remain manual-review items.
- Added examined-ID caching, bounded at 10,000 IDs. Application identity changes invalidate that cache and restart backlog pagination; ordinary notes/activity edits do not. Reviewed/queued messages remain deduplicated.
- Added a Rescan days field accepting 1–3650 days. Rescans traverse all matching pages, bypass examined-only caching, skip already suggested/recorded emails, show totals, and preserve ordinary pagination.
- Fixed restored-job approvals that returned early without clearing the pending suggestion. Scans now recognize email history/activity carried in backups.
- Files: `../background.js`, `../email-matcher.js`, `../gmail-message.js`, `../email-actions.js`, `../email-ui.js`, `../email-preferences.js`, `../email-links.js`, `../store.js`.

### Automatic approval and undo

- Added manual/default and automatic approval modes. Only new, strong, compatible status matches without uncertain matching or next-step actions can be automatically approved.
- Added a persisted stack for approvals and dismissals. Undo restores pending review and, for approvals, the prior job snapshot. Guards prevent overwriting newer job changes.
- Added availability-aware undo counts and hidden buttons when undo is unsafe; added dashboard Cmd+Z/Ctrl+Z outside open dialogs and editable controls.
- Added an Automatically added emails section, newest first, with subject, excerpt, Gmail link, date added, transition, and safe per-entry Undo. Storage changes refresh the open dashboard.
- Automatic approval metadata is stored with job email activity and survives backups. Earlier approvals without this marker are not retroactively identified as automatic.
- Files: `../store.js`, `../background.js`, `../email-ui.js`, `../dashboard.html`, `../backup.js`.

### Email subjects and backup/restore

- Changed job-panel email links to `Email: <subject>`, capped at 15 words, with the full subject on hover. Removed body previews from that panel; review/automatic-update cards still show excerpts.
- Added metadata retrieval for older history subjects while Gmail is connected. Missing subjects are stored on history entries when recovered.
- Added JSON export/restore for applications and settings, strict input validation, an import preview, and a styled file picker. Existing jobs win when duplicate IDs/URLs are restored.
- Preserved email history, subjects, short excerpts, dates, links, tasks, notes, and automatic markers. Export enriches older history subjects from available suggestion/activity records; validation accepts legacy subject fields.
- Backups exclude Google authorization tokens, pending/dismissed suggestion queues, examined-ID caches, and undo stacks. Restoring therefore requires reconnecting integrations; an older backup cannot contain subjects that were never saved into it.
- Files: `../backup.js`, `../backup-ui.js`, `../job-details.js`, `../store.js`, `../GMAIL_SETUP.md`.

### Settings, styling, sample mode, and Sheets

- Added a separate settings page using the same sidebar, with its gear icon at bottom left. Settings use rows rather than narrow cards.
- Added five color schemes with two-color circle selectors: cream/terracotta (default), white/green, warm gray/violet, slate/blue, and dark navy/lavender. Selected circles retain their selection indicator; mouse-click outlines elsewhere were reduced while keyboard focus remains supported.
- Added email approval mode, frequency controls, and optional restoration of backup settings.
- Refined sidebar sizing, anchor-scroll positioning, and a More coming soon indicator; removed the earlier dashboard tagline/profile-storage note.
- Added Google Sheets export: each export creates a new spreadsheet snapshot; it is not live synchronization.
- Added fictional sample applications, a sample automatic Fieldwork approval with Undo, and a separate sample settings page. Sample theme/email preferences use separate local keys; sample settings do not call real email or backup controllers. The fictional email link opens Gmail's inbox, not a real sample message.
- Removed Gemini fallback code after the decision to avoid it; autofill/matching remain local rules.
- Files: `../settings.html`, `../settings-sidebar.js`, `../theme.js`, `../themes.css`, `../email-settings-ui.js`, `../google-sheets.js`, `../sheets-ui.js`, `../dashboard-navigation.js`, `../sample-settings.html`, `../sample-settings.js`, `../dashboard.js`, `../email-ui.js`.

### Development identity and documentation

- Added a public manifest key for the consistent unpacked development extension ID `helbhmpfkpihpjkcdffkccmjjbjogapf`. No private signing key was saved in the project.
- Documented backup-before-ID-migration, matching the OAuth client's Application ID, reconnecting Gmail, and adding Google test users. The client ID/public key are identifiers; OAuth secrets/tokens must not be committed.
- Added setup documentation, email test examples, and project notes/TODOs. Discussed GitHub setup and MIT licensing; no public Chrome Web Store release or OAuth verification was performed by the assistant.
- Files: `../manifest.json`, `../GMAIL_SETUP.md`, `../EMAIL_TEST_CASES.md`, `../README.md`, `../project_log.md`.

### Validation and remaining work

- Ran JavaScript syntax checks, manifest/HTML asset-reference checks, and mocked JavaScriptCore regression tests covering matching, ambiguity, OAuth errors, alarms, pagination, examined caches, rescans, approval/dismissal, stale protection, restored deduplication, backup subjects, automatic flags, targeted undo, and sample-settings isolation.
- Regression harness used during development: `/tmp/job-tracker-email-check.py`; it is temporary, outside this repository, and not a committed test suite.
- Actual authenticated Chrome behavior, visual layout, cross-computer installation, and broader real-email coverage still require user testing. Do not interpret mocked checks as live Gmail or browser verification.
- Outstanding: place source files inside the repository, verify tester OAuth setup, complete migration/data checks, broaden matching/autofill testing, prepare privacy/verification materials, and prepare the public beta package/listing.

## 2026-10-06 — Added these change records

- Request: create a detailed assistant code log plus a concise dated user log, including progress so far.
- Added `CHANGES.md` and `CHANGES_SUMMARY.md` inside the existing repository without altering or moving extension code.
- Validation: reviewed the current source layout, relevant implementation files, and existing project notes; verified both new Markdown files exist.
- Follow-up: record future code changes in both logs using the format above.
