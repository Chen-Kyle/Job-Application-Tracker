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
test("job application receipts qualify and request selection until employer is identified", () => {
  const receipt = {
    ...message("We received your job application for Software Engineer - 98765432."),
    subject: "Your recent job application for Software Engineer - 98765432",
    from: "workflow@notifications.recruiting.invalid",
  };
  const preview = context.EmailMatcher.analyze(receipt, [job]);
  assert.equal(preview?.status, "Applied");
  assert.equal(preview.needsSelection, true);
  const full = context.EmailMatcher.analyze({ ...receipt, bodyText: `${receipt.snippet} Regards, Example Talent Acquisition Team` }, [job]);
  assert.equal(full.status, "Applied");
  assert.equal(full.jobId, job.id);
  assert.equal(full.needsSelection, false);
  for (const wording of ["We have received your job application", "We've received your job application", "We’ve received your job application"]) {
    assert.equal(context.EmailMatcher.classify(wording), "Applied");
  }
  for (const wording of ["We have not received your job application", "We will receive your job application", "We received your profile"]) {
    assert.equal(context.EmailMatcher.classify(wording), null);
  }
});
test("new job matches and preference-based recommendations are excluded", () => {
  for (const text of [
    "Handshake New job match. Software Engineer at Example. Recently posted",
    "A new role at Example matches your preferences. Software Engineer. Internship",
    "A new position at Example matches your preferences. Software Engineer",
    "New job matches: Software Engineer at Example",
  ]) {
    for (const email of [message(text), { ...message(""), bodyText: text }, { ...message(""), subject: text }]) {
      assert.equal(context.EmailMatcher.analyze(email, [job]), null, text);
      assert.equal(context.EmailMatcher.match(email, [job]), null, text);
    }
  }
});
test("application updates survive new job match footers", () => {
  for (const [text, status] of [
    ["Thanks for applying. New job match: a role at Example matches your preferences", "Applied"],
    ["Interview invitation. A new role at Example matches your preferences", "Interviewing"],
  ]) {
    assert.equal(context.EmailMatcher.analyze(message(text), [job]).status, status);
  }
});
test("ChatGPT task notifications are excluded even when they quote application wording", () => {
  for (const from of ["ChatGPT <noreply@tm.openai.com>", "noreply@tm.openai.com", "ChatGPT <NOREPLY@TM.OPENAI.COM>"]) {
    for (const text of ["New match: Example — Software Engineer. Employer posting and application", "Thanks for applying to Software Engineer at Example"]) {
      const email = { ...message(text), from, subject: "[Task Update] Internship search results" };
      assert.equal(context.EmailMatcher.analyze(email, [job]), null);
      assert.equal(context.EmailMatcher.match(email, [job]), null);
    }
  }
});
test("task wording and similar sender names do not block employer updates", () => {
  for (const from of ["ChatGPT <recruiter@example.com>", "noreply@tm.openai.com.example.com", "Recruiter <jobs@example.com>"]) {
    const email = { ...message("Thanks for applying to Software Engineer at Example"), from, subject: "[Task Update] Application received" };
    assert.equal(context.EmailMatcher.analyze(email, [job]).status, "Applied");
  }
});
test("career promotions are excluded without blocking employer application updates", () => {
  for (const text of [
    "Your next big career opportunity awaits at Example",
    "Ready to take your career to the next level with Example? Find where you belong: Engineering, Finance, Marketing",
    "Explore our career opportunities at Example. Software Engineer",
    "Join our talent community at Example. Software Engineer",
  ]) {
    const email = { ...message(text), from: "Talent <talent@careers.example.com>" };
    assert.equal(context.EmailMatcher.analyze(email, [job]), null);
    assert.equal(context.EmailMatcher.match(email, [job]), null);
    const realUpdate = { ...email, snippet: `Thanks for applying. ${text}` };
    assert.equal(context.EmailMatcher.analyze(realUpdate, [job]).status, "Applied");
  }
});
test("persisted pending suggestions are rechecked without changing review history", () => {
  const queue = [
    { ...message("New match: Software Engineer at Example"), from: "ChatGPT <noreply@tm.openai.com>", id: "task", review: "pending" },
    { ...message("Your next big career opportunity awaits at Example"), id: "promotion", review: "pending", needsSelection: true },
    { ...message("An update on your application at Example"), id: "recruiter", review: "pending" },
    { ...message("Interview invitation"), id: "interview", review: "pending" },
    { ...message("Your next big career opportunity awaits at Example"), id: "old-approved", review: "approved" },
    { ...message("Thanks for applying"), id: "dismissed", review: "dismissed" },
  ];
  const before = JSON.stringify(queue);
  assert.deepEqual(Array.from(context.EmailMatcher.pendingSuggestions(queue), item => item.id), ["recruiter", "interview"]);
  assert.equal(JSON.stringify(queue), before);
});
