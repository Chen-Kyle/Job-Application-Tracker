globalThis.EmailSuggestionOrder = (() => {
  const previousStatuses = {
    Applied: ['Saved'],
    Interviewing: ['Saved', 'Applied'],
    Offer: ['Applied', 'Interviewing'],
    Rejected: ['Saved', 'Applied', 'Interviewing'],
    Withdrawn: ['Applied', 'Interviewing']
  };
  function compatible(application, suggestedStatus) {
    return (previousStatuses[suggestedStatus] || []).includes(application.status || 'Saved');
  }
  function sort(applications, suggestion) {
    const candidates = suggestion.candidateIds || [];
    return [...applications].sort((a, b) => {
      const statusPriority = Number(compatible(b, suggestion.status)) - Number(compatible(a, suggestion.status));
      if (statusPriority) return statusPriority;
      const ai = candidates.indexOf(a.id), bi = candidates.indexOf(b.id);
      const candidatePriority = (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
      return candidatePriority || a.role.localeCompare(b.role) || (a.company || '').localeCompare(b.company || '');
    });
  }
  return { compatible, sort };
})();

globalThis.EmailUI = (() => {
  const el = selector => document.querySelector(selector);
  let busy = false;
  let sampleReview = 'pending';
  const sampleUndo = [];
  let renderVersion = 0;
  let timerConnector = {};
  let timerFrequency = 15;
  let nextAutomaticCheckAt = null;
  let loadingAlarm = false;
  async function refreshAutomaticSchedule() {
    if (!inExtension || loadingAlarm) return;
    loadingAlarm = true;
    try { nextAutomaticCheckAt = (await chrome.alarms.get("gmail-check"))?.scheduledTime ?? null; }
    catch { nextAutomaticCheckAt = null; }
    finally { loadingAlarm = false; updateAutomaticTimer(); }
  }
  function updateAutomaticTimer() {
    const timer = el('#gmail-auto-timer');
    if (demo) { timer.textContent = 'Automatic check timer is available when Gmail is connected.'; return; }
    if (!timerConnector.connected) { timer.textContent = 'Connect Gmail to enable automatic checks.'; return; }
    const paused = !timerConnector.autoCheck || !timerFrequency;
    if (paused) { timer.textContent = 'Automatic checks paused.'; return; }
    if (!Number.isFinite(nextAutomaticCheckAt)) { timer.textContent = 'Loading the next automatic check…'; return; }
    const seconds = Math.max(0, Math.ceil((nextAutomaticCheckAt - Date.now()) / 1000));
    const minutes = Math.floor(seconds / 60);
    timer.textContent = seconds ? `Next automatic check in ${minutes}m ${String(seconds % 60).padStart(2, '0')}s` : 'Automatic check due now. Chrome may delay checks while asleep or busy.';
  }
  const selections = new Map();
  const deadlines = new Map();
  const time = value => value ? new Date(value).toLocaleString() : 'Never';
  function feedback(text) { el('#email-message').textContent = text; }
  function renderAutomaticEmails(data) {
    const container = el('#automatic-emails');
    container.replaceChildren();
    const entries = (demo ? samples : data.jobs || []).flatMap(job => (job.emailActivity || [])
      .filter(email => email.automatic && !email.activityDeletedAt).map(email => ({ job, email })))
      .sort((a, b) => Date.parse(b.email.approvedAt) - Date.parse(a.email.approvedAt));
    el('#automatic-email-section').hidden = !entries.length;
    const shorten = (value, limit) => {
      const words = String(value || '').trim().split(/\s+/);
      const text = words.slice(0, limit).join(' ');
      return text.slice(0, 400) + (words.length > limit || text.length > 400 ? '…' : '');
    };
    for (const { job, email } of entries) {
      const card = document.createElement('article'); card.className = 'email-card';
      const heading = document.createElement('h3'); heading.textContent = `${job.role} · ${job.company}`;
      const subject = document.createElement('strong'); subject.textContent = `Email: ${shorten(email.subject || '(No subject)', 15)}`; subject.title = email.subject || '';
      const change = document.createElement('p'); change.className = 'email-change'; change.textContent = `${email.fromStatus} → ${email.toStatus}`;
      const added = document.createElement('p'); added.className = 'email-secondary'; added.textContent = `Automatically added ${time(email.approvedAt)}`;
      const snippet = document.createElement('blockquote'); snippet.textContent = shorten(email.snippet, 50);
      const controls = document.createElement('div'); controls.className = 'email-actions';
      const url = demo ? 'https://mail.google.com/mail/u/0/#inbox' : EmailLinks.message(email.emailMessage?.account, email.emailMessage?.messageId);
      if (url) {
        const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = demo ? 'Open Gmail (sample email is fictional)' : 'Open in Gmail'; controls.append(link);
      }
      const undoEntry = (data.emailApprovalUndo || []).findLast(entry => entry.suggestion.id === email.id);
      if (demo ? job.status === email.toStatus && job.updatedAt === email.approvedAt : undoEntry && JobStore.emailUndoCount(data.jobs || [], [undoEntry], data.emailSuggestions || [])) {
        const undo = document.createElement('button'); undo.type = 'button'; undo.textContent = 'Undo'; undo.disabled = busy;
        undo.setAttribute('aria-label', `Undo automatic update for ${job.role} at ${job.company}`);
        undo.addEventListener('click', async () => {
          if (!demo) return action('undo', { id: email.id });
          job.emailActivity = job.emailActivity.filter(item => item.id !== email.id);
          job.status = 'Saved'; job.appliedAt = null; job.updatedAt = job.savedAt; job.statusHistory = [];
          await refresh(); feedback('Sample automatic update undone. Your real applications are unchanged.');
        }); controls.append(undo);
      }
      card.append(heading, subject, change, added, snippet, controls); container.append(card);
    }
  }
  async function action(action, extra = {}) {
    busy = true;
    await render();
    try {
      const result = await chrome.runtime.sendMessage({ type: 'email-connector', action, ...extra });
      if (!result?.ok) throw new Error(result?.error || 'The connector did not respond. Reload the extension and try again.');
      feedback(action === 'undo' ? 'Email action undone. The email is ready for review again.' : action === 'review' ? (extra.decision === 'approved' ? 'Email approved and added to the application.' : 'Suggestion dismissed.') : action === 'disconnect' ? 'Gmail disconnected. Email suggestions have been cleared.' : action === 'auto' ? (extra.enabled ? 'Periodic checks enabled.' : 'Periodic checks paused.') : action === 'rescan' ? 'Rescan scheduled. Progress appears below and continues in the background.' : 'Email check complete.');
    } catch (error) { feedback(action === 'undo' && /Cannot undo|No email approvals to undo/.test(error.message) ? '' : error.message); }
    finally { busy = false; await render(); }
  }
  async function render() {
    const version = ++renderVersion;
    const data = inExtension ? await chrome.storage.local.get(['emailConnector', 'emailRescan', 'emailSuggestions', 'jobs', 'emailApprovalUndo', 'emailPreferences']) : {};
    if (version !== renderVersion) return;
    renderAutomaticEmails(data);
    const connector = data.emailConnector || {};
    const preferences = EmailPreferences.normalize(data.emailPreferences);
    timerConnector = connector; timerFrequency = preferences.checkFrequency;
    updateAutomaticTimer();
    refreshAutomaticSchedule();
    el('#gmail-auto-label').textContent = preferences.checkFrequency ? `Check every ${preferences.checkFrequency} minutes while Chrome is running` : 'Enable periodic checks (every 15 minutes)';
    el('#gmail-approval-description').textContent = preferences.approvalMode === 'automatic' && !demo ? 'Strong new matches update automatically; uncertain matches need your approval. Undo is available.' : 'Suggestions need your approval.';
    const undoCount = demo ? sampleUndo.length : JobStore.emailUndoCount(data.jobs || [], data.emailApprovalUndo || [], data.emailSuggestions || []);
    el('#email-undo').hidden = !undoCount;
    el('#email-undo').disabled = busy || !undoCount;
    el('#email-undo').textContent = `Undo last email action${undoCount ? ` (${undoCount})` : ''}`;
    const configured = inExtension && Boolean(chrome.runtime.getManifest().oauth2?.client_id);
    el('#gmail-badge').textContent = demo ? 'Sample view' : connector.connected ? 'Connected' : 'Not connected';
    el('#gmail-account').textContent = demo ? 'Try approving or dismissing the fictional email below.' : connector.connected ? connector.email : 'Connect Gmail to check for application updates.';
    el('#gmail-connect').hidden = demo;
    el('#gmail-connect').disabled = busy;
    el('#gmail-connect').textContent = connector.connected ? 'Reconnect Gmail' : 'Connect Gmail';
    el('#gmail-check').hidden = demo || !connector.connected;
    el('#gmail-rescan-form').hidden = demo || !connector.connected;
    const rescan = data.emailRescan;
    el('#gmail-rescan').disabled = busy || rescan?.status === 'running';
    el('#gmail-rescan-days').disabled = busy || rescan?.status === 'running';
    el('#gmail-rescan').textContent = rescan?.status === 'running' ? 'Rescanning…' : rescan?.status === 'paused' ? 'Resume / restart rescan' : 'Rescan emails';
    const totals = rescan?.totals || {};
    el('#gmail-rescan-progress').hidden = demo || !rescan;
    el('#gmail-rescan-progress').textContent = rescan ? `Rescan ${rescan.status}: ${rescan.days} days · ${totals.examined || 0} checked · ${totals.added || 0} new suggestions · ${totals.unmatched || 0} unmatched · ${totals.alreadySuggested || 0} already suggested or recorded.${rescan.status === 'running' ? ' Continues in the background; you can close this dashboard.' : rescan.error ? ` ${rescan.error}` : ' Finished visiting all search results in this range.'}` : '';
    el('#gmail-disconnect').hidden = demo || !connector.connected;
    el('#gmail-check').disabled = el('#gmail-disconnect').disabled = busy;
    el('#gmail-auto').disabled = demo || !connector.connected || busy;
    el('#gmail-auto').checked = !demo && Boolean(connector.autoCheck);
    el('#gmail-last').textContent = demo ? 'Sample preview. No inbox is connected.' : `Last successful check: ${time(connector.lastCheckedAt)}${connector.error ? ` · ${connector.error}` : connector.info ? ` · ${connector.info}` : ''}`;
    el('#gmail-setup').hidden = demo || configured;
    el('#extension-id').textContent = inExtension ? chrome.runtime.id : '';
    let suggestions;
    let currentJobs;
    if (demo) {
      const job = samples.find(item => item.id === 'sample-2');
      currentJobs = samples;
      suggestions = job && sampleReview === 'pending' ? [{ id: 'sample-email', jobId: job.id, role: job.role, company: job.company,
        fromStatus: 'Saved', status: 'Applied', subject: 'Application received: Data Analyst at Juniper Labs',
        from: 'Juniper Labs Recruiting <recruiting@example.com>', snippet: 'Thank you for applying for the Data Analyst position at Juniper Labs. We have received your application.',
        receivedAt: new Date().toISOString(), reason: 'Company and full role match; the message confirms an application was received.' }] : [];
    } else {
      suggestions = (data.emailSuggestions || []).filter(item => item.review === 'pending');
      currentJobs = (data.jobs || []).map(job => ({ ...job, status: job.status || 'Saved' }));
    }
    const pendingCount = suggestions.length;
    const reviewLabel = `${pendingCount} ${pendingCount === 1 ? 'email awaits' : 'emails await'} review${demo ? ' in the sample view' : ''}.`;
    for (const selector of ['#gmail-review-count', '#email-review-count']) {
      const badge = el(selector);
      badge.textContent = pendingCount;
      badge.hidden = pendingCount === 0;
      badge.setAttribute('aria-label', `${pendingCount} pending email suggestions`);
    }
    el('#gmail-review-summary').textContent = pendingCount ? reviewLabel : 'No emails awaiting review.';
    el('.integration').setAttribute('aria-label', `Go to Gmail email suggestions. ${reviewLabel}`);
    const container = el('#email-suggestions');
    container.replaceChildren();
    if (!suggestions.length) {
      const empty = document.createElement('p'); empty.className = 'email-secondary';
      empty.textContent = demo ? 'No sample suggestions remaining.' : connector.connected ? 'No suggestions waiting for review. Unclear email matches are left unchanged.' : 'Connect your inbox to see suggestions here. Your statuses stay under your control.';
      container.append(empty);
    }
    for (const suggestion of suggestions) {
      const selection = selections.get(suggestion.id);
      const job = currentJobs.find(item => item.id === (suggestion.needsSelection ? selection?.jobId : suggestion.jobId));
      const stale = job && (!suggestion.status || job.status === suggestion.status) ? false : suggestion.needsSelection
        ? Boolean(selection && (!job || job.status !== selection.expectedStatus || (job.updatedAt || job.savedAt) !== selection.expectedUpdatedAt))
        : !job || job.status !== suggestion.fromStatus || (!demo && (job.updatedAt || job.savedAt) !== suggestion.expectedUpdatedAt);
      const card = document.createElement('article'); card.className = 'email-card';
      const title = document.createElement('h3'); title.textContent = suggestion.needsSelection ? 'Choose an application for this email' : `${suggestion.role} · ${suggestion.company}`;
      const change = document.createElement('p'); change.className = 'email-change'; change.textContent = suggestion.status ? (suggestion.needsSelection ? `Suggested status: ${suggestion.status}` : `${suggestion.fromStatus} → ${suggestion.status}`) : 'Add email activity and keep the current status';
      const subject = document.createElement('strong'); subject.textContent = suggestion.subject;
      const sender = document.createElement('p'); sender.className = 'email-secondary'; sender.textContent = `${suggestion.from} · ${time(suggestion.receivedAt)}`;
      const snippet = document.createElement('blockquote'); snippet.textContent = suggestion.snippet;
      const reason = document.createElement('p'); reason.className = 'email-secondary'; reason.textContent = stale ? 'This application was changed or removed. Dismiss this outdated suggestion.' : suggestion.reason;
      const controls = document.createElement('div'); controls.className = 'email-actions';
      const approve = document.createElement('button'); approve.type = 'button'; approve.className = 'approve-email'; approve.textContent = suggestion.status ? 'Approve update' : 'Approve email'; approve.disabled = busy || stale || (suggestion.needsSelection && !selection);
      const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.textContent = 'Dismiss'; dismiss.disabled = busy;
      approve.setAttribute('aria-label', suggestion.needsSelection ? `Approve ${suggestion.status || "email activity"} for the selected application` : `Approve ${suggestion.status || "email activity"} for ${suggestion.role} at ${suggestion.company}`);
      dismiss.setAttribute('aria-label', suggestion.needsSelection ? `Dismiss suggestion from ${suggestion.subject}` : `Dismiss email suggestion for ${suggestion.role} at ${suggestion.company}`);
      const decide = async decision => {
        if (!demo) return action('review', { id: suggestion.id, decision, actionDeadlines: deadlines.get(suggestion.id), ...(suggestion.needsSelection ? selections.get(suggestion.id) : {}) });
        sampleUndo.push({ job: decision === 'approved' ? structuredClone(job) : null });
        if (decision === 'approved') {
          const at = new Date().toISOString();
          job.statusHistory.push({ from: job.status, to: suggestion.status, at, source: 'email', eventId: suggestion.id });
          job.status = suggestion.status; job.updatedAt = at; job.appliedAt ||= at;
        }
        sampleReview = decision;
        await refresh();
        feedback(decision === 'approved' ? 'Sample status updated. Your real applications are unchanged.' : 'Sample suggestion dismissed.');
        await render();
      };
      approve.addEventListener('click', () => { decide('approved').catch(error => feedback(error.message)); });
      dismiss.addEventListener('click', () => { decide('dismissed').catch(error => feedback(error.message)); });
      controls.append(approve, dismiss);
      if (!demo) {
        const link = document.createElement('a');
        link.textContent = 'Open in Gmail';
        const emailUrl = EmailLinks.message(suggestion.email, suggestion.messageId);
        if (emailUrl) link.href = emailUrl;
        link.target = '_blank'; link.rel = 'noopener noreferrer'; controls.append(link);
      }
      card.append(title, change, subject, sender, snippet, reason);
      if (suggestion.actions?.length) {
        const taskSection = document.createElement('div'); taskSection.className = 'suggested-next-steps';
        const heading = document.createElement('strong'); heading.textContent = 'Suggested next steps'; taskSection.append(heading);
        const values = deadlines.get(suggestion.id) || suggestion.actions.map(action => action.deadline || '');
        deadlines.set(suggestion.id, values);
        suggestion.actions.forEach((action, index) => {
          const label = document.createElement('label'); label.textContent = `${action.title} — proposed deadline (confirm or clear)`;
          const input = document.createElement('input'); input.type = 'date'; input.value = values[index]; input.disabled = busy;
          input.addEventListener('change', () => { values[index] = input.value; }); label.append(input); taskSection.append(label);
        });
        card.append(taskSection);
      }
      if (suggestion.needsSelection) {
        const label = document.createElement('label'); label.className = 'application-picker'; label.textContent = 'Saved application';
        const picker = document.createElement('select'); picker.disabled = busy;
        const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose an application…'; picker.append(placeholder);
        const sorted = EmailSuggestionOrder.sort(currentJobs, suggestion);
        for (const application of sorted) {
          const option = document.createElement('option'); option.value = application.id;
          option.textContent = `${application.company || 'Unknown company'} · ${application.role} · ${application.status}`;
          picker.append(option);
        }
        picker.value = selection?.jobId || '';
        picker.addEventListener('change', () => {
          const application = currentJobs.find(item => item.id === picker.value);
          if (application) selections.set(suggestion.id, { jobId: application.id, expectedStatus: application.status, expectedUpdatedAt: application.updatedAt || application.savedAt });
          else selections.delete(suggestion.id);
          render().catch(error => feedback(error.message));
        });
        label.append(picker); card.append(label);
      }
      card.append(controls);
      container.append(card);
    }
  }
  el('#email-undo').addEventListener('click', async () => {
    if (!demo) {
      await render();
      if (el('#email-undo').hidden || busy) return;
      return action('undo');
    }
    const before = sampleUndo.pop();
    if (!before) return;
    const index = samples.findIndex(job => job.id === before.job?.id);
    if (index >= 0) samples[index] = before.job;
    sampleReview = 'pending';
    await refresh();
    await render();
    feedback('Sample email action undone.');
  });
  el('#gmail-connect').addEventListener('click', () => { feedback('Connecting to Gmail…'); action('connect'); });
  el('#gmail-check').addEventListener('click', () => { feedback('Checking application emails…'); action('check'); });
  el('#gmail-rescan-form').addEventListener('submit', event => {
    event.preventDefault();
    const days = Number(el('#gmail-rescan-days').value);
    if (!Number.isInteger(days) || days < 1 || days > 3650) { feedback('Enter a whole number of days between 1 and 3650.'); return; }
    feedback(`Rescan queued for the last ${days} days. Progress is saved between background batches.`);
    action('rescan', { days });
  });
  el('#gmail-disconnect').addEventListener('click', () => { action('disconnect'); });
  el('#gmail-auto').addEventListener('change', event => { action('auto', { enabled: event.target.checked }); });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || busy || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z' || event.shiftKey || event.altKey) return;
    if (document.querySelector('dialog[open]') || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const undo = el('#email-undo');
    if (undo.hidden || undo.disabled) return;
    event.preventDefault();
    undo.click();
  });
  if (inExtension) chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.emailConnector || changes.emailRescan || changes.emailSuggestions || changes.jobs || changes.emailApprovalUndo || changes.emailPreferences)) render().catch(() => feedback('Could not refresh email suggestions.'));
  });
  setInterval(updateAutomaticTimer, 1000);
  setInterval(() => { if (!document.hidden) refreshAutomaticSchedule(); }, 5000);
  refreshAutomaticSchedule();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshAutomaticSchedule(); });
  render().catch(() => feedback('Could not load the email connector.'));
  return { render };
})();
