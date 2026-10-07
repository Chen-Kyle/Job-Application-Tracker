// JSON backup validation, export/restore and the settings-page backup controls.
// See scripts/README.md for page entry points and dependency order.
(() => {
  const el = (id) => document.getElementById(id);
  const extension = Boolean(
    globalThis.chrome?.storage?.local && globalThis.chrome?.runtime?.id,
  );
  let pending = null;
  const feedback = (text) => {
    el("backup-message").textContent = text;
  };
  function busy(value) {
    el("backup-export").disabled =
      el("backup-file").disabled =
      el("backup-cancel").disabled =
        value || !extension;
    el("backup-restore").disabled = value || !pending || !extension;
  }
  el("backup-export").addEventListener("click", async () => {
    busy(true);
    try {
      const data = await JobBackup.exportData();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      feedback(
        `Backup download started with ${data.jobs.length} applications.`,
      );
    } catch (error) {
      feedback(error.message);
    } finally {
      busy(false);
    }
  });
  el("backup-file").addEventListener("change", async (event) => {
    pending = null;
    el("backup-preview").hidden = true;
    busy(true);
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024)
        throw new Error("Choose a backup smaller than 20 MB.");
      pending = JobBackup.validate(JSON.parse(await file.text()));
      el("backup-summary").textContent =
        `${pending.jobs.length} applications found. Import adds missing jobs; existing jobs keep their current information. Duplicate IDs or job links are skipped.`;
      el("backup-preview").hidden = false;
      feedback(
        "Backup checked. Review the options below, then click Restore backup.",
      );
    } catch (error) {
      feedback(
        error instanceof SyntaxError
          ? "This file contains invalid JSON."
          : error.message,
      );
    } finally {
      busy(false);
    }
  });
  el("backup-cancel").addEventListener("click", () => {
    pending = null;
    el("backup-file").value = "";
    el("backup-preview").hidden = true;
    busy(false);
    feedback("Import canceled.");
  });
  el("backup-restore").addEventListener("click", async () => {
    if (!pending) return;
    busy(true);
    try {
      const result = await JobBackup.restore(
        pending,
        el("backup-appearance").checked,
      );
      pending = null;
      el("backup-file").value = "";
      el("backup-preview").hidden = true;
      feedback(
        `Restored ${result.added} applications. Skipped ${result.skipped} existing applications.`,
      );
    } catch (error) {
      feedback(error.message);
    } finally {
      busy(false);
    }
  });
  busy(false);
  if (!extension)
    feedback(
      "Open Settings through the installed extension to back up or restore your real applications.",
    );
})();
