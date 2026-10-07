const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/dashboard/step-reminders.js'),'utf8'),context);
const reminders = context.StepReminders;
const now = new Date(2026,9,7,23,59);
test('calendar deadlines distinguish overdue, today, tomorrow and undated steps',()=>{
 for(const [deadline,label] of [['2026-10-06','Overdue'],['2026-10-07','Due today'],['2026-10-08','Due tomorrow'],['2026-10-10','Due in 3 days'],[null,'Pending · No deadline'],['2026-02-30','Pending · No deadline']])
  assert.equal(reminders.describe({deadline},now).label,label);
 assert.equal(reminders.describe({completed:true,deadline:'2026-10-01'},now).label,'Completed');
});
test('completed steps do not count and unfinished steps sort by urgency',()=>{
 const steps = [{id:'done',completed:true,deadline:'2026-10-01'},{id:'undated'},{id:'future',deadline:'2026-10-10'},{id:'late',deadline:'2026-10-05'}];
 assert.deepEqual(Array.from(reminders.ordered(steps),s=>s.id),['late','future','undated','done']);
 assert.equal(reminders.summary({nextSteps:steps},now).label,'3 next steps · Overdue');
 assert.equal(reminders.summary({nextSteps:[steps[0]]},now),null);
 assert.equal(reminders.summary({nextSteps:[steps[1]]},now).label,'1 next step');
});
