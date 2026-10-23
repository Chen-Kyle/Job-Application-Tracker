const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../scripts/popup/popup.js'), 'utf8');
test('toolbar action opens a native window targeting the invoking tab', async () => {
  let clicked, options;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../scripts/popup/window-launcher.js'), 'utf8'), {
    chrome: { action: { onClicked: { addListener: fn => { clicked = fn; } } },
      runtime: { getURL: value => `chrome-extension://test/${value}` },
      windows: { create: async value => { options = value; } } }, console,
  });
  await clicked({id: 42});
  assert.equal(options.type, 'popup');
  assert.equal(options.url, 'chrome-extension://test/popup.html?sourceTab=42');
  options = null;
  await clicked({id: -1});
  assert.equal(options, null);
});
test('movable window captures original tab rather than its own focused tab', async () => {
  const fields = {role: {}, company: {}, url: {}, save: {}, message: {}};
  let captured;
  const context = vm.createContext({...fields, sourceTab: '42', renderJobs: async () => {}, validUrl: () => true, extractJob: () => {},
    JobStore: {list: async () => []},
    chrome: {tabs: {get: async id => ({id, url:'https://example.com/jobs/1',title:'Original listing'}),query: async () => {throw Error('Wrong tab');}},
      scripting: {executeScript: async request => {captured=request.target.tabId;return [{result:{role:'Engineer',company:'Example',url:'https://example.com/jobs/1'}}];}}},
  });
  vm.runInContext(source.slice(source.indexOf('async function initialize()'),source.indexOf('initialize();')),context);
  await vm.runInContext('initialize()',context);
  assert.equal(captured,42);
  assert.equal(fields.company.value,'Example');
  assert.equal(fields.url.value,'https://example.com/jobs/1');
});
