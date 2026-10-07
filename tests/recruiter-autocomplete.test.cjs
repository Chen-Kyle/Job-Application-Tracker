const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
function setup() {
  const data = {};
  const context = vm.createContext({
    URLSearchParams,
    console,
    structuredClone,
    chrome: {
      storage: {
        local: {
          get: async () => structuredClone(data),
          set: async (values) => Object.assign(data, structuredClone(values)),
        },
      },
    },
  });
  for (const file of [
    "recruiter-data.js",
    "recruiter-contacts.js",
    "recruiter-autocomplete.js",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(root, "scripts/recruiters", file), "utf8"),
      context,
    );
  return { data, run: (code) => vm.runInContext(code, context) };
}
test("address parsing handles display names and bare addresses", () => {
  const { run } = setup();
  const contacts = run(
    `RecruiterContacts.parse('"Alex Morgan" <alex@example.com>, hiring@example.org')`,
  );
  assert.equal(contacts.length, 2);
  assert.equal(contacts[0].name, "Alex Morgan");
  assert.equal(contacts[1].email, "hiring@example.org");
});
test("saved contacts win deduplication and account address is excluded", () => {
  const { run } = setup();
  const contacts = run(
    `RecruiterAutocomplete.merge([{name:'Saved name',email:'HIRE@example.com'}],[{name:'Mail name',email:'hire@example.com'},{name:'Me',email:'me@example.com'}],'me@example.com')`,
  );
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, "Saved name");
});
test("recent correspondents cache avoids repeat Gmail calls and excludes automated senders", async () => {
  const { data, run } = setup();
  await run(`var calls=0; var account='me@example.com';
 var client={state:async()=>({connected:true,email:account}),token:async()=>'token',gmail:async path=>{
 calls++;
 if(path==='profile')return {emailAddress:account};
 if(path.startsWith('messages?'))return {messages:[{id:'one'}]};
 return {payload:{headers:[{name:'From',value:'Me <me@example.com>'},{name:'To',value:'Alex <hire@example.com>, no-reply@example.org'}]}};
 }};
 RecruiterContacts.lookup(client);`);
  assert.equal(data.recruiterContactCache.contacts.length, 1);
  assert.equal(
    data.recruiterContactCache.contacts[0].email,
    "hire@example.com",
  );
  const calls = run("calls");
  await run("RecruiterContacts.lookup(client)");
  assert.equal(run("calls"), calls);
  await run("account='second@example.com'; RecruiterContacts.lookup(client)");
  assert.ok(run("calls") > calls);
  assert.equal(data.recruiterContactCache.account, "second@example.com");
});
