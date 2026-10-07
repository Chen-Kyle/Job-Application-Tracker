# Project log

## 2026-10-04

Notes:
- Test the feature that puts the most likely job opportunities for email suggestion updates at the top of the dropdown.
- Add a checkbox to enable automatic status updates. Currently, users review the email suggestions and choose which updates to accept.
- Figure out how to make the Chrome extension public and consider adding a feature to easily email recruiters or other hiring contacts.


## 2026-10-05

- We tested the feature that puts most likely job opportunities for email suggestions but now it only gives you one choice which is not good

Settings feature ideas:
- Email approval mode: choose manual review or automatic approval for strong matches. Keep manual review as the default and test automatic approvals carefully.
- Email check frequency: choose every 15, 30, or 60 minutes, or manual checks only.
- Notifications: control pending-suggestion badges and desktop alerts.
- Dashboard preferences: choose default sorting, status filters, and a compact layout.
- Company corrections: remember manually corrected company names for future listings from the same employer's job board.
- Backup and restore: export jobs and settings to a file and import them later.
- Integration management: manage Gmail connections and Google Sheets exports in one place.

Suggested priority: backup and restore first, then dashboard preferences.

### TODO: Prepare for a public beta

Publication preparation is in progress. The implementation updates below are complete; the release checks below remain open.

- [ ] Test fresh installations and Gmail connections with other users. A stable development extension ID has been added; tester setup and successful connections still need confirmation.
- [ ] Improve company autofill and email matching across websites and emails. Matching, examined-email tracking, rescanning, and restored-email deduplication are implemented; broader real-world testing remains.
- [ ] Test automatic approvals and Undo. Approval modes and undo for approvals/dismissals are implemented, with regression checks passing; real-account testing remains.
- [ ] Resolve Gmail verification and privacy documentation before public launch.
- [ ] Prepare and submit the public beta package and store listing.

Completed implementation updates:
- [x] Email approval mode and configurable check frequency.
- [x] Backup and restore for applications and settings, including available email subjects.
- [x] Skip previously examined emails and reconsider unmatched emails when application details change.
- [x] User-selected date range for rescanning previously unmatched emails.
- [x] Undo approvals and dismissals, with availability-aware counts and keyboard shortcuts.
- [x] Stable extension ID for sharing the development version.
- [x] Dashboard shows the latest status change and date; next-step deletion uses a trash icon.

Implementation checklist: 7 of 7 listed updates complete. Google Cloud configuration, data migration, and tester validation are not marked complete without confirmation.

Start preparing the extension for publication as a beta.
Test fresh installations and Gmail connections with a few other users.
Improve company autofill and email matching across more websites and emails.
Test automatic approvals and Undo, keeping manual review as the default.
Resolve Gmail verification and privacy documentation before public launch, focusing on reliability rather than new features.

- for the email connector make sure it picks up on requires next action or for example whenever u recieve an email about an interview or about taking a diagnostic it should automatically save itself to the dashboard still and leave its email chain there with all the relevant emails when u click into the job entry 
