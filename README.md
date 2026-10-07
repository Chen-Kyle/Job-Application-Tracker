# Job Application Tracker

A Chrome extension that helps job seekers keep their applications organized—from saving a listing to reviewing email updates and planning their next step.

Built by **Kyle Chen**. This project is an actively developed prototype.

## Why I built it

Applying to jobs often means switching between job boards, email, and spreadsheets. I built this extension to bring those pieces into one dashboard, with control over which email updates change an application's status.

## What it does

- **Save jobs while browsing:** capture the role, company, and listing link, with editable fields when autofill needs a correction.
- **Track applications:** search, filter, and update Saved, Applied, Interviewing, Offer, Rejected, or Withdrawn statuses. Add applications manually too.
- **Recruiter conversations:** attach contacts and specific Gmail threads to a job, see the latest message and when you last emailed, and compose a follow-up in Gmail. Conversation summaries remain separate from status updates.
- **Keep details together:** open a job's side panel to view its listing, dates, notes, email activity, and next steps.
- **Review Gmail updates:** suggest status changes and actions from job-related emails. Uncertain matches let you choose the application.
- **Choose automatic updates:** automatically approve strong status matches while keeping uncertain matches and detected next-step actions available for review.
- **Recover from mistakes:** undo email approvals and dismissals when safe; automatic updates have their own review section.
- **Export and back up:** create Google Sheets snapshots or download a JSON backup of applications and settings.
- **Customize the dashboard:** choose a color scheme and email-check frequency.

## Try the sample dashboard

You can explore the interface without connecting Gmail or creating a Google Cloud project:

1. Download or clone this repository.
2. Open `dashboard.html` in Chrome.
3. Try the fictional applications, email suggestion, automatic update, and job details panel. Use the gear icon to explore sample settings.

In the installed extension, click **Explore sample dashboard**. Sample interactions do not change your real applications or settings. Sample applications reset when you reload.

## Install in Chrome

1. Download or clone the repository. If you download a ZIP, extract it first.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Pin **Job Application Tracker** from Chrome's extensions menu.
5. Open a job listing, click the extension, review the captured details, and choose **Save job**.
6. Click **Open dashboard** to manage your applications.

Saving jobs and using the dashboard work without a Google connection. Gmail and Sheets require the Google setup described in [GMAIL_SETUP.md](docs/GMAIL_SETUP.md); access for testers must be configured by the project owner.

## How email updates work

The extension searches job-related emails and matches them against saved applications using local rules. You can review suggestions yourself or enable automatic approval for strong matches. Background checks run while Chrome is running, even when the dashboard is closed. The dashboard also supports a manual check and a rescan for a chosen number of days.

This is rule-based matching, not AI. It can miss unfamiliar wording or require help choosing the correct job. Always review important information and deadlines.

## Data and privacy

Application records are stored locally in your Chrome profile. Gmail access is read-only: the extension does not send emails or change your mailbox. Matching runs locally, and approved email activity stores subjects, links, dates, and short excerpts rather than complete email bodies or attachments.

Recruiter contacts and attached conversation summaries are stored with the job and included in backups. Refresh conversations from the job panel to update their timestamps; full threads stay in Gmail.

Google Sheets exports create separate snapshots; they do not sync back to the dashboard. JSON backups preserve application data and settings, but exclude authorization tokens, pending/dismissed suggestion queues, and undo history. Download a backup before uninstalling or changing the extension's ID.

## Built with

Plain **JavaScript, HTML, and CSS**, Chrome **Manifest V3**, Chrome storage and background alarms, and the **Gmail and Google Sheets APIs**. No build step or hosted backend is required.

## Project status and documentation

The extension is still being tested before a public release. Autofill varies by website, and Google integration requires OAuth configuration. Public distribution and Google's applicable verification requirements remain follow-up work.

- [Setup guide](docs/GMAIL_SETUP.md)
- [Email test cases](docs/EMAIL_TEST_CASES.md)
- [Quick change log](CHANGES.md)
- [Technical change log](CHANGES_TECHNICAL.md)
- [Project notes and planned work](docs/project_log.md)

## License

[MIT](LICENSE) — you may use, modify, and distribute the code while retaining the copyright and license notice.

## Code organization

JavaScript lives in `scripts/`, grouped by feature. See [the code guide](scripts/README.md) for responsibilities, entry points, dependency order and test commands. HTML pages remain at the root; CSS lives in `styles/` and supporting guides in `docs/`, so installation and sample-page instructions are unchanged.
