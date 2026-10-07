// Dashboard-only sorting; never changes the stored application order.
globalThis.JobSort = (() => {
  const statuses = ["Saved", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"];
  function toggle(current, key) {
    const first = key === "dates" ? "descending" : "ascending";
    if (current.key !== key) return { key, direction: first };
    if (current.direction === first)
      return { key, direction: first === "ascending" ? "descending" : "ascending" };
    return { key: null, direction: "ascending" };
  }
  function latestStatusChange(job) {
    return (job.statusHistory || [])
      .filter(event => !event.activityDeletedAt && event.from !== event.to && Number.isFinite(Date.parse(event.at)))
      .reduce((latest, event) => !latest || Date.parse(event.at) >= Date.parse(latest.at) ? event : latest, null);
  }
  function statusDate(job) {
    return latestStatusChange(job)?.at || (job.status === "Applied" ? job.appliedAt || job.savedAt : job.savedAt);
  }
  function compare(a, b, sort) {
    if (sort.pendingFirst) {
      const pending = (job) => (job.nextSteps || []).some(task => !task.completed);
      const priority = Number(pending(b)) - Number(pending(a));
      if (priority) return priority;
    }
    const recentFirst = () => String(b.savedAt || "").localeCompare(String(a.savedAt || ""));
    if (!sort.key) return recentFirst();
    let result;
    if (sort.key === "role" || sort.key === "company") {
      result = String(a[sort.key] || "").localeCompare(String(b[sort.key] || ""), undefined, { sensitivity: "base", numeric: true });
    } else if (sort.key === "dates") {
      result = (Date.parse(statusDate(a)) || 0) - (Date.parse(statusDate(b)) || 0);
    } else {
      const rank = (job) => {
        const index = statuses.indexOf(job.status || "Saved");
        return index < 0 ? statuses.length : index;
      };
      result = rank(a) - rank(b);
    }
    return result ? result * (sort.direction === "descending" ? -1 : 1) : recentFirst();
  }
  return { toggle, compare, latestStatusChange, statusDate };
})();
