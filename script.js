// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initProfitChart();
  calculateFX();
  initLiveMarketTicker();
});

// --------------------------------------------------------------------------
// 1. Chart.js: Merchant Forex Profit Trajectory
// --------------------------------------------------------------------------
function initProfitChart() {
  const ctx = document.getElementById('profitChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['FY 2023-24 Actual', 'FY 2024-25 Target', 'FY 2024-25 Actual (Delivered)'],
      datasets: [
        {
          label: 'Merchant Forex Profit (₹ Cr)',
          data: [259.83, 265.00, 272.89],
          backgroundColor: [
            'rgba(148, 163, 184, 0.4)', // FY 23-24 Muted
            'rgba(56, 189, 248, 0.4)',  // Target Sky Blue
            'rgba(212, 175, 55, 0.85)'   // Actual Delivered Bullion Gold
          ],
          borderColor: [
            '#94a3b8',
            '#38bdf8',
            '#f5da89'
          ],
          borderWidth: 1.5,
          borderRadius: 6,
          barPercentage: 0.55
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0d172a',
          titleColor: '#f8fafc',
          bodyColor: '#f5da89',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context) {
              return `Profit: ₹${context.raw.toFixed(2)} Crores`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 240,
          max: 285,
          grid: {
            color: 'rgba(255, 255, 255, 0.06)'
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11
            },
            callback: function (val) {
              return '₹' + val + ' Cr';
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#cbd5e1',
            font: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 12,
              weight: 500
            }
          }
        }
      }
    }
  });
}

// --------------------------------------------------------------------------
// LIVE MARKET TICKER
// Uses public reference-rate data in the browser. Quotes are labelled as
// reference/indicative rather than executable dealing prices.
// --------------------------------------------------------------------------
const MARKET_PAIRS = [
  { label: 'USD/INR', base: 'USD', quote: 'INR', decimals: 2 },
  { label: 'EUR/INR', base: 'EUR', quote: 'INR', decimals: 2 },
  { label: 'GBP/INR', base: 'GBP', quote: 'INR', decimals: 2 },
  { label: 'USD/JPY', base: 'USD', quote: 'JPY', decimals: 2 },
  { label: 'EUR/USD', base: 'EUR', quote: 'USD', decimals: 4 },
  { label: 'GBP/USD', base: 'GBP', quote: 'USD', decimals: 4 }
];

function getPairRate(rates, base, quote) {
  const basePerEur = rates[base];
  const quotePerEur = rates[quote];
  if (!basePerEur || !quotePerEur) return null;
  return quote === 'EUR' ? (1 / basePerEur) : quotePerEur / basePerEur;
}

function formatMarketRate(value, decimals) {
  return Number(value).toFixed(decimals);
}

function formatChange(change, isBps = false) {
  if (change === null || Number.isNaN(change)) return '<span class="trend flat">REF</span>';
  const cls = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  const sign = change > 0 ? '+' : '';
  const unit = isBps ? ' bps' : '%';
  return '<span class="trend ' + cls + '">' + sign + change.toFixed(isBps ? 1 : 2) + unit + '</span>';
}

function tickerItemHTML(label, value, change, decimals) {
  const safeValue = value == null ? '—' : formatMarketRate(value, decimals);
  return '<span class="ticker-item"><strong>' + label + '</strong> ' +
    safeValue + ' ' + formatChange(change, false) + '</span>';
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Market data request failed: ' + res.status);
  return res.json();
}

async function fetchECBReferenceRates() {
  const url = 'https://cdn.jsdelivr.net/gh/AllRates-Today/central-bank-exchange-rates@main/data/ecb/latest.json';
  const payload = await fetchJson(url);
  const rates = { EUR: 1 };
  (payload.rates || []).forEach(r => { rates[r.quote] = Number(r.value); });
  return { date: payload.date || payload.as_of || 'latest', rates };
}

async function initLiveMarketTicker() {
  const host = document.getElementById('liveMarketTicker');
  const clone = document.getElementById('liveMarketTickerClone');
  if (!host || !clone) return;

  try {
    const current = await fetchECBReferenceRates();

    let previous = null;
    try {
      const historyUrl = 'https://cdn.jsdelivr.net/gh/AllRates-Today/central-bank-exchange-rates@main/data/ecb/daily/' +
        current.date + '.json';
      previous = await fetchJson(historyUrl);
    } catch (_) {
      // Previous-day data is optional; ticker still shows latest reference rates.
    }

    const previousRates = { EUR: 1 };
    if (previous && previous.rates) {
      previous.rates.forEach(r => { previousRates[r.quote] = Number(r.value); });
    }

    const items = MARKET_PAIRS.map(pair => {
      const value = getPairRate(current.rates, pair.base, pair.quote);
      const prior = getPairRate(previousRates, pair.base, pair.quote);
      const change = value != null && prior != null && prior !== 0 ? ((value / prior) - 1) * 100 : null;
      return tickerItemHTML(pair.label, value, change, pair.decimals);
    });

    // Add a reference-rate date so the strip is transparent about the data source.
    items.push('<span class="ticker-item"><strong>ECB REF</strong> ' + current.date +
      ' <span class="trend flat">REFERENCE</span></span>');

    host.innerHTML = items.join('');
    clone.innerHTML = host.innerHTML;
  } catch (error) {
    host.innerHTML =
      '<span class="ticker-item"><strong>MARKETS</strong> Reference rates unavailable ' +
      '<span class="trend down">RETRY</span></span>';
    clone.innerHTML = host.innerHTML;
    console.error(error);
  }
}

// --------------------------------------------------------------------------
// 2. Interactive Merchant FX Spread & Profit Calculator
// --------------------------------------------------------------------------
const currencyInterbankRates = {
  USDINR: 83.92,
  EURINR: 91.05,
  GBPINR: 107.15,
  JPYINR: 0.5510
};

// These are fallback/indicative values for the interactive calculator.
// The live ticker above is sourced separately from current reference data.

function updateSpreadDisplay(val) {
  document.getElementById('spreadDisplay').textContent = `${parseFloat(val).toFixed(1)} Paise`;
}

function calculateFX() {
  const pair = document.getElementById('currencyPair').value;
  const baseRate = currencyInterbankRates[pair] || 83.92;
  const volume = parseFloat(document.getElementById('dealVolume').value) || 0;
  const spreadPaise = parseFloat(document.getElementById('spreadPips').value) || 0;

  // Spread in INR (1 Paisa = 0.01 INR)
  const spreadInINR = spreadPaise / 100;
  
  // Quoted merchant rate (for an export flow/buy cover)
  const quotedRate = (baseRate - spreadInINR).toFixed(4);
  
  // Gross spread captured = volume * spreadInINR
  const spreadCaptured = volume * spreadInINR;
  
  // Total transaction turnover in INR
  const totalTurnoverINR = volume * baseRate;

  // Formatting values
  document.getElementById('quoteRate').textContent = quotedRate;
  document.getElementById('capturedSpread').textContent = formatINR(spreadCaptured);

  // Turnover in Crores (1 Cr = 10,000,000)
  const turnoverCr = (totalTurnoverINR / 10000000).toFixed(2);
  document.getElementById('totalTurnover').textContent = `₹${turnoverCr} Cr`;

  // Annualized Yield on 50 repeat cycles
  const annualizedProfit = spreadCaptured * 50;
  if (annualizedProfit >= 10000000) {
    document.getElementById('annualizedYield').textContent = `₹${(annualizedProfit / 10000000).toFixed(2)} Cr`;
  } else {
    document.getElementById('annualizedYield').textContent = `₹${(annualizedProfit / 100000).toFixed(2)} Lakhs`;
  }
}

function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

// --------------------------------------------------------------------------
// 3. Contact Modal & Copy Utilities
// --------------------------------------------------------------------------
function openContactModal() {
  const modal = document.getElementById('contactModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeContactModal() {
  const modal = document.getElementById('contactModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

window.addEventListener('click', (e) => {
  const modal = document.getElementById('contactModal');
  if (e.target === modal) {
    closeContactModal();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeContactModal();
  }
});

function copyToClipboard(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = `<span style="color: #10b981;">✓ Copied!</span>`;
    setTimeout(() => {
      btnElement.innerHTML = originalHTML;
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 2000);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
}

