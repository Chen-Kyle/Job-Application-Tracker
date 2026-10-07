// Ensure script moves cannot leave a broken page or background-worker reference.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? files(filename) : [filename];
  });
}
test("all organized scripts parse", () => {
  for (const filename of files(path.join(root, "scripts")).filter((file) =>
    file.endsWith(".js"),
  )) {
    assert.doesNotThrow(
      () => new vm.Script(fs.readFileSync(filename, "utf8"), { filename }),
    );
  }
});
test("root pages reference existing local assets and preserve script dependency order", () => {
  for (const filename of fs
    .readdirSync(root)
    .filter((file) => file.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(root, filename), "utf8");
    for (const [, asset] of html.matchAll(
      /<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g,
    )) {
      assert.ok(
        fs.existsSync(path.join(root, asset)),
        `${filename}: missing ${asset}`,
      );
    }
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const before = (dependency, controller) => {
      if (scripts.includes(controller))
        assert.ok(
          scripts.includes(dependency) &&
            scripts.indexOf(dependency) < scripts.indexOf(controller),
          `${filename}: ${dependency} must load before ${controller}`,
        );
    };
    before("scripts/recruiters/recruiter-data.js", "scripts/core/store.js");
    before("scripts/recruiters/recruiter-data.js", "scripts/backup/backup.js");
    before(
      "scripts/recruiters/recruiter-ui.js",
      "scripts/dashboard/job-details.js",
    );
    before("scripts/core/store.js", "scripts/dashboard/dashboard.js");
    before(
      "scripts/dashboard/dashboard.js",
      "scripts/dashboard/job-details.js",
    );
    before("scripts/email/email-preferences.js", "scripts/email/email-ui.js");
    before("scripts/backup/backup.js", "scripts/backup/backup-ui.js");
    before("scripts/core/store.js", "scripts/popup/popup.js");
  }
});
test("manifest worker and its relative imports resolve", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
  );
  const worker = path.join(root, manifest.background.service_worker);
  assert.ok(fs.existsSync(worker));
  const context = vm.createContext({
    importScripts(...imports) {
      for (const file of imports)
        assert.ok(
          fs.existsSync(path.resolve(path.dirname(worker), file)),
          `Missing worker import: ${file}`,
        );
    },
  });
  // Evaluate the actual import statement without invoking authenticated services.
  const source = fs.readFileSync(worker, "utf8");
  vm.runInContext(source.match(/importScripts\([\s\S]*?\);/)[0], context);
  assert.ok(fs.existsSync(path.join(root, manifest.action.default_popup)));
});
