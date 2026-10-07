// Gmail parsing, matching, next-step detection, preferences, links and dashboard email UI.
// See scripts/README.md for page entry points and dependency order.
// Local action suggestions. Deadlines are proposals for the user to confirm.
globalThis.EmailActions = (() => {
  function deadline(text, receivedAt) {
    const received = new Date(receivedAt);
    if (!Number.isFinite(received.getTime())) return null;
    // Interpret relative dates in the user's local calendar, without guessing times.
    const match = text.match(
      /\b(?:within|in|have)\s+(\d{1,2})\s+(?:calendar\s+)?days\b/i,
    );
    if (match && !/\bbusiness days\b/i.test(text)) {
      const days = Number(match[1]);
      if (days <= 60) {
        received.setDate(received.getDate() + days);
        return localDate(received);
      }
    }
    const iso = text.match(
      /\b(?:by|before|due(?: on)?|deadline(?: is|:| of)?)\s+(\d{4}-\d{2}-\d{2})\b/i,
    )?.[1];
    if (iso && validDate(iso)) return iso;
    return null;
  }
  function localDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) && localDate(date) === value;
  }
  function suggest(text, receivedAt) {
    const sentences = text.split(/(?<=[.!?])\s+|\n+/);
    const actions = new Set();
    for (const sentence of sentences) {
      if (
        /\b(?:do not|don't|not required|no need|already completed|have completed|completed your|if we|if you|may invite|might invite|will invite|will receive|should receive)\b/i.test(
          sentence,
        )
      )
        continue;
      if (
        /\b(?:invite you to (?:take|complete)|please (?:take|complete)|need to (?:take|complete)|have \d+ days to complete)\b.{0,100}\b(?:assessment|test|challenge|exercise)\b/i.test(
          sentence,
        )
      )
        actions.add("Complete assessment");
      if (
        /\b(?:please (?:schedule|book)|schedule (?:an?|your|the)|select (?:an? |your |the )?(?:time|slot)|choose (?:an? |your |the )?(?:time|slot))\b.{0,80}\binterview\b|\binterview\b.{0,80}\b(?:please (?:schedule|book)|select (?:a )?(?:time|slot))\b/i.test(
          sentence,
        )
      )
        actions.add("Schedule interview");
      if (
        /\b(?:please (?:reply|respond)|reply to (?:this|the) email|send (?:us|me|your recruiter) your availability|let (?:us|me) know your availability)\b/i.test(
          sentence,
        )
      )
        actions.add("Reply to recruiter");
    }
    return [...actions].map((title) => ({
      title,
      deadline: deadline(text, receivedAt),
      deadlineInferred: true,
    }));
  }
  return { suggest, validDate };
})();
