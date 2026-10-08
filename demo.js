'use strict';
const KEY='ems-logistics-demo-v1';
const people=[
 {id:'p1',name:'Jordan Sample',phone:'(713) 555-0101',area:'North Houston',pickup:'Sample pickup A · North Houston',center:'c1'},
 {id:'p2',name:'Casey Example',phone:'(713) 555-0102',area:'West Houston',pickup:'Sample pickup B · West Houston',center:'c2'},
 {id:'p3',name:'Taylor Demo',phone:'(713) 555-0103',area:'South Houston',pickup:'Sample pickup C · South Houston',center:'c3'}
];
const centers=[
 {id:'c1',name:'Northside Dialysis · sample',area:'North Houston',distances:{p1:3.2,p2:18.4,p3:21.1}},
 {id:'c2',name:'Westside Kidney Center · sample',area:'West Houston',distances:{p1:14.6,p2:2.4,p3:16.7}},
 {id:'c3',name:'Southside Dialysis · sample',area:'South Houston',distances:{p1:20.5,p2:15.8,p3:2.8}}
];
const contacts=[
 {id:'b1',name:'Northside Dialysis · sample',type:'Dialysis center',email:'coordinator@northside.example.com'},
 {id:'b2',name:'Westside Kidney Center · sample',type:'Dialysis center',email:'referrals@westside.example.com'},
 {id:'b3',name:'Southside Dialysis · sample',type:'Dialysis center',email:'care@southside.example.com'},
 {id:'b4',name:'Dr. Morgan Example · sample',type:'Nephrology',email:'office@nephrology.example.com'},
 {id:'b5',name:'Houston Care Team · sample',type:'Care coordination',email:'team@care.example.com'}
];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateString=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>dateString(new Date());
const parseDate=s=>new Date(`${s}T12:00:00`);
const addDays=(s,n)=>{const d=parseDate(s);d.setDate(d.getDate()+n);return dateString(d);};
const weekStart=s=>{const d=parseDate(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return dateString(d);};
const niceDate=s=>parseDate(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const niceTime=s=>{const [h,m]=s.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;};
const now=()=>new Date().toISOString();
const person=id=>people.find(p=>p.id===id)||people[0];
const center=id=>centers.find(c=>c.id===id)||centers[0];
const initials=s=>s.split(' ').map(x=>x[0]).join('');
let week=weekStart(today()),selectedTrip=null,selectedLead=null,requestStep=1,requestDone=null,callPatient='p1',lookupPatient='p1',leadFilter='All',leadSearch='',outreachFilter='All';
let requestDraft={patient:'p1',source:'Patient / family',center:'c1',date:today(),time:'08:00',days:[1,3,5],repeat:true};
const defaultEmail='Hello,\n\nWe’re preparing EMS Logistics, a Houston dialysis transportation coordination service. We would like to learn about your team’s transportation needs and discuss a future pilot.\n\nCould we arrange a brief introductory conversation? Please do not include patient information.\n\nThank you,\nEMS Logistics\nhello@ems-logistics.example.com';
let emailSubject='Introduction: dialysis transportation coordination',emailBody=defaultEmail,selectedContacts=['b1','b2','b3'];
function newState(){
 const stamp=now();
 const s={version:1,requests:[
  {id:'REQ-1001',patient:'p1',source:'Provider referral',center:'c1',date:today(),time:'08:00',days:[1,3,5],repeat:true,status:'New',owner:'Unassigned',consent:false,authorized:false,created:stamp,log:[{at:stamp,text:'Sample provider referral received.'}]},
  {id:'REQ-1002',patient:'p2',source:'Patient / family',center:'c2',date:today(),time:'09:00',days:[2,4,6],repeat:true,status:'Ready',owner:'Demo coordinator',consent:true,authorized:true,created:stamp,log:[{at:stamp,text:'Sample request reviewed; demo checks complete.'}]},
  {id:'REQ-1003',patient:'p3',source:'Call center',center:'c3',date:today(),time:'07:30',days:[1,3,5],repeat:true,status:'Scheduled',owner:'Demo coordinator',consent:true,authorized:true,created:stamp,log:[{at:stamp,text:'Sample recurring plan scheduled.'}]}
 ],trips:[],calls:[],campaigns:[]};
 s.trips=makeTrips(s.requests[2]);return s;
}
function makeTrips(r){
 const dates=[];
 for(let n=0;n<(r.repeat?28:1);n++){const d=addDays(r.date,n);if(!r.repeat||r.days.includes(parseDate(d).getDay()))dates.push(d);}
 return dates.map((date,i)=>({id:`${r.id}-T${i+1}`,request:r.id,patient:r.patient,center:r.center,date,time:r.time,status:'Scheduled',handoff:false}));
}
let state;
try{state=JSON.parse(localStorage.getItem(KEY));if(state?.version!==1||!['requests','trips','calls','campaigns'].every(k=>Array.isArray(state[k])))state=newState();}catch{state=newState();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('Browser storage is unavailable. Changes last for this open session.');}}
function log(r,text){r.log.unshift({at:now(),text});}
let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),5000);}
function route(){return location.hash.slice(1).split('?')[0]||'request';}
function go(name){if(route()===name)render();else location.hash=name;}
function head(title,desc,action=''){return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;}
function badge(s){return `<span class="badge ${s==='New'||s==='Review'?'pending':s==='Cancelled'?'cancelled':''}">${esc(s)}</span>`;}
function opts(values,chosen){return values.map(v=>`<option value="${esc(v.id??v)}" ${(v.id??v)===chosen?'selected':''}>${esc(v.name??v)}</option>`).join('');}
function daysText(days){return days.map(n=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n]).join(', ');}
function weekChecks(days){return `<div class="chips">${[1,2,3,4,5,6,0].map(n=>`<label class="check"><input type="checkbox" name="days" value="${n}" ${days.includes(n)?'checked':''}>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][n]}</label>`).join('')}</div>`;}
function auditList(r){return `<ul class="audit">${r.log.map(a=>`<li>${esc(a.text)}<time>${new Date(a.at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time></li>`).join('')}</ul>`;}
function requestView(){
 const p=person(requestDraft.patient);
 if(requestDone)return `<div class="request-wrap">${head('Demo request received.','This is a sample request, not a confirmed ride. Nothing was sent to a transportation provider.')}<section class="panel"><span class="badge">${esc(requestDone)}</span><h2 class="section-gap">What happens next</h2><p>A coordinator would review the request, confirm the necessary details with the transportation partner, then agree on a schedule.</p><div class="actions"><button class="primary" data-action="view-request">View in Site Leads</button><button class="secondary" data-action="another-request">Try another request</button></div></section></div>`;
 return `<div class="request-wrap">${head('Try a ride request.','Walk through the planned patient or provider referral flow using one of three fictional people.')}<ol class="stepper">${['Sample rider','Ride plan','Review'].map((s,i)=>`<li ${requestStep===i+1?'aria-current="step"':''}>${i+1}. ${s}</li>`).join('')}</ol><form class="panel" id="request-form"><div class="banner">Demo only. Use the supplied sample profiles. Do not enter real patient or medical information.</div>${requestStep===1?`
 <div class="fields"><label>Sample rider<select name="patient" id="request-patient">${opts(people,requestDraft.patient)}</select></label><label>Who is requesting?<select name="source">${opts(['Patient / family','Provider referral','Call center'],requestDraft.source)}</select></label><label>Sample phone<input readonly value="${esc(p.phone)}"></label><label>Sample pickup<input readonly value="${esc(p.pickup)}"></label></div><div class="actions"><button class="primary" type="submit">Continue to ride plan</button></div>`:requestStep===2?`
 <div class="fields"><label class="field-full">Assigned dialysis center<select name="center">${opts(centers,requestDraft.center)}</select><p class="field-help">Fictional locations. The selected center is the requested destination, not an automatic nearest-center assignment.</p></label><label>First service date<input name="date" type="date" value="${esc(requestDraft.date)}" min="${today()}" required></label><label>Requested pickup time<input name="time" type="time" value="${esc(requestDraft.time)}" required></label><label class="field-full">Ride pattern<select name="pattern"><option value="recurring" ${requestDraft.repeat?'selected':''}>Recurring round trips</option><option value="once" ${!requestDraft.repeat?'selected':''}>One round trip</option></select></label><div class="field-full"><p class="field-help">For recurring rides, choose the service days. The demo plans four weeks.</p>${weekChecks(requestDraft.days)}</div></div><p id="request-error" class="error" role="alert"></p><div class="actions"><button class="secondary" type="button" data-action="request-back">Back</button><button class="primary" type="submit">Review request</button></div>`:`
 <h2>Check the sample request</h2><dl class="summary-list"><dt>Rider</dt><dd>${esc(p.name)}</dd><dt>Requested by</dt><dd>${esc(requestDraft.source)}</dd><dt>Route</dt><dd>${esc(p.pickup)} to ${esc(center(requestDraft.center).name)} and back</dd><dt>Starts</dt><dd>${niceDate(requestDraft.date)} at ${niceTime(requestDraft.time)}</dd><dt>Pattern</dt><dd>${requestDraft.repeat?daysText(requestDraft.days)+' · four-week demo':'One round trip'}</dd></dl><label class="check"><input type="checkbox" name="demo-ack" required>I understand this uses fictional data and does not book a real ride.</label><div class="actions"><button class="secondary" type="button" data-action="request-back">Back</button><button class="primary" type="submit">Submit demo request</button></div>`}</form></div>`;
}
function leadsView(){
 const r=state.requests.find(r=>r.id===selectedLead);let rows=state.requests.filter(r=>(leadFilter==='All'||r.status===leadFilter)&&`${person(r.patient).name} ${r.id}`.toLowerCase().includes(leadSearch.toLowerCase()));
 return `${head('Site Leads','Review sample ride requests, assign an owner and move them into the calendar.','<a class="button" href="#request" data-action="new-request">New demo request</a>')}<div class="kpis"><div class="kpi"><strong>${state.requests.filter(r=>['New','Review'].includes(r.status)).length}</strong><span>Need review</span></div><div class="kpi"><strong>${state.requests.filter(r=>r.status==='Ready').length}</strong><span>Ready to schedule</span></div><div class="kpi"><strong>${state.requests.filter(r=>r.status==='Scheduled').length}</strong><span>Scheduled plans</span></div></div><div class="two-col"><section><form id="lead-filter" class="toolbar"><label>Find a sample request<input name="search" value="${esc(leadSearch)}" placeholder="Name or request ID"></label><label>Status<select name="status">${opts(['All','New','Review','Ready','Scheduled'],leadFilter)}</select></label><button class="secondary" type="submit">Filter</button></form><div class="row-list">${rows.map(r=>`<article class="row-card ${selectedLead===r.id?'selected':''}"><div><strong>${esc(person(r.patient).name)}</strong> ${badge(r.status)}<p>${esc(r.id)} · ${esc(r.source)}</p><p>${esc(r.owner)}${r.followup?` · Follow up ${niceDate(r.followup)}`:''}</p></div><button class="secondary" data-action="open-lead" data-id="${esc(r.id)}">Review</button></article>`).join('')||'<p class="empty">No requests match this filter.</p>'}</div></section><section class="panel">${r?`
 <h2>${esc(person(r.patient).name)}</h2><p>${esc(r.id)} · ${esc(person(r.patient).phone)}</p><dl class="summary-list"><dt>Pickup</dt><dd>${esc(person(r.patient).pickup)}</dd><dt>Destination</dt><dd>${esc(center(r.center).name)}</dd><dt>Requested plan</dt><dd>From ${niceDate(r.date)}, ${niceTime(r.time)}<br>${r.repeat?daysText(r.days):'One round trip'}</dd></dl><form id="review-form" data-id="${esc(r.id)}"><label>Request owner<select name="owner">${opts(['Unassigned','Demo coordinator','Demo call team'],r.owner)}</select></label><label class="section-gap">Next follow-up date<input type="date" name="followup" value="${esc(r.followup||'')}"></label><label class="check"><input type="checkbox" name="consent" ${r.consent?'checked':''} ${r.status==='Scheduled'?'disabled':''}>Sample consent and referral details reviewed</label><label class="check"><input type="checkbox" name="authorized" ${r.authorized?'checked':''} ${r.status==='Scheduled'?'disabled':''}>Sample operator, availability and payment checks complete</label><p class="field-help">These are simulated checks. They do not establish real authorization.</p><div class="actions"><button class="secondary" type="submit">Save review</button>${r.status!=='Scheduled'?`<button class="primary" name="intent" value="schedule" type="submit">Schedule demo rides</button>`:`<a class="inline-link" href="#calendar">Open calendar</a>`}</div><p class="error" id="review-error" role="alert"></p></form><h3 class="section-gap">Activity history</h3>${auditList(r)}`:'<div class="empty">Choose a request to see its details and next steps.</div>'}</section></div>`;
}
function calendarView(){
 const days=Array.from({length:7},(_,i)=>addDays(week,i));const t=state.trips.find(t=>t.id===selectedTrip);
 return `${head('Service calendar','Four-week recurring plans, schedule changes, dispatch handoff and trip outcomes. All entries are fictional.')}<div class="toolbar"><button class="secondary" data-action="week-prev">Previous week</button><strong>${niceDate(week)} – ${niceDate(addDays(week,6))}</strong><button class="secondary" data-action="week-next">Next week</button><button class="quiet" data-action="week-today">This week</button></div><div class="calendar">${days.map(d=>`<section class="day"><h3>${parseDate(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</h3>${state.trips.filter(t=>t.date===d).sort((a,b)=>a.time.localeCompare(b.time)).map(t=>`<button class="trip ${t.status.toLowerCase()} ${t.id===selectedTrip?'selected':''}" data-action="open-trip" data-id="${esc(t.id)}"><strong>${niceTime(t.time)}</strong><span>${esc(person(t.patient).name)}</span><span>${esc(t.status)} · round trip</span></button>`).join('')||'<span class="meta">No rides</span>'}</section>`).join('')}</div>${t?`<section class="panel"><h2>${esc(person(t.patient).name)} · round trip</h2><p>${esc(person(t.patient).pickup)} to ${esc(center(t.center).name)} and back</p><p class="meta">${esc(t.id)} · ${badge(t.status)} · ${t.handoff?'Demo dispatch handoff recorded':'Not handed to demo dispatch'}</p><form id="trip-form" data-id="${esc(t.id)}"><div class="fields section-gap"><label>Service date<input type="date" name="date" value="${esc(t.date)}" required></label><label>Pickup time<input type="time" name="time" value="${esc(t.time)}" required></label></div><div class="actions"><button class="secondary" type="submit" ${t.status!=='Scheduled'?'disabled':''}>Save this trip</button><button class="secondary" type="button" data-action="dispatch" data-id="${esc(t.id)}" ${t.status!=='Scheduled'||t.handoff?'disabled':''}>Simulate dispatch handoff</button><button class="primary" type="button" data-action="complete-trip" data-id="${esc(t.id)}" ${t.status!=='Scheduled'||!t.handoff?'disabled':''}>Mark completed</button><button class="secondary danger" type="button" data-action="cancel-trip" data-id="${esc(t.id)}" ${t.status!=='Scheduled'?'disabled':''}>Cancel this trip</button></div></form><p class="field-help section-gap">Changes apply to this trip only. Each entry represents pickup and return; handoff and outcome changes appear in the request’s activity history.</p></section>`:'<p class="empty">Select a trip to reschedule it, hand it to demo dispatch, or record an outcome. Create more rides from Site Leads.</p>'}`;
}
function centersHtml(pid){const p=person(pid);return centers.slice().sort((a,b)=>a.distances[pid]-b.distances[pid]).map(c=>`<article><h3>${esc(c.name)}</h3><p>${esc(c.area)} · ${c.distances[pid]} sample miles away</p>${c.id===p.center?'<span class="badge">Profile’s assigned center</span>':''}</article>`).join('');}
function centersView(){return `${head('Dialysis center lookup','Compare fictional facilities for a sample caller. Distances are illustrative, not live map results.')}<div class="two-col"><section class="panel"><label>Sample patient<select id="lookup-patient">${opts(people,lookupPatient)}</select></label><dl class="summary-list"><dt>Pickup</dt><dd>${esc(person(lookupPatient).pickup)}</dd><dt>Assigned center</dt><dd>${esc(center(person(lookupPatient).center).name)}</dd></dl><div class="banner">The nearest center is informational. A ride request uses its selected destination, which the coordinator reviews before scheduling.</div></section><section class="center-list" aria-label="Sample centers by distance">${centersHtml(lookupPatient)}</section></div>`;}
function callsView(){
 const active=state.calls.find(c=>c.status==='In progress'),p=person(active?.patient||callPatient);
 return `${head('Call center','Try an incoming call, see the sample caller’s information, and create a linked ride request.')}<div class="two-col"><section class="panel"><p class="eyebrow">Sample business line</p><h2>(713) 555-0142</h2><p>No phone provider is connected. These controls simulate a call in this browser.</p><label class="section-gap">Sample incoming caller<select id="call-patient" ${active?'disabled':''}>${opts(people,p.id)}</select></label><div class="call-state"><strong>${active?'Demo call in progress':'Ready for a sample call'}</strong><span>${esc(p.phone)} · ${esc(p.name)}</span></div><div class="call-toolbar">${active?`<button class="primary" data-action="call-request">Create linked request</button><button class="secondary" data-action="end-call">End demo call</button>`:'<button class="primary" data-action="start-call">Simulate incoming call</button>'}</div><h3 class="section-gap">Recent calls</h3><ul class="audit">${state.calls.slice(0,6).map(c=>`<li>${esc(person(c.patient).name)} · ${esc(c.status)}${c.request?`<br>Linked to ${esc(c.request)}`:''}<time>${new Date(c.started).toLocaleString()}</time></li>`).join('')||'<li>No sample calls yet.</li>'}</ul></section><section class="panel"><h2>${active?'Matched caller':'Caller preview'}</h2><dl class="summary-list"><dt>Name</dt><dd>${esc(p.name)}</dd><dt>Pickup</dt><dd>${esc(p.pickup)}</dd><dt>Assigned center</dt><dd>${esc(center(p.center).name)}</dd></dl><h3 class="section-gap">Nearby sample centers</h3><p class="filter-note">Illustrative distances; not route guidance.</p><div class="center-list">${centersHtml(p.id)}</div></section></div>`;
}
function outreachView(){return `${head('Provider outreach','Select sample business contacts and preview an introductory email. Simulation never sends mail.')}<form id="outreach-form"><div class="two-col"><section class="panel"><h2>Business-contact directory</h2><label>Contact type<select id="outreach-type">${opts(['All','Dialysis center','Nephrology','Care coordination'],outreachFilter)}</select></label><p class="filter-note">All names and example.com addresses are fictional. This is a provider directory, not a patient mailing list.</p><div class="outreach-list">${contacts.filter(c=>outreachFilter==='All'||c.type===outreachFilter).map(c=>`<label class="check"><input type="checkbox" name="contacts" value="${c.id}" ${selectedContacts.includes(c.id)?'checked':''}><span>${esc(c.name)}<small>${esc(c.type)}<br>${esc(c.email)}</small></span></label>`).join('')}</div></section><section class="panel"><h2>Email preview</h2><label>Subject<input name="subject" maxlength="140" value="${esc(emailSubject)}" required></label><label class="section-gap">Sample email text<textarea name="body" rows="11" maxlength="2500" required>${esc(emailBody)}</textarea></label><p class="field-help">From: hello@ems-logistics.example.com · For demo copy only.</p><div class="actions"><button class="primary" type="submit">Simulate email campaign</button></div><p class="error" id="outreach-error" role="alert"></p></section></div></form><section class="panel section-gap"><h2>Campaign history</h2>${state.campaigns.length?state.campaigns.map(c=>`<article class="row-card"><div><strong>${esc(c.subject)}</strong><p>${c.contacts.length} sample recipients · ${new Date(c.at).toLocaleString()}</p><p class="meta">Simulated only. Zero real emails sent.</p></div><span class="badge">Demo recorded</span></article>`).join(''):'<p>No demo campaigns yet.</p>'}</section>`;}
function render(){
 const name=route(),views={request:requestView,leads:leadsView,calendar:calendarView,calls:callsView,centers:centersView,outreach:outreachView};
 $('#workspace').innerHTML=(views[name]||requestView)();
 document.querySelectorAll('.demo-nav a').forEach(a=>{if(a.hash===`#${name}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.title=`EMS Logistics | ${{request:'Ride request',leads:'Site Leads',calendar:'Calendar',calls:'Call center',centers:'Center lookup',outreach:'Outreach'}[name]||'Demo'} demo`;
}
function newRequest(d){const r={...d,id:`REQ-${Math.max(1000,...state.requests.map(r=>Number(r.id.split('-')[1])||1000))+1}`,status:'New',owner:'Unassigned',consent:false,authorized:false,created:now(),log:[{at:now(),text:`Demo ${d.source.toLowerCase()} request received.`}]};state.requests.unshift(r);save();return r;}
window.addEventListener('hashchange',()=>{render();$('#workspace').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});
document.addEventListener('change',e=>{
 if(e.target.id==='request-patient'){requestDraft.patient=e.target.value;requestDraft.center=person(e.target.value).center;requestDraft.source=$('[name=source]').value;render();}
 if(e.target.id==='lookup-patient'){lookupPatient=e.target.value;render();}
 if(e.target.id==='call-patient'){callPatient=e.target.value;render();}
 if(e.target.id==='outreach-type'){emailSubject=$('[name=subject]').value;emailBody=$('[name=body]').value;outreachFilter=e.target.value;render();}
 if(e.target.name==='contacts'){selectedContacts=e.target.checked?[...new Set([...selectedContacts,e.target.value])]:selectedContacts.filter(id=>id!==e.target.value);}
});
document.addEventListener('submit',e=>{
 const form=e.target;if(!['request-form','review-form','trip-form','lead-filter','outreach-form'].includes(form.id))return;e.preventDefault();const f=new FormData(form);
 if(form.id==='request-form'){
  if(requestStep===1){requestDraft.patient=f.get('patient');requestDraft.source=f.get('source');requestStep=2;}
  else if(requestStep===2){const repeat=f.get('pattern')==='recurring',days=f.getAll('days').map(Number);if(repeat&&!days.length){$('#request-error').textContent='Choose at least one recurring service day.';return;}requestDraft={...requestDraft,center:f.get('center'),date:f.get('date'),time:f.get('time'),repeat,days};requestStep=3;}
  else{const r=newRequest(requestDraft);requestDone=r.id;selectedLead=r.id;toast('Demo request saved. No real ride was booked.');}
  render();$('#workspace').focus({preventScroll:true});
 }
 if(form.id==='lead-filter'){leadSearch=String(f.get('search'));leadFilter=String(f.get('status'));render();}
 if(form.id==='review-form'){
  const r=state.requests.find(r=>r.id===form.dataset.id);const scheduling=e.submitter?.value==='schedule';
  const consent=r.status==='Scheduled'?r.consent:f.has('consent'),authorized=r.status==='Scheduled'?r.authorized:f.has('authorized');
  if(scheduling&&r.status==='Scheduled'){toast('This request already has a demo schedule.');return;}
  if(scheduling&&(!consent||!authorized||f.get('owner')==='Unassigned')){$('#review-error').textContent='Choose an owner and complete both sample checks before scheduling.';return;}
  r.owner=f.get('owner');r.consent=consent;r.authorized=authorized;r.followup=f.get('followup')||'';
  if(r.status!=='Scheduled')r.status=consent&&authorized?'Ready':'Review';
  log(r,'Demo review saved. Owner: '+r.owner+'.'+(r.followup?' Follow-up: '+r.followup+'.':''));
  if(scheduling){const trips=makeTrips(r);state.trips.push(...trips);r.status='Scheduled';log(r,`${trips.length} demo round trips scheduled.`);week=weekStart(trips[0].date);selectedTrip=trips[0].id;save();go('calendar');toast(`${trips.length} sample trips added to the calendar.`);}
  else{save();render();toast('Demo review saved.');}
 }
 if(form.id==='trip-form'){
  const t=state.trips.find(t=>t.id===form.dataset.id);if(t.status!=='Scheduled')return;const r=state.requests.find(r=>r.id===t.request);const old=`${t.date} ${t.time}`;t.date=f.get('date');t.time=f.get('time');log(r,`Trip rescheduled from ${old} to ${t.date} ${t.time}.`);week=weekStart(t.date);save();render();toast('This sample trip was rescheduled.');
 }
 if(form.id==='outreach-form'){
  emailSubject=String(f.get('subject'));emailBody=String(f.get('body'));if(!selectedContacts.length){$('#outreach-error').textContent='Choose at least one sample business contact.';return;}
  state.campaigns.unshift({id:`CAM-${Date.now()}`,subject:emailSubject,contacts:[...selectedContacts],at:now()});save();render();toast(`Demo recorded for ${selectedContacts.length} contacts. No emails sent.`);
 }
});
document.addEventListener('click',e=>{
 if(e.target.closest('.skip-link')){e.preventDefault();$('#workspace').focus();return;}
 const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 if(a==='new-request'){requestDone=null;requestStep=1;if(route()==='request')render();}
 if(a==='request-back'){if(requestStep===2){const f=new FormData($('#request-form'));requestDraft={...requestDraft,center:f.get('center'),date:f.get('date'),time:f.get('time'),repeat:f.get('pattern')==='recurring',days:f.getAll('days').map(Number)};}requestStep--;render();}
 if(a==='view-request'){leadFilter='All';leadSearch='';go('leads');}
 if(a==='another-request'){requestDone=null;requestStep=1;render();}
 if(a==='open-lead'){selectedLead=id;render();}
 if(a==='week-prev'){week=addDays(week,-7);render();}
 if(a==='week-next'){week=addDays(week,7);render();}
 if(a==='week-today'){week=weekStart(today());render();}
 if(a==='open-trip'){selectedTrip=id;render();}
 if(['dispatch','complete-trip','cancel-trip'].includes(a)){
  const t=state.trips.find(t=>t.id===id);if(t.status!=='Scheduled')return;const r=state.requests.find(r=>r.id===t.request);
  if(a==='dispatch'){t.handoff=true;log(r,`${t.date} trip handed to demo dispatch. No external message sent.`);}
  if(a==='complete-trip'){if(!t.handoff)return;t.status='Completed';log(r,`${t.date} round trip marked completed in demo.`);}
  if(a==='cancel-trip'){t.status='Cancelled';log(r,`${t.date} trip cancelled in demo.`);}
  save();render();toast('Sample trip updated.');
 }
 if(a==='start-call'){state.calls.unshift({id:`CALL-${Date.now()}`,patient:callPatient,status:'In progress',started:now()});save();render();}
 if(a==='end-call'){const c=state.calls.find(c=>c.status==='In progress');if(c){c.status='Ended';c.ended=now();save();render();toast('Demo call ended.');}}
 if(a==='call-request'){
  const c=state.calls.find(c=>c.status==='In progress');if(!c)return;
  if(c.request){selectedLead=c.request;go('leads');return;}
  const p=person(c.patient);const r=newRequest({patient:p.id,source:'Call center',center:p.center,date:today(),time:'08:00',repeat:true,days:[1,3,5]});c.request=r.id;log(r,'Linked to sample call '+c.id+'.');selectedLead=r.id;leadFilter='All';leadSearch='';save();go('leads');toast('Sample call linked to a new request.');
 }
});
$('#reset-demo').addEventListener('click',()=>$('#reset-dialog').showModal());
$('#keep-data').addEventListener('click',()=>$('#reset-dialog').close());
$('#confirm-reset').addEventListener('click',()=>{state=newState();save();selectedLead=null;selectedTrip=null;requestStep=1;requestDone=null;week=weekStart(today());leadFilter='All';leadSearch='';$('#reset-dialog').close();render();toast('Sample data restored.');});
render();
