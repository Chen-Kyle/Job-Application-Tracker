const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function setup(){
 const data={jobs:[]};
 const context=vm.createContext({URL,structuredClone,navigator:{locks:{request:async(_,fn)=>fn()}},chrome:{storage:{local:{get:async()=>structuredClone(data),set:async values=>Object.assign(data,structuredClone(values))}}}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/core/store.js'),'utf8'),context);
 return {store:context.JobStore,data};
}
// Mirrors the popup: save from the page, then edit only the company from the saved-jobs list.
async function editCompany(store,company){
 const [job]=await store.list();
 return store.updateDetails(job.id,{role:job.role,company,expectedJob:job},job.updatedAt||job.savedAt);
}
test('popup company edit changes only the company of a job saved from a page',async()=>{
 const {store,data}=setup();
 await store.add({id:'a',role:'Engineer',company:'Careers',url:'https://example.com/jobs/1',savedAt:'2026-10-01T12:00:00.000Z'});
 const before=structuredClone(data.jobs[0]);
 await editCompany(store,'  Example Corp  ');
 const after=data.jobs[0];
 assert.equal(after.company,'Example Corp');
 assert.notEqual(after.updatedAt,before.updatedAt);
 assert.deepEqual({...after,company:before.company,updatedAt:before.updatedAt},before);
 await editCompany(store,'');
 assert.equal(data.jobs[0].company,'');
 await assert.rejects(editCompany(store,'x'.repeat(201)),/company up to 200/);
});
test('popup company edit rejects a job changed elsewhere since the list rendered',async()=>{
 const {store,data}=setup();
 await store.add({id:'a',role:'Engineer',company:'Old',url:'https://example.com/jobs/1',savedAt:'2026-10-01T12:00:00.000Z'});
 const [shown]=await store.list();
 await store.updateStatus('a','Applied');
 await assert.rejects(store.updateDetails('a',{role:shown.role,company:'New',expectedJob:shown},shown.updatedAt),/changed while you were editing/);
 assert.equal(data.jobs[0].company,'Old');
});
