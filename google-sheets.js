globalThis.GoogleSheets = (() => {
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  function payload(jobs) {
    const headers = ['Company', 'Role', 'Status', 'Job link', 'Saved date', 'Applied date', 'Last updated', 'Application ID'];
    const rows = [headers, ...jobs.map(job => [job.company || '', job.role, job.status || 'Saved', job.url || '',
      job.savedAt || '', job.appliedAt || '', job.updatedAt || job.savedAt || '', job.id])];
    return {
      properties: { title: `Job applications — ${new Date().toLocaleDateString()}` },
      sheets: [{ properties: { sheetId: 0, title: 'Applications', gridProperties: { rowCount: Math.max(rows.length, 2), columnCount: headers.length, frozenRowCount: 1 } },
        basicFilter: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: headers.length } },
        data: [{ startRow: 0, startColumn: 0, rowData: rows.map((row, index) => ({ values: row.map(value => ({
          // Explicit strings keep job titles/URLs from being interpreted as formulas.
          userEnteredValue: { stringValue: String(value ?? '') },
          ...(index === 0 ? { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.84, green: 0.96, blue: 0.44 } } } : {})
        })) })), columnMetadata: headers.map((_, index) => ({ pixelSize: index === 1 || index === 3 ? 340 : 190 })) }]
      }]
    };
  }
  async function accessToken(interactive) {
    if (!chrome.runtime.getManifest().oauth2?.client_id) throw new Error('Configure your Google OAuth client first. See GMAIL_SETUP.md.');
    try {
      const result = await chrome.identity.getAuthToken({ interactive, scopes: [SCOPE] });
      if (!result.token) throw new Error('No token');
      return result.token;
    } catch { throw new Error('Google Sheets sign-in was cancelled or failed. Check your OAuth test-user setup and try again.'); }
  }
  async function exportJobs() {
    const jobs = await JobStore.list();
    if (!jobs.length) throw new Error('Save at least one job before exporting.');
    const body = JSON.stringify(payload(jobs));
    let token = await accessToken(true);
    let response;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body, signal: AbortSignal.timeout(30000)
        });
        if (response.status !== 401 || attempt === 1) break;
        await chrome.identity.removeCachedAuthToken({ token });
        token = await accessToken(false);
      }
    } catch { throw new Error('The export could not be confirmed. Check Google Drive for a new spreadsheet before retrying.'); }
    if (!response.ok) {
      if (response.status === 403) throw new Error('Google Sheets access was denied. Enable Google Sheets API in your Google Cloud project and add the drive.file scope in Google Auth Platform → Data Access, then try again.');
      if (response.status === 401) throw new Error('Google authorization expired. Try exporting again to reconnect.');
      if (response.status === 429) throw new Error('Google Sheets is temporarily limiting requests. Try again later.');
      throw new Error(`Google Sheets export failed (HTTP ${response.status}).`);
    }
    const spreadsheet = await response.json();
    if (!/^[a-zA-Z0-9_-]+$/.test(spreadsheet.spreadsheetId || '')) throw new Error('Google did not return a valid spreadsheet ID. Check Google Drive before retrying.');
    const result = { url: `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit`, count: jobs.length, exportedAt: new Date().toISOString() };
    try { await chrome.storage.local.set({ sheetsLastExport: result }); } catch { /* The exported file still exists. */ }
    return result;
  }
  return { payload, exportJobs };
})();
