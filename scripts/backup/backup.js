// JSON backup validation, export/restore and the settings-page backup controls.
// See scripts/README.md for page entry points and dependency order.
globalThis.JobBackup = (() => {
  const themes = ["green", "violet", "blue", "dark", "terracotta"];
  const statuses = [
    "Saved",
    "Applied",
    "Interviewing",
    "Withdrawn",
    "Rejected",
    "Offer",
  ];
  function fail() {
    throw new Error("This file is not a valid Job Tracker backup.");
  }
  function string(value, max = 1000) {
    if (typeof value !== "string" || value.length > max) fail();
    return value;
  }
  function date(value) {
    if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
      fail();
    return value;
  }
  function status(value) {
    if (!statuses.includes(value)) fail();
    return value;
  }
  function validate(value) {
    if (
      !value ||
      value.format !== "job-tracker-backup" ||
      value.version !== 1 ||
      !Array.isArray(value.jobs) ||
      value.jobs.length > 10000
    )
      fail();
    const ids = new Set(),
      urls = new Set();
    const jobs = value.jobs.map((item) => {
      if (!item || typeof item !== "object") fail();
      const id = string(item.id, 200),
        url = string(item.url, 10000);
      if (!id || ids.has(id) || urls.has(url)) fail();
      try {
        if (!["https:", "http:"].includes(new URL(url).protocol)) fail();
      } catch {
        fail();
      }
      ids.add(id);
      urls.add(url);
      const job = {
        id,
        url,
        role: string(item.role, 1000),
        company: string(item.company || "", 1000),
        savedAt: date(item.savedAt),
        status: status(item.status || "Saved"),
        updatedAt: date(item.updatedAt || item.savedAt),
        statusHistory: [],
      };
      if (item.recruiterContacts !== undefined)
        job.recruiterContacts = RecruiterData.normalize(item.recruiterContacts);
      if (!job.role.trim()) fail();
      if (item.appliedAt != null) job.appliedAt = date(item.appliedAt);
      if (item.companyAliases !== undefined) {
        if (
          !Array.isArray(item.companyAliases) ||
          item.companyAliases.length > 100
        )
          fail();
        job.companyAliases = item.companyAliases.map((alias) => string(alias));
      }
      if (item.requisitionId !== undefined)
        job.requisitionId = string(item.requisitionId);
      if (item.notes !== undefined) job.notes = string(item.notes, 20000);
      if (item.emailActivity !== undefined) {
        if (
          !Array.isArray(item.emailActivity) ||
          item.emailActivity.length > 10000
        )
          fail();
        job.emailActivity = item.emailActivity.map((activity) => {
          if (
            !activity ||
            typeof activity.statusChanged !== "boolean" ||
            !Array.isArray(activity.actions)
          )
            fail();
          const record = {
            id: string(activity.id),
            subject: string(activity.subject, 500),
            from: string(activity.from, 300),
            snippet: string(activity.snippet, 1000),
            receivedAt: date(activity.receivedAt),
            approvedAt: date(activity.approvedAt),
            fromStatus: status(activity.fromStatus),
            toStatus: status(activity.toStatus),
            statusChanged: activity.statusChanged,
            emailMessage: {
              account: string(activity.emailMessage.account),
              messageId: string(activity.emailMessage.messageId),
            },
            actions: activity.actions.map((action) => {
              if (
                action.deadline &&
                (!/^\d{4}-\d{2}-\d{2}$/.test(action.deadline) ||
                  !Number.isFinite(Date.parse(action.deadline)))
              )
                fail();
              return {
                title: string(action.title, 300),
                deadline: action.deadline || null,
              };
            }),
          };
          if (activity.activityDeletedAt)
            record.activityDeletedAt = date(activity.activityDeletedAt);
          if (activity.automatic !== undefined) {
            if (typeof activity.automatic !== "boolean") fail();
            record.automatic = activity.automatic;
          }
          return record;
        });
      }
      if (item.nextSteps !== undefined) {
        if (!Array.isArray(item.nextSteps) || item.nextSteps.length > 10000)
          fail();
        const taskIds = new Set();
        job.nextSteps = item.nextSteps.map((task) => {
          if (!task || typeof task.completed !== "boolean") fail();
          const id = string(task.id, 200),
            title = string(task.title, 300);
          if (!id || taskIds.has(id) || !title.trim()) fail();
          taskIds.add(id);
          if (
            task.deadline != null &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(task.deadline) ||
              !Number.isFinite(Date.parse(task.deadline)))
          )
            fail();
          if (task.emailUrl != null) {
            try {
              const url = new URL(string(task.emailUrl, 10000));
              if (
                url.protocol !== "https:" ||
                url.hostname !== "mail.google.com"
              )
                fail();
            } catch {
              fail();
            }
          }
          const step = {
            id,
            title,
            deadline: task.deadline || null,
            emailUrl: task.emailUrl || null,
            source: task.source === "email" ? "email" : "manual",
            createdAt: date(task.createdAt),
            completed: task.completed,
          };
          if (task.completedAt != null)
            step.completedAt = date(task.completedAt);
          if (task.emailMessage)
            step.emailMessage = {
              account: string(task.emailMessage.account),
              messageId: string(task.emailMessage.messageId),
            };
          return step;
        });
      }
      if (
        item.statusHistory !== undefined &&
        (!Array.isArray(item.statusHistory) ||
          item.statusHistory.length > 10000)
      )
        fail();
      job.statusHistory = (item.statusHistory || []).map((event) => {
        if (!event || !["manual", "email"].includes(event.source)) fail();
        const entry = {
          from: status(event.from),
          to: status(event.to),
          at: date(event.at),
          source: event.source,
          eventId: event.eventId == null ? null : string(event.eventId),
        };
        if (event.emailMessage)
          entry.emailMessage = {
            account: string(event.emailMessage.account),
            messageId: string(event.emailMessage.messageId),
          };
        if (event.activityDeletedAt)
          entry.activityDeletedAt = date(event.activityDeletedAt);
        if (event.emailSubject !== undefined || event.subject !== undefined)
          entry.emailSubject = string(
            event.emailSubject || event.subject || "",
            500,
          );
        return entry;
      });
      return job;
    });
    const colorScheme = value.preferences?.colorScheme ?? "terracotta";
    if (!themes.includes(colorScheme)) fail();
    const emailPreferences = EmailPreferences.normalize(
      value.preferences?.emailPreferences,
    );
    if (
      value.preferences?.emailPreferences &&
      (emailPreferences.approvalMode !==
        value.preferences.emailPreferences.approvalMode ||
        emailPreferences.checkFrequency !==
          value.preferences.emailPreferences.checkFrequency)
    )
      fail();
    return {
      format: "job-tracker-backup",
      version: 1,
      jobs,
      preferences: {
        colorScheme,
        ...(value.preferences?.emailPreferences ? { emailPreferences } : {}),
      },
    };
  }
  async function exportData() {
    return navigator.locks.request("job-tracker-write", async () => {
      const {
        jobs = [],
        colorScheme = "terracotta",
        emailPreferences = {},
        emailSuggestions = [],
      } = await chrome.storage.local.get([
        "jobs",
        "colorScheme",
        "emailPreferences",
        "emailSuggestions",
      ]);
      // Older history entries kept their subjects only in the review queue.
      const subjects = new Map(
        emailSuggestions
          .filter((item) => item.subject)
          .map((item) => [item.id, item.subject]),
      );
      for (const job of jobs) {
        for (const activity of job.emailActivity || [])
          if (activity.subject) subjects.set(activity.id, activity.subject);
        for (const event of job.statusHistory || [])
          if (
            event.source === "email" &&
            !event.emailSubject &&
            subjects.has(event.eventId)
          )
            event.emailSubject = subjects.get(event.eventId);
      }
      return {
        ...validate({
          format: "job-tracker-backup",
          version: 1,
          jobs,
          preferences: {
            colorScheme,
            emailPreferences: EmailPreferences.normalize(emailPreferences),
          },
        }),
        exportedAt: new Date().toISOString(),
      };
    });
  }
  async function restore(value, restoreSettings = true) {
    const backup = validate(value);
    return navigator.locks.request("email-connector", () =>
      navigator.locks.request("job-tracker-write", async () => {
        const { jobs = [] } = await chrome.storage.local.get("jobs");
        const ids = new Set(jobs.map((job) => job.id)),
          urls = new Set(jobs.map((job) => job.url));
        const additions = backup.jobs.filter(
          (job) => !ids.has(job.id) && !urls.has(job.url),
        );
        const preferences =
          restoreSettings && backup.preferences.emailPreferences;
        const { emailConnector = {} } =
          await chrome.storage.local.get("emailConnector");
        await chrome.storage.local.set({
          jobs: [...jobs, ...additions],
          ...(restoreSettings
            ? { colorScheme: backup.preferences.colorScheme }
            : {}),
          ...(preferences
            ? {
                emailPreferences: preferences,
                emailConnector: {
                  ...emailConnector,
                  autoCheck: preferences.checkFrequency > 0,
                },
              }
            : {}),
        });
        return {
          added: additions.length,
          skipped: backup.jobs.length - additions.length,
        };
      }),
    );
  }
  return { validate, exportData, restore };
})();
