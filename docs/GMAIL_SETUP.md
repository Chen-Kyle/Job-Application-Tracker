# Connect your Gmail account

The code is implemented, but Gmail access requires an OAuth client you own. No client secret is needed or should be put in this extension.

1. Reload the extension in `chrome://extensions` and copy its extension ID.
2. Create or select a project at https://console.cloud.google.com/ and enable **Gmail API** in APIs & Services.
3. Configure Google Auth Platform / OAuth consent. For a personal prototype, keep the app in Testing and add your Gmail address under test users. Add the scope `https://www.googleapis.com/auth/gmail.readonly` in Data Access.
4. Create an OAuth client with application type **Chrome Extension** (some console versions call this **Chrome app**). Use your extension ID as the Application ID / Item ID.
5. Add this top-level field in `manifest.json`, using your real OAuth client ID. Put a comma after the preceding field as needed:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/gmail.readonly"]
}
```

6. Reload the extension and reopen its dashboard. Click **Connect Gmail** and approve Gmail read-only access. Chrome Identity uses a Google account available in your Chrome profile; the connected address is shown on the dashboard. Use the intended Chrome profile for this personal prototype.

If Chrome rejects the OAuth client, confirm the client is a Chrome Extension client, its extension ID matches, Gmail API is enabled, and your address is an allowed test user. Keep the manifest public key unchanged so the unpacked extension ID stays consistent across locations and computers.

## Stable ID for sharing this development version

The manifest now contains a public `key`. Keep it unchanged when copying or moving the folder. This unpacked development version will use the following extension ID on every computer:

`helbhmpfkpihpjkcdffkccmjjbjogapf`

The public key is not an OAuth client secret. No private signing key is stored in this project. This is a development ID; if you later use a Chrome Web Store item's public key, match that store ID in Google Cloud and plan another data migration.

### Migrate your existing installation before reloading

1. In the currently open extension, go to Settings → Backup and restore and download a backup. Do this **before reloading, removing, or restarting Chrome**, because the new ID uses separate extension storage. The backup carries applications and settings; Google authorizations, pending suggestions, and undo history are not included.
2. Open Google Cloud Console → Google Auth Platform → Clients. Open the Chrome Extension client whose client ID is `32741109323-t9pp5emts58btvhoaq9pgmlug90125n1.apps.googleusercontent.com`.
3. Change its Application ID / Item ID to `helbhmpfkpihpjkcdffkccmjjbjogapf` and save. If Google does not let you edit that field, create a new Chrome Extension OAuth client with this ID, then replace `oauth2.client_id` in `manifest.json` with the new client ID. Never paste a client secret into the extension.
4. Open `chrome://extensions` and load the updated folder using Load unpacked (or reload if Chrome accepts the changed ID). Verify that the ID equals `helbhmpfkpihpjkcdffkccmjjbjogapf`. Keep the previous installation until you have restored and checked your backup; do not remove it first.
5. Open the new dashboard → Settings and restore the backup, including backup settings if desired. Connect Gmail again and approve access. Reauthorize Google Sheets when exporting. Rescan emails if you want to recreate pending suggestions.
6. Share this same folder, including its unchanged manifest key, with testers. Add their Google accounts under Google Auth Platform → Audience → Test users. They load the folder and connect their own Google account.

## What runs

- New automatic approvals appear in **Automatically added emails** in the Gmail section, newest first, with their subject, a short excerpt, Gmail link, date added, and status change. The open dashboard refreshes when storage changes. Each card offers Undo when its job still matches the saved approval snapshot; undo restores the job and puts the email back in the review queue. The automatic marker is included in application backups. Older approvals without that marker are not retroactively labeled automatic.
- **Undo last email action** restores approvals and dismissals in reverse order. You can also use ⌘Z/Ctrl+Z on the dashboard outside text fields and open dialogs. Dismissal undo brings the email back for review without changing the application. The button is hidden when the next action cannot safely be undone. Dismissals made before this feature was added have no undo snapshot.
- **Rescan emails** lets you enter a range of 1–3650 days (30 by default). It reexamines previously unmatched emails across every matching page in that range, skipping emails already suggested, approved, or dismissed. It keeps the normal scan's pagination position and shows progress and totals. The same job-related search, spam/trash/sent exclusions, matching rules, and approval mode apply. Large ranges can take several minutes; keep the dashboard open for progress. This does not change the automatic 30-day search window.
- An initial check runs after connecting. **Check now** runs another check on demand.
- Automatic checks use a Chrome alarm at the frequency selected in Settings: every 15 (default), 30, or 60 minutes, or manual checks only. Turn off the checkbox to pause periodic checks. Chrome may delay alarms during sleep; checks do not run while Chrome is closed. The alarm is recreated on browser startup if enabled.
- Each check reads the newest page of up to 5 candidate emails and, when a backlog exists, an older page of up to 5 emails from the last 30 days. Newly arrived messages are checked even while the older scan continues. Click Check now again if more messages remain. Gmail search covers archived mail as well as the inbox, excludes spam, trash, and sent mail, and looks for job/action terms plus normalized names from saved companies (up to 100 company phrases). Search terms are matched without regard to capitalization. Each sweep restarts pagination if the search query changes.
- Checks first read sender, subject, and Gmail's short snippet. If the preview identifies a saved application's company or clear status wording but cannot confidently match an application, the connector reads the message's text locally, including HTML-only and multipart emails. It does not fetch attachments or render email HTML. General rules use company names, full roles, numeric/alphanumeric requisition IDs, and saved job links to suggest Applied, Interviewing, Offer, Rejected, or Withdrawn. Recruiting-platform URLs can identify their employer tenant; there are no employer-specific alias lists. Full message text is not stored; a short excerpt is retained with the suggestion.
- When clear status wording is detected but the application is missing or ambiguous, the email appears with a **Choose an application** dropdown. Pick any saved application, inspect the email, and approve or dismiss. Possible matches are listed first, but no application is selected automatically. Emails without recognizable status wording are still skipped; this rule-based prototype does not understand every email format or language.
- **Approve update** changes a record and logs the email source. **Dismiss** leaves the status unchanged. Manual review is the default. In Settings, automatic approval can be enabled for newly discovered strong, unique matches with a compatible status transition. Ambiguous matches and existing pending suggestions remain for manual review; stale applications are not automatically updated. Automatic approvals use the same Undo stack. Suggestions are rejected if the application changed since they were created. Existing terminal statuses are not overridden by new suggestions.
- **Undo last email approval** reverses approvals in order from newest to oldest, restoring the affected application's status, dates, and activity and returning its email suggestion to review. The undo stack is saved locally across dashboard reloads. Undo refuses to overwrite later edits or recreate a deleted application. Disconnecting Gmail or switching Gmail accounts clears the undo stack. Approvals made before this feature was added cannot be undone with this button.
- Saving a job adds it to the applications used for matching and to the review dropdown. It does not create a company-specific Gmail search. Gmail search uses general application-related terms across the connected account. A saved job is required before checks run.
- Matching email snippets and suggestions are stored only in extension storage. Tokens are managed by Chrome Identity, not saved in extension storage. Gmail is accessed read-only; no sending or mailbox changes are implemented.
- Checks remember up to 10,000 examined email IDs locally, including unmatched messages, and skip reading those messages again. Adding/removing an application or changing its company, role, job link, requisition ID, or company aliases resets this cache and restarts the older scan on the next check. Previously unmatched messages can then match the new application details; already queued, approved, or dismissed suggestions remain deduplicated. Notes and activity edits do not reset the cache. Gmail list searches still run to discover new messages.
- Disconnect stops checks, clears suggestions and local dedupe data, and clears the extension's cached Google authorization. To remove the underlying Google account grant, visit your Google Account's third-party connections settings as well.
- Suggestions retain their source message ID; approved/dismissed suggestions are kept locally to prevent repeated review. There is no hosted backend or AI service.

## Optional Google Sheets export setup

Use the same project and OAuth client. Enable **Google Sheets API**, then add `https://www.googleapis.com/auth/drive.file` in Google Auth Platform → Data Access. Reload the extension and choose **Google Sheets → Export to Google Sheets** on the dashboard. Google will ask for the extra permission when you export. Gmail sign-in continues to request only Gmail read-only permission. Each export creates a new spreadsheet; it is not continuous synchronization.

## Before distributing to other users

Gmail read-only is a restricted scope. Public distribution requires following Google's applicable consent, verification, and user-data requirements. The personal testing configuration is not a production authorization setup. Testing-mode authorization can require reconnecting as Google expires grants; the UI reports sign-in errors without launching background sign-in windows.

Official references: [Chrome OAuth setup](https://developer.chrome.com/docs/extensions/how-to/integrate/oauth), [Chrome Identity](https://developer.chrome.com/docs/extensions/reference/api/identity), [Chrome alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms), [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).

## Email activity and next-step review

- Relevant emails no longer require a status change to enter the review queue. Company mentions alone are insufficient: the message also needs application-related wording or an explicit action request. Unrelated newsletters are skipped where possible.
- Approving records the email subject, sender, received/approval dates, excerpt, and Gmail link on the application. Proposed next steps are added with source email links. Undo removes the approval's activity and tasks as well as reverting any status change, provided no newer edits conflict.
- Action suggestions and activity-only suggestions always require review, including in automatic approval mode. Existing reviewed message IDs stay deduplicated. Missing role or ambiguous company matches require choosing an application.
- Proposed deadlines recognize numeric calendar days relative to the email's received date and explicit YYYY-MM-DD dates after due/by/deadline wording. Confirm or clear the date before approval. Business days, multiple deadlines, natural-language dates, time zones, and subtle wording may need manual correction.
- Old messages within the 30-day search window can be offered as activity for review even if saved later. Status rules still prevent old confirmations from automatically changing a newer application state.
- Test scenarios and instructions are in EMAIL_TEST_CASES.md. This feature does not create a complete Gmail thread archive; it records approved individual emails.

## Recruiter conversations

Open a job, click Edit, enter a recruiter name/email and click Add recruiter. Find conversations searches up to 20 matching Gmail threads, including sent messages. Attach only conversations for that job and click Save changes. Cancel discards the draft; the panel’s undo restores saved edits when safe.

Attached conversations appear separately from status-update email activity and never change the job status. Each shows its subject, latest sent/received timestamp, and the most recent message labeled Sent by Gmail. Refresh conversations updates these summaries; an inaccessible thread produces an error without removing saved data. The Gmail account used to attach the conversation must be connected for refresh. Open the link to read the full chain in Gmail, or use Email recruiter in Gmail to compose a message yourself.

Contacts and thread summaries are included in JSON backups, not full messages or attachments. The existing Gmail read-only scope is sufficient; no send permission is requested. Contacts can be added without Gmail, including in the sample dashboard, but sample mode never searches a real inbox.

Attached thread previews list message excerpts newest first, with the oldest at the bottom. Refresh older attachments to load those previews. In the sample dashboard each job has a fictional contact; Find conversations offers scheduling and follow-up examples without accessing an inbox.

Recruiter email autocomplete combines saved contacts across jobs with recent Gmail correspondents. On field focus, it can cache names/addresses from up to 50 messages in the last 30 days for 24 hours. Typing filters locally; selecting a suggestion fills a known recruiter name. These correspondents are not verified recruiters. The account-scoped cache is cleared on disconnection/account changes and excluded from backups.
