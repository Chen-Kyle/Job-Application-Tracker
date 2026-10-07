const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
function setup() {
  const data = {
    jobs: [
      {
        id: "job",
        role: "Engineer",
        company: "Example",
        url: "https://example.com/job",
        status: "Applied",
        savedAt: "2026-10-01T12:00:00Z",
        updatedAt: "2026-10-01T12:00:00Z",
        statusHistory: [],
        emailActivity: [],
      },
    ],
  };
  const context = vm.createContext({
    URL,
    URLSearchParams,
    structuredClone,
    console,
    navigator: { locks: { request: async (_, fn) => fn() } },
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
    "scripts/recruiters/recruiter-data.js",
    "scripts/recruiters/recruiter-gmail.js",
    "scripts/core/store.js",
    "scripts/email/email-preferences.js",
    "scripts/backup/backup.js",
  ])
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return { data, run: (code) => vm.runInContext(code, context) };
}
const thread = {
  id: "abc123",
  messages: [
    {
      internalDate: String(Date.parse("2026-10-02T12:00:00Z")),
      labelIds: ["SENT"],
      snippet: "My follow-up",
      payload: {
        headers: [
          { name: "To", value: "Recruiter <hiring@example.com>" },
          { name: "Subject", value: "Engineer follow-up" },
        ],
      },
    },
    {
      internalDate: String(Date.parse("2026-10-03T12:00:00Z")),
      labelIds: ["INBOX"],
      snippet: "Thanks for following up",
      payload: {
        headers: [
          { name: "From", value: "hiring@example.com" },
          { name: "Subject", value: "Re: Engineer follow-up" },
        ],
      },
    },
  ],
};
test("thread summary separates latest received message from last sent date", () => {
  const { run } = setup();
  const summary = run(
    `RecruiterGmail.summarize(${JSON.stringify(thread)},'user@example.com','hiring@example.com')`,
  );
  assert.equal(summary.direction, "received");
  assert.equal(summary.latestAt, "2026-10-03T12:00:00.000Z");
  assert.equal(summary.lastSentAt, "2026-10-02T12:00:00.000Z");
  assert.equal(summary.subject, "Re: Engineer follow-up");
  assert.equal(
    run(
      `RecruiterGmail.summarize(${JSON.stringify(thread)},'user@example.com','other@example.com')`,
    ),
    null,
  );
});
test("recruiter lookup includes sent mail and returns summaries without status mutations", async () => {
  const { data, run } = setup();
  const before = JSON.stringify(data.jobs);
  const response =
    await run(`RecruiterGmail.lookup({email:'hiring@example.com'}, {
    state:async()=>({connected:true,email:'user@example.com'}),token:async()=>'token',
    gmail:async(path)=>{
      if(path==='profile')return {emailAddress:'user@example.com'};
      if(path.startsWith('threads?')){
        const q=new URLSearchParams(path.split('?')[1]).get('q');
        if(q.includes('-in:sent')||!q.includes('to:hiring@example.com'))throw Error('Sent mail excluded');
        return {threads:[{id:'abc123'}]};
      }
      return ${JSON.stringify(thread)};
    }
  })`);
  assert.equal(response.conversations.length, 1);
  assert.equal(JSON.stringify(data.jobs), before);
});
test("contact attachment survives backup and can be undone without changing email activity", async () => {
  const { data, run } = setup();
  const saved = await run(`(async()=>{
    const before=(await JobStore.list())[0];
    const summary=RecruiterGmail.summarize(${JSON.stringify(thread)},'user@example.com','hiring@example.com');
    return JobStore.updateDetails('job',{role:before.role,company:before.company,expectedJob:before,recruiterContacts:[{name:'Recruiter',email:'hiring@example.com',conversations:[summary]}]},before.updatedAt);
  })()`);
  assert.equal(data.jobs[0].status, "Applied");
  assert.equal(data.jobs[0].statusHistory.length, 0);
  assert.equal(data.jobs[0].emailActivity.length, 0);
  const backup = await run("JobBackup.exportData()");
  assert.equal(
    backup.jobs[0].recruiterContacts[0].conversations[0].subject,
    "Re: Engineer follow-up",
  );
  const validated = run(`JobBackup.validate(${JSON.stringify(backup)})`);
  assert.equal(
    validated.jobs[0].recruiterContacts[0].conversations[0].lastSentAt,
    "2026-10-02T12:00:00.000Z",
  );
  await run(`JobStore.restoreSnapshot(${JSON.stringify(saved)})`);
  assert.equal(data.jobs[0].recruiterContacts, undefined);
});
test("invalid contacts and mismatched account refreshes are rejected", async () => {
  const { run } = setup();
  assert.throws(
    () =>
      run(
        "RecruiterData.normalize([{name:'Recruiter',email:'not-an-email',conversations:[]}])",
      ),
    /valid recruiter/,
  );
  await assert.rejects(
    run(
      `RecruiterGmail.lookup({email:'hiring@example.com',account:'other@example.com',threadIds:['abc123']},{state:async()=>({connected:true,email:'user@example.com'}),token:async()=>'token',gmail:async()=>({emailAddress:'user@example.com'})})`,
    ),
    /Reconnect the account/,
  );
});

test("recruiter UI supports adding a contact and explicitly attaching a result", async () => {
  class Element {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.dataset = {};
    }
    append(...children) {
      this.children.push(...children);
    }
    replaceChildren(...children) {
      this.children = children;
    }
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    addEventListener(name, fn) {
      this.listeners[name] = fn;
    }
    querySelectorAll(tag) {
      return this.children.flatMap((child) =>
        typeof child === "object"
          ? [
              ...(child.tag === tag ? [child] : []),
              ...child.querySelectorAll(tag),
            ]
          : [],
      );
    }
  }
  const { run } = setup();
  const summary = run(
    `RecruiterGmail.summarize(${JSON.stringify(thread)}, 'user@example.com', 'hiring@example.com')`,
  );
  const container = new Element("div"),
    dialog = { open: true };
  const job = {
    id: "job",
    role: "Engineer",
    company: "Example",
    recruiterContacts: [],
  };
  const context = vm.createContext({
    URLSearchParams,
    Date,
    Map,
    Set,
    document: {
      createElement: (tag) => new Element(tag),
      getElementById: (id) => (id === "job-details" ? dialog : container),
    },
    RecruiterAutocomplete: { attach: () => new Element("datalist") },
    RecruiterData: { normalize: (value) => value },
    EmailLinks: { message: (_, id) => `https://mail.google.com/#all/${id}` },
    chrome: {
      runtime: {
        sendMessage: async () => ({
          ok: true,
          data: { conversations: [summary] },
        }),
      },
    },
    job,
    change: async (contacts) => {
      job.recruiterContacts = contacts;
      vm.runInContext("RecruiterUI.render(job, true, change)", context);
    },
  });
  vm.runInContext("const inExtension = true; var demo = false;", context);
  vm.runInContext(
    fs.readFileSync(
      path.join(root, "scripts/recruiters/recruiter-ui.js"),
      "utf8",
    ),
    context,
  );
  vm.runInContext("RecruiterUI.render(job, true, change)", context);
  const form = container.querySelectorAll("form")[0],
    inputs = form.querySelectorAll("input");
  inputs[0].value = "Recruiter";
  inputs[1].value = "hiring@example.com";
  form.listeners.submit({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(job.recruiterContacts.length, 1);
  await container
    .querySelectorAll("button")
    .find((button) => button.textContent === "Find conversations")
    .listeners.click();
  assert.equal(
    job.recruiterContacts[0].conversations.length,
    0,
    "Search alone must not attach a thread",
  );
  const attach = container
    .querySelectorAll("button")
    .find((button) => button.textContent === "Attach");
  await attach.listeners.click();
  assert.equal(job.recruiterContacts[0].conversations[0].threadId, "abc123");
});

test('unsent drafts do not become the latest conversation message', () => {
  const {run} = setup();
  const withDraft = structuredClone(thread);
  withDraft.messages.push({internalDate:String(Date.parse('2026-10-04T12:00:00Z')),labelIds:['DRAFT'],snippet:'Unsent draft',payload:{headers:[{name:'To',value:'hiring@example.com'},{name:'Subject',value:'Draft'}]}});
  const summary=run(`RecruiterGmail.summarize(${JSON.stringify(withDraft)},'user@example.com','hiring@example.com')`);
  assert.equal(summary.subject,'Re: Engineer follow-up');
  assert.equal(summary.latestAt,'2026-10-03T12:00:00.000Z');
});

test('sample recruiter conversations have role-specific messages newest first and survive validation', () => {
  const {run}=setup();
  run(fs.readFileSync(path.join(root,'scripts/recruiters/recruiter-samples.js'),'utf8'));
  const contacts=run(`(()=>{ const job={id:'sample-2',role:'Data Analyst',company:'Juniper Labs'}; const contact=RecruiterSamples.contact(job); contact.conversations=RecruiterSamples.conversations(job,contact.email); return RecruiterData.normalize([contact]); })()`);
  assert.equal(contacts[0].conversations.length,2);
  for(const thread of contacts[0].conversations) {
    assert.equal(thread.messages.length,3);
    assert.match(thread.subject,/Data Analyst/);
    assert.ok(Date.parse(thread.messages[0].receivedAt)>Date.parse(thread.messages[2].receivedAt));
  }
});
