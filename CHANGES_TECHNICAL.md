# Technical change log

This is the detailed engineering record for assistant-made changes. See `CHANGES.md` for the quick version and `docs/project_log.md` for ideas and TODOs.

## How to maintain this log

- Add a dated entry for each future code change, newest first, using America/New_York dates.
- Record the user request, resulting behavior, affected files, validation performed, and remaining limitations or follow-up work.
- Distinguish implemented code from verified browser behavior and external setup completed by the user.
- Update the short log with a brief matching entry. Do not include tokens, private keys, personal email contents, or backup data.
- Entries below are a retrospective baseline, not a commit-by-commit history. The initial work spans October 4–6; exact dates of earlier individual changes were not recorded.

## 2026-10-21 — Remove application deletion undo button

- Request: remove the Undo application deletion button and explain undo stack limits.
- `dashboard.html`, `popup.html`: stop loading its UI controller. `scripts/dashboard/dashboard.js`: remove sample deletion callback to unloaded controller. `scripts/popup/popup.js`: remove message directing users to the removed control. Stored recovery functions/history remain unchanged; no other undo behavior modified. Both logs updated; date navigation retained.
- Audit: real application-deletion recovery is capped at 20 snapshots; email and job-details undo arrays have no fixed item caps. Draft history resets when editing ends; in-memory histories reset with page reload.
- Validation: all 66 existing Node tests pass, including deletion recovery and script/asset checks; reviewed diff and whitespace. Guidance lookup performed; no browser visual test performed.

## 2026-10-21 — Top-positioned Add next step button

- Request: move Add next step above all next steps and make it a button.
- `dashboard.html`: replace the details/summary disclosure with a native button and hidden form, and place the editor before the list. `scripts/dashboard/job-details.js`: toggle form visibility with aria-expanded/aria-controls, focus the Action input on opening, and collapse when leaving edit mode. Existing edit/save workflow retained. `styles/themes.css`: adjust editor spacing above the list. Both logs updated; existing date link retained.
- Validation: all 66 existing Node tests pass, including script/asset checks; diff whitespace reviewed. Required web-guidance search performed. No live browser visual testing performed.

## 2026-10-21 — Consistent settings email badge

- Request: fix Settings showing two pending notifications that disappear upon opening Gmail review.
- Root cause: settings counted raw pending records while dashboard excluded recommendation/task notifications using shared filtering.
- `settings.html`, `scripts/settings/settings-sidebar.js`: load the shared matcher before sidebar rendering and count EmailMatcher.pendingSuggestions, matching dashboard review cards, badge visibility and accessible summary. Preserve stored review history.
- `tests/settings-email-badge.test.cjs`: reproduce excluded records yielding zero visible count and verify storage updates display a genuine pending suggestion. `tests/project-paths.test.cjs`: enforce matcher-before-sidebar dependency. Both logs updated; existing dated contents link retained.
- Validation: all 66 Node tests pass, including integration-style settings render and script/asset checks; diff reviewed and whitespace checked. Guidance lookup performed. No live Chrome testing performed. Refresh Settings after extension reload to load the new dependency.

## 2026-10-21 — Two additional appearance themes

- Request: add two color schemes.
- `styles/themes.css`: define rose light and amber dark palettes, native color-scheme values and picker swatches using existing theme variables. Fixed contrasting foregrounds retain Chrome 120 compatibility.
- `settings.html`, `sample-settings.html`: add named radio options in both settings views. `scripts/core/theme.js` and `scripts/backup/backup.js`: accept both theme IDs for persistence and backup validation. Both change logs updated; existing dated contents link retained.
- Validation: all 65 existing Node tests pass; checked new IDs in both pickers and allowlists, and programmatically verified text/card, muted/card, accent/card, button/accent and sidebar-text/sidebar-item contrast at least 4.5:1 for both palettes. Guidance read; diff whitespace checked. No live browser visual testing performed. Existing theme choice/default remain unchanged until a new theme is selected.

## 2026-10-21 — Delete temporary Activity layout backup

- Request: delete the Activity-column removal backup and retain the column removal.
- Deleted only ignored local backups/2026-10-21-before-removing-activity-column/, including its snapshots and restoration note. Dashboard code remains unchanged. Both logs updated; existing dated contents link retained.
- Validation: confirmed backup directory no longer exists and Activity header/row cell remain absent; diff whitespace checked. No application data deleted; no browser test needed for backup cleanup. Earlier log entries describe the backup when it existed.

## 2026-10-21 — Red next-step dot

- Request: make the next-step dot red.
- `styles/dashboard.css`: set its background to #dc2626. Both change logs updated; existing dated contents link retained.
- Validation: reviewed the one-property CSS change and diff whitespace. No browser visual test performed; no logic changes or new tests needed.

## 2026-10-21 — Left-side next-step indicator gutter

- Request: enlarge left spacing for role/company names so the action indicator can sit on the left.
- `styles/dashboard.css`: reserve 28px of inline-start padding for every dashboard job button, align role/company/reminder content together, and position the existing 7px dot in the left gutter beside the first role line. Scoped selector overrides shared theme button padding. Existing accessible next-step description remains intact.
- Both logs updated; existing dated contents link retained.
- Validation: all 65 existing Node tests pass, including script/asset checks; reviewed CSS cascade and diff whitespace. Required guidance search performed. No live browser visual test performed. The earlier Activity-column backup remains available; this adjustment is separately reversible in Git.

## 2026-10-21 — Remove Activity column with restoration backup

- Request: try removing the Activity column and keep a backup to undo the layout change.
- `dashboard.html`, `scripts/dashboard/dashboard.js`: remove the Activity header and row cell/rendering. Retain underlying status history, email activity, and job-details views. No application data changes.
- Before editing, copied both affected files to ignored local `backups/2026-10-21-before-removing-activity-column/`, with RESTORE.md instructions. Prior layout also exists in Git commit d393720. Backup is not published; restoring full snapshots after future edits can replace those edits.
- Both logs updated; existing dated contents link retained. Validation: all 65 Node tests pass, including JavaScript parsing and page asset checks; diff reviewed and whitespace checked. Required web-guidance search performed. No live browser visual test performed.

## 2026-10-21 — Next-step indicators and deadline ordering

- Request: show a small dot for needed next steps and order Action needed results by urgency.
- `scripts/dashboard/dashboard.js`, `styles/dashboard.css`: add a 7px theme-colored role dot whenever unfinished tasks exist, with a tooltip and accessible button description. While Needs action is active, prioritize earliest unfinished deadline and display it in Dates; remove misleading active column-sort indicators. Existing column preferences are retained for other views and tie-breaking.
- `scripts/dashboard/step-reminders.js`: shared nextDeadline and compareJobs helpers ignore completed tasks and invalid dates, place overdue/earlier dates first and undated tasks last.
- `tests/step-reminders.test.cjs`: verify multiple tasks, completed/invalid dates, overdue/upcoming order and undated ties. Both logs and contents navigation updated.
- Validation: all 65 Node tests pass, including syntax/assets; reviewed diff and whitespace. Required web-guidance lookup performed. No live Chrome visual testing performed.
- Limits: dot reflects existing nextSteps data; no new deadline inference. Existing reminder feature settings still govern access to the Needs action filter. Saved job data/order are unchanged.

## 2026-10-19 — Corroborated employer branding fallback

- Request: capture a missing employer name on an employer-owned internship page without JobPosting metadata.
- `scripts/popup/popup.js`: add a conservative generic fallback using logo alt text only when it agrees with a delimited employer prefix in a careers/internship page title. Normalize whitespace including nonbreaking spaces. Preserve structured employer data and explicit job-title employer priority; reject generic branding and unrelated logos. No company/domain hardcoding or added permissions.
- `tests/job-extraction.test.cjs`: cover title delimiters, nonbreaking spaces, structured employer priority, missing/mismatched logos, generic labels, and non-careers pages. Both logs updated with existing dated contents link retained.
- Validation: inspected downloaded public page HTML; actual extraction function using its title/logo attributes in a mocked DOM returns D. E. Shaw Research. All 64 Node tests pass, including syntax/path checks. Diff whitespace checked. Required guidance search returned no applicable metadata guide.
- Limits: no live Chrome popup test performed. Pages without corroborating metadata may still require manual company entry; existing saved records are unchanged.

## 2026-10-19 — Recognize job application receipt wording

- Request: detect a missed application receipt sent through a recruiting platform.
- `scripts/email/email-matcher.js`: allow the optional word job in received-your-application confirmations, retaining existing employer matching and review safeguards. Recognition lets the existing worker full-body fallback run when the preview lacks employer identity.
- `tests/email-recommendations.test.cjs`: fictional regression covers unidentified preview requiring selection, employer identity resolved from body/signature, have/contraction variants and negative/future/non-application wording. No supplied personal email contents recorded.
- Both logs updated; dated contents link retained. Validation: reproduced missed classification before fix; all 62 Node tests pass, including syntax/assets and background rescan regression. Diff whitespace checked; guidance search returned no applicable text-classification guide.
- Limits: no authenticated Gmail/browser testing performed. Previously examined messages require a user rescan. A saved application and adequate identity evidence are still required for a unique match; ambiguous matches remain reviewable.

## 2026-10-19 — Embedded iCIMS job metadata

- Request: fix missing employer autofill on an iCIMS listing using a general approach.
- Root cause: the outer careers wrapper has no JobPosting; the same-origin embedded job document contains the structured employer and role.
- `scripts/popup/popup.js`: read JobPosting metadata from accessible iframe documents as well as the top page. Preserve top-page posting priority, guard unavailable/cross-origin documents, deduplicate documents and cap traversal depth. No additional permissions, network calls or employer-specific rules.
- `tests/job-extraction.test.cjs`: cover embedded/nested postings, blocked/unloaded frames, top-level priority and cyclic documents. Both logs updated; existing contents link retained.
- Validation: downloaded the public wrapper and embedded HTML; actual extraction function against downloaded frame JSON-LD in a mocked DOM returns BerryDunn and the correct internship title. All 61 Node tests pass; reviewed diff and whitespace. Required guidance search returned no applicable metadata extraction guide.
- Limits: no live Chrome popup test performed. Frames must already be loaded and accessible under same-origin rules; cross-origin frames remain unsupported. Existing records are not retroactively edited.

## 2026-10-19 — Greenhouse employer extraction fallback

- Request: fix missing company capture on Greenhouse with a general solution rather than an employer-specific exception.
- Root cause: a role-only og:title prevented checking document.title, which included the employer in the standard Job Application for … at … format.
- `scripts/popup/popup.js`: independently check both title sources; prioritize explicit title employer evidence over heuristic company-introduction parsing while keeping structured hiringOrganization data first. No permissions or network calls added to capture.
- `tests/job-extraction.test.cjs`: regression cases for modern/legacy/EU Greenhouse hosts, multiple company names, independent title sources, structured-data priority, and safe blank fallback. Both logs updated; existing dated contents link retained.
- Validation: regression reproduced before fix; all 58 Node tests pass afterward. Downloaded public listing HTML and ran the actual extraction function against its title/metadata in a mocked DOM, confirming Muon Space and the correct role/link. Diff whitespace checked. Required guidance search found no applicable extraction guide.
- Limits: no live Chrome popup test performed. Custom templates without supported employer metadata may still require manual correction; company names are not guessed from URL slugs. Existing saved records are not retroactively changed.

## 2026-10-19 — Recheck saved suggestions and exclude career promotions

- Request: prevent previously saved automated notifications and general career promotions from appearing as application suggestions.
- `scripts/email/email-matcher.js`: add career-promotion wording to recommendation exclusions while retaining explicit status-update exceptions. Add shared pendingSuggestions filtering to recheck stored previews against current exclusions.
- `dashboard.html`, `scripts/email/email-ui.js`: load the shared matcher before email UI and use it for pending cards/counts, including suggestions saved before filter changes. Stored records, prior approvals and undo history remain intact; no migration or mailbox changes.
- `tests/email-recommendations.test.cjs`, `tests/project-paths.test.cjs`: fictional marketing and genuine-update cases, persisted queue filtering/nonmutation, and matcher dependency ordering.
- Updated both logs and dated contents link. Validation: all 55 Node tests pass, including script syntax and local assets/imports; reviewed diff and whitespace. Required web-guidance search returned no applicable filtering guide.
- Limits: no live browser/Gmail test performed. Existing dashboards must be refreshed after extension reload. Filtering uses stored previews, so wording outside retained snippets may need additional coverage. Already approved activity is not retroactively removed. No personal email contents recorded.

## 2026-10-18 — Exclude ChatGPT task notifications

- Request: prevent automated task-result emails from being detected as application activity.
- `scripts/email/email-matcher.js`: exclude the exact automated ChatGPT notification sender before status classification, including when notifications quote application-confirmation wording. Normalize address case and support display-name and bare-address formats. Do not block employer mail based on display names or task-related subject wording.
- `tests/email-recommendations.test.cjs`: fictional regression cases cover sender formats, quoted confirmations, and similarly named senders that remain eligible.
- Updated both change logs; the existing date contents link remains valid.
- Validation: all 53 Node tests pass, including parsing/path checks; diff whitespace checked. No authenticated browser/Gmail testing performed.
- Limits: existing queued suggestions require dismissal; sender exclusion applies to automatic matching, not manual email attachment. No personal email contents recorded.

## 2026-10-18 — Exclude additional job recommendation templates

- Request: exclude job recommendations mistakenly suggested as application activity.
- `scripts/email/email-matcher.js`: expand recommendation detection to new-job-match wording and role/job/position descriptions that match recipient preferences. Preserve explicit status confirmations through the existing classification exception; no sender-specific blocklist.
- `tests/email-recommendations.test.cjs`: use fictional examples to cover snippets, full bodies, subjects, singular/plural match notifications, and genuine confirmations/interviews with recommendation footers. No personal email contents recorded.
- `CHANGES.md`: add matching summary and dated contents link.
- Validation: reproduced the preference-template false positive before the fix; all 51 Node tests pass afterward, including script parsing and asset/path checks. Web-guidance search returned no applicable text-classification guide. Diff whitespace checked before commit.
- Limits: no authenticated browser/Gmail test performed. Existing queued suggestions are not retroactively removed and can be dismissed. Rule-based filtering may need additional wording coverage in future.

## 2026-10-12 — Remove screenshot explanation blocks

- Request: remove About these screenshots sections throughout the guide.
- Removed repeated screenshot explanation blocks and the contents-page About the pictures block from the PDF, plus the equivalent introductory screenshot note in Markdown. Retained instructional captions and section links.
- Files: quick-start PDF, docs/QUICK_START.md and both logs.
- Validation: regenerated PDF and checked diff whitespace; no application code changed.

## 2026-10-12 — Quick-start contents and first job

- Request: add table of contents and explain how to save a job initially.
- Expanded usage PDF to seven pages with six internal section links, back-to-contents links and an opening save-job walkthrough using the prior annotated extension-menu image. Covers opening a listing, extension menu, checking/correcting fields, Save job, Open dashboard and bookmarking; distinguishes saving from applying. Added Markdown contents links.
- Files: quick-start PDF, docs/QUICK_START.md and both logs.
- Validation: regenerated PDF with seven-page count and internal destination references; checked page-fit assertion for new save-job page and diff whitespace. No new UI captures or browser tests performed.

## 2026-10-12 — Actual screenshots for usage guide

- Request: real screenshots of using the extension and explanations.
- Captured dashboard, job details, edit mode, email suggestions and analytics by opening dashboard.html?sample=1 in isolated headless Chrome and interacting through Chrome DevTools Protocol. No image generation or fabricated interface screenshots used.
- Added PNG assets in docs/images/quick-start, expanded docs/QUICK_START.md with captions, and created root job-tracker-quick-start-guide.pdf. Screenshots clearly labeled actual sample UI with fictional jobs/emails; no live Gmail lookup or installed-extension popup capture claimed.
- Validation: browser showed six sample jobs; all five captures completed. Inspected edit/email screenshots and checked Markdown asset links and git diff whitespace. No application code changed.
- Files: five PNGs, quick-start Markdown/PDF and both logs.

## 2026-10-12 — Sample usage quick-start guide

- Request: an easy-to-understand sample guide for using the actual extension.
- Added docs/QUICK_START.md covering saving listings, opening/bookmarking the dashboard, tracking status, editing details, reviewing/manual email attachment, filters/reminders and backups. Includes a short example and explains that saving a listing does not submit an application.
- Files: docs/QUICK_START.md and both logs; short-log date TOC updated.
- Validation: reviewed wording against README and existing implemented workflows; git diff --check. No code changes or browser testing.

## 2026-10-08 — GitHub ZIP update guide

- Request: create an update guide using the existing installation screenshots.
- Added job-tracker-extension-update-guide.pdf in the project root: clickable repository link, Code/Download ZIP image, unzip and copy contents into the existing loaded folder, reload existing extension card, reopen dashboard. Explains keeping the same folder/location and installation to preserve Chrome-stored data.
- Reuses three existing annotated screenshots without image edits. Separate from the installation PDF.
- Validation: rendered and visually inspected both pages, checked layout margins and generated external repository link; checked Chrome development guidance. No actual extension update performed.
- Files: update PDF and both logs.

## 2026-10-08 — Five-day rescan default

- Request: default rescan to the last 5 days instead of 30.
- Changed gmail-rescan-days initial value to 5 in dashboard.html. The submitted user value still controls the rescan range; normal email checks retain their existing range.
- Files: dashboard.html and both logs.
- Validation: verified rescan UI reads the input value; git diff --check passed. No live browser test performed.

## 2026-10-08 — Remove dashboard footer instruction

- Request: remove the footer sentence about saving listings and changing statuses.
- Removed the footer element containing the requested text from dashboard.html.
- Files: dashboard.html and both logs.
- Validation: located the exact text and ran git diff --check; no browser test performed for this text removal.

## 2026-10-08 — Search against pending email edits

- Request: show an email again in manual search when removed in the current unsaved edit session.
- Send draft email activity/history to manual subject search; exclusion uses current draft visibility rather than persisted records. No stored data is changed by searching; unchanged attached messages remain excluded. Save retains snapshot validation and applies draft deletions before duplicate checking the selected attachment.
- Files: job-details.js, background.js, manual-email.test.cjs and both logs.
- Validation: regression test covers unsaved removal/search and retained attached exclusion; full Node suite, syntax and diff checks. No live browser/Gmail test performed.

## 2026-10-08 — Exclude attached emails from search

- Request: hide already-attached email results while keeping distinct messages sharing a subject.
- Pass target job ID to subject search and filter Gmail message IDs before fetching previews. Covers current emailMessage metadata and legacy account/message event IDs in email activity or status history; deleted activity may be reattached. Filtering is scoped to the selected job and connected account.
- Files: background.js, job-details.js, manual-email.test.cjs and both logs.
- Validation: regression tests for attached/deleted activity and legacy history, full Node suite, syntax and diff checks. No live browser/Gmail test performed.

## 2026-10-08 — Remove manual email instruction

- Request: remove the Save changes / click again to unselect helper paragraph.
- Removed the static paragraph in dashboard.html; email selection and save behavior remain unchanged.
- Files: dashboard.html and both logs.
- Validation: confirmed exact paragraph removal and ran diff whitespace checks; no browser test performed.

## 2026-10-08 — Save selected email with job edits

- Request: remove separate Save email button, attach on Save changes, toggle selected search result off when clicked again.
- Selection remains staged until job form submission; its status selector supplies the final status. Cancel/unselect avoids attachment. Successful saves reset search/results/preview; failed saves retain selection.
- Added manual-email-edit-save worker route to re-fetch selected message metadata and pass it to updateDetails. Store validates/reconciles edits and attaches email plus optional email status transition in one locked storage write; no partial attachment on stale/invalid edits. Existing job-detail snapshot undo restores both edits and attachment.
- Files: dashboard.html, job-details.js, background.js, store.js, manual-email.test.cjs and both logs.
- Validation: 46 Node tests passed, including combined edit/email persistence, undo and failure atomicity; JS syntax and diff checks. No live Gmail/browser test performed.

## 2026-10-08 — Repair manual attachment duplicate handling

- Request: Save email reports already recorded while target job shows no email activity.
- Found duplicate checks treated any global approved suggestion or other job activity as a duplicate, even when target activity was absent/deleted. Check visible email activity on the selected job using source message metadata; previously reviewed/deleted records use a fresh attachment event ID to preserve existing review/undo history and avoid inheriting hidden status events.
- Files: background.js, manual-email.test.cjs and both logs.
- Validation: regression tests for prior approval without target activity and reattaching deleted activity, existing duplicate guard test, complete Node suite and syntax/diff checks. No live Gmail/browser test performed.

## 2026-10-08 — Reset manual email search after save

- Request: return manual email attachment to a blank search with no suggestions immediately after Save email succeeds.
- Clear search input, results, preview contents/link, status selection and selected email state after successful API save. Preserve the success confirmation and other pending job edits. Failed saves retain the search for retry.
- Files: job-details.js and both logs.
- Validation: JavaScript syntax and diff checks; no live browser test performed.

## 2026-10-08 — Manual email subject search

- Request: replace manual Gmail link attachment with subject search and explicit selection.
- Edit panel now searches subject words in the connected Gmail account; returns up to 20 previews sorted newest first with sender, date and excerpt. User chooses the specific message before status selection/save; classifier recommendation remains the default, otherwise current status. Search results use textContent; input words are quoted in Gmail query to avoid search operator injection.
- Removed link/Message-ID lookup UI and worker endpoints. Manual save still re-fetches metadata, checks duplicate/stale records and uses existing email history/undo storage. Searches exclude spam/trash/drafts; more results prompt a narrower subject search. Enter submits search.
- Files: dashboard.html, job-details.js, background.js, themes.css, manual-email.test.cjs and both logs.
- Validation: JavaScript syntax, Node suite including updated subject lookup/storage and input-validation tests, diff check. No live Gmail/browser test performed.

## 2026-10-08 — Manual email panel in Edit

- Request: expose manual email attachment in Edit rather than its own dropdown.
- Replaced the outer details with a plain panel visible only while editing. Successful email save rebases the edit snapshot to the updated job and preserves other pending edits; email saves immediately, with explicit confirmation that other edits require Save changes. Message-ID fallback remains a secondary disclosure.
- Files: dashboard.html, job-details.js and both logs.
- Validation: JavaScript syntax, Node suite and diff check. No live browser test performed.

## 2026-10-08 — Manual email attachment

- Request: attach an email to a role by Gmail link when automatic suggestions fail, fetching metadata and allowing a status choice.
- Added Add email manually under job Email activity. Load a hex-ID Gmail conversation link, review the newest non-draft email’s subject, sender, snippet, received date and Gmail link; select the classifier recommendation or current status, then save. Opaque browser links use an explicit Show original / Message-ID fallback with rfc822msgid lookup.
- Background fetches from the connected Gmail account, re-fetches metadata before saving and uses the existing review/store path for status history, email activity and approval undo. Guards invalid hosts, duplicate recorded emails, invalid statuses and changed job snapshots. No inferred next steps are added through this manual flow.
- Files: dashboard.html, job-details.js, background.js, themes.css, manual-email.test.cjs and both logs.
- Validation: two mocked-worker tests cover preview, host rejection, status/activity/undo storage, duplicate rejection, opaque links and original-ID fallback; full Node suite and syntax/diff checks. No live Gmail/browser test performed.
- Limitations: Gmail must be connected; sample mode shows an explanation instead of lookup. Conversation links load the newest email; Message-ID selects a specific email. Gmail opaque links cannot be resolved from URL alone.

## 2026-10-08 — Remove proposed email next steps

- Request: trash icon at the top right of the suggested next steps box, removing tasks while preserving the email approval.
- Added an accessible icon button and header layout; removal hides the proposed steps through subsequent UI renders and sends skipNextSteps on manual approval. Background records the email/status without adding its proposed tasks; automatic approvals cannot use this flag.
- Files: email-ui.js, background.js, themes.css and both logs.
- Validation: JavaScript syntax, existing Node suite and diff checks. No live browser/Gmail test performed. Unapproved removal choices are session-only and reset on page reload.

## 2026-10-08 — Status choice for all email approvals

- Request: allow manual status selection for suggestions requiring application selection, preselecting the algorithm recommendation for one-click approval.
- Display status selector whenever a target job is available, including manually selected jobs; default to suggestion.status or current job status. Clear overrides when changing the selected job to avoid stale target snapshots.
- Background accepts manual status overrides for selected applications, retaining valid-status, automatic-approval exclusion and expected-state checks.
- Files: email-ui.js, background.js and both logs.
- Validation: JavaScript syntax, existing Node suite and diff checks; no live Gmail/browser test performed.

## 2026-10-08 — Matching status filter popover

- Request: style the status dropdown like Filters.
- Replaced the visible native status filter with a details popover using the existing shared menu/button CSS; retained the hidden select as the filtering/preference state. Options and trigger reflect the selected status after render and preference restore.
- Both menus close on outside click or Escape; selecting a status closes its menu and returns focus to its trigger. Job-row status editors remain unchanged.
- Files: dashboard.html, scripts/dashboard/dashboard.js and both logs.
- Validation: JavaScript syntax, dashboard preference tests and diff whitespace checks. No live browser test performed.

## 2026-10-08 — Remove outcomes helper text

- Request: remove “Current statuses across all jobs, not a conversion funnel.”
- Removed the static paragraph under Application outcomes in dashboard.html; outcome counts are unchanged.
- Files: dashboard.html and both change logs.
- Validation: reviewed the diff and ran git diff --check; no browser test performed for this text removal.

## 2026-10-08 — Remove analytics helper text

- Request: remove “Last 12 periods, including the current one. Weeks start Monday.” from the dashboard.
- Removed the static helper paragraph under Applications over time; chart grouping remains unchanged.
- Files: dashboard.html and both change logs.
- Validation: reviewed the diff and ran git diff --check. No browser test needed for this text removal.

## 2026-10-08 — Daily analytics grouping

- Request: add Day option to analytics.
- Added daily selector option showing 12 local calendar days including today, retaining weekly default and monthly option. Shared bucket calculation handles day/month boundaries and excludes future applications.
- Files: analytics.js, dashboard.html, analytics.test.cjs and both logs.
- Validation: Node analytics tests including daily boundary/future-date case; diff check. No live browser test performed.

## 2026-10-08 — Dashboard analytics

- Request: analytics between emails and Sheets, covering applications over time, outcomes and next steps.
- Added local analytics module and section plus sidebar links on dashboard/settings/sample settings. Timeline displays 12 Monday-start weeks or calendar months with text counts and CSS bars; each job counted once using appliedAt or earliest non-deleted Applied transition, never savedAt. Missing dates disclosed; future applied dates not counted. Outcome totals use current status, explicitly not a conversion funnel. Steps count unfinished tasks, due today through three days, and overdue, independent of reminder preference/table filters.
- Re-renders with dashboard storage/sample/task changes. No network calls, dependencies or permissions added; samples use existing fictional records. Updated script architecture guide.
- Files: analytics.js, dashboard.js, dashboard/settings/sample-settings HTML, dashboard.css, scripts/README.md, analytics.test.cjs and both logs.
- Validation: Node regression suite, aggregation/date/task tests and diff check. No live browser test performed. Historical weekly/monthly buckets use viewer local calendar; removed applications are excluded.

## 2026-10-08 — Restore visible job-link domains

- Request: return to the previous link presentation.
- Restored hostname suffixes in job details and popup saved-job links, retaining full URL title tooltips and text-based rendering.
- Files: job-details.js, popup.js, popup.css and both logs.
- Validation: Node regression suite and diff check; no live browser test performed.

## 2026-10-08 — Hover-only link address

- Clarification: reveal address when cursor hovers over the link.
- Removed visible domain suffixes from job detail and popup links; retained full URL in native title tooltip. Removed unused popup domain styling.
- Files: job-details.js, popup.js, popup.css and both logs.
- Validation: Node suite and diff check; no live browser test performed. Browser controls native tooltip delay.

## 2026-10-08 — Visible job-link destinations

- Request: show destination domains and full address on hover.
- Job detail description link and popup saved-job links now include the parsed destination hostname, with the full parsed URL in the native title tooltip. Labels rendered as text, only existing HTTP/HTTPS links used; stale tooltip removed when changing jobs. Long domains wrap. This indicates the initial destination, not a redirect target or website trust assessment.
- Files: job-details.js, popup.js, dashboard.css, popup.css and both logs.
- Validation: Node regression/path/syntax suite and diff check; no live browser test performed. Native hover tooltip appearance/timing controlled by Chrome.

## 2026-10-08 — Dismiss filters on outside click

- Request: close open Filters dropdown when clicking elsewhere.
- Added document click handling that closes the native details menu only when the target is outside it. Menu controls and summary keep their existing behavior; no filter preferences change when dismissed.
- Files: dashboard.js and both logs.
- Validation: existing Node regression/path suite and diff check; no live browser test performed.

## 2026-10-07 — Fix clipped filters menu

- Request: menu cut off at the applications panel bottom; remove Clear filters.
- Removed a trailing blank line caught by the diff check.
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
