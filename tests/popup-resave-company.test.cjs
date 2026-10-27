const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
// Minimal page stub: enough DOM for popup.js to render its list and handle a submit.
function element(){
 const el={value:'',textContent:'',hidden:false,disabled:false,classList:{add(){}},children:[],listeners:{},
  append(...items){el.children.push(...items)},replaceChildren(){el.children=[]},setAttribute(){},
  addEventListener(type,fn){el.listeners[type]=fn}};
 return el;
}
async function setup(jobs,tab){
 const data={jobs};const elements={};
 const context=vm.createContext({URL,structuredClone,console,crypto:{randomUUID:()=>'new-id'},
  navigator:{locks:{request:async(_,fn)=>fn()}},
  document:{querySelector:id=>(elements[id]||=element()),createElement:()=>element()},
  chrome:{storage:{local:{get:async()=>structuredClone(data),set:async values=>Object.assign(data,structuredClone(values))},onChanged:{addListener(){}}},
   tabs:{query:async()=>[tab]},scripting:{executeScript:async()=>[{result:{role:tab.title,company:'Aggregator AI',url:tab.url}}]},runtime:{getURL:p=>p}}});
 for(const file of ['scripts/core/store.js','scripts/popup/popup.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 await new Promise(resolve=>setTimeout(resolve,0));
 const submit=async company=>{elements['#company'].value=company;await elements['#job-form'].listeners.submit({preventDefault(){}});};
 return {data,elements,submit};
}
const saved={id:'a',role:'Data Analyst, Intern',company:'Aggregator AI',url:'https://example.com/jobs/1?utm_source=x',savedAt:'2026-10-27T12:00:00.000Z',updatedAt:'2026-10-27T12:00:00.000Z',status:'Applied',statusHistory:[],notes:'Keep'};
const tab={url:'https://example.com/jobs/1',title:'Data Analyst, Intern'};
test('saving a tracked listing again replaces only the original job company',async()=>{
 const {data,elements,submit}=await setup([structuredClone(saved)],tab);
 assert.match(elements['#message'].textContent,/updates its company/);
 await submit('  Real Employer ');
 assert.equal(data.jobs.length,1);
 assert.equal(data.jobs[0].company,'Real Employer');
 assert.deepEqual({...data.jobs[0],company:saved.company,updatedAt:saved.updatedAt},saved);
 assert.equal(elements['#message'].textContent,'Company updated to Real Employer for this saved job.');
 await submit('Real Employer');
 assert.equal(elements['#message'].textContent,'This job is already saved with this company.');
});
test('reopening a tracked listing shows the corrected company instead of the page guess',async()=>{
 const {elements}=await setup([{...structuredClone(saved),company:'Real Employer'}],tab);
 assert.equal(elements['#company'].value,'Real Employer');
});
test('new listings still save as new jobs',async()=>{
 const {data,elements,submit}=await setup([],tab);
 await submit('Real Employer');
 assert.equal(data.jobs.length,1);
 assert.equal(data.jobs[0].company,'Real Employer');
 assert.equal(elements['#message'].textContent,'Job saved!');
});
