const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
function setup(){
 const data={jobs:[{id:'job',role:'Engineer',company:'Example',status:'Saved',savedAt:'2026-10-01T00:00:00Z',updatedAt:'2026-10-01T00:00:00Z',statusHistory:[]}],emailConnector:{connected:true,email:'test@example.com'}};
 const event={addListener(){}};
 const raw={id:'123456789abc',internalDate:String(Date.parse('2026-10-07T12:00:00Z')),snippet:'Thank you for applying',payload:{headers:[{name:'Subject',value:'Application received'},{name:'From',value:'recruiter@example.com'}]}};
 const c=vm.createContext({URL,URLSearchParams,Date,Map,Set,AbortSignal,structuredClone,console,importScripts(){},navigator:{locks:{request:async(_,fn)=>fn()}},chrome:{runtime:{id:'test',getManifest:()=>({oauth2:{client_id:'test',scopes:['https://www.googleapis.com/auth/gmail.readonly']}}),onMessage:event,onStartup:event,onInstalled:event},identity:{getAuthToken:async()=>({token:'test'})},storage:{onChanged:event,local:{get:async()=>structuredClone(data),set:async v=>Object.assign(data,structuredClone(v))}},alarms:{onAlarm:event}},fetch:async url=>({ok:true,json:async()=>url.includes('/threads/')?{messages:[raw]}:url.includes('/messages?')?{messages:[{id:raw.id}]}:raw})});
 for(const file of ['scripts/core/store.js','scripts/email/email-actions.js','scripts/email/email-matcher.js','scripts/background/background.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
 return {data,c};
}
test('manual subject search saves fetched metadata with status and undo',async()=>{
 const {data,c}=setup();
 const found=await c.handle({action:'manual-email-search',subject:'Application received'});
 const preview=found.results[0];
 assert.equal(preview.subject,'Application received');
 await c.handle({action:'manual-email-save',jobId:'job',messageId:preview.messageId,status:'Applied',expectedStatus:'Saved',expectedUpdatedAt:data.jobs[0].updatedAt});
 assert.equal(data.jobs[0].status,'Applied');
 assert.equal(data.jobs[0].emailActivity[0].subject,'Application received');
 assert.equal(data.jobs[0].nextSteps?.length || 0,0);
 assert.equal(data.emailApprovalUndo.length,1);
 await assert.rejects(c.handle({action:'manual-email-save',jobId:'job',messageId:preview.messageId,status:'Applied',expectedStatus:'Applied',expectedUpdatedAt:data.jobs[0].updatedAt}),/already/);
});
test('subject search validates empty and oversized input',async()=>{
 const {c}=setup();
 await assert.rejects(c.handle({action:'manual-email-search',subject:' '}),/subject/);
 await assert.rejects(c.handle({action:'manual-email-search',subject:'x'.repeat(501)}),/subject/);
});
