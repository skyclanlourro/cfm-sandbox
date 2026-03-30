// =============================================
// CFM Sandbox — Full Application (No build tools)
// =============================================

// ---------- CONSTANTS ----------
const AF_AIRPORTS = [
  {code:'CDG',city:'Paris CDG'},{code:'ORY',city:'Paris Orly'},{code:'JFK',city:'New York JFK'},
  {code:'LAX',city:'Los Angeles'},{code:'NRT',city:'Tokyo Narita'},{code:'PEK',city:'Pékin'},
  {code:'SIN',city:'Singapour'},{code:'DXB',city:'Dubai'},{code:'LHR',city:'Londres Heathrow'},
  {code:'FCO',city:'Rome'},{code:'BCN',city:'Barcelone'},{code:'AMS',city:'Amsterdam'},
  {code:'FRA',city:'Francfort'},{code:'MIA',city:'Miami'},{code:'YUL',city:'Montréal'},
  {code:'GRU',city:'São Paulo'},{code:'BOG',city:'Bogotá'},{code:'MEX',city:'Mexico'},
  {code:'ABJ',city:'Abidjan'},{code:'DSS',city:'Dakar'},
];
const FLIGHT_STATUSES = ['Programmé','Confirmé','Modifié','Annulé','En vol','Atterri'];
const AIRCRAFT_TYPES = ['A320','A321','A330-200','A350-900','A380','B777-200ER','B777-300ER','B787-9'];
const CABIN_CLASSES = ['Economy','Premium Economy','Business','La Première'];
// CabinPad template constants
const CONNECTION_FLOW_STATUSES = ['TO_MAINTAIN','TO_REBOOK','MAINTAINED','MISSED'];
const TERMINALS = ['2A','2B','2C','2D','2E','2F','2F2','2G','1','3','S3','S4'];
const GATES = ['A10','A22','A34','B15','B28','C05','C12','D08','E14','E30','F20','F50','G12','K25','L32','M45'];
const ACTIONS_TAKEN_OPTIONS = ['PAX_NOTIFIED','REBOOKING_INITIATED','LOUNGE_ACCESS_GRANTED','FAST_TRACK_ISSUED','GATE_CHANGE_ANNOUNCED','CREW_NOTIFIED'];
const PRODUCT_TYPES = ['Repas à bord','Boisson','Kit de confort','Duty Free','Wi-Fi','Divertissement','Siège premium','Bagages','Lounge','Service spécial'];
const TEST_CATEGORIES = [{id:'cfm',label:'CFM',color:'blue'},{id:'cabinpad',label:'Cabinpad',color:'teal'},{id:'product',label:'Produit',color:'purple'},{id:'integration',label:'Intégration',color:'amber'}];
const TEST_STATUSES = [{id:'draft',label:'Brouillon',color:'blue'},{id:'ready',label:'Prêt',color:'blue'},{id:'running',label:'En cours',color:'amber'},{id:'passed',label:'Réussi',color:'green'},{id:'failed',label:'Échoué',color:'red'}];
const PRODUCT_PHASES = [{id:'dev',label:'Développement',color:'purple'},{id:'recette',label:'Recette',color:'amber'},{id:'prod',label:'Production',color:'green'}];
const SK = {TC:'cfm_tc',FL:'cfm_fl',PR:'cfm_pr',AC:'cfm_ac'};
const PAGE_TITLES = {dashboard:'Dashboard',testcases:'Cas de Test',flights:'Données de Vol',products:'Produits',formation:'Formation CFM',transformer:'Transformer',export:'Export / Import',guide:'Guide'};

// ---------- HELPERS ----------
const gid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const rnd = a => a[Math.floor(Math.random()*a.length)];
const rint = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const fmtD = d => new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
const fmtDT = d => new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const fmtT = d => new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// ---------- STORAGE ----------
function load(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}}
function save(k,d){try{localStorage.setItem(k,JSON.stringify(d))}catch(e){console.error(e)}}

function addActivity(type,name,action){
  const a=load(SK.AC);a.unshift({id:gid(),type,name,action,timestamp:new Date().toISOString()});
  save(SK.AC,a.slice(0,50));
}

// CRUD
function getTC(){return load(SK.TC)}
function saveTC(tc){const all=getTC();const i=all.findIndex(c=>c.id===tc.id);
  if(i>=0){all[i]={...all[i],...tc,updatedAt:new Date().toISOString()}}
  else{all.push({id:gid(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'draft',category:'cfm',flights:[],products:[],...tc})}
  save(SK.TC,all);addActivity('tc',tc.name||'Cas de test',i>=0?'modifié':'créé');return all}
function delTC(id){const a=getTC().filter(c=>c.id!==id);save(SK.TC,a);addActivity('tc','Cas de test','supprimé');return a}

function getFL(){return load(SK.FL)}
function saveFL(f){const all=getFL();const i=all.findIndex(x=>x.id===f.id);
  if(i>=0){all[i]={...all[i],...f,updatedAt:new Date().toISOString()}}
  else{all.push({id:gid(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...f})}
  save(SK.FL,all);addActivity('fl',f.flightNumber||'Vol',i>=0?'modifié':'créé');return all}
function delFL(id){const a=getFL().filter(f=>f.id!==id);save(SK.FL,a);addActivity('fl','Vol','supprimé');return a}

function getPR(){return load(SK.PR)}
function savePR(p){const all=getPR();const i=all.findIndex(x=>x.id===p.id);
  if(i>=0){all[i]={...all[i],...p,updatedAt:new Date().toISOString()}}
  else{all.push({id:gid(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),phase:'dev',...p})}
  save(SK.PR,all);addActivity('pr',p.name||'Produit',i>=0?'modifié':'créé');return all}
function delPR(id){const a=getPR().filter(p=>p.id!==id);save(SK.PR,a);addActivity('pr','Produit','supprimé');return a}

// ---------- GENERATORS ----------
function genFlightNum(){return `AF${rint(100,9999).toString().padStart(4,'0')}`}
function genFlight(opts={}){
  const o=opts.origin||{code:'CDG',city:'Paris CDG'}, dest=opts.destination||rnd(AF_AIRPORTS.filter(a=>a.code!=='CDG'));
  const dep=new Date();dep.setDate(dep.getDate()+rint(0,30));dep.setHours(rint(5,23),rint(0,59),0,0);
  const scheduledTs=dep.getTime();
  const hasMod=opts.forceModify||Math.random()>0.5;
  const modOffset=rint(-240,240)*60000; // ±4h in ms
  const lastKnownTs=hasMod?scheduledTs+modOffset:scheduledTs+rint(0,5)*60000;
  const nActions=rint(0,3);
  const actions=[];
  for(let i=0;i<nActions;i++){const a=rnd(ACTIONS_TAKEN_OPTIONS);if(!actions.includes(a))actions.push(a);}
  return{
    // Internal fields
    flightNumber:opts.flightNumber||genFlightNum(),
    origin:o.code, originCity:o.city,
    destination:dest.code, destinationCity:dest.city,
    status:opts.status||rnd(FLIGHT_STATUSES),
    aircraftType:rnd(AIRCRAFT_TYPES),
    // CabinPad template fields
    actionsTaken:actions,
    connectionFlowStatus:rnd(CONNECTION_FLOW_STATUSES),
    criticalityDctTime:rint(15,180),
    gateNumberOutboundDeparture:rnd(GATES),
    outboundFlightDestination:dest.code,
    outboundFlightLastKnownDate:lastKnownTs,
    outboundFlightNumber:opts.flightNumber||genFlightNum(),
    outboundFlightOrigin:'CDG',
    outboundFlightScheduledDate:scheduledTs,
    ppt:rint(30,120),
    shortConnectionPassEligibility:Math.random()>0.7,
    terminalOutboundDepartureInfo:rnd(TERMINALS),
    transferTo:[],
    // Convenience fields for display
    modifyDate:hasMod?lastKnownTs:null,
  };
}
function genBatch(n=5,opts={}){const r=[];for(let i=0;i<n;i++){const f=genFlight(opts);f.outboundFlightNumber=f.flightNumber;r.push(f);}return r}

// Generate CabinPad output format: { data: [...] }
function genCabinPadOutput(flights){
  return { data: flights.map(f=>({
    actionsTaken:f.actionsTaken||[],
    connectionFlowStatus:f.connectionFlowStatus||'TO_MAINTAIN',
    criticalityDctTime:f.criticalityDctTime||101,
    gateNumberOutboundDeparture:f.gateNumberOutboundDeparture||'F50',
    outboundFlightDestination:f.outboundFlightDestination||f.destination,
    outboundFlightLastKnownDate:f.outboundFlightLastKnownDate||f.outboundFlightScheduledDate,
    outboundFlightNumber:f.outboundFlightNumber||f.flightNumber,
    outboundFlightOrigin:'CDG',
    outboundFlightScheduledDate:f.outboundFlightScheduledDate,
    ppt:f.ppt||62,
    shortConnectionPassEligibility:f.shortConnectionPassEligibility||false,
    terminalOutboundDepartureInfo:f.terminalOutboundDepartureInfo||'2F2',
    transferTo:f.transferTo||[],
  }))};
}

// Generate source JSON (outBound format used by upstream system)
function genSourceJson(flights){
  return flights.map(f=>({
    outBound:{
      flightNumber:f.flightNumber,
      departureDate:f.outboundFlightScheduledDate,
      departureStation:f.origin,
      arrivalStation:f.destination,
      lastKnownDate:f.outboundFlightLastKnownDate,
      gate:f.gateNumberOutboundDeparture,
      terminal:f.terminalOutboundDepartureInfo,
      aircraftType:f.aircraftType,
      status:f.status,
    }
  }));
}

// Legacy CFM message (kept for compatibility)
function genCFMMsg(f){
  return genCabinPadOutput([f]);
}

// ---------- UI HELPERS ----------
function showToast(msg,type='info'){
  const c=document.getElementById('toastContainer');
  const t=document.createElement('div');t.className=`toast toast-${type}`;
  const icons={success:'✓',error:'✕',info:'ℹ'};
  t.innerHTML=`<span style="font-size:16px">${icons[type]||icons.info}</span><span>${msg}</span>`;
  c.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(40px)';t.style.transition='all .3s ease';setTimeout(()=>t.remove(),300)},3000);
}
function showModal(html){const o=document.getElementById('modalOverlay'),c=document.getElementById('modalContent');c.innerHTML=html;o.hidden=false}
function closeModal(){document.getElementById('modalOverlay').hidden=true}

// ---------- STATE ----------
let currentPage='dashboard', tcFilter='all', prFilter='all';

// ---------- PAGE: DASHBOARD ----------
function renderDashboard(){
  const tcs=getTC(),fls=getFL(),prs=getPR(),acts=load(SK.AC).slice(0,8);
  const modCount=fls.filter(f=>f.modifyDate||f.outboundFlightLastKnownDate!==f.outboundFlightScheduledDate).length;
  const statusCounts={};TEST_STATUSES.forEach(s=>{statusCounts[s.id]=tcs.filter(t=>t.status===s.id).length});
  const actHtml=acts.length?acts.map(a=>`<div class="timeline-item"><div class="timeline-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="3"/></svg></div><div><div class="timeline-title"><strong>${esc(a.name)}</strong> ${a.action}</div><div class="timeline-time">${fmtDT(a.timestamp)}</div></div></div>`).join(''):'<div style="color:var(--text-muted);font-size:var(--font-size-sm);padding:var(--space-4)">Aucune activité. Commencez par créer un cas de test.</div>';

  return `<div class="page-enter">
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:var(--blue-500)"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div><div class="stat-value">${tcs.length}</div><div class="stat-label">Cas de test</div></div>
      <div class="stat-card" style="--stat-color:var(--teal-500)"><div class="stat-icon" style="background:rgba(0,184,169,0.1);color:var(--teal-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div><div class="stat-value">${fls.length}</div><div class="stat-label">Données de vol</div></div>
      <div class="stat-card" style="--stat-color:var(--purple-500)"><div class="stat-icon" style="background:rgba(108,92,231,0.1);color:var(--purple-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div><div class="stat-value">${prs.length}</div><div class="stat-label">Produits</div></div>
      <div class="stat-card" style="--stat-color:var(--amber-500)"><div class="stat-icon" style="background:rgba(247,183,49,0.1);color:var(--amber-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div><div class="stat-value">${modCount}</div><div class="stat-label">Modifications vol</div></div>
    </div>
    <div class="section"><div class="section-header"><h2 class="section-title">Statut des tests</h2></div>
      <div class="card"><div style="display:flex;gap:var(--space-4);flex-wrap:wrap">${TEST_STATUSES.map(s=>`<div style="display:flex;align-items:center;gap:var(--space-2)"><span class="badge badge-${s.color}">${s.label}</span><span style="font-weight:700;font-size:var(--font-size-lg)">${statusCounts[s.id]||0}</span></div>`).join('')}</div></div>
    </div>
    <div class="section"><div class="section-header"><h2 class="section-title">Activité récente</h2></div>
      <div class="card" style="padding:var(--space-4) var(--space-6)"><div class="timeline">${actHtml}</div></div>
    </div>
    <div class="section"><div class="section-header"><h2 class="section-title">Actions rapides</h2></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-4)">
        <button class="card" style="text-align:left;cursor:pointer;border:none" onclick="nav('testcases')"><strong style="color:var(--blue-500)">+ Nouveau cas de test</strong><div style="color:var(--text-muted);font-size:var(--font-size-sm);margin-top:var(--space-2)">Créer un scénario de test</div></button>
        <button class="card" style="text-align:left;cursor:pointer;border:none" onclick="nav('flights')"><strong style="color:var(--teal-500)">⚡ Générer des vols</strong><div style="color:var(--text-muted);font-size:var(--font-size-sm);margin-top:var(--space-2)">Données de vol réalistes</div></button>
        <button class="card" style="text-align:left;cursor:pointer;border:none" onclick="nav('export')"><strong style="color:var(--purple-500)">↓ Exporter</strong><div style="color:var(--text-muted);font-size:var(--font-size-sm);margin-top:var(--space-2)">Partager les jeux de données</div></button>
      </div>
    </div>
  </div>`;
}

// ---------- PAGE: TEST CASES ----------
function renderTestCases(){
  const tcs=getTC(), filtered=tcFilter==='all'?tcs:tcs.filter(t=>t.category===tcFilter);
  const pills=TEST_CATEGORIES.map(c=>`<button class="pill ${tcFilter===c.id?'active':''}" onclick="tcFilter='${c.id}';nav('testcases')">${c.label} (${tcs.filter(t=>t.category===c.id).length})</button>`).join('');
  const items=filtered.map(tc=>{const cat=TEST_CATEGORIES.find(c=>c.id===tc.category)||TEST_CATEGORIES[0],st=TEST_STATUSES.find(s=>s.id===tc.status)||TEST_STATUSES[0];
    return `<div class="item-card"><div class="item-card-icon" style="background:rgba(0,112,224,0.1);color:var(--blue-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div>
    <div class="item-card-body"><div class="item-card-title">${esc(tc.name||'Sans nom')} ${tc.jiraTicket ? `<span class="badge badge-amber" style="margin-left:var(--space-2);font-size:10px">${esc(tc.jiraTicket)}</span>` : ''}</div><div class="item-card-desc">${esc(tc.description||'Aucune description')}</div>
    <div class="item-card-meta"><span class="badge badge-${cat.color}">${cat.label}</span><span class="badge badge-${st.color}">${st.label}</span><span style="color:var(--text-muted);font-size:var(--font-size-xs)">${fmtDT(tc.updatedAt)}</span></div></div>
    <div class="item-card-actions"><button class="btn btn-ghost btn-icon" onclick="event.stopPropagation();openTCModal('${tc.id}')" title="Modifier">✎</button><button class="btn btn-danger btn-icon" onclick="event.stopPropagation();if(confirm('Supprimer ?')){delTC('${tc.id}');showToast('Supprimé','success');nav('testcases')}" title="Supprimer">✕</button></div></div>`}).join('');
  const empty=`<div class="card"><div class="empty-state"><div class="empty-state-title">Aucun cas de test</div><div class="empty-state-text">Créez votre premier cas de test.</div><button class="btn btn-primary" onclick="openTCModal()">+ Créer</button></div></div>`;
  return `<div class="page-enter"><div class="section-header"><div class="pill-filters"><button class="pill ${tcFilter==='all'?'active':''}" onclick="tcFilter='all';nav('testcases')">Tous (${tcs.length})</button>${pills}</div><button class="btn btn-primary" onclick="openTCModal()">+ Nouveau</button></div>${filtered.length?`<div class="item-list">${items}</div>`:empty}</div>`;
}

function openTCModal(id){
  const ex=id?getTC().find(c=>c.id===id):null, isE=!!ex;
  showModal(`<div class="modal-header"><h2 class="modal-title">${isE?'Modifier':'Nouveau'} cas de test</h2><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Nom</label><input type="text" class="form-input" id="tcName" value="${esc(ex?.name||'')}" placeholder="Vérification modifyDate vol AF1234"/></div>
    <div class="form-group"><label class="form-label">Ticket Jira</label><input type="text" class="form-input" id="tcJira" value="${esc(ex?.jiraTicket||'')}" placeholder="CFM-XXX"/></div></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="tcDesc" placeholder="Décrire le scénario...">${esc(ex?.description||'')}</textarea></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Catégorie</label><select class="form-select" id="tcCat">${TEST_CATEGORIES.map(c=>`<option value="${c.id}" ${ex?.category===c.id?'selected':''}>${c.label}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Statut</label><select class="form-select" id="tcSt">${TEST_STATUSES.map(s=>`<option value="${s.id}" ${ex?.status===s.id?'selected':''}>${s.label}</option>`).join('')}</select></div></div>
    <div class="form-group"><label class="form-label">Données attendues (JSON)</label><textarea class="form-textarea" id="tcData" style="font-family:monospace;font-size:var(--font-size-xs)">${esc(ex?.expectedData||'')}</textarea></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="tcSaveBtn">${isE?'Mettre à jour':'Créer'}</button></div>`);
  document.getElementById('tcSaveBtn').onclick=()=>{const n=document.getElementById('tcName').value.trim();if(!n){showToast('Nom requis','error');return}
    saveTC({...(ex||{}),name:n,jiraTicket:document.getElementById('tcJira').value.trim(),description:document.getElementById('tcDesc').value.trim(),category:document.getElementById('tcCat').value,status:document.getElementById('tcSt').value,expectedData:document.getElementById('tcData').value.trim()});
    closeModal();showToast(isE?'Mis à jour':'Créé','success');nav('testcases')};
}

// ---------- PAGE: FLIGHTS ----------
function renderFlights(){
  const fls=getFL();
  const fmtTs=ts=>{if(!ts)return'—';const d=new Date(typeof ts==='number'?ts:ts);return fmtD(d)};
  const fmtTsT=ts=>{if(!ts)return'';const d=new Date(typeof ts==='number'?ts:ts);return fmtT(d)};
  const hasModify=f=>f.modifyDate||(f.outboundFlightLastKnownDate&&f.outboundFlightScheduledDate&&f.outboundFlightLastKnownDate!==f.outboundFlightScheduledDate);
  const rows=fls.map(f=>`<tr>
    <td><strong style="color:var(--blue-500)">${f.flightNumber}</strong></td>
    <td><span style="font-weight:600">${f.outboundFlightOrigin||f.origin}</span> → <span style="font-weight:600">${f.outboundFlightDestination||f.destination}</span></td>
    <td style="white-space:nowrap">${fmtTs(f.outboundFlightScheduledDate)}<br><span style="color:var(--text-muted);font-size:var(--font-size-xs)">${fmtTsT(f.outboundFlightScheduledDate)}</span></td>
    <td>${hasModify(f)?`<span class="badge badge-amber">${fmtTs(f.outboundFlightLastKnownDate)} ${fmtTsT(f.outboundFlightLastKnownDate)}</span>`:'<span style="color:var(--text-muted)">—</span>'}</td>
    <td><span class="badge badge-${f.connectionFlowStatus==='MISSED'?'red':f.connectionFlowStatus==='TO_REBOOK'?'amber':f.connectionFlowStatus==='MAINTAINED'?'green':'blue'}">${f.connectionFlowStatus||'—'}</span></td>
    <td style="color:var(--text-muted)">${f.gateNumberOutboundDeparture||'—'}</td>
    <td style="color:var(--text-muted)">${f.terminalOutboundDepartureInfo||'—'}</td>
    <td style="text-align:center">${f.ppt||'—'}</td>
    <td><button class="btn btn-ghost btn-icon" onclick="showCFMMsg('${f.id}')" title="CabinPad JSON">📄</button><button class="btn btn-ghost btn-icon" onclick="showSourceMsg('${f.id}')" title="Source JSON">📥</button><button class="btn btn-ghost btn-icon" onclick="delFL('${f.id}');showToast('Supprimé','success');nav('flights')" title="Supprimer">✕</button></td></tr>`).join('');
  const table=`<div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Vol</th><th>Route</th><th>scheduledDate</th><th>lastKnownDate</th><th>flowStatus</th><th>Gate</th><th>Terminal</th><th>PPT</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  const empty=`<div class="card"><div class="empty-state"><div class="empty-state-title">Aucune donnée de vol</div><div class="empty-state-text">Utilisez la génération rapide ci-dessus.</div></div></div>`;

  return `<div class="page-enter">
    <div class="quick-gen-panel"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4)">
      <div><h3 style="font-size:var(--font-size-md);font-weight:700;margin-bottom:var(--space-1)">⚡ Génération rapide — Format CabinPad</h3>
      <p style="color:var(--text-muted);font-size:var(--font-size-sm)">Structure conforme au template CabinPad avec <code style="color:var(--amber-500)">outboundFlightLastKnownDate</code></p></div>
      <div style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:var(--space-2)"><label style="font-size:var(--font-size-xs);color:var(--text-muted)">Nb :</label><input type="number" class="form-input" id="batchN" value="5" min="1" max="50" style="width:70px;padding:var(--space-2) var(--space-3)"/></div>
        <label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-xs);color:var(--text-secondary);cursor:pointer"><input type="checkbox" id="forceMod" style="accent-color:var(--blue-500)"/>Forcer modification date</label>
        <button class="btn btn-primary" id="batchBtn">⚡ Générer</button>
      </div></div></div>
    <div class="section-header"><h2 class="section-title">Vols (${fls.length})</h2><div style="display:flex;gap:var(--space-3)">
      <button class="btn btn-secondary" onclick="openFlightModal()">+ Ajout manuel</button>
      ${fls.length?`<button class="btn btn-secondary" onclick="showBatchCabinPad()" title="Voir le JSON CabinPad complet">{ } CabinPad JSON</button>`:''}
      ${fls.length?`<button class="btn btn-danger" onclick="if(confirm('Tout effacer ?')){getFL().forEach(f=>delFL(f.id));showToast('Effacé','success');nav('flights')}">Tout effacer</button>`:''}
    </div></div>
    ${fls.length?table:empty}</div>`;
}

function initFlightsEvents(){
  const btn=document.getElementById('batchBtn');
  if(btn)btn.onclick=()=>{const n=Math.min(parseInt(document.getElementById('batchN').value)||5,50);
    const fm=document.getElementById('forceMod').checked;
    genBatch(n,{forceModify:fm}).forEach(f=>saveFL(f));showToast(`${n} vols générés`,'success');nav('flights')};
}

function openFlightModal(){
  const fn=genFlightNum();
  showModal(`<div class="modal-header"><h2 class="modal-title">Ajouter un vol (CabinPad)</h2><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
    <div class="form-row"><div class="form-group"><label class="form-label">outboundFlightNumber</label><input type="text" class="form-input" id="fNum" value="${fn}"/></div>
    <div class="form-group"><label class="form-label">connectionFlowStatus</label><select class="form-select" id="fFlow">${CONNECTION_FLOW_STATUSES.map(s=>`<option>${s}</option>`).join('')}</select></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">outboundFlightOrigin</label><select class="form-select" id="fOr" disabled><option value="CDG" selected>CDG — Paris CDG</option></select></div>
    <div class="form-group"><label class="form-label">outboundFlightDestination</label><select class="form-select" id="fDe">${AF_AIRPORTS.map(a=>`<option value="${a.code}">${a.code} — ${a.city}</option>`).join('')}</select></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">ScheduledDate</label><input type="datetime-local" class="form-input" id="fDep"/></div>
    <div class="form-group"><label class="form-label">LastKnownDate (modif)</label><input type="datetime-local" class="form-input" id="fMod"/></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Gate</label><select class="form-select" id="fGate">${GATES.map(g=>`<option>${g}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Terminal</label><select class="form-select" id="fTerm">${TERMINALS.map(t=>`<option>${t}</option>`).join('')}</select></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">PPT (min)</label><input type="number" class="form-input" id="fPpt" value="62" min="0"/></div>
    <div class="form-group"><label class="form-label">criticalityDctTime</label><input type="number" class="form-input" id="fDct" value="101" min="0"/></div></div>
    <div class="form-group"><label class="form-label">shortConnectionPassEligibility</label><select class="form-select" id="fScp"><option value="false">false</option><option value="true">true</option></select></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="fSaveBtn">Ajouter</button></div>`);
  document.getElementById('fSaveBtn').onclick=()=>{const dep=document.getElementById('fDep').value;
    if(!dep){showToast('ScheduledDate requise','error');return}
    const or=document.getElementById('fOr').value,de=document.getElementById('fDe').value,mv=document.getElementById('fMod').value;
    const schedTs=new Date(dep).getTime(), lastTs=mv?new Date(mv).getTime():schedTs;
    saveFL({flightNumber:document.getElementById('fNum').value.trim(),
      origin:or,originCity:AF_AIRPORTS.find(a=>a.code===or)?.city||or,
      destination:de,destinationCity:AF_AIRPORTS.find(a=>a.code===de)?.city||de,
      status:'Programmé',aircraftType:rnd(AIRCRAFT_TYPES),
      outboundFlightNumber:document.getElementById('fNum').value.trim(),
      outboundFlightOrigin:or,outboundFlightDestination:de,
      outboundFlightScheduledDate:schedTs,outboundFlightLastKnownDate:lastTs,
      connectionFlowStatus:document.getElementById('fFlow').value,
      gateNumberOutboundDeparture:document.getElementById('fGate').value,
      terminalOutboundDepartureInfo:document.getElementById('fTerm').value,
      ppt:parseInt(document.getElementById('fPpt').value)||62,
      criticalityDctTime:parseInt(document.getElementById('fDct').value)||101,
      shortConnectionPassEligibility:document.getElementById('fScp').value==='true',
      actionsTaken:[],transferTo:[],
      modifyDate:mv?lastTs:null,
    });closeModal();showToast('Vol ajouté','success');nav('flights')};
}

function showCFMMsg(id){
  const f=getFL().find(x=>x.id===id);if(!f)return;
  const msg=genCabinPadOutput([f]), json=JSON.stringify(msg,null,2);
  const copyJson=JSON.stringify(msg);
  showModal(`<div class="modal-header"><h2 class="modal-title">CabinPad JSON — ${f.flightNumber}</h2><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
    <p style="font-size:var(--font-size-sm);color:var(--text-muted);margin-bottom:var(--space-4)"><span class="badge badge-teal">CabinPad Template</span> — Structure conforme au format de production</p>
    <div class="code-preview">${esc(json)}</div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Fermer</button><button class="btn btn-primary" id="cpCabBtn">Copier</button></div>`);
  document.getElementById('cpCabBtn').onclick=()=>navigator.clipboard.writeText(json).then(()=>showToast('Copié','success'));
}

function showSourceMsg(id){
  const f=getFL().find(x=>x.id===id);if(!f)return;
  const src=genSourceJson([f]), json=JSON.stringify(src,null,2);
  showModal(`<div class="modal-header"><h2 class="modal-title">Source JSON — ${f.flightNumber}</h2><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
    <p style="font-size:var(--font-size-sm);color:var(--text-muted);margin-bottom:var(--space-4)"><span class="badge badge-blue">Source (outBound)</span> — Format d'entrée avant mapping vers CabinPad</p>
    <div class="code-preview">${esc(json)}</div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Fermer</button><button class="btn btn-primary" id="cpSrcBtn">Copier</button></div>`);
  document.getElementById('cpSrcBtn').onclick=()=>navigator.clipboard.writeText(json).then(()=>showToast('Copié','success'));
}

function showBatchCabinPad(){
  const fls=getFL();
  const out=genCabinPadOutput(fls), json=JSON.stringify(out,null,2);
  showModal(`<div class="modal-header"><h2 class="modal-title">CabinPad JSON — ${fls.length} vols</h2><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
    <p style="font-size:var(--font-size-sm);color:var(--text-muted);margin-bottom:var(--space-4)"><span class="badge badge-teal">{ data: [${fls.length}] }</span> — Export complet au format CabinPad</p>
    <div class="code-preview">${esc(json)}</div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Fermer</button><button class="btn btn-primary" id="cpBatchBtn">Copier</button></div>`);
  document.getElementById('cpBatchBtn').onclick=()=>navigator.clipboard.writeText(json).then(()=>showToast('Copié','success'));
}

// ---------- PAGE: PRODUCTS ----------
function renderProducts(){
  const prs=getPR(), filtered=prFilter==='all'?prs:prs.filter(p=>p.phase===prFilter);
  const pills=PRODUCT_PHASES.map(p=>`<button class="pill ${prFilter===p.id?'active':''}" onclick="prFilter='${p.id}';nav('products')">${p.label} (${prs.filter(x=>x.phase===p.id).length})</button>`).join('');
  const items=filtered.map(p=>{const ph=PRODUCT_PHASES.find(x=>x.id===p.phase)||PRODUCT_PHASES[0];
    return `<div class="item-card"><div class="item-card-icon" style="background:rgba(108,92,231,0.1);color:var(--purple-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div>
    <div class="item-card-body"><div class="item-card-title">${esc(p.name)}</div><div class="item-card-desc">${esc(p.type||'')} ${p.description?'— '+esc(p.description):''}</div>
    <div class="item-card-meta"><span class="badge badge-${ph.color}">${ph.label}</span><span style="color:var(--text-muted);font-size:var(--font-size-xs)">${fmtDT(p.updatedAt)}</span></div></div>
    <div class="item-card-actions"><button class="btn btn-ghost btn-icon" onclick="event.stopPropagation();openPRModal('${p.id}')" title="Modifier">✎</button>
    <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation();promotePR('${p.id}')" title="Promouvoir" ${p.phase==='prod'?'disabled style="opacity:.3"':''}>↑</button>
    <button class="btn btn-danger btn-icon" onclick="event.stopPropagation();if(confirm('Supprimer ?')){delPR('${p.id}');showToast('Supprimé','success');nav('products')}" title="Supprimer">✕</button></div></div>`}).join('');
  const empty=`<div class="card"><div class="empty-state"><div class="empty-state-title">Aucun produit</div><div class="empty-state-text">Ajoutez des entrées produit pour la recette.</div><button class="btn btn-primary" onclick="openPRModal()">+ Ajouter</button></div></div>`;
  return `<div class="slide-up"><div class="section-header"><div class="pill-filters"><button class="pill ${prFilter==='all'?'active':''}" onclick="prFilter='all';nav('products')">Tous (${prs.length})</button>${pills}</div><button class="btn btn-primary" onclick="openPRModal()">+ Nouveau</button></div>
    <div class="card" style="background:linear-gradient(135deg,rgba(108,92,231,0.1),rgba(108,92,231,0.03));border-color:rgba(108,92,231,0.15);margin-bottom:var(--space-6)"><div style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:var(--space-1)">ℹ️ Entrées produits pour la recette</div><div style="font-size:var(--font-size-xs);color:var(--text-muted)">Nouvelles entrées en dev, non disponibles en production. Créez-les ici pour la recette.</div></div>
    ${filtered.length?`<div class="item-list">${items}</div>`:empty}</div>`;
}

function openPRModal(id){
  const ex=id?getPR().find(p=>p.id===id):null, isE=!!ex;
  showModal(`<div class="modal-header"><h2 class="modal-title">${isE?'Modifier':'Nouveau'} produit</h2><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
    <div class="form-group"><label class="form-label">Nom</label><input type="text" class="form-input" id="prName" value="${esc(ex?.name||'')}" placeholder="Menu Business Long-Courrier"/></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Type</label><select class="form-select" id="prType">${PRODUCT_TYPES.map(t=>`<option ${ex?.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Phase</label><select class="form-select" id="prPhase">${PRODUCT_PHASES.map(p=>`<option value="${p.id}" ${ex?.phase===p.id?'selected':''}>${p.label}</option>`).join('')}</select></div></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="prDesc">${esc(ex?.description||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Données (JSON)</label><textarea class="form-textarea" id="prData" style="font-family:monospace;font-size:var(--font-size-xs)">${esc(ex?.data||'')}</textarea></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="prSaveBtn">${isE?'Mettre à jour':'Créer'}</button></div>`);
  document.getElementById('prSaveBtn').onclick=()=>{const n=document.getElementById('prName').value.trim();if(!n){showToast('Nom requis','error');return}
    savePR({...(ex||{}),name:n,type:document.getElementById('prType').value,phase:document.getElementById('prPhase').value,
      description:document.getElementById('prDesc').value.trim(),data:document.getElementById('prData').value.trim()});
    closeModal();showToast(isE?'Mis à jour':'Créé','success');nav('products')};
}

function promotePR(id){const p=getPR().find(x=>x.id===id);if(!p)return;
  const next=p.phase==='dev'?'recette':'prod';savePR({...p,phase:next});
  showToast(`${p.name} → ${PRODUCT_PHASES.find(x=>x.id===next).label}`,'success');nav('products');}

// ---------- PAGE: EXPORT ----------
function renderExport(){
  const tc=getTC().length,fl=getFL().length,pr=getPR().length,total=tc+fl+pr;
  return `<div class="slide-up">
    <div class="section"><div class="section-header"><h2 class="section-title">📤 Exporter</h2></div>
      <div class="card"><p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:var(--space-5)">Exportez tout en JSON pour partager ou sauvegarder.</p>
        <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-5)"><div class="badge badge-blue">${tc} cas de test</div><div class="badge badge-teal">${fl} vols</div><div class="badge badge-purple">${pr} produits</div><div class="badge badge-green">${total} total</div></div>
        <div style="display:flex;gap:var(--space-3);flex-wrap:wrap"><button class="btn btn-primary" id="dlBtn">↓ Télécharger JSON</button><button class="btn btn-secondary" id="cpBtn">Copier presse-papiers</button><button class="btn btn-secondary" id="pvBtn">Aperçu</button></div></div></div>
    <div class="section"><div class="section-header"><h2 class="section-title">📥 Importer</h2></div>
      <div class="card"><p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:var(--space-5)">Importez un fichier JSON précédemment exporté.</p>
        <label class="btn btn-primary" style="cursor:pointer">Choisir un fichier JSON<input type="file" accept=".json" id="impFile" style="display:none"/></label><span style="color:var(--text-muted);font-size:var(--font-size-xs);margin-left:var(--space-3)" id="impLabel"></span></div></div>
    <div class="section"><div class="section-header"><h2 class="section-title" style="color:var(--red-500)">⚠️ Zone danger</h2></div>
      <div class="card" style="border-color:rgba(226,0,26,0.2)"><p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:var(--space-4)">Supprimer toutes les données. Irréversible.</p>
        <button class="btn btn-danger" id="clearBtn">Tout supprimer</button></div></div></div>`;
}

function initExportEvents(){
  const exp=()=>({version:'1.0',exportedAt:new Date().toISOString(),source:'CFM Sandbox',data:{testCases:getTC(),flights:getFL(),products:getPR(),activity:load(SK.AC)}});
  document.getElementById('dlBtn')?.addEventListener('click',()=>{const b=new Blob([JSON.stringify(exp(),null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`cfm-sandbox-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(u);showToast('Téléchargé','success')});
  document.getElementById('cpBtn')?.addEventListener('click',()=>{navigator.clipboard.writeText(JSON.stringify(exp(),null,2)).then(()=>showToast('Copié','success'))});
  document.getElementById('pvBtn')?.addEventListener('click',()=>{const j=JSON.stringify(exp(),null,2);showModal(`<div class="modal-header"><h2 class="modal-title">Aperçu JSON</h2><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div class="code-preview">${esc(j)}</div><div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Fermer</button></div>`)});
  document.getElementById('impFile')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;document.getElementById('impLabel').textContent=f.name;
    const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.data){if(d.data.testCases)save(SK.TC,d.data.testCases);if(d.data.flights)save(SK.FL,d.data.flights);if(d.data.products)save(SK.PR,d.data.products);if(d.data.activity)save(SK.AC,d.data.activity);showToast('Importé','success');nav('export')}else showToast('Format invalide','error')}catch{showToast('Erreur de parsing','error')}};r.readAsText(f)});
  document.getElementById('clearBtn')?.addEventListener('click',()=>{if(confirm('Tout supprimer ?')){Object.values(SK).forEach(k=>localStorage.removeItem(k));showToast('Supprimé','success');nav('dashboard')}});
}

// ---------- PAGE: GUIDE ----------
function renderGuide(){
  return `<div class="page-enter">
    <div class="guide-hero">
      <div class="guide-hero-tag">✦ CFM Sandbox</div>
      <h2>Comment utiliser<br>le Sandbox</h2>
      <p>Tout ce qu'il faut savoir pour générer, gérer et partager vos jeux de données de test CFM/Cabinpad.</p>
    </div>

    <div class="guide-grid">
      <div class="guide-card" style="--card-accent:rgba(41,151,255,0.08)">
        <div class="guide-card-num">01</div>
        <div class="guide-card-title">Dashboard</div>
        <div class="guide-card-text">Vue d'ensemble de votre environnement sandbox. Retrouvez vos statistiques, l'activité récente et les actions rapides pour démarrer immédiatement.</div>
        <a class="guide-card-link" onclick="nav('dashboard')">Ouvrir le Dashboard →</a>
      </div>
      <div class="guide-card" style="--card-accent:rgba(48,209,88,0.08)">
        <div class="guide-card-num">02</div>
        <div class="guide-card-title">Cas de Test</div>
        <div class="guide-card-text">Créez et organisez vos scénarios de test par catégorie (CFM, Cabinpad, Produit, Intégration) et suivez leur statut de brouillon à réussite.</div>
        <a class="guide-card-link" onclick="nav('testcases')">Gérer les Tests →</a>
      </div>
      <div class="guide-card" style="--card-accent:rgba(255,159,10,0.08)">
        <div class="guide-card-num">03</div>
        <div class="guide-card-title">Données de Vol</div>
        <div class="guide-card-text">Générez des données de vol réalistes au format CabinPad avec timestamps epoch, <code style=\"color:var(--amber-500)\">outboundFlightLastKnownDate</code>, Gates, Terminaux, PPT.</div>
        <a class="guide-card-link" onclick="nav('flights')">Générer des Vols →</a>
      </div>
      <div class="guide-card" style="--card-accent:rgba(191,90,242,0.08)">
        <div class="guide-card-num">04</div>
        <div class="guide-card-title">Produits</div>
        <div class="guide-card-text">Gérez les entrées produit (repas, kits, etc.) avec le workflow de phase : Développement → Recette → Production pour préparer la recette.</div>
        <a class="guide-card-link" onclick="nav('products')">Voir les Produits →</a>
      </div>
    </div>

    <div class="guide-section">
      <div class="guide-section-title">Générer des données de vol</div>
      <div class="guide-steps">
        <div class="guide-step"><div class="guide-step-num">1</div><div class="guide-step-body"><h4>Ouvrir la page Données de Vol</h4><p>Cliquez sur « Données de Vol » dans la barre latérale ou le menu du bas sur iPad.</p></div></div>
        <div class="guide-step"><div class="guide-step-num">2</div><div class="guide-step-body"><h4>Utiliser la génération rapide</h4><p>Saisissez le nombre de vols souhaité (1–50), cochez « Forcer modification date » si vous voulez que tous les vols aient une date modifiée, puis cliquez ⚡ Générer.</p></div></div>
        <div class="guide-step"><div class="guide-step-num">3</div><div class="guide-step-body"><h4>Consulter le JSON CabinPad</h4><p>Cliquez 📄 sur un vol pour voir le JSON au format CabinPad <code>{ data: [...] }</code>. Cliquez 📥 pour voir le format source <code>outBound</code>. Utilisez le bouton <strong>{ } CabinPad JSON</strong> pour exporter tous les vols d'un coup.</p></div></div>
        <div class="guide-step"><div class="guide-step-num">4</div><div class="guide-step-body"><h4>Ajout manuel</h4><p>Pour un vol spécifique, cliquez « + Ajout manuel » et renseignez les champs CabinPad (Origin, Destination, ScheduledDate, Gate, Terminal, PPT, etc.).</p></div></div>
      </div>
    </div>

    <div class="guide-section">
      <div class="guide-section-title">Exporter et partager</div>
      <div class="guide-steps">
        <div class="guide-step"><div class="guide-step-num">1</div><div class="guide-step-body"><h4>Exporter en JSON</h4><p>Page Export → « Télécharger JSON » pour sauvegarder tout (cas de test + vols + produits) dans un fichier <code>.json</code>.</p></div></div>
        <div class="guide-step"><div class="guide-step-num">2</div><div class="guide-step-body"><h4>Partager avec l'équipe</h4><p>Envoyez le fichier JSON par email, Teams ou Slack. Le destinataire l'importe via Export → Importer.</p></div></div>
        <div class="guide-step"><div class="guide-step-num">3</div><div class="guide-step-body"><h4>Copier dans le presse-papiers</h4><p>Sur la page Export ou dans les modales JSON, utilisez « Copier » pour coller directement le JSON dans un outil ou un message.</p></div></div>
      </div>
    </div>

    <div class="guide-section">
      <div class="guide-section-title">Questions fréquentes</div>
      <div class="guide-faq">
        <div class="guide-faq-item"><button class="guide-faq-q" onclick="toggleFaq(this)">Comment simuler une modification de date de vol (modifyDate) ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div class="guide-faq-a">Lors de la génération batch, cochez « Forcer modification date ». Chaque vol aura alors un <code>outboundFlightLastKnownDate</code> différent de son <code>outboundFlightScheduledDate</code>, simulant une modification. En ajout manuel, renseignez le champ « LastKnownDate (modif) » avec une date différente du départ programmé.</div></div>
        <div class="guide-faq-item"><button class="guide-faq-q" onclick="toggleFaq(this)">Quel format JSON CabinPad est généré ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div class="guide-faq-a">Le format est <code>{ "data": [ { "actionsTaken": [...], "connectionFlowStatus": "...", "criticalityDctTime": N, "outboundFlightNumber": "AF...", "outboundFlightScheduledDate": epoch_ms, ... } ] }</code>. Les dates sont en timestamps epoch millisecondes, conformes au format de production CabinPad.</div></div>
        <div class="guide-faq-item"><button class="guide-faq-q" onclick="toggleFaq(this)">Où sont stockées les données ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div class="guide-faq-a">Tout est stocké dans le <code>localStorage</code> de votre navigateur. Les données persistent entre les sessions mais sont locales à ce navigateur. Utilisez l'export JSON pour sauvegarder ou partager vos données.</div></div>
        <div class="guide-faq-item"><button class="guide-faq-q" onclick="toggleFaq(this)">Comment utiliser sur iPad ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div class="guide-faq-a">Ouvrez le fichier <code>index.html</code> dans Safari. Le site est entièrement responsive — la navigation bascule sur une barre en bas de l'écran, adaptée au tactile. Sur Safari, vous pouvez aussi « Ajouter à l'écran d'accueil » pour un accès rapide.</div></div>
        <div class="guide-faq-item"><button class="guide-faq-q" onclick="toggleFaq(this)">Quelle est la différence entre CabinPad JSON et Source JSON ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div class="guide-faq-a"><strong>CabinPad JSON</strong> (📄) est le format de sortie envoyé à l'application Cabinpad avec les champs <code>outboundFlight*</code>. <strong>Source JSON</strong> (📥) est le format d'entrée brut avec la structure <code>{ outBound: { flightNumber, departureDate, arrivalStation... } }</code>, tel qu'il arrive avant le mapping.</div></div>
        <div class="guide-faq-item"><button class="guide-faq-q" onclick="toggleFaq(this)">Comment gérer le cycle de vie des produits ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button><div class="guide-faq-a">Créez un produit en phase « Développement ». Quand il est prêt pour les tests, cliquez ↑ pour le promouvoir en « Recette ». Après validation, promouvez en « Production ». Filtrez par phase avec les onglets en haut de la page.</div></div>
      </div>
    </div>
  </div>`;
}

function toggleFaq(el){
  el.classList.toggle('open');
  const a=el.nextElementSibling;
  a.classList.toggle('open');
}


// ---------- PAGE: TRANSFORMER ----------
var tr_DEFAULT_FLIGHT_TEMPLATE = {
  actionsTaken: [],
  connectionFlowStatus: "TO_MAINTAIN",
  criticalityDctTime: 101,
  gateNumberOutboundDeparture: "F50",
  outboundFlightDestination: "LYS",
  outboundFlightLastKnownDate: 1773666300000,
  outboundFlightNumber: "AF7364",
  outboundFlightOrigin: "CDG",
  outboundFlightScheduledDate: 1773666000000,
  ppt: 62,
  shortConnectionPassEligibility: false,
  terminalOutboundDepartureInfo: "2F2",
  transferTo: []
};
var tr_DEFAULT_PAX_TEMPLATE = {
  actionsTaken: [],
  connectionFlowStatus: "TO_MAINTAIN",
  criticalityDctTime: 273,
  gateNumberOutboundDeparture: "F29",
  isEES: false,
  isPARAFE: false,
  originalTransferFrom: "AF7522/24",
  outboundFlightDestination: "BES",
  outboundFlightLastKnownDate: 1774388100000,
  outboundFlightNumber: "AF7524",
  outboundFlightOrigin: "CDG",
  outboundFlightScheduledDate: 1774388100000,
  ppt: 24,
  shortConnectionPassEligibility: false,
  terminalOutboundDepartureInfo: "2F1",
  transferTo: []
};
var tr_TARGET_FIELDS = Array.from(new Set([...Object.keys(tr_DEFAULT_FLIGHT_TEMPLATE), ...Object.keys(tr_DEFAULT_PAX_TEMPLATE)]));
var tr_GROUP_KEY_PATHS = [
  "outBound.flightNumber",
  "outBound.departureDate",
  "outBound.arrivalDate",
  "outBound.arrivalStation",
  "outBound.departureStation"
];
var tr_state = {
  mode: 'flight', // 'flight' or 'pax'
  jiraTicket: '',
  sourceJson: null,
  mappings: [
    { id: 1, src: "outBound.departureDate",  tgt: "outboundFlightScheduledDate" },
    { id: 2, src: "outBound.arrivalStation", tgt: "outboundFlightDestination" },
    { id: 3, src: "outBound.flightNumber",   tgt: "outboundFlightNumber" }
  ],
  nextId: 4,
  showKeys: false
};
function tr_getVal(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce(function(a, k) { return a != null ? a[k] : undefined; }, obj);
}
function tr_resolveItems(json, rootPath) {
  var rp = (rootPath || "").trim();
  if (rp) {
    var v = tr_getVal(json, rp);
    if (Array.isArray(v)) return v;
    if (v !== undefined) return [v];
    return null;
  }
  if (Array.isArray(json)) return json;
  var keys = Object.keys(json);
  for (var i = 0; i < keys.length; i++) {
    if (Array.isArray(json[keys[i]]) && json[keys[i]].length > 0) return json[keys[i]];
  }
  return [json];
}
function tr_buildOutput(items, mappings) {
  var active = mappings.filter(function(m) { return m.src && m.tgt; });
  var template = tr_state.mode === 'pax' ? tr_DEFAULT_PAX_TEMPLATE : tr_DEFAULT_FLIGHT_TEMPLATE;

  if (tr_state.mode === 'flight') {
    var groups = {};
    var order = [];
    items.forEach(function(item) {
      var keyParts = tr_GROUP_KEY_PATHS.map(function(p) {
        var v = tr_getVal(item, p);
        return v !== undefined ? String(v) : "__undefined__";
      });
      var key = keyParts.join("|||");
      var hasOutBound = tr_GROUP_KEY_PATHS.some(function(p) { return tr_getVal(item, p) !== undefined; });
      if (!hasOutBound) return;
      if (!groups[key]) {
        var result = JSON.parse(JSON.stringify(template));
        active.forEach(function(m) {
          var v = tr_getVal(item, m.src);
          if (v !== undefined) result[m.tgt] = v;
        });
        groups[key] = result;
        order.push(key);
      }
    });
    return order.map(function(k) { return groups[k]; });
  } else {
    // Passenger mode: one entry per item
    return items.map(function(item) {
      var result = JSON.parse(JSON.stringify(template));
      active.forEach(function(m) {
        var v = tr_getVal(item, m.src);
        if (v !== undefined) result[m.tgt] = v;
      });
      return result;
    });
  }
}
function tr_getAvailableKeys(items) {
  var keys = {};
  items.slice(0, 5).forEach(function(item) {
    if (typeof item !== "object" || !item) return;
    Object.keys(item).forEach(function(k) {
      keys[k] = 1;
      if (typeof item[k] === "object" && item[k] !== null && !Array.isArray(item[k])) {
        Object.keys(item[k]).forEach(function(k2) { keys[k + "." + k2] = 1; });
      }
    });
  });
  return Object.keys(keys).sort();
}
function tr_esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

window.copyKey = function(k) { if (navigator.clipboard) navigator.clipboard.writeText(k).then(()=>showToast('Copié','info')); };

function tr_renderUI() {
  var rootPath = document.getElementById("rootPath")?.value || "";
  var items = tr_state.sourceJson ? tr_resolveItems(tr_state.sourceJson, rootPath) : null;
  var outputArr = items ? tr_buildOutput(items, tr_state.mappings) : null;
  var output = outputArr ? (tr_state.mode === 'pax' ? { data: outputArr, header: { responseCode: "OK", jiraTicket: tr_state.jiraTicket || undefined } } : { data: outputArr, jiraTicket: tr_state.jiraTicket || undefined }) : null;
  tr_state._output = output;

  var totalPax  = items ? items.length : 0;
  var totalVols = outputArr ? outputArr.length : 0;
  var ignored   = items ? items.filter(function(i) {
    return tr_GROUP_KEY_PATHS.every(function(p) { return tr_getVal(i, p) === undefined; });
  }).length : 0;

  var statsEl = document.getElementById("stats");
  if(statsEl) {
    statsEl.innerHTML = "";
    if (items) {
        statsEl.innerHTML += `<span class="badge badge-blue">${totalPax} pax</span>`;
        if (totalVols > 0) statsEl.innerHTML += `<span class="badge badge-green">${totalVols} vols</span>`;
        if (ignored > 0)   statsEl.innerHTML += `<span class="badge badge-amber">${ignored} ignorés</span>`;
    }
  }

  function setBtn(id, enabled) {
    var b = document.getElementById(id);
    if(b) b.disabled = !enabled;
  }
  setBtn("btnNext",     !!tr_state.sourceJson && !!items);
  setBtn("btnOutput",   !!output);
  setBtn("btnDownload", !!output);

  var gs = document.getElementById("groupStats");
  if (items && gs) {
    gs.innerHTML = tr_GROUP_KEY_PATHS.map(function(p) {
      var vals = items.map(function(i) { return tr_getVal(i, p); });
      var defined = vals.filter(function(v) { return v !== undefined; }).length;
      var uniq = {};
      vals.filter(function(v) { return v !== undefined; }).forEach(function(v) { uniq[String(v)] = 1; });
      var uniqueCount = Object.keys(uniq).length;
      var col = defined > 0 ? "var(--green-500)" : "var(--red-500)";
      return `<div style="display:flex;gap:var(--space-3);align-items:center;font-size:13px;border-bottom:1px solid var(--border-primary);padding-bottom:var(--space-2);margin-bottom:var(--space-2)">
        <span style="font-family:var(--mono);color:var(--blue-500);flex:1">${tr_esc(p)}</span>
        <span style="font-family:var(--mono);color:${col}">${defined}/${items.length} pax</span>
        <span style="font-family:var(--mono);color:var(--amber-500)">${uniqueCount} val. uniques</span>
        </div>`;
    }).join("");
  } else if(gs) {
    gs.innerHTML = '<span style="color:var(--text-muted);font-size:13px">Charger un fichier source pour voir les stats</span>';
  }

  var availKeys = items ? tr_getAvailableKeys(items) : [];
  var btnSK = document.getElementById("btnShowKeys");
  if(btnSK) btnSK.style.display = availKeys.length > 0 ? "inline-block" : "none";
  
  var kBadges = document.getElementById("keysBadges");
  if(kBadges) {
      kBadges.innerHTML = availKeys.map(function(k) {
        return `<span onclick="copyKey('${tr_esc(k)}')" class="badge badge-blue" style="cursor:pointer;font-family:var(--mono)" title="Cliquer pour copier">${tr_esc(k)}</span>`;
      }).join("");
  }

  var mc = document.getElementById("mappingCount");
  if(mc) mc.textContent = tr_state.mappings.length + " mapping" + (tr_state.mappings.length > 1 ? "s" : "");
  
  var list = document.getElementById("mappingList");
  if (list) {
      if (tr_state.mappings.length === 0) {
        list.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:var(--space-6)">Aucun mapping</td></tr>';
      } else {
        list.innerHTML = tr_state.mappings.map(function(m) {
          var val = items ? tr_getVal(items[0], m.src) : undefined;
          var found = val !== undefined;
          var countWith = items ? items.filter(function(i) { return tr_getVal(i, m.src) !== undefined; }).length : 0;
          var opts = '<option value="">-- cible --</option>' + tr_TARGET_FIELDS.map(function(f) {
            return `<option value="${tr_esc(f)}" ${f === m.tgt ? "selected" : ""}>${tr_esc(f)}</option>`;
          }).join("");
          
          let previewColor = found ? 'var(--green-500)' : 'var(--red-500)';
          let previewHtml = '';
          if (items && m.src) {
              previewHtml = `<div style="margin-top:var(--space-2);font-family:var(--mono);font-size:11px;color:${previewColor}">
                ${found ? 'ex: '+tr_esc(JSON.stringify(val)) : 'chemin introuvable'} 
                ${found ? `<span style="color:var(--text-tertiary);margin-left:var(--space-3)">${countWith}/${items.length} pax</span>` : ''}
              </div>`;
          }

          return `<tr>
             <td><input type="text" class="form-input" value="${tr_esc(m.src)}" data-id="${m.id}" data-field="src" placeholder="Chemin source"/>${previewHtml}</td>
             <td style="vertical-align:top"><select class="form-select" data-id="${m.id}" data-field="tgt">${opts}</select></td>
             <td style="vertical-align:top;width:40px"><button class="btn btn-danger btn-icon" data-del="${m.id}" title="Supprimer">✕</button></td>
          </tr>`;
        }).join("");
      }
  }

  var os = document.getElementById("outputStats");
  if(os) {
      os.innerHTML = output
        ? `<span style="color:var(--green-500);font-weight:600">${totalVols} vols</span> extraits de <span style="color:var(--blue-500)">${totalPax} pax</span>`
        : "";
  }

  var prev = document.getElementById("outputPreview");
  if (prev) {
      if (output) {
        var highlighted = tr_state.mappings.map(function(m) { return m.tgt; }).filter(Boolean);
        var lines = JSON.stringify(output, null, 2).split("\n");
        prev.innerHTML = lines.map(function(line) {
          var hi = highlighted.some(function(h) { return line.indexOf('"' + h + '"') !== -1; });
          return `<div style="white-space:pre;${hi ? 'color:var(--amber-500);font-weight:600' : 'color:var(--text-primary)'}">${tr_esc(line)}</div>`;
        }).join("");
      } else {
        prev.innerHTML = '<div style="text-align:center;color:var(--text-tertiary);padding:var(--space-10)">Charger un fichier source dans l\'onglet Source</div>';
      }
  }
}

function initTransformerEvents() {
  var wrapper = document.getElementById('transformerApp');
  if(!wrapper) return;

  function setTab(tabName) {
    document.querySelectorAll("#trTabs .pill").forEach(b => b.classList.remove("active"));
    wrapper.querySelectorAll(".tab-content").forEach(t => { t.style.display = "none"; t.classList.remove("active"); });
    var btn = document.querySelector('#trTabs .pill[data-tab="'+tabName+'"]');
    if(btn) btn.classList.add("active");
    var tc = document.getElementById("tab-" + tabName);
    if(tc) { tc.style.display = "flex"; tc.classList.add("active"); }
  }

  document.querySelectorAll("#trTabs .pill").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  var fileInput = document.getElementById("fileInput");
  var dropzone  = document.getElementById("dropzone");
  if(dropzone) {
      dropzone.addEventListener("click", () => fileInput.click());
      dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
      dropzone.addEventListener("drop", e => { e.preventDefault(); dropzone.classList.remove("dragover"); loadFile(e.dataTransfer.files[0]); });
  }
  if(fileInput) fileInput.addEventListener("change", e => loadFile(e.target.files[0]));

  function loadFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        tr_state.sourceJson = JSON.parse(e.target.result);
        document.getElementById("sourceText").value = e.target.result;
        document.getElementById("parseError").style.display = "none";
        tr_renderUI();
        setTab("mapping");
      } catch(err) {
        document.getElementById("parseError").textContent = "JSON invalide";
        document.getElementById("parseError").style.display = "block";
        tr_state.sourceJson = null;
        tr_renderUI();
      }
    };
    reader.readAsText(file);
  }

  var srcText = document.getElementById("sourceText");
  if(srcText) srcText.addEventListener("input", function(e) {
    try { tr_state.sourceJson = JSON.parse(e.target.value); document.getElementById("parseError").style.display="none"; }
    catch(err) { tr_state.sourceJson = null; }
    tr_renderUI();
  });

  var rPath = document.getElementById("rootPath");
  if(rPath) rPath.addEventListener("input", tr_renderUI);

  var trJira = document.getElementById("trJira");
  if(trJira) trJira.addEventListener("input", function(e) {
    tr_state.jiraTicket = e.target.value.trim();
    tr_renderUI();
  });

  var btnN = document.getElementById("btnNext");
  if(btnN) btnN.addEventListener("click", () => setTab("mapping"));
  
  var btnO = document.getElementById("btnOutput");
  if(btnO) btnO.addEventListener("click", () => setTab("output"));

  var bsk = document.getElementById("btnShowKeys");
  if(bsk) bsk.addEventListener("click", function() {
    tr_state.showKeys = !tr_state.showKeys;
    document.getElementById("keysPanel").style.display = tr_state.showKeys ? "block" : "none";
    this.textContent = tr_state.showKeys ? "Masquer clés" : "Voir clés source";
  });

  var bam = document.getElementById("btnAddMapping");
  if(bam) bam.addEventListener("click", function() {
    tr_state.mappings.push({ id: tr_state.nextId++, src: "", tgt: "" });
    tr_renderUI();
  });

  var ml = document.getElementById("mappingList");
  if(ml) {
      ml.addEventListener("input", function(e) {
        var id = parseInt(e.target.dataset.id);
        var field = e.target.dataset.field;
        if (!id || !field) return;
        var m = tr_state.mappings.filter(x => x.id === id)[0];
        if (m) { m[field] = e.target.value; tr_renderUI(); }
      });
      ml.addEventListener("click", function(e) {
        if(e.target.tagName !== 'BUTTON') return;
        var delId = parseInt(e.target.dataset.del);
        if (delId) {
          tr_state.mappings = tr_state.mappings.filter(m => m.id !== delId);
          tr_renderUI();
        }
      });
  }

  var bd = document.getElementById("btnDownload");
  if(bd) bd.addEventListener("click", function() {
    if (!tr_state._output) return;
    var json = JSON.stringify(tr_state._output, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href = url; a.download = "output.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Téléchargé", "success");
  });

  var mf = document.getElementById("modeFlight");
  var mp = document.getElementById("modePax");
  if(mf && mp) {
      mf.onclick = () => { tr_state.mode = 'flight'; nav('transformer'); };
      mp.onclick = () => { tr_state.mode = 'pax'; nav('transformer'); };
  }

  window.tr_loadPreset = function(city) {
    var data = [];
    if(city === 'NCE') {
      data = [
        { outBound: { flightNumber: "AF7708", pnr: "QH2QKC", destination: "NCE", transferTo: ["AF7708"] } },
        { outBound: { flightNumber: "AF7524", pnr: "NYTDU6", destination: "NCE", transferTo: [] } },
        { outBound: { flightNumber: "AF7708", pnr: "OJE4LI", destination: "NCE", transferTo: ["AF7708"] } }
      ];
    } else {
      data = [
        { outBound: { flightNumber: "AF7524", pnr: "MYS8AD", destination: "TLS", isEES: true, isPARAFE: true, shortConnectionPassEligibility: true } },
        { outBound: { flightNumber: "AF7524", pnr: "MY2KTN", destination: "TLS", meetAndConnect: true } },
        { outBound: { flightNumber: "AF7524", pnr: "ORP48A", destination: "TLS" } }
      ];
    }
    var json = JSON.stringify({ data: { passengers: data } }, null, 2);
    tr_state.sourceJson = JSON.parse(json);
    var st = document.getElementById("sourceText");
    if(st) st.value = json;
    tr_renderUI();
  };

  tr_renderUI();
}

function renderTransformer() {
  return `<div class="slide-up">
  <div class="section-header" style="justify-content:space-between">
    <div class="pill-filters" id="trTabs">
        <button class="pill active" data-tab="source">1. Source</button>
        <button class="pill" data-tab="mapping">2. Mapping</button>
        <button class="pill" data-tab="output">3. Sortie JSON</button>
    </div>
    <div style="display:flex;background:var(--bg-secondary);padding:var(--space-1);border-radius:var(--radius-lg);border:1px solid var(--border-primary)">
      <button id="modeFlight" class="btn btn-sm ${tr_state.mode === 'flight' ? 'btn-primary' : 'btn-ghost'}" style="padding:var(--space-1) var(--space-4);font-size:12px;font-weight:600">ByFlight</button>
      <button id="modePax" class="btn btn-sm ${tr_state.mode === 'pax' ? 'btn-primary' : 'btn-ghost'}" style="padding:var(--space-1) var(--space-4);font-size:12px;font-weight:600">ByPax</button>
    </div>
  </div>
  <div id="transformerApp">
    <!-- Tab 1: Source -->
    <div id="tab-source" class="tab-content active" style="display:flex;flex-direction:column;gap:var(--space-5)">
      <div id="paxPresets" style="display:${tr_state.mode === 'pax' ? 'flex' : 'none'};gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap;align-items:center">
         <span style="font-size:12px;color:var(--text-muted);font-weight:600">Charger exemple :</span>
         <button class="btn btn-secondary btn-sm" onclick="tr_loadPreset('NCE')">NCE (3 pax)</button>
         <button class="btn btn-secondary btn-sm" onclick="tr_loadPreset('TLS')">TLS (3 pax)</button>
      </div>
      <div id="stats" style="display:flex;gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap"></div>
      <div class="card dropzone" id="dropzone">
        <div style="font-size:32px;color:var(--text-tertiary);margin-bottom:var(--space-2)">⇧</div>
        <div style="font-size:15px;color:var(--text-primary);font-weight:600">Glisser un <span style="color:var(--blue-500)">.json</span> ou parcourir</div>
        <input id="fileInput" type="file" accept=".json" style="display:none"/>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label class="form-label">Chemin racine (vide = auto)</label>
          <input id="rootPath" type="text" class="form-input" placeholder="ex: data.passengers" value="data.passengers"/>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Ticket Jira</label>
          <input id="trJira" type="text" class="form-input" placeholder="ex: CFM-010" value="${tr_state.jiraTicket||''}"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Ou coller le JSON source</label>
        <textarea id="sourceText" class="form-textarea" placeholder='{"data":{"passengers":[...]}}' style="font-family:var(--mono);font-size:12px;height:200px"></textarea>
         <div id="parseError" style="color:var(--red-500);font-size:12px;display:none;margin-top:var(--space-2);font-weight:500"></div>
      </div>
      <button id="btnNext" class="btn btn-primary" style="align-self:flex-end" disabled>Suivant →</button>
    </div>

    <!-- Tab 2: Mapping -->
    <div id="tab-mapping" class="tab-content" style="display:none;flex-direction:column;gap:var(--space-5)">
      <div class="card" style="padding:var(--space-4)">
        <div style="font-size:13px;color:var(--text-secondary);font-weight:600;margin-bottom:var(--space-3);text-transform:uppercase;letter-spacing:0.05em">Statistiques de Groupement</div>
        <div id="groupStats" style="display:flex;flex-direction:column;gap:var(--space-2)">Charger un fichier source...</div>
      </div>
      <div class="section-header" style="margin-bottom:0">
         <h3 style="font-size:17px;font-weight:600" id="mappingCount">3 mappings</h3>
         <div style="display:flex;gap:var(--space-2)">
           <button id="btnShowKeys" class="btn btn-secondary btn-sm" style="display:none">Voir clés source</button>
           <button id="btnAddMapping" class="btn btn-primary btn-sm">+ Ajouter Mapping</button>
         </div>
      </div>
      <div id="keysPanel" class="card" style="display:none;padding:var(--space-4)"><div id="keysBadges" style="display:flex;flex-wrap:wrap;gap:var(--space-2)"></div></div>
      <div class="card" style="padding:0;overflow:hidden">
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead><tr><th>Chemin source</th><th>Champ cible</th><th style="width:50px"></th></tr></thead>
            <tbody id="mappingList"></tbody>
          </table>
        </div>
      </div>
      <button id="btnOutput" class="btn btn-primary" style="align-self:flex-end" disabled>Générer Sortie →</button>
    </div>

    <!-- Tab 3: Output -->
    <div id="tab-output" class="tab-content" style="display:none;flex-direction:column;gap:var(--space-5)">
       <div style="display:flex;gap:var(--space-3);justify-content:space-between;align-items:center;flex-wrap:wrap">
          <div id="outputStats" style="font-size:14px;color:var(--text-primary)"></div>
          <button id="btnDownload" class="btn btn-primary" disabled>↓ Télécharger output.json</button>
       </div>
       <div id="outputPreview" class="code-preview" style="height:500px">
          Charger un fichier source...
       </div>
    </div>
  </div>
</div>`;
}
// ---------- PAGE: FORMATION ----------
function renderFormation() {
  return `<div class="slide-up">
    <div class="section-header">
      <h2 class="section-title">Environnement Formation CFM</h2>
      <p style="color:var(--text-secondary);font-size:14px;margin-top:var(--space-2)">Générateurs de jeux de données et modules d'aide au briefing.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--space-5);margin-bottom:var(--space-6)">
      
      <!-- Module 1: Gilets -->
      <div class="card" style="display:flex;flex-direction:column;gap:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="background:rgba(239,68,68,0.1);color:var(--red-500);padding:var(--space-2);border-radius:var(--radius-md)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <h3 style="font-weight:600;font-size:16px">Gilets de Sauvetage</h3>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);flex:1">Génère les vols ORY-BIQ et CDG-BEY avec les annonces gilets configurées.</p>
        <button id="btnFormGilets" class="btn btn-primary" style="width:100%">Générer JSON</button>
      </div>

      <!-- Module 2: ByFlight 009 -->
      <div class="card" style="display:flex;flex-direction:column;gap:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="background:rgba(0,113,227,0.1);color:var(--blue-500);padding:var(--space-2);border-radius:var(--radius-md)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg></div>
          <h3 style="font-weight:600;font-size:16px">ByFlight CFM-009</h3>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);flex:1">Génère les vols BLQ, BUD, DSS, LYS, ainsi que NCE et TLS en mode scénarisé.</p>
        <button id="btnFormByFlight" class="btn btn-primary" style="width:100%">Générer JSON</button>
      </div>

      <!-- Module 3: ByPax NCE & TLS -->
      <div class="card" style="display:flex;flex-direction:column;gap:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="background:rgba(16,185,129,0.1);color:var(--green-500);padding:var(--space-2);border-radius:var(--radius-md)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          <h3 style="font-weight:600;font-size:16px">ByPax CFM-010</h3>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);flex:1">Format ByPax (CFM-010) avec PNR NCE & TLS, Short Connection Pass, EES et PARAFE.</p>
        <button id="btnFormByPax" class="btn btn-primary" style="width:100%">Générer JSON</button>
      </div>

      <!-- Module 4: Briefing Pilotes -->
      <div class="card" style="display:flex;flex-direction:column;gap:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="background:rgba(245,158,11,0.1);color:var(--amber-500);padding:var(--space-2);border-radius:var(--radius-md)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
          <h3 style="font-weight:600;font-size:16px">Briefing Pilotes</h3>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);flex:1">Outil d'aide au briefing: données équipages pilotes AF et HOP simulées.</p>
        <button id="btnFormBriefing" class="btn btn-primary" style="width:100%">Générer JSON</button>
      </div>

    </div>
    
    <div class="card" style="display:flex;flex-direction:column;gap:var(--space-3);padding:0;overflow:hidden">
       <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-4);border-bottom:1px solid var(--border-primary)">
          <h3 style="font-weight:600;font-size:16px">Résultat JSON</h3>
          <button id="btnFormDownload" class="btn btn-secondary btn-sm" disabled>↓ Télécharger</button>
       </div>
       <div id="formPreview" class="code-preview" style="height:400px;border-radius:0;margin:0">
          <div style="text-align:center;color:var(--text-tertiary);padding:var(--space-10)">Cliquez sur un générateur ci-dessus...</div>
       </div>
    </div>
  </div>`;
}

function initFormationEvents() {
  function showOutput(obj, filename) {
     const str = JSON.stringify(obj, null, 2);
     document.getElementById('formPreview').innerHTML = `<div style="white-space:pre;color:var(--text-primary)">${esc(str)}</div>`;
     const btn = document.getElementById('btnFormDownload');
     btn.disabled = false;
     btn.onclick = () => {
        const blob = new Blob([str], { type: "application/json" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Fichier téléchargé", "success");
     };
  }

  const btnGilets = document.getElementById('btnFormGilets');
  if(btnGilets) btnGilets.addEventListener('click', () => {
     const t1 = Object.assign(genFlight(), { outboundFlightNumber: "AF7400", outboundFlightOrigin: "ORY", outboundFlightDestination: "BIQ", lifeJacketCaptainDecisionAnnouncement: false, lifeJacketMandatoryAnnouncement: true });
     const t2 = Object.assign(genFlight(), { outboundFlightNumber: "AF287", outboundFlightOrigin: "CDG", outboundFlightDestination: "BEY", lifeJacketCaptainDecisionAnnouncement: false, lifeJacketMandatoryAnnouncement: true });
     showOutput({ data: [t1, t2] }, "Lifejackets-Formation.json");
  });

  const btnFlight = document.getElementById('btnFormByFlight');
  if(btnFlight) btnFlight.addEventListener('click', () => {
     const dests = ["BLQ", "BUD", "DSS", "LYS"];
     const flights = dests.map(d => Object.assign(genFlight(), { outboundFlightDestination: d, connectionFlowStatus: "TO_MAINTAIN" }));
     
     flights.push(Object.assign(genFlight(), { outboundFlightDestination: "NCE", outboundFlightNumber: "AF7708", connectionFlowStatus: "MISSED" }));
     flights.push(Object.assign(genFlight(), { outboundFlightDestination: "TLS", outboundFlightNumber: "AF7524", connectionFlowStatus: "TO_REBOOK" }));
     
     showOutput({ data: flights }, "ByFlightCFM-Formation-009.json");
  });

  const btnPax = document.getElementById('btnFormByPax');
  if(btnPax) btnPax.addEventListener('click', () => {
     const base = {
        actionsTaken: [], connectionFlowStatus: "TO_MAINTAIN", criticalityDctTime: 273,
        gateNumberOutboundDeparture: "F29", isEES: false, isPARAFE: false, originalTransferFrom: "AF7522/24",
        outboundFlightLastKnownDate: 1774388100000, outboundFlightOrigin: "CDG", outboundFlightScheduledDate: 1774388100000,
        ppt: 24, shortConnectionPassEligibility: false, terminalOutboundDepartureInfo: "2F1", transferTo: []
     };
     
     const paxNCE = [
        { pnr: "QH2QKC", isEES: false, isPARAFE: false, transferTo: ["AF7708"], outboundFlightDestination: "NCE" },
        { pnr: "NYTDU6", isEES: false, isPARAFE: false, transferTo: [], outboundFlightDestination: "NCE" },
        { pnr: "OJE4LI", isEES: false, isPARAFE: false, transferTo: ["AF7708"], outboundFlightDestination: "NCE" }
     ];
     const paxTLS = [
        { pnr: "MYS8AD", isEES: true, isPARAFE: true, shortConnectionPassEligibility: true, transferTo: [], outboundFlightDestination: "TLS" },
        { pnr: "MY2KTN", meetAndConnect: true, isEES: false, isPARAFE: false, transferTo: [], outboundFlightDestination: "TLS" },
        { pnr: "ORP48A", isEES: false, isPARAFE: false, transferTo: [], outboundFlightDestination: "TLS" }
     ];
     
     const allPax = [...paxNCE, ...paxTLS].map(p => Object.assign({}, base, p));
     
     const payload = {
        data: allPax,
        header: { responseCode: "OK" }
     };
     showOutput(payload, "ByPax-Formation-NCE-TLS.json");
  });

  const btnBrief = document.getElementById('btnFormBriefing');
  if(btnBrief) btnBrief.addEventListener('click', () => {
     const crewAF = {
        flightNumber: "AF1234", aircraftType: "A320",
        crew: [ { role: "CAPTAIN", name: "DUPONT Jean", status: "OK" }, { role: "FO", name: "MARTIN Sophie", status: "OK", briefingNote: "Piste mouillée prévisionnelle" } ]
     };
     const crewHOP = {
        flightNumber: "A54321", aircraftType: "E190",
        crew: [ { role: "CAPTAIN", name: "LEROY Marc", status: "OK", briefingNote: "Restriction slot ATC" }, { role: "FO", name: "BERNARD Luc", status: "OK" } ]
     };
     showOutput({ flightsCrewData: [crewAF, crewHOP] }, "BriefingPilotes-Formation.json");
  });
}


// ---------- ROUTER ----------
function nav(page){
  currentPage=page;window.location.hash=page;
  document.getElementById('pageTitle').textContent=PAGE_TITLES[page]||'Dashboard';
  const c=document.getElementById('pageContent');
  switch(page){
    case 'testcases':c.innerHTML=renderTestCases();break;
    case 'flights':c.innerHTML=renderFlights();initFlightsEvents();break;
    case 'products':c.innerHTML=renderProducts();break;
    case 'formation':c.innerHTML=renderFormation();initFormationEvents();break;
    case 'transformer':c.innerHTML=renderTransformer();initTransformerEvents();break;
    case 'export':c.innerHTML=renderExport();initExportEvents();break;
    case 'guide':c.innerHTML=renderGuide();break;
    default:c.innerHTML=renderDashboard();break;
  }
  document.querySelectorAll('.nav-link,.mobile-nav-link').forEach(l=>l.classList.toggle('active',l.dataset.page===page));
  closeMobileNav();window.scrollTo({top:0,behavior:'smooth'});
}
// Make nav globally available
window.nav=nav;window.openTCModal=openTCModal;window.openFlightModal=openFlightModal;window.showCFMMsg=showCFMMsg;
window.showSourceMsg=showSourceMsg;window.showBatchCabinPad=showBatchCabinPad;window.toggleFaq=toggleFaq;
window.openPRModal=openPRModal;window.promotePR=promotePR;window.showToast=showToast;window.closeModal=closeModal;
window.delTC=delTC;window.delFL=delFL;window.delPR=delPR;window.getFL=getFL;

let isMobileNavOpen = false;
function toggleMobileNav() {
  isMobileNavOpen = !isMobileNavOpen;
  const nav = document.getElementById('mobileNav');
  const icon = document.querySelector('#menuToggle svg');
  if(isMobileNavOpen){
    nav.classList.add('open');
    if(icon) icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    document.body.style.overflow = 'hidden';
  } else {
    nav.classList.remove('open');
    if(icon) icon.innerHTML = '<line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>';
    document.body.style.overflow = '';
  }
}
function closeMobileNav() { if(isMobileNavOpen) toggleMobileNav(); }

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-link,.mobile-nav-link').forEach(l=>l.addEventListener('click',e=>{e.preventDefault();nav(l.dataset.page)}));
  document.getElementById('menuToggle')?.addEventListener('click',toggleMobileNav);
  document.getElementById('modalOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});
  const h=window.location.hash.replace('#','')||'dashboard';nav(PAGE_TITLES[h]?h:'dashboard');
});
