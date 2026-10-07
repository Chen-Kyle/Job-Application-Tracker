// Cache a bounded set of recent Gmail correspondents; never search on each keystroke.
globalThis.RecruiterContacts = (() => {
  function parse(value) {
    return [
      ...String(value || "").matchAll(
        /(?:(?:"([^"\n]*)"|([^,<]*?))\s*<)?([A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/gi,
      ),
    ]
      .map((match) => ({
        name: (match[1] || match[2] || "").trim().slice(0, 200),
        email: match[3].toLowerCase(),
      }))
      .filter((contact) => RecruiterData.email(contact.email));
  }
  async function lookup({ state, token, gmail }) {
    const current = await state();
    if (!current.connected) return { contacts: [], account: "" };
    const { recruiterContactCache } = await chrome.storage.local.get(
      "recruiterContactCache",
    );
    if (
      recruiterContactCache?.account === current.email &&
      Date.now() - Date.parse(recruiterContactCache.checkedAt) < 86400000
    )
      return recruiterContactCache;
    const accessToken = await token();
    const profile = await gmail("profile", accessToken);
    if (profile.emailAddress !== current.email)
      throw Error("Reconnect Gmail to update contact suggestions.");
    const page = await gmail(
      `messages?${new URLSearchParams({ q: "newer_than:30d -in:spam -in:trash", maxResults: "50" })}`,
      accessToken,
    );
    const contacts = new Map();
    for (let offset = 0; offset < (page.messages || []).length; offset += 5) {
      const results = await Promise.allSettled(
        page.messages
          .slice(offset, offset + 5)
          .map((item) =>
            gmail(
              `messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc`,
              accessToken,
            ),
          ),
      );
      const failed = results.find((result) => result.status === "rejected");
      if (failed) throw failed.reason;
      for (const result of results)
        for (const header of result.value.payload?.headers || []) {
          if (!["from", "to", "cc"].includes(header.name.toLowerCase()))
            continue;
          for (const contact of parse(header.value)) {
            if (
              contact.email === current.email.toLowerCase() ||
              /^(?:no-?reply|do-?not-?reply|notifications?)@/i.test(
                contact.email,
              )
            )
              continue;
            if (!contacts.has(contact.email) || contact.name)
              contacts.set(contact.email, contact);
          }
        }
    }
    const cache = {
      account: current.email,
      checkedAt: new Date().toISOString(),
      contacts: [...contacts.values()].slice(0, 200),
    };
    await chrome.storage.local.set({ recruiterContactCache: cache });
    return cache;
  }
  return { parse, lookup };
})();
