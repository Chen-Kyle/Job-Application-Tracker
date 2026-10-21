const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
test("settings count excludes filtered suggestions and refreshes for genuine pending emails", async () => {
  const data = { emailSuggestions: [
    { review: "pending", from: "ChatGPT <noreply@tm.openai.com>", subject: "Task results" },
    { review: "pending", subject: "Your next big career opportunity awaits at Example" },
    { review: "approved", subject: "Interview invitation" },
  ] };
  const elements = new Map();
  let changed;
  const context = vm.createContext({
    URL,
    document: { querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { setAttribute(name, value) { this[name] = value; } });
      return elements.get(selector);
    } },
    chrome: { runtime: { id: "test" }, storage: {
      local: { get: async () => data },
      onChanged: { addListener(listener) { changed = listener; } },
    } },
  });
  for (const file of ["scripts/email/email-matcher.js", "scripts/settings/settings-sidebar.js"])
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  await new Promise(resolve => setImmediate(resolve));
  const badge = elements.get("#gmail-review-count");
  assert.equal(badge.textContent, 0);
  assert.equal(badge.hidden, true);
  assert.equal(elements.get("#gmail-review-summary").textContent, "No emails awaiting review.");
  data.emailSuggestions.push({ review: "pending", subject: "Interview invitation" });
  changed({ emailSuggestions: {} }, "local");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(badge.textContent, 1);
  assert.equal(badge.hidden, false);
  assert.equal(badge["aria-label"], "1 pending email suggestions");
});
