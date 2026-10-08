const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
test('dashboard preferences persist sort/filter choices and isolate sample state',async()=>{
 const data={};const local=new Map();
 const context=vm.createContext({JobStore:{statuses:['Saved','Applied','Interviewing','Offer','Rejected','Withdrawn']},localStorage:{getItem:key=>local.get(key),setItem:(key,value)=>local.set(key,value)},chrome:{storage:{local:{get:async()=>data,set:async values=>Object.assign(data,values)}}}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/dashboard/dashboard-preferences.js'),'utf8'),context);
 const prefs=context.DashboardPreferences;
 await prefs.save({sort:{key:'dates',direction:'descending'},quickFilter:'awaiting',status:'Applied',search:'Example',pendingFirst:true},false);
 const loaded=await prefs.get(false);
 assert.equal(loaded.sort.key,'dates');assert.equal(loaded.quickFilter,'awaiting');assert.equal(loaded.search,'Example');assert.equal(loaded.pendingFirst,true);
 await prefs.save({quickFilter:'needs-action'},true);
 assert.equal((await prefs.get(true)).quickFilter,'needs-action');assert.equal((await prefs.get(false)).quickFilter,'awaiting');
 assert.equal(prefs.normalize({sort:{key:'bad'},status:'bad',quickFilter:'bad'}).sort.key,null);
 assert.equal(prefs.normalize({quickFilter:'bad'}).quickFilter,'');
});
