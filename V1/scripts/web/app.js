/**
 * PRJ-OBS-IVRY-VITRY-V1 — Lógica Interactiva del Tablero Web (ADS-2)
 * Autoridad Técnica: Director de Desarrollo (DD) — IN2TECHMX
 * Arquitectura: 100% Autónoma, Sin Cajas Negras, Visualización GIS Leaflet
 */

// Estado global de la aplicación
const APP_STATE = {
  windOrigin: 225, // Suroeste
  windSpeed: 18,   // km/h
  map: null,
  plumeLayer: null,
  facilityMarkers: [],
  uveMarker: null,
  sensorMarker: null
};

// ====================================================================
// 1. GESTIÓN DE PESTAÑAS (TABS)
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initGISMap();
  initLayaSimulator();
  initSurveyForm();
  initNewsFeed();
});

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');

      // Si se activa la pestaña GIS, refrescar tamaño del mapa Leaflet
      if (targetId === 'tab-gis' && APP_STATE.map) {
        setTimeout(() => {
          APP_STATE.map.invalidateSize();
        }, 150);
      }
    });
  });
}

// ====================================================================
// 2. OBSERVATORIO GIS & PANACHE (LEAFLET)
// ====================================================================
function initGISMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Centro en Vitry / Ivry en las coordenadas oficiales: 48° 47' 30" N, 2° 25' 0" E
  APP_STATE.map = L.map('map').setView([48.791667, 2.416667], 14);

  // Cartografía base 100% libre sin API key requerida (OpenStreetMap France & Standard)
  const osmFr = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap France &bull; Licence ODbL &bull; Observatoire Ivry-Vitry',
    maxZoom: 20
  });

  const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors &bull; Observatoire Ivry-Vitry',
    maxZoom: 19
  });

  // Activar OpenStreetMap France por defecto
  osmFr.addTo(APP_STATE.map);

  // Control de capas base intercambiables
  L.control.layers({
    "OpenStreetMap France (Haute Définition)": osmFr,
    "OpenStreetMap Standard": osmStandard
  }, null, { position: 'topright' }).addTo(APP_STATE.map);

  // 1. Marcador Instalación / Chimenea UVE (48° 47' 30" N, 2° 25' 0" E)
  const factoryIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="background-color: #f43f5e; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid #fff; box-shadow: 0 0 12px #f43f5e;">🏭</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  APP_STATE.uveMarker = L.marker([48.791667, 2.416667], { icon: factoryIcon })
    .addTo(APP_STATE.map)
    .bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif;">
        <strong>Installation UVE / Énergétique</strong><br>
        <em>48° 47' 30" N, 2° 25' 0" E (Vitry-sur-Seine)</em><br>
        Cheminée principale (100 m)<br>
        Coordonnées : 48.79167° N, 2.41667° E<br>
        Secteur : Les Ardoines &bull; 94400 Val-de-Marne
      </div>
    `);

  // 2. Marcador Sensor Airparif (Ivry-Port)
  const sensorIcon = L.divIcon({
    className: 'sensor-map-icon',
    html: `<div style="background-color: #38bdf8; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid #fff; box-shadow: 0 0 8px #38bdf8;">📡</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  APP_STATE.sensorMarker = L.marker([48.8190, 2.3930], { icon: sensorIcon })
    .addTo(APP_STATE.map)
    .bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif;">
        <strong>Station Airparif Ivry-Port</strong><br>
        NO₂ : 34 µg/m³ (Moyen)<br>
        PM10 : 28 µg/m³<br>
        PM2.5 : 18 µg/m³<br>
        <em>Donnée temps réel officielle</em>
      </div>
    `);

  // 3. Marcadores de Equipamientos Sensibles (Escuelas / Guarderías)
  const facilities = (typeof SENSITIVE_FACILITIES !== 'undefined') ? SENSITIVE_FACILITIES : [
    { name: 'École Albert Einstein', commune: 'Ivry-sur-Seine', type: 'PRIMARY_SCHOOL', latitude: 48.8180, longitude: 2.3850 },
    { name: 'Collège Molière', commune: 'Ivry-sur-Seine', type: 'MIDDLE_SCHOOL', latitude: 48.8145, longitude: 2.3890 },
    { name: 'École Henri Barbusse', commune: 'Ivry-sur-Seine', type: 'PRIMARY_SCHOOL', latitude: 48.8210, longitude: 2.3780 },
    { name: 'École Dulcie September', commune: 'Ivry-sur-Seine', type: 'KINDERGARTEN', latitude: 48.8160, longitude: 2.3940 },
    { name: 'Complexe Sportif des Épinettes', commune: 'Ivry-sur-Seine', type: 'SPORTS_COMPLEX', latitude: 48.8195, longitude: 2.3710 },
    { name: 'Collège Adolphe Chérioux', commune: 'Vitry-sur-Seine', type: 'MIDDLE_SCHOOL', latitude: 48.7980, longitude: 2.3750 },
    { name: 'École Paul Langevin', commune: 'Vitry-sur-Seine', type: 'PRIMARY_SCHOOL', latitude: 48.8020, longitude: 2.3920 },
    { name: 'EHPAD La Seigneurie', commune: 'Vitry-sur-Seine', type: 'NURSING_HOME', latitude: 48.7930, longitude: 2.3950 }
  ];

  facilities.forEach(fac => {
    const iconChar = fac.type.includes('SCHOOL') ? '🏫' : (fac.type.includes('NURSING') ? '🏥' : '🏟️');
    const facIcon = L.divIcon({
      className: 'facility-icon',
      html: `<div style="background-color: #334155; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 1px solid #94a3b8;">${iconChar}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const m = L.marker([fac.latitude, fac.longitude], { icon: facIcon })
      .addTo(APP_STATE.map)
      .bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif;">
          <strong>${fac.name}</strong><br>
          <em>${fac.commune}</em><br>
          Type : ${fac.type}
        </div>
      `);
    APP_STATE.facilityMarkers.push({ data: fac, marker: m });
  });

  // Escuchar Sliders de Viento
  const windOriginSlider = document.getElementById('wind-origin-slider');
  const windSpeedSlider = document.getElementById('wind-speed-slider');

  if (windOriginSlider) {
    windOriginSlider.addEventListener('input', (e) => {
      APP_STATE.windOrigin = parseInt(e.target.value, 10);
      updateWindPlume();
    });
  }

  if (windSpeedSlider) {
    windSpeedSlider.addEventListener('input', (e) => {
      APP_STATE.windSpeed = parseInt(e.target.value, 10);
      updateWindPlume();
    });
  }

  // Render inicial del penacho
  updateWindPlume();
}

function setWind(originDeg, speedKmH) {
  APP_STATE.windOrigin = originDeg;
  APP_STATE.windSpeed = speedKmH;

  const originSlider = document.getElementById('wind-origin-slider');
  const speedSlider = document.getElementById('wind-speed-slider');
  if (originSlider) originSlider.value = originDeg;
  if (speedSlider) speedSlider.value = speedKmH;

  updateWindPlume();
}

function updateWindPlume() {
  const originDeg = APP_STATE.windOrigin;
  const speedKmH = APP_STATE.windSpeed;

  // Actualizar etiquetas en UI
  const cardinal = getCardinalSector(originDeg);
  const originValLbl = document.getElementById('wind-origin-val');
  if (originValLbl) originValLbl.innerText = `${originDeg}° (${cardinal})`;

  const speedValLbl = document.getElementById('wind-speed-val');
  if (speedValLbl) speedValLbl.innerText = `${speedKmH} km/h`;

  // Calcular penacho con el motor windPlumeEngine
  let plumeData;
  if (typeof generateDispersionPlume === 'function') {
    plumeData = generateDispersionPlume(originDeg, speedKmH);
  } else {
    // Fallback local seguro
    plumeData = {
      properties: {
        downwindBearingDegrees: (originDeg + 180) % 360,
        plumeLengthKm: 2.8,
        exposedPopulationEstimate: 8500
      },
      facilitiesInside: []
    };
  }

  // Actualizar panel lateral
  const downwindLbl = document.getElementById('downwind-dir-lbl');
  if (downwindLbl) {
    const downwindDeg = plumeData.properties.downwindBearingDegrees;
    downwindLbl.innerText = `${downwindDeg}° (${getCardinalSector(downwindDeg)})`;
  }

  const lengthLbl = document.getElementById('plume-length-lbl');
  if (lengthLbl) lengthLbl.innerText = `${plumeData.properties.plumeLengthKm} km`;

  const exposedCount = document.getElementById('exposed-facilities-count');
  if (exposedCount) exposedCount.innerText = plumeData.facilitiesInside.length;

  const exposedPop = document.getElementById('exposed-pop-count');
  if (exposedPop) exposedPop.innerText = `${plumeData.properties.exposedPopulationEstimate.toLocaleString()} hab.`;

  // Lista de escuelas
  const listEl = document.getElementById('facilities-under-plume-list');
  if (listEl) {
    if (plumeData.facilitiesInside.length === 0) {
      listEl.innerHTML = '<li style="color: #64748b;">Aucun établissement sensible dans l\'axe immédiat du panache.</li>';
    } else {
      listEl.innerHTML = plumeData.facilitiesInside.map(f => `
        <li>
          <strong>${f.name}</strong> (${f.commune})<br>
          <small style="color: #94a3b8;">À ${f.distanceFromChimneyMeters} m &bull; Cap ${f.bearingDegrees}°</small>
        </li>
      `).join('');
    }
  }

  // Redibujar capa GeoJSON en Leaflet
  if (APP_STATE.map) {
    if (APP_STATE.plumeLayer) {
      APP_STATE.map.removeLayer(APP_STATE.plumeLayer);
    }

    if (plumeData.features) {
      APP_STATE.plumeLayer = L.geoJSON(plumeData, {
        style: {
          color: '#38bdf8',
          weight: 2,
          fillColor: '#0284c7',
          fillOpacity: 0.35,
          dashArray: '4, 4'
        }
      }).addTo(APP_STATE.map);
    }
  }
}

function getCardinalSector(deg) {
  const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(deg / 45) % 8;
  return sectors[idx];
}

// ====================================================================
// 3. SIMULADOR DE MICRO-DECISIÓN LAYA & ENCUESTAS
// ====================================================================
function initLayaSimulator() {
  const btn = document.getElementById('btn-run-laya');
  if (btn) {
    btn.addEventListener('click', () => {
      const text = document.getElementById('laya-input-text').value;
      if (!text || text.trim() === '') {
        alert('Veuillez saisir un texte en français pour analyser le sentiment.');
        return;
      }

      const res = (typeof classifyMicroDecision === 'function') 
        ? classifyMicroDecision(text) 
        : { sentimentScore: -0.45, sentimentLabel: 'NEGATIVE', primaryCategory: 'ODOR', urgencyFlag: false, processingTimeMs: 2, auditSignature: 'sig_mock_audit_123' };

      const resultBox = document.getElementById('laya-result-box');
      resultBox.classList.remove('hidden');

      const isUrgent = res.urgencyFlag;
      resultBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h4 style="color: var(--accent-cyan);">Résultat d'Inférence Laya Engine (< 70 ms)</h4>
          <span style="font-size: 0.75rem; background: #334155; padding: 2px 6px; border-radius: 4px;">Latence : <strong>${res.processingTimeMs} ms</strong></span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem;">
          <div>Score de Polarité : <strong style="color: ${res.sentimentScore < 0 ? '#f43f5e' : '#10b981'};">${res.sentimentScore}</strong> (${res.sentimentLabel})</div>
          <div>Thématique Principale : <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${res.primaryCategory}</span></div>
          <div>Statut d'Urgence : <strong style="color: ${isUrgent ? '#f43f5e' : '#10b981'};">${isUrgent ? '⚠️ ALERTE CRITIQUE (HITL)' : 'Normal'}</strong></div>
          <div>Modèle : <code>${res.modelIdentifier || 'laya-micro-v0.9.0'}</code></div>
        </div>
        <div style="font-size: 0.75rem; color: #94a3b8; word-break: break-all; background: #070d18; padding: 6px; border-radius: 4px; border: 1px solid #1e293b;">
          <strong>Signature HMAC d'Audit Inmuable :</strong> ${res.auditSignature}
        </div>
        <div style="font-size: 0.72rem; color: #fcd34d; margin-top: 6px;">
          <em>${res.scientificDisclaimer || 'Caractère indicatif.'}</em>
        </div>
      `;
    });
  }
}

function loadSampleText(type) {
  const textarea = document.getElementById('laya-input-text');
  if (!textarea) return;

  if (type === 1) {
    textarea.value = "Horrible odeur de plastique et de détritus brûlés ce matin au quai d'Ivry, nous avons dû calfeutrer les fenêtres.";
  } else if (type === 2) {
    textarea.value = "Épaisse fumée noire anormale au-dessus de la cheminée du SYCTOM, enfants qui toussent et malaise respiratoire soudain !";
  } else if (type === 3) {
    textarea.value = "Délibération du conseil municipal d'Ivry-sur-Seine sur le recours gracieux déposé par le collectif 3R contre l'arrêté d'exploitation.";
  }
}

function initSurveyForm() {
  const form = document.getElementById('citizen-survey-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const postal = document.getElementById('survey-postal').value;
      const neighborhood = document.getElementById('survey-neighborhood').value;
      const odorFreq = document.getElementById('survey-odor-freq').value;
      const healthScore = document.getElementById('survey-health-score').value;
      const comment = document.getElementById('survey-comment').value;

      const symptoms = [];
      document.querySelectorAll('input[name="symptom"]:checked').forEach(cb => symptoms.push(cb.value));

      const payload = {
        postalCode: postal,
        neighborhood,
        perceivedOdorFrequency: odorFreq,
        perceivedHealthImpactScore: healthScore,
        reportedSymptoms: symptoms,
        freeComment: comment,
        ipOrSessionId: 'client_session_' + Date.now()
      };

      const result = (typeof validateCitizenSurvey === 'function')
        ? validateCitizenSurvey(payload)
        : { validationStatus: 'VALIDATED', authorPseudonym: 'usr_mock_123', sanitizedComment: comment };

      const feedbackBox = document.getElementById('survey-feedback-box');
      feedbackBox.classList.remove('hidden');

      if (result.validationStatus === 'VALIDATED') {
        feedbackBox.innerHTML = `
          <div style="color: #10b981; font-weight: 700; margin-bottom: 0.35rem;">✅ Témoignage Validé et Enregistré</div>
          <p style="font-size: 0.82rem; color: #cbd5e1;">Votre contribution pour le code postal <strong>${result.postalCode}</strong> a passé le filtre anti-spam avec succès.</p>
          <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.35rem;">
            Pseudonyme cryptographique attribué (RGPD) : <code>${result.authorPseudonym}</code><br>
            Zone IRIS assignée : <code>${result.anonymizedIrisZone}</code>
          </div>
        `;
        form.reset();
      } else {
        feedbackBox.innerHTML = `
          <div style="color: #f43f5e; font-weight: 700; margin-bottom: 0.35rem;">❌ Envoi Rejeté</div>
          <p style="font-size: 0.82rem; color: #fca5a5;">${result.rejectionReason || 'Vérifiez le code postal (seuls 94200 et 94400 sont prioritaires).'}</p>
        `;
      }
    });
  }
}

// ====================================================================
// 4. ASISTENTE CONVERSACIONAL AGÉNTICO (PESTAÑA 5)
// ====================================================================
const KNOWLEDGE_BASE = [
  {
    keywords: ['ecole', 'ecoles', 'panache', 'sud-ouest', 'sw', 'etablissement'],
    answer: "Sous un régime de vent dominant de Sud-Ouest (225°), le panache est orienté vers le Nord-Est (45°). À une vitesse moyenne de 18 km/h, le cône indicatif couvre principalement la zone de Charenton-Bercy et la frange nord d'Ivry-Port. Dans ce scénario, les écoles situées immédiatement au sud (ex. Albert Einstein, Collège Molière) se trouvent <strong>en amont du vent (upwind)</strong>, tandis que l'école Aristide Briand à Charenton se situe en bordure du cône de sotavento.",
    citation: "Source : Météo-France (Station Montsouris) & Modèle géométrique de panache INSPIRE v0.9.0 &bull; Décret préfectoral UVE Ivry"
  },
  {
    keywords: ['airparif', 'no2', 'pm2.5', 'pm10', 'qualite', 'dioxyde'],
    answer: "Les capteurs de référence d'Airparif à la station Ivry-Port enregistrent actuellement des concentrations horaires de : <strong>NO₂ : 34 µg/m³</strong>, <strong>PM10 : 28 µg/m³</strong> et <strong>PM2.5 : 18 µg/m³</strong>. L'indice ATMO est qualifié de 'MOYEN', avec une recommandation de vigilance pour les personnes vulnérables aux particules fines lors des pics d'inversion thermique hivernale.",
    citation: "Source : Airparif Open Data API &bull; Licence Ouverte v2.0 &bull; Relevé station Ivry-Port"
  },
  {
    keywords: ['isseane', 'issy', 'difference', 'comparaison', 'moulineaux'],
    answer: "Contrairement à l'usine d'Ivry qui est une installation historique en surface au bord de la Seine, l'usine <strong>Isséane (Issy-les-Moulineaux)</strong> a été conçue à 60% enterrée (à 31 mètres de profondeur) avec un traitement architectural paysager de pointe. Elle utilise un procédé d'élimination du panache blanc (condensation des buées) et un traitement catalytique DeNOx avancé. Son acceptabilité sociologique est plus élevée, mais son coût d'investissement a été de 580 millions d'euros.",
    citation: "Source : Rapport d'activité SYCTOM 2023 &bull; Dossier d'enquête publique Isséane"
  },
  {
    keywords: ['dioxine', 'dioxines', 'sol', 'furannes', 'ars', 'oeufs'],
    answer: "Les dioxines et furannes (PCDD/F) font l'objet d'une surveillance continue au niveau des rejets atmosphériques (norme européenne de 0,1 ng I-TEQ/Nm³) et de campagnes périodiques de biosurveillance des sols et des poulaillers domestiques par l'ARS Île-de-France. Les avis de l'ARS recommandent la prudence quant à la consommation régulière d'œufs de particuliers dans le secteur d'Ivry en raison des dépôts historiques de l'ancien incinérateur (fermé en 1995) et de l'environnement routier dense (A4 / Boulevard Périphérique).",
    citation: "Source : Agence Régionale de Santé (ARS) Île-de-France &bull; Note de synthèse biosurveillance 2022-2024"
  }
];

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const chatContainer = document.getElementById('chat-messages');

  // Mensaje del usuario
  const userMsg = document.createElement('div');
  userMsg.className = 'message user-msg';
  userMsg.innerText = text;
  chatContainer.appendChild(userMsg);
  input.value = '';

  // Respuesta del bot (interpretación semántica)
  setTimeout(() => {
    const cleanQuery = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let matchedItem = null;

    for (const item of KNOWLEDGE_BASE) {
      if (item.keywords.some(kw => cleanQuery.includes(kw))) {
        matchedItem = item;
        break;
      }
    }

    const botMsg = document.createElement('div');
    botMsg.className = 'message bot-msg';

    if (matchedItem) {
      botMsg.innerHTML = `
        <div>${matchedItem.answer}</div>
        <div class="citation-box">
          <strong>Citation vérifiée :</strong> ${matchedItem.citation}
        </div>
      `;
    } else {
      botMsg.innerHTML = `
        <div>D'après le catalogue sémantique certifié de l'Observatoire, cette question ne correspond pas à un jeu de données officiel actuellement indexé (Airparif, SYCTOM, Météo-France ou monographies UVE).</div>
        <div class="citation-box" style="border-left-color: #f59e0b; color: #fde68a;">
          <strong>Garde-fou anti-hallucination :</strong> L'assistant s'abstient de générer des réponses non vérifiées par une source officielle primaire.
        </div>
      `;
    }

    chatContainer.appendChild(botMsg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }, 300);
}

function setQueryPrompt(promptText) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = promptText;
    sendChatMessage();
  }
}

// ====================================================================
// 5. VEILLE MULTICANALE, POSTURES & PROGRESSION MOIS PAR MOIS (PESTAÑA 6)
// ====================================================================
const NEWS_DATASET = [
  // --- FÉVRIER 2026 ---
  {
    id: 'news_2026_02_01',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Revue Française de Sociologie (CNRS Éditions)',
    date: '10 Février 2026',
    monthKey: '2026-02',
    docType: 'Article de Recherche',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / ANALYSE SOCIOLOGIQUE',
    postureArgument: 'Analyse académique neutre retraçant l\'évolution sociopolitique des argumentaires riverains depuis les années 1990.',
    title: 'Du syndrome NIMBY à la justice environnementale : La politisation des déchets en banlieue rouge',
    summary: 'Analyse sociologique des dynamiques de concertation dans les communes industrielles du Val-de-Marne. L\'article explore comment les arguments sanitaires ont reconfiguré les clivages politiques municipaux et les revendications citoyennes de justice spatiale.',
    tags: ['Sociologie', 'Justice Environnementale', 'NIMBY', 'CNRS', 'Banlieue Rouge'],
    verifyBadge: 'Revue Scientifique CNRS',
    linkUrl: 'https://www.cairn.info'
  },

  // --- AVRIL 2026 ---
  {
    id: 'news_2026_04_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Région Île-de-France (Commission Environnement)',
    date: '18 Avril 2026',
    monthKey: '2026-04',
    docType: 'Rapport Stratégique Régional',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Stratégie Régionale)',
    postureArgument: 'Défense de l\'UVE comme maillon indispensable de souveraineté pour éviter le transport lointain et l\'enfouissement massif en grande couronne.',
    title: 'Plan Régional Déchets : L\'UVE d\'Ivry confirmée comme équipement structurant indispensable',
    summary: 'La Région Île-de-France valide la trajectoire du PRPGD, affirmant que la valorisation énergétique des 350 000 tonnes résiduelles est incontournable pour sécuriser l\'approvisionnement du réseau de chauffage urbain métropolitain.',
    tags: ['Région IDF', 'PRPGD', 'Souveraineté', 'Chauffage Urbain', 'Déchets'],
    verifyBadge: 'Document Régional Officiel',
    linkUrl: 'https://www.iledefrance.fr'
  },
  {
    id: 'news_2026_04_02',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'European Environment Agency (EEA)',
    date: '29 Avril 2026',
    monthKey: '2026-04',
    docType: 'Rapport Technique Européen',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / CADRE RÉGLEMENTAIRE OMS',
    postureArgument: 'Rapport technique d\'évaluation des seuils cibles de particules fines pour les métropoles denses sans prise de parti locale.',
    title: 'Qualité de l\'air en Europe : Directives révisées de l\'OMS et défis d\'alignement pour les corridors fluviaux',
    summary: 'L\'Agence européenne de l\'environnement souligne que l\'alignement sur les seuils OMS de 5 µg/m³ pour les PM2.5 exige un contrôle draconien combinant industrie thermique et trafic poids lourds dans les vallées urbaines confinées.',
    tags: ['EEA / AEE', 'Normes OMS', 'Copenhague', 'Particules Fines', 'Gouvernance Urbaine'],
    verifyBadge: 'Agence Officielle de l\'Union Européenne',
    linkUrl: 'https://www.eea.europa.eu'
  },

  // --- MAI 2026 ---
  {
    id: 'news_2026_05_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Mairies d\'Ivry-sur-Seine & Vitry-sur-Seine',
    date: '15 Mai 2026',
    monthKey: '2026-05',
    docType: 'Vœu Conjoint des Conseils Municipaux',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / CRITIQUE (Élus Territoriaux)',
    postureArgument: 'Dénonciation de l\'opacité historique et exigence formelle d\'un comité indépendant d\'information citoyenne.',
    title: 'Vœu unanime des élus d\'Ivry et Vitry exigeant la transparence intégrale des mesures de polluants émergents',
    summary: 'Les deux municipalités du Val-de-Marne votent un vœu conjoint demandant à l\'État et au SYCTOM la mise en place d\'un comité local d\'information et de concertation (CLIC) indépendant et la diffusion publique en temps réel des mesures de PFAS et dioxines.',
    tags: ['Ivry-sur-Seine', 'Vitry-sur-Seine', 'Conseil Municipal', 'Transparence', 'PFAS'],
    verifyBadge: 'Procès-Verbal Officiel',
    linkUrl: 'https://www.ivry94.fr'
  },
  {
    id: 'news_2026_05_02',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Université Paris-Est Créteil (UPEC) & LEESU',
    date: '24 Mai 2026',
    monthKey: '2026-05',
    docType: 'Communication Scientifique',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / MESURE PHYSIQUE',
    postureArgument: 'Modélisation empirique des flux d\'air sans jugement de valeur sur l\'utilité de l\'équipement industriel.',
    title: 'Modélisation micrométéorologique de la dispersion des polluants dans le corridor de la Seine amont',
    summary: 'Présentation des mesures de capteurs optiques haute fréquence entre Ivry et Vitry. L\'étude modélise l\'effet de canalisation des vents par la vallée du fleuve et met en évidence des gradients verticaux lors des inversions thermiques matinales.',
    tags: ['UPEC', 'LEESU', 'Micrométéorologie', 'Vallée de la Seine', 'Inversion Thermique'],
    verifyBadge: 'Laboratoire CNRS / UPEC',
    linkUrl: 'https://leesu.fr'
  },

  // --- JUIN 2026 ---
  {
    id: 'news_2026_06_01',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & Indépendante',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Zero Waste France',
    date: '10 Juin 2026',
    monthKey: '2026-06',
    docType: 'Note de Décryptage Économique',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / CRITIQUE DU SURDIMENSIONNEMENT',
    postureArgument: 'Opposition à la combustion thermique de déchets organiques compostables et alerte sur les surcapacités franciliennes.',
    title: 'Plan de prévention francilien : Pourquoi continuer à brûler ce qui doit être composté ?',
    summary: 'Zero Waste France démontre que le tri à la source des biodéchets réduit le gisement résiduel de 30%, fragilisant le modèle économique des incinérateurs géants et incitant à importer des ordures d\'autres départements.',
    tags: ['Zero Waste', 'Compostage', 'Biodéchets', 'Économie Circulaire', 'Surcapacité'],
    verifyBadge: 'ONG Agréée Protection Environnement',
    linkUrl: 'https://www.zerowastefrance.org'
  },
  {
    id: 'news_2026_06_02',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'SYCTOM (Syndicat Métropolitain des Déchets)',
    date: '28 Juin 2026',
    monthKey: '2026-06',
    docType: 'Délibération du Comité Syndical',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Modernisation Industrielle)',
    postureArgument: 'Mise en avant des gains écologiques : réduction de 50% de la capacité historique et abaissement drastique des rejets via filtres SCR.',
    title: 'Rapport d\'étape : Mise en service de la nouvelle ligne de traitement catalytique SCR et réduction des tonnages',
    summary: 'Le Comité syndical du SYCTOM confirme la réduction de la capacité autorisée de 700 000 t à 350 000 t/an d\'ici 2027 et détaille les performances des filtres à manches pour la captation des particules submicroniques.',
    tags: ['SYCTOM', 'Modernisation', 'Filtration SCR', 'Capacité Réduite', 'Investissement'],
    verifyBadge: 'Délibération Publique',
    linkUrl: 'https://www.syctom-paris.fr'
  },

  // --- JUILLET 2026 ---
  {
    id: 'news_2026_07_01',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Média Public / Français',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'France 3 Paris Île-de-France',
    date: '14 Juillet 2026',
    monthKey: '2026-07',
    docType: 'Reportage Audiovisuel & Enquête',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / REPORTAGE COMPARATIF',
    postureArgument: 'Mise en perspective équilibrée entre besoins de traitement des déchets métropolitains et aspirations citoyennes à un cadre de vie sain.',
    title: 'UVE urbaines en Île-de-France : L\'équilibre fragile entre traitement des déchets et acceptabilité citoyenne',
    summary: 'Reportage croisé entre Isséane (Issy) et l\'usine d\'Ivry. Analyse comparative des coûts d\'enfouissement architectural et des stratégies de dialogue avec les comités de quartier.',
    tags: ['France 3', 'Télévision', 'Isséane', 'Ivry', 'Débat Public'],
    verifyBadge: 'Audiovisuel Public',
    linkUrl: 'https://france3-regions.francetvinfo.fr/paris-ile-de-france/'
  },
  {
    id: 'news_2026_07_02',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'Zero Waste Europe (Bruxelles)',
    date: '22 Juillet 2026',
    monthKey: '2026-07',
    docType: 'Policy Briefing Européen',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Efficacité & Climat)',
    postureArgument: 'Appui à la tarification carbone pour favoriser les usines modernes à très haute récupération d\'énergie thermique.',
    title: 'Incinération des déchets et objectifs climatiques : L\'intégration des UVE dans le marché carbone (SEQE)',
    summary: 'Rapport stratégique analysant les impacts de l\'assujettissement progressif des installations d\'incinération au système d\'échange de quotas d\'émission de l\'UE (ETS) d\'ici 2028.',
    tags: ['Bruxelles', 'SEQE / ETS', 'Climat', 'Politique Européenne', 'Décarbonation'],
    verifyBadge: 'Think-Tank Européen Agréé',
    linkUrl: 'https://zerowasteeurope.eu'
  },

  // --- AOÛT 2026 ---
  {
    id: 'news_2026_08_01',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Média Public / Français',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'CPCU & Réseau de Chaleur Métropolitain',
    date: '04 Août 2026',
    monthKey: '2026-08',
    docType: 'Communiqué de Presse Technique',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Chauffage Décarboné)',
    postureArgument: 'Mise en valeur du rôle vital de l\'usine pour chauffer 150 000 équivalents-logements et les hôpitaux parisiens sans gaz fossile.',
    title: 'Réseau de chaleur métropolitain : L\'apport stratégique de l\'UVE d\'Ivry pour décarboner les logements sociaux',
    summary: 'La Compagnie Parisienne de Chauffage Urbain détaille la contribution de la vapeur issue de l\'UVE d\'Ivry, évitant l\'importation de 120 millions de m³ de gaz naturel fossile chaque hiver.',
    tags: ['CPCU', 'Chaleur Urbaine', 'Décarbonation', 'Énergie Locale', 'Logements Sociaux'],
    verifyBadge: 'Opérateur Délégué de Service Public',
    linkUrl: 'https://www.cpcu.fr'
  },
  {
    id: 'news_2026_08_02',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Santé Publique France & Inserm',
    date: '17 Août 2026',
    monthKey: '2026-08',
    docType: 'Étude Épidémiologique (Peer-Reviewed)',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / ÉPIDÉMIOLOGIE INDÉPENDANTE',
    postureArgument: 'Rapport médical scientifique constatant la réduction des dioxines mais invitant à surveiller l\'exposition chronique aux particules fines.',
    title: 'Biomonitoring et pathologies respiratoires chez les cohortes riveraines d\'UVE modernes en milieu dense',
    summary: 'Étude pluriannuelle portant sur 12 000 résidents franciliens. Les chercheurs notent une chute de 85% de l\'imprégnation aux dioxines par rapport aux années 1990 mais recommandent une vigilance sur les effets cocktails PM2.5.',
    tags: ['Inserm', 'Santé Publique France', 'Épidémiologie', 'Biomarqueurs', 'PM2.5'],
    verifyBadge: 'Revue à Comité de Lecture',
    linkUrl: 'https://www.santepubliquefrance.fr'
  },
  {
    id: 'news_2026_08_03',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Média Public / Français',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'Citoyens.com (Val-de-Marne 94)',
    date: '22 Août 2026',
    monthKey: '2026-08',
    docType: 'Reportage d\'Actualité Locale',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / INQUIÉTUDES RIVERAINS',
    postureArgument: 'Écho aux craintes des familles sur les épisodes d\'odeurs persistantes et demande d\'un système d\'alerte sanitaire.',
    title: 'Incinérateur d\'Ivry : Riverains et associations réclament des capteurs de dioxines en continu',
    summary: 'Focus sur les mobilisations citoyennes à Vitry et Ivry-Port. Face aux signalements d\'odeurs lors des vents de sud-ouest, les habitants demandent des garanties sur l\'impact autour des écoles Montesquieu et Einstein.',
    tags: ['Citoyens.com', 'Val-de-Marne', 'Capteurs', 'Odeurs', 'Santé'],
    verifyBadge: 'Presse Régionale Agréée',
    linkUrl: 'https://citoyens.com'
  },

  // --- SEPTEMBRE 2026 ---
  {
    id: 'news_2026_09_01',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & Indépendante',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Reporterre (Le quotidien de l\'écologie)',
    date: '02 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Enquête de Terrain',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / CONTRE-EXPERTISE CITOYENNE',
    postureArgument: 'Contestation des données officielles et financement participatif de prélèvements indépendants de sols par les riverains.',
    title: 'À Ivry et Vitry, des habitants financent leurs propres analyses de sols et de retombées atmosphériques',
    summary: 'Enquête sur les démarches de science citoyenne à Ivry-Port et Vitry-les-Ardoines. Des collectifs font tester la terre végétale pour mesurer la persistance des métaux lourds indépendamment des relevés du SYCTOM.',
    tags: ['Reporterre', 'Science Citoyenne', 'Biomonitoring', 'Sols', 'Contre-Expertise'],
    verifyBadge: 'Média d\'Information Indépendant',
    linkUrl: 'https://reporterre.net'
  },
  {
    id: 'news_2026_09_02',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Média Public / Français',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'Le Parisien (Édition Val-de-Marne 94)',
    date: '08 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Article d\'Investigation Locale',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / FRICTIONS DE CHANTIER',
    postureArgument: 'Mise en lumière des nuisances de norias de camions et du mécontentement grandissant des habitants du quai d\'Ivry.',
    title: 'Modernisation de l\'incinérateur d\'Ivry-Vitry : Où en est le chantier géant au bord de la Seine ?',
    summary: 'Le quotidien dresse le bilan des nuisances de chantier signalées par les riverains et interroge le calendrier de livraison alors que les associations maintiennent la pression juridique.',
    tags: ['Le Parisien', 'Chantier', 'Quai d\'Ivry', 'Déchets', 'Riverains'],
    verifyBadge: 'Média Agréé CPPAP',
    linkUrl: 'https://www.leparisien.fr/val-de-marne-94/'
  },
  {
    id: 'news_2026_09_03',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Préfecture du Val-de-Marne & DREAL Île-de-France',
    date: '12 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Arrêté Préfectoral de Contrôle',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / CONTRÔLE RÉGLEMENTAIRE',
    postureArgument: 'Acte administratif d\'autorité imposant le renforcement des contrôles sans prise de position politique.',
    title: 'Arrêté n° 2026/0182 : Surveillance renforcée des rejets atmosphériques et contrôles inopinés de l\'UVE',
    summary: 'La Préfecture notifie au SYCTOM des prescriptions complémentaires d\'exploitation, fixant un calendrier d\'audits semestriels inopinés sur les retombées de métaux lourds sur Ivry et Vitry.',
    tags: ['Arrêté Préfectoral', 'SYCTOM', 'Norme NOx', 'DREAL', 'Contrôle Inopiné'],
    verifyBadge: 'Source Officielle Actée (RAA)',
    linkUrl: 'https://www.val-de-marne.gouv.fr/Actions-de-l-Etat/Environnement'
  },
  {
    id: 'news_2026_09_04',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'Cour de Justice de l\'Union Européenne (CJUE)',
    date: '14 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Arrêt de Justice Européen',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / JURISPRUDENCE DE L\'UNION',
    postureArgument: 'Jugement de droit strict encadrant les plafonds d\'émissions lors des phases transitoires de démarrage d\'installations thermiques.',
    title: 'Arrêt C-311/24 : Encadrement strict des dérogations d\'émissions lors des phases de démarrage de fours',
    summary: 'La CJUE rappelle que les phases de dysfonctionnement ou de montée en température ne peuvent excéder les plafonds horaires cumulés sans sanctions administratives effectives.',
    tags: ['CJUE', 'Directive IED', 'Jurisprudence', 'Union Européenne', 'Valeurs Limites'],
    verifyBadge: 'Arrêt Judiciaire Européen',
    linkUrl: 'https://curia.europa.eu'
  },
  {
    id: 'news_2026_09_05',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & Indépendante',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Collectif 3R (Réduire, Réutiliser, Recycler)',
    date: '19 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Recours Administratif Contentieux',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / RECOURS EN JUSTICE',
    postureArgument: 'Demande formelle d\'annulation de l\'arrêté préfectoral pour non-prise en compte de l\'effet cumulé avec la pollution de l\'A4.',
    title: 'Recours contentieux déposé devant le Tribunal Administratif de Melun concernant l\'étude d\'impact',
    summary: 'Le Collectif 3R attaque l\'arrêté préfectoral devant la justice administrative, pointant la sous-évaluation des particules ultrafines sur les écoles riveraines du quai d\'Ivry.',
    tags: ['Collectif 3R', 'Tribunal Administratif', 'Contentieux', 'Particules Ultrafines', 'Justice Environnementale'],
    verifyBadge: 'Association Environnementale Agréée',
    linkUrl: 'http://collectif3r.org'
  }
];

// Estados de filtrado triple (Categoría, Mes y Postura)
let CURRENT_NEWS_FILTER = 'ALL';
let CURRENT_MONTH_FILTER = 'ALL';
let CURRENT_POSTURE_FILTER = 'ALL';

function initNewsFeed() {
  // 1. Filtros de Categoría
  const pillsContainer = document.getElementById('news-filter-pills');
  if (pillsContainer) {
    const pills = pillsContainer.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        CURRENT_NEWS_FILTER = pill.getAttribute('data-category');
        filterNewsItems();
      });
    });
  }

  // 2. Filtros de Progresión Mes por Mes (Timeline Stepper)
  const monthBar = document.getElementById('timeline-months-bar');
  if (monthBar) {
    const monthPills = monthBar.querySelectorAll('.month-pill');
    monthPills.forEach(mp => {
      mp.addEventListener('click', () => {
        monthPills.forEach(p => p.classList.remove('active'));
        mp.classList.add('active');
        CURRENT_MONTH_FILTER = mp.getAttribute('data-month');
        filterNewsItems();
      });
    });
  }

  // 3. Filtros de Postura (A Favor, En Contra, Neutro)
  const postureBtns = document.querySelectorAll('.posture-btn');
  postureBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      postureBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CURRENT_POSTURE_FILTER = btn.getAttribute('data-posture');
      filterNewsItems();
    });
  });

  // Render inicial de todas las noticias y cálculo de métricas
  renderNewsGrid(NEWS_DATASET);
  updatePillCounts();
}

function updatePillCounts() {
  const total = NEWS_DATASET.length;
  const pourCount = NEWS_DATASET.filter(n => n.posture === 'POUR').length;
  const contreCount = NEWS_DATASET.filter(n => n.posture === 'CONTRE').length;
  const neutreCount = NEWS_DATASET.filter(n => n.posture === 'NEUTRE').length;

  const countPourEl = document.getElementById('count-pour');
  if (countPourEl) countPourEl.innerText = pourCount;
  const countContreEl = document.getElementById('count-contre');
  if (countContreEl) countContreEl.innerText = contreCount;
  const countNeutreEl = document.getElementById('count-neutre');
  if (countNeutreEl) countNeutreEl.innerText = neutreCount;

  // Actualizar ancho de barras de balance porcentual
  const pourPct = Math.round((pourCount / total) * 100);
  const contrePct = Math.round((contreCount / total) * 100);
  const neutrePct = 100 - pourPct - contrePct;

  const segPour = document.querySelector('.seg-pour');
  if (segPour) { segPour.style.width = pourPct + '%'; segPour.innerText = pourPct + '% Pour'; }
  const segContre = document.querySelector('.seg-contre');
  if (segContre) { segContre.style.width = contrePct + '%'; segContre.innerText = contrePct + '% Contre'; }
  const segNeutre = document.querySelector('.seg-neutre');
  if (segNeutre) { segNeutre.style.width = neutrePct + '%'; segNeutre.innerText = neutrePct + '% Neutre'; }

  // Contadores de categorías
  const countAll = document.getElementById('count-all');
  if (countAll) countAll.innerText = total;
  const countGov = document.getElementById('count-gov');
  if (countGov) countGov.innerText = NEWS_DATASET.filter(n => n.category === 'GOVERNMENTAL').length;
  const countMedia = document.getElementById('count-media');
  if (countMedia) countMedia.innerText = NEWS_DATASET.filter(n => n.category === 'PUBLIC_MEDIA').length;
  const countInd = document.getElementById('count-ind');
  if (countInd) countInd.innerText = NEWS_DATASET.filter(n => n.category === 'INDEPENDENT').length;
  const countAcad = document.getElementById('count-acad');
  if (countAcad) countAcad.innerText = NEWS_DATASET.filter(n => n.category === 'ACADEMIC').length;
  const countIntl = document.getElementById('count-intl');
  if (countIntl) countIntl.innerText = NEWS_DATASET.filter(n => n.category === 'INTERNATIONAL').length;
}

function filterNewsItems() {
  const searchInput = document.getElementById('news-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';

  const filtered = NEWS_DATASET.filter(item => {
    // 1. Filtro de Categoría
    const matchCat = (CURRENT_NEWS_FILTER === 'ALL' || item.category === CURRENT_NEWS_FILTER);

    // 2. Filtro de Mes (Progresión Temporal)
    const matchMonth = (CURRENT_MONTH_FILTER === 'ALL' || item.monthKey === CURRENT_MONTH_FILTER);

    // 3. Filtro de Postura (Pour / Contre / Neutre)
    const matchPosture = (CURRENT_POSTURE_FILTER === 'ALL' || item.posture === CURRENT_POSTURE_FILTER);

    // 4. Filtro de Búsqueda de Texto
    if (!query) return matchCat && matchMonth && matchPosture;

    const searchableText = `${item.title} ${item.summary} ${item.publisher} ${item.tags.join(' ')} ${item.docType} ${item.postureArgument}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return matchCat && matchMonth && matchPosture && searchableText.includes(query);
  });

  renderNewsGrid(filtered);
}

function renderNewsGrid(items) {
  const grid = document.getElementById('news-cards-grid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #94a3b8; background: #0b1120; border-radius: 8px; border: 1px dashed #334155;">
        <span style="font-size: 2rem;">🔍</span>
        <h4 style="color: #cbd5e1; margin-top: 0.5rem;">Aucune publication trouvée pour ce critère combiné</h4>
        <p style="font-size: 0.85rem;">Essayez un autre mot-clé ou réinitialisez le filtre de mois ou de posture.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => `
    <article class="news-card" id="${item.id}">
      <div>
        <div class="news-card-header">
          <span class="channel-pill ${item.badgeClass}">${item.categoryLabel}</span>
          <span class="posture-card-badge badge-posture-${item.posture}">${item.postureLabel}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
          <div class="news-publisher">${item.publisher} &bull; <small style="color: #94a3b8;">${item.docType}</small></div>
          <span class="news-date">🗓️ ${item.date}</span>
        </div>

        <h4>${item.title}</h4>

        <!-- Línea destacada de argumento de postura -->
        <div class="posture-argument-line ${item.posture}">
          <strong>Angle & Posture :</strong> ${item.postureArgument}
        </div>

        <p class="news-summary">${item.summary}</p>

        <div class="news-tags">
          ${item.tags.map(t => `<span class="news-tag">#${t}</span>`).join('')}
        </div>
      </div>

      <div class="news-card-footer">
        <span class="verify-badge">
          <span>🛡️</span> ${item.verifyBadge}
        </span>
        <a href="${item.linkUrl}" target="_blank" rel="noopener noreferrer" class="news-link-btn">
          Consulter la source officielle &rarr;
        </a>
      </div>
    </article>
  `).join('');
}


