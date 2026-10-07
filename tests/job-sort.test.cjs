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

test("third click restores newest-saved order for every sortable heading", () => {
  const jobs = [{role:"Alpha",company:"Alpha",status:"Saved",savedAt:"2026-10-01"}, {role:"Zeta",company:"Zeta",status:"Offer",savedAt:"2026-10-07"}];
  for (const key of ["role", "company", "status"]) {
    let state = {key:null, direction:"ascending"};
    state = sort.toggle(state, key);
    assert.equal(state.direction, "ascending");
    state = sort.toggle(state, key);
    assert.equal(state.direction, "descending");
    state = sort.toggle(state, key);
    assert.equal(state.key, null);
    assert.equal([...jobs].sort((a,b)=>sort.compare(a,b,state))[0].savedAt, "2026-10-07");
    assert.equal(sort.toggle(state,key).direction, "ascending");
  }
});

test("Dates sorts by latest real status change, not edits or recorded emails", () => {
  const old = {savedAt:"2026-10-01",status:"Applied",updatedAt:"2026-10-09",statusHistory:[{from:"Saved",to:"Applied",at:"2026-10-02"},{from:"Applied",to:"Applied",at:"2026-10-08"},{from:"Applied",to:"Offer",at:"2026-10-10",activityDeletedAt:"2026-10-11"}]};
  const recent = {savedAt:"2026-09-01",statusHistory:[{from:"Applied",to:"Interviewing",at:"2026-10-07"},{from:"Saved",to:"Applied",at:"2026-10-03"}]};
  const first = sort.toggle({key:null}, "dates");
  assert.equal(first.direction, "descending");
  assert.equal(sort.statusDate(old), "2026-10-02");
  assert.equal([old,recent].sort((a,b)=>sort.compare(a,b,first))[0], recent);
  const second = sort.toggle(first,"dates");
  assert.equal([old,recent].sort((a,b)=>sort.compare(a,b,second))[0], old);
  assert.equal(sort.toggle(second,"dates").key, null);
  assert.equal(sort.statusDate({status:"Applied",appliedAt:"2026-10-04",savedAt:"2026-10-01"}), "2026-10-04");
  assert.equal(sort.statusDate({status:"Saved",savedAt:"2026-10-01"}), "2026-10-01");
});
