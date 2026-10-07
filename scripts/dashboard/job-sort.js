// Dashboard-only sorting; never changes the stored application order.
globalThis.JobSort = (() => {
  const statuses = ["Saved", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"];
  function toggle(current, key) {
    if (current.key !== key) return { key, direction: "ascending" };
    if (current.direction === "ascending") return { key, direction: "descending" };
    return { key: null, direction: "ascending" };
  }
  function compare(a, b, sort) {
    const recentFirst = () => String(b.savedAt || "").localeCompare(String(a.savedAt || ""));
    if (!sort.key) return recentFirst();
    let result;
    if (sort.key === "role" || sort.key === "company") {
      result = String(a[sort.key] || "").localeCompare(String(b[sort.key] || ""), undefined, { sensitivity: "base", numeric: true });
    } else {
      const rank = (job) => {
        const index = statuses.indexOf(job.status || "Saved");
        return index < 0 ? statuses.length : index;
      };
      result = rank(a) - rank(b);
    }
    return result ? result * (sort.direction === "descending" ? -1 : 1) : recentFirst();
  }
  return { toggle, compare };
})();
