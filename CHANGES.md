# Quick change log

Newest entries first. Details are in `CHANGES_TECHNICAL.md`; future ideas remain in `docs/project_log.md`.

## Table of contents

- [2026-10-08](#2026-10-08)
- [2026-10-07](#2026-10-07)
- [2026-10-06](#2026-10-06)
- [Progress through 2026-10-06](#progress-through-2026-10-06)

## 2026-10-08

- Email suggestions now offer a status selector after choosing a job, defaulting to the recommended status (or the current status).

- Status filter now uses the same dropdown style as Filters.

- Removed the explanation beneath Application outcomes.

- Removed the period/week explanation beneath Applications over time.

- Added daily application counts to the Analytics chart.

- Added Analytics between Gmail and Google Sheets: weekly/monthly applications, current outcomes and pending/due-soon/overdue next steps.

- Restored visible destination domains beside job links, keeping full URLs on hover.

- Kept job-link text compact; the full destination address appears only when hovering over the link.

- Job-description links now show their destination domain and reveal the full URL on hover, in job details and the popup.

- Filters dropdown now closes when clicking outside it.

## 2026-10-07

- Fixed the Filters menu being clipped by short application lists and removed Clear filters; cleaned up the related script formatting.

- Moved quick filters and Pending steps first into a collapsed Filters icon menu in the dashboard toolbar.

- Updated beta readiness in the project log and added a prioritized public beta launch checklist covering testing, privacy, Google authorization and store submission.

- Added Needs action, Upcoming interviews and Awaiting response quick filters; dashboard sorting, search and filters now persist across reloads, separately for sample mode.

- Added persistent undo for application deletion and stronger duplicate-link warnings that ignore common tracking parameters.

- Restored the confirmation message after saving the next-step reminder setting.

- Removed the next-step reminder save confirmation; the preference still saves automatically.

- Replaced automatic pending-step prioritization with a “Pending steps first” sorting button, visible only when reminders are enabled.

- Jobs with unfinished next steps now appear first when reminders are enabled; selected sorting applies within each group.

- Made next-step reminders optional in Settings, off by default, with separate sample preferences and backup support.

- Added next-step reminder badges, a Needs action dashboard filter, deadline labels in job details, and sample reminders to preview.

- Added Dates sorting by latest status change: newest first, oldest first, then default saved-date order.

- Sorting now cycles through ascending, descending, then the default newest-saved-first order on the third click.

- Made Role and Company separate sorting buttons within their shared table column.

- Added clickable Role and Status headings with reversible sorting and direction arrows; status follows application stages.

- Changed recruiter autocomplete to a themed name/address dropdown with arrow-key navigation, Enter selection, and Escape dismissal.

- Excluded job recommendations and job alerts from email suggestions while keeping explicit application confirmations and interview updates.

- Added recruiter email autocomplete from saved contacts and locally cached recent Gmail correspondents; selecting a known address fills its name.

- Added fictional recruiter conversation examples to sample roles and expandable email previews ordered newest first, oldest at the bottom.

- Added distinct placeholder job-description links to all sample applications.

- Added four fictional sample emails for application confirmation, interview, offer, and activity-only approval; each can be approved, dismissed, overridden, and undone independently.

- Added recruiter contacts and manually attached Gmail conversations per job, separate from status email activity, with last-message/last-sent dates, Gmail links, refresh, undo, and backup support.

- Resumed automatic commits and pushes; committed the style/documentation organization and manual email status override together.

- Added a manual status override before approving an email matched to an application. Changes remain local.

- Moved CSS into `styles/` and supporting guides into `docs/`; updated page and documentation references. Changes remain local, as requested.

- Organized JavaScript into feature directories, formatted scripts for readability, updated all page/worker paths, and added a code guide and path checks.

- Set the feedback and bug-report address to kylechenapps@gmail.com and removed the placeholder notice.

- Added a feedback and bug-report section at the bottom of the dashboard with a labeled placeholder support email and a prefilled email template.

## 2026-10-06

- Removed the First-time setup dropdown from Google Sheets export.

- Added collapsible Info explanations to Email updates and Backup and restore in real and sample settings.

- Moved the Gmail Info control to the right of “Email suggestions.”

- Moved Gmail timing, check results, and explanatory text into a collapsed Info section; aligned rescan progress with the other content.

- Sped up rescans with larger batches, five concurrent email reads, and prompt continuation; shortened the progress text.

- Email rescans now save progress and continue in background batches after closing the dashboard or restarting Chrome.
- Email check results distinguish unmatched, previously checked, and already suggested emails, with live rescan progress and retry support.

- Added automatic commit-and-push instructions for completed requested changes, with checks and both logs updated first.
- Rewrote the README with a clear project overview, features, sample walkthrough, installation steps, and privacy information for first-time readers.

- Fixed the repository layout so Git tracks the actual extension code; added backup/secret exclusions.

- Added a table of contents with links to the dated sections.
- Renamed the quick log to `CHANGES.md` and the detailed log to `CHANGES_TECHNICAL.md`; future changes still update both.

- Added a project instruction requiring both change logs to be updated with every future project change.
- Added an automatically updated emails section with email details and Undo.
- Added a fictional automatic approval and separate settings for the sample dashboard.
- Created detailed and quick change logs.

## Progress through 2026-10-06

Earlier work is summarized here because exact dates were not recorded for every change.

- Save jobs with autofill, manually add jobs, search/filter them, and update statuses.
- Open a job details window to edit information, notes, activity, and next steps.
- Review Gmail suggestions or automatically approve strong matches; undo approvals and dismissals.
- Skip examined emails, reconsider them when job details change, and rescan a chosen number of days.
- Back up jobs/settings and saved email information; export applications to Google Sheets.
- Choose color themes and email settings on a separate settings page.
- Added a consistent development extension ID for sharing with testers.

Still to finish: test with other users, and complete privacy/OAuth verification and publishing preparation.
