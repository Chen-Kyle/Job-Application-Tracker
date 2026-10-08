// Shared popup/dashboard recovery; full application snapshots persist locally.
globalThis.ApplicationDeletionUI = (() => {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "undo-application-deletion";
  button.hidden = true;
  button.textContent = "Undo application deletion";
  document.querySelector("#message").after(button);
  const sampleStack = [];
  const sample = () => globalThis.demo === true;
  let busy = false;
  async function render() {
    const count = sample() ? sampleStack.length : await JobStore.deletionUndoCount();
    button.hidden = !count;
    button.textContent = `Undo application deletion (${count})`;
  }
  function removed(job) { sampleStack.push(structuredClone(job)); render(); }
  button.addEventListener("click", async () => {
    if (busy) return;
    busy = true; button.disabled = true;
    try {
      const job = sample() ? sampleStack.pop() : await JobStore.undoApplicationDeletion();
      if (job && sample()) { samples.push(job); await refresh(); }
      document.querySelector("#message").textContent = job ? `Restored ${job.role} and its history.` : "";
      await render();
    } catch { document.querySelector("#message").textContent = "Could not restore the application. Please try again."; }
    finally { busy = false; button.disabled = false; }
  });
  if (globalThis.chrome?.storage?.onChanged) chrome.storage.onChanged.addListener((changes,area) => {
    if (area === "local" && (changes.jobs || changes.applicationDeletionUndo)) render().catch(()=>{});
  });
  document.addEventListener("sample-mode-change", () => render().catch(()=>{}));
  render().catch(()=>{});
  return {removed};
})();
