// Gmail parsing, matching, next-step detection, preferences, links and dashboard email UI.
// See scripts/README.md for page entry points and dependency order.
globalThis.EmailPreferences = (() => {
  function normalize(value = {}) {
    return {
      approvalMode: value.approvalMode === "automatic" ? "automatic" : "manual",
      checkFrequency: [0, 15, 30, 60].includes(value.checkFrequency)
        ? value.checkFrequency
        : 15,
    };
  }
  async function get() {
    const { emailPreferences = {} } =
      await chrome.storage.local.get("emailPreferences");
    return normalize(emailPreferences);
  }
  function eligible(suggestion) {
    const transitions = {
      Applied: ["Saved"],
      Interviewing: ["Saved", "Applied"],
      Offer: ["Applied", "Interviewing"],
      Rejected: ["Saved", "Applied", "Interviewing"],
      Withdrawn: ["Applied", "Interviewing"],
    };
    return (
      !suggestion.requiresReview &&
      !suggestion.actions?.length &&
      !suggestion.needsSelection &&
      Boolean(suggestion.jobId) &&
      (transitions[suggestion.status] || []).includes(suggestion.fromStatus)
    );
  }
  return { normalize, get, eligible };
})();
