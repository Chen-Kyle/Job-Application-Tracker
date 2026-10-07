const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const context = vm.createContext({ URL, EmailActions: { suggest: () => [] } });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../scripts/email/email-matcher.js"), "utf8"), context);
const job = { id: "example", company: "Example", role: "Software Engineer", status: "Saved", savedAt: "2026-10-01T00:00:00Z" };
function message(text) {
  return { subject: "Software Engineer at Example", snippet: text, from: "jobs@example.com", receivedAt: "2026-10-07T00:00:00Z" };
}
test("recommendation templates are excluded even when the role and employer match", () => {
  for (const text of ["Jobs that match your profile. Based on your title and location. View job", "Recommended jobs for you", "Job alert: Software Engineer at Example", "New jobs matching your profile", "Jobs you may be interested in"]) {
    assert.equal(context.EmailMatcher.analyze(message(text), [job]), null, text);
    assert.equal(context.EmailMatcher.match(message(text), [job]), null, text);
  }
});
test("real confirmations and interviews survive recommendation footers", () => {
  for (const [text, status] of [["Thanks for applying. Recommended jobs for you", "Applied"], ["Interview invitation. Jobs that match your profile", "Interviewing"]]) {
    assert.equal(context.EmailMatcher.analyze(message(text), [job]).status, status);
  }
});
test("ordinary recruiter activity remains eligible", () => {
  assert.ok(context.EmailMatcher.analyze(message("An update on your application at Example."), [job]));
});
