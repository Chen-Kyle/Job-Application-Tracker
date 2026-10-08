# Project log

## 2026-10-07 — Public beta readiness

**Current stage: ready to start an invited beta; public launch preparation is still needed.** Core features are implemented and 37 automated regression tests passed at the latest feature check. This does not confirm that fresh installations, Gmail authorization, or Chrome Web Store review work for other users. Avoid adding more features until the launch checks below are complete.

Completed implementation:
- [x] Save listings, company/role autofill, manual entry, editing and status history.
- [x] Gmail suggestions, manual/automatic approval, background checks, rescanning and email undo.
- [x] Separate recruiter conversations, email autocomplete and message previews.
- [x] Backup/restore with email metadata and recruiter details.
- [x] Optional next-step reminders, quick filters and remembered dashboard sorting/filter preferences.
- [x] Application deletion recovery and duplicate-link detection.
- [x] Sample dashboard/settings, support email, GitHub repository and change logs.

**Progress:** feature foundation complete; release validation and external approvals remain unconfirmed. No reliable percentage or launch date can be given until tester results and Google requirements are known.

### Public beta launch checklist — do these next

1. **Decide the beta scope.**
   - [ ] Start with a few invited testers and keep manual email approval as the default.
   - [ ] Decide whether the public beta includes Gmail immediately or starts with local tracking while Gmail production access is prepared. An unlisted store listing is not an OAuth verification exemption.
2. **Test on fresh installations.**
   - [ ] Have at least two people install on separate Chrome profiles/computers; verify save, dashboard and settings reload correctly.
   - [ ] Add invited Gmail testers in Google Auth Platform and verify connection, disconnect/reconnect and Sheets export using their accounts.
   - [ ] Exercise suggestions, ambiguity, rescan, automatic approval and undo using fictional test emails; record failures and fix blockers.
   - [ ] Test deletion recovery, duplicate URL variants, backup round-trip, recruiter attachment/edit cancellation, reminders and persistent filters.
3. **Prepare privacy and Google authorization.**
   - [ ] Publish a privacy policy explaining local job/email storage, Gmail access, correspondent caching, backups, permissions and deletion; link it from the store listing and Google consent setup.
   - [ ] Check Google's restricted-scope requirements for `gmail.readonly`; confirm the applicable verification route before offering Gmail to unrestricted users. Assess security-assessment applicability using Google's requirements; do not assume a paid assessment is needed simply because Gmail is used.
   - [ ] Complete required consent branding, ownership/domain verification, scope justification and demonstration material; confirm current status in Google Cloud.
   - [ ] Confirm the final Chrome Web Store item ID and align the OAuth client with that ID; test the actual packaged installation. Preserve backups if an ID change creates separate storage.
4. **Prepare the store package.**
   - [ ] Register a Chrome Web Store developer account (one-time registration fee).
   - [ ] Add actual extension icons, screenshots, concise beta description, support contact and privacy-policy URL.
   - [ ] Review requested permissions and store privacy disclosures against the actual code.
   - [ ] Build a clean ZIP with the manifest at its root, runtime assets included, and private files, backups, skills, tests and Git metadata excluded.
   - [ ] Choose a release version, run the automated suite, and smoke-test that exact ZIP on a fresh profile.
5. **Submit and operate the beta.**
   - [ ] Submit for Chrome Web Store review; complete the applicable Google verification steps separately.
   - [ ] Verify installation and authorized integrations from the published package before sharing broadly.
   - [ ] Publish known limitations and feedback instructions; monitor kylechenapps@gmail.com and fix data-loss/authentication blockers first.

Public-beta go/no-go: fresh testers can reliably install, save and recover jobs; advertised integrations are authorized for the intended audience; privacy information and store disclosures are complete; the packaged build passes checks.

Official references: [Chrome developer registration](https://developer.chrome.com/docs/webstore/register/), [privacy-policy requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [Google restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification), [OAuth testing and production states](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).

---


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

### Earlier public beta TODO (superseded by the 2026-10-07 checklist)

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
