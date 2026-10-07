const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
function worker(data, alarms = new Map(), fail = () => false, requests = []) {
  const event = { addListener() {} };
  const context = vm.createContext({
    console,
    URLSearchParams,
    Date,
    Map,
    Set,
    AbortSignal,
    importScripts() {},
    navigator: { locks: { request: async (_, fn) => fn() } },
    JobStore: { list: async () => structuredClone(data.jobs) },
    EmailPreferences: {
      get: async () => ({ approvalMode: "manual", checkFrequency: 15 }),
    },
    EmailMatcher: {
      searchTerms: () => ["Example"],
      analyze: () => null,
      relevantCompany: () => false,
    },
    chrome: {
      runtime: {
        id: "test",
        getManifest: () => ({
          oauth2: {
            client_id: "test",
            scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
          },
        }),
        onMessage: event,
        onStartup: event,
        onInstalled: event,
      },
      identity: { getAuthToken: async () => ({ token: "test" }) },
      storage: {
        onChanged: event,
        local: {
          get: async () => structuredClone(data),
          set: async (values) => Object.assign(data, structuredClone(values)),
        },
      },
      alarms: {
        get: async (name) => alarms.get(name),
        create: async (name, options) => alarms.set(name, options),
        clear: async (name) => alarms.delete(name),
        onAlarm: event,
      },
    },
    fetch: async (url) => {
      requests.push(url);
      if (fail()) return { ok: false, status: 429 };
      let body;
      if (url.endsWith("/profile")) body = { emailAddress: "test@example.com" };
      else if (url.includes("/messages?")) {
        const params = new URL(url).searchParams;
        body = params.get("pageToken")
          ? { messages: [{ id: "second" }] }
          : {
              messages: [{ id: "first" }, { id: "recorded" }],
              nextPageToken: "page-2",
            };
      } else
        body = {
          id: url.split("/messages/")[1].split("?")[0],
          internalDate: String(Date.now()),
          snippet: "Unrelated mail",
          payload: { headers: [{ name: "Subject", value: "Example news" }] },
        };
      return { ok: true, json: async () => body };
    },
  });
  vm.runInContext(
    fs.readFileSync(
      path.join(root, "scripts/background/background.js"),
      "utf8",
    ),
    context,
  );
  return (code) => vm.runInContext(code, context);
}
function fixture() {
  return {
    jobs: [{ id: "job", company: "Example", role: "Engineer" }],
    emailConnector: {
      connected: true,
      email: "test@example.com",
      nextPageToken: "normal-cursor",
    },
    emailSuggestions: [
      { id: "test@example.com:recorded", review: "dismissed" },
    ],
  };
}
test("rescan persists fixed range, cursor and totals across worker restart", async () => {
  const data = fixture(),
    alarms = new Map();
  let run = worker(data, alarms);
  await run("handle({action:'rescan',days:90})");
  assert.equal(data.emailRescan.status, "running");
  assert.match(data.emailRescan.query, /after:\d+ before:\d+/);
  assert.equal(data.emailRescan.cursor, null);
  assert.ok(alarms.has("gmail-rescan"));
  await run("rescanBatch()");
  assert.equal(data.emailRescan.cursor, "page-2");
  assert.equal(data.emailRescan.totals.unmatched, 1);
  assert.equal(data.emailRescan.totals.alreadySuggested, 1);
  const query = data.emailRescan.query;
  run = worker(data, alarms);
  await run("rescanBatch()");
  assert.equal(data.emailRescan.status, "complete");
  assert.equal(data.emailRescan.totals.examined, 2);
  assert.equal(data.emailRescan.query, query);
  assert.equal(data.emailConnector.nextPageToken, "normal-cursor");
  assert.equal(alarms.has("gmail-rescan"), false);
});
test("failed batch preserves cursor and resumes without counting twice", async () => {
  const data = fixture();
  let fail = false;
  const run = worker(data, new Map(), () => fail);
  await run("handle({action:'rescan',days:30})");
  await run("rescanBatch()");
  fail = true;
  await run("rescanBatch()");
  assert.equal(data.emailRescan.status, "paused");
  assert.equal(data.emailRescan.cursor, "page-2");
  assert.equal(data.emailRescan.totals.examined, 1);
  fail = false;
  await run("handle({action:'rescan',days:30})");
  await run("rescanBatch()");
  assert.equal(data.emailRescan.totals.examined, 2);
});
test("ordinary checks distinguish cached emails from recorded emails", async () => {
  const data = fixture(),
    run = worker(data);
  await run("scan()");
  await run("scan()");
  assert.equal(data.emailConnector.lastScan.alreadyExamined, 1);
  assert.equal(data.emailConnector.lastScan.alreadySuggested, 1);
  assert.equal(data.emailConnector.lastScan.examined, 1);
  assert.match(data.emailConnector.info, /All search results/);
});
test("changed application identity starts a fresh range after pausing", async () => {
  const data = fixture(),
    run = worker(data);
  await run("handle({action:'rescan',days:30})");
  data.jobs[0].company = "Different";
  await run("rescanBatch()");
  assert.equal(data.emailRescan.status, "paused");
  await run("handle({action:'rescan',days:30})");
  assert.equal(data.emailRescan.cursor, null);
  assert.deepEqual(data.emailRescan.totals, {});
});

test("rescan requests larger pages and promptly schedules each next batch", async () => {
  const data = fixture(),
    alarms = new Map(),
    requests = [];
  const run = worker(data, alarms, () => false, requests);
  await run("handle({action:'rescan',days:30})");
  assert.ok(alarms.get("gmail-rescan").when <= Date.now() + 1000);
  await run("rescanBatch()");
  assert.equal(
    new URL(
      requests.find((url) => url.includes("/messages?")),
    ).searchParams.get("maxResults"),
    "25",
  );
  assert.equal(data.emailRescan.status, "running");
  assert.ok(alarms.get("gmail-rescan").when <= Date.now() + 1000);
  assert.equal(alarms.get("gmail-rescan").periodInMinutes, 0.5);
});
