const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function setup(jobs=[]){
 const data={jobs};
 const context=vm.createContext({URL,structuredClone,navigator:{locks:{request:async(_,fn)=>fn()}},chrome:{storage:{local:{get:async()=>structuredClone(data),set:async values=>Object.assign(data,structuredClone(values))}}}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/core/store.js'),'utf8'),context);
 return {store:context.JobStore,data};
}
test('delete undo preserves full application and survives store reload',async()=>{
 const job={id:'a',url:'https://example.com/jobs/1',role:'Engineer',status:'Applied',savedAt:'2026-10-01',statusHistory:[{from:'Saved',to:'Applied',at:'2026-10-02'}],notes:'Notes',nextSteps:[{id:'task',title:'Reply'}],emailActivity:[{id:'email',subject:'Confirmation'}],recruiterContacts:[{email:'recruiter@example.com'}]};
 const {store,data}=setup([job]);
 await store.remove('a'); assert.equal(data.jobs.length,0);
 assert.equal(await store.deletionUndoCount(),1);
 const reload=setup();Object.assign(reload.data,structuredClone(data));
 assert.deepEqual(JSON.parse(JSON.stringify(await reload.store.undoApplicationDeletion())),job);
 assert.equal(await reload.store.deletionUndoCount(),0);
});
test('tracking variations are duplicates but different job IDs remain distinct',async()=>{
 const {store}=setup([{id:'a',url:'https://example.com/jobs/1?jobId=12&utm_source=email',role:'Engineer'}]);
 assert.equal(await store.add({id:'b',url:'https://example.com/jobs/1?utm_source=other&jobId=12#apply'}),false);
 assert.notEqual(store.listingKey('https://example.com/jobs?jobId=12'),store.listingKey('https://example.com/jobs?jobId=13'));
});
test('undo avoids replacing a newly resaved application',async()=>{
 const {store,data}=setup([{id:'a',url:'https://example.com/jobs/1',role:'Old'}]);
 await store.remove('a');data.jobs.push({id:'new',url:'https://example.com/jobs/1',role:'New'});
 assert.equal(await store.deletionUndoCount(),0);
 assert.equal(await store.undoApplicationDeletion(),null);
 assert.equal(data.jobs[0].role,'New');
});
