// Gmail parsing, matching, next-step detection, preferences, links and dashboard email UI.
// See scripts/README.md for page entry points and dependency order.
// Extract text without rendering email HTML or fetching attachment bodies.
globalThis.GmailMessage = (() => {
  function decode(data) {
    if (!data || data.length > 700000) return "";
    try {
      const encoded = data.replace(/-/g, "+").replace(/_/g, "/");
      const binary = atob(
        encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="),
      );
      return new TextDecoder().decode(
        Uint8Array.from(binary, (char) => char.charCodeAt(0)),
      );
    } catch {
      return "";
    }
  }
  function htmlText(html) {
    const entities = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
      nbsp: " ",
      rsquo: "'",
      lsquo: "'",
      ndash: "-",
      mdash: "-",
    };
    return html
      .replace(/<(script|style|blockquote)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(
        /<a\b[^>]*href\s*=\s*(["'])(https?:\/\/[^"']+)\1[^>]*>([\s\S]*?)<\/a\s*>/gi,
        (_, quote, url, label) => `${label} (${url})`,
      )
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
        if (key[0] !== "#") return entities[key.toLowerCase()] || " ";
        const number =
          key[1].toLowerCase() === "x"
            ? parseInt(key.slice(2), 16)
            : parseInt(key.slice(1), 10);
        return number > 0 && number <= 0x10ffff
          ? String.fromCodePoint(number)
          : " ";
      })
      .replace(/\s+/g, " ")
      .trim();
  }
  function bodyText(payload) {
    function visit(part) {
      if (!part || part.filename) return "";
      if (part.mimeType === "text/plain") return decode(part.body?.data);
      if (part.mimeType === "text/html")
        return htmlText(decode(part.body?.data));
      const parts = part.parts || [];
      if (part.mimeType === "multipart/alternative") {
        const plain = parts.find(
          (child) => child.mimeType === "text/plain" && child.body?.data,
        );
        if (plain) return visit(plain);
      }
      return parts.map(visit).join(" ");
    }
    return visit(payload)
      .split(/\n(?:On .+wrote:|[- ]*Original Message[- ]*)/i)[0]
      .slice(0, 100000)
      .replace(/\s+/g, " ")
      .trim();
  }
  return { bodyText, htmlText };
})();
