// Application list, navigation, manual entry and application detail editing.
// See scripts/README.md for page entry points and dependency order.
(() => {
  const dialog = document.querySelector("#manual-entry");
  const form = document.querySelector("#manual-entry-form");
  const status = document.querySelector("#manual-status");
  const feedback = document.querySelector("#manual-entry-message");
  let saving = false;
  let sampleMode = false;
  for (const value of JobStore.statuses) {
    const option = document.createElement("option");
    option.value = option.textContent = value;
    status.append(option);
  }
  document.querySelector("#add-application").addEventListener("click", () => {
    sampleMode = demo;
    form.reset();
    feedback.textContent = "";
    document.querySelector("#manual-entry-context").textContent = sampleMode
      ? "This entry will be added to the sample view only."
      : "Enter the job details to add it to your applications.";
    dialog.showModal();
  });
  document
    .querySelector("#manual-entry-cancel")
    .addEventListener("click", () => {
      if (!saving) dialog.close();
    });
  dialog.addEventListener("cancel", (event) => {
    if (saving) event.preventDefault();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (saving) return;
    const role = document.querySelector("#manual-role").value.trim();
    const company = document.querySelector("#manual-company").value.trim();
    let url;
    try {
      url = new URL(document.querySelector("#manual-url").value.trim());
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
    } catch {
      feedback.textContent = "Enter a valid http or https job link.";
      return;
    }
    if (!role || !company) {
      feedback.textContent = "Enter a role and company name.";
      return;
    }
    const job = {
      id: crypto.randomUUID(),
      role,
      company,
      url: url.href,
      savedAt: new Date().toISOString(),
    };
    saving = true;
    for (const control of form.elements) control.disabled = true;
    try {
      if (sampleMode) {
        if (samples.some((item) => item.url === job.url))
          throw new Error("This job link is already saved.");
        samples.push({
          ...job,
          status: status.value,
          updatedAt: job.savedAt,
          ...(status.value === "Applied" ? { appliedAt: job.savedAt } : {}),
          statusHistory:
            status.value === "Saved"
              ? []
              : [
                  {
                    from: "Saved",
                    to: status.value,
                    at: job.savedAt,
                    source: "manual",
                  },
                ],
        });
      } else if (!(await JobStore.add(job, { status: status.value })))
        throw new Error("This job link is already saved.");
      document.querySelector("#search").value = "";
      document.querySelector("#filter").value = "";
      dialog.close();
      await refresh();
      document.querySelector("#message").textContent = sampleMode
        ? "Application added to the sample view."
        : "Application added.";
    } catch (error) {
      feedback.textContent = error.message || "Could not save the application.";
    } finally {
      saving = false;
      for (const control of form.elements) control.disabled = false;
    }
  });
})();
