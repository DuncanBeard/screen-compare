/* Wall Frame Layout Calculator — logic (external per site CSP: script-src 'self') */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

  function parseMixed(s) {
    s = s.trim(); if (!s) return NaN;
    let m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/); if (m) return +m[1] + (+m[2]) / (+m[3]);
    m = s.match(/^(-?\d+)\/(\d+)$/); if (m) return (+m[1]) / (+m[2]);
    const f = parseFloat(s); return isNaN(f) ? NaN : f;
  }
  function parseLength(raw) {
    if (raw == null) return NaN;
    let s = String(raw).trim().toLowerCase();
    if (!s) return NaN;
    s = s.replace(/inches|inch/g, '"').replace(/\bin\b/g, '"').replace(/feet|foot/g, "'").replace(/\bft\b/g, "'");
    let feet = 0;
    const fm = s.match(/(-?\d+(?:\.\d+)?)\s*'/);
    if (fm) { feet = parseFloat(fm[1]); s = s.slice(0, fm.index) + ' ' + s.slice(fm.index + fm[0].length); }
    s = s.replace(/"/g, ' ').trim();
    let inches = 0;
    if (s) { const v = parseMixed(s); inches = isNaN(v) ? 0 : v; }
    return feet * 12 + inches;
  }
  function dec(x) { return (Math.round(x * 1000) / 1000).toString(); }
  function frac(x, d) {
    d = d || 16; const neg = x < 0; x = Math.abs(x);
    let whole = Math.floor(x + 1e-9); let num = Math.round((x - whole) * d);
    if (num === d) { whole++; num = 0; }
    if (num === 0) return (neg ? '-' : '') + whole + '"';
    const g = gcd(num, d);
    return (neg ? '-' : '') + (whole > 0 ? whole + ' ' : '') + (num / g) + '/' + (d / g) + '"';
  }

  function readInputs() {
    const hangers = parseInt($('#hangers').value, 10);
    $('#spreadWrap').style.display = hangers === 2 ? '' : 'none';
    return {
      wall: parseLength($('#wall').value),
      frame: parseLength($('#frame').value),
      n: parseInt($('#count').value, 10),
      pad: parseLength($('#pad').value || '0'),
      hangers,
      spread: parseLength($('#spread').value || '0'),
      d: parseInt($('#prec').value, 10),
      frameH: parseLength($('#frameH').value || '0'),
      centerH: parseLength($('#centerH').value || '0'),
      drop: parseLength($('#drop').value || '0')
    };
  }

  function compute(v) {
    const { wall, frame, n, pad, hangers, spread } = v;
    if (!(wall > 0) || !(frame > 0) || !(n >= 1)) return { err: 'Enter a wall width, frame width, and at least 1 frame.' };
    if (n * frame > wall + 1e-9) return { err: `Frames don\u2019t fit: ${n} \u00d7 ${dec(frame)}" = ${dec(n * frame)}" is wider than the ${dec(wall)}" wall.` };
    const white = wall - n * frame;
    const g = (white - 2 * pad) / (n + 1);
    const side = pad + g;
    let warn = null;
    if (g < -1e-9) warn = `Edge buffer of ${dec(pad)}"/side is too large \u2014 no room left for even gaps.`;
    const frames = [];
    for (let i = 0; i < n; i++) {
      const left = side + i * (frame + g);
      const center = left + frame / 2;
      const marks = hangers === 2 ? [center - spread / 2, center + spread / 2] : [center];
      frames.push({ i, left, center, right: left + frame, marks });
    }
    const total = side * 2 + n * frame + (n - 1) * g;
    return { wall, frame, n, pad, hangers, spread, white, g, side, frames, total, warn };
  }

  function svgEsc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  // Concrete colors (no CSS vars / color-mix in inline SVG — those break on iOS Safari).
  // Chosen to read well on both the dark-default and light themes of the site.
  const C = {
    strip: 'rgba(140,146,166,0.12)', stripLine: '#9aa3b8', dim: '#8b93a7',
    frame: 'rgba(234,88,12,0.16)', frameLine: '#ea580c', mark: '#e11d48'
  };

  function draw(v, r) {
    const svg = $('#svg');
    if (!svg) return;
    if (r.err) {
      svg.setAttribute('viewBox', '0 0 1000 200');
      svg.innerHTML = `<text x="500" y="105" text-anchor="middle" fill="#dc2626" font-size="18">${svgEsc(r.err)}</text>`; return;
    }
    const wall = r.wall, frame = r.frame, frames = r.frames || [], side = r.side, gap = r.g, d = v.d;
    if (!frames.length) { svg.innerHTML = ''; return; }
    const M = 44, W = 1000, innerW = W - 2 * M;
    const scale = innerW / wall;
    const fhIn = v.frameH > 0 ? v.frameH : frame * 0.7;
    let fhPx = fhIn * scale; fhPx = Math.max(46, Math.min(210, fhPx));
    const stripPad = 26, stripH = fhPx + 2 * stripPad, stripTop = 86;
    const H = stripTop + stripH + 90;
    const fy = stripTop + (stripH - fhPx) / 2;
    const px = x => M + x * scale;
    let s = '';
    s += `<rect x="${M}" y="${stripTop}" width="${innerW}" height="${stripH}" rx="6" fill="${C.strip}" stroke="${C.stripLine}"/>`;
    s += `<line x1="${px(wall / 2)}" y1="${stripTop - 6}" x2="${px(wall / 2)}" y2="${stripTop + stripH + 6}" stroke="${C.stripLine}" stroke-dasharray="2 5" opacity="0.6"/>`;
    const dy = stripTop + stripH + 22;
    const seg = (a, b, txt) => {
      const xa = px(a), xb = px(b);
      let o = `<line x1="${xa}" y1="${dy}" x2="${xb}" y2="${dy}" stroke="${C.dim}"/>`;
      o += `<line x1="${xa}" y1="${dy - 5}" x2="${xa}" y2="${dy + 5}" stroke="${C.dim}"/>`;
      o += `<line x1="${xb}" y1="${dy - 5}" x2="${xb}" y2="${dy + 5}" stroke="${C.dim}"/>`;
      if (xb - xa > 26) o += `<text x="${(xa + xb) / 2}" y="${dy + 18}" text-anchor="middle" font-size="12" fill="${C.dim}">${svgEsc(txt)}</text>`;
      return o;
    };
    s += seg(0, side, frac(side, d));
    for (let i = 0; i < frames.length - 1; i++) s += seg(frames[i].right, frames[i + 1].left, frac(gap, d));
    s += seg(frames[frames.length - 1].right, wall, frac(side, d));
    frames.forEach(f => {
      s += `<rect x="${px(f.left)}" y="${fy}" width="${(f.right - f.left) * scale}" height="${fhPx}" rx="4" fill="${C.frame}" stroke="${C.frameLine}" stroke-width="1.5"/>`;
      s += `<text x="${px(f.center)}" y="${fy + fhPx / 2 + 4}" text-anchor="middle" font-size="13" fill="${C.frameLine}" font-weight="700">${f.i + 1}</text>`;
      const my = fy + Math.min(fhPx * 0.32, (v.drop > 0 ? v.drop * scale : fhPx * 0.32));
      f.marks.forEach(mx => {
        s += `<line x1="${px(mx)}" y1="${stripTop - 30}" x2="${px(mx)}" y2="${my}" stroke="${C.mark}" stroke-dasharray="3 3"/>`;
        s += `<circle cx="${px(mx)}" cy="${my}" r="4.5" fill="${C.mark}" stroke="#fff" stroke-width="1"/>`;
        s += `<text x="${px(mx)}" y="${stripTop - 34}" text-anchor="middle" font-size="12.5" fill="${C.mark}" font-weight="800">${svgEsc(frac(mx, d))}</text>`;
      });
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = s;
  }

  function render() {
    try { renderInner(); }
    catch (e) {
      const st = $('#status');
      if (st) st.innerHTML = `<div class="msg err">Render error: ${svgEsc(e && e.message || e)}. Please screenshot this and send it over.</div>`;
      if (window.console) console.error(e);
    }
  }

  function renderInner() {
    const v = readInputs();
    const r = compute(v);
    const st = $('#status');
    if (r.err) {
      st.innerHTML = `<div class="msg err">${r.err}</div>`;
      $('#chips').innerHTML = ''; $('#marks').innerHTML = ''; $('#tbl').querySelector('tbody').innerHTML = '';
      draw(v, r); return;
    }
    st.innerHTML = r.warn ? `<div class="msg err">${r.warn}</div>`
      : `<div class="msg ok">\u2713 Layout adds up to ${frac(r.total, v.d)} \u2014 matches the ${dec(v.wall)}" wall.</div>`;
    // chips
    $('#chips').innerHTML = [
      ['Even gap', frac(r.g, v.d)],
      ['Each side', frac(r.side, v.d)],
      ['Frames total', frac(v.n * v.frame, v.d)],
      ['White space', frac(r.white, v.d)],
      v.pad > 0 ? ['Edge buffer', frac(v.pad, v.d) + '/side'] : null
    ].filter(Boolean).map(c => `<span class="chip">${c[0]}: <b>${c[1]}</b></span>`).join('');
    // marks (flat list of every hole, in order)
    const holes = [];
    r.frames.forEach(f => f.marks.forEach((mx, k) => holes.push({
      who: `Frame ${f.i + 1}${f.marks.length > 1 ? (k === 0 ? ' \u00b7 left' : ' \u00b7 right') : ''}`, x: mx
    })));
    holes.sort((a, b) => a.x - b.x);
    $('#marks').innerHTML = holes.map(h =>
      `<div class="mark"><div class="who">${h.who}</div><div class="big">${frac(h.x, v.d)}</div><div class="dec">${dec(h.x)}"</div></div>`).join('');
    // table
    let prev = 0;
    const rows = holes.map((h, i) => {
      const step = h.x - prev; prev = h.x;
      return `<tr><td>${h.who}</td><td>${frac(h.x, v.d)}</td><td>${dec(h.x)}"</td><td>${i === 0 ? '\u2014' : '+' + frac(step, v.d)}</td></tr>`;
    }).join('');
    $('#tbl').querySelector('thead').innerHTML = '<tr><th>Hole</th><th>From left edge</th><th>Decimal</th><th>Step from previous</th></tr>';
    $('#tbl').querySelector('tbody').innerHTML = rows;
    // vertical
    const vc = $('#vchips');
    if (v.frameH > 0 && v.centerH > 0) {
      const hook = v.centerH + v.frameH / 2 - (v.drop || 0);
      const topEdge = v.centerH + v.frameH / 2;
      vc.innerHTML = [
        ['Mark hooks at height', frac(hook, v.d)],
        ['Frame top edge', frac(topEdge, v.d)],
        ['Frame center', frac(v.centerH, v.d)]
      ].map(c => `<span class="chip">${c[0]}: <b>${c[1]}</b></span>`).join('');
    } else vc.innerHTML = '<span class="chip">Enter frame + center height</span>';
    draw(v, r);
  }

  function loadEx(n) {
    if (n === 1) { set({ wall: "12'", frame: "17.25", count: 4, pad: "0", hangers: "1", spread: "8" }); }
    else { set({ wall: "11'2\"", frame: "16", count: 3, pad: "12", hangers: "2", spread: "8" }); }
    render();
  }
  function set(o) { for (const k in o) { const el = $('#' + k); if (el) el.value = o[k]; } }

  // Wire up — CSP forbids inline onclick=, so bind here.
  document.addEventListener('input', render);
  document.addEventListener('change', render);
  const ex1 = $('#ex1'); if (ex1) ex1.addEventListener('click', () => loadEx(1));
  const ex2 = $('#ex2'); if (ex2) ex2.addEventListener('click', () => loadEx(2));
  const pb = $('#printBtn'); if (pb) pb.addEventListener('click', () => window.print());
  render();
})();
