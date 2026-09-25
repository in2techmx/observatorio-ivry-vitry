const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../web/app.js');
let appContent = fs.readFileSync(appPath, 'utf8');

const allPosts = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'all_posts_embedded.json'), 'utf8'));

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

const HISTORICAL_SUMMARY_2026 = {
  projectId: "PRJ-OBS-IVRY-VITRY-V1",
  year: 2026,
  coverage: "2026-01 à 2026-09",
  totalPosts: 54,
  monthlyTimeline: [
    {
      monthKey: "2026-01",
      monthLabel: "Janvier 2026",
      totalPosts: 6,
      avgPolarity: -0.142,
      polarityLabel: "Tension / Négatif",
      ratio: { positivePct: 0, neutralPct: 67, negativePct: 33 },
      urgencyCount: 0,
      urgencyRate: 0,
      topCategory: "ODOR",
      keyDriverEvent: "Bilan annuel du SYCTOM et revendication d'audit citoyen par le Collectif 3R.",
      byNetwork: { mastodon: 3, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-02",
      monthLabel: "Février 2026",
      totalPosts: 6,
      avgPolarity: -0.217,
      polarityLabel: "Tension / Négatif",
      ratio: { positivePct: 0, neutralPct: 67, negativePct: 33 },
      urgencyCount: 0,
      urgencyRate: 0,
      topCategory: "ODOR",
      keyDriverEvent: "Débats budgétaires métropolitains et alertes de particules fines en conditions anticycloniques.",
      byNetwork: { mastodon: 3, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-03",
      monthLabel: "Mars 2026",
      totalPosts: 6,
      avgPolarity: 0.042,
      polarityLabel: "Neutre / Équilibré",
      ratio: { positivePct: 17, neutralPct: 50, negativePct: 33 },
      urgencyCount: 2,
      urgencyRate: 33.3,
      topCategory: "GOVERNANCE",
      keyDriverEvent: "Grève et blocage ponctuel de l'usine d'Ivry : déviation des flux et inquiétudes d'accumulation.",
      byNetwork: { mastodon: 3, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-04",
      monthLabel: "Avril 2026",
      totalPosts: 5,
      avgPolarity: 0.000,
      polarityLabel: "Neutre / Équilibré",
      ratio: { positivePct: 40, neutralPct: 20, negativePct: 40 },
      urgencyCount: 1,
      urgencyRate: 20.0,
      topCategory: "ODOR",
      keyDriverEvent: "Déploiement des micro-capteurs Airparif sous le panache et retours des premières chaleurs.",
      byNetwork: { mastodon: 2, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-05",
      monthLabel: "Mai 2026",
      totalPosts: 6,
      avgPolarity: -0.267,
      polarityLabel: "Tension / Négatif",
      ratio: { positivePct: 0, neutralPct: 50, negativePct: 50 },
      urgencyCount: 1,
      urgencyRate: 16.7,
      topCategory: "GOVERNANCE",
      keyDriverEvent: "Demande conjointe des maires d'Ivry et Vitry pour une Commission de Suivi de Site (CSS) extraordinaire.",
      byNetwork: { mastodon: 3, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-06",
      monthLabel: "Juin 2026",
      totalPosts: 6,
      avgPolarity: -0.650,
      polarityLabel: "Tension Critique",
      ratio: { positivePct: 0, neutralPct: 17, negativePct: 83 },
      urgencyCount: 3,
      urgencyRate: 50.0,
      topCategory: "ODOR",
      keyDriverEvent: "Épisode caniculaire critique : pic de plaintes pour odeurs nauséabondes et alertes respiratoires.",
      byNetwork: { mastodon: 3, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-07",
      monthLabel: "Juillet 2026",
      totalPosts: 6,
      avgPolarity: 0.167,
      polarityLabel: "Tonalité Globale Favorable",
      ratio: { positivePct: 50, neutralPct: 33, negativePct: 17 },
      urgencyCount: 0,
      urgencyRate: 0,
      topCategory: "INFRASTRUCTURE",
      keyDriverEvent: "Pose des nouveaux filtres catalytiques DeNOx et raccordement du chauffage urbain CPCU.",
      byNetwork: { mastodon: 3, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-08",
      monthLabel: "Août 2026",
      totalPosts: 6,
      avgPolarity: 0.133,
      polarityLabel: "Tonalité Globale Favorable",
      ratio: { positivePct: 33, neutralPct: 50, negativePct: 17 },
      urgencyCount: 0,
      urgencyRate: 0,
      topCategory: "GOVERNANCE",
      keyDriverEvent: "Trêve estivale : baisse de 40% des volumes de déchets et apaisement temporaire des tensions.",
      byNetwork: { mastodon: 3, bluesky: 2, debats_citoyens: 1 }
    },
    {
      monthKey: "2026-09",
      monthLabel: "Septembre 2026",
      totalPosts: 7,
      avgPolarity: -0.529,
      polarityLabel: "Tension / Négatif",
      ratio: { positivePct: 14, neutralPct: 14, negativePct: 72 },
      urgencyCount: 2,
      urgencyRate: 28.6,
      topCategory: "HEALTH",
      keyDriverEvent: "Rentrée scolaire : mobilisation des parents d'élèves sur les dioxines et réunion publique municipale.",
      byNetwork: { mastodon: 4, bluesky: 2, debats_citoyens: 1 }
    }
  ]
};

// Base de Données intégrée (54 publications de Janvier à Septembre 2026)
const HISTORICAL_POSTS_DATABASE_2026 = ${JSON.stringify(allPosts, null, 2)};

function setSentimentMode(mode) {
  APP_STATE.sentimentMode = mode;
  const btnLive = document.getElementById('btn-mode-live');
  const btnHist = document.getElementById('btn-mode-history');
  const viewLive = document.getElementById('view-sentiment-live');
  const viewHist = document.getElementById('view-sentiment-history');

  if (mode === 'live') {
    if (btnLive) btnLive.classList.add('active');
    if (btnHist) btnHist.classList.remove('active');
    if (viewLive) viewLive.classList.remove('hidden');
    if (viewHist) viewHist.classList.add('hidden');
  } else {
    if (btnLive) btnLive.classList.remove('active');
    if (btnHist) btnHist.classList.add('active');
    if (viewLive) viewLive.classList.add('hidden');
    if (viewHist) viewHist.classList.remove('hidden');
    initHistoryArchive();
  }
}

function initHistoryArchive() {
  renderHistoryMonthsTrack(APP_STATE.historyMonth || '2026-09');
  loadHistoryMonth(APP_STATE.historyMonth || '2026-09', APP_STATE.historyNetwork || 'consolidated');
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
  loadHistoryMonth(APP_STATE.historyMonth || '2026-09', network);
}

function selectHistoryMonth(monthKey) {
  APP_STATE.historyMonth = monthKey;
  renderHistoryMonthsTrack(monthKey);
  loadHistoryMonth(monthKey, APP_STATE.historyNetwork || 'consolidated');
}

function renderHistoryMonthsTrack(activeMonthKey) {
  const track = document.getElementById('history-months-track');
  if (!track) return;

  const months = HISTORICAL_SUMMARY_2026.monthlyTimeline;
  track.innerHTML = months.map(m => {
    const isActive = m.monthKey === activeMonthKey;
    const scoreColor = m.avgPolarity > 0.05 ? '#34d399' : (m.avgPolarity < -0.05 ? '#f87171' : '#38bdf8');
    const scoreSign = m.avgPolarity > 0 ? '+' : '';
    const scoreDisplay = scoreSign + m.avgPolarity.toFixed(2);

    return '<div class=\"history-month-pill ' + (isActive ? 'active' : '') + '\" onclick=\"selectHistoryMonth(\\'' + m.monthKey + '\\')\">' +
      '<span class=\"h-month-name\">' + m.monthLabel.split(' ')[0] + '</span>' +
      '<span class=\"h-month-score\" style=\"color: ' + scoreColor + ';\">' + scoreDisplay + '</span>' +
      '<span class=\"h-month-posts\">' + m.totalPosts + ' posts</span>' +
    '</div>';
  }).join('');
}

function getHistoryMonthPosts(network, monthKey) {
  let list = HISTORICAL_POSTS_DATABASE_2026.filter(p => p.monthKey === monthKey);
  if (network && network !== 'consolidated') {
    list = list.filter(p => p.network === network);
  }
  return list;
}

function loadHistoryMonth(monthKey, network) {
  const grid = document.getElementById('history-posts-grid');
  if (!grid) return;

  const mKey = monthKey || APP_STATE.historyMonth || '2026-09';
  const net = network || APP_STATE.historyNetwork || 'consolidated';

  const mMeta = HISTORICAL_SUMMARY_2026.monthlyTimeline.find(m => m.monthKey === mKey) || HISTORICAL_SUMMARY_2026.monthlyTimeline[8];

  // 1. Mise à jour de la bannière de synthèse
  const driverTitle = document.getElementById('hist-driver-title');
  if (driverTitle) {
    const polColor = mMeta.avgPolarity < -0.1 ? '#f87171' : (mMeta.avgPolarity > 0.1 ? '#34d399' : '#38bdf8');
    driverTitle.innerHTML = mMeta.monthLabel + ' &bull; <span style=\"color: ' + polColor + '\">' + mMeta.polarityLabel + '</span>';
  }

  const driverDesc = document.getElementById('hist-driver-desc');
  if (driverDesc) driverDesc.innerText = mMeta.keyDriverEvent;

  // 2. Récupération instantanée des posts
  const posts = getHistoryMonthPosts(net, mKey);

  // 3. Calcul des statistiques
  let totalScore = 0;
  let countPos = 0;
  let countNeu = 0;
  let countNeg = 0;
  let countUrgent = 0;

  posts.forEach(p => {
    const s = (p.laya && typeof p.laya.sentimentScore === 'number') ? p.laya.sentimentScore : 0;
    totalScore += s;
    if (s > 0.1) countPos++;
    else if (s < -0.1) countNeg++;
    else countNeu++;

    if (p.laya && p.laya.urgencyFlag) countUrgent++;
  });

  const total = posts.length;
  const avg = total > 0 ? (totalScore / total) : mMeta.avgPolarity;
  const pctPos = total > 0 ? Math.round((countPos / total) * 100) : mMeta.ratio.positivePct;
  const pctNeu = total > 0 ? Math.round((countNeu / total) * 100) : mMeta.ratio.neutralPct;
  const pctNeg = total > 0 ? Math.max(0, 100 - pctPos - pctNeu) : mMeta.ratio.negativePct;
  const urgencyRate = total > 0 ? Math.round((countUrgent / total) * 100) : mMeta.urgencyRate;

  // 4. Mise à jour du ruban de KPIs
  const countEl = document.getElementById('hist-count');
  if (countEl) countEl.innerText = total;

  const activeMonthEl = document.getElementById('hist-active-month');
  if (activeMonthEl) activeMonthEl.innerText = 'Période : ' + mMeta.monthLabel + ' &bull; Source : ' + net.toUpperCase();

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
    else polarityLabelEl.innerText = 'Tonalité Neutre / Équilibrée';
  }

  const urgencyEl = document.getElementById('hist-urgency');
  if (urgencyEl) {
    urgencyEl.innerText = urgencyRate + '%';
    urgencyEl.style.color = urgencyRate > 0 ? '#f87171' : '#34d399';
  }

  const topCatEl = document.getElementById('hist-top-category');
  if (topCatEl) topCatEl.innerText = 'Thème : ' + mMeta.topCategory;

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

  // 5. Rendu des cartes de posts historiques
  renderHistoryCards(posts, net);
}

function renderHistoryCards(posts, currentNetwork) {
  const grid = document.getElementById('history-posts-grid');
  if (!grid) return;

  if (!posts || posts.length === 0) {
    grid.innerHTML = '<div class=\"social-loading-state\">' +
      '<p>Aucune publication archivée pour ce filtre dans ce mois.</p>' +
      '<button class=\"social-pill\" onclick=\"setHistoryNetwork(\\'consolidated\\')\">Afficher toutes les plateformes</button>' +
    '</div>';
    return;
  }

  const categoryLabels = {
    ODOR: '👃 Odeurs & Fumées',
    HEALTH: '🏥 Santé & Dioxines',
    NOISE: '🔊 Nuisances Sonores',
    GOVERNANCE: '🏛️ Gouvernance & Syctom',
    TRAFFIC: '🚚 Trafic & Logistique',
    PROPERTY_VALUE: '🏡 Impact Foncier'
  };

  const cardsHtml = posts.map(post => {
    const authorName = escapeHtmlChars(post.author || 'Citoyen');
    const handle = escapeHtmlChars(post.handle || '');
    const postUrl = post.url || '#';
    const dateFormatted = formatSocialDate(post.date);
    const laya = post.laya || {};

    let netBadgeHtml = '';
    if (post.network === 'mastodon') {
      netBadgeHtml = '<span class=\"net-badge net-badge-mastodon\">🐘 Mastodon</span>';
    } else if (post.network === 'bluesky') {
      netBadgeHtml = '<span class=\"net-badge net-badge-bluesky\">🦋 Bluesky</span>';
    } else {
      netBadgeHtml = '<span class=\"net-badge net-badge-debats\">🏛️ Débat Citoyen</span>';
    }

    let polarityBadgeClass = 'neu';
    let polarityIcon = '⚪';
    let polarityLabel = 'Neutre';

    const s = typeof laya.sentimentScore === 'number' ? laya.sentimentScore : 0;
    if (s > 0.1) {
      polarityBadgeClass = 'pos';
      polarityIcon = '🟢';
      polarityLabel = 'Positif';
    } else if (s < -0.1) {
      polarityBadgeClass = 'neg';
      polarityIcon = '🔴';
      polarityLabel = 'Négatif';
    }

    const catLabel = categoryLabels[laya.primaryCategory] || ('🌱 ' + (laya.primaryCategory || 'GÉNÉRAL'));
    const urgencyBadge = laya.urgencyFlag 
      ? '<span class=\"laya-badge-urgency\">⚠️ Alerte Urgence (HITL)</span>' 
      : '';

    const bodyHtml = sanitizeSocialContent(post.content || '');

    return '<article class=\"social-card\">' +
      '<div class=\"sc-header\">' +
        '<div class=\"sc-author\">' +
          '<div class=\"sc-author-meta\">' +
            '<div style=\"display: flex; align-items: center; gap: 0.4rem; margin-bottom: 2px;\">' +
              '<span class=\"sc-display-name\" title=\"' + authorName + '\">' + authorName + '</span>' +
              netBadgeHtml +
            '</div>' +
            '<a href=\"' + postUrl + '\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"sc-handle\">@' + handle + '</a>' +
          '</div>' +
        '</div>' +
        '<time class=\"sc-date\">' + dateFormatted + '</time>' +
      '</div>' +
      '<div class=\"sc-body\">' +
        bodyHtml +
      '</div>' +
      '<div class=\"sc-laya-inference\">' +
        '<div class=\"sc-laya-top\">' +
          '<span class=\"laya-badge-polarity ' + polarityBadgeClass + '\">' +
            polarityIcon + ' ' + polarityLabel + ' (' + (s > 0 ? '+' : '') + s.toFixed(2) + ')' +
          '</span>' +
          '<span class=\"laya-badge-category\">' +
            catLabel +
          '</span>' +
          urgencyBadge +
        '</div>' +
        '<div class=\"sc-laya-meta\">' +
          '<span>⚡ Latence : <strong>' + (laya.processingTimeMs || 1) + ' ms</strong></span>' +
          '<span>🔒 Sceau : <code title=\"' + (laya.auditSignature || '') + '\">' + (laya.auditSignature || 'sig_in2tech').slice(0, 10) + '...</code></span>' +
          '<a href=\"' + postUrl + '\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"sc-source-link\">🔗 Source officielle</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }).join('');

  grid.innerHTML = cardsHtml;
}

`;

appContent = appContent.substring(0, startIndex) + newSection32 + appContent.substring(endIndex);

// Assurer l'appel initHistoryArchive() dans DOMContentLoaded
appContent = appContent.replace(
  'initSocialSentimentFeed();\n    initNewsFeed();',
  'initSocialSentimentFeed();\n    initHistoryArchive();\n    initNewsFeed();'
);

// Mettre à jour module.exports
if (!appContent.includes('HISTORICAL_POSTS_DATABASE_2026')) {
  appContent = appContent.replace(
    'HISTORICAL_SUMMARY_2026,',
    'HISTORICAL_SUMMARY_2026,\n    HISTORICAL_POSTS_DATABASE_2026,\n    getHistoryMonthPosts,'
  );
}

fs.writeFileSync(appPath, appContent, 'utf8');
console.log('Successfully patched app.js with embedded database and synchronous loading!');
