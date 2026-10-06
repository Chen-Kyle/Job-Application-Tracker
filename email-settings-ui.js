(() => {
  const mode = document.querySelector('#email-approval-mode');
  const frequency = document.querySelector('#email-check-frequency');
  const message = document.querySelector('#email-settings-message');
  const extension = Boolean(globalThis.chrome?.storage?.local && globalThis.chrome?.runtime?.id);
  let busy = false;
  async function render() {
    if (!extension || busy) return;
    const preferences = await EmailPreferences.get();
    if (busy) return;
    mode.value = preferences.approvalMode;
    frequency.value = String(preferences.checkFrequency);
  }
  async function save() {
    busy = true; mode.disabled = frequency.disabled = true;
    try {
      const result = await chrome.runtime.sendMessage({ type: 'email-connector', action: 'preferences',
        preferences: { approvalMode: mode.value, checkFrequency: Number(frequency.value) } });
      if (!result?.ok) throw new Error(result?.error || 'Could not save email settings.');
      message.textContent = 'Email settings saved.';
    } catch (error) { message.textContent = error.message; }
    finally { busy = false; mode.disabled = frequency.disabled = false; await render(); }
  }
  mode.addEventListener('change', save);
  frequency.addEventListener('change', save);
  if (extension) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.emailPreferences) render().catch(() => {});
    });
    mode.disabled = frequency.disabled = true;
    render().catch(() => { message.textContent = 'Could not load email settings.'; }).finally(() => { mode.disabled = frequency.disabled = false; });
  } else {
    mode.disabled = frequency.disabled = true;
    message.textContent = 'Open Settings through the installed extension to configure Gmail updates.';
  }
})();
