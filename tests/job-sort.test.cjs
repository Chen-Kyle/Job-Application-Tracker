const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "../scripts/dashboard/job-sort.js"), "utf8"), context);
const sort = context.JobSort;
test("status uses pipeline order and reverses on repeated clicks", () => {
  const statuses = ["Withdrawn", "Offer", "Saved", "Rejected", "Interviewing", "Applied"];
  const jobs = statuses.map(status => ({ status }));
  const first = sort.toggle({ key: null }, "status");
  const ordered = [...jobs].sort((a, b) => sort.compare(a, b, first));
  assert.deepEqual(ordered.map(j => j.status), ["Saved", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"]);
  const second = sort.toggle(first, "status");
  assert.deepEqual([...jobs].sort((a, b) => sort.compare(a, b, second)).map(j => j.status), ordered.map(j => j.status).reverse());
  assert.equal(sort.toggle(second, "role").direction, "ascending");
});
test("role alphabetizes without case differences and equal roles retain newest saved first", () => {
  const jobs = [{ role: "zebra", savedAt: "2026-10-03" }, { role: "Alpha", savedAt: "2026-10-01" }, { role: "alpha", savedAt: "2026-10-02" }];
  assert.deepEqual([...jobs].sort((a, b) => sort.compare(a, b, {key:"role",direction:"ascending"})).map(j=>j.savedAt), ["2026-10-02", "2026-10-01", "2026-10-03"]);
  assert.equal([...jobs].sort((a,b)=>sort.compare(a,b,{key:null}))[0].role, "zebra");
});

test("company sorts independently of role and reverses direction", () => {
  const jobs = [{ company: "Zeta", role: "Alpha" }, { company: "alpha", role: "Zebra" }];
  const first = sort.toggle({key:"role", direction:"descending"}, "company");
  assert.equal(first.direction, "ascending");
  assert.equal([...jobs].sort((a,b)=>sort.compare(a,b,first))[0].company, "alpha");
  assert.equal([...jobs].sort((a,b)=>sort.compare(a,b,sort.toggle(first,"company")))[0].company, "Zeta");
});
