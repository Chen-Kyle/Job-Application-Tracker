# Job Application Tracker

A simple Chrome extension that captures a job's role, company, link, and saved date. Open the popup on a job listing and click **Save job**. You can edit the captured details before saving.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `Job Application Tracker` folder on your Desktop.
4. Pin the extension using Chrome's extensions menu.
5. Visit a job listing, open the extension, and click **Save job**.

Saved jobs appear below the form. Click a role to reopen the listing. Data stays in this Chrome profile using local extension storage; uninstalling the extension removes it.

## Capture limitations

The extension first looks for structured JobPosting metadata, then falls back to the page heading/title and site name. Some job boards omit this metadata or use their own name as the site name. Check the company and role before saving. On restricted pages, enter details manually. The date records when you saved the listing, not when you applied.

Only the first job in structured metadata is captured on pages containing multiple jobs. Use an individual job listing for best results. Identical links are prevented from being saved twice; different URLs for the same role may still be saved.

Handshake search/detail pages have a dedicated capture path: it pairs a visible job heading with the employer profile link above it, prioritizing the selected detail panel over neighboring results. It supports school subdomains of `joinhandshake.com` and removes search/filter parameters from individual job links. If the page layout cannot be identified, fields stay blank for manual entry instead of using a navigation heading as the role. Wait for the selected job to finish loading before opening the popup. Handshake markup changes may require adjusting this capture path.

No account, backend, or build step is needed. After editing these files, click the extension's reload button on `chrome://extensions`.

## Dashboard

Reload the extension on `chrome://extensions`, open its popup, and click **Open dashboard**. This full-page view uses the same saved jobs as the popup. You can search by role/company, filter by status, change statuses, and expand each application's status history. Existing saved jobs start with the Saved status.

Click **Explore sample dashboard** to try fictional applications without altering your real records. You can also open `dashboard.html` directly from this folder for a sample-only preview. Sample edits last only until the page is reloaded; they are never added to your applications.

The dashboard is local to this Chrome profile. There is no hosted URL or Google Sheets sync. Gmail access requires the setup below.

## Export to Google Sheets

Reload the extension and use **Google Sheets** in the sidebar, then **Export to Google Sheets**. Each click creates a new spreadsheet snapshot with all real saved applications (including ones hidden by dashboard filters). Sample jobs are never exported. Columns include Company, Role, Status, Job link, Saved date, Applied date, Last updated, and Application ID. Dates are exported as ISO timestamps, the header is frozen, and filters are enabled. Values are written explicitly as text rather than formulas.

Before the first export, enable **Google Sheets API** in the same Google Cloud project, and add `https://www.googleapis.com/auth/drive.file` under Google Auth Platform → Data Access. The extension requests this scope only when exporting; it does not require permission to all your existing spreadsheets. No new OAuth client or secret is needed, and the Gmail scope in the manifest can remain unchanged. Approve the permission screen when exporting, then click the resulting spreadsheet link. Your last export link is retained locally.

This is an export, not live sync or a backup of email suggestions/history. Editing the sheet does not update the dashboard, and later dashboard changes do not update an existing export. Export again for a fresh snapshot.

Use **Delete** in a dashboard row to remove an application and its status history after confirming. Sample deletions affect only the sample view and reset on reload. Real deletions are saved in extension storage.

You can also click **Remove** below a saved job in the extension popup to unsave it immediately. This removes the same record from the dashboard, including its status history, and lets you save the link again later. Saving again creates a new entry with a new saved date.

## Gmail connector

Follow **GMAIL_SETUP.md** to create a Google OAuth client and connect Gmail from the dashboard. The connector checks every 15 minutes while Chrome is running, with a **Check now** button and a switch to pause periodic checks. The sample dashboard includes a fictional email suggestion you can approve or dismiss without connecting an account.

`email-matcher.js` uses general company normalization, employer tenant information from recruiting URLs, numeric/alphanumeric requisition IDs, full roles, and saved links. There are no company-specific exceptions. Emails with clear status wording but no unique application match appear with a **Choose an application** dropdown rather than being silently discarded. Saving a job makes it available for matching and selection; Gmail search itself uses general job-related terms. Emails without recognizable status wording are still skipped.

When more detail is needed, `background.js` reads the message text locally and `gmail-message.js` extracts plain/HTML text and links without rendering the email or fetching attachments. Only a short excerpt is saved with the suggestion, not the full body. No external AI service is used. All status updates require approval. Stale suggestions/selections cannot override subsequent edits, and duplicate approvals are identified by a stable email event ID.

`store.js` centralizes job access and uses a shared Web Lock for writes. Approval logs the email source in status history. An approved Applied suggestion records the email's received timestamp as the applied date when no applied date exists. This is an estimate based on receipt, not the time the application form was submitted.
