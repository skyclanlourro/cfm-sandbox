import re

with open('app.js', 'r') as f:
    js = f.read()

# 1. Update PAGE_TITLES
js = re.sub(
    r"const PAGE_TITLES = {dashboard:'Dashboard',testcases:'Cas de Test',flights:'Données de Vol',products:'Produits',transformer:'Transformer',export:'Export / Import',guide:'Guide'};",
    r"const PAGE_TITLES = {dashboard:'Dashboard',testcases:'Cas de Test',flights:'Données de Vol',products:'Produits',formation:'Formation CFM',transformer:'Transformer',export:'Export / Import',guide:'Guide'};",
    js
)

# 2. Update Router switch
js = re.sub(
    r"case 'transformer':c\.innerHTML=renderTransformer\(\);initTransformerEvents\(\);break;",
    r"case 'formation':c.innerHTML=renderFormation();initFormationEvents();break;\n    case 'transformer':c.innerHTML=renderTransformer();initTransformerEvents();break;",
    js
)

# 3. Insert Formation page functions before // ---------- ROUTER ----------
formation_js = r'''// ---------- PAGE: FORMATION ----------
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
          <h3 style="font-weight:600;font-size:16px">ByPax NCE & TLS</h3>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);flex:1">Format ByPax structuré avec entête, PNR, Short Connection Pass, EES et PARAFE.</p>
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

'''

js = js.replace('// ---------- ROUTER ----------', formation_js + '\n// ---------- ROUTER ----------')

with open('app.js', 'w') as f:
    f.write(js)

