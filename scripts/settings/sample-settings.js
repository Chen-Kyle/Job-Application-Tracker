// Real and sample settings-page controllers.
// See scripts/README.md for page entry points and dependency order.
(() => {
  const mode = document.querySelector("#email-approval-mode");
  const frequency = document.querySelector("#email-check-frequency");
  let preferences;
  try {
    preferences = EmailPreferences.normalize(
      JSON.parse(
        localStorage.getItem("jobTrackerSampleEmailPreferences") || "{}",
      ),
    );
  } catch {
    preferences = EmailPreferences.normalize();
  }
  mode.value = preferences.approvalMode;
  frequency.value = String(preferences.checkFrequency);
  function save() {
    localStorage.setItem(
      "jobTrackerSampleEmailPreferences",
      JSON.stringify({
        approvalMode: mode.value,
        checkFrequency: Number(frequency.value),
      }),
    );
    document.querySelector("#email-settings-message").textContent =
      "Sample email settings saved. No inbox is connected.";
  }
  mode.addEventListener("change", save);
  frequency.addEventListener("change", save);
  document.querySelector("#gmail-badge").textContent = "Sample view";
})();
