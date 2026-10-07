// Real and sample settings-page controllers.
// See scripts/README.md for page entry points and dependency order.
(() => {
  if (!globalThis.chrome?.storage?.local || !globalThis.chrome?.runtime?.id)
    return;
  let version = 0;
  async function render() {
    const current = ++version;
    const { emailConnector = {}, emailSuggestions = [] } =
      await chrome.storage.local.get(["emailConnector", "emailSuggestions"]);
    if (current !== version) return;
    const count = emailSuggestions.filter(
      (item) => item.review === "pending",
    ).length;
    const badge = document.querySelector("#gmail-review-count");
    badge.textContent = count;
    badge.hidden = count === 0;
    badge.setAttribute("aria-label", `${count} pending email suggestions`);
    document.querySelector("#gmail-review-summary").textContent = count
      ? `${count} ${count === 1 ? "email awaits" : "emails await"} review.`
      : "No emails awaiting review.";
    document.querySelector("#gmail-badge").textContent =
      emailConnector.connected ? "Connected" : "Not connected";
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (
      area === "local" &&
      (changes.emailConnector || changes.emailSuggestions)
    )
      render().catch(() => {});
  });
  render().catch(() => {});
})();
