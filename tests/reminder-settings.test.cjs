const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
test('reminders default off, persist, and sample toggle leaves real settings alone',async()=>{
 const handlers={}; const values=new Map();
 const picker={checked:false,addEventListener:(name,fn)=>handlers[name]=fn};
 const context=vm.createContext({location:{pathname:'/sample-settings.html',search:''},URLSearchParams,Event,document:{querySelector:selector=>selector==='#next-step-reminders'?picker:null,dispatchEvent(){},addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},chrome:{runtime:{id:'test'},storage:{local:{get:async()=>({nextStepReminders:true}),set:async()=>{throw Error('sample must not write real storage');}},onChanged:{addListener(){}}}}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/settings/reminder-settings.js'),'utf8'),context);
 assert.equal(context.ReminderSettings.enabled(),false);
 picker.checked=true; await handlers.change();
 assert.equal(context.ReminderSettings.enabled(),true);
 assert.equal(values.get('jobTrackerSampleReminders'),'true');
 picker.checked=false; await handlers.change();
 assert.equal(context.ReminderSettings.enabled(),false);
});
