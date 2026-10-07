// Application list, navigation, manual entry and application detail editing.
// See scripts/README.md for page entry points and dependency order.
const inExtension = Boolean(
  globalThis.chrome?.storage?.local && globalThis.chrome?.runtime?.id,
);
var demo =
  !inExtension || new URLSearchParams(location.search).get("sample") === "1";
let jobs = [];
let jobSort = { key: null, direction: "ascending" };
let samples = makeSamples();
const $ = (selector) => document.querySelector(selector);
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function makeSamples() {
  const data = [
    ["Northstar", "Product Designer", "Interviewing", 12],
    ["Fieldwork", "Software Engineer", "Applied", 8],
    ["Juniper Labs", "Data Analyst", "Saved", 2],
    ["Orbit Studio", "UX Researcher", "Offer", 18],
    ["Beacon", "Product Manager", "Rejected", 15],
    ["Evergreen", "Frontend Engineer", "Withdrawn", 10],
  ];
  return data.map(([company, role, status, days], i) => {
    const savedAt = new Date(Date.now() - days * 86400000).toISOString();
    const updatedAt = new Date(
      Date.now() - Math.max(0, days - 3) * 86400000,
    ).toISOString();
    const sampleJob = {
      id: `sample-${i}`,
      // Reserved example domain: fictional listings, never real job postings.
      url: `https://example.com/jobs/${company.toLowerCase().replace(/\s+/g, "-")}/${role.toLowerCase().replace(/\s+/g, "-")}`,
      company,
      role,
      status,
      savedAt,
      updatedAt,
      appliedAt: status === "Saved" ? null : savedAt,
      statusHistory:
        status === "Saved"
          ? []
          : [{ from: "Saved", to: status, at: updatedAt, source: "manual" }],
    };
    sampleJob.recruiterContacts = [RecruiterSamples.contact(sampleJob)];
    if (i === 1) {
      const email = {
        id: "sample-auto-email",
        subject: "Application received: Software Engineer at Fieldwork",
        snippet:
          "Thank you for applying to Fieldwork. We have received your application for Software Engineer and will contact you about next steps.",
        receivedAt: updatedAt,
        approvedAt: updatedAt,
        automatic: true,
        fromStatus: "Saved",
        toStatus: "Applied",
        statusChanged: true,
        actions: [],
      };
      sampleJob.emailActivity = [email];
    }
    return sampleJob;
  });
}

for (const status of JobStore.statuses) {
  const option = document.createElement("option");
  option.value = option.textContent = status;
  $("#filter").append(option);
}

function render() {
  document.querySelector(".settings-nav").href = demo
    ? "sample-settings.html"
    : "settings.html";
  $("#notice").hidden = !demo;
  $("#notice").textContent = inExtension
    ? "Sample dashboard — fictional applications. Changes here do not affect your saved jobs."
    : "Sample dashboard — to see your real saved jobs, load the extension and use its Open dashboard button. Sample changes reset when you reload.";
  $("#demo").textContent = demo
    ? "Back to my applications"
    : "Explore sample dashboard";
  $("#demo").hidden = !inExtension;
  $("#total").textContent = jobs.length;
  $("#applied").textContent = jobs.filter(
    (job) => job.status === "Applied",
  ).length;
  $("#interviewing").textContent = jobs.filter(
    (job) => job.status === "Interviewing",
  ).length;
  $("#offers").textContent = jobs.filter(
    (job) => job.status === "Offer",
  ).length;
  const term = $("#search").value.trim().toLowerCase();
  const status = $("#filter").value;
  const visible = jobs.filter(
    (job) =>
      (!status || job.status === status) &&
      `${job.role} ${job.company}`.toLowerCase().includes(term),
  );
  $("#result-count").textContent = `(${visible.length})`;
  $("#rows").replaceChildren();
  $("#empty").hidden = visible.length > 0;
  $("#empty h3").textContent = jobs.length
    ? "No matching applications"
    : "No applications yet";
  $("#empty p").textContent = jobs.length
    ? "Try a different search or status."
    : "Open a job listing and use the extension to save your first opportunity.";
  $("#empty-demo").hidden = jobs.length > 0 || demo;
  // Role and Company share a column, so update its sort state once.
  for (const column of ["role", "status", "dates"]) {
    const heading = $(`#${column}-heading`);
    const selected = jobSort.key === column || (column === "role" && jobSort.key === "company");
    if (selected) heading.setAttribute("aria-sort", jobSort.direction);
    else heading.removeAttribute("aria-sort");
  }
  for (const key of ["role", "company", "status", "dates"]) {
    const button = $(`[data-sort="${key}"]`);
    const selected = jobSort.key === key;
    button.querySelector(".sort-direction").textContent = selected
      ? (jobSort.direction === "ascending" ? " ↑" : " ↓") : "";
    const next = JobSort.toggle(jobSort, key);
    button.setAttribute("aria-label", !next.key
      ? "Restore default order, newest saved first"
      : key === "dates"
        ? `Sort by latest status change, ${next.direction === "descending" ? "newest" : "oldest"} first`
        : `Sort by ${key}, ${next.direction}`);
  }
  for (const job of visible.sort((a, b) => JobSort.compare(a, b, jobSort))) {
    const row = document.createElement("tr");
    const roleCell = document.createElement("td");
    const entry = document.createElement("button");
    entry.type = "button";
    entry.className = "job-details-trigger";
    entry.setAttribute(
      "aria-label",
      `View details for ${job.role} at ${job.company || "unknown company"}`,
    );
    entry.setAttribute("aria-haspopup", "dialog");
    const role = document.createElement("span");
    role.className = "role";
    role.textContent = job.role;
    const company = document.createElement("span");
    company.className = "company";
    company.textContent = job.company || "Company not specified";
    entry.append(role, company);
    entry.addEventListener("click", () => JobDetails.open(job.id));
    roleCell.append(entry);
    const statusCell = document.createElement("td");
    const select = document.createElement("select");
    select.className = "status";
    select.dataset.status = job.status;
    select.setAttribute(
      "aria-label",
      `Status for ${job.role} at ${job.company || "unknown company"}`,
    );
    for (const status of JobStore.statuses) {
      const option = document.createElement("option");
      option.value = option.textContent = status;
      select.append(option);
    }
    select.value = job.status;
    select.addEventListener("change", async () => {
      const next = select.value;
      select.disabled = true;
      try {
        if (demo) {
          const at = new Date().toISOString();
          job.statusHistory.push({
            from: job.status,
            to: next,
            at,
            source: "manual",
          });
          job.status = next;
          job.updatedAt = at;
          if (next === "Applied" && !job.appliedAt) job.appliedAt = at;
        } else {
          await JobStore.updateStatus(job.id, next);
        }
        await refresh();
        $("#message").textContent =
          `${job.role} updated to ${next}${demo ? " in the sample view" : ""}.`;
      } catch {
        select.value = job.status;
        select.disabled = false;
        $("#message").textContent =
          "Could not save the status. Please try again.";
      }
    });
    statusCell.append(select);
    const dates = document.createElement("td");
    dates.className = "application-dates";
    const latestStatusChange = JobSort.latestStatusChange(job);
    const statusUpdate = document.createElement("div");
    statusUpdate.className = "date-label";
    statusUpdate.textContent = latestStatusChange
      ? `${latestStatusChange.from} → ${latestStatusChange.to}`
      : job.status || "Saved";
    const statusDate = document.createElement("div");
    statusDate.textContent = date(JobSort.statusDate(job));
    dates.append(statusUpdate, statusDate);
    const activity = document.createElement("td");
    const visibleHistory = (job.statusHistory || []).filter(
      (event) => !event.activityDeletedAt,
    );
    if (visibleHistory.length) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = `${visibleHistory.length} status ${visibleHistory.length === 1 ? "change" : "changes"}`;
      const list = document.createElement("ul");
      list.className = "history";
      for (const event of [...visibleHistory].reverse()) {
        const item = document.createElement("li");
        item.textContent = `${event.from} → ${event.to} · ${date(event.at)} · `;
        const emailUrl = EmailLinks.history(event);
        if (emailUrl) {
          const email = document.createElement("a");
          email.textContent = "Email";
          email.href = emailUrl;
          email.target = "_blank";
          email.rel = "noopener noreferrer";
          email.setAttribute(
            "aria-label",
            `Open email for ${event.to} update to ${job.role}`,
          );
          item.append(email);
        } else {
          item.append(event.source === "email" ? "Email" : "Manual");
        }
        list.append(item);
      }
      details.append(summary, list);
      activity.append(details);
    } else {
      activity.textContent = "Saved from a listing";
    }
    const actions = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      `Delete ${job.role} at ${job.company || "unknown company"}`,
    );
    deleteButton.addEventListener("click", async () => {
      if (
        !window.confirm(
          `Delete ${job.role} at ${job.company || "unknown company"}? This will remove the entry and its status history${demo ? " from the sample view" : ""}.`,
        )
      )
        return;
      deleteButton.disabled = true;
      try {
        if (demo) samples = samples.filter((item) => item.id !== job.id);
        else await JobStore.remove(job.id);
        await refresh();
        $("#message").textContent =
          `${job.role} deleted${demo ? " from the sample view" : ""}.`;
      } catch {
        deleteButton.disabled = false;
        $("#message").textContent =
          "Could not delete the entry. Please try again.";
      }
    });
    actions.append(deleteButton);
    row.append(roleCell, statusCell, dates, activity, actions);
    $("#rows").append(row);
  }
  globalThis.JobDetails?.render().catch(() => {});
  globalThis.EmailUI?.render().catch(() => {});
  globalThis.SheetsUI?.render().catch(() => {});
}

async function refresh() {
  jobs = demo ? samples : await JobStore.list();
  render();
}
async function toggleDemo() {
  demo = !demo;
  const viewUrl = new URL(location.href);
  if (demo) viewUrl.searchParams.set("sample", "1");
  else viewUrl.searchParams.delete("sample");
  history.replaceState(null, "", viewUrl);
  document.dispatchEvent(new Event("sample-mode-change"));
  $("#search").value = "";
  $("#filter").value = "";
  $("#message").textContent = "";
  try {
    await refresh();
  } catch {
    $("#message").textContent =
      "Could not load applications. Try reloading this page.";
  }
}
$("#demo").addEventListener("click", toggleDemo);
$("#empty-demo").addEventListener("click", toggleDemo);
$("#search").addEventListener("input", render);
$("#filter").addEventListener("change", render);
for (const key of ["role", "company", "status", "dates"])
  $(`[data-sort="${key}"]`).addEventListener("click", () => {
    jobSort = JobSort.toggle(jobSort, key);
    render();
  });
if (inExtension)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.jobs && !demo)
      refresh().catch(() => {
        $("#message").textContent = "Could not refresh applications.";
      });
  });
refresh().catch(() => {
  $("#message").textContent =
    "Could not load applications. Try reloading this page.";
});
