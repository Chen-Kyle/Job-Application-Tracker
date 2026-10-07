// Read-only recruiter thread lookup, separate from status suggestion searches.
globalThis.RecruiterGmail = (() => {
  function summarize(thread, account, contact) {
    const messages = (thread.messages || [])
      .filter((message) => {
        if (message.labelIds?.includes("DRAFT")) return false;
        const headers = message.payload?.headers || [];
        const addresses = headers
          .filter((h) =>
            ["from", "to", "cc", "bcc"].includes(h.name.toLowerCase()),
          )
          .map((h) => h.value)
          .join(" ")
          .toLowerCase();
        return addresses.split(/[\s<>,;]+/).includes(contact.toLowerCase());
      })
      .sort((a, b) => Number(a.internalDate) - Number(b.internalDate));
    if (!messages.length) return null;
    const latest = messages.at(-1);
    const sent = messages.filter((message) =>
      message.labelIds?.includes("SENT"),
    );
    const header = (name) =>
      latest.payload?.headers?.find((h) => h.name.toLowerCase() === name)
        ?.value || "";
    return {
      account,
      messages: [...messages].reverse().map(message => ({
        subject: (message.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value || '(No subject)').slice(0,500),
        from: (message.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value || '').slice(0,300),
        receivedAt: new Date(Number(message.internalDate)).toISOString(),
        direction: message.labelIds?.includes('SENT') ? 'sent' : 'received', snippet: (message.snippet || '').slice(0,1000),
      })),
      threadId: thread.id,
      subject: (header("subject") || "(No subject)").slice(0, 500),
      snippet: (latest.snippet || "").slice(0, 1000),
      latestAt: new Date(Number(latest.internalDate)).toISOString(),
      lastSentAt: sent.length
        ? new Date(Number(sent.at(-1).internalDate)).toISOString()
        : null,
      direction: latest.labelIds?.includes("SENT") ? "sent" : "received",
      checkedAt: new Date().toISOString(),
    };
  }
  async function lookup(message, { state, token, gmail }) {
    if (!RecruiterData.email(message.email))
      throw Error("Enter a valid recruiter email.");
    const current = await state();
    if (!current.connected)
      throw Error("Connect Gmail before searching recruiter conversations.");
    const accessToken = await token();
    const profile = await gmail("profile", accessToken);
    if (profile.emailAddress !== current.email)
      throw Error("Reconnect the original Gmail account.");
    let ids;
    if (message.threadIds) {
      if (
        message.account !== current.email ||
        !Array.isArray(message.threadIds) ||
        message.threadIds.length > 30 ||
        message.threadIds.some((id) => !/^[a-zA-Z0-9_-]{1,200}$/.test(id))
      )
        throw Error("Reconnect the account used by these conversations.");
      ids = message.threadIds;
    } else {
      const params = new URLSearchParams({
        q: `-in:spam -in:trash {from:${message.email} to:${message.email} cc:${message.email}}`,
        maxResults: "20",
      });
      const page = await gmail(`threads?${params}`, accessToken);
      ids = (page.threads || []).map((thread) => thread.id);
    }
    const summaries = [];
    for (let index = 0; index < ids.length; index += 5) {
      const results = await Promise.allSettled(
        ids.slice(index, index + 5).map(async (id) => {
          const thread = await gmail(
            `threads/${encodeURIComponent(id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc`,
            accessToken,
          );
          return summarize(thread, current.email, message.email);
        }),
      );
      const failure = results.find((result) => result.status === "rejected");
      if (failure) throw failure.reason;
      summaries.push(...results.map((result) => result.value).filter(Boolean));
    }
    return {
      conversations: summaries.sort(
        (a, b) => Date.parse(b.latestAt) - Date.parse(a.latestAt),
      ),
    };
  }
  return { summarize, lookup };
})();
