// Shared application storage and appearance preferences.
// See scripts/README.md for page entry points and dependency order.
// Shared application records. Email changes are applied only after user review.
globalThis.JobStore = (() => {
  const statuses = [
    "Saved",
    "Applied",
    "Interviewing",
    "Withdrawn",
    "Rejected",
    "Offer",
  ];
  async function list() {
    const { jobs = [] } = await chrome.storage.local.get("jobs");
    return jobs.map((job) => ({
      ...job,
      status: job.status || "Saved",
      statusHistory: job.statusHistory || [],
    }));
  }
  async function locked(task) {
    return navigator.locks.request("job-tracker-write", task);
  }
  async function add(job, { status = "Saved" } = {}) {
    if (!statuses.includes(status)) throw new Error("Unknown status");
    return locked(async () => {
      const jobs = await list();
      if (jobs.some((existing) => existing.url === job.url)) return false;
      jobs.push({
        ...job,
        status,
        updatedAt: job.savedAt,
        ...(status === "Applied" ? { appliedAt: job.savedAt } : {}),
        statusHistory:
          status === "Saved"
            ? []
            : [
                {
                  from: "Saved",
                  to: status,
                  at: job.savedAt,
                  source: "manual",
                  eventId: null,
                },
              ],
      });
      await chrome.storage.local.set({ jobs });
      return true;
    });
  }
  async function updateStatus(
    id,
    status,
    {
      source = "manual",
      eventId = null,
      expectedStatus = null,
      expectedUpdatedAt = null,
      occurredAt = null,
      emailMessage = null,
      approval = null,
    } = {},
  ) {
    if (!statuses.includes(status)) throw new Error("Unknown status");
    return locked(async () => {
      const jobs = await list();
      const job = jobs.find((item) => item.id === id);
      if (!job) throw new Error("Application not found");
      const alreadyRecorded =
        eventId &&
        (job.statusHistory.some((event) => event.eventId === eventId) ||
          (job.emailActivity || []).some((event) => event.id === eventId));
      if (alreadyRecorded) {
        if (!approval) return;
        const { emailSuggestions = [], emailApprovalUndo = [] } =
          await chrome.storage.local.get([
            "emailSuggestions",
            "emailApprovalUndo",
          ]);
        const suggestion = emailSuggestions.find(
          (item) => item.id === approval.id,
        );
        if (!suggestion || suggestion.review !== "pending")
          throw new Error("This suggestion has already been reviewed.");
        const pending = structuredClone(suggestion);
        suggestion.review = "approved";
        suggestion.jobId = id;
        suggestion.reviewedAt = new Date().toISOString();
        emailApprovalUndo.push({
          kind: "review-only",
          suggestion: pending,
          afterSuggestion: structuredClone(suggestion),
        });
        await chrome.storage.local.set({ emailSuggestions, emailApprovalUndo });
        return;
      }
      if (
        expectedStatus !== null &&
        (job.status !== expectedStatus ||
          (job.updatedAt || job.savedAt) !== expectedUpdatedAt)
      ) {
        throw new Error(
          "This application changed after the suggestion was created. Dismiss this suggestion and check again.",
        );
      }
      if (job.status === status && !approval) return;
      const before = structuredClone(job);
      const at = new Date().toISOString();
      if (!approval?.recordOnly)
        job.statusHistory.push({
          from: job.status,
          to: status,
          at,
          source,
          eventId,
          ...(source === "email" && emailMessage ? { emailMessage } : {}),
        });
      job.status = status;
      job.updatedAt = at;
      if (status === "Applied" && !job.appliedAt)
        job.appliedAt = occurredAt || at;
      if (approval) {
        const { emailSuggestions = [], emailApprovalUndo = [] } =
          await chrome.storage.local.get([
            "emailSuggestions",
            "emailApprovalUndo",
          ]);
        const suggestion = emailSuggestions.find(
          (item) => item.id === approval.id,
        );
        if (!suggestion || suggestion.review !== "pending")
          throw new Error("This suggestion has already been reviewed.");
        const pending = structuredClone(suggestion);
        const statusEvent = job.statusHistory.find(
          (event) => event.eventId === suggestion.id,
        );
        if (statusEvent)
          statusEvent.emailSubject = suggestion.subject || "(No subject)";
        job.emailActivity ||= [];
        job.emailActivity.push({
          id: suggestion.id,
          subject: suggestion.subject || "",
          from: suggestion.from || "",
          snippet: suggestion.snippet || "",
          receivedAt: suggestion.receivedAt,
          approvedAt: at,
          emailMessage,
          automatic: Boolean(approval.automatic),
          fromStatus: before.status,
          toStatus: job.status,
          statusChanged: before.status !== job.status,
          actions: (approval.actions || []).map((action) => ({
            title: action.title,
            deadline: action.deadline || null,
          })),
        });
        job.nextSteps ||= [];
        for (const [index, action] of (approval.actions || []).entries()) {
          const taskId = `${suggestion.id}:action:${index}`;
          if (!job.nextSteps.some((task) => task.id === taskId))
            job.nextSteps.push({
              id: taskId,
              title: action.title,
              deadline: action.deadline || null,
              emailMessage,
              source: "email",
              createdAt: at,
              completed: false,
            });
        }
        suggestion.jobId = id;
        suggestion.review = "approved";
        suggestion.automatic = Boolean(approval.automatic);
        suggestion.reviewedAt = at;
        emailApprovalUndo.push({
          before,
          after: structuredClone(job),
          suggestion: pending,
        });
        await chrome.storage.local.set({
          jobs,
          emailSuggestions,
          emailApprovalUndo,
        });
      } else await chrome.storage.local.set({ jobs });
    });
  }
  async function remove(id) {
    return locked(async () => {
      const jobs = await list();
      await chrome.storage.local.set({
        jobs: jobs.filter((job) => job.id !== id),
      });
    });
  }
  async function dismissEmail(id) {
    return locked(async () => {
      const { emailSuggestions = [], emailApprovalUndo = [] } =
        await chrome.storage.local.get([
          "emailSuggestions",
          "emailApprovalUndo",
        ]);
      const suggestion = emailSuggestions.find((item) => item.id === id);
      if (!suggestion || suggestion.review !== "pending")
        throw new Error("This suggestion has already been reviewed.");
      const before = structuredClone(suggestion);
      suggestion.review = "dismissed";
      suggestion.reviewedAt = new Date().toISOString();
      emailApprovalUndo.push({
        kind: "dismissed",
        suggestion: before,
        afterSuggestion: structuredClone(suggestion),
      });
      await chrome.storage.local.set({ emailSuggestions, emailApprovalUndo });
    });
  }
  function emailUndoCount(jobs, entries, suggestions = null) {
    const snapshots = new Map(
      jobs.map((job) => [
        job.id,
        {
          ...job,
          status: job.status || "Saved",
          statusHistory: job.statusHistory || [],
        },
      ]),
    );
    const reviews =
      suggestions && new Map(suggestions.map((item) => [item.id, item]));
    let count = 0;
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index];
      if (entry?.afterSuggestion) {
        if (
          reviews &&
          JSON.stringify(reviews.get(entry.suggestion.id)) !==
            JSON.stringify(entry.afterSuggestion)
        )
          break;
        reviews?.set(entry.suggestion.id, entry.suggestion);
        count++;
        continue;
      }
      if (
        !entry?.after ||
        JSON.stringify(snapshots.get(entry.after.id)) !==
          JSON.stringify(entry.after)
      )
        break;
      snapshots.set(entry.after.id, entry.before);
      reviews?.set(entry.suggestion.id, entry.suggestion);
      count++;
    }
    return count;
  }
  async function undoEmailApproval(id = null) {
    return locked(async () => {
      const { emailApprovalUndo = [], emailSuggestions = [] } =
        await chrome.storage.local.get([
          "emailApprovalUndo",
          "emailSuggestions",
        ]);
      const undoIndex = id
        ? emailApprovalUndo.findLastIndex((item) => item.suggestion.id === id)
        : emailApprovalUndo.length - 1;
      const entry = emailApprovalUndo[undoIndex];
      if (!entry) throw new Error("No email approvals to undo.");
      const jobs = await list();
      const index = entry.afterSuggestion
        ? -1
        : jobs.findIndex((job) => job.id === entry.after.id);
      const suggestionIndex = emailSuggestions.findIndex(
        (item) => item.id === entry.suggestion.id,
      );
      if (
        entry.afterSuggestion
          ? suggestionIndex < 0 ||
            JSON.stringify(emailSuggestions[suggestionIndex]) !==
              JSON.stringify(entry.afterSuggestion)
          : index < 0 ||
            JSON.stringify(jobs[index]) !== JSON.stringify(entry.after)
      ) {
        throw new Error(
          "Cannot undo: this application was changed or deleted after approval. Your newer changes have been kept.",
        );
      }
      if (!entry.afterSuggestion) jobs[index] = entry.before;
      if (suggestionIndex >= 0)
        emailSuggestions[suggestionIndex] = entry.suggestion;
      else emailSuggestions.push(entry.suggestion);
      emailApprovalUndo.splice(undoIndex, 1);
      await chrome.storage.local.set({
        jobs,
        emailSuggestions,
        emailApprovalUndo,
      });
    });
  }
  async function updateNextSteps(id, change) {
    return locked(async () => {
      const jobs = await list();
      const job = jobs.find((item) => item.id === id);
      if (!job) throw new Error("Application not found");
      const before = structuredClone(job);
      job.nextSteps = change(job.nextSteps || []);
      await chrome.storage.local.set({ jobs });
      return { before, after: structuredClone(job) };
    });
  }
  async function updateDetails(
    id,
    {
      role,
      company,
      notes,
      status,
      url,
      savedAt,
      appliedAt,
      historyEdits = [],
      activityDeletions = [],
      nextSteps,
      emailActivity,
      expectedJob,
    },
    expectedUpdatedAt,
  ) {
    role = typeof role === "string" ? role.trim() : "";
    company = typeof company === "string" ? company.trim() : "";
    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 20000)
    )
      throw new Error("Notes must be at most 20,000 characters.");
    if (status !== undefined && !statuses.includes(status))
      throw new Error("Unknown status");
    if (url !== undefined) {
      try {
        if (!["http:", "https:"].includes(new URL(url).protocol))
          throw new Error();
      } catch {
        throw new Error("Enter a valid http or https job link.");
      }
    }
    for (const value of [savedAt, appliedAt])
      if (value != null && !Number.isFinite(Date.parse(value)))
        throw new Error("Enter valid application dates.");
    if (savedAt === null) throw new Error("Saved date is required.");
    if (!role || role.length > 300 || company.length > 200)
      throw new Error(
        "Enter a role title up to 300 characters and a company up to 200 characters.",
      );
    return locked(async () => {
      const jobs = await list();
      const job = jobs.find((item) => item.id === id);
      if (!job) throw new Error("Application not found");
      if ((job.updatedAt || job.savedAt) !== expectedUpdatedAt)
        throw new Error(
          "This application changed while you were editing. Cancel and click Edit again.",
        );
      if (expectedJob && JSON.stringify(job) !== JSON.stringify(expectedJob))
        throw new Error(
          "This application changed while you were editing. Cancel and click Edit again.",
        );
      if (
        url !== undefined &&
        jobs.some((other) => other.id !== id && other.url === url)
      )
        throw new Error("This job link belongs to another saved application.");
      const before = structuredClone(job);
      for (const edit of historyEdits) {
        const event = job.statusHistory[edit.index];
        if (!event || JSON.stringify(event) !== JSON.stringify(edit.original))
          throw new Error(
            "This activity changed while you were editing. Cancel and edit again.",
          );
        if (
          !statuses.includes(edit.from) ||
          !statuses.includes(edit.to) ||
          !Number.isFinite(Date.parse(edit.at))
        )
          throw new Error("Enter valid activity statuses and dates.");
        Object.assign(event, { from: edit.from, to: edit.to, at: edit.at });
      }
      const at = new Date().toISOString();
      for (const edit of activityDeletions) {
        const event = job.statusHistory[edit.index];
        if (!event) throw new Error("Activity not found.");
        if (edit.deletedAt) {
          if (!Number.isFinite(Date.parse(edit.deletedAt)))
            throw new Error("Invalid activity date.");
          event.activityDeletedAt = edit.deletedAt;
        } else delete event.activityDeletedAt;
      }
      if (emailActivity !== undefined)
        job.emailActivity = structuredClone(emailActivity);
      if (nextSteps !== undefined) {
        if (!Array.isArray(nextSteps)) throw new Error("Invalid next steps.");
        job.nextSteps = structuredClone(nextSteps);
      }
      if (status !== undefined && status !== job.status) {
        job.statusHistory.push({
          from: job.status,
          to: status,
          at,
          source: "manual",
          eventId: null,
        });
        job.status = status;
        if (status === "Applied" && !job.appliedAt) job.appliedAt = at;
      }
      Object.assign(job, {
        role,
        company,
        ...(notes !== undefined ? { notes } : {}),
        ...(url !== undefined ? { url } : {}),
        ...(savedAt !== undefined ? { savedAt } : {}),
      });
      if (appliedAt !== undefined) {
        if (appliedAt) job.appliedAt = appliedAt;
        else if (status !== "Applied") delete job.appliedAt;
      }
      if (JSON.stringify(job) === JSON.stringify(before)) return;
      job.updatedAt = at;
      await chrome.storage.local.set({ jobs });
      return { before, after: structuredClone(job) };
    });
  }
  async function restoreSnapshot({ before, after }) {
    return locked(async () => {
      const jobs = await list();
      const index = jobs.findIndex((job) => job.id === after.id);
      if (index < 0 || JSON.stringify(jobs[index]) !== JSON.stringify(after))
        throw new Error(
          "Cannot undo because this application has newer changes.",
        );
      jobs[index] = structuredClone(before);
      await chrome.storage.local.set({ jobs });
    });
  }
  async function setEmailActivityDeleted(
    id,
    eventId,
    deletedAt,
    expectedDeletedAt = null,
  ) {
    return locked(async () => {
      const jobs = await list();
      const job = jobs.find((item) => item.id === id);
      const event = job?.statusHistory.find(
        (item) => item.source === "email" && item.eventId === eventId,
      );
      if (!event || (event.activityDeletedAt || null) !== expectedDeletedAt)
        throw new Error("This activity changed or was removed.");
      if (deletedAt) event.activityDeletedAt = deletedAt;
      else delete event.activityDeletedAt;
      await chrome.storage.local.set({ jobs });
    });
  }
  return {
    list,
    add,
    updateStatus,
    remove,
    dismissEmail,
    undoEmailApproval,
    emailUndoCount,
    updateNextSteps,
    updateDetails,
    setEmailActivityDeleted,
    restoreSnapshot,
    statuses,
  };
})();
