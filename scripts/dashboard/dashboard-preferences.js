// Dashboard view preferences, isolated between real and sample dashboards.
globalThis.DashboardPreferences = (() => {
  function normalize(value = {}) {
    return {
      sort: {key:["role","company","status","dates"].includes(value.sort?.key) ? value.sort.key : null, direction:value.sort?.direction === "descending" ? "descending" : "ascending"},
      quickFilter:["needs-action","interviews","awaiting"].includes(value.quickFilter) ? value.quickFilter : "",
      status:JobStore.statuses.includes(value.status) ? value.status : "",
      search:typeof value.search === "string" ? value.search.slice(0,500) : "",
      pendingFirst:value.pendingFirst === true,
    };
  }
  async function get(sample) {
    try {
      const value = sample ? JSON.parse(localStorage.getItem("jobTrackerSampleDashboardPreferences") || "{}")
        : (await chrome.storage.local.get("dashboardPreferences")).dashboardPreferences;
      return normalize(value || {});
    } catch { return normalize(); }
  }
  async function save(value, sample) {
    const preferences = normalize(value);
    if (sample) localStorage.setItem("jobTrackerSampleDashboardPreferences",JSON.stringify(preferences));
    else await chrome.storage.local.set({dashboardPreferences:preferences});
  }
  return {normalize,get,save};
})();
