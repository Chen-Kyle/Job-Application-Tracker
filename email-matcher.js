// General local matching rules; no employer-specific exceptions or AI service.
globalThis.EmailMatcher = (() => {
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const includes = (text, phrase) => phrase && ` ${text} `.includes(` ${phrase} `);
  function companyName(value) {
    return normalize(value).replace(/\b(jobs|careers|inc|incorporated|llc|ltd|limited|com|corp|corporation|plc)\b/g, '').replace(/\s+/g, ' ').trim();
  }
  function companyNames(job) {
    const names = [companyName(job.company), ...(job.companyAliases || []).map(companyName)];
    // Recruiting-platform URL structure identifies the employer tenant, regardless of company.
    try {
      const url = new URL(job.url);
      if (/\.myworkdayjobs\.com$/i.test(url.hostname)) names.push(companyName(url.hostname.split('.')[0]));
      if (/^(?:jobs\.)?(?:lever\.co|greenhouse\.io|boards\.greenhouse\.io)$/i.test(url.hostname)) names.push(companyName(url.pathname.split('/').filter(Boolean)[0]));
    } catch { /* Manual review is available when employer identity is missing. */ }
    return [...new Set(names)].filter(name => name.length >= 3 && !['workday', 'myworkdayjobs', 'myworkday', 'linkedin', 'indeed', 'greenhouse', 'lever', 'www', 'jobs'].includes(name));
  }
  function classify(text) {
    const patterns = [
      ['Rejected', /\b(not (?:be )?(?:moving|proceeding) forward|will not be (?:moving|proceeding) forward|decided (?:not to proceed|to (?:move|proceed) (?:forward )?with other candidates)|not been selected|unable to offer you (?:the |a )?(?:position|employment|role)|application (?:was |has been )?(?:unsuccessful|rejected))\b/i],
      ['Withdrawn', /\b(your application (?:has been |was )?withdrawn|confirm(?:ation|ing)? (?:of )?your withdrawal|you have withdrawn your application)\b/i],
      ['Offer', /\b(pleased to offer you|offer of employment|your (?:job|employment) offer|extend (?:you )?(?:an |a job )?offer)\b/i],
      ['Interviewing', /\b(invite you (?:to|for) (?:an? |the )?interview|schedule (?:an? |your |the )?interview|interview (?:invitation|confirmation)|your (?:upcoming )?interview (?:is scheduled|has been scheduled))\b/i],
      ['Applied', /\b((?:thank you|thanks) for (?:applying|your application)|we(?: have|['’]ve)? received your application|you have successfully applied|application (?:has been |was )?(?:received|submitted)|application (?:has been |was )?sent to|application confirmation)\b/i]
    ];
    let statuses = patterns.filter(([, pattern]) => pattern.test(text)).map(([status]) => status);
    // Future instructions and failed submissions are not confirmations.
    if (/\bapplication (?:(?:has |was |is )?(?:not|never) (?:been )?sent|(?:will|may|might|can) be sent|(?:could not|couldn't|cannot|can't|wasn't|hasn't been) (?:be )?sent)\b/i.test(text)) {
      statuses = statuses.filter(status => status !== 'Applied');
    }
    if (/\b(?:cannot|can't|unable to|will not|won't|not able to) (?:schedule|invite)\b/i.test(text)) statuses = statuses.filter(status => status !== 'Interviewing');
    if (/\b(?:if|may|might|could|cannot|will not|won't|not able to) (?:we )?(?:extend|offer)\b/i.test(text)) statuses = statuses.filter(status => status !== 'Offer');
    const subsequent = statuses.filter(status => status !== 'Applied');
    return subsequent.length === 1 ? subsequent[0] : subsequent.length > 1 ? null : statuses[0] || null;
  }
  function jobId(job) {
    if (job.requisitionId) return String(job.requisitionId).toUpperCase();
    try {
      const url = new URL(job.url);
      return (url.pathname.match(/\/(?:jobs?|positions?)\/([a-z]{0,6}[-_]?\d{4,})(?:\/|$)/i)?.[1]
        || url.pathname.match(/[_/](JR\d{4,})(?:\/|$)/i)?.[1]
        || ['jobId', 'job_id', 'gh_jid', 'requisitionId'].map(key => url.searchParams.get(key)).find(value => /^[a-z]{0,6}[-_]?\d{4,}$/i.test(value || '')) || '').toUpperCase();
    } catch { return ''; }
  }
  function analyzeStatus(message, jobs) {
    const content = `${message.subject} ${message.bodyText || message.snippet}`;
    const status = classify(content);
    if (!status) return null;
    const text = normalize(content);
    const companyText = normalize(`${message.from} ${content}`);
    const emailIds = [...content.matchAll(/\b(?:job\s*(?:id|number|#)|requisition\s*(?:id|number|#)|id)\s*[:#-]?\s*([a-z]{0,6}[-_]?\d{4,})\b/gi)].map(match => match[1].toUpperCase());
    const ranked = jobs.map(job => {
      const company = companyNames(job).some(name => includes(companyText, name));
      const role = normalize(job.role);
      const roleMatch = role.length >= 5 && includes(text, role);
      const id = jobId(job);
      const idMatch = id && emailIds.includes(id);
      const wrongId = id && emailIds.length > 0 && !idMatch;
      const linkMatch = job.url && content.includes(job.url);
      return { job, strong: !wrongId && (linkMatch || (company && (idMatch || roleMatch))), score: (company ? 2 : 0) + (roleMatch ? 3 : 0) + (idMatch ? 5 : 0) + (linkMatch ? 7 : 0) };
    }).sort((a, b) => b.score - a.score);
    const strong = ranked.filter(item => item.strong);
    if (strong.length === 1) {
      const job = strong[0].job;
      const currentStatus = job.status || 'Saved';
      if (currentStatus === status || ['Rejected', 'Withdrawn', 'Offer'].includes(currentStatus)) return null;
      if (status === 'Applied' && currentStatus !== 'Saved') return null;
      if (Date.parse(message.receivedAt) < Date.parse(job.appliedAt || job.savedAt) - 86400000) return null;
      return { jobId: job.id, role: job.role, company: job.company, fromStatus: currentStatus,
        expectedUpdatedAt: job.updatedAt || job.savedAt, status, needsSelection: false,
        reason: 'A unique application matches the email’s company and role, job ID, or saved link.' };
    }
    return { jobId: null, status, needsSelection: true, candidateIds: ranked.filter(item => item.score > 0).map(item => item.job.id),
      reason: strong.length > 1 ? 'Several saved applications match. Choose the application this email belongs to.' : 'The email contains clear status wording, but its application could not be identified. Choose a saved application.' };
  }
  function match(message, jobs) {
    const result = analyzeStatus(message, jobs);
    return result && !result.needsSelection ? result : null;
  }
  function relevantCompany(message, jobs) {
    const text = normalize(`${message.from} ${message.subject} ${message.snippet}`);
    return jobs.some(job => companyNames(job).some(name => includes(text, name)));
  }
  function analyze(message, jobs) {
    const content = `${message.subject} ${message.bodyText || message.snippet}`;
    const actions = EmailActions.suggest(content, message.receivedAt);
    const legacy = analyzeStatus(message, jobs);
    if (legacy) return { ...legacy, actions, requiresReview: actions.length > 0 };
    const status = classify(content);
    const text = normalize(`${message.from} ${content}`);
    const relevant = jobs.filter(job => companyNames(job).some(name => includes(text, name)));
    const context = /\b(application|candidate|recruit(?:er|ing|ment)?|interview|assessment|position|role|hiring|offer|withdrawn)\b/i.test(content);
    if (!actions.length && (!relevant.length || !context)) return null;
    if (!relevant.length) return actions.length ? { status: null, actions, needsSelection: true, candidateIds: [], requiresReview: true,
      reason: 'An action was requested, but the saved application needs to be selected.' } : null;
    const strong = relevant.filter(job => includes(normalize(content), normalize(job.role)) || (job.url && content.includes(job.url)));
    const job = strong.length === 1 ? strong[0] : null;
    const currentStatus = job?.status || 'Saved';
    // Already-current, old, or terminal statuses can still have useful email activity.
    // They are logged without forcing a status transition.
    return { jobId: job?.id || null, role: job?.role, company: job?.company,
      fromStatus: job ? currentStatus : null, expectedUpdatedAt: job ? job.updatedAt || job.savedAt : null,
      status: null, actions, needsSelection: !job, candidateIds: relevant.map(job => job.id), requiresReview: true,
      reason: job ? 'Relevant application email. Review its activity and next steps; the current status will be kept.' : 'The employer matches, but the specific application needs to be selected. The current status will be kept.' };
  }
  function searchTerms(jobs) { return [...new Set(jobs.flatMap(companyNames))]; }
  return { match, analyze, classify, relevantCompany, searchTerms };
})();
