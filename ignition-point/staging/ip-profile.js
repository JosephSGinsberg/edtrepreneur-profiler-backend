/* Ignition Point — shared profile saver. One file, used by all 7 modules.
   Shows an optional "save my progress" bar, then sends each finished module's
   door tally + answers to the learner's Groundhogg record via /spark-api/api/module-save.php. */
(function(){
  var script = document.currentScript;
  var MOD = parseInt(script.getAttribute('data-module'), 10) || 0;
  var ENDPOINT = '/spark-api/api/module-save.php';
  var hosted = /(^|\.)josephginsberg\.com$/.test(location.hostname);

  var email = '', consent = false, pending = null, lastSent = '';
  try {
    var q = new URLSearchParams(location.search).get('e');
    email = (q || localStorage.getItem('ip_email') || '').trim();
    consent = localStorage.getItem('ip_consent') === '1';
  } catch (e) {}

  var css = '.ipb{border:1.5px dashed var(--line-strong);border-radius:12px;background:var(--paper-2);padding:12px 14px;margin:14px 0 0;font-size:12.5px;line-height:1.5}' +
    '.ipb strong{font-size:12px;letter-spacing:.04em;text-transform:uppercase}' +
    '.ipb-row{display:flex;gap:8px;margin:8px 0 6px;flex-wrap:wrap}' +
    '.ipb input[type=email]{flex:1;min-width:180px;font-family:inherit;font-size:13.5px;padding:8px 10px;border-radius:8px;border:1.5px solid var(--line-strong);background:var(--paper);color:var(--ink)}' +
    '.ipb button{font-family:inherit;font-weight:800;font-size:13px;background:var(--ink);color:var(--paper);border:none;border-radius:8px;padding:9px 16px;cursor:pointer}' +
    '.ipb label{display:flex;gap:8px;align-items:flex-start;opacity:.85;cursor:pointer}' +
    '.ipb label input{margin-top:3px;accent-color:var(--accent)}' +
    '.ipb-status{margin-top:6px;font-weight:700;color:var(--accent-ink)}' +
    '.ipb-status.ok{color:var(--ok)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var bar = document.createElement('div'); bar.className = 'ipb';
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  function setStatus(msg, ok){
    var el = bar.querySelector('.ipb-status'); if (!el) return;
    el.textContent = msg || ''; el.className = 'ipb-status' + (ok ? ' ok' : '');
  }

  function drawBar(){
    if (!hosted) {
      bar.innerHTML = '<strong>Preview mode</strong><div>Progress isn’t saved in this preview. The live version saves to your learner record.</div>';
      return;
    }
    bar.innerHTML = '<strong>Save your progress (optional)</strong>' +
      '<div class="ipb-row"><input type="email" placeholder="your@email.com" value="' + esc(email) + '" aria-label="Email">' +
      '<button type="button">Save</button></div>' +
      '<label><input type="checkbox"' + (consent ? ' checked' : '') + '>I agree Joe can keep my answers on my learner record and follow up with me. I can ask for them to be removed any time.</label>' +
      '<div class="ipb-status"></div>';
    bar.querySelector('button').addEventListener('click', onSaveClick);
  }

  function onSaveClick(){
    var v = bar.querySelector('input[type=email]').value.trim();
    var c = bar.querySelector('input[type=checkbox]').checked;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setStatus('Please enter a valid email.'); return; }
    if (!c) { setStatus('Please tick the box so we can save your progress.'); return; }
    email = v; consent = true;
    try { localStorage.setItem('ip_email', v); localStorage.setItem('ip_consent', '1'); } catch (e) {}
    if (pending) { send(pending); } else { setStatus('Saved ✓ — your progress will save when you finish this module.', true); }
  }

  function leanFrom(t){
    var w = (t.diagram||0)+(t.passage||0)+(t.clip||0)+(t.thread||0), p = t.puzzle||0;
    if (!w && !p) return 'none';
    return p > w ? 'constructor' : (p < w ? 'deconstructor' : 'mixed');
  }

  function send(snap){
    var payload = { email: email, module: MOD, tally: snap.tally || {}, answers: snap.answers || {}, lean: leanFrom(snap.tally || {}) };
    var key = JSON.stringify(payload);
    if (key === lastSent) return;
    setStatus('Saving…');
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key })
      .then(function(r){ return r.json(); })
      .then(function(j){
        if (j && j.saved) { lastSent = key; pending = null; setStatus('Progress saved ✓', true); }
        else { setStatus('Couldn’t save just now — your answers are still on this page.'); }
      })
      .catch(function(){ setStatus('Couldn’t save just now — your answers are still on this page.'); });
  }

  /* Modules call this when they finish. Sends if email + consent are in place, otherwise holds it. */
  window.ipSave = function(snap){
    if (!hosted) return;
    pending = snap;
    if (email && consent) { send(snap); }
    else { setStatus('Add your email above and press Save to keep this on your learner record.'); }
  };

  /* Modules without a final screen (4 and 6) mount an explicit button instead. */
  window.ipMountButton = function(host, getSnap){
    if (!host) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'nextbtn'; b.textContent = 'Save my progress';
    b.addEventListener('click', function(){ window.ipSave(getSnap()); });
    host.appendChild(b);
  };

  function mount(){
    drawBar();
    var brand = document.querySelector('.brand');
    if (brand && brand.parentNode) brand.parentNode.insertBefore(bar, brand.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
