import re

# 1. Patch style.css
with open('style.css', 'r') as f:
    css = f.read()

# Replace the dark mode transformer block
old_transformer_css = r"""/\* ─── Transformer ─── \*/
\.transformer-wrapper \{ background: #030810; color: #94a3b8; font-family: system-ui, sans-serif; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid var\(--border-primary\); margin-top: 10px; height: calc\(100vh - 200px\); min-height: 600px; \}
\.transformer-wrapper input, \.transformer-wrapper textarea, \.transformer-wrapper select \{ font-family: monospace; outline: none; \}
\.transformer-wrapper input::placeholder, \.transformer-wrapper textarea::placeholder \{ color: #1e3a5f; \}
\.transformer-wrapper select option \{ background: #0d1929; \}
\.transformer-wrapper button \{ cursor: pointer; \}
\.transformer-wrapper \.tab-content \{ display: none; flex: 1; flex-direction: column; overflow: hidden; \}
\.transformer-wrapper \.tab-content\.active \{ display: flex; \}"""

new_transformer_css = """/* ─── Transformer ─── */
.dropzone{border:2px dashed var(--border-primary);border-radius:var(--radius-xl);padding:var(--space-8);text-align:center;cursor:pointer;transition:all var(--duration-fast) var(--ease-out);background:var(--bg-surface-solid)}
.dropzone:hover,.dropzone.dragover{border-color:var(--blue-500);background:rgba(0,113,227,0.02)}
"""

css = re.sub(old_transformer_css, new_transformer_css, css)

with open('style.css', 'w') as f:
    f.write(css)


# 2. Patch app.js
with open('app.js', 'r') as f:
    js = f.read()

# I will replace everything between "// ---------- PAGE: TRANSFORMER ----------" and "// ---------- ROUTER ----------"
import re
pattern = re.compile(r'// ---------- PAGE: TRANSFORMER ----------.*?// ---------- ROUTER ----------', re.DOTALL)

new_app_js = r'''// ---------- PAGE: TRANSFORMER ----------
var tr_DEFAULT_TEMPLATE = {
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
var tr_TARGET_FIELDS = Object.keys(tr_DEFAULT_TEMPLATE);
var tr_GROUP_KEY_PATHS = [
  "outBound.flightNumber",
  "outBound.departureDate",
  "outBound.arrivalDate",
  "outBound.arrivalStation",
  "outBound.departureStation"
];
var tr_state = {
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
      var result = JSON.parse(JSON.stringify(tr_DEFAULT_TEMPLATE));
      active.forEach(function(m) {
        var v = tr_getVal(item, m.src);
        if (v !== undefined) result[m.tgt] = v;
      });
      groups[key] = result;
      order.push(key);
    }
  });
  return order.map(function(k) { return groups[k]; });
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
  var output = outputArr ? { data: outputArr } : null;
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

  tr_renderUI();
}

function renderTransformer() {
  return `<div class="slide-up">
  <div class="section-header">
    <div class="pill-filters" id="trTabs">
        <button class="pill active" data-tab="source">1. Source</button>
        <button class="pill" data-tab="mapping">2. Mapping</button>
        <button class="pill" data-tab="output">3. Sortie JSON</button>
    </div>
  </div>
  <div id="transformerApp">
    <!-- Tab 1: Source -->
    <div id="tab-source" class="tab-content active" style="display:flex;flex-direction:column;gap:var(--space-5)">
      <div id="stats" style="display:flex;gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap"></div>
      <div class="card dropzone" id="dropzone">
        <div style="font-size:32px;color:var(--text-tertiary);margin-bottom:var(--space-2)">⇧</div>
        <div style="font-size:15px;color:var(--text-primary);font-weight:600">Glisser un <span style="color:var(--blue-500)">.json</span> ou parcourir</div>
        <input id="fileInput" type="file" accept=".json" style="display:none"/>
      </div>
      <div class="form-group">
        <label class="form-label">Chemin racine (vide = auto)</label>
        <input id="rootPath" type="text" class="form-input" placeholder="ex: data.passengers" value="data.passengers"/>
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
// ---------- ROUTER ----------'''

js = pattern.sub(new_app_js, js)

with open('app.js', 'w') as f:
    f.write(js)

