// Gmail parsing, matching, next-step detection, preferences, links and dashboard email UI.
// See scripts/README.md for page entry points and dependency order.
globalThis.EmailLinks = (() => {
  function message(account, messageId) {
    if (
      typeof account !== "string" ||
      !/^[^\s@:]+@[^\s@:]+\.[^\s@:]+$/.test(account)
    )
      return null;
    if (typeof messageId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(messageId))
      return null;
    return `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(account)}#all/${encodeURIComponent(messageId)}`;
  }
  function history(event) {
    if (event.source !== "email") return null;
    if (event.emailMessage)
      return message(event.emailMessage.account, event.emailMessage.messageId);
    // Older records stored account and message ID together as the event ID.
    if (typeof event.eventId !== "string") return null;
    const separator = event.eventId.lastIndexOf(":");
    if (separator < 0) return null;
    return message(
      event.eventId.slice(0, separator),
      event.eventId.slice(separator + 1),
    );
  }
  return { message, history };
})();
