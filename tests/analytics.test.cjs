const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const context=vm.createContext({document:{querySelector:selector=>selector==='#analytics-period'?{addEventListener(){}}:null}});
for(const file of ['scripts/dashboard/step-reminders.js','scripts/analytics/analytics.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
test('analytics counts applied dates once and separates current status from timeline',()=>{
 const data=context.Analytics.summarize([{status:'Rejected',savedAt:'2026-01-01',appliedAt:'2026-10-07T12:00:00',statusHistory:[{to:'Applied',from:'Saved',at:'2026-10-06'}],nextSteps:[{deadline:'2026-10-07'},{deadline:'2026-10-06'},{deadline:null},{completed:true,deadline:'2026-10-06'}]},{status:'Applied',savedAt:'2026-10-07'},{status:'Saved'}],'weekly',new Date(2026,9,8,12));
 assert.equal(data.buckets.reduce((sum,b)=>sum+b.count,0),1);
 assert.equal(data.outcomes.Rejected,1);assert.equal(data.outcomes.Applied,1);assert.equal(data.missingDates,1);
 assert.equal(data.steps.pending,3);assert.equal(data.steps.overdue,2);assert.equal(data.steps.dueSoon,0);
});
test('monthly timeline handles year boundaries and history date fallback',()=>{
 const data=context.Analytics.summarize([{status:'Interviewing',statusHistory:[{from:'Saved',to:'Applied',at:'2025-12-31T12:00:00'}]}],'monthly',new Date(2026,0,8));
 assert.equal(data.buckets.length,12);assert.equal(data.buckets[10].count,1);assert.equal(data.missingDates,0);
});

test('daily buckets count separate local calendar days across a month boundary',()=>{
 const data=context.Analytics.summarize([{appliedAt:'2026-09-30T12:00:00'},{appliedAt:'2026-10-01T12:00:00'},{appliedAt:'2026-10-02T12:00:00'}],'daily',new Date(2026,9,1,18));
 assert.equal(data.buckets.length,12);
 assert.equal(data.buckets[10].count,1);assert.equal(data.buckets[11].count,1);
 assert.equal(data.buckets.reduce((sum,b)=>sum+b.count,0),2);
});
