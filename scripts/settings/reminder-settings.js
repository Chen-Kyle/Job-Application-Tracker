// Optional reminders: real preferences use extension storage; sample settings stay separate.
globalThis.ReminderSettings = (() => {
  let enabled = false;
  let revision = 0;
  const extension = Boolean(globalThis.chrome?.storage?.local && globalThis.chrome?.runtime?.id);
  const sample = () => location.pathname.endsWith("sample-settings.html") || globalThis.demo === true || new URLSearchParams(location.search).get("sample") === "1" || (!extension && location.pathname.endsWith("dashboard.html"));
  const picker = document.querySelector("#next-step-reminders");
  const message = document.querySelector("#reminder-settings-message");
  function apply(value) {
    enabled = value === true;
    if (picker) picker.checked = enabled;
    document.dispatchEvent(new Event("reminder-settings-change"));
  }
  async function load() {
    const current = ++revision;
    try {
      const value = sample() || !extension
        ? localStorage.getItem(sample() ? "jobTrackerSampleReminders" : "jobTrackerReminders") === "true"
        : (await chrome.storage.local.get("nextStepReminders")).nextStepReminders;
      if (current === revision) apply(value);
    } catch { if (current === revision) apply(false); }
  }
  picker?.addEventListener("change", async () => {
    const before = enabled;
    const value = picker.checked;
    revision++;
    picker.disabled = true;
    try {
      if (sample() || !extension) localStorage.setItem(sample() ? "jobTrackerSampleReminders" : "jobTrackerReminders", String(value));
      else await chrome.storage.local.set({nextStepReminders:value});
      apply(value);
      if (message) message.textContent = "Reminder setting saved.";
    } catch {
      apply(before);
      if (message) message.textContent = "Could not save the reminder setting. Please try again.";
    } finally { picker.disabled = false; }
  });
  if (extension) chrome.storage.onChanged.addListener((changes, area) => {
    if (!sample() && area === "local" && changes.nextStepReminders) { revision++; apply(changes.nextStepReminders.newValue); }
  });
  window.addEventListener("storage", load);
  document.addEventListener("sample-mode-change", load);
  load();
  return { enabled: () => enabled };
})();
