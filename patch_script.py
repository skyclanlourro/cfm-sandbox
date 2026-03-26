import re

# 1. Patch index.html
with open('index.html', 'r') as f:
    html = f.read()

html = html.replace(
    '<li><a href="#products" class="nav-link" data-page="products">Produits</a></li>',
    '<li><a href="#products" class="nav-link" data-page="products">Produits</a></li>\n          <li><a href="#transformer" class="nav-link" data-page="transformer">Transformer</a></li>'
)

html = html.replace(
    '<li><a href="#products" class="mobile-nav-link" data-page="products">Produits</a></li>',
    '<li><a href="#products" class="mobile-nav-link" data-page="products">Produits</a></li>\n        <li><a href="#transformer" class="mobile-nav-link" data-page="transformer">Transformer</a></li>'
)

with open('index.html', 'w') as f:
    f.write(html)


# 2. Patch style.css
with open('style.css', 'r') as f:
    css = f.read()

transformer_css = """
/* ─── Transformer ─── */
.transformer-wrapper { background: #030810; color: #94a3b8; font-family: system-ui, sans-serif; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid var(--border-primary); margin-top: 10px; height: calc(100vh - 200px); min-height: 600px; }
.transformer-wrapper input, .transformer-wrapper textarea, .transformer-wrapper select { font-family: monospace; outline: none; }
.transformer-wrapper input::placeholder, .transformer-wrapper textarea::placeholder { color: #1e3a5f; }
.transformer-wrapper select option { background: #0d1929; }
.transformer-wrapper button { cursor: pointer; }
.transformer-wrapper .tab-content { display: none; flex: 1; flex-direction: column; overflow: hidden; }
.transformer-wrapper .tab-content.active { display: flex; }

/* ─── Responsive ─── */"""

css = css.replace('/* ─── Responsive ─── */', transformer_css)

with open('style.css', 'w') as f:
    f.write(css)


# 3. Patch app.js
with open('app.js', 'r') as f:
    js = f.read()

# Update PAGE_TITLES
js = js.replace(
    "const PAGE_TITLES = {dashboard:'Dashboard',testcases:'Cas de Test',flights:'Données de Vol',products:'Produits',export:'Export / Import',guide:'Guide'};",
    "const PAGE_TITLES = {dashboard:'Dashboard',testcases:'Cas de Test',flights:'Données de Vol',products:'Produits',transformer:'Transformer',export:'Export / Import',guide:'Guide'};"
)

# Update genFlight origin
js = re.sub(
    r'const o=opts\.origin\|\|rnd\(AF_AIRPORTS\), dest=opts\.destination\|\|rnd\(AF_AIRPORTS\.filter\(a=>a\.code!==o\.code\)\);',
    r"const o=opts.origin||{code:'CDG',city:'Paris CDG'}, dest=opts.destination||rnd(AF_AIRPORTS.filter(a=>a.code!=='CDG'));",
    js
)

js = re.sub(
    r'outboundFlightOrigin:o\.code,',
    r"outboundFlightOrigin:'CDG',",
    js
)

# Update genCabinPadOutput
js = re.sub(
    r'outboundFlightOrigin:f\.outboundFlightOrigin\|\|f\.origin,',
    r"outboundFlightOrigin:'CDG',",
    js
)

# Update openFlightModal dropdown to hardcode CDG
js = js.replace(
    '<div class="form-group"><label class="form-label">outboundFlightOrigin</label><select class="form-select" id="fOr">${AF_AIRPORTS.map(a=>`<option value="${a.code}">${a.code} — ${a.city}</option>`).join(\'\')}</select></div>',
    '<div class="form-group"><label class="form-label">outboundFlightOrigin</label><select class="form-select" id="fOr" disabled><option value="CDG" selected>CDG — Paris CDG</option></select></div>'
)

# Append Transformer code before router

transformer_js = r'''
// ---------- PAGE: TRANSFORMER ----------
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
function tr_badge(text, color, bg) { return '<span style="background:' + bg + ';color:' + color + ';border:1px solid ' + color + '44;border-radius:4px;padding:2px 8px;font-size:10px;font-family:monospace">' + tr_esc(text) + '</span>'; }

window.copyKey = function(k) { if (navigator.clipboard) navigator.clipboard.writeText(k); };

function tr_renderUI() {
  var rootPath = document.getElementById("rootPath").value;
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
        statsEl.innerHTML += tr_badge(totalPax + " pax", "#38bdf8", "#1e3a5f33");
        if (totalVols > 0) statsEl.innerHTML += tr_badge(totalVols + " vols", "#34d399", "#34d39922");
        if (ignored > 0)   statsEl.innerHTML += tr_badge(ignored + " ignorés", "#f59e0b", "#f59e0b22");
    }
  }

  function setBtn(id, enabled, gradient) {
    var b = document.getElementById(id);
    if(!b) return;
    b.disabled = !enabled;
    b.style.background = enabled ? gradient : "#1e2d47";
    b.style.color = enabled ? "#fff" : "#334155";
  }
  setBtn("btnNext",     !!tr_state.sourceJson && !!items, "linear-gradient(135deg,#1d4ed8,#0ea5e9)");
  setBtn("btnOutput",   !!output, "linear-gradient(135deg,#1d4ed8,#0ea5e9)");
  setBtn("btnDownload", !!output, "linear-gradient(135deg,#059669,#34d399)");

  var gs = document.getElementById("groupStats");
  if (items && gs) {
    gs.innerHTML = tr_GROUP_KEY_PATHS.map(function(p) {
      var vals = items.map(function(i) { return tr_getVal(i, p); });
      var defined = vals.filter(function(v) { return v !== undefined; }).length;
      var uniq = {};
      vals.filter(function(v) { return v !== undefined; }).forEach(function(v) { uniq[String(v)] = 1; });
      var uniqueCount = Object.keys(uniq).length;
      var col = defined > 0 ? "#34d399" : "#ef4444";
      return '<div style="display:flex;gap:6px;align-items:center">' +
        '<span style="font-family:monospace;font-size:10px;color:#38bdf8;flex:1">' + tr_esc(p) + '</span>' +
        '<span style="font-family:monospace;font-size:10px;color:' + col + '">' + defined + '/' + items.length + ' pax</span>' +
        '<span style="font-family:monospace;font-size:10px;color:#f59e0b">' + uniqueCount + ' val. uniques</span>' +
        '</div>';
    }).join("");
  } else if(gs) {
    gs.innerHTML = '<span style="color:#334155;font-size:10px">Charger un fichier source pour voir les stats</span>';
  }

  var availKeys = items ? tr_getAvailableKeys(items) : [];
  var btnSK = document.getElementById("btnShowKeys");
  if(btnSK) btnSK.style.display = availKeys.length > 0 ? "inline-block" : "none";
  
  var kBadges = document.getElementById("keysBadges");
  if(kBadges) {
      kBadges.innerHTML = availKeys.map(function(k) {
        return '<span onclick="copyKey(\'' + tr_esc(k) + '\')" title="Cliquer pour copier" style="background:#1e3a5f22;border:1px solid #1e3a5f;border-radius:3px;padding:1px 6px;font-size:10px;font-family:monospace;color:#38bdf8;cursor:pointer;user-select:none">' + tr_esc(k) + '</span>';
      }).join("");
  }

  var mc = document.getElementById("mappingCount");
  if(mc) mc.textContent = tr_state.mappings.length + " mappings";
  
  var list = document.getElementById("mappingList");
  if (list) {
      if (tr_state.mappings.length === 0) {
        list.innerHTML = '<div style="color:#334155;font-size:12px;text-align:center;padding:28px 0">Aucun mapping</div>';
      } else {
        list.innerHTML = tr_state.mappings.map(function(m) {
          var val = items ? tr_getVal(items[0], m.src) : undefined;
          var found = val !== undefined;
          var countWith = items ? items.filter(function(i) { return tr_getVal(i, m.src) !== undefined; }).length : 0;
          var bc = m.src && items ? (found ? "#34d39966" : "#ef444455") : "#1e2d47";
          var opts = '<option value="">-- cible --</option>' + tr_TARGET_FIELDS.map(function(f) {
            return '<option value="' + tr_esc(f) + '"' + (f === m.tgt ? " selected" : "") + '>' + tr_esc(f) + '</option>';
          }).join("");
          var preview = "";
          if (items && m.src) {
            var previewColor = found ? "#34d399" : "#ef4444";
            var previewBg = found ? "#34d39908" : "#ef444408";
            var previewBorder = found ? "#34d39922" : "#ef444422";
            var previewText = found ? "ex: " + tr_esc(JSON.stringify(val)) : "chemin introuvable";
            var countHtml = found ? '<span style="font-family:monospace;font-size:9px;color:#475569">' + countWith + '/' + items.length + ' pax</span>' : "";
            preview = '<div style="margin-top:3px;padding:3px 8px;background:' + previewBg + ';border-radius:4px;border:1px solid ' + previewBorder + ';display:flex;justify-content:space-between;align-items:center">' +
              '<span style="font-family:monospace;font-size:10px;color:' + previewColor + '">' + previewText + '</span>' + countHtml + '</div>';
          }
          return '<div style="border-bottom:1px solid #0a1628;padding-bottom:6px">' +
            '<div style="display:grid;grid-template-columns:1fr 16px 1fr 28px;gap:6px;align-items:center;padding-top:8px">' +
            '<input type="text" value="' + tr_esc(m.src) + '" data-id="' + m.id + '" data-field="src" placeholder="outBound.flightNumber" style="background:#0d1929;border:1px solid ' + bc + ';border-radius:5px;color:#38bdf8;font-size:11px;padding:5px 8px;width:100%"/>' +
            '<div style="color:#f59e0b;text-align:center;font-size:13px">&#8594;</div>' +
            '<select data-id="' + m.id + '" data-field="tgt" style="background:#0d1929;border:1px solid #1e2d47;border-radius:5px;color:#34d399;font-size:11px;padding:5px 4px;width:100%">' + opts + '</select>' +
            '<button data-del="' + m.id + '" style="background:transparent;border:1px solid #ef444433;border-radius:5px;color:#ef4444;font-size:14px;width:28px;height:28px">&#215;</button>' +
            '</div>' + preview + '</div>';
        }).join("");
      }
  }

  var os = document.getElementById("outputStats");
  if(os) {
      os.innerHTML = output
        ? '<span style="color:#34d399;font-weight:600">' + totalVols + ' vols</span>' +
          '<span style="color:#334155"> extraits de </span>' +
          '<span style="color:#38bdf8">' + totalPax + ' passagers</span>'
        : "";
  }

  var prev = document.getElementById("outputPreview");
  if (prev) {
      if (output) {
        var highlighted = tr_state.mappings.map(function(m) { return m.tgt; }).filter(Boolean);
        var lines = JSON.stringify(output, null, 2).split("\n");
        prev.innerHTML = lines.map(function(line) {
          var hi = highlighted.some(function(h) { return line.indexOf('"' + h + '"') !== -1; });
          return '<span style="display:block;white-space:pre;' +
            (hi ? 'color:#f59e0b;background:#f59e0b0d;border-left:2px solid #f59e0b;padding-left:6px'
                : 'color:#334155;border-left:2px solid transparent;padding-left:8px') +
            '">' + tr_esc(line) + '</span>';
        }).join("");
      } else {
        prev.innerHTML = '<span style="color:#334155;display:block;text-align:center;padding-top:40px">Charger un fichier source dans &#9312;</span>';
      }
  }
}

function initTransformerEvents() {
  var wrapper = document.getElementById('transformerApp');
  if(!wrapper) return;

  function setTab(tabName) {
    wrapper.querySelectorAll(".tabBtn").forEach(function(b) {
      b.style.borderBottom = "2px solid transparent";
      b.style.color = "#475569";
      b.style.fontWeight = "400";
    });
    wrapper.querySelectorAll(".tab-content").forEach(function(t) { t.classList.remove("active"); });
    var btn = wrapper.querySelector('.tabBtn[data-tab="'+tabName+'"]');
    if(btn) {
        btn.style.borderBottom = "2px solid #38bdf8";
        btn.style.color = "#38bdf8";
        btn.style.fontWeight = "600";
    }
    var tc = document.getElementById("tab-" + tabName);
    if(tc) tc.classList.add("active");
  }

  wrapper.querySelectorAll(".tabBtn").forEach(function(btn) {
    btn.addEventListener("click", function() { setTab(btn.dataset.tab); });
  });

  var fileInput = document.getElementById("fileInput");
  var dropzone  = document.getElementById("dropzone");
  if(dropzone) {
      dropzone.addEventListener("click", function() { fileInput.click(); });
      dropzone.addEventListener("dragover",  function(e) { e.preventDefault(); dropzone.style.borderColor="#38bdf8"; });
      dropzone.addEventListener("dragleave", function()  { dropzone.style.borderColor="#1e2d47"; });
      dropzone.addEventListener("drop", function(e) { e.preventDefault(); dropzone.style.borderColor="#1e2d47"; loadFile(e.dataTransfer.files[0]); });
  }
  if(fileInput) fileInput.addEventListener("change", function(e) { loadFile(e.target.files[0]); });

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
  if(btnN) btnN.addEventListener("click", function() { setTab("mapping"); });
  
  var btnO = document.getElementById("btnOutput");
  if(btnO) btnO.addEventListener("click", function() { setTab("output"); });

  var bsk = document.getElementById("btnShowKeys");
  if(bsk) bsk.addEventListener("click", function() {
    tr_state.showKeys = !tr_state.showKeys;
    document.getElementById("keysPanel").style.display = tr_state.showKeys ? "block" : "none";
    this.innerHTML = tr_state.showKeys ? "&#9650; Masquer clés" : "&#9660; Voir clés source";
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
        var m = tr_state.mappings.filter(function(x) { return x.id === id; })[0];
        if (m) { m[field] = e.target.value; tr_renderUI(); }
      });
      ml.addEventListener("click", function(e) {
        var delId = parseInt(e.target.dataset.del);
        if (delId) {
          tr_state.mappings = tr_state.mappings.filter(function(m) { return m.id !== delId; });
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
    var btn = document.getElementById("btnDownload");
    btn.textContent = "✓ Téléchargement lancé !";
    setTimeout(function() { btn.innerHTML = "&#8595; Télécharger output.json"; }, 2500);
  });

  tr_renderUI();
}

function renderTransformer() {
  return `<div class="page-enter">
  <div class="section-header">
    <h2 class="section-title">JSON Transformer (byFlight / byPax)</h2>
  </div>
  <div class="transformer-wrapper" id="transformerApp">
    <div id="header" style="padding:10px 14px;background:#040c1a;border-bottom:1px solid #1e2d47;display:flex;align-items:center;gap:10px;flex-shrink:0">
      <div style="width:26px;height:26px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px">&#9992;</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:#e2e8f0">JSON Transformer</div>
        <div style="font-size:9px;color:#475569;letter-spacing:.08em;text-transform:uppercase">CabinPad &middot; Flight data mapper</div>
      </div>
      <div id="stats" style="display:flex;gap:6px"></div>
    </div>

    <div style="display:flex;border-bottom:1px solid #1e2d47;background:#040c1a;flex-shrink:0">
      <button class="tabBtn active" data-tab="source"  style="flex:1;padding:10px 4px;background:transparent;border:none;border-bottom:2px solid #38bdf8;color:#38bdf8;font-size:12px;font-weight:600">&#9312; Source</button>
      <button class="tabBtn"        data-tab="mapping" style="flex:1;padding:10px 4px;background:transparent;border:none;border-bottom:2px solid transparent;color:#475569;font-size:12px;font-weight:400">&#9313; Mapping</button>
      <button class="tabBtn"        data-tab="output"  style="flex:1;padding:10px 4px;background:transparent;border:none;border-bottom:2px solid transparent;color:#475569;font-size:12px;font-weight:400">&#9314; Sortie</button>
    </div>

    <div id="tab-source" class="tab-content active" style="padding:14px;gap:10px">
      <div id="dropzone" style="border:2px dashed #1e2d47;border-radius:10px;padding:18px;text-align:center;cursor:pointer;flex-shrink:0">
        <div style="font-size:20px;margin-bottom:4px">&#8679;</div>
        <div style="font-size:12px;color:#475569">Glisser un <strong style="color:#94a3b8">.json</strong> ou <span style="color:#38bdf8">parcourir</span></div>
        <input id="fileInput" type="file" accept=".json" style="display:none"/>
      </div>
      <div style="flex-shrink:0">
        <div style="font-size:9px;color:#475569;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px">Chemin racine <span style="color:#334155">(vide = auto)</span></div>
        <input id="rootPath" type="text" placeholder="ex: data.passengers" value="data.passengers"
          style="width:100%;background:#070d1a;border:1px solid #1e2d47;border-radius:6px;color:#f59e0b;font-size:12px;padding:7px 10px"/>
      </div>
      <div style="font-size:9px;color:#334155;text-transform:uppercase;letter-spacing:.1em;flex-shrink:0">ou coller le JSON</div>
      <textarea id="sourceText" placeholder=\'{"data":{"passengers":[...]}}\' style="flex:1;background:#070d1a;border:1px solid #1e2d47;border-radius:8px;color:#94a3b8;font-size:11px;padding:12px;resize:none;line-height:1.6"></textarea>
      <div id="parseError" style="color:#ef4444;font-size:11px;display:none"></div>
      <button id="btnNext" style="width:100%;padding:13px;border:none;border-radius:9px;background:#1e2d47;color:#334155;font-size:14px;font-weight:700;flex-shrink:0" disabled>Suivant &#8594; Configurer le mapping</button>
    </div>

    <div id="tab-mapping" class="tab-content">
      <div style="padding:8px 14px;background:#040c1a;border-bottom:1px solid #1e2d47;flex-shrink:0">
        <div style="font-size:9px;color:#475569;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px">Clés de groupement</div>
        <div id="groupStats" style="font-size:10px;color:#334155">Charger un fichier source pour voir les stats</div>
      </div>
      <div style="padding:8px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #1e2d47;flex-shrink:0">
        <span id="mappingCount" style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.1em;flex:1">3 mappings</span>
        <button id="btnShowKeys" style="background:#1e3a5f22;border:1px solid #1e3a5f;border-radius:5px;color:#38bdf8;font-size:10px;padding:3px 10px;display:none">&#9660; Voir clés source</button>
        <button id="btnAddMapping" style="background:#1d4ed811;border:1px solid #1d4ed844;border-radius:5px;color:#38bdf8;font-size:11px;padding:4px 12px">+ Ajouter</button>
      </div>
      <div id="keysPanel" style="padding:8px 14px;border-bottom:1px solid #1e2d47;max-height:110px;overflow-y:auto;flex-shrink:0;background:#040c1a;display:none">
        <div id="keysBadges" style="display:flex;flex-wrap:wrap;gap:4px"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 16px 1fr 28px;gap:6px;padding:6px 14px;border-bottom:1px solid #1e2d47;flex-shrink:0">
        <div style="font-size:9px;color:#334155;text-transform:uppercase;letter-spacing:.1em">Chemin source</div>
        <div></div>
        <div style="font-size:9px;color:#334155;text-transform:uppercase;letter-spacing:.1em">Champ cible</div>
        <div></div>
      </div>
      <div id="mappingList" style="flex:1;overflow-y:auto;padding:0 14px"></div>
      <div style="padding:14px;flex-shrink:0;border-top:1px solid #1e2d47">
        <button id="btnOutput" style="width:100%;padding:13px;border:none;border-radius:9px;background:#1e2d47;color:#334155;font-size:14px;font-weight:700" disabled>Voir la sortie &#8594;</button>
      </div>
    </div>

    <div id="tab-output" class="tab-content" style="padding:14px;gap:10px">
      <button id="btnDownload" style="width:100%;padding:13px;border:none;border-radius:9px;background:#1e2d47;color:#334155;font-size:14px;font-weight:700;flex-shrink:0" disabled>&#8595; Télécharger output.json</button>
      <div id="outputStats" style="font-size:11px;color:#475569;text-align:center;flex-shrink:0"></div>
      <div id="outputPreview" style="flex:1;overflow:auto;background:#070d1a;border:1px solid #1e2d47;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;line-height:1.7;color:#334155">
        Charger un fichier source dans &#9312;
      </div>
    </div>
  </div></div>`;
}
// ---------------------------------------
'''

js = js.replace('// ---------- ROUTER ----------', transformer_js + '\n// ---------- ROUTER ----------')
js = js.replace(
    "case 'products':c.innerHTML=renderProducts();break;",
    "case 'products':c.innerHTML=renderProducts();break;\n    case 'transformer':c.innerHTML=renderTransformer();initTransformerEvents();break;"
)

with open('app.js', 'w') as f:
    f.write(js)

