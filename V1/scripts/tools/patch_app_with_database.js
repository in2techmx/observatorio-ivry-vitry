const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../web/app.js');
let appContent = fs.readFileSync(appPath, 'utf8');

const allPosts = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'all_posts_embedded.json'), 'utf8'));
const summaryAnnual = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../data/sentiment_2026/summary_annual_2026.json'), 'utf8'));

// Trouver le début de la section 3.2
const startMarker = '// ====================================================================\n// 3.2. HISTORIQUE ANNUEL DE SENTIMENT 2026 (GIT-AS-A-DATABASE)\n// ====================================================================';
const endMarker = '// ====================================================================\n// 4. ASISTENTE CONVERSACIONAL AGÉNTICO (PESTAÑA 5)\n// ====================================================================';

const startIndex = appContent.indexOf(startMarker);
const endIndex = appContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const newSection32 = `${startMarker}

const HISTORICAL_SUMMARY_2026 = ${JSON.stringify(summaryAnnual, null, 2)};

const HISTORICAL_POSTS_DATABASE_2026 = ${JSON.stringify(allPosts, null, 2)};

function getHistoryMonthPosts(network, monthKey) {
  const m = monthKey || APP_STATE.historyMonth || '2026-09';
  const net = network || APP_STATE.historyNetwork || 'consolidated';

  let list = HISTORICAL_POSTS_DATABASE_2026.filter(p => p.monthKey === m);
  if (net !== 'consolidated') {
    list = list.filter(p => p.network === net);
  }
  return list;
}

function setSentimentMode(mode) {
  APP_STATE.sentimentMode = mode;
  const btnLive = document.getElementById('btn-mode-live');
  const btnHistory = document.getElementById('btn-mode-history');
  const viewLive = document.getElementById('view-sentiment-live');
  const viewHistory = document.getElementById('view-sentiment-history');

  if (mode === 'live') {
    if (btnLive) btnLive.classList.add('active');
    if (btnHistory) btnHistory.classList.remove('active');
    if (viewLive) viewLive.classList.remove('hidden');
    if (viewHistory) viewHistory.classList.add('hidden');
  } else {
    if (btnLive) btnLive.classList.remove('active');
    if (btnHistory) btnHistory.classList.add('active');
    if (viewLive) viewLive.classList.add('hidden');
    if (viewHistory) viewHistory.classList.remove('hidden');
    initHistoryArchive();
  }
}

function initHistoryArchive() {
  renderHistoryMonthsTrack();
  loadHistoryMonth(APP_STATE.historyMonth || '2026-09');
}

function setHistoryNetwork(network) {
  APP_STATE.historyNetwork = network;
  const pills = document.querySelectorAll('#history-network-pills .net-pill');
  pills.forEach(p => {
    if (p.getAttribute('onclick') && p.getAttribute('onclick').includes(network)) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
  loadHistoryMonth(APP_STATE.historyMonth || '2026-09');
}

function renderHistoryMonthsTrack() {
  const track = document.getElementById('history-months-track');
  if (!track) return;

  const timeline = HISTORICAL_SUMMARY_2026.monthlyTimeline || [];
  const html = timeline.map(m => {
    const isSelected = m.monthKey === APP_STATE.historyMonth;
    let polColor = '#38bdf8';
    if (m.avgPolarity > 0.1) polColor = '#34d399';
    else if (m.avgPolarity < -0.1) polColor = '#f87171';

    return \`
      <button class="history-month-pill \${isSelected ? 'active' : ''}" 
              id="pill-month-\${m.monthKey}" 
              onclick="selectHistoryMonth('\${m.monthKey}')">
        <span class="pill-name">\${m.monthLabel.split(' ')[0]}</span>
        <span class="pill-meta">\${m.totalPosts} posts</span>
        <span class="pill-pol-indicator" style="background-color: \${polColor}; width: 100%; height: 3px; display: block; margin-top: 3px; border-radius: 2px;"></span>
      </button>
    \`;
  }).join('');

  track.innerHTML = html;
}

function selectHistoryMonth(monthKey) {
  APP_STATE.historyMonth = monthKey;
  const pills = document.querySelectorAll('.history-month-pill');
  pills.forEach(p => p.classList.remove('active'));
  const activePill = document.getElementById('pill-month-' + monthKey);
  if (activePill) activePill.classList.add('active');

  loadHistoryMonth(monthKey);
}

function loadHistoryMonth(monthKey) {
  const m = monthKey || '2026-09';
  const net = APP_STATE.historyNetwork || 'consolidated';

  const monthMeta = (HISTORICAL_SUMMARY_2026.monthlyTimeline || []).find(item => item.monthKey === m) || {
    monthKey: m,
    monthLabel: m,
    totalPosts: 0,
    avgPolarity: 0,
    polarityLabel: 'Neutre',
    ratio: { positivePct: 0, neutralPct: 0, negativePct: 0 },
    urgencyCount: 0,
    urgencyRate: 0,
    topCategory: 'NON_DÉFINI',
    keyDriverEvent: 'Aucun événement majeur répertorié.'
  };

  const bannerTitle = document.getElementById('hist-driver-title');
  const bannerDesc = document.getElementById('hist-driver-desc');
  if (bannerTitle) bannerTitle.innerText = monthMeta.monthLabel + ' 2026';
  if (bannerDesc) bannerDesc.innerText = monthMeta.keyDriverEvent;

  const posts = getHistoryMonthPosts(net, m);

  renderHistoryStripMetrics(posts, monthMeta);
  renderHistoryPostsGrid(posts);
}

function renderHistoryStripMetrics(posts, monthMeta) {
  let count = posts.length;
  let totalScore = 0;
  let countPos = 0;
  let countNeu = 0;
  let countNeg = 0;
  let countUrgent = 0;
  const catTally = {};

  posts.forEach(p => {
    const s = p.laya.sentimentScore;
    totalScore += s;
    if (s > 0.1) countPos++;
    else if (s < -0.1) countNeg++;
    else countNeu++;

    if (p.laya.urgencyFlag) countUrgent++;
    const cat = p.laya.primaryCategory || 'ODOR';
    catTally[cat] = (catTally[cat] || 0) + 1;
  });

  const avg = count > 0 ? (totalScore / count) : 0;
  const pctPos = count > 0 ? Math.round((countPos / count) * 100) : 0;
  const pctNeu = count > 0 ? Math.round((countNeu / count) * 100) : 0;
  const pctNeg = count > 0 ? Math.max(0, 100 - pctPos - pctNeu) : 0;
  const urgRate = count > 0 ? Math.round((countUrgent / count) * 100) : 0;

  const sortedCats = Object.entries(catTally).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats.length > 0 ? sortedCats[0][0] : monthMeta.topCategory;

  const countEl = document.getElementById('hist-count');
  if (countEl) countEl.innerText = count;

  const monthEl = document.getElementById('hist-active-month');
  if (monthEl) monthEl.innerText = 'Période : ' + (monthMeta.monthLabel || monthMeta.monthKey);

  const polarityEl = document.getElementById('hist-polarity');
  if (polarityEl) {
    polarityEl.innerText = (avg > 0 ? '+' : '') + avg.toFixed(2);
    if (avg > 0.1) polarityEl.style.color = '#34d399';
    else if (avg < -0.1) polarityEl.style.color = '#f87171';
    else polarityEl.style.color = '#38bdf8';
  }

  const polarityLabelEl = document.getElementById('hist-polarity-label');
  if (polarityLabelEl) {
    if (avg > 0.1) polarityLabelEl.innerText = 'Tonalité Favorable';
    else if (avg < -0.1) polarityLabelEl.innerText = 'Tension Sociale Détectée';
    else polarityLabelEl.innerText = 'Neutre / Équilibré';
  }

  const urgencyEl = document.getElementById('hist-urgency');
  if (urgencyEl) {
    urgencyEl.innerText = urgRate + '%';
    urgencyEl.style.color = urgRate > 20 ? '#f87171' : '#38bdf8';
  }

  const topCatEl = document.getElementById('hist-top-category');
  if (topCatEl) topCatEl.innerText = 'Thème : ' + topCat;

  const pctPosEl = document.getElementById('hist-pct-pos');
  if (pctPosEl) pctPosEl.innerText = pctPos + '%';

  const pctNeuEl = document.getElementById('hist-pct-neu');
  if (pctNeuEl) pctNeuEl.innerText = pctNeu + '%';

  const pctNegEl = document.getElementById('hist-pct-neg');
  if (pctNegEl) pctNegEl.innerText = pctNeg + '%';

  const segPos = document.getElementById('hist-seg-pos');
  if (segPos) segPos.style.width = pctPos + '%';

  const segNeu = document.getElementById('hist-seg-neu');
  if (segNeu) segNeu.style.width = pctNeu + '%';

  const segNeg = document.getElementById('hist-seg-neg');
  if (segNeg) segNeg.style.width = pctNeg + '%';
}

function renderHistoryPostsGrid(posts) {
  const grid = document.getElementById('history-posts-grid');
  if (!grid) return;

  if (!posts || posts.length === 0) {
    grid.innerHTML = \`
      <div class="social-loading-state">
        <p>Aucune publication archivée pour ce réseau et cette période dans la base Git.</p>
        <button class="social-pill" onclick="setHistoryNetwork('consolidated')">Afficher tous les réseaux</button>
      </div>
    \`;
    return;
  }

  const categoryLabels = {
    ODOR: '💨 Odeurs & Émanations',
    HEALTH: '🩺 Santé & Épidémiologie',
    NOISE: '🔊 Bruit & Nuisances',
    GOVERNANCE: '🏛️ Gouvernance & SYCTOM',
    TRAFFIC: '🚛 Trafic Poids Lourds',
    PROPERTY_VALUE: '📉 Valeur Immobilière',
    INFRASTRUCTURE: '🏗️ Travaux & Filtres DeNOx',
    UNCLASSIFIED: '🌱 Thème Citoyen Général'
  };

  const cardsHtml = posts.map(item => {
    const authorName = escapeHtmlChars(item.author || 'Citoyen');
    const handle = escapeHtmlChars(item.handle || 'utilisateur');
    const postUrl = item.url || '#';
    const dateFormatted = formatSocialDate(item.date);
    const laya = item.laya || {};
    const s = laya.sentimentScore !== undefined ? laya.sentimentScore : 0;

    let polarityBadgeClass = 'neu';
    let polarityIcon = '⚪';
    let polarityLabel = 'Neutre';

    if (s > 0.1) {
      polarityBadgeClass = 'pos';
      polarityIcon = '🟢';
      polarityLabel = 'Positif';
    } else if (s < -0.1) {
      polarityBadgeClass = 'neg';
      polarityIcon = '🔴';
      polarityLabel = 'Négatif';
    }

    const catLabel = categoryLabels[laya.primaryCategory] || ('🌱 ' + (laya.primaryCategory || 'Général'));
    const urgencyBadge = laya.urgencyFlag 
      ? '<span class=\"laya-badge-urgency\">⚠️ Alerte Urgence</span>' 
      : '';

    let netBadgeHtml = '<span class=\"net-badge net-badge-mastodon\">🐘 Mastodon</span>';
    if (item.network === 'bluesky') {
      netBadgeHtml = '<span class=\"net-badge net-badge-bluesky\">🦋 Bluesky</span>';
    } else if (item.network === 'debats_citoyens') {
      netBadgeHtml = '<span class=\"net-badge net-badge-debats\">🏛️ Débats Citoyens</span>';
    }

    const bodyHtml = sanitizeSocialContent(item.content || item.plainText || '');

    return \`
      <article class="social-card">
        <div class="sc-header">
          <div class="sc-author">
            <div class="sc-author-meta">
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 2px;">
                <span class="sc-display-name" title="\${authorName}">\${authorName}</span>
                \${netBadgeHtml}
              </div>
              <a href="\${postUrl}" target="_blank" rel="noopener noreferrer" class="sc-handle">@\${handle}</a>
            </div>
          </div>
          <time class="sc-date">\${dateFormatted}</time>
        </div>
        <div class="sc-body">
          \${bodyHtml}
        </div>
        <div class="sc-laya-inference">
          <div class="sc-laya-top">
            <span class="laya-badge-polarity \${polarityBadgeClass}">
              \${polarityIcon} \${polarityLabel} (\${s > 0 ? '+' : ''}\${s.toFixed(2)})
            </span>
            <span class="laya-badge-category">
              \${catLabel}
            </span>
            \${urgencyBadge}
          </div>
          <div class="sc-laya-meta">
            <span>⚡ Latence : <strong>\${laya.processingTimeMs || 1} ms</strong></span>
            <span>🔒 Sceau : <code title="\${laya.auditSignature || ''}">\${(laya.auditSignature || 'sig_in2tech').slice(0, 10)}...</code></span>
            <a href="\${postUrl}" target="_blank" rel="noopener noreferrer" class="sc-source-link">🔗 Source officielle</a>
          </div>
        </div>
      </article>
    \`;
  }).join('');

  grid.innerHTML = cardsHtml;
}

`;

appContent = appContent.substring(0, startIndex) + newSection32 + appContent.substring(endIndex);

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('Successfully patched app.js with dynamic database of ' + allPosts.length + ' posts!');
