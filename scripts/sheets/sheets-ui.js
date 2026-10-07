// Google Sheets export service and dashboard export controls.
// See scripts/README.md for page entry points and dependency order.
globalThis.SheetsUI = (() => {
  const button = document.querySelector("#sheets-export");
  const message = document.querySelector("#sheets-message");
  const link = document.querySelector("#sheets-link");
  let busy = false;
  async function render() {
    button.disabled = demo || !inExtension || busy;
    button.textContent = busy ? "Exporting…" : "Export to Google Sheets";
    if (demo) {
      message.textContent =
        "Open your real applications through the extension to export. Sample jobs are not exported.";
      link.hidden = true;
      return;
    }
    if (message.textContent.startsWith("Open your real"))
      message.textContent = "";
    const { sheetsLastExport } =
      await chrome.storage.local.get("sheetsLastExport");
    if (demo) return;
    link.hidden = !sheetsLastExport;
    if (sheetsLastExport) {
      link.href = sheetsLastExport.url;
      link.textContent = `Open last export · ${new Date(sheetsLastExport.exportedAt).toLocaleString()}`;
    }
  }
  button.addEventListener("click", async () => {
    if (busy || demo || !inExtension) return;
    busy = true;
    message.textContent = "Creating your spreadsheet…";
    try {
      await render();
      const result = await chrome.runtime.sendMessage({
        type: "sheets-export",
      });
      if (!result?.ok)
        throw new Error(
          result?.error ||
            "Export did not respond. Reload the extension and try again.",
        );
      link.href = result.url;
      link.hidden = false;
      message.textContent = `Exported ${result.count} ${result.count === 1 ? "application" : "applications"}. Open the spreadsheet below.`;
    } catch (error) {
      message.textContent = error.message;
    } finally {
      busy = false;
      render().catch(() => {});
    }
  });
  render().catch(() => {
    message.textContent = "Could not load export information.";
  });
  return { render };
})();
