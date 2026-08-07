/* pdf-extract.js — shared in-browser PDF image-extraction engine.
   Self-hosted pdf.js only (site CSP: script-src 'self'). No network, no uploads:
   every byte stays in the browser tab. Exposes window.PDFExtract. */
(function (global) {
  'use strict';

  var _configured = false;

  function ensureConfigured() {
    if (!global.pdfjsLib) throw new Error('pdf.js failed to load');
    _configured = true;
  }

  function objGet(page, name, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var to = setTimeout(function () {
        if (!done) { done = true; reject(new Error('timeout resolving ' + name)); }
      }, timeoutMs || 8000);
      try {
        page.objs.get(name, function (img) {
          if (done) return;
          done = true; clearTimeout(to); resolve(img);
        });
      } catch (e) {
        if (!done) { done = true; clearTimeout(to); reject(e); }
      }
    });
  }

  /* Turn a pdf.js image object into a <canvas>. Handles every shape pdf.js emits:
     - img.bitmap  : browser-decoded ImageBitmap (common with worker)
     - img.data + img.kind : raw pixels (1=gray-1bpp, 2=RGB-24, 3=RGBA-32) */
  function imageToCanvas(img) {
    var w = img.width, h = img.height;
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');

    if (img.bitmap) { ctx.drawImage(img.bitmap, 0, 0); return canvas; }

    var data = img.data;
    if (!data) throw new Error('image has neither bitmap nor data');
    var id = ctx.createImageData(w, h);
    var out = id.data;
    var kind = img.kind, n = w * h, i, j;

    if (kind === 3 || (kind == null && data.length >= n * 4)) {
      out.set(data.subarray(0, n * 4));
    } else if (kind === 2 || (kind == null && data.length >= n * 3)) {
      for (i = 0, j = 0; i < n; i++) {
        out[j++] = data[i * 3]; out[j++] = data[i * 3 + 1];
        out[j++] = data[i * 3 + 2]; out[j++] = 255;
      }
    } else if (kind === 1) {
      var rowBytes = (w + 7) >> 3;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var bit = (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
          var v = bit ? 255 : 0, idx = (y * w + x) * 4;
          out[idx] = out[idx + 1] = out[idx + 2] = v; out[idx + 3] = 255;
        }
      }
    } else {
      throw new Error('unsupported image kind: ' + kind);
    }
    ctx.putImageData(id, 0, 0);
    return canvas;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b); }, type, quality);
    });
  }

  /* Extract every raster image from a PDF ArrayBuffer.
     opts: { onProgress(page,total), minSize:px }
     -> { numPages, images:[ {name,page,width,height,canvas,blob,bytes} ] } */
  function extractImages(arrayBuffer, opts) {
    opts = opts || {};
    ensureConfigured();
    var OPS = global.pdfjsLib.OPS;
    return global.pdfjsLib.getDocument({
      data: arrayBuffer,
      isEvalSupported: false,      // never trip script-src 'self'
      disableFontFace: true,
      useSystemFonts: false
    }).promise.then(function (pdf) {
      var results = [];
      var minSize = opts.minSize || 0;
      var chain = Promise.resolve();
      for (var pn = 1; pn <= pdf.numPages; pn++) {
        (function (pageNum) {
          chain = chain.then(function () {
            return pdf.getPage(pageNum).then(function (page) {
              return page.getOperatorList().then(function (ops) {
                var names = [], seen = {};
                for (var k = 0; k < ops.fnArray.length; k++) {
                  var fn = ops.fnArray[k];
                  if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
                    var nm = ops.argsArray[k][0];
                    if (typeof nm === 'string' && !seen[nm]) { seen[nm] = 1; names.push(nm); }
                  }
                }
                var pc = Promise.resolve();
                names.forEach(function (nm) {
                  pc = pc.then(function () {
                    return objGet(page, nm, 8000).then(function (img) {
                      if (!img || !img.width) return;
                      if (img.width < minSize || img.height < minSize) return;
                      var canvas = imageToCanvas(img);
                      return canvasToBlob(canvas, 'image/png').then(function (blob) {
                        results.push({
                          name: nm, page: pageNum,
                          width: canvas.width, height: canvas.height,
                          canvas: canvas, blob: blob, bytes: blob ? blob.size : 0
                        });
                      });
                    }).catch(function (e) {
                      if (global.console) console.warn('skip', nm, e && e.message);
                    });
                  });
                });
                return pc;
              });
            });
          }).then(function () {
            if (opts.onProgress) opts.onProgress(pageNum, pdf.numPages);
          });
        })(pn);
      }
      return chain.then(function () { return { numPages: pdf.numPages, images: results }; });
    });
  }

  /* Convert a source canvas to a target format, optionally under maxBytes.
     opts: { type, quality, maxBytes, scale }  -> Blob */
  function convert(canvas, opts) {
    opts = opts || {};
    var type = opts.type || 'image/png';
    var src = canvas;
    if (opts.scale && opts.scale !== 1) {
      var c2 = document.createElement('canvas');
      c2.width = Math.max(1, Math.round(canvas.width * opts.scale));
      c2.height = Math.max(1, Math.round(canvas.height * opts.scale));
      c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
      src = c2;
    }
    // PNG is lossless (no quality lever); if no size cap, single-shot encode.
    if (type === 'image/png' || !opts.maxBytes) {
      return canvasToBlob(src, type, opts.quality != null ? opts.quality : 0.92);
    }
    // Binary-search quality to fit under maxBytes (jpeg/webp).
    var lo = 0.05, hi = 0.98, best = null, iters = 8;
    function step(i) {
      if (i >= iters) return best ? Promise.resolve(best) : canvasToBlob(src, type, lo);
      var mid = (lo + hi) / 2;
      return canvasToBlob(src, type, mid).then(function (b) {
        if (b && b.size <= opts.maxBytes) { best = b; lo = mid; } else { hi = mid; }
        return step(i + 1);
      });
    }
    return step(0);
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
  }

  function copyToClipboard(blob) {
    if (!global.ClipboardItem || !navigator.clipboard || !navigator.clipboard.write) {
      return Promise.reject(new Error('This browser can’t copy images to the clipboard — use Download instead.'));
    }
    var item = {}; item[blob.type] = blob;
    return navigator.clipboard.write([new global.ClipboardItem(item)]);
  }

  function humanSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }

  global.PDFExtract = {
    configure: function (workerSrc) {
      if (global.pdfjsLib) global.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      _configured = true;
    },
    extractImages: extractImages,
    convert: convert,
    canvasToBlob: canvasToBlob,
    download: download,
    copyToClipboard: copyToClipboard,
    humanSize: humanSize
  };
})(window);
