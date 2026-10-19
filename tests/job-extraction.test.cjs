const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../scripts/popup/popup.js"), "utf8");
const extraction = source.slice(source.indexOf("function extractJob()"), source.indexOf("function validUrl("));
function extract({ title, ogTitle = "", hostname = "job-boards.greenhouse.io", employer = "", siteName = "Greenhouse" }) {
  const role = "Software Engineering Intern";
  const context = vm.createContext({
    URL,
    location: { hostname, href: `https://${hostname}/example/jobs/123456`, pathname: "/example/jobs/123456" },
    document: {
      title,
      body: { innerText: "" },
      querySelectorAll(selector) {
        return selector === 'script[type="application/ld+json"]' && employer
          ? [{ textContent: JSON.stringify({ "@type": "JobPosting", title: role, hiringOrganization: { name: employer } }) }]
          : [];
      },
      querySelector(selector) {
        if (selector === 'meta[property="og:title"]') return { content: ogTitle };
        if (selector === 'meta[property="og:site_name"]') return { content: siteName };
        if (selector === "h1") return { textContent: role };
        return null;
      },
    },
  });
  return vm.runInContext(`${extraction}\nextractJob()`, context);
}
test("Greenhouse browser title supplies employer when social title only contains role", () => {
  for (const hostname of ["job-boards.greenhouse.io", "boards.greenhouse.io", "job-boards.eu.greenhouse.io"]) {
    for (const company of ["Example Space", "Example Labs, Inc.", "Example & Partners"]) {
      const job = extract({ hostname, title: `Job Application for Software Engineering Intern at ${company}`, ogTitle: "Software Engineering Intern" });
      assert.equal(job.company, company);
      assert.equal(job.role, "Software Engineering Intern");
      assert.equal(job.url, `https://${hostname}/example/jobs/123456`);
    }
  }
});
test("title sources are checked independently and structured employer data still wins", () => {
  assert.equal(extract({ title: "Job Application for Intern at Browser Employer", ogTitle: "  " }).company, "Browser Employer");
  assert.equal(extract({ title: "Intern", ogTitle: "Job Application for Intern at Social Employer" }).company, "Social Employer");
  assert.equal(extract({ title: "Job Application for Intern at Title Employer", employer: "Structured Employer" }).company, "Structured Employer");
});
test("missing employer stays blank instead of guessing from a Greenhouse slug", () => {
  assert.equal(extract({ title: "Intern", ogTitle: "Intern" }).company, "");
  assert.equal(extract({ title: "Job Application for Intern at Greenhouse" }).company, "");
});
