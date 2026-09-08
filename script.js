// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initProfitChart();
  calculateFX();
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
// 2. Interactive Merchant FX Spread & Profit Calculator
// --------------------------------------------------------------------------
const currencyInterbankRates = {
  USDINR: 83.92,
  EURINR: 91.05,
  GBPINR: 107.15,
  JPYINR: 0.5510
};

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

