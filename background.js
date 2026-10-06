importScripts('store.js', 'email-actions.js', 'email-matcher.js', 'gmail-message.js', 'google-sheets.js', 'email-preferences.js');
const ALARM = 'gmail-check';
const INTERVAL = 15;
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
function matchingContext(jobs) {
  // Ignore notes, activity and timestamps: these do not identify an application.
  return JSON.stringify(jobs.map(job => [job.id, job.company || '', job.role || '', job.url || '',
    job.requisitionId || '', [...(job.companyAliases || [])].sort()]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}
function searchQuery(jobs, days = 30) {
  // Bound company phrases to keep the Gmail query small; general job terms cover remaining employers.
  const terms = EmailMatcher.searchTerms(jobs).slice(0, 100).map(name => `"${name.replace(/["\\{}]/g, ' ')}"`).join(' ');
  return `newer_than:${days}d -in:spam -in:trash -in:sent {application applied interview assessment "technical test" recruiter "offer of employment" "job offer" withdrawal withdrawn ${terms}}`;
}

async function state() {
  const { emailConnector = {} } = await chrome.storage.local.get('emailConnector');
  return emailConnector;
}
async function patchState(patch) {
  await chrome.storage.local.set({ emailConnector: { ...await state(), ...patch } });
}
function configured() {
  const oauth = chrome.runtime.getManifest().oauth2;
  return Boolean(oauth?.client_id && oauth.scopes?.includes(SCOPE));
}
async function token(interactive = false) {
  if (!configured()) throw new Error('Gmail setup is required. Follow GMAIL_SETUP.md in the extension folder, then reload the extension.');
  try {
    const auth = await chrome.identity.getAuthToken({ interactive, scopes: [SCOPE] });
    if (!auth.token) throw new Error('Missing token');
    return auth.token;
  } catch {
    throw new Error(interactive ? 'Gmail sign-in failed or was cancelled. Check the OAuth setup and try again.' : 'Gmail needs you to reconnect. Click Connect Gmail to sign in again.');
  }
}
async function gmail(path, accessToken, retry = true) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000)
  });
  if (response.status === 401 && retry) {
    await chrome.identity.removeCachedAuthToken({ token: accessToken });
    return gmail(path, await token(), false);
  }
  if (!response.ok) {
    if (response.status === 403) throw new Error('Gmail access was denied. Check that Gmail API is enabled and read-only access was granted.');
    if (response.status === 429) throw new Error('Gmail is temporarily limiting requests. Try again later.');
    throw new Error(`Gmail could not be checked (HTTP ${response.status}). Try again later.`);
  }
  return response.json();
}
function summarize(raw) {
  const headers = raw.payload?.headers || [];
  const header = name => headers.find(item => item.name.toLowerCase() === name.toLowerCase())?.value || '';
  return { messageId: raw.id, subject: header('Subject').slice(0, 500), from: header('From').slice(0, 300),
    snippet: (raw.snippet || '').slice(0, 1000), receivedAt: new Date(Number(raw.internalDate)).toISOString() };
}
async function ensureAlarm() {
  const current = await state();
  const { checkFrequency } = await EmailPreferences.get();
  if (current.connected && current.autoCheck && checkFrequency) {
    const alarm = await chrome.alarms.get(ALARM);
    if (!alarm || alarm.periodInMinutes !== checkFrequency) await chrome.alarms.create(ALARM, { delayInMinutes: checkFrequency, periodInMinutes: checkFrequency });
  } else await chrome.alarms.clear(ALARM);
}

async function scan({ automatic = false, rescanDays = null, rescanPageToken = null } = {}) {
  const current = await state();
  if (!current.connected) throw new Error('Connect Gmail before checking email.');
  const jobs = await JobStore.list();
  if (!jobs.length) {
    const at = new Date().toISOString();
    await patchState({ lastCheckedAt: at, ...(automatic ? { lastAutomaticCheckAt: at } : {}), error: '', info: 'Save a job first. No emails were read.' });
    return;
  }
  try {
    const accessToken = await token();
    const profile = await gmail('profile', accessToken);
    if (profile.emailAddress !== current.email) throw new Error('The Google account changed. Disconnect and reconnect Gmail before checking again.');
    // Always check the first page for new mail, then continue the older backlog.
    const query = searchQuery(jobs, rescanDays || 30);
    const context = matchingContext(jobs);
    const params = new URLSearchParams({ q: query, maxResults: rescanDays ? '25' : '5' });
    if (rescanDays && rescanPageToken) params.set('pageToken', rescanPageToken);
    const newest = await gmail(`messages?${params}`, accessToken);
    let page = newest;
    const messages = [...(newest.messages || [])];
    if (!rescanDays && current.matcherRevision === 5 && current.matchingContext === context && current.searchQuery === query && current.nextPageToken) {
      params.set('pageToken', current.nextPageToken);
      page = await gmail(`messages?${params}`, accessToken);
      messages.push(...(page.messages || []));
    }
    const candidates = [...new Map(messages.map(item => [item.id, item])).values()];
    const { emailSuggestions = [], emailSeen = [], emailExamined = {} } = await chrome.storage.local.get(['emailSuggestions', 'emailSeen', 'emailExamined']);
    const examinedIds = new Set(emailExamined.account === current.email && emailExamined.context === context && emailExamined.revision === 1 ? emailExamined.ids || [] : []);
    const seen = new Set(emailSeen);
    const keys = new Set(emailSuggestions.map(item => item.id));
    // Backups carry recorded activity even when the suggestion queue is empty.
    for (const job of jobs) {
      for (const event of job.statusHistory || []) if (event.source === 'email' && event.eventId) keys.add(event.eventId);
      for (const event of job.emailActivity || []) if (event.id) keys.add(event.id);
    }
    let added = 0;
    let examined = 0;
    let unmatched = 0;
    let skipped = 0;
    const newSuggestions = [];
    for (const item of candidates) {
      const key = `${current.email}:${item.id}`;
      if (keys.has(key) || (!rescanDays && examinedIds.has(item.id))) { skipped++; continue; }
      const raw = await gmail(`messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, accessToken);
      const message = summarize(raw);
      examined++;
      let match = EmailMatcher.analyze(message, jobs);
      if (match?.needsSelection || (!match && EmailMatcher.relevantCompany(message, jobs))) {
        const full = await gmail(`messages/${encodeURIComponent(item.id)}?format=full`, accessToken);
        message.bodyText = GmailMessage.bodyText(full.payload);
        match = EmailMatcher.analyze(message, jobs);
      }
      if (!match) unmatched++;
      if (match && !keys.has(key)) {
        const { bodyText, ...preview } = message;
        if (bodyText) preview.snippet = bodyText.slice(0, 1000);
        emailSuggestions.push({ id: key, ...preview, ...match, email: current.email, review: 'pending', createdAt: new Date().toISOString() });
        keys.add(key); added++;
        newSuggestions.push(emailSuggestions.at(-1));
      }
      // Unmatched mail is reconsidered when application identity changes.
      examinedIds.add(item.id);
      if (match) seen.add(key);
    }
    // A bounded dedupe cache covers ordinary personal job-search volumes.
    await chrome.storage.local.set({ emailSuggestions, emailSeen: [...seen].slice(-10000),
      emailExamined: { account: current.email, context, revision: 1, ids: [...examinedIds].slice(-10000) } });
    let autoApproved = 0;
    if ((await EmailPreferences.get()).approvalMode === 'automatic') {
      for (const suggestion of newSuggestions.sort((a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt))) {
        if (!EmailPreferences.eligible(suggestion)) continue;
        try { await review(suggestion.id, 'approved', { automatic: true }); autoApproved++; }
        catch { /* Keep changed or uncertain applications in the review queue. */ }
      }
    }
    const at = new Date().toISOString();
    await patchState({ lastCheckedAt: at, ...(automatic ? { lastAutomaticCheckAt: at } : {}), error: '', ...(!rescanDays ? { nextPageToken: page.nextPageToken || null, matcherRevision: 5, searchQuery: query, matchingContext: context } : {}),
      info: `${added} new ${added === 1 ? 'suggestion' : 'suggestions'}.${autoApproved ? ` ${autoApproved} automatically approved (Undo is available).` : ''} ${examined} emails examined; ${unmatched} had no clear status/application match. ${skipped} previously examined or queued emails skipped.${page.nextPageToken ? ' More messages remain; use Check now again or wait for the next check.' : ''}` });
    return { nextPageToken: page.nextPageToken || null, examined, skipped, added };
  } catch (error) {
    // Restart pagination after an expired page token or other failed check.
    await patchState({ error: error.message || 'Email check failed. Try again.', nextPageToken: null });
    throw error;
  }
}

async function review(id, decision, selection = {}) {
  if (!['approved', 'dismissed'].includes(decision)) throw new Error('Unknown review action');
  const { emailSuggestions = [] } = await chrome.storage.local.get('emailSuggestions');
  const suggestion = emailSuggestions.find(item => item.id === id);
  if (!suggestion || suggestion.review !== 'pending') throw new Error('This suggestion has already been reviewed.');
  if (decision === 'approved') {
    const jobId = suggestion.needsSelection ? selection.jobId : suggestion.jobId;
    if (!jobId) throw new Error('Choose a saved application before approving.');
    let expectedStatus = suggestion.needsSelection ? selection.expectedStatus : suggestion.fromStatus;
    let expectedUpdatedAt = suggestion.needsSelection ? selection.expectedUpdatedAt : suggestion.expectedUpdatedAt;
    // A manual approval can attach an email to an already-current status.
    if (!selection.automatic) {
      const job = (await JobStore.list()).find(item => item.id === jobId);
      if (job && (!suggestion.status || job.status === suggestion.status)) {
        expectedStatus = job.status;
        expectedUpdatedAt = job.updatedAt || job.savedAt;
      }
    }
    if (!expectedStatus || !expectedUpdatedAt) throw new Error('Reload the dashboard and choose the application again.');
    const actions = (suggestion.actions || []).map((action, index) => {
      const deadline = selection.actionDeadlines?.[index] ?? action.deadline;
      if (deadline && !EmailActions.validDate(deadline)) throw new Error('Enter a valid next-step deadline.');
      return { ...action, deadline: deadline || null };
    });
    const job = (await JobStore.list()).find(item => item.id === jobId);
    await JobStore.updateStatus(jobId, suggestion.status || job?.status, {
      source: 'email', eventId: suggestion.id, expectedStatus,
      expectedUpdatedAt, occurredAt: suggestion.receivedAt,
      emailMessage: { account: suggestion.email, messageId: suggestion.messageId }, approval: { id: suggestion.id, actions, recordOnly: !suggestion.status, automatic: Boolean(selection.automatic) }
    });
    return;
  }
  await JobStore.dismissEmail(id);
}

async function handle(message) {
  switch (message.action) {
    case 'subjects': {
      const current = await state();
      if (!current.connected) return;
      const job = (await JobStore.list()).find(item => item.id === message.jobId);
      if (!job) return;
      const missing = (job.statusHistory || []).filter(event => event.source === 'email' && !event.emailSubject && !event.activityDeletedAt).slice(0, 10);
      const subjects = new Map();
      let accessToken;
      for (const event of missing) {
        const separator = typeof event.eventId === 'string' ? event.eventId.lastIndexOf(':') : -1;
        const source = event.emailMessage || (separator >= 0 ? { account: event.eventId.slice(0, separator), messageId: event.eventId.slice(separator + 1) } : null);
        if (source?.account !== current.email || !/^[a-zA-Z0-9_-]+$/.test(source.messageId || '')) continue;
        accessToken ||= await token();
        try {
          const raw = await gmail(`messages/${encodeURIComponent(source.messageId)}?format=metadata&metadataHeaders=Subject`, accessToken);
          subjects.set(event.eventId, raw.payload?.headers?.find(header => header.name.toLowerCase() === 'subject')?.value || '(No subject)');
        } catch { /* Deleted or inaccessible emails remain marked unavailable. */ }
      }
      if (!subjects.size) return;
      await navigator.locks.request('job-tracker-write', async () => {
        const jobs = await JobStore.list();
        const latest = jobs.find(item => item.id === message.jobId);
        if (!latest) return;
        for (const event of latest.statusHistory || []) if (!event.emailSubject && subjects.has(event.eventId)) event.emailSubject = subjects.get(event.eventId);
        await chrome.storage.local.set({ jobs });
      });
      return;
    }
    case 'connect': {
      const accessToken = await token(true);
      const profile = await gmail('profile', accessToken);
      const previous = await state();
      if (previous.email && previous.email !== profile.emailAddress) {
        await chrome.storage.local.set({ emailSuggestions: [], emailSeen: [], emailExamined: {}, emailApprovalUndo: [] });
      }
      await patchState({ connected: true, email: profile.emailAddress, autoCheck: previous.autoCheck ?? true, ...(previous.email !== profile.emailAddress ? { lastAutomaticCheckAt: null } : {}), error: '', nextPageToken: null });
      await ensureAlarm();
      await scan();
      return;
    }
    case 'disconnect': {
      await patchState({ connected: false, autoCheck: false, email: '', nextPageToken: null, error: '', info: '', lastCheckedAt: null, lastAutomaticCheckAt: null });
      await chrome.alarms.clear(ALARM);
      await chrome.storage.local.set({ emailSuggestions: [], emailSeen: [], emailExamined: {}, emailApprovalUndo: [] });
      try { await chrome.identity.clearAllCachedAuthTokens(); } catch { /* Checks remain disabled. */ }
      return;
    }
    case 'check': return scan();
    case 'rescan': {
      const days = message.days;
      if (!Number.isInteger(days) || days < 1 || days > 3650) throw new Error('Enter a whole number of days between 1 and 3650.');
      if (!(await JobStore.list()).length) throw new Error('Save an application before rescanning.');
      let cursor = null;
      const totals = { examined: 0, skipped: 0, added: 0 };
      do {
        const batch = await scan({ rescanDays: days, rescanPageToken: cursor });
        for (const field of Object.keys(totals)) totals[field] += batch[field];
        cursor = batch.nextPageToken;
        await patchState({ info: `Rescan ${cursor ? 'in progress' : 'complete'}: last ${days} days · ${totals.examined} emails reexamined · ${totals.skipped} already suggested emails skipped · ${totals.added} new suggestions.${cursor ? ' Continuing older messages…' : ''}` });
      } while (cursor);
      return;
    }
    case 'auto': {
      if (!(await state()).connected) throw new Error('Connect Gmail first.');
      await patchState({ autoCheck: Boolean(message.enabled) });
      const preferences = await EmailPreferences.get();
      await chrome.storage.local.set({ emailPreferences: { ...preferences, checkFrequency: message.enabled ? preferences.checkFrequency || INTERVAL : 0 } });
      return ensureAlarm();
    }
    case 'preferences': {
      if (!['manual', 'automatic'].includes(message.preferences?.approvalMode) || ![0, 15, 30, 60].includes(message.preferences?.checkFrequency)) throw new Error('Choose a valid approval mode and check frequency.');
      const preferences = EmailPreferences.normalize(message.preferences);
      await chrome.storage.local.set({ emailPreferences: preferences });
      await patchState({ autoCheck: preferences.checkFrequency > 0 });
      return ensureAlarm();
    }
    case 'review': return review(message.id, message.decision, message);
    case 'undo': return JobStore.undoEmailApproval(message.id);
    default: throw new Error('Unknown email action');
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'sheets-export' && sender.id === chrome.runtime.id) {
    navigator.locks.request('sheets-export', () => GoogleSheets.exportJobs())
      .then(result => respond({ ok: true, ...result }), error => respond({ ok: false, error: error.message || 'Export failed.' }));
    return true;
  }
  if (message?.type !== 'email-connector' || sender.id !== chrome.runtime.id) return;
  navigator.locks.request('email-connector', () => handle(message))
    .then(() => respond({ ok: true }), error => respond({ ok: false, error: error.message || 'Email action failed.' }));
  return true;
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM) navigator.locks.request('email-connector', async () => {
    const current = await state();
    if (current.connected && current.autoCheck && (await EmailPreferences.get()).checkFrequency) await scan({ automatic: true });
  }).catch(() => {});
});
chrome.runtime.onStartup.addListener(() => { ensureAlarm().catch(() => {}); });
chrome.runtime.onInstalled.addListener(() => { ensureAlarm().catch(() => {}); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.emailPreferences) navigator.locks.request('email-connector', ensureAlarm).catch(() => {});
});
ensureAlarm().catch(() => {});
