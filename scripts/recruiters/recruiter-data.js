// Shared validation for recruiter contacts and saved Gmail conversation summaries.
globalThis.RecruiterData = (() => {
  const email = (value) =>
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s<>"{}:@]+@[^\s<>"{}:@]+\.[^\s<>"{}:@]+$/.test(value);
  function normalize(contacts = []) {
    if (!Array.isArray(contacts) || contacts.length > 20)
      throw Error("Add at most 20 recruiter contacts per job.");
    const seen = new Set();
    return contacts.map((contact) => {
      if (
        !contact ||
        !email(contact.email) ||
        typeof contact.name !== "string" ||
        contact.name.length > 200
      )
        throw Error("Enter a valid recruiter name and email.");
      const address = contact.email.toLowerCase();
      if (seen.has(address))
        throw Error("This recruiter email is already attached.");
      seen.add(address);
      if (
        !Array.isArray(contact.conversations || []) ||
        (contact.conversations || []).length > 30
      )
        throw Error("Attach at most 30 conversations per recruiter.");
      const threads = new Set();
      return {
        name: contact.name.trim(),
        email: address,
        conversations: (contact.conversations || []).map((thread) => {
          if (
            !thread ||
            !email(thread.account) ||
            !/^[a-zA-Z0-9_-]{1,200}$/.test(thread.threadId || "") ||
            threads.has(`${thread.account}:${thread.threadId}`)
          )
            throw Error("Invalid recruiter conversation.");
          threads.add(`${thread.account}:${thread.threadId}`);
          const text = (value, max) => {
            if (typeof value !== "string" || value.length > max)
              throw Error("Invalid conversation summary.");
            return value;
          };
          const date = (value) => {
            if (value == null) return null;
            if (
              typeof value !== "string" ||
              !Number.isFinite(Date.parse(value))
            )
              throw Error("Invalid conversation date.");
            return value;
          };
          if (!["sent", "received"].includes(thread.direction))
            throw Error("Invalid conversation direction.");
          if (!thread.latestAt || !thread.checkedAt)
            throw Error("Missing conversation dates.");
          return {
            account: thread.account.toLowerCase(),
            threadId: thread.threadId,
            subject: text(thread.subject, 500),
            snippet: text(thread.snippet, 1000),
            latestAt: date(thread.latestAt),
            lastSentAt: date(thread.lastSentAt),
            checkedAt: date(thread.checkedAt),
            direction: thread.direction,
          };
        }),
      };
    });
  }
  return { email, normalize };
})();
