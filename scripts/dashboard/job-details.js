// Application list, navigation, manual entry and application detail editing.
// See scripts/README.md for page entry points and dependency order.
globalThis.JobDetails = (() => {
  const dialog = document.querySelector("#job-details");
  const el = (id) => document.getElementById(id);
  let selected = null;
  let revision = 0;
  let editSnapshot = null;
  const historyDrafts = new Map();
  function localDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19);
  }
  const panelUndo = [];
  const draftUndo = [];
  let activityBusy = false;
  const subjectRequests = new Set();
  function shortSubject(subject) {
    const words = subject.trim().split(/\s+/);
    const text = words.slice(0, 15).join(" ");
    return (
      text.slice(0, 160) + (words.length > 15 || text.length > 160 ? "…" : "")
    );
  }
  const when = (value) => (value ? new Date(value).toLocaleString() : "—");
  function emailLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "mail.google.com"
        ? url.href
        : null;
    } catch {
      return null;
    }
  }
  for (const status of JobStore.statuses) {
    const option = document.createElement("option");
    option.value = option.textContent = status;
    el("edit-job-status").append(option);
  }
  async function updateTasks(id, change) {
    if (editSnapshot && editSnapshot.id === id) {
      draftUndo.push(structuredClone(editSnapshot.draft));
      editSnapshot.draft.nextSteps = change(editSnapshot.draft.nextSteps || []);
      await render();
      return;
    }
    let snapshot;
    if (demo) {
      const job = samples.find((item) => item.id === id);
      if (!job) throw new Error("Application not found");
      const before = structuredClone(job);
      job.nextSteps = change(job.nextSteps || []);
      snapshot = { before, after: structuredClone(job) };
    } else snapshot = await JobStore.updateNextSteps(id, change);
    panelUndo.push({ kind: "snapshot", ...snapshot, demo });
    await refresh();
  }
  function renderTasks(job) {
    const container = el("job-next-steps");
    container.replaceChildren();
    const tasks = [...(job.nextSteps || [])].sort(
      (a, b) =>
        Number(a.completed) - Number(b.completed) ||
        (a.deadline || "9999").localeCompare(b.deadline || "9999"),
    );
    if (!tasks.length) {
      const empty = document.createElement("p");
      empty.className = "email-secondary";
      empty.textContent =
        "No next steps yet. Add an action from an email or your own plan.";
      container.append(empty);
    }
    for (const task of tasks) {
      const row = document.createElement("div");
      row.className = `next-step${task.completed ? " completed" : ""}`;
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(task.completed);
      const title = document.createElement("span");
      title.textContent = task.title;
      label.append(checkbox, title);
      const heading = document.createElement("div");
      heading.className = "activity-entry-heading";
      heading.append(label);
      row.append(heading);
      checkbox.addEventListener("change", async () => {
        checkbox.disabled = true;
        try {
          await updateTasks(job.id, (tasks) =>
            tasks.map((item) =>
              item.id === task.id
                ? {
                    ...item,
                    completed: checkbox.checked,
                    completedAt: checkbox.checked
                      ? new Date().toISOString()
                      : null,
                  }
                : item,
            ),
          );
        } catch (error) {
          checkbox.checked = Boolean(task.completed);
          el("next-step-message").textContent = error.message;
        } finally {
          checkbox.disabled = false;
        }
      });
      const metadata = document.createElement("p");
      metadata.className = "email-secondary";
      metadata.textContent = task.deadline
        ? `Due ${new Date(`${task.deadline}T12:00:00`).toLocaleDateString()}`
        : "No deadline";
      const source =
        emailLink(task.emailUrl) ||
        (task.emailMessage
          ? EmailLinks.message(
              task.emailMessage.account,
              task.emailMessage.messageId,
            )
          : null);
      if (source) {
        const link = document.createElement("a");
        link.href = source;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Source email ↗";
        metadata.append(" · ", link);
      }
      row.append(metadata);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "activity-trash";
      remove.title = "Delete next step";
      remove.setAttribute("aria-label", `Delete next step: ${task.title}`);
      remove.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
      remove.addEventListener("click", async () => {
        remove.disabled = true;
        try {
          await updateTasks(job.id, (tasks) =>
            tasks.filter((item) => item.id !== task.id),
          );
        } catch (error) {
          el("next-step-message").textContent = error.message;
          remove.disabled = false;
        }
      });
      if (editSnapshot) heading.append(remove);
      container.append(row);
    }
  }
  function activity(container, events, suggestions, email) {
    container.replaceChildren();
    events = events.filter((event) => !event.activityDeletedAt);
    if (!events.length) {
      const empty = document.createElement("p");
      empty.className = "email-secondary";
      empty.textContent = email
        ? "No approved email updates for this application yet."
        : "Saved from a listing or added manually. No manual status changes yet.";
      container.append(empty);
      return;
    }
    const list = document.createElement("ol");
    list.className = "job-details-activity";
    for (const event of [...events].reverse()) {
      const item = document.createElement("li");
      const change = document.createElement("strong");
      change.textContent = event.recordOnly
        ? `Email recorded · ${event.to}`
        : `${event.from} → ${event.to}`;
      const at = document.createElement("p");
      at.className = "email-secondary";
      at.textContent = event.receivedAt
        ? `Received ${when(event.receivedAt)} · Approved ${when(event.at)}`
        : when(event.at);
      const heading = document.createElement("div");
      heading.className = "activity-entry-heading";
      heading.append(change);
      if (editSnapshot) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "activity-trash";
        remove.disabled = activityBusy;
        remove.setAttribute(
          "aria-label",
          `Delete activity: ${event.from} to ${event.to}`,
        );
        remove.title = "Delete activity";
        remove.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
        remove.addEventListener("click", () => deleteActivity(event));
        heading.append(remove);
      }
      item.append(heading, at);
      if (editSnapshot && !event.recordOnly) {
        const job =
          editSnapshot?.draft || jobs.find((job) => job.id === selected);
        const index = event.emailActivityId
          ? job.statusHistory.findIndex(
              (item) => item.eventId === event.emailActivityId,
            )
          : job.statusHistory.indexOf(event);
        const draft = historyDrafts.get(index) || {
          index,
          original: structuredClone(job.statusHistory[index]),
          from: event.from,
          to: event.to,
          at: event.at,
        };
        const fields = document.createElement("div");
        fields.className = "activity-edit-fields";
        for (const key of ["from", "to", "at"]) {
          const label = document.createElement("label");
          label.textContent =
            key === "at"
              ? "Date and time"
              : key === "from"
                ? "Previous status"
                : "New status";
          const input = document.createElement(
            key === "at" ? "input" : "select",
          );
          input.setAttribute("form", "job-details-edit-form");
          if (key === "at") {
            input.type = "datetime-local";
            input.step = "1";
            input.required = true;
            input.value = localDate(draft.at);
          } else {
            for (const status of JobStore.statuses) {
              const option = document.createElement("option");
              option.value = option.textContent = status;
              input.append(option);
            }
            input.value = draft[key];
          }
          input.addEventListener("change", () => {
            draft[key] =
              key === "at"
                ? input.value
                  ? new Date(input.value).toISOString()
                  : ""
                : input.value;
            historyDrafts.set(index, draft);
          });
          label.append(input);
          fields.append(label);
        }
        item.append(fields);
      }
      if (email) {
        const suggestion = suggestions.find(
          (s) => s.id === event.eventId && s.review === "approved",
        );
        const url = EmailLinks.history(event);
        const source = document.createElement(url ? "a" : "span");
        const subject =
          event.subject || event.emailSubject || suggestion?.subject;
        source.textContent = subject
          ? `Email: ${shortSubject(subject)}`
          : "Email: Subject unavailable";
        if (subject) source.title = subject;
        if (url) {
          source.href = url;
          source.target = "_blank";
          source.rel = "noopener noreferrer";
        }
        item.append(source);
        if (event.actions?.length) {
          const tasks = document.createElement("p");
          tasks.textContent = event.actions
            .map(
              (action) =>
                `${action.title}${action.deadline ? ` · due ${action.deadline}` : ""}`,
            )
            .join("; ");
          item.append(tasks);
        }
      }
      list.append(item);
    }
    container.append(list);
  }
  async function render() {
    if (!dialog.open || !selected) return;
    const version = ++revision;
    const job =
      editSnapshot?.draft || jobs.find((item) => item.id === selected);
    if (!jobs.some((item) => item.id === selected)) {
      dialog.close();
      return;
    }
    el("job-details-title").textContent = job.role;
    el("job-details-company").textContent =
      job.company || "Company not specified";
    renderTasks(job);
    const recruiterSnapshot = editSnapshot;
    RecruiterUI.render(job, Boolean(editSnapshot), async (contacts) => {
      if (selected !== job.id || editSnapshot !== recruiterSnapshot)
        throw Error("This panel changed. Try again.");
      if (editSnapshot) {
        draftUndo.push(structuredClone(editSnapshot.draft));
        editSnapshot.draft.recruiterContacts = contacts;
        await render();
      } else {
        let snapshot;
        if (demo) {
          const current = samples.find((item) => item.id === job.id);
          const before = structuredClone(current);
          current.recruiterContacts = contacts;
          snapshot = { before, after: structuredClone(current) };
        } else
          snapshot = await JobStore.updateDetails(
            job.id,
            {
              role: job.role,
              company: job.company || "",
              recruiterContacts: contacts,
              expectedJob: job,
            },
            job.updatedAt || job.savedAt,
          );
        panelUndo.push({ kind: "snapshot", ...snapshot, demo });
        await refresh();
      }
    });
    el("job-details-edit-footer").hidden = !editSnapshot;
    dialog.classList.toggle("editing", Boolean(editSnapshot));
    for (const id of [
      "job-role-editor",
      "job-company-editor",
      "job-link-editor",
      "job-facts-editor",
    ])
      el(id).hidden = !editSnapshot;
    for (const id of [
      "job-details-title",
      "job-details-company",
      "job-details-facts",
    ])
      el(id).hidden = Boolean(editSnapshot);
    dialog.querySelector(".next-step-editor").hidden = !editSnapshot;
    el("job-notes").textContent = job.notes || "No notes yet.";
    el("job-notes").hidden = Boolean(editSnapshot);
    el("job-notes-editor").hidden = !editSnapshot;
    el("undo-activity-deletion").hidden = !(editSnapshot
      ? draftUndo.length
      : panelUndo.length);
    el("undo-activity-deletion").disabled = activityBusy;
    el("undo-activity-deletion").textContent = "Undo last change (⌘Z)";
    const facts = el("job-details-facts");
    facts.replaceChildren();
    for (const [name, value] of [
      ["Status", job.status || "Saved"],
      ["Saved", when(job.savedAt)],
      ["Applied", when(job.appliedAt)],
      ["Last updated", when(job.updatedAt || job.savedAt)],
    ]) {
      const term = document.createElement("dt");
      term.textContent = name;
      const description = document.createElement("dd");
      description.textContent = value;
      facts.append(term, description);
    }
    const link = el("job-description-link");
    link.hidden = true;
    link.removeAttribute("href");
    try {
      if (
        !editSnapshot &&
        ["http:", "https:"].includes(new URL(job.url).protocol)
      ) {
        link.href = job.url;
        link.hidden = false;
      }
    } catch {
      /* Sample jobs may have no URL. */
    }
    const history = job.statusHistory || [];
    const recorded = new Set((job.emailActivity || []).map((item) => item.id));
    const emailEvents = [
      ...history.filter(
        (event) => event.source === "email" && !recorded.has(event.eventId),
      ),
      ...(job.emailActivity || []).map((item) => {
        const statusEvent = history.find((event) => event.eventId === item.id);
        return {
          ...item,
          emailActivityId: item.id,
          eventId: item.id,
          source: "email",
          from: statusEvent?.from || item.fromStatus,
          to: statusEvent?.to || item.toStatus,
          at: statusEvent?.at || item.approvedAt,
          recordOnly: !statusEvent,
          activityDeletedAt:
            item.activityDeletedAt || statusEvent?.activityDeletedAt,
        };
      }),
    ].sort(
      (a, b) =>
        Date.parse(a.receivedAt || a.at) - Date.parse(b.receivedAt || b.at),
    );
    activity(el("job-details-emails"), emailEvents, [], true);
    activity(
      el("job-details-manual"),
      history.filter((event) => event.source !== "email"),
      [],
      false,
    );
    if (!demo && inExtension) {
      const { emailSuggestions = [], emailConnector = {} } =
        await chrome.storage.local.get(["emailSuggestions", "emailConnector"]);
      if (version !== revision || !dialog.open) return;
      activity(el("job-details-emails"), emailEvents, emailSuggestions, true);
      const subjectRequestKey = `${emailConnector.email}:${job.id}`;
      if (
        emailConnector.connected &&
        !editSnapshot &&
        !subjectRequests.has(subjectRequestKey) &&
        emailEvents.some(
          (event) =>
            !event.subject &&
            !event.emailSubject &&
            !event.activityDeletedAt &&
            !emailSuggestions.some((s) => s.id === event.eventId && s.subject),
        )
      ) {
        subjectRequests.add(subjectRequestKey);
        chrome.runtime
          .sendMessage({
            type: "email-connector",
            action: "subjects",
            jobId: job.id,
          })
          .catch(() => {});
      }
    }
  }
  function open(id) {
    selected = id;
    el("job-details-edit-form").hidden = true;
    editSnapshot = null;
    el("activity-edit-message").textContent = "";
    el("next-step-form").reset();
    el("next-step-message").textContent = "";
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    render().catch(() => {});
  }
  async function changeActivity(entry, restoring) {
    if (entry.demo) {
      const job = samples.find((item) => item.id === entry.jobId);
      const event = job?.statusHistory.find(
        (item) => item.eventId === entry.eventId && item.source === "email",
      );
      if (
        !event ||
        (event.activityDeletedAt || null) !==
          (restoring ? entry.deletedAt : null)
      )
        throw new Error("This activity changed or was removed.");
      if (restoring) delete event.activityDeletedAt;
      else event.activityDeletedAt = entry.deletedAt;
    } else
      await JobStore.setEmailActivityDeleted(
        entry.jobId,
        entry.eventId,
        restoring ? null : entry.deletedAt,
        restoring ? entry.deletedAt : null,
      );
    await refresh();
  }
  async function deleteActivity(event) {
    if (activityBusy || !editSnapshot) return;
    draftUndo.push(structuredClone(editSnapshot.draft));
    const draftEvent = event.emailActivityId
      ? editSnapshot.draft.emailActivity.find(
          (item) => item.id === event.emailActivityId,
        )
      : editSnapshot.draft.statusHistory[
          editSnapshot.draft.statusHistory.indexOf(event)
        ];
    if (draftEvent) {
      draftEvent.activityDeletedAt = new Date().toISOString();
      if (event.emailActivityId) {
        const statusEvent = editSnapshot.draft.statusHistory.find(
          (item) => item.eventId === event.emailActivityId,
        );
        if (statusEvent)
          statusEvent.activityDeletedAt = draftEvent.activityDeletedAt;
      }
    }
    el("activity-edit-message").textContent =
      "Activity removed from this draft. Save changes to apply, or ⌘Z to undo.";
    await render();
    return;
  }
  async function undoDeletion() {
    if (editSnapshot) {
      if (draftUndo.length) {
        editSnapshot.draft = draftUndo.pop();
        await render();
      }
      return;
    }
    if (activityBusy || !(editSnapshot ? draftUndo.length : panelUndo.length))
      return;
    activityBusy = true;
    try {
      const entry = panelUndo.at(-1);
      if (entry.kind === "snapshot") {
        if (entry.demo) {
          const index = samples.findIndex((job) => job.id === entry.after.id);
          if (
            index < 0 ||
            JSON.stringify(samples[index]) !== JSON.stringify(entry.after)
          )
            throw new Error(
              "Cannot undo because this application has newer changes.",
            );
          samples[index] = structuredClone(entry.before);
        } else await JobStore.restoreSnapshot(entry);
        editSnapshot = null;
        el("job-details-edit-form").hidden = true;
        await refresh();
      } else await changeActivity(entry, true);
      panelUndo.pop();
      el("activity-edit-message").textContent = "Change undone.";
    } catch (error) {
      el("activity-edit-message").textContent = error.message;
    } finally {
      activityBusy = false;
      await render();
    }
  }
  el("undo-activity-deletion").addEventListener("click", undoDeletion);
  document.addEventListener("keydown", (event) => {
    if (
      !dialog.open ||
      !(event.metaKey || event.ctrlKey) ||
      event.key.toLowerCase() !== "z" ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (
      event.target.closest(
        'input:not([type="checkbox"]), textarea, [contenteditable="true"]',
      ) ||
      !(editSnapshot ? draftUndo.length : panelUndo.length)
    )
      return;
    event.preventDefault();
    undoDeletion();
  });
  el("job-details-close").addEventListener("click", () => dialog.close());
  el("job-details-edit").addEventListener("click", () => {
    const job = jobs.find((item) => item.id === selected);
    if (!job) return;
    editSnapshot = {
      id: job.id,
      updatedAt: job.updatedAt || job.savedAt,
      demo,
      original: structuredClone(job),
      draft: structuredClone(job),
    };
    draftUndo.length = 0;
    historyDrafts.clear();
    el("edit-job-url").value = job.url || "";
    el("edit-job-saved").value = localDate(job.savedAt);
    el("edit-job-applied").value = localDate(job.appliedAt);
    el("edit-job-role").value = job.role;
    el("edit-job-company").value = job.company || "";
    el("edit-job-notes").value = job.notes || "";
    el("edit-job-status").value = job.status || "Saved";
    render().catch(() => {});
    el("job-details-edit-message").textContent = "";
    el("job-details-edit-form").hidden = false;
    el("edit-job-role").focus();
  });
  el("job-details-edit-cancel").addEventListener("click", () => {
    el("job-details-edit-form").hidden = true;
    editSnapshot = null;
    draftUndo.length = 0;
    historyDrafts.clear();
    el("activity-edit-message").textContent = "";
    el("next-step-form").reset();
    render().catch(() => {});
  });
  el("job-details-edit-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const snapshot = editSnapshot;
    if (!snapshot) return;
    const role = el("edit-job-role").value.trim(),
      company = el("edit-job-company").value.trim();
    const notes = el("edit-job-notes").value;
    const status = el("edit-job-status").value;
    if (!role) {
      el("job-details-edit-message").textContent = "Enter a role title.";
      return;
    }
    const urlValue = el("edit-job-url").value.trim();
    let url;
    try {
      const parsed = new URL(urlValue);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      url = parsed.href;
    } catch {
      el("job-details-edit-message").textContent =
        "Enter a valid http or https job link.";
      return;
    }
    const savedAt = new Date(el("edit-job-saved").value).toISOString();
    const appliedAt = el("edit-job-applied").value
      ? new Date(el("edit-job-applied").value).toISOString()
      : null;
    const historyEdits = [...historyDrafts.values()].filter(
      (edit) =>
        edit.from !== edit.original.from ||
        edit.to !== edit.original.to ||
        edit.at !== edit.original.at,
    );
    const activityDeletions = snapshot.draft.statusHistory
      .map((entry, index) => ({
        index,
        deletedAt: entry.activityDeletedAt || null,
      }))
      .filter(
        (edit) =>
          edit.deletedAt !==
          (snapshot.original.statusHistory[edit.index].activityDeletedAt ||
            null),
      );
    const nextSteps = snapshot.draft.nextSteps;
    const emailActivity = snapshot.draft.emailActivity;
    const recruiterContacts = RecruiterData.normalize(
      snapshot.draft.recruiterContacts || [],
    );
    const button = el("job-details-save");
    button.disabled = true;
    try {
      let undoEntry;
      if (snapshot.demo) {
        const job = samples.find((item) => item.id === snapshot.id);
        if (!job) throw new Error("Application not found");
        if (JSON.stringify(job) !== JSON.stringify(snapshot.original))
          throw new Error(
            "This application changed. Cancel and click Edit again.",
          );
        if (samples.some((item) => item.id !== job.id && item.url === url))
          throw new Error("This job link is already saved.");
        const before = structuredClone(job),
          at = new Date().toISOString();
        for (const edit of historyEdits) {
          const entry = job.statusHistory[edit.index];
          if (JSON.stringify(entry) !== JSON.stringify(edit.original))
            throw new Error("This activity changed. Cancel and edit again.");
          Object.assign(entry, { from: edit.from, to: edit.to, at: edit.at });
        }
        job.recruiterContacts = structuredClone(recruiterContacts);
        if (nextSteps !== undefined) job.nextSteps = structuredClone(nextSteps);
        if (emailActivity !== undefined)
          job.emailActivity = structuredClone(emailActivity);
        for (const edit of activityDeletions) {
          if (edit.deletedAt)
            job.statusHistory[edit.index].activityDeletedAt = edit.deletedAt;
          else delete job.statusHistory[edit.index].activityDeletedAt;
        }
        if (job.status !== status) {
          job.statusHistory.push({
            from: job.status,
            to: status,
            at,
            source: "manual",
          });
          if (status === "Applied" && !job.appliedAt) job.appliedAt = at;
        }
        Object.assign(job, {
          role,
          company,
          notes,
          status,
          url,
          savedAt,
          updatedAt: at,
        });
        if (appliedAt) job.appliedAt = appliedAt;
        else if (status !== "Applied") delete job.appliedAt;
        undoEntry = { before, after: structuredClone(job) };
      } else
        undoEntry = await JobStore.updateDetails(
          snapshot.id,
          {
            role,
            company,
            notes,
            status,
            url,
            savedAt,
            appliedAt,
            historyEdits,
            activityDeletions,
            nextSteps,
            emailActivity,
            recruiterContacts,
            expectedJob: snapshot.original,
          },
          snapshot.updatedAt,
        );
      if (undoEntry)
        panelUndo.push({ kind: "snapshot", ...undoEntry, demo: snapshot.demo });
      if (selected === snapshot.id) {
        event.target.hidden = true;
        editSnapshot = null;
      }
      await refresh();
    } catch (error) {
      el("job-details-edit-message").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  el("next-step-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!editSnapshot) return;
    const id = selected;
    const title = el("next-step-title").value.trim();
    const deadline = el("next-step-deadline").value;
    const rawEmail = el("next-step-email").value.trim();
    if (!title) return;
    if (rawEmail && !emailLink(rawEmail)) {
      el("next-step-message").textContent =
        "Use a Gmail email link beginning with https://mail.google.com/.";
      return;
    }
    const button = event.target.querySelector("button");
    button.disabled = true;
    try {
      await updateTasks(id, (tasks) => [
        ...tasks,
        {
          id: crypto.randomUUID(),
          title,
          deadline: deadline || null,
          emailUrl: rawEmail ? emailLink(rawEmail) : null,
          source: "manual",
          createdAt: new Date().toISOString(),
          completed: false,
        },
      ]);
      if (selected === id) {
        event.target.reset();
        el("next-step-message").textContent = "Next step added.";
      }
    } catch (error) {
      el("next-step-message").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    selected = null;
    revision++;
  });
  if (inExtension)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (
        area === "local" &&
        (changes.emailSuggestions || changes.emailConnector)
      )
        render().catch(() => {});
    });
  return { open, render };
})();
