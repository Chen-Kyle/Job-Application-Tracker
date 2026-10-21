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
test('shared undo stack retains the newest twenty snapshots in reverse undo order',()=>{
 const {store}=setup();const stack=[];
 for(let i=0;i<25;i++)store.pushUndo(stack,{id:i});
 assert.equal(stack.length,20);
 assert.equal(stack[0].id,5);
 assert.equal(stack.pop().id,24);
});
test('email dismissals retain only twenty undo actions and cannot reveal older actions',async()=>{
 const {store,data}=setup();
 data.emailSuggestions=Array.from({length:25},(_,i)=>({id:String(i),review:'pending'}));
 for(let i=0;i<25;i++)await store.dismissEmail(String(i));
 assert.equal(data.emailApprovalUndo.length,20);
 assert.equal(store.emailUndoCount([],data.emailApprovalUndo,data.emailSuggestions),20);
 for(let i=0;i<20;i++)await store.undoEmailApproval();
 assert.equal(data.emailApprovalUndo.length,0);
 assert.equal(data.emailSuggestions[0].review,'dismissed');
 await assert.rejects(store.undoEmailApproval(),/No email approvals/);
});
test('legacy persisted undo stacks are capped before restoring any action',async()=>{
 const {store,data}=setup();
 data.emailSuggestions=Array.from({length:25},(_,i)=>({id:String(i),review:'dismissed'}));
 data.emailApprovalUndo=data.emailSuggestions.map(item=>({kind:'dismissed',suggestion:{...item,review:'pending'},afterSuggestion:{...item}}));
 assert.equal(store.emailUndoCount([],data.emailApprovalUndo,data.emailSuggestions),20);
 await assert.rejects(store.undoEmailApproval('0'),/No email approvals/);
 assert.equal(data.emailApprovalUndo.length,20);
 await store.undoEmailApproval();
 assert.equal(data.emailApprovalUndo.length,19);
});
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
