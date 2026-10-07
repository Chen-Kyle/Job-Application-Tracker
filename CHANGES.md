# Quick change log

Newest entries first. Details are in `CHANGES_TECHNICAL.md`; future ideas remain in `project_log.md`.

## Table of contents

- [2026-10-07](#2026-10-07)
- [2026-10-06](#2026-10-06)
- [Progress through 2026-10-06](#progress-through-2026-10-06)

## 2026-10-07

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
