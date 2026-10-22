/* Muktijoddha Hall Dining — Google Sheet backend (Apps Script)
   Sheet e 3ta tab thakbe: Settings, Notices, Payments (setup() nijei banabe) */
const TZ='Asia/Dhaka';
const HEAD={Settings:['key','value'],Notices:['id','ts','title','body','pin'],
 Payments:['id','ts','name','batch','dept','room','method','amount','from','trx','note','status','at']};
const DEF={name:'Manager নাম',phone:'',start:Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'),days:30,
 bkash:'01XXXXXXXXX',nagad:'01XXXXXXXXX',minAmt:1350,minDays:15,rate:90};
const NUM=['days','minAmt','minDays','rate'];

function setup(){ // ekbar Run korun
  const ss=SpreadsheetApp.getActive();
  Object.keys(HEAD).forEach(n=>{
    let s=ss.getSheetByName(n)||ss.insertSheet(n);
    s.getRange(1,1,1,HEAD[n].length).setValues([HEAD[n]]).setFontWeight('bold').setBackground('#d9ead3');
    s.getRange(2,1,1000,HEAD[n].length).setNumberFormat('@');
    s.setFrozenRows(1);
  });
  if(rows('Settings').length==0)saveSettings(DEF);
  const p=PropertiesService.getScriptProperties();
  if(!p.getProperty('ADMIN_PASSWORD'))p.setProperty('ADMIN_PASSWORD','admin123');
}
const sh=n=>SpreadsheetApp.getActive().getSheetByName(n);
function rows(n){const v=sh(n).getDataRange().getValues();const h=v.shift();
  return v.filter(r=>r[0]!=='').map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);return o})}
function settings(){const s={...DEF};rows('Settings').forEach(r=>s[r.key]=r.value);
  NUM.forEach(k=>s[k]=Number(s[k])||0);
  if(s.start instanceof Date)s.start=Utilities.formatDate(s.start,TZ,'yyyy-MM-dd');
  s.start=String(s.start);s.phone=String(s.phone);s.bkash=String(s.bkash);s.nagad=String(s.nagad);return s}
function saveSettings(o){const s=sh('Settings'),k=Object.keys(DEF);
  if(s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,2).clearContent();
  s.getRange(2,1,k.length,2).setValues(k.map(x=>[x,String(o[x]!==undefined?o[x]:DEF[x])]))}
function pays(){return rows('Payments').map(r=>({id:String(r.id),ts:Number(r.ts),name:String(r.name),batch:String(r.batch),
  dept:String(r.dept),room:String(r.room),method:String(r.method),amount:Number(r.amount),from:String(r.from),
  trx:String(r.trx),note:String(r.note),status:String(r.status),at:Number(r.at)||0}))}
function notices(){return rows('Notices').map(r=>({id:String(r.id),ts:Number(r.ts),title:String(r.title),
  body:String(r.body),pin:String(r.pin)=='true'})).sort((a,b)=>b.ts-a.ts)}
const norm=s=>String(s||'').replace(/[\s-]/g,'').replace(/^\+?88/,'').toLowerCase();
const isAdmin=pw=>pw&&pw===PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const uid=()=>Utilities.getUuid().slice(0,8);

function doGet(){return out({ok:true,app:'Muktijoddha Hall Dining API'})}
function doPost(e){
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{return out(handle(JSON.parse(e.postData.contents)))}
  catch(err){return out({error:String(err.message||err)})}
  finally{lock.releaseLock()}
}
function findRow(sheet,id){const v=sh(sheet).getRange(1,1,sh(sheet).getLastRow(),1).getValues();
  for(let i=1;i<v.length;i++)if(String(v[i][0])==String(id))return i+1;throw new Error('পাওয়া যায়নি')}

function handle(r){
  const a=r.action,S=settings();
  if(a=='public')return{settings:S,notices:notices()};
  if(a=='submit'){
    const p=r.p||{},t=x=>String(x||'').trim().slice(0,200);
    const o={name:t(p.name),batch:t(p.batch),dept:t(p.dept),room:t(p.room),method:p.method=='Nagad'?'Nagad':'bKash',
      amount:Number(p.amount),from:t(p.from),trx:t(p.trx),note:t(p.note)};
    if(!o.name||!o.batch||!o.dept||!o.room)throw new Error('নাম, Batch, Dept ও MH-Room নং দিন।');
    if(!(o.amount>=S.minAmt))throw new Error('Minimum ৳'+S.minAmt+' দিতে হবে।');
    if(!o.trx&&!o.from)throw new Error('Transaction ID অথবা নম্বর দিন।');
    if(o.trx&&pays().some(x=>norm(x.trx)==norm(o.trx)))throw new Error('এই Transaction ID আগেই জমা হয়েছে।');
    sh('Payments').appendRow([uid(),Date.now(),o.name,o.batch,o.dept,o.room,o.method,o.amount,o.from,o.trx,o.note,'pending','']);
    return{ok:true};
  }
  if(a=='lookup'){ // shudhu nijer tottho
    const nq=norm(r.q);if(!nq)return{payments:[]};
    const P=pays(),hits=P.filter(p=>norm(p.trx)==nq||norm(p.from)==nq);
    const nums=new Set(hits.map(p=>norm(p.from)).filter(Boolean));
    return{payments:P.filter(p=>hits.indexOf(p)>=0||nums.has(norm(p.from))).sort((a,b)=>b.ts-a.ts)};
  }
  if(!isAdmin(r.pw))throw new Error('ভুল Manager password');
  if(a=='adminData')return{settings:S,notices:notices(),payments:pays().sort((a,b)=>b.ts-a.ts)};
  if(a=='setStatus'){const row=findRow('Payments',r.id);
    if(['approved','rejected','pending'].indexOf(r.status)<0)throw new Error('invalid');
    sh('Payments').getRange(row,12,1,2).setValues([[r.status,Date.now()]]);return{ok:true}}
  if(a=='saveSettings'){saveSettings(r.settings);
    if(r.newPw&&String(r.newPw).length>=4)PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD',String(r.newPw));
    return{ok:true}}
  if(a=='addNotice'){sh('Notices').appendRow([uid(),Date.now(),String(r.title).slice(0,200),String(r.body||'').slice(0,1000),String(!!r.pin)]);return{ok:true}}
  if(a=='delNotice'){sh('Notices').deleteRow(findRow('Notices',r.id));return{ok:true}}
  throw new Error('unknown action');
}
