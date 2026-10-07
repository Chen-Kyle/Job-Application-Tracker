# JavaScript structure

Scripts are grouped by responsibility. HTML pages, stylesheets and `manifest.json` remain at the repository root; no build step is required.

| Directory | Responsibility | Start here |
| --- | --- | --- |
| `core/` | Shared persistence and color schemes | `store.js`, `theme.js` |
| `popup/` | Extract and save the current job listing | `popup.js` |
| `dashboard/` | Application list, details, editing and navigation | `dashboard.js`, then `job-details.js` |
| `email/` | Local email matching, actions and dashboard email controls | `email-matcher.js`, `email-ui.js` |
| `background/` | Chrome messages, alarms and resumable Gmail scans | `background.js` |
| `settings/` | Email preferences, sidebar and sample settings | `email-settings-ui.js` |
| `backup/` | Backup format, validation and restore controls | `backup.js`, then `backup-ui.js` |
| `sheets/` | Spreadsheet creation and export controls | `google-sheets.js`, `sheets-ui.js` |

## How the code runs

- `popup.html` loads shared appearance/storage code, then the popup controller. Job extraction is injected as a function into the active tab.
- `dashboard.html` loads shared helpers before its list, details, manual-entry and integration controllers. The HTML script order is intentional: later controllers use the globals established by earlier scripts.
- `settings.html` loads appearance, sidebar, email preferences and backup controllers. `sample-settings.html` loads the sample controller instead of controllers that write real settings.
- `manifest.json` registers `background/background.js` using its full path from the extension root. Its `importScripts` paths resolve from the background directory.
- Existing global namespaces such as `JobStore`, `EmailMatcher` and `EmailPreferences` connect the classic scripts. This layout does not introduce bundling or ES modules.
- Runtime page URLs such as `dashboard.html` still resolve from the extension root. Moving a script does not change those page URLs.

## Where to make changes

Start with the controller for the relevant page. Put shared data rules in `core/store.js`, matching rules in `email/email-matcher.js`, backup serialization in `backup/backup.js`, and background scheduling in `background/background.js`. Keep interface code in its corresponding UI/controller file.

## Checks

From the repository root, run:

```sh
node --test tests/*.test.cjs
```

Tests check persisted rescan behavior, JavaScript syntax, page assets and worker imports. They use mocked Chrome/Gmail services; reload the unpacked extension and test the real pages after changes to permissions, authentication or UI.
