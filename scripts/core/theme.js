// Shared application storage and appearance preferences.
// See scripts/README.md for page entry points and dependency order.
(() => {
  const schemes = new Set(["green", "violet", "blue", "dark", "terracotta"]);
  const extension = Boolean(
    globalThis.chrome?.storage?.local && globalThis.chrome?.runtime?.id,
  );
  const pickers = [...document.querySelectorAll('input[name="color-scheme"]')];
  const message = document.querySelector("#theme-message");
  let revision = 0;
  const sample = () =>
    (!extension && location.pathname.endsWith("dashboard.html")) ||
    location.pathname.endsWith("sample-settings.html") ||
    new URLSearchParams(location.search).get("sample") === "1" ||
    globalThis.demo === true;
  function apply(value) {
    const theme = schemes.has(value) ? value : "terracotta";
    document.documentElement.dataset.theme = theme;
    for (const picker of pickers) picker.checked = picker.value === theme;
  }
  async function load() {
    const version = revision;
    try {
      const value = sample()
        ? localStorage.getItem("jobTrackerSampleColorScheme")
        : extension
          ? (await chrome.storage.local.get("colorScheme")).colorScheme
          : localStorage.getItem("jobTrackerColorScheme");
      if (version === revision) apply(value);
    } catch {
      if (version === revision) apply("terracotta");
    }
  }
  for (const picker of pickers)
    picker.addEventListener("change", async () => {
      const theme = picker.value;
      if (!schemes.has(theme)) return;
      revision++;
      apply(theme);
      for (const option of pickers) option.disabled = true;
      try {
        if (sample())
          localStorage.setItem("jobTrackerSampleColorScheme", theme);
        else if (extension)
          await chrome.storage.local.set({ colorScheme: theme });
        else localStorage.setItem("jobTrackerColorScheme", theme);
        if (message) message.textContent = "Color scheme saved.";
      } catch {
        if (message)
          message.textContent =
            "The color scheme changed for this view, but could not be saved.";
      } finally {
        for (const option of pickers) option.disabled = false;
      }
    });
  if (extension)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (!sample() && area === "local" && changes.colorScheme) {
        revision++;
        apply(changes.colorScheme.newValue);
      }
    });
  document.addEventListener("sample-mode-change", () => {
    revision++;
    load();
  });
  load();
})();
