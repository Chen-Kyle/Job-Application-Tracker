// Calendar-day reminders use the viewer's local date; no notification permissions.
globalThis.StepReminders = (() => {
  function deadlineDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toISOString().slice(0, 10) === value ? date.getTime() : null;
  }
  function describe(task, now = new Date()) {
    if (task.completed) return { label: "Completed", kind: "completed" };
    const due = deadlineDay(task.deadline);
    if (due === null) return { label: "Pending · No deadline", kind: "pending" };
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((due - today) / 86400000);
    if (days < 0) return { label: "Overdue", kind: "overdue" };
    if (days === 0) return { label: "Due today", kind: "soon" };
    if (days === 1) return { label: "Due tomorrow", kind: "soon" };
    return { label: `Due in ${days} days`, kind: days <= 3 ? "soon" : "pending" };
  }
  function pending(job) { return (job.nextSteps || []).filter(task => !task.completed); }
  function ordered(tasks) {
    return [...tasks].sort((a,b) => Number(Boolean(a.completed)) - Number(Boolean(b.completed)) ||
      (deadlineDay(a.deadline) ?? Infinity) - (deadlineDay(b.deadline) ?? Infinity) || 0);
  }
  function summary(job, now = new Date()) {
    const tasks = ordered(pending(job));
    if (!tasks.length) return null;
    const reminder = describe(tasks[0], now);
    const count = `${tasks.length} next step${tasks.length === 1 ? "" : "s"}`;
    return { ...reminder, label: tasks[0].deadline && deadlineDay(tasks[0].deadline) !== null ? `${count} · ${reminder.label}` : count };
  }
  return { describe, pending, ordered, summary };
})();
