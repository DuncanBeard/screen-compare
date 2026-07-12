let TRIPS = [];
let META = null;

// ── Price-proof helpers ─────────────────────────────────────────
// Every rendered price carries evidence of when it was scraped and, when
// available, a link to the screenshot of the exact Amtrak page it came from.
function priceMarkup(t) {
  const old = Number(t.scrape_age_days) > 1;
  return '<span class="price-value' + (old ? ' older-than-24h' : '') + '">$' + t.price + '</span>' +
    (old ? '<span class="price-age-note">scraped &gt;24h ago</span>' : '');
}

function proofMarkup(t) {
  let html = '';
  const scraped = formatScrapeDate(t.scraped_on);
  // Freshness pill: fresh (scraped recently) vs stale (weeks-old, may have drifted)
  if (typeof t.scrape_age_days === 'number') {
    if (t.fresh) {
      html += '<span class="fresh-pill fresh" title="Scraped ' +
        (t.scraped_on || 'recently') + '">✓ fresh · ' + scraped + '</span>';
    } else {
      html += '<span class="fresh-pill stale" title="Last scraped ' +
        (t.scraped_on || '?') + ' — ' + agoText(t.scrape_age_days) +
        '. Fare may have changed; re-check on amtrak.com.">⚠ ' + agoText(t.scrape_age_days) + ' · ' + scraped + '</span>';
    }
  }
  // Screenshot proof link
  if (t.screenshot) {
    html += ' <a class="verify-shot" href="' + t.screenshot + '" target="_blank" rel="noopener" ' +
      'title="See the Amtrak page this price was scraped from" aria-label="View fare evidence screenshot">View evidence 🔍</a>';
  }
  if (t.observation_id) {
    html += '<span class="fresh-pill database" title="SQLite observation #' + t.observation_id +
      ' · ' + (t.observation_count || 1) + ' historical observation(s) · first seen ' +
      (t.first_observed_on || '?') + '">DB #' + t.observation_id + '</span>';
  }
  if (typeof t.price_change === 'number') {
    const cls = t.price_change > 0 ? 'up' : (t.price_change < 0 ? 'down' : '');
    if (t.price_change === 0) {
      html += '<span class="price-change">unchanged vs previous scrape</span>';
    } else {
      const sign = t.price_change > 0 ? '+' : '−';
      html += '<span class="price-change ' + cls + '">' + sign + '$' + Math.abs(t.price_change) +
        ' vs previous scrape</span>';
    }
  }
  return html;
}

function agoText(days) {
  if (days == null) return '';
  if (days < 1) return 'today';
  if (days < 2) return '1 day ago';
  return Math.round(days) + ' days ago';
}

function formatScrapeDate(date) {
  if (!date) return 'date unknown';
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderProvenance() {
  const el = document.getElementById('provenance');
  if (!el) return;
  const total = TRIPS.length;
  const fresh = TRIPS.filter(t => t.fresh).length;
  const shots = TRIPS.filter(t => t.screenshot).length;
  const pct = total ? Math.round(fresh / total * 100) : 0;
  const gen = META && META.generated_date ? META.generated_date : null;
  const maxAge = META && META.fresh_max_age_days ? META.fresh_max_age_days : 3;
  let html = '';
  html += '<span><span class="prov-strong">' + total + '</span> fare observations</span>';
  html += '<span class="prov-sep">•</span>';
  html += '<span class="prov-fresh">Displaying fresh fares only by default</span>';
  html += '<span class="prov-sep">•</span>';
  html += '<span><span class="prov-fresh">' + fresh + '</span> fresh (≤' + maxAge + 'd, ' + pct + '%)</span>';
  html += '<span class="prov-sep">•</span>';
  html += '<span><span class="prov-strong">' + shots + '</span> with screenshot proof 🔍</span>';
  if (gen) {
    html += '<span class="prov-sep">•</span>';
    html += '<span>data built ' + gen + '</span>';
  }
  html += '<span class="prov-sep">•</span>';
  html += '<span style="color:#6b7fa3;">Past dates removed. Each fare shows its scrape date and evidence.</span>';
  el.innerHTML = html;
  el.style.display = 'flex';
}

async function loadTrips() {
  try {
    const resp = await fetch('data/trips.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    TRIPS = await resp.json();
    if (!Array.isArray(TRIPS) || TRIPS.length === 0) throw new Error('fare feed is empty or invalid');
  } catch(e) {
    console.error('Failed to load trips.json:', e);
    const p = document.getElementById('provenance');
    p.className = 'load-error';
    p.style.display = 'block';
    p.textContent = 'Fare data failed to load. Prices are unavailable; no cached or invented values are being shown. (' + e.message + ')';
    throw e;
  }
  try {
    const mresp = await fetch('data/meta.json', { cache: 'no-store' });
    if (mresp.ok) META = await mresp.json();
  } catch(e) {
    console.warn('meta.json not available:', e);
  }
}


// Get unique dates for each direction
function getDates(direction) {
  const dates = new Set();
  TRIPS.filter(t => t.direction === direction).forEach(t => dates.add(t.date));
  return Array.from(dates).sort();
}

function parseTimeToHour(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h + m / 60;
}

function parseDurationToHours(durStr) {
  if (!durStr) return 0;
  const match = durStr.match(/(\d+)h\s*(\d+)?m?/);
  if (!match) return 0;
  return parseInt(match[1]) + (parseInt(match[2] || 0) / 60);
}

// Filter state management with localStorage
const FILTER_STORAGE_KEY = 'amtrak-filters-v2';

function getFilterState() {
  const departEarly = parseFloat(document.getElementById('filter-depart-early').value);
  const arriveLate = parseFloat(document.getElementById('filter-arrive-late').value);
  const overnight = document.getElementById('filter-overnight').checked;
  const includeStale = document.getElementById('filter-stale').checked;
  const maxDuration = parseFloat(document.getElementById('filter-duration').value);
  const priceMin = document.getElementById('filter-price-min').value;
  const priceMax = document.getElementById('filter-price-max').value;
  
  const serviceTypes = [];
  document.querySelectorAll('#service-checkboxes input[type="checkbox"]').forEach(cb => {
    if (cb.checked) serviceTypes.push(cb.value);
  });
  
  return { departEarly, arriveLate, overnight, includeStale, maxDuration, serviceTypes, priceMin, priceMax };
}

function saveFilters() {
  const state = getFilterState();
  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
}

function loadFilters() {
  try {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!saved) return;
    const state = JSON.parse(saved);
    
    if (state.departEarly !== undefined) {
      document.getElementById('filter-depart-early').value = state.departEarly;
      document.getElementById('val-depart-early').textContent = formatHour(state.departEarly);
    }
    if (state.arriveLate !== undefined) {
      document.getElementById('filter-arrive-late').value = state.arriveLate;
      document.getElementById('val-arrive-late').textContent = state.arriveLate === 24 ? '12:00 AM' : formatHour(state.arriveLate);
    }
    if (state.overnight !== undefined) {
      document.getElementById('filter-overnight').checked = state.overnight;
    }
    if (state.includeStale !== undefined) {
      document.getElementById('filter-stale').checked = state.includeStale;
    }
    if (state.maxDuration !== undefined) {
      document.getElementById('filter-duration').value = state.maxDuration;
      document.getElementById('val-duration').textContent = state.maxDuration >= 18 ? '18h (no limit)' : state.maxDuration + 'h';
    }
    if (state.serviceTypes !== undefined) {
      document.querySelectorAll('#service-checkboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = state.serviceTypes.includes(cb.value);
        cb.closest('.checkbox-item').classList.toggle('checked', cb.checked);
      });
    }
    if (state.priceMin !== undefined) {
      document.getElementById('filter-price-min').value = state.priceMin;
    }
    if (state.priceMax !== undefined) {
      document.getElementById('filter-price-max').value = state.priceMax;
    }
  } catch(e) { /* ignore corrupt localStorage */ }
}

function resetFilters() {
  document.getElementById('filter-depart-early').value = 4;
  document.getElementById('val-depart-early').textContent = '4:00 AM';
  document.getElementById('filter-arrive-late').value = 24;
  document.getElementById('val-arrive-late').textContent = '12:00 AM';
  document.getElementById('filter-overnight').checked = false;
  document.getElementById('filter-stale').checked = false;
  document.getElementById('filter-duration').value = 18;
  document.getElementById('val-duration').textContent = '18h (no limit)';
  document.getElementById('filter-price-min').value = '';
  document.getElementById('filter-price-max').value = '';
  document.querySelectorAll('#service-checkboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
    cb.closest('.checkbox-item').classList.add('checked');
  });
  localStorage.removeItem(FILTER_STORAGE_KEY);
  selectedOutIdx = null; selectedRetIdx = null;
  calState.outboundDate = null; calState.returnDate = null;
  renderMatrix(); renderResults();
  if (typeof renderCalendar === 'function') { renderCalendar(); renderCalDetail(); }
}

// Filter WITHOUT price (for matrix priced-out detection)
function filterTripsBase(trips) {
  const state = getFilterState();
  
  return trips.filter(t => {
    // Trust fresh snapshots by default. Stale fares remain available only
    // after the user explicitly opts in.
    if (!state.includeStale && !t.fresh) return false;

    const depHour = parseTimeToHour(t.departure);
    const arrHour = parseTimeToHour(t.arrival);
    const dur = parseDurationToHours(t.duration);
    
    // Time window filters
    if (depHour < state.departEarly) return false;
    if (arrHour > state.arriveLate && state.arriveLate < 24) return false;
    
    // Overnight filter: exclude depart after 10pm or arrive after midnight
    if (state.overnight) {
      if (depHour >= 22) return false;
      // Arrive after midnight = arrival time < departure time (next day) or duration > 12h
      if (dur > 12 || arrHour < depHour) return false;
    }
    
    // Duration filter
    if (state.maxDuration < 18 && dur > state.maxDuration) return false;
    
    // Service type filter
    const svcType = t.service_type || 'other';
    if (!state.serviceTypes.includes(svcType)) return false;
    
    return true;
  });
}

// Full filter including price (for results view and full composition)
function filterTrips(trips) {
  const state = getFilterState();
  
  return filterTripsBase(trips).filter(t => {
    // Price filter (per one-way leg)
    if (state.priceMin && t.price < parseInt(state.priceMin)) return false;
    if (state.priceMax && t.price > parseInt(state.priceMax)) return false;
    return true;
  });
}

function getTripsForDate(direction, date) {
  return TRIPS.filter(t => t.direction === direction && t.date === date);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDow(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatHour(h) {
  if (h === 24 || h === 0) return '12:00 AM';
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:00 ${ampm}`;
}

function getServiceBadge(trip) {
  const svc = trip.service_type || '';
  const name = trip.train_name || '';
  if (svc === 'acela' || name.toLowerCase().includes('acela')) return '<span class="badge acela">Acela</span>';
  if (svc === 'regional' || name.toLowerCase().includes('regional')) return '<span class="badge regional">Regional</span>';
  return '<span class="badge other">' + (name.split(' ')[0] || 'Train') + '</span>';
}

// State
let selectedDepart = null;
let selectedReturn = null;
let selectedOutIdx = null;
let selectedRetIdx = null;

function renderMatrix() {
  const outDates = getDates('nyc_to_dc');
  const retDates = getDates('dc_to_nyc');
  const state = getFilterState();
  const hasPriceMax = state.priceMax && parseInt(state.priceMax) > 0;
  
  // Build price lookup — use base filter (no price) so we can show priced-out cells
  const prices = {};
  const hasTrains = {};
  const pricedOut = {};
  let allPrices = [];
  
  outDates.forEach(od => {
    retDates.forEach(rd => {
      if (rd < od) return;
      const outTripsBase = filterTripsBase(getTripsForDate('nyc_to_dc', od));
      const retTripsBase = filterTripsBase(getTripsForDate('dc_to_nyc', rd));
      const outTrips = filterTrips(getTripsForDate('nyc_to_dc', od));
      const retTrips = filterTrips(getTripsForDate('dc_to_nyc', rd));
      const key = od + '|' + rd;
      
      if (rd === od) {
        // Same-day: only pairs where return departs after outbound arrives
        if (outTripsBase.length > 0 && retTripsBase.length > 0) {
          const validRetBase = retTripsBase.filter(r => {
            return parseTimeToHour(r.departure) > Math.min(...outTripsBase.map(o => parseTimeToHour(o.arrival)));
          });
          if (validRetBase.length > 0) {
            const minOutBase = Math.min(...outTripsBase.map(t => t.price));
            const minRetBase = Math.min(...validRetBase.map(t => t.price));
            const rtBase = minOutBase + minRetBase;
            
            // Check if price-filtered version has options
            const validRet = retTrips.filter(r => {
              return parseTimeToHour(r.departure) > Math.min(...(outTrips.length ? outTrips : outTripsBase).map(o => parseTimeToHour(o.arrival)));
            });
            if (outTrips.length > 0 && validRet.length > 0) {
              const minOut = Math.min(...outTrips.map(t => t.price));
              const minRet = Math.min(...validRet.map(t => t.price));
              prices[key] = minOut + minRet;
              hasTrains[key] = true;
              allPrices.push(minOut + minRet);
            } else {
              // Has trains but all exceed price filter = priced out
              prices[key] = rtBase;
              hasTrains[key] = true;
              pricedOut[key] = true;
            }
          } else {
            hasTrains[key] = false;
          }
        } else {
          hasTrains[key] = false;
        }
      } else {
        if (outTripsBase.length > 0 && retTripsBase.length > 0) {
          const minOutBase = Math.min(...outTripsBase.map(t => t.price));
          const minRetBase = Math.min(...retTripsBase.map(t => t.price));
          const rtBase = minOutBase + minRetBase;
          
          if (outTrips.length > 0 && retTrips.length > 0) {
            const minOut = Math.min(...outTrips.map(t => t.price));
            const minRet = Math.min(...retTrips.map(t => t.price));
            prices[key] = minOut + minRet;
            hasTrains[key] = true;
            allPrices.push(minOut + minRet);
          } else {
            // Has trains but all exceed price filter = priced out
            prices[key] = rtBase;
            hasTrains[key] = true;
            pricedOut[key] = true;
          }
        } else {
          // Check if there were ANY unfiltered trains for these dates
          const rawOut = getTripsForDate('nyc_to_dc', od);
          const rawRet = getTripsForDate('dc_to_nyc', rd);
          hasTrains[key] = rawOut.length > 0 && rawRet.length > 0;
        }
      }
    });
  });
  
  const cheapThresh = allPrices.length > 0 ? Math.min(...allPrices) + (Math.max(...allPrices) - Math.min(...allPrices)) * 0.33 : 100;
  const midThresh = allPrices.length > 0 ? Math.min(...allPrices) + (Math.max(...allPrices) - Math.min(...allPrices)) * 0.66 : 200;
  const bestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
  
  // Determine priced-out threshold from max price filter
  // priced-out = the cheapest RT for that cell exceeds 2x the max one-way price
  const pricedOutThresh = hasPriceMax ? parseInt(state.priceMax) * 2 : null;
  
  // Build table
  let html = '<table><thead><tr><th class="corner">Depart ↓ / Return →</th>';
  retDates.forEach(rd => {
    html += '<th>' + formatDow(rd) + '<br>' + formatDateShort(rd) + '</th>';
  });
  html += '</tr></thead><tbody>';
  
  outDates.forEach(od => {
    html += '<tr><th class="row-header">' + formatDow(od) + ' ' + formatDateShort(od) + '</th>';
    retDates.forEach(rd => {
      const key = od + '|' + rd;
      const price = prices[key];
      const isSelected = selectedDepart === od && selectedReturn === rd;
      
      if (rd < od) {
        html += '<td class="disabled">—</td>';
      } else if (price !== undefined && pricedOut[key]) {
        // Priced out: show price but visually distinguished
        let extra = '';
        if (isSelected) extra += ' selected-cell';
        html += '<td class="priced-out' + extra + '" data-depart="' + od + '" data-return="' + rd + '">$' + price + '</td>';
      } else if (price !== undefined) {
        let cls = 'cheap';
        if (price > midThresh) cls = 'expensive';
        else if (price > cheapThresh) cls = 'mid';
        
        let extra = '';
        if (price === bestPrice) extra = ' best-cell';
        if (isSelected) extra += ' selected-cell';
        
        html += '<td class="' + cls + extra + '" data-depart="' + od + '" data-return="' + rd + '">$' + price + '</td>';
      } else if (hasTrains[key]) {
        // Had trains before filtering, now filtered out = no matches
        html += '<td class="no-match">no match</td>';
      } else {
        html += '<td class="disabled">—</td>';
      }
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  document.getElementById('price-matrix').innerHTML = html;
  
  // Attach click handlers
  document.querySelectorAll('.price-matrix td[data-depart]').forEach(td => {
    td.addEventListener('click', () => {
      selectedDepart = td.dataset.depart;
      selectedReturn = td.dataset.return;
      selectedOutIdx = null;
      selectedRetIdx = null;
      renderMatrix();
      renderResults();
    });
  });
}

function renderResults() {
  if (!selectedDepart || !selectedReturn) {
    document.getElementById('results-section').style.display = 'none';
    return;
  }
  
  document.getElementById('results-section').style.display = 'block';
  document.getElementById('results-title').textContent = 
    'Trains: ' + formatDate(selectedDepart) + ' → ' + formatDate(selectedReturn);
  document.getElementById('outbound-header').textContent = 
    '🔵 Outbound: NYC → DC · ' + formatDate(selectedDepart);
  document.getElementById('return-header').textContent = 
    '🟢 Return: DC → NYC · ' + formatDate(selectedReturn);
  
  const outbound = filterTrips(getTripsForDate('nyc_to_dc', selectedDepart)).sort((a, b) => a.price - b.price);
  const returns = filterTrips(getTripsForDate('dc_to_nyc', selectedReturn)).sort((a, b) => a.price - b.price);

  if (selectedOutIdx === null && outbound.length > 0) selectedOutIdx = 0;
  if (selectedRetIdx === null && returns.length > 0) selectedRetIdx = 0;
  renderTripColumn('outbound-trips', outbound, 'out');
  renderTripColumn('return-trips', returns, 'ret');
  updateRTTotal(outbound, returns);
}

function renderTripColumn(elId, trips, dir) {
  const el = document.getElementById(elId);
  if (trips.length === 0) {
    el.innerHTML = '<div class="no-results">No trains match your filters</div>';
    return;
  }
  
  el.innerHTML = trips.map((t, i) => {
    const dur = t.duration || '';
    const isCheapest = i === 0 ? '<span class="best-deal-badge">Best Price</span>' : '';
    const selIdx = dir === 'out' ? selectedOutIdx : selectedRetIdx;
    const selected = selIdx === i ? ' selected-trip' : '';
    return '<div class="trip-card' + selected + '" role="button" tabindex="0" data-idx="' + i + '" data-dir="' + dir +
      '" aria-pressed="' + (selIdx === i ? 'true' : 'false') + '" aria-label="Select train ' +
      (t.train_number || '') + ', ' + t.departure + ' to ' + t.arrival + ', $' + t.price + '">' +
      '<div class="trip-info">' +
        '<div class="times">' + t.departure + '<span class="arrow">→</span>' + t.arrival + '</div>' +
        '<div class="meta"><span class="operator">' + getServiceBadge(t) + '</span> ' + dur + ' ' + (t.train_number ? '#' + t.train_number : '') + ' ' + isCheapest + '</div>' +
      '</div>' +
      '<div class="trip-price">' + priceMarkup(t) +
        proofMarkup(t) +
      '</div>' +
    '</div>';
  }).join('');
  
  // Click and keyboard handlers
  el.querySelectorAll('.trip-card').forEach(card => {
    const selectCard = () => {
      const idx = parseInt(card.dataset.idx);
      if (card.dataset.dir === 'out') selectedOutIdx = idx;
      else selectedRetIdx = idx;
      renderResults();
    };
    card.addEventListener('click', selectCard);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard();
      }
    });
  });
}

function updateRTTotal(outbound, returns) {
  const totalEl = document.getElementById('rt-total');
  if (selectedOutIdx !== null && selectedRetIdx !== null && outbound[selectedOutIdx] && returns[selectedRetIdx]) {
    const out = outbound[selectedOutIdx];
    const ret = returns[selectedRetIdx];
    totalEl.style.display = 'flex';
    document.getElementById('rt-price').textContent = '$' + (out.price + ret.price);
    document.getElementById('rt-breakdown').textContent = 
      '$' + out.price + ' (' + out.departure + ' out) + $' + ret.price + ' (' + ret.departure + ' back)';
  } else {
    totalEl.style.display = 'none';
  }
}

// Unified re-render with filter save
function onFilterChange() {
  saveFilters();
  selectedOutIdx = null; selectedRetIdx = null;
  renderMatrix(); renderResults();
  renderCalendar(); renderCalDetail();
}

let filterRenderTimer = null;
function scheduleFilterRender() {
  clearTimeout(filterRenderTimer);
  filterRenderTimer = setTimeout(onFilterChange, 90);
}

// Filter listeners
document.getElementById('filter-depart-early').addEventListener('input', e => {
  document.getElementById('val-depart-early').textContent = formatHour(parseInt(e.target.value));
  scheduleFilterRender();
});
document.getElementById('filter-arrive-late').addEventListener('input', e => {
  const v = parseInt(e.target.value);
  document.getElementById('val-arrive-late').textContent = v === 24 ? '12:00 AM' : formatHour(v);
  scheduleFilterRender();
});
document.getElementById('filter-overnight').addEventListener('change', onFilterChange);
document.getElementById('filter-stale').addEventListener('change', onFilterChange);
document.getElementById('filter-duration').addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  document.getElementById('val-duration').textContent = v >= 18 ? '18h (no limit)' : v + 'h';
  scheduleFilterRender();
});
document.querySelectorAll('#service-checkboxes input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    cb.closest('.checkbox-item').classList.toggle('checked', cb.checked);
    scheduleFilterRender();
  });
});
document.getElementById('filter-price-min').addEventListener('input', scheduleFilterRender);
document.getElementById('filter-price-max').addEventListener('input', scheduleFilterRender);
document.getElementById('filter-reset').addEventListener('click', resetFilters);

// Init: load saved filters then render
// Data + calendar init deferred until trips.json loads

// ── CALENDAR PICKER ──
const calState = { outboundDate: null, returnDate: null, viewMonth: null };

function getCalendarMonthRange() {
  const outDates = getDates('nyc_to_dc');
  const retDates = getDates('dc_to_nyc');
  const allDates = [...new Set([...outDates, ...retDates])].sort();
  if (allDates.length === 0) return { start: new Date(), end: new Date() };
  const start = new Date(allDates[0] + 'T12:00:00');
  const end = new Date(allDates[allDates.length - 1] + 'T12:00:00');
  return { start, end };
}

function compatibleRoundTripPrice(outTrips, retTrips, sameDay) {
  let best = null;
  for (const out of outTrips) {
    const outArrival = parseTimeToHour(out.arrival);
    for (const ret of retTrips) {
      if (sameDay && parseTimeToHour(ret.departure) <= outArrival) continue;
      const total = out.price + ret.price;
      if (best === null || total < best) best = total;
    }
  }
  return best;
}

function calendarRoundTripPrices(filteredTrips, selectedOutboundDate = null) {
  const outbound = filteredTrips.filter(t => t.direction === 'nyc_to_dc');
  const returns = filteredTrips.filter(t => t.direction === 'dc_to_nyc');
  const outboundDates = selectedOutboundDate ? [selectedOutboundDate] : [...new Set(outbound.map(t => t.date))];
  const totals = {};
  for (const outDate of outboundDates) {
    const outTrips = outbound.filter(t => t.date === outDate);
    for (const retDate of [...new Set(returns.map(t => t.date))]) {
      if (retDate < outDate) continue;
      const retTrips = returns.filter(t => t.date === retDate);
      const total = compatibleRoundTripPrice(outTrips, retTrips, retDate === outDate);
      if (total === null) continue;
      if (selectedOutboundDate) {
        totals[retDate] = total;
      } else if (!(outDate in totals) || total < totals[outDate]) {
        totals[outDate] = total;
      }
    }
  }
  return totals;
}

function getCalRoundTripPrices(selectedOutboundDate = null) {
  // Phase 1: each outbound date shows its cheapest feasible round trip across
  // all same-day/later return dates. Phase 2/3: each return date shows the
  // total using the selected outbound date. All active filters apply to both legs.
  const filteredTrips = filterTrips(TRIPS);
  const details = calendarRoundTripDetails(filteredTrips, selectedOutboundDate);
  const dates = selectedOutboundDate ? getDates('dc_to_nyc') : getDates('nyc_to_dc');
  const result = {};
  dates.forEach(date => {
    const detail = Object.prototype.hasOwnProperty.call(details, date) ? details[date] : null;
    const total = detail ? detail.price : null;
    result[date] = {
      cheapest: total,
      hasTrain: total !== null,
      pricedOut: false,
      noMatch: total === null,
      olderThan24h: Boolean(detail && detail.olderThan24h),
    };
  });
  return result;
}

function getCalPriceClass(price, allPrices) {
  if (!allPrices.length || price == null) return '';
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min;
  if (range === 0) return 'cal-cheap';
  const rel = (price - min) / range;
  if (rel <= 0.33) return 'cal-cheap';
  if (rel <= 0.66) return 'cal-mid';
  return 'cal-expensive';
}

function initCalendarView() {
  const range = getCalendarMonthRange();
  if (!calState.viewMonth) {
    calState.viewMonth = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  }
}

function renderCalendar() {
  initCalendarView();
  const container = document.getElementById('cal-container');
  const range = getCalendarMonthRange();
  
  // Determine direction for prices based on phase
  const phase = calState.outboundDate ? (calState.returnDate ? 3 : 2) : 1;
  
  // Calendar prices always represent complete round trips.
  const prices = getCalRoundTripPrices(phase >= 2 ? calState.outboundDate : null);
  const allValidPrices = Object.values(prices).filter(p => p.cheapest != null && !p.pricedOut).map(p => p.cheapest);
  
  // Determine how many months to show (2 on desktop, handle with CSS)
  const month1 = new Date(calState.viewMonth);
  const month2 = new Date(calState.viewMonth.getFullYear(), calState.viewMonth.getMonth() + 1, 1);
  
  const minMonth = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  const maxMonth = new Date(range.end.getFullYear(), range.end.getMonth(), 1);
  
  const canPrev = month1 > minMonth;
  const canNext = month2 < maxMonth;
  
  container.innerHTML = renderMonthGrid(month1, prices, allValidPrices, phase, canPrev, true) +
                         renderMonthGrid(month2, prices, allValidPrices, phase, false, canNext);
  
  // Update phase indicator
  updatePhaseIndicator(phase);
  
  // Attach nav handlers
  container.querySelectorAll('.month-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      calState.viewMonth = new Date(calState.viewMonth.getFullYear(), calState.viewMonth.getMonth() - 1, 1);
      renderCalendar();
    });
  });
  container.querySelectorAll('.month-next').forEach(btn => {
    btn.addEventListener('click', () => {
      calState.viewMonth = new Date(calState.viewMonth.getFullYear(), calState.viewMonth.getMonth() + 1, 1);
      renderCalendar();
    });
  });
  
  // Attach date click handlers
  container.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      if (cell.classList.contains('cal-no-data') || cell.classList.contains('cal-past')) return;
      handleCalDateClick(date);
    });
  });
}

function renderMonthGrid(monthDate, prices, allValidPrices, phase, showPrev, showNext) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let html = '<div class="calendar-month">';
  html += '<div class="month-nav">';
  html += showPrev ? '<button class="month-prev">‹</button>' : '<button disabled>‹</button>';
  html += '<span class="month-title">' + monthName + '</span>';
  html += showNext ? '<button class="month-next">›</button>' : '<button disabled>›</button>';
  html += '</div>';
  
  html += '<div class="cal-grid">';
  // Day of week headers
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    html += '<div class="cal-dow">' + d + '</div>';
  });
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-cell empty"></div>';
  }
  
  // Date cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const cellDate = new Date(year, month, day);
    const isPast = cellDate < today;
    const isToday = cellDate.getTime() === today.getTime();
    
    const priceInfo = prices[dateStr];
    const hasData = priceInfo && priceInfo.hasTrain;
    const isSelected = dateStr === calState.outboundDate || dateStr === calState.returnDate;
    const isInRange = calState.outboundDate && calState.returnDate && 
                      dateStr > calState.outboundDate && dateStr < calState.returnDate;
    
    // In phase 2, dates before outbound are disabled
    const beforeOutbound = phase === 2 && calState.outboundDate && dateStr < calState.outboundDate;
    
    let classes = ['cal-cell'];
    if (isPast) classes.push('cal-past');
    else if (!hasData || beforeOutbound) classes.push('cal-no-data');
    else if (priceInfo && priceInfo.pricedOut) classes.push('cal-priced-out');
    else if (priceInfo && priceInfo.noMatch) classes.push('cal-no-data');
    else if (priceInfo && priceInfo.cheapest != null) classes.push(getCalPriceClass(priceInfo.cheapest, allValidPrices));
    if (priceInfo && priceInfo.olderThan24h) classes.push('cal-over-24h');
    
    if (isSelected) classes.push('cal-selected');
    if (isInRange) classes.push('cal-in-range');
    if (isToday) classes.push('cal-today');
    
    // Best price indicator
    if (priceInfo && priceInfo.cheapest != null && !priceInfo.pricedOut && allValidPrices.length > 0 
        && priceInfo.cheapest === Math.min(...allValidPrices)) {
      classes.push('cal-best');
    }
    
    let priceLabel = '';
    if (hasData && priceInfo.cheapest != null) {
      priceLabel = 'RT $' + priceInfo.cheapest;
    } else if (hasData && priceInfo.noMatch) {
      priceLabel = '—';
    }
    
    const dataAttr = (hasData && !isPast && !beforeOutbound && !priceInfo.noMatch) ? ' data-date="' + dateStr + '"' : ' disabled';
    
    html += '<button type="button" class="' + classes.join(' ') + '"' + dataAttr +
      ' aria-label="' + (phase >= 2 ? 'Return ' : 'Outbound ') + monthName + ' ' + day +
      (priceLabel ? ', minimum round trip total $' + priceInfo.cheapest + (priceInfo.olderThan24h ? ', based on a fare scraped over 24 hours ago' : '') : '') + '">';
    html += '<span class="cal-day">' + day + '</span>';
    if (priceLabel) html += '<span class="cal-price">' + priceLabel + '</span>';
    html += '</button>';
  }
  
  html += '</div></div>';
  return html;
}

function handleCalDateClick(date) {
  const phase = calState.outboundDate ? (calState.returnDate ? 3 : 2) : 1;
  
  if (phase === 1) {
    // Select outbound
    calState.outboundDate = date;
    calState.returnDate = null;
    renderCalendar();
    renderCalDetail();
  } else if (phase === 2) {
    // Select return (must be >= outbound)
    if (date < calState.outboundDate) return;
    calState.returnDate = date;
    // Also update the main grid selection
    selectedDepart = calState.outboundDate;
    selectedReturn = calState.returnDate;
    selectedOutIdx = null;
    selectedRetIdx = null;
    renderCalendar();
    renderCalDetail();
    renderMatrix();
    renderResults();
  } else {
    // Phase 3: reset to phase 1 with new date
    calState.outboundDate = date;
    calState.returnDate = null;
    renderCalendar();
    renderCalDetail();
  }
}

function updatePhaseIndicator(phase) {
  const p1 = document.getElementById('phase-1');
  const p2 = document.getElementById('phase-2');
  const p3 = document.getElementById('phase-3');
  const resetBtn = document.getElementById('cal-reset');
  
  p1.className = 'phase-step' + (phase === 1 ? ' active' : ' done');
  p2.className = 'phase-step' + (phase === 2 ? ' active' : (phase === 3 ? ' done' : ''));
  p3.className = 'phase-step' + (phase === 3 ? ' active' : '');
  resetBtn.style.display = phase > 1 ? 'inline-block' : 'none';
}

function renderCalDetail() {
  const panel = document.getElementById('cal-detail-panel');
  
  if (!calState.outboundDate && !calState.returnDate) {
    panel.innerHTML = '';
    return;
  }
  
  let html = '<div class="cal-detail">';
  
  if (calState.outboundDate && !calState.returnDate) {
    // Phase 2: show outbound trains for selected date
    const trips = filterTrips(getTripsForDate('nyc_to_dc', calState.outboundDate)).sort((a,b) => a.price - b.price);
    html += '<div class="cal-detail-header">';
    html += '<span class="cal-detail-title">🔵 Outbound trains: NYC → DC</span>';
    html += '<span class="cal-detail-date">' + formatDate(calState.outboundDate) + '</span>';
    html += '</div>';
    
    if (trips.length === 0) {
      html += '<div class="no-results">No trains match your filters for this date</div>';
    } else {
      html += '<div class="cal-detail-trains">';
      trips.slice(0, 5).forEach((t, i) => {
        const badge = getServiceBadge(t);
        const best = i === 0 ? '<span class="best-deal-badge">Best</span>' : '';
        html += '<div class="trip-card"><div class="trip-info">';
        html += '<div class="times">' + t.departure + '<span class="arrow">→</span>' + t.arrival + '</div>';
        html += '<div class="meta">' + badge + ' ' + t.duration + ' ' + best + '</div>';
        html += '</div><div class="trip-price">' + priceMarkup(t) +
          proofMarkup(t) +
          '</div></div>';
      });
      if (trips.length > 5) {
        html += '<div style="text-align:center;color:#6b7fa3;font-size:12px;padding:8px;">+ ' + (trips.length - 5) + ' more trains</div>';
      }
      html += '</div>';
    }
    html += '<div style="margin-top:12px;font-size:12px;color:#4fc3f7;">Now pick a return date ↑</div>';
  } else if (calState.outboundDate && calState.returnDate) {
    // Phase 3: show both columns (same as results section)
    html += '<div class="cal-detail-header">';
    html += '<span class="cal-detail-title">✅ Round Trip Selected</span>';
    html += '<span class="cal-detail-date">' + formatDate(calState.outboundDate) + ' → ' + formatDate(calState.returnDate) + '</span>';
    html += '</div>';
    
    const outTrips = filterTrips(getTripsForDate('nyc_to_dc', calState.outboundDate)).sort((a,b) => a.price - b.price);
    const retTrips = filterTrips(getTripsForDate('dc_to_nyc', calState.returnDate)).sort((a,b) => a.price - b.price);
    
    const cheapOut = outTrips.length > 0 ? outTrips[0].price : 0;
    const cheapRet = retTrips.length > 0 ? retTrips[0].price : 0;
    const rtTotal = cheapOut + cheapRet;
    
    if (rtTotal > 0) {
      html += '<div style="font-size:14px;color:#66bb6a;font-weight:600;margin-bottom:8px;">';
      html += 'Best round trip: $' + rtTotal + ' ($' + cheapOut + ' out + $' + cheapRet + ' back)';
      html += '</div>';
    }
    html += '<div style="font-size:12px;color:#6b7fa3;">Full train details shown below in the results section ↓</div>';
  }
  
  html += '</div>';
  panel.innerHTML = html;
}

function resetCalendar() {
  calState.outboundDate = null;
  calState.returnDate = null;
  renderCalendar();
  renderCalDetail();
}

// Calendar reset button
document.getElementById('cal-reset').addEventListener('click', resetCalendar);

// Init: load trips data then render everything
loadTrips().then(() => {
  loadFilters();
  renderProvenance();
  renderMatrix();
  renderCalendar();
}).catch(() => {});
