function fareMathParseTimeToHour(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour + minute / 60;
}

function cheapestRoundTripDetail(trips, outboundDate, returnDate) {
  const outbound = trips.filter(t => t.direction === 'nyc_to_dc' && t.date === outboundDate);
  const returns = trips.filter(t => t.direction === 'dc_to_nyc' && t.date === returnDate);
  let best = null;
  for (const out of outbound) {
    for (const ret of returns) {
      if (returnDate === outboundDate && fareMathParseTimeToHour(ret.departure) <= fareMathParseTimeToHour(out.arrival)) continue;
      const price = out.price + ret.price;
      if (best === null || price < best.price) {
        best = {
          price,
          olderThan24h: Number(out.scrape_age_days) > 1 || Number(ret.scrape_age_days) > 1,
        };
      }
    }
  }
  return best;
}

function cheapestRoundTrip(trips, outboundDate, returnDate) {
  const detail = cheapestRoundTripDetail(trips, outboundDate, returnDate);
  return detail ? detail.price : null;
}

function calendarRoundTripDetails(trips, selectedOutboundDate = null) {
  const outboundDates = [...new Set(trips.filter(t => t.direction === 'nyc_to_dc').map(t => t.date))].sort();
  const returnDates = [...new Set(trips.filter(t => t.direction === 'dc_to_nyc').map(t => t.date))].sort();
  const result = {};
  if (selectedOutboundDate) {
    for (const returnDate of returnDates) {
      if (returnDate < selectedOutboundDate) continue;
      result[returnDate] = cheapestRoundTripDetail(trips, selectedOutboundDate, returnDate);
    }
    return result;
  }
  for (const outboundDate of outboundDates) {
    const details = returnDates
      .filter(returnDate => returnDate >= outboundDate)
      .map(returnDate => cheapestRoundTripDetail(trips, outboundDate, returnDate))
      .filter(Boolean);
    result[outboundDate] = details.length
      ? details.reduce((best, detail) => detail.price < best.price ? detail : best)
      : null;
  }
  return result;
}

function calendarRoundTripPrices(trips, selectedOutboundDate = null) {
  const details = calendarRoundTripDetails(trips, selectedOutboundDate);
  return Object.fromEntries(Object.entries(details).map(([date, detail]) => [date, detail ? detail.price : null]));
}

if (typeof module !== 'undefined') module.exports = {
  parseTimeToHour: fareMathParseTimeToHour,
  cheapestRoundTrip,
  calendarRoundTripPrices,
  calendarRoundTripDetails,
};
