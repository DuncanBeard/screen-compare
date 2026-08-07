/* Surest Card Extractor — branded UI over the shared PDFExtract engine.
   CSP-safe: external script, addEventListener only, no inline handlers. */
(function () {
  'use strict';
  PDFExtract.configure('../vendor/pdf.worker.js');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var drop = $('#drop'), fileInput = $('#file'), statusEl = $('#status'),
      cards = $('#cards'), footNote = $('#footNote');

  function setStatus(html, cls) {
    statusEl.innerHTML = html ? '<span class="' + (cls || '') + '">' + html + '</span>' : '';
  }

  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); });
  });
  drop.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function labelFor(i, total) {
    if (total === 2) return i === 0 ? 'Front' : 'Back';
    if (total === 1) return 'Card';
    return 'Side ' + (i + 1);
  }

  function handleFile(file) {
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) {
      setStatus('Please choose the PDF Surest gave you (a .pdf file).', 'err'); return;
    }
    cards.innerHTML = ''; cards.hidden = true; footNote.hidden = true;
    drop.classList.remove('has-results');
    setStatus('Reading your card …');
    var reader = new FileReader();
    reader.onload = function () {
      PDFExtract.extractImages(reader.result, { minSize: 40 })
        .then(function (res) {
          var imgs = res.images;
          if (!imgs.length) {
            setStatus('Hmm — no card images found in that PDF. Make sure it’s the digital card file from Surest.', 'err');
            return;
          }
          // Surest layout: front then back, left-to-right / top-to-bottom (extraction order).
          setStatus('Done — your card, split into ' + imgs.length + (imgs.length === 2 ? ' sides.' : ' image(s).'), 'ok');
          cards.hidden = false; footNote.hidden = false;
          drop.classList.add('has-results');
          imgs.forEach(function (im, i) { renderPanel(im, i, imgs.length); });
        })
        .catch(function (e) {
          setStatus('Couldn’t read that PDF: ' + escapeHtml(e && e.message || String(e)), 'err');
        });
    };
    reader.onerror = function () { setStatus('Failed to read the file.', 'err'); };
    reader.readAsArrayBuffer(file);
  }

  function renderPanel(im, idx, total) {
    var label = labelFor(idx, total);
    var el = document.createElement('div');
    el.className = 'surest-panel';
    el.innerHTML =
      '<div class="panel-head">' +
        '<span class="panel-label"><span class="dot"></span>' + label + '</span>' +
        '<span class="meta-line">' + im.width + '×' + im.height + '</span>' +
      '</div>' +
      '<div class="card-slot"></div>' +
      '<div class="panel-controls">' +
        '<div class="seg fmt">' +
          '<button data-fmt="image/png" class="active">PNG</button>' +
          '<button data-fmt="image/jpeg">JPG</button>' +
          '<button data-fmt="image/webp">WebP</button>' +
        '</div>' +
        '<div class="size-row">' +
          '<label><input type="checkbox" class="cap"> target size</label>' +
          '<input type="number" class="capkb" value="500" min="10" step="50" disabled> KB' +
        '</div>' +
      '</div>' +
      '<div class="surest-btns">' +
        '<button class="sbtn primary act-dl">Download ' + label + '</button>' +
        '<button class="sbtn ghost act-copy">Copy</button>' +
      '</div>' +
      '<div class="toast"></div>';

    var img = document.createElement('img');
    img.alt = 'Insurance card ' + label;
    img.src = im.canvas.toDataURL('image/png');
    $('.card-slot', el).appendChild(img);

    var fmtBtns = el.querySelectorAll('.fmt button');
    var cap = $('.cap', el), capkb = $('.capkb', el), toast = $('.toast', el);
    var fmt = 'image/png';
    fmtBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        fmtBtns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        fmt = b.getAttribute('data-fmt');
        var isPng = fmt === 'image/png';
        cap.disabled = isPng; if (isPng) { cap.checked = false; capkb.disabled = true; }
      });
    });
    cap.addEventListener('change', function () { capkb.disabled = !cap.checked; });

    function ext(t) { return t === 'image/jpeg' ? 'jpg' : t === 'image/webp' ? 'webp' : 'png'; }
    function build() {
      var opts = { type: fmt };
      if (fmt !== 'image/png' && cap.checked) {
        var kb = parseInt(capkb.value, 10);
        if (kb > 0) opts.maxBytes = kb * 1024;
      }
      return PDFExtract.convert(im.canvas, opts);
    }

    $('.act-dl', el).addEventListener('click', function () {
      toast.textContent = 'Preparing…';
      build().then(function (blob) {
        PDFExtract.download(blob, 'surest-card-' + label.toLowerCase() + '.' + ext(fmt));
        toast.textContent = 'Saved ' + label + ' · ' + PDFExtract.humanSize(blob.size);
      }).catch(function (e) { toast.textContent = 'Error: ' + (e.message || e); });
    });
    $('.act-copy', el).addEventListener('click', function () {
      toast.textContent = 'Copying…';
      PDFExtract.canvasToBlob(im.canvas, 'image/png').then(function (png) {
        return PDFExtract.copyToClipboard(png);
      }).then(function () { toast.textContent = label + ' copied ✓'; })
        .catch(function (e) { toast.textContent = e.message || 'Copy failed'; });
    });

    cards.appendChild(el);
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
