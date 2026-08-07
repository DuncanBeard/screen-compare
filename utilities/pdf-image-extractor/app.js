/* PDF Image Extractor — generic UI. CSP-safe: external, addEventListener only. */
(function () {
  'use strict';
  PDFExtract.configure('../vendor/pdf.worker.js');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var drop = $('#drop'), fileInput = $('#file'), statusEl = $('#status'),
      grid = $('#grid'), actionsAll = $('#actionsAll');
  var current = [];   // {name,page,width,height,canvas,blob}
  var baseName = 'document';

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

  $('#reset').addEventListener('click', function () {
    current = []; grid.innerHTML = ''; actionsAll.hidden = true; setStatus(''); fileInput.value = '';
  });
  $('#downloadAll').addEventListener('click', function () {
    current.forEach(function (im, i) {
      setTimeout(function () {
        PDFExtract.download(im.blob, baseName + '-image-' + (i + 1) + '.png');
      }, i * 250);
    });
  });

  function handleFile(file) {
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) {
      setStatus('That doesn’t look like a PDF. Please choose a .pdf file.', 'err'); return;
    }
    baseName = file.name.replace(/\.pdf$/i, '') || 'document';
    grid.innerHTML = ''; actionsAll.hidden = true; current = [];
    setStatus('Reading “' + escapeHtml(file.name) + '” …');
    var reader = new FileReader();
    reader.onload = function () {
      PDFExtract.extractImages(reader.result, {
        minSize: 8,
        onProgress: function (p, t) { setStatus('Scanning page ' + p + ' of ' + t + ' …'); }
      }).then(function (res) {
        current = res.images;
        if (!current.length) {
          setStatus('No embedded images found in this PDF. (Some PDFs draw everything as vector graphics or text.)', 'err');
          return;
        }
        setStatus('Found ' + current.length + ' image' + (current.length > 1 ? 's' : '') +
          ' across ' + res.numPages + ' page' + (res.numPages > 1 ? 's' : '') + '.', 'ok');
        actionsAll.hidden = false;
        current.forEach(renderItem);
      }).catch(function (e) {
        setStatus('Couldn’t read that PDF: ' + escapeHtml(e && e.message || String(e)), 'err');
      });
    };
    reader.onerror = function () { setStatus('Failed to read the file.', 'err'); };
    reader.readAsArrayBuffer(file);
  }

  function renderItem(im, idx) {
    var el = document.createElement('div');
    el.className = 'item';
    el.innerHTML =
      '<div class="thumb-wrap"></div>' +
      '<div class="meta"><span>#' + (idx + 1) + ' &middot; p' + im.page + '</span>' +
        '<span><b>' + im.width + '&times;' + im.height + '</b></span></div>' +
      '<div class="controls">' +
        '<div class="seg fmt">' +
          '<button data-fmt="image/png" class="active">PNG</button>' +
          '<button data-fmt="image/jpeg">JPG</button>' +
          '<button data-fmt="image/webp">WebP</button>' +
        '</div>' +
        '<div class="size-row">' +
          '<label><input type="checkbox" class="cap"> target</label>' +
          '<input type="number" class="capkb" value="500" min="10" step="50" disabled> KB' +
        '</div>' +
      '</div>' +
      '<div class="btn-row">' +
        '<button class="btn btn-primary act-dl">Download</button>' +
        '<button class="btn btn-secondary act-copy">Copy</button>' +
      '</div>' +
      '<div class="toast"></div>';

    var thumb = document.createElement('img');
    thumb.alt = 'Extracted image ' + (idx + 1);
    thumb.src = im.canvas.toDataURL('image/png');
    $('.thumb-wrap', el).appendChild(thumb);

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
        toast.textContent = isPng ? '' : '';
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
      toast.textContent = 'Encoding…';
      build().then(function (blob) {
        PDFExtract.download(blob, baseName + '-image-' + (idx + 1) + '.' + ext(fmt));
        toast.textContent = 'Saved · ' + PDFExtract.humanSize(blob.size);
      }).catch(function (e) { toast.textContent = 'Error: ' + (e.message || e); });
    });
    $('.act-copy', el).addEventListener('click', function () {
      toast.textContent = 'Copying…';
      // Clipboard images must be PNG in most browsers; copy PNG regardless of chosen dl format.
      PDFExtract.canvasToBlob(im.canvas, 'image/png').then(function (png) {
        return PDFExtract.copyToClipboard(png);
      }).then(function () { toast.textContent = 'Copied to clipboard ✓'; })
        .catch(function (e) { toast.textContent = e.message || 'Copy failed'; });
    });

    grid.appendChild(el);
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
