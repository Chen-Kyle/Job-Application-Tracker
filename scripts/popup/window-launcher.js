// Toolbar clicks open a native draggable window, retaining the invoking page.
chrome.action.onClicked.addListener(async (tab) => {
  if (!Number.isSafeInteger(tab?.id) || tab.id < 0) return;
  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL(`popup.html?sourceTab=${tab.id}`),
      type: "popup",
      width: 480,
      height: 720,
      focused: true,
    });
  } catch (error) {
    console.error("Could not open the save-job window.", error);
  }
});
