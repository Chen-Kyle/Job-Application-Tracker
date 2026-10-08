# Technical change log

This is the detailed engineering record for assistant-made changes. See `CHANGES.md` for the quick version and `docs/project_log.md` for ideas and TODOs.

## How to maintain this log

- Add a dated entry for each future code change, newest first, using America/New_York dates.
- Record the user request, resulting behavior, affected files, validation performed, and remaining limitations or follow-up work.
- Distinguish implemented code from verified browser behavior and external setup completed by the user.
- Update the short log with a brief matching entry. Do not include tokens, private keys, personal email contents, or backup data.
- Entries below are a retrospective baseline, not a commit-by-commit history. The initial work spans October 4–6; exact dates of earlier individual changes were not recorded.

## 2026-10-07 — Fix clipped filters menu

- Request: menu cut off at the applications panel bottom; remove Clear filters.
- Scoped visible overflow to the applications workspace so its dropdown can extend over subsequent sections; retained table horizontal scrolling/rounded edges. Menu has viewport-bounded height with internal scrolling. Removed Clear filters markup and its event binding; clicking an active quick filter still turns it off.
- Files: dashboard.html, dashboard.js, dashboard.css and both logs.
- Validation: Node suite/path/syntax checks and diff check. Cause confirmed from workspace overflow:hidden; no live browser test performed.

## 2026-10-07 — Collapsible dashboard filter controls

- Request: hide quick filters, Clear filters and Pending steps first under a filter icon button.
- Moved existing controls into a native details disclosure beside status selector, with filter SVG and visible Filters label. Menu collapsed initially; choices retain their handlers, persisted state and reminder-only pending-sort visibility. Popup styled as distinct theme-aware panel.
- Files: dashboard.html, styles/dashboard.css and both logs.
- Validation: Node suite/path checks and diff check. No live browser test performed.

## 2026-10-07 — Public beta progress and launch checklist

- Request: update progress toward public beta and create the next-action checklist.
- Added newest project-log assessment: feature foundation complete and ready for invited testing, with public release validation/approvals unconfirmed. Listed implemented capabilities separately from unchecked fresh-install/integration/privacy/packaging/store steps. Marked older beta TODO superseded rather than claiming external actions completed.
- Official Chrome/Google references checked for developer registration, privacy disclosures, OAuth audience limits and restricted-scope verification; no assumed launch percentage or paid security-assessment requirement. Documented optional local-only launch scope and final item ID/OAuth migration checks.
- Files: docs/project_log.md and both change logs. Validation: documentation diff check; no runtime changes or external configuration/submission performed.

## 2026-10-07 — Quick filters and persistent dashboard preferences

- Request: three quick filters and preserve sorting/filter choices after reopening.
- Added mutually exclusive toggle buttons for unfinished next steps, Interviewing status (Upcoming interviews), and Applied status (Awaiting response), plus Clear filters. Quick-filter selection clears the status dropdown to avoid conflicting statuses; search still combines with filters. Needs action overview card shares the quick-filter state. Task quick filter available even with reminder badges disabled.
- Added validated DashboardPreferences helper; persist column/direction, quick filter, search, status dropdown and pending-first toggle in chrome.storage.local, with separate sample localStorage. Load before initial job rendering and on sample-mode switches. Reminder-disabled views still suppress pending-first priority. View preferences are local UI state and currently not included in JSON backups.
- Files: dashboard-preferences.js, dashboard.js, dashboard.html, dashboard.css, dashboard-preferences.test.cjs and both logs.
- Validation: Node regression suite covers persistence, sample isolation and invalid preference normalization; path/syntax and diff checks. No live browser test performed. Upcoming interviews means Interviewing status, not a scheduled interview date; Awaiting response means Applied, not inferred recruiter reply state.

## 2026-10-07 — Application deletion undo and duplicate detection

- Request: recover accidentally deleted applications and warn about already tracked listings.
- Store deletion now atomically retains up to 20 full application snapshots in local storage. Dashboard/popup Undo application deletion button restores the newest recoverable record, including history, notes, next steps, email activity and recruiter conversations. Sample deletion uses an isolated in-memory stack. Undo skips entries conflicting with a newly saved ID/link; recovery survives reload for real data and remains excluded from backups.
- Shared listingKey strips fragments, trailing slash and common tracking parameters, sorts query parameters, preserves identifying query values. Store/popup/manual-entry sample checks prevent duplicate saves. Popup warns on opening a tracked listing and existing submit warnings remain. Matching is URL-based; distinct platform URLs for the same role are not assumed duplicates.
- Files: store.js, deletion-undo.js, dashboard.js, manual-entry.js, popup.js, dashboard/popup HTML and CSS, application-recovery.test.cjs and both logs.
- Validation: Node suite covers full snapshot round-trip across reload, tracking variants, distinct IDs and resave conflicts; diff checks. No live browser test performed. Recovery uses an explicit button; application deletion does not intercept native text undo.

## 2026-10-07 — Restore reminder save confirmation

- Request: add back the saved message for next-step reminders.
- Successful saves again show “Reminder setting saved.” in real and sample settings. Persistence and failure feedback unchanged.
- Files: reminder-settings.js and both logs.
- Validation: reminder settings regression test and diff check; no live browser test.

## 2026-10-07 — Quiet reminder preference saving

- Request: remove the reminder setting saved message and confirm persistence.
- Successful saves clear the feedback text instead of announcing confirmation; failure feedback retained. Real reminder settings still persist via chrome.storage.local; sample preferences remain separate in localStorage. Appearance and email preference persistence unchanged.
- Files: reminder-settings.js and both logs.
- Validation: reminder settings persistence/sample-isolation regression test and diff check; no live browser test.

## 2026-10-07 — Explicit pending-step sorting button

- Clarification: prioritize pending jobs only by clicking a button; button appears only with reminders enabled.
- Added Pending steps first toolbar toggle (aria-pressed), initially inactive. Reminders alone no longer reorder rows. Toggle sorts unfinished-step jobs first while retaining every matching job and the chosen column sorting within groups. Second click removes prioritization; disabling reminders or switching sample mode resets it. Existing Needs action card remains a separate pending-only filter.
- Files: dashboard.html, dashboard.js, dashboard.css and both logs.
- Validation: Node regression suite, existing priority/direction checks and diff checks. No live browser test performed.

## 2026-10-07 — Prioritize applications with pending next steps

- Request: sort next steps to the top of the application list.
- With next-step reminders enabled, jobs with unfinished steps precede all other jobs. Existing default or selected Role/Company/Status/Dates sorting applies within each group, including reversed order. Completed-only jobs receive no priority. Disabling reminders restores ordinary sorting; no stored job order or next-step data changes.
- Files: job-sort.js, dashboard.js, tests/job-sort.test.cjs and both logs.
- Validation: Node regression suite including both directions, default order and disabled priority; diff checks. No live browser test performed.

## 2026-10-07 — Optional next-step reminders setting

- Request: toggle next-step reminders on in Settings.
- Added unchecked-by-default checkbox to real/sample settings and shared preference controller. Real preference persists in extension storage; sample uses its own localStorage key. Dashboard badges, urgency labels and Needs action card hidden when off; disabling clears the pending-step filter without removing tasks. Normal deadlines/checkboxes remain. Open dashboard responds to storage changes; overview returns to four cards when disabled.
- JSON backups preserve the optional boolean setting; old backups remain valid and do not overwrite it when absent. Restore applies it only when Restore backup's settings is selected.
- Files: reminder-settings.js, dashboard/settings/sample-settings HTML, dashboard.js, job-details.js, dashboard.css, backup.js, reminder-settings.test.cjs and both logs.
- Validation: Node regression suite including default-off persistence/sample isolation and path checks; diff checks. No live browser test performed.

## 2026-10-07 — Dashboard next-step reminders

- Request: try dashboard reminders for pending next steps.
- Added shared local-calendar helper for unfinished-step summaries, urgency labels and deadline ordering. Row badges distinguish overdue/due today/tomorrow/upcoming/undated; completed steps excluded. Job detail steps remain editable with source links and checkboxes, now with reminder labels; unfinished tasks ordered before completed ones.
- Added Needs action overview button counting jobs (not tasks); toggles a filter combined with existing search/status/sort. Date labels refresh at day changes and when returning to the dashboard. Sample dashboard includes four fictional reminder cases. No notification permissions or external services added.
- Files: step-reminders.js, dashboard.js, job-details.js, dashboard.html, dashboard.css, tests/step-reminders.test.cjs and both logs.
- Validation: Node suite including calendar boundaries, invalid dates, completion exclusion, urgency ordering and sample/path checks; diff checks. No live browser or screen-reader test performed. Reminder urgency is based on viewer local calendar dates, not exact hours.

## 2026-10-07 — Sort dates by latest status change

- Request: sortable Dates based on most recent status change.
- Added Dates heading button and newest-first → oldest-first → default cycle. Shared helper drives both visible date and comparator: latest valid non-deleted from/to transition, fallback applied date for Applied or saved date. Notes edits, same-status email activity and deleted history do not affect ordering. Existing filters retained, Activity unsortable.
- Files: dashboard.html, dashboard.js, job-sort.js, tests/job-sort.test.cjs and both logs.
- Validation: Node suite covers history out of order, deleted/same-status events, fallbacks and direction cycle; diff check. No live browser test performed.

## 2026-10-07 — Third-click sorting reset

- Request: third click on a sorting heading restores the normal dashboard order.
- Role, Company and Status now cycle ascending → descending → default newest-saved-first. Existing search/status filters remain; changing heading starts ascending. Existing render removes arrows/aria-sort when reset; accessible action labels describe the reset.
- Files: job-sort.js, dashboard.js, tests/job-sort.test.cjs and both logs.
- Validation: Node regression suite including three-click cycles for all headings and restored date ordering; diff checks. No live browser test performed.

## 2026-10-07 — Separate role and company sorting controls

- Request: try the separate Role and Company sorting choices.
- Kept the shared column and made each heading word independently clickable. Company uses case-insensitive alphabetical sorting with repeat-click reversal and newest-saved tie breaks, like Role. Arrow stays beside the selected word; shared column aria-sort and button action labels track state. Existing status sorting preserved.
- Files: dashboard.html, dashboard.js, job-sort.js, tests/job-sort.test.cjs and both logs.
- Validation: Node regression suite and diff checks; no live browser test performed.

## 2026-10-07 — Sort application table by role and status

- Request: sortable job role/status only, meaningful status order and direction toggles.
- Added JobSort helper and header buttons. First click sorts role A–Z or Saved → Applied → Interviewing → Offer → Rejected → Withdrawn; repeat reverses. Arrow indicators and aria-sort track the active column. Company, Dates and Activity remain plain headings. Default newest-saved order retained; ties use newest saved first. Search/filter/data refresh preserve sorting for the open page; reload resets it.
- Files: dashboard.html, dashboard.js, job-sort.js, styles/dashboard.css, tests/job-sort.test.cjs and both logs.
- Validation: Node regression suite and diff checks; no live browser test performed.

## 2026-10-07 — Recruiter autocomplete dropdown

- Request: search-style dropdown with arrow keys between recruiter suggestions.
- Replaced native datalist with a themed combobox/listbox under the email field. Names, addresses and contact source appear per row. Up/Down wraps options, Enter selects without submitting, Escape closes without closing the details dialog; click selection, blur/Tab dismissal and composition guard included. ARIA expanded/selected/active descendant reflect state. Existing saved/Gmail cache sources retained.
- Files: recruiter-autocomplete.js, recruiter-ui.js, styles/dashboard.css, recruiter-autocomplete.test.cjs and both logs.
- Validation: Node suite including keyboard/filter/dismissal regression; diff checks. No live browser or screen-reader test performed.

## 2026-10-07 — Exclude job recommendation emails

- Request: exclude recommendation emails that match a saved company/role but do not confirm an application.
- Added a shared recommendation wording guard in both matcher entry points, including profile matches, recommended jobs and job alerts. Explicit classified application/status updates remain eligible even with recommendation footers; no sender-specific block.
- Files: scripts/email/email-matcher.js and tests/email-recommendations.test.cjs, plus both logs.
- Validation: Node regression suite and diff checks. No live Gmail/browser test. Existing queued suggestions are unchanged and can be dismissed; unrecognized recommendation wording may still require dismissal.

## 2026-10-07 — Recruiter email autocomplete

- Request: suggestions from both saved recruiter contacts and recent Gmail correspondents.
- Added native datalist autocomplete that filters names/addresses locally and fills a known name when an address is selected. Saved contacts from all jobs take priority; sample mode uses fictional contacts only.
- Added account-scoped 24-hour contact cache, populated on field focus from headers of up to 50 recent messages (last 30 days, including sent mail). Five concurrent metadata reads; exclude the account address and common automated senders. No per-keystroke Gmail calls. Disconnection/account changes clear the cache; cache stays out of backups.
- New recruiter modules, HTML/worker dependencies and UI updated. Existing read-only authorization sufficient. Correspondents are suggestions, not verified recruiters; attachments still require explicit selection.
- Validation: Node regression/path suite, header parsing/cache tests, existing mocked email checks and diff checks; no live Gmail/browser test performed. Native autocomplete appearance depends on Chrome; failed Gmail lookup leaves saved-contact suggestions available.

## 2026-10-07 — Sample recruiter threads and chronological previews

- Request: attach fictional recruiter conversations in sample jobs; display newest messages at top, oldest at bottom.
- Added role-specific sample contacts and two attachable three-message fixtures (scheduling and follow-up). Sample Find conversations reads only fixtures; refresh never accesses real Gmail. Expanded attached chains show ordered sender/date/excerpt previews.
- Real recruiter summaries now retain bounded message metadata/excerpts and sort newest first; shared validation/backup round-trip preserves this optional field. Older summaries remain valid. Full bodies/attachments remain in Gmail.
- Validation: full Node suite, mocked legacy email regressions, syntax/assets and diff checks. No authenticated Gmail or browser visual test performed.

## 2026-10-07 — Sample job-description links

- Request: add fake job-description links to sample roles.
- `scripts/dashboard/dashboard.js`: generate distinct example.com job URLs from each sample company/role so the existing job-panel link and URL editor work in sample mode. These are fictional placeholders, not actual listing pages.
- Validation: Node regression/path suite, existing mocked email regression and diff checks. No real data modified.

## 2026-10-07 — Multiple sample email approvals

- Request: provide sample dashboard examples to approve.
- `scripts/email/email-ui.js`: four fictional suggestions targeting distinct sample jobs (Applied, Interviewing, Offer and activity-only). Track review decisions per suggestion rather than one shared flag; undo restores the corresponding suggestion and job. Approved examples retain subjects and activity summaries in sample records; only status suggestions produce status history. Existing manual status override works for all matched samples. No real inbox read or storage write introduced.
- Validation: script syntax, full Node regression/path suite, existing email regression harness and diff checks. No live browser test performed.

## 2026-10-07 — Recruiter contacts and conversation references

- Request: implement the first version of job-specific recruiter contacts and separately attached email conversations.
- New `scripts/recruiters/`: shared strict contact/summary validation, read-only Gmail thread lookup including sent mail (20 search results, five concurrent reads), and job-panel UI. Show subject, latest direction/date, last SENT-labeled message date, last refreshed timestamp, thread link and Gmail compose link. Users explicitly attach threads to avoid matching a recruiter’s unrelated roles. Refresh attached threads manually; no background contact scans or sending permission added.
- `job-details.js`, `store.js`: contacts and attachment changes use existing draft/save/cancel and guarded snapshot undo. Search/refresh rejects stale panel operations; refresh writes metadata without changing status history or status email activity. Limit 20 contacts and 30 conversation summaries per contact. Sample mode edits fictional/local contacts but never queries real Gmail.
- `backup.js`: validate and preserve contacts and thread summaries in existing version-1 backups; legacy backups remain valid. Gmail authorization remains excluded. Updated page load order, worker imports/message reply data, code guide, setup guide, README and backup explanations.
- Tests: recruiter sent/received date separation, explicit-address matching, draft exclusion, sent-inclusive lookup with no status mutation, backup round-trip, guarded snapshot undo, invalid input/account rejection and load-path coverage and mocked UI contact/search/attachment interactions; existing rescan/matching/approval checks retained. No authenticated browser/Gmail test performed.
- Limits: preserves metadata and links, not a full offline archive. Thread searches return up to 20 results and attached summaries refresh manually. Gmail labeling determines sent direction; no contact matching or job status inference is triggered by attaching conversations. Existing account must be connected to refresh.

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
