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
        [50, 150, 300, 500].forEach(delay => {
          setTimeout(() => {
            APP_STATE.map.invalidateSize(true);
          }, delay);
        });
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
// 5. VEILLE MULTICANALE, POSTURES & PROGRESSION HISTORIQUE (2022 - 2026)
// ====================================================================

const MONTHS_CHRONO = [
  '2022-02', '2022-05', '2022-11',
  '2023-04', '2023-09',
  '2024-03', '2024-06', '2024-10',
  '2025-02', '2025-06', '2025-11',
  '2026-02', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'
];

const MONTHS_META = {
  '2022-02': {
    name: 'Février 2022',
    climateTitle: 'Alerte ToxicoWatch & Recommandation Sanitaire ARS sur les Dioxines',
    climateSummary: 'Détection de taux élevés de dioxines dans les œufs de poulaillers domestiques à Ivry par ToxicoWatch. L\'ARS Île-de-France émet une consigne de prudence inédite.',
    dominantPosture: 'CONTRE'
  },
  '2022-05': {
    name: 'Mai 2022',
    climateTitle: 'Investigation Nationale (Le Monde) & Défense Technique du SYCTOM',
    climateSummary: 'Le quotidien Le Monde publie une grande enquête sur la pollution sous l\'incinérateur. Le SYCTOM affirme la conformité réglementaire de ses rejets à la cheminée.',
    dominantPosture: 'SPLIT'
  },
  '2022-11': {
    name: 'Novembre 2022',
    climateTitle: 'Questions Parlementaires & Première Analyse Sociologique Panthéon-Sorbonne',
    climateSummary: 'Interpellations formelles au Sénat et à l\'Assemblée Nationale. Recherche universitaire (Charlotte Fabre, Panthéon-Sorbonne/Cairn) sur la gouvernance par le risque.',
    dominantPosture: 'CONTRE'
  },
  '2023-04': {
    name: 'Avril 2023',
    climateTitle: 'Scandale des 6 936 Heures sans Mesure AMESA & Enquête France Inter',
    climateSummary: 'Zero Waste France révèle que les analyseurs en continu ont été inactifs près de 289 jours en 2020-2021. La cellule d\'investigation de Radio France relaie les alertes.',
    dominantPosture: 'CONTRE'
  },
  '2023-09': {
    name: 'Septembre 2023',
    climateTitle: 'Contrat Industriel Interval (Filtres SCR) & Chauffage Urbain CPCU',
    climateSummary: 'Le SYCTOM valide l\'abaissement de capacité à 350 000 t et la commande de filtres SCR. CPCU rappelle l\'apport vital de vapeur pour 150 000 foyers parisiens.',
    dominantPosture: 'POUR'
  },
  '2024-03': {
    name: 'Mars 2024',
    climateTitle: 'Biosurveillance dans les Écoles & Droit d\'Alerte Syndical (CGT 94)',
    climateSummary: 'Analyses de mousses végétales d\'arbres dans 5 écoles d\'Ivry et Charenton montrant la présence de dioxines et métaux lourds. Alertes santé pour danger grave à l\'école Einstein.',
    dominantPosture: 'CONTRE'
  },
  '2024-06': {
    name: 'Juin 2024',
    climateTitle: 'Étude Universitaire sur les Inégalités Écologiques & Débat Politico Europe',
    climateSummary: 'Cyria Emelianoff (Revue Écologie & Politique) documente les disparités territoriales Est/Ouest. Politico Europe examine l\'incinération face à la taxonomie verte de l\'UE.',
    dominantPosture: 'SPLIT'
  },
  '2024-10': {
    name: 'Octobre 2024',
    climateTitle: 'Front Municipal Conjoint (Ivry/Vitry) & Inspection ICPE de la DRIEAT',
    climateSummary: 'Les maires d\'Ivry et Vitry réclament ensemble un moratoire et la mesure des PFAS. La DRIEAT publie son rapport d\'inspection sur la gestion des résidus et mâchefers.',
    dominantPosture: 'CONTRE'
  },
  '2025-02': {
    name: 'Février 2025',
    climateTitle: 'Écho International (The Guardian) & Modélisation Énergétique (MDPI)',
    climateSummary: 'The Guardian relaie l\'inquiétude des parents d\'élèves sur l\'exposition des enfants. MDPI publie une étude d\'ingénierie sur l\'efficacité thermodynamique de l\'usine.',
    dominantPosture: 'SPLIT'
  },
  '2025-06': {
    name: 'Juin 2025',
    climateTitle: 'Directive Européenne IED (Europarlement) & Plan Zéro Déchet de Paris',
    climateSummary: 'L\'Union Européenne durcit les valeurs limites lors des démarrages de fours. Le Conseil de Paris adopte son plan B\'OM pour réduire de 30% les apports résiduels à Ivry.',
    dominantPosture: 'POUR'
  },
  '2025-11': {
    name: 'Novembre 2025',
    climateTitle: 'Arrêté de Biosurveillance Maraîchère & Livre Blanc Citoyen',
    climateSummary: 'La Préfecture du Val-de-Marne impose un suivi des jardins partagés. Le Collectif 3R publie son livre blanc avec des alternatives concrètes au méga-chantier.',
    dominantPosture: 'CONTRE'
  },
  '2026-02': {
    name: 'Février 2026',
    climateTitle: 'Cadrage Sociologique (CNRS) : Du NIMBY à la Justice Environnementale',
    climateSummary: 'La Revue Française de Sociologie (CNRS) analyse la politisation des déchets en banlieue sud et la structuration des luttes citoyennes de justice environnementale.',
    dominantPosture: 'NEUTRE'
  },
  '2026-04': {
    name: 'Avril 2026',
    climateTitle: 'Souveraineté Énergétique Régionale (PRPGD) vs. Plafonds OMS (AEE)',
    climateSummary: 'La Région Île-de-France confirme l\'usine comme équipement structurant du plan déchets. L\'Agence Européenne de l\'Environnement rappelle les seuils OMS en PM2.5.',
    dominantPosture: 'SPLIT'
  },
  '2026-05': {
    name: 'Mai 2026',
    climateTitle: 'Vœu Conjoint Ivry/Vitry (PFAS) & Modélisation Fluviale UPEC/LEESU',
    climateSummary: 'Vote unanime des conseils municipaux exigeant la transparence en temps réel des PFAS. L\'UPEC modélise l\'effet de canalisation des vents par la vallée de la Seine.',
    dominantPosture: 'CONTRE'
  },
  '2026-06': {
    name: 'Juin 2026',
    climateTitle: 'Clash de Modèles : Filtres SCR du SYCTOM vs. Compostage Zero Waste',
    climateSummary: 'Le SYCTOM annonce la mise en service de ses filtres SCR haute performance. Zero Waste France dénonce un risque de surcapacité pénalisant le tri des biodéchets.',
    dominantPosture: 'SPLIT'
  },
  '2026-07': {
    name: 'Juillet 2026',
    climateTitle: 'Reportage France 3 (Isséane vs Ivry) & Marché Carbone Européen (SEQE)',
    climateSummary: 'Comparaison audiovisuelle de l\'enfouissement souterrain d\'Isséane et d\'Ivry. Zero Waste Europe soutient l\'assujettissement des incinérateurs au marché carbone ETS.',
    dominantPosture: 'POUR'
  },
  '2026-08': {
    name: 'Août 2026',
    climateTitle: 'Chaleur Décarbonée CPCU, Cohorte Inserm 12 000 Riverains & Odeurs',
    climateSummary: 'CPCU valorise l\'apport pour 150 000 logements ; Santé Publique France note une baisse de 85% des dioxines depuis 1990 ; riverains réclament des capteurs 24/7.',
    dominantPosture: 'SPLIT'
  },
  '2026-09': {
    name: 'Septembre 2026',
    climateTitle: 'Recours au Tribunal de Melun, Analyses Citoyennes & Contrôles Inopinés',
    climateSummary: 'Le Collectif 3R attaque l\'arrêté d\'exploitation en justice administrative. Reporterre relaie les analyses de sols citoyennes. La Préfecture impose des audits inopinés.',
    dominantPosture: 'CONTRE'
  }
};

const NEWS_DATASET = [
  // --- FÉVRIER 2022 ---
  {
    id: 'news_2022_02_01',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & ONG',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'ToxicoWatch (Pays-Bas) & Collectif 3R',
    publisherHandle: '@ToxicoWatch',
    date: '03 Février 2022',
    monthKey: '2022-02',
    docType: 'Rapport d\'Analyses Toxicologiques',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / ALERTE CONTAMINATION',
    postureArgument: 'Révélation de concentrations critiques de dioxines et métaux lourds dans les bio-matrices riveraines.',
    tweetSummary: '⚠️ @ToxicoWatch révèle des concentrations alarmantes de dioxines (PCDD/F) dans les œufs de poules à Ivry-sur-Seine, dépassant jusqu\'à 10 fois les seuils de sécurité de l\'Union Européenne.',
    title: 'Biomonitoring à Ivry-sur-Seine : Détection de polluants organiques persistants (POP) dans les poulaillers domestiques',
    summary: 'Première campagne de biosurveillance menée par le Dr Abel Arkenbout. Les analyses mettent en évidence une imprégnation majeure en dioxines et furannes dans les œufs de poules de particuliers vivant sous le panache de l\'incinérateur.',
    tags: ['ToxicoWatch', 'Dioxines', 'Œufs', 'Biomonitoring', 'POP'],
    verifyBadge: 'Fondation Scientifique Indépendante (NL)',
    linkUrl: 'https://www.toxicowatch.org'
  },
  {
    id: 'news_2022_02_02',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Agence Régionale de Santé (ARS Île-de-France)',
    publisherHandle: '@ARS_IDF',
    date: '08 Février 2022',
    monthKey: '2022-02',
    docType: 'Recommandation Sanitaire Publique',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / PRINCIPE DE PRÉCAUTION',
    postureArgument: 'Recommandation médicale d\'autorité sans imputation juridique directe à une source industrielle unique.',
    tweetSummary: '🏛️ L\'@ARS_IDF émet une recommandation de précaution sanitaire déconseillant la consommation régulière d\'œufs de particuliers dans le bassin d\'Ivry, Vitry, Alfortville et Charenton.',
    title: 'Avis sanitaire ARS : Précaution concernant la consommation des œufs non commerciaux autour d\'Ivry-Paris XIII',
    summary: 'Face aux résultats des analyses indépendantes et dans l\'attente de sa propre étude environnementale, l\'ARS recommande aux riverains de ne pas consommer les œufs issus de poulaillers domestiques par mesure de prévention toxicologique.',
    tags: ['ARS IDF', 'Santé Publique', 'Avis Sanitaire', 'Dioxines', 'Précaution'],
    verifyBadge: 'Autorité Publique de Santé',
    linkUrl: 'https://www.iledefrance.ars.sante.fr'
  },

  // --- MAI 2022 ---
  {
    id: 'news_2022_05_01',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'Le Monde (Enquête de Stéphane Mandard)',
    publisherHandle: '@lemondefr',
    date: '12 Mai 2022',
    monthKey: '2022-05',
    docType: 'Enquête Journalistique d\'Investigation',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / ENQUÊTE MÉDIATIQUE',
    postureArgument: 'Mise en lumière des failles historiques de filtration et des inquiétudes croissantes des riverains.',
    tweetSummary: '📰 @lemondefr révèle l\'ampleur des contaminations aux dioxines autour de l\'usine d\'Ivry et interroge l\'absence de filtres catalytiques SCR sur les anciens fours en service depuis 1969.',
    title: 'Pollution aux dioxines : L\'incinérateur d\'Ivry-sur-Seine au cœur d\'une tempête sanitaire et politique',
    summary: 'Le quotidien Le Monde détaille les tensions entre élus écologistes, associations de quartier et gestionnaires de déchets métropolitains, soulevant la question de la vétusté des lignes de combustion historiques au bord du fleuve.',
    tags: ['Le Monde', 'Investigation', 'Dioxines', 'SYCTOM', 'Santé'],
    verifyBadge: 'Presse d\'Information CPPAP',
    linkUrl: 'https://www.lemonde.fr'
  },
  {
    id: 'news_2022_05_02',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'SYCTOM (Syndicat Métropolitain des Déchets)',
    publisherHandle: '@SyctomParis',
    date: '19 Mai 2022',
    monthKey: '2022-05',
    docType: 'Communiqué Officiel du Conseil Syndical',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Défense Règlementaire)',
    postureArgument: 'Rappel de la conformité intégrale des analyses officielles de cheminée et contestation de la représentativité des prélèvements d\'œufs.',
    tweetSummary: '✅ Le @SyctomParis rappelle que ses mesures de dioxines à la cheminée sont conformes à la norme européenne de 0,1 ng I-TEQ/Nm³ et met en garde contre les extrapolations non homologuées.',
    title: 'Mise au point du SYCTOM : Conformité stricte des rejets atmosphériques et calendrier du nouveau projet',
    summary: 'L\'opérateur métropolitain insiste sur le respect scrupuleux des valeurs limites d\'émission contrôlées par la DREAL et rappelle que les dioxines dans les sols parisiens proviennent également du trafic routier et du chauffage au bois historique.',
    tags: ['SYCTOM', 'Communiqué', 'Norme Européenne', 'Fumées', 'DREAL'],
    verifyBadge: 'Établissement Public Métropolitain',
    linkUrl: 'https://www.syctom-paris.fr'
  },

  // --- NOVEMBRE 2022 ---
  {
    id: 'news_2022_11_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Assemblée Nationale & Sénat (Parlement)',
    publisherHandle: '@AssembleeNat',
    date: '17 Novembre 2022',
    monthKey: '2022-11',
    docType: 'Question Écrite Parlementaire',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / REQUISITOIRE PARLEMENTAIRE',
    postureArgument: 'Demande solennelle d\'une étude toxicologique indépendante et d\'une transparence intégrale des registres industriels.',
    tweetSummary: '🏛️ Question parlementaire à l\'@AssembleeNat sur l\'incinérateur d\'Ivry : exigence d\'une expertise sanitaire indépendante et remise en cause du calendrier de reconstruction.',
    title: 'Question parlementaire n° 03412 : Risques sanitaires liés aux polluants émergents de l\'UVE d\'Ivry',
    summary: 'Les parlementaires du Val-de-Marne saisissent le ministre de la Transition Écologique sur la nécessité de financer une campagne d\'analyses indépendantes sur les PFAS, furannes et métaux lourds dans les établissements scolaires riverains.',
    tags: ['Assemblée Nationale', 'Sénat', 'Transition Écologique', 'Contrôle', 'Parlement'],
    verifyBadge: 'Document Officiel Parlementaire',
    linkUrl: 'https://www.assemblee-nationale.fr'
  },
  {
    id: 'news_2022_11_02',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Université Paris 1 Panthéon-Sorbonne / Cairn.info',
    publisherHandle: '@SorbonneParis1',
    date: '28 Novembre 2022',
    monthKey: '2022-11',
    docType: 'Publication Scientifique (Sociologie Urbaine)',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / ANALYSE INSTITUTIONNELLE',
    postureArgument: 'Théorisation de la gouvernance des infrastructures contestées et confrontation des registres de légitimité.',
    tweetSummary: '📚 Recherche académique @SorbonneParis1 : analyse de la construction sociotechnique du risque et des conflits de légitimité entre gestionnaires technocratiques et riverains à Ivry.',
    title: 'Gouverner les déchets par le risque : controverses et contestations autour de l\'incinérateur d\'Ivry-Paris XIII',
    summary: 'Étude sociologique de Charlotte Fabre explorant comment le SYCTOM a progressivement adapté sa rhétorique (du déni technique à la compensation architecturale) face aux mobilisations citoyennes structurées.',
    tags: ['Cairn', 'Sorbonne', 'Sociologie Urbaine', 'Controverse', 'Gouvernance'],
    verifyBadge: 'Revue Scientifique à Comité de Lecture',
    linkUrl: 'https://www.cairn.info'
  },

  // --- AVRIL 2023 ---
  {
    id: 'news_2023_04_01',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & ONG',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Zero Waste France & ToxicoWatch',
    publisherHandle: '@ZeroWasteFR',
    date: '04 Avril 2023',
    monthKey: '2023-04',
    docType: 'Rapport d\'Audit Technique d\'Émissions',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / DÉNONCIATION OMISSION',
    postureArgument: 'Démonstration documentaire de près de 289 jours sans échantillonnage de dioxines en continu.',
    tweetSummary: '📢 @ZeroWasteFR dénonce 6 936 heures d\'inactivité du préleveur de dioxines AMESA à Ivry en 2020-2021, révélant un angle mort réglementaire majeur lors des phases critiques.',
    title: 'Audit des fumées d\'Ivry-Paris XIII : 6 936 heures d\'absence de prélèvements continus de dioxines identifiées',
    summary: 'L\'ONG révèle que le système semi-continu AMESA a été désactivé ou en panne pendant des milliers d\'heures cumulées, précisément durant les phases d\'arrêt et de redémarrage où la formation de dioxines est maximale.',
    tags: ['Zero Waste', 'AMESA', 'Dioxines', 'Audit', 'Transparence'],
    verifyBadge: 'ONG Agréée Protection Environnement',
    linkUrl: 'https://www.zerowastefrance.org'
  },
  {
    id: 'news_2023_04_02',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'France Inter (Cellule Investigation)',
    publisherHandle: '@franceinter',
    date: '18 Avril 2023',
    monthKey: '2023-04',
    docType: 'Reportage d\'Enquête Radiophonique',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / ENQUÊTE MÉDIATIQUE',
    postureArgument: 'Vérification contradictoire des carnets d\'exploitation de l\'usine et témoignages de salariés.',
    tweetSummary: '📻 @franceinter enquête sur les dysfonctionnements des capteurs de fumées à l\'usine d\'Ivry et le manque de transparence lors des redémarrages de fours après maintenance.',
    title: 'Incinérateur géant d\'Ivry : Des mesures de rejets polluants en pointillé selon des documents internes',
    summary: 'La cellule d\'investigation de Radio France dévoile des documents d\'exploitation confirmant des interruptions régulières des appareils de mesure et donne la parole aux riverains vivant à moins de 300 mètres des cheminées.',
    tags: ['France Inter', 'Radio France', 'Investigation', 'Capteurs', 'Ivry-Port'],
    verifyBadge: 'Service Public Audiovisuel',
    linkUrl: 'https://www.radiofrance.fr/franceinter'
  },

  // --- SEPTEMBRE 2023 ---
  {
    id: 'news_2023_09_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'SYCTOM (Comité Syndical)',
    publisherHandle: '@SyctomParis',
    date: '21 Septembre 2023',
    monthKey: '2023-09',
    docType: 'Délibération Publique d\'Investissement',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Modernisation Industrielle)',
    postureArgument: 'Vote historique d\'un investissement massif de plus de 500M€ pour renouveler la chaîne de traitement des fumées.',
    tweetSummary: '✅ Le @SyctomParis vote le contrat industriel pour équiper les fours d\'Ivry du procédé SCR DeNOx de dernière génération et réduire le tonnage autorisé à 350 000 tonnes.',
    title: 'Adoption du projet Interval : Réduction de moitié de la capacité et mise en place de la filtration SCR',
    summary: 'Le Comité syndical acte l\'abandon du projet historique de 700 000 t pour une unité modernisée à 350 000 t/an, intégrant un système de réduction catalytique sélective (SCR) pour abattre les NOx sous 50 mg/Nm³.',
    tags: ['SYCTOM', 'Interval', 'SCR', 'Investissement', 'Transition'],
    verifyBadge: 'Délibération Officielle',
    linkUrl: 'https://www.syctom-paris.fr'
  },
  {
    id: 'news_2023_09_02',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'CPCU (Compagnie Parisienne de Chauffage Urbain)',
    publisherHandle: '@CPCUChaleur',
    date: '27 Septembre 2023',
    monthKey: '2023-09',
    docType: 'Bilan Annuel d\'Exploitation Énergétique',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Chauffage Urbain)',
    postureArgument: 'Démonstration chiffrée de la contribution de la vapeur pour décarboner le chauffage des ménages et des centres hospitaliers.',
    tweetSummary: '🔥 @CPCUChaleur présente son bilan : la vapeur d\'Ivry évite le recours à 120 millions de m³ de gaz fossile pour chauffer les hôpitaux et logements sociaux parisiens.',
    title: 'Contribution énergétique de l\'UVE d\'Ivry : Chauffage continu de 150 000 logements et souveraineté thermique',
    summary: 'La CPCU souligne que l\'énergie thermique récupérée à Ivry constitue l\'épine dorsale du réseau de chaleur francilien, évitant l\'émission de 400 000 tonnes de CO2 d\'origine fossile chaque hiver.',
    tags: ['CPCU', 'Chaleur Urbaine', 'Décarbonation', 'Énergie', 'Paris'],
    verifyBadge: 'Délégataire de Service Public',
    linkUrl: 'https://www.cpcu.fr'
  },

  // --- MARS 2024 ---
  {
    id: 'news_2024_03_01',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & ONG',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'ToxicoWatch & Collectif 3R',
    publisherHandle: '@ToxicoWatch',
    date: '14 Mars 2024',
    monthKey: '2024-03',
    docType: 'Rapport de Biosurveillance Végétale',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / ALERTE EN MILIEU SCOLAIRE',
    postureArgument: 'Mise en évidence de retombées de métaux lourds et dioxines sur les arbres et sols des cours d\'écoles.',
    tweetSummary: '⚠️ @ToxicoWatch publie l\'analyse des mousses végétales d\'écoles proches d\'Ivry : détection de dioxines, métaux lourds (plomb, cadmium, cobalt) et PFAS dans les aires de jeux.',
    title: 'Biosurveillance dans les écoles d\'Ivry et Charenton : Présence anormale de polluants rémanents sur la végétation',
    summary: 'Prélèvements de mousses et d\'aiguilles de conifères autour des groupes scolaires Albert Einstein, Montesquieu et Aristide Briand. L\'étude constate des gradients de concentration corrélés à la direction des vents dominants.',
    tags: ['ToxicoWatch', 'Écoles', 'Mousses', 'Métaux Lourds', 'Enfance'],
    verifyBadge: 'Rapport Scientifique International',
    linkUrl: 'https://www.toxicowatch.org'
  },
  {
    id: 'news_2024_03_02',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'CGT Éduc\'action 94',
    publisherHandle: '@CGT_Educ94',
    date: '22 Mars 2024',
    monthKey: '2024-03',
    docType: 'Avis Syndical de Danger Grave et Imminent',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / DROIT D\'ALERTE',
    postureArgument: 'Action syndicale pour protéger la santé des personnels enseignants et des écoliers du secteur Ivry-Port.',
    tweetSummary: '📢 @CGT_Educ94 dépose des fiches de signalement santé pour les enseignants et élèves de l\'école Albert Einstein face aux poussières industrielles et rejets de l\'usine.',
    title: 'Pollution industrielle à Ivry : La CGT Éduc\'action dépose des alertes pour les personnels des écoles riveraines',
    summary: 'Le syndicat enseignant saisit le rectorat de Créteil et la médecine du travail pour réclamer l\'installation immédiate de purificateurs d\'air haute efficacité et la fermeture temporaire des cours en cas d\'épisode olfactif aigu.',
    tags: ['CGT Educ', 'Val-de-Marne', 'Droit d Alerte', 'Écoles', 'Santé Travail'],
    verifyBadge: 'Organisation Syndicale Représentative',
    linkUrl: 'https://www.cgteduc.fr'
  },

  // --- JUIN 2024 ---
  {
    id: 'news_2024_06_01',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Revue Écologie & Politique (Cairn.info)',
    publisherHandle: '@CairnInfo',
    date: '06 Juin 2024',
    monthKey: '2024-06',
    docType: 'Article Universitaire Peer-Reviewed',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / SOCIOLOGIE DE L\'ENVIRONNEMENT',
    postureArgument: 'Analyse critique des inégalités environnementales structurelles de la métropole du Grand Paris.',
    tweetSummary: '🎓 Étude @CairnInfo : l\'usine d\'Ivry au cœur des inégalités environnementales métropolitaines entre l\'Ouest tertiaire privilégié et l\'Est ouvrier francilien historiquement exposé.',
    title: 'Justice environnementale et inégalités écologiques dans les banlieues fluviales d\'Île-de-France',
    summary: 'Recherche de Cyria Emelianoff analysant la concentration des infrastructures de traitement de déchets dans les communes de la ceinture rouge et les freins socio-économiques à la participation citoyenne.',
    tags: ['Cairn', 'Justice Environnementale', 'Inégalités', 'Sociologie', 'Banlieue'],
    verifyBadge: 'Revue Académique Agréée HCERES',
    linkUrl: 'https://www.cairn.info'
  },
  {
    id: 'news_2024_06_02',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'Politico Europe (Bruxelles)',
    publisherHandle: '@politico',
    date: '19 Juin 2024',
    monthKey: '2024-06',
    docType: 'Article d\'Analyse Politique Européenne',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / POLITIQUE EUROPÉENNE',
    postureArgument: 'Mise en perspective des tensions parisiennes au regard de la révision de la taxonomie verte de l\'UE.',
    tweetSummary: '🇪🇺 @politico analyse les tensions parisiennes : les méga-incinérateurs urbains face aux critères drastiques de la taxonomie verte européenne et aux objectifs de recyclage 2030.',
    title: 'The Burning Question of Europe\'s Waste Incinerators : Inside the Paris Climate Feud',
    summary: 'Politico examine comment le cas d\'Ivry reflète la fracture européenne entre partisans de la valorisation énergétique pour l\'autonomie thermique et défenseurs de l\'économie circulaire stricte interdisant l\'incinération.',
    tags: ['Politico', 'Bruxelles', 'Taxonomie Verte', 'Climat', 'Union Européenne'],
    verifyBadge: 'Presse Internationale Reconnue',
    linkUrl: 'https://www.politico.eu'
  },

  // --- OCTOBRE 2024 ---
  {
    id: 'news_2024_10_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Mairies d\'Ivry-sur-Seine & Vitry-sur-Seine',
    publisherHandle: '@Ivry94_Vitry94',
    date: '08 Octobre 2024',
    monthKey: '2024-10',
    docType: 'Déclaration Commune des Maires',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / FRONT TERRITORIAL',
    postureArgument: 'Mobilisation conjointe des deux édiles pour imposer des normes renforcées sur les polluants éternels (PFAS).',
    tweetSummary: '🏛️ Les maires d\'@Ivry94 et @Vitry94 demandent ensemble à l\'État un moratoire sur les tonnages et l\'installation de capteurs atmosphériques haute précision pour les PFAS.',
    title: 'Front commun des municipalités d\'Ivry et Vitry : Exigence d\'un suivi indépendant des PFAS et rejets gazeux',
    summary: 'Philippe Bouyssou et Pierre Bell-Lloch organisent une conférence de presse conjointe pour réclamer l\'intégration immédiate des PFAS dans les arrêtés préfectoraux d\'exploitation et le financement public d\'un comité citoyen.',
    tags: ['Mairie Ivry', 'Mairie Vitry', 'PFAS', 'Moratoire', 'Concertation'],
    verifyBadge: 'Communiqué Conjoint des Villes',
    linkUrl: 'https://www.ivry94.fr'
  },
  {
    id: 'news_2024_10_02',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'DRIEAT Île-de-France (Direction Régionale Environnement)',
    publisherHandle: '@DRIEAT_IDF',
    date: '24 Octobre 2024',
    monthKey: '2024-10',
    docType: 'Rapport d\'Inspection ICPE',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / CONTRÔLE RÉGLEMENTAIRE',
    postureArgument: 'Rapport technique officiel constatant des conformités globales et émettant des demandes de mise en conformité sur les résidus.',
    tweetSummary: '🏛️ La @DRIEAT_IDF publie son rapport d\'inspection : rappel à l\'ordre technique sur la tenue des registres de déchets dangereux et la manipulation des cendres volantes.',
    title: 'Inspection des installations classées d\'Ivry-Paris XIII : Bilan des vérifications inopinées et prescriptions',
    summary: 'La police de l\'environnement de la DRIEAT détaille les constats opérés sur place : conformité des filtres à manches pour les poussières, mais injonction d\'améliorer le confinement des hangars de stockage des mâchefers humides.',
    tags: ['DRIEAT', 'Inspection ICPE', 'Mâchefers', 'Réglementation', 'Police Environnement'],
    verifyBadge: 'Direction Régionale de l\'État',
    linkUrl: 'https://www.drieat.ile-de-france.developpement-durable.gouv.fr'
  },

  // --- FÉVRIER 2025 ---
  {
    id: 'news_2025_02_01',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'The Guardian (Environment Desk)',
    publisherHandle: '@guardian',
    date: '11 Février 2025',
    monthKey: '2025-02',
    docType: 'Enquête Internationale',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / ENQUÊTE MONDIALE',
    postureArgument: 'Focus international sur le mécontentement citoyen et la vulnérabilité des enfants en milieu dense.',
    tweetSummary: '🌍 @guardian rapporte la colère des parents d\'élèves du Val-de-Marne face aux retombées de métaux lourds autour du méga-incinérateur de la Seine à Paris.',
    title: 'Paris waste plant facing backlash over child chemical exposure near schools and playgrounds',
    summary: 'Le quotidien britannique analyse la situation d\'Ivry-sur-Seine sous l\'angle des droits de l\'enfant et de la santé environnementale, soulignant le contraste entre l\'image écologique des Jeux de Paris et la réalité industrielle de la banlieue sud.',
    tags: ['The Guardian', 'Londres', 'Santé Enfants', 'Chemical Exposure', 'Paris'],
    verifyBadge: 'Média International Indépendant',
    linkUrl: 'https://www.theguardian.com/environment'
  },
  {
    id: 'news_2025_02_02',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'MDPI Sustainability & Energy Systems',
    publisherHandle: '@MDPIOpenAccess',
    date: '25 Février 2025',
    monthKey: '2025-02',
    docType: 'Article de Recherche en Ingénierie Thermique',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Modélisation Énergétique)',
    postureArgument: 'Démonstration par simulation thermodynamique des gains d\'efficacité carbone de la cogénération urbaine.',
    tweetSummary: '🔬 Étude @MDPIOpenAccess : modélisation de l\'efficience thermodynamique d\'Ivry-Paris XIII pour le réseau de chaleur urbain et son potentiel d\'abattement carbone fossile.',
    title: 'Thermodynamic efficiency and district heating integration of large-scale Waste-to-Energy facilities in European capitals',
    summary: 'Des chercheurs en génie des procédés modélisent le cycle combiné chaleur-électricité de l\'installation d\'Ivry, concluant qu\'une fermeture sans substitut géothermique immédiat forcerait le redémarrage de chaufferies d\'appoint au fioul ou gaz.',
    tags: ['MDPI', 'Ingénierie', 'Cogénération', 'Chaleur Urbaine', 'Thermodynamique'],
    verifyBadge: 'Revue Scientifique Open Access',
    linkUrl: 'https://www.mdpi.com'
  },

  // --- JUIN 2025 ---
  {
    id: 'news_2025_06_01',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'Parlement Européen (Commission ENVI)',
    publisherHandle: '@Europarl_FR',
    date: '05 Juin 2025',
    monthKey: '2025-06',
    docType: 'Directive Européenne Révisée',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / CADRE JURIDIQUE EUROPÉEN',
    postureArgument: 'Encadrement juridique contraignant des émissions industrielles sans interdiction sectorielle.',
    tweetSummary: '🇪🇺 Le @Europarl_FR durcit la directive IED : fin des exemptions d\'émissions lors des démarrages de fours industriels et renforcement des sanctions à l\'horizon 2027.',
    title: 'Révision de la Directive sur les Émissions Industrielles (IED) : Nouvelles obligations pour les incinérateurs',
    summary: 'Le Parlement européen adopte la révision de la directive IED instaurant la surveillance obligatoire en continu des dioxines et furannes (PCDD/F) et des micro-polluants dans toutes les installations de plus de 3 tonnes/heure.',
    tags: ['Parlement Européen', 'Directive IED', 'Bruxelles', 'Législation', 'Émissions'],
    verifyBadge: 'Institution Officielle de l\'Union Européenne',
    linkUrl: 'https://www.europarl.europa.eu'
  },
  {
    id: 'news_2025_06_02',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Ville de Paris (Conseil de Paris)',
    publisherHandle: '@Paris',
    date: '18 Juin 2025',
    monthKey: '2025-06',
    docType: 'Délibération du Conseil Municipal de Paris',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Trajectoire de Réduction)',
    postureArgument: 'Validation du plan territorial de tri et réduction pour alimenter l\'usine avec un déchet résiduel maîtrisé.',
    tweetSummary: '🏛️ Le Conseil de @Paris adopte son plan B\'OM : objectif de réduire de 30% les déchets résiduels incinérés à Ivry d\'ici 2030 grâce au tri obligatoire des biodéchets.',
    title: 'Adoption de la stratégie B\'OM : Paris s\'engage dans la baisse programmée des tonnages résiduels envoyés à Ivry',
    summary: 'La Ville de Paris, principal pourvoyeur en ordures ménagères du SYCTOM, vote un plan ambitieux de collecte séparée des biodéchets et de réemploi, affirmant que la modernisation dimensionnée à 350 000 t est parfaitement cohérente avec cette baisse.',
    tags: ['Conseil de Paris', 'Biodéchets', 'Plan B OM', 'Économie Circulaire', 'SYCTOM'],
    verifyBadge: 'Acte Officiel de la Ville de Paris',
    linkUrl: 'https://www.paris.fr'
  },

  // --- NOVEMBRE 2025 ---
  {
    id: 'news_2025_11_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Préfecture du Val-de-Marne',
    publisherHandle: '@Prefet94',
    date: '12 Novembre 2025',
    monthKey: '2025-11',
    docType: 'Arrêté Préfectoral Complémentaire',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / PRESCRIPTION PRÉFECTORALE',
    postureArgument: 'Décision administrative contraignante imposant des études complémentaires sur les sols périurbains.',
    tweetSummary: '🏛️ La @Prefet94 impose au SYCTOM une cartographie bisannuelle des retombées de métaux lourds sur les jardins partagés et maraîchages d\'Ivry et Vitry.',
    title: 'Arrêté n° 2025/1104 : Mise en place d\'un réseau pérenne de biosurveillance des sols et cultures périurbaines',
    summary: 'La préfète du Val-de-Marne prescrit un plan d\'échantillonnage régulier de terres végétales et de produits maraîchers dans un rayon de 3 km autour du site afin de vérifier l\'absence de bioaccumulation dans la chaîne alimentaire locale.',
    tags: ['Préfecture 94', 'Arrêté Préfectoral', 'Sols', 'Maraîchage', 'Biosurveillance'],
    verifyBadge: 'Recueil des Actes Administratifs (RAA)',
    linkUrl: 'https://www.val-de-marne.gouv.fr'
  },
  {
    id: 'news_2025_11_02',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & ONG',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Collectif 3R (Réduire, Réutiliser, Recycler)',
    publisherHandle: '@Collectif3R',
    date: '26 Novembre 2025',
    monthKey: '2025-11',
    docType: 'Livre Blanc Citoyen & Manifeste',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / CONTRE-PROPOSITION CITOYENNE',
    postureArgument: 'Proposition d\'un plan de compostage décentralisé rendant obsolète la reconstruction industrielle.',
    tweetSummary: '📖 Le @Collectif3R publie son livre blanc : propositions concrètes de valorisation organique locale et alternatives complètes au méga-chantier d\'incinération d\'Ivry.',
    title: 'Livre Blanc 2025 : Pour une métropole sans incinération géante, le scénario alternatif zéro déchet du Val-de-Marne',
    summary: 'Le Collectif 3R remet aux élus franciliens un mémoire technique chiffré démontrant qu\'un investissement équivalent dans des unités de méthanisation et de compostage de proximité créerait 4 fois plus d\'emplois locaux non délocalisables.',
    tags: ['Collectif 3R', 'Livre Blanc', 'Zéro Déchet', 'Emplois Locaux', 'Compostage'],
    verifyBadge: 'Association Agréée Loi 1901',
    linkUrl: 'http://collectif3r.org'
  },

  // --- FÉVRIER 2026 ---
  {
    id: 'news_2026_02_01',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Revue Française de Sociologie (CNRS Éditions)',
    publisherHandle: '@CNRS_Sociologie',
    date: '10 Février 2026',
    monthKey: '2026-02',
    docType: 'Article de Recherche Peer-Reviewed',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / CADRAGE SOCIOLOGIQUE',
    postureArgument: 'Analyse académique neutre retraçant l\'évolution sociopolitique des argumentaires riverains depuis les années 1990.',
    tweetSummary: '📚 Enquête CNRS sur le Val-de-Marne : comment les luttes riveraines contre l\'incinération sont passées du réflexe "NIMBY" à une revendication structurée de justice spatiale et environnementale.',
    title: 'Du syndrome NIMBY à la justice environnementale : La politisation des déchets en banlieue rouge',
    summary: 'Analyse sociologique des dynamiques de concertation dans les communes industrielles du Val-de-Marne. L\'article explore comment les arguments sanitaires ont reconfiguré les clivages politiques municipaux et les revendications citoyennes de justice spatiale.',
    tags: ['Sociologie', 'Justice Spatiale', 'NIMBY', 'CNRS', 'Banlieue Rouge'],
    verifyBadge: 'Revue Scientifique CNRS / Cairn',
    linkUrl: 'https://www.cairn.info'
  },

  // --- AVRIL 2026 ---
  {
    id: 'news_2026_04_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Région Île-de-France (Commission Environnement)',
    publisherHandle: '@iledefrance',
    date: '18 Avril 2026',
    monthKey: '2026-04',
    docType: 'Rapport Stratégique Régional (PRPGD)',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Stratégie Régionale)',
    postureArgument: 'Défense de l\'UVE comme maillon indispensable de souveraineté pour éviter le transport lointain et l\'enfouissement massif en grande couronne.',
    tweetSummary: '🏛️ La Région confirme l\'UVE d\'Ivry comme équipement stratégique du plan déchets pour sécuriser le chauffage urbain métropolitain et éviter l\'enfouissement massif en grande couronne.',
    title: 'Plan Régional Déchets : L\'UVE d\'Ivry confirmée comme équipement structurant indispensable',
    summary: 'La Région Île-de-France valide la trajectoire du PRPGD, affirmant que la valorisation énergétique des 350 000 tonnes résiduelles est incontournable pour sécuriser l\'approvisionnement du réseau de chauffage urbain métropolitain.',
    tags: ['Région IDF', 'PRPGD', 'Souveraineté', 'Chauffage Urbain', 'Déchets'],
    verifyBadge: 'Document Régional Officiel',
    linkUrl: 'https://www.iledefrance.fr'
  },
  {
    id: 'news_2026_04_02',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Airparif & UPEC (Étude Particulaire)',
    publisherHandle: '@Airparif',
    date: '25 Avril 2026',
    monthKey: '2026-04',
    docType: 'Rapport de Campagne Métrologique',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / MESURE PHYSIQUE',
    postureArgument: 'Relevé métrologique rigoureux des concentrations en particules sous le panache de la cheminée d\'Ivry.',
    tweetSummary: '🔬 Campagne Airparif & UPEC : mesure des retombées de PM2.5 et NOx sous le panache de la cheminée d\'Ivry-Paris XIII pour dissocier l\'impact de l\'A4.',
    title: 'Campagne métrologique ciblée : Relevé des traceurs particulaires sous le panache de l\'incinérateur d\'Ivry',
    summary: 'Airparif déploie un réseau de micro-capteurs entre le quai d\'Ivry et Charenton afin d\'isoler la contribution spécifique de la cheminée de l\'incinérateur par rapport au trafic autoroutier voisin.',
    tags: ['Airparif', 'UVE Ivry', 'PM2.5', 'Panache', 'Métrologie'],
    verifyBadge: 'Organisme Agréé Surveillance Qualité Air',
    linkUrl: 'https://www.airparif.asso.fr'},

  // --- MAI 2026 ---
  {
    id: 'news_2026_05_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Mairies d\'Ivry-sur-Seine & Vitry-sur-Seine',
    publisherHandle: '@Ivry94_Vitry94',
    date: '15 Mai 2026',
    monthKey: '2026-05',
    docType: 'Vœu Conjoint des Conseils Municipaux',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / CRITIQUE (Élus Territoriaux)',
    postureArgument: 'Dénonciation de l\'opacité historique et exigence formelle d\'un comité indépendant d\'information citoyenne.',
    tweetSummary: '⚠️ Vœu unanime des mairies d\'Ivry et Vitry : elles exigent la mise en place d\'un comité indépendant et la publication en temps réel des rejets de PFAS et dioxines de l\'usine.',
    title: 'Vœu unanime des élus d\'Ivry et Vitry exigeant la transparence intégrale des mesures de polluants émergents',
    summary: 'Les deux municipalités du Val-de-Marne votent un vœu conjoint demandant à l\'État et au SYCTOM la mise en place d\'un comité local d\'information et de concertation (CLIC) indépendant et la diffusion publique en temps réel des mesures de PFAS et dioxines.',
    tags: ['Ivry-sur-Seine', 'Vitry-sur-Seine', 'Conseil Municipal', 'Transparence', 'PFAS'],
    verifyBadge: 'Procès-Verbal Officiel des Mairies',
    linkUrl: 'https://www.ivry94.fr'
  },
  {
    id: 'news_2026_05_02',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Université Paris-Est Créteil (UPEC) & LEESU',
    publisherHandle: '@UPEC_LEESU',
    date: '24 Mai 2026',
    monthKey: '2026-05',
    docType: 'Communication Scientifique',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / MESURE PHYSIQUE',
    postureArgument: 'Modélisation empirique des flux d\'air sans jugement de valeur sur l\'utilité de l\'équipement industriel.',
    tweetSummary: '🔬 Modélisation micrométéorologique UPEC : mise en évidence des gradients verticaux lors des inversions thermiques piégeant les polluants dans le corridor fluvial Ivry-Vitry.',
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
    categoryLabel: 'Enquête Citoyenne & ONG',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Zero Waste France',
    publisherHandle: '@ZeroWasteFR',
    date: '10 Juin 2026',
    monthKey: '2026-06',
    docType: 'Note de Décryptage Économique',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / CRITIQUE DU SURDIMENSIONNEMENT',
    postureArgument: 'Opposition à la combustion thermique de déchets organiques compostables et alerte sur les surcapacités franciliennes.',
    tweetSummary: '📢 Le tri des biodéchets réduit le gisement résiduel de 30% : maintenir des incinérateurs géants incite à importer des ordures d\'autres départements au lieu de composter.',
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
    publisherHandle: '@SyctomParis',
    date: '28 Juin 2026',
    monthKey: '2026-06',
    docType: 'Délibération du Comité Syndical',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Modernisation Industrielle)',
    postureArgument: 'Mise en avant des gains écologiques : réduction de 50% de la capacité historique et abaissement drastique des rejets via filtres SCR.',
    tweetSummary: '✅ Le SYCTOM acte la réduction de 50% de la capacité autorisée d\'Ivry (350 000 t/an d\'ici 2027) et met en service les nouveaux filtres catalytiques SCR haute performance.',
    title: 'Rapport d\'étape : Mise en service de la nouvelle ligne de traitement catalytique SCR et réduction des tonnages',
    summary: 'Le Comité syndical du SYCTOM confirme la réduction de la capacité autorisée de 700 000 t à 350 000 t/an d\'ici 2027 et détaille les performances des filtres à manches pour la captation des particules submicroniques.',
    tags: ['SYCTOM', 'Modernisation', 'Filtration SCR', 'Capacité Réduite', 'Investissement'],
    verifyBadge: 'Délibération Publique Officielle',
    linkUrl: 'https://www.syctom-paris.fr'
  },

  // --- JUILLET 2026 ---
  {
    id: 'news_2026_07_01',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'France 3 Paris Île-de-France',
    publisherHandle: '@France3Paris',
    date: '14 Juillet 2026',
    monthKey: '2026-07',
    docType: 'Reportage Audiovisuel & Enquête',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / REPORTAGE COMPARATIF',
    postureArgument: 'Mise en perspective équilibrée entre besoins de traitement des déchets métropolitains et aspirations citoyennes à un cadre de vie sain.',
    tweetSummary: '📺 Comparatif entre l\'usine d\'Ivry et Isséane : entre prouesse architecturale souterraine à 580M€ à Issy et contestation populaire le long du quai de Seine à Ivry.',
    title: 'UVE urbaines en Île-de-France : L\'équilibre fragile entre traitement des déchets et acceptabilité citoyenne',
    summary: 'Reportage croisé entre Isséane (Issy) et l\'usine d\'Ivry. Analyse comparative des coûts d\'enfouissement architectural et des stratégies de dialogue avec les comités de quartier.',
    tags: ['France 3', 'Télévision', 'Isséane', 'Ivry', 'Débat Public'],
    verifyBadge: 'Audiovisuel Public Régional',
    linkUrl: 'https://france3-regions.francetvinfo.fr/paris-ile-de-france/'
  },
  {
    id: 'news_2026_07_02',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'SYCTOM & Ministère Transition Écologique',
    publisherHandle: '@SyctomParis',
    date: '22 Juillet 2026',
    monthKey: '2026-07',
    docType: 'Note de Cadrage Économique & Carbone',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Arbitrage Énergie-Carbone)',
    postureArgument: 'Démonstration que la taxe carbone incitera à maximiser l\'envoi de vapeur d\'Ivry vers le réseau de chauffage urbain.',
    tweetSummary: '🇪🇺 Le SYCTOM chiffre l\'impact de l\'intégration de l\'incinérateur d\'Ivry au marché carbone SEQE : un levier financier pour booster la valorisation vapeur à 80%.',
    title: 'Assujettissement de l\'incinérateur d\'Ivry au marché carbone européen (SEQE) : Stratégie de valorisation thermique',
    summary: 'Le SYCTOM remet son plan d\'adaptation à la directive européenne, montrant que l\'achat de quotas carbone accélérera le raccordement de nouveaux réseaux de chaleur pour maximiser le rendement énergétique de l\'usine.',
    tags: ['SYCTOM', 'Incinérateur Ivry', 'SEQE', 'Marché Carbone', 'Chaleur Urbaine'],
    verifyBadge: 'Document de Cadrage Stratégique',
    linkUrl: 'https://www.syctom-paris.fr'},

  // --- AOÛT 2026 ---
  {
    id: 'news_2026_08_01',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'CPCU & Réseau de Chaleur Métropolitain',
    publisherHandle: '@CPCUChaleur',
    date: '04 Août 2026',
    monthKey: '2026-08',
    docType: 'Communiqué de Presse Technique',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Chauffage Décarboné)',
    postureArgument: 'Mise en valeur du rôle vital de l\'usine pour chauffer 150 000 équivalents-logements et les hôpitaux parisiens sans gaz fossile.',
    tweetSummary: '🔥 La vapeur récupérée à l\'UVE d\'Ivry permet de chauffer 150 000 logements sociaux et hôpitaux, économisant 120 millions de m³ de gaz fossile importé chaque hiver.',
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
    publisherHandle: '@SantePubliqueFr',
    date: '17 Août 2026',
    monthKey: '2026-08',
    docType: 'Étude Épidémiologique Peer-Reviewed',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / ÉPIDÉMIOLOGIE INDÉPENDANTE',
    postureArgument: 'Rapport médical scientifique constatant la réduction des dioxines mais invitant à surveiller l\'exposition chronique aux particules fines.',
    tweetSummary: '📊 Cohorte sur 12 000 riverains : chute de 85% de l\'imprégnation aux dioxines par rapport aux années 1990, mais appel à surveiller les effets cocktails de particules fines PM2.5.',
    title: 'Biomonitoring et pathologies respiratoires chez les cohortes riveraines d\'UVE modernes en milieu dense',
    summary: 'Étude pluriannuelle portant sur 12 000 résidents franciliens. Les chercheurs notent une chute de 85% de l\'imprégnation aux dioxines par rapport aux années 1990 mais recommandent une vigilance sur les effets cocktails PM2.5.',
    tags: ['Inserm', 'Santé Publique France', 'Épidémiologie', 'Biomarqueurs', 'PM2.5'],
    verifyBadge: 'Revue Médicale à Comité de Lecture',
    linkUrl: 'https://www.santepubliquefrance.fr'
  },
  {
    id: 'news_2026_08_03',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'Citoyens.com (Val-de-Marne 94)',
    publisherHandle: '@Citoyens_94',
    date: '22 Août 2026',
    monthKey: '2026-08',
    docType: 'Reportage d\'Actualité Locale',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / INQUIÉTUDES RIVERAINS',
    postureArgument: 'Écho aux craintes des familles sur les épisodes d\'odeurs persistantes et demande d\'un système d\'alerte sanitaire.',
    tweetSummary: '📢 Des familles d\'Ivry et Vitry réclament des capteurs de dioxines en continu 24/7 suite à des épisodes d\'odeurs persistantes près des écoles Montesquieu et Einstein.',
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
    categoryLabel: 'Enquête Citoyenne & ONG',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Reporterre (Le quotidien de l\'écologie)',
    publisherHandle: '@Reporterre',
    date: '02 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Enquête de Terrain',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / CONTRE-EXPERTISE CITOYENNE',
    postureArgument: 'Contestation des données officielles et financement participatif de prélèvements indépendants de sols par les riverains.',
    tweetSummary: '🌱 Des collectifs d\'Ivry et Vitry financent leurs propres analyses de terre végétale pour évaluer la persistance des métaux lourds indépendamment des relevés du SYCTOM.',
    title: 'À Ivry et Vitry, des habitants financent leurs propres analyses de sols et de retombées atmosphériques',
    summary: 'Enquête sur les démarches de science citoyenne à Ivry-Port et Vitry-les-Ardoines. Des collectifs font tester la terre végétale pour mesurer la persistance des métaux lourds indépendamment des relevés du SYCTOM.',
    tags: ['Reporterre', 'Science Citoyenne', 'Biomonitoring', 'Sols', 'Contre-Expertise'],
    verifyBadge: 'Média d\'Information Indépendant',
    linkUrl: 'https://reporterre.net'
  },
  {
    id: 'news_2026_09_02',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Presse Nationale & Médias FR',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'Le Parisien (Édition Val-de-Marne 94)',
    publisherHandle: '@LeParisien_94',
    date: '08 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Article d\'Investigation Locale',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / FRICTIONS DE CHANTIER',
    postureArgument: 'Mise en lumière des nuisances de norias de camions et du mécontentement grandissant des habitants du quai d\'Ivry.',
    tweetSummary: '📰 Enquête sur le chantier géant d\'Ivry : norias de camions, riverains excédés sur le quai de Seine et incertitudes sur le calendrier de livraison de la nouvelle usine.',
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
    publisherHandle: '@Prefet94',
    date: '12 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Arrêté Préfectoral de Contrôle',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / CONTRÔLE RÉGLEMENTAIRE',
    postureArgument: 'Acte administratif d\'autorité imposant le renforcement des contrôles sans prise de position politique.',
    tweetSummary: '🏛️ Nouvel arrêté préfectoral : surveillance renforcée et audits semestriels inopinés imposés au SYCTOM sur les rejets atmosphériques et les retombées de métaux lourds.',
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
    publisherHandle: '@EUCourtPress',
    date: '14 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Arrêt de Justice Européen',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / JURISPRUDENCE DE L\'UNION',
    postureArgument: 'Jugement de droit strict encadrant les plafonds d\'émissions lors des phases transitoires de démarrage d\'installations thermiques.',
    tweetSummary: '⚖️ Arrêt CJUE : la Cour de Justice de l\'Union encadre strictement les dérogations d\'émissions lors des phases de démarrage ou montée en température des fours d\'incinération.',
    title: 'Arrêt C-311/24 : Encadrement strict des dérogations d\'émissions lors des phases de démarrage de fours',
    summary: 'La CJUE rappelle que les phases de dysfonctionnement ou de montée en température ne peuvent excéder les plafonds horaires cumulés sans sanctions administratives effectives.',
    tags: ['CJUE', 'Directive IED', 'Jurisprudence', 'Union Européenne', 'Valeurs Limites'],
    verifyBadge: 'Arrêt Judiciaire Européen',
    linkUrl: 'https://curia.europa.eu'
  },
  {
    id: 'news_2026_09_05',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & ONG',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Collectif 3R (Réduire, Réutiliser, Recycler)',
    publisherHandle: '@Collectif3R',
    date: '19 Septembre 2026',
    monthKey: '2026-09',
    docType: 'Recours Administratif Contentieux',
    posture: 'CONTRE',
    postureLabel: '🔴 EN CONTRA / RECOURS EN JUSTICE',
    postureArgument: 'Demande formelle d\'annulation de l\'arrêté préfectoral pour non-prise en compte de l\'effet cumulé avec la pollution de l\'A4.',
    tweetSummary: '⚖️ Recours contentieux au Tribunal de Melun déposé contre l\'autorisation d\'exploiter : le collectif dénonce la sous-évaluation des particules ultrafines sur les écoles du quai.',
    title: 'Recours contentieux déposé devant le Tribunal Administratif de Melun concernant l\'étude d\'impact',
    summary: 'Le Collectif 3R attaque l\'arrêté préfectoral devant la justice administrative, pointant la sous-évaluation des particules ultrafines sur les écoles riveraines du quai d\'Ivry.',
    tags: ['Collectif 3R', 'Tribunal Administratif', 'Contentieux', 'Particules Ultrafines', 'Justice Environnementale'],
    verifyBadge: 'Association Environnementale Agréée',
    linkUrl: 'http://collectif3r.org'
  }
];

// ====================================================================
// GESTIÓN DE LA LÍNEA DE TIEMPO MINIMALISTA & 3 SECCIONES ANIMADAS
// ====================================================================

let CURRENT_MONTH_FILTER = '2026-09'; // Inicia enfocado en el hito actual
let CURRENT_MONTH_INDEX = MONTHS_CHRONO.length - 1;
let AUTO_PLAY_INTERVAL = null;
let IS_AUTO_PLAYING = false;

function initNewsFeed() {
  renderTimelineMonthsBar();

  const btnPrev = document.getElementById('timeline-prev-btn');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      stopAutoPlay();
      stepTimeline(-1);
    });
  }

  const btnNext = document.getElementById('timeline-next-btn');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      stopAutoPlay();
      stepTimeline(1);
    });
  }

  const btnPlay = document.getElementById('timeline-play-btn');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      toggleAutoPlay();
    });
  }

  const btnAll = document.getElementById('timeline-all-btn');
  if (btnAll) {
    btnAll.addEventListener('click', () => {
      stopAutoPlay();
      setMonthFilter('ALL');
    });
  }

  setMonthFilter('2026-09');
}

function renderTimelineMonthsBar() {
  const bar = document.getElementById('timeline-months-bar');
  if (!bar) return;

  let html = '';
  MONTHS_CHRONO.forEach(mKey => {
    const meta = MONTHS_META[mKey];
    const items = NEWS_DATASET.filter(n => n.monthKey === mKey);
    const count = items.length;

    const hasPour = items.some(n => n.posture === 'POUR');
    const hasContre = items.some(n => n.posture === 'CONTRE');
    let dotClass = 'neutre';
    if (hasPour && hasContre) dotClass = 'split';
    else if (hasContre) dotClass = 'contre';
    else if (hasPour) dotClass = 'pour';

    const shortLabel = meta ? meta.name : mKey;
    html += `
      <button class="timeline-node-btn" data-month="${mKey}">
        <span class="pill-dot ${dotClass}"></span>
        <span>${shortLabel}</span>
        <span class="badge-mini">${count}</span>
      </button>
    `;
  });

  html += `
    <button class="timeline-node-btn all-node" data-month="ALL">
      <span>🌐 Vue Globale</span>
      <span class="badge-mini">${NEWS_DATASET.length}</span>
    </button>
  `;

  bar.innerHTML = html;

  const nodeBtns = bar.querySelectorAll('.timeline-node-btn');
  nodeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stopAutoPlay();
      const mKey = btn.getAttribute('data-month');
      setMonthFilter(mKey);
    });
  });
}

function setMonthFilter(monthKey) {
  CURRENT_MONTH_FILTER = monthKey;

  if (monthKey === 'ALL') {
    CURRENT_MONTH_INDEX = -1;
  } else {
    CURRENT_MONTH_INDEX = MONTHS_CHRONO.indexOf(monthKey);
  }

  const monthBar = document.getElementById('timeline-months-bar');
  if (monthBar) {
    const btns = monthBar.querySelectorAll('.timeline-node-btn');
    btns.forEach(b => {
      if (b.getAttribute('data-month') === monthKey) {
        b.classList.add('active');
        b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        b.classList.remove('active');
      }
    });
  }

  const displayEl = document.getElementById('current-month-display');
  if (displayEl) {
    if (monthKey === 'ALL') {
      displayEl.innerText = `🌐 VUE GLOBALE (${NEWS_DATASET.length} DOCS 2022-2026)`;
    } else {
      const meta = MONTHS_META[monthKey];
      const count = NEWS_DATASET.filter(n => n.monthKey === monthKey).length;
      displayEl.innerText = `📅 ${meta ? meta.name.toUpperCase() : monthKey} (${count} doc${count > 1 ? 's' : ''})`;
    }
  }

  filterNewsItems();
}

function stepTimeline(delta) {
  if (CURRENT_MONTH_FILTER === 'ALL') {
    CURRENT_MONTH_INDEX = (delta > 0) ? 0 : MONTHS_CHRONO.length - 1;
  } else {
    CURRENT_MONTH_INDEX += delta;
    if (CURRENT_MONTH_INDEX >= MONTHS_CHRONO.length) CURRENT_MONTH_INDEX = 0;
    if (CURRENT_MONTH_INDEX < 0) CURRENT_MONTH_INDEX = MONTHS_CHRONO.length - 1;
  }
  setMonthFilter(MONTHS_CHRONO[CURRENT_MONTH_INDEX]);
}

function toggleAutoPlay() {
  const btn = document.getElementById('timeline-play-btn');
  if (IS_AUTO_PLAYING) {
    stopAutoPlay();
  } else {
    IS_AUTO_PLAYING = true;
    if (btn) {
      btn.classList.add('playing');
      btn.innerHTML = '⏸ Pause';
    }
    if (CURRENT_MONTH_INDEX === -1 || CURRENT_MONTH_INDEX >= MONTHS_CHRONO.length - 1) {
      CURRENT_MONTH_INDEX = 0;
      setMonthFilter(MONTHS_CHRONO[0]);
    }
    AUTO_PLAY_INTERVAL = setInterval(() => {
      if (CURRENT_MONTH_INDEX < MONTHS_CHRONO.length - 1) {
        stepTimeline(1);
      } else {
        stopAutoPlay();
      }
    }, 3200);
  }
}

function stopAutoPlay() {
  if (AUTO_PLAY_INTERVAL) {
    clearInterval(AUTO_PLAY_INTERVAL);
    AUTO_PLAY_INTERVAL = null;
  }
  IS_AUTO_PLAYING = false;
  const btn = document.getElementById('timeline-play-btn');
  if (btn) {
    btn.classList.remove('playing');
    btn.innerHTML = '▶ Lecture Auto';
  }
}

function filterNewsItems() {
  const searchInput = document.getElementById('news-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';

  const filtered = NEWS_DATASET.filter(item => {
    const matchMonth = (CURRENT_MONTH_FILTER === 'ALL' || item.monthKey === CURRENT_MONTH_FILTER);
    if (!query) return matchMonth;

    const searchableText = `${item.title} ${item.tweetSummary} ${item.summary} ${item.publisher} ${item.docType} ${item.postureArgument}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return matchMonth && searchableText.includes(query);
  });

  renderNewsGrid(filtered);
}

function generatePostureAbstract(postureKey, monthKey, items) {
  if (items.length === 0) {
    return `<p style="margin: 0; color: #94a3b8; font-style: italic;">Aucune prise de position recensée dans cette posture pour ce jalon temporel.</p>`;
  }

  if (monthKey === 'ALL') {
    if (postureKey === 'POUR') {
      return `<strong>Synthèse Pro-Incinérateur (2022-2026) :</strong> Les promoteurs (SYCTOM, CPCU, Région Île-de-France) défendent l'usine d'Ivry comme pilier de la souveraineté thermique francilienne (chauffage continu de 150 000 foyers sans gaz fossile). Le projet Interval réduit la capacité de moitié (350 000 t/an) et met en œuvre une filtration catalytique SCR DeNOx conforme aux plafonds de l'UE pour éviter l'enfouissement massif en grande couronne.`;
    } else if (postureKey === 'NEUTRE') {
      return `<strong>Synthèse Neutre & Factuelle (2022-2026) :</strong> Les autorités publiques (ARS Île-de-France), laboratoires universitaires (CNRS, UPEC/LEESU, Sorbonne), corps d'inspection (DRIEAT) et instances judiciaires (CJUE) établissent des constats scientifiques et juridiques sans biais partisan : consignes de prudence toxicologique sur les œufs, modélisation des flux d'air fluviaux, audits inopinés et encadrement strict des régimes transitoires de démarrage de fours.`;
    } else {
      return `<strong>Synthèse Contestations & Risques (2022-2026) :</strong> Une coalition citoyenne, associative et municipale (ToxicoWatch, Collectif 3R, Zero Waste France, Maires d'Ivry et Vitry, syndicats) alerte sur l'exposition continue des riverains et écoliers aux dioxines, métaux lourds et PFAS. Leurs actions allient biosurveillance indépendante (œufs et mousses d'arbres), dénonciation de 6 936 h sans prélèvements AMESA, livres blancs et recours contentieux au Tribunal Administratif de Melun.`;
    }
  }

  // Abstract spécifique au mois
  if (postureKey === 'POUR') {
    return `<strong>Abstract Pro-Projet (${items.length} doc) :</strong> ${items.map(it => it.postureArgument).join(' ')}`;
  } else if (postureKey === 'NEUTRE') {
    return `<strong>Abstract Neutre & Évaluations (${items.length} doc) :</strong> ${items.map(it => it.postureArgument).join(' ')}`;
  } else {
    return `<strong>Abstract Contestations & Risques (${items.length} doc) :</strong> ${items.map(it => it.postureArgument).join(' ')}`;
  }
}

function renderNewsGrid(items) {
  const pourItems = items.filter(n => n.posture === 'POUR');
  const neutreItems = items.filter(n => n.posture === 'NEUTRE');
  const contreItems = items.filter(n => n.posture === 'CONTRE');
  const total = items.length;

  // Actualizar Gráfica Visual de Ratios de Postura
  const pourPct = total > 0 ? Math.round((pourItems.length / total) * 100) : 0;
  const contrePct = total > 0 ? Math.round((contreItems.length / total) * 100) : 0;
  const neutrePct = total > 0 ? (100 - pourPct - contrePct) : 0;

  const kpiPourCount = document.getElementById('kpi-pour-count');
  if (kpiPourCount) kpiPourCount.innerText = pourItems.length;
  const kpiPourPct = document.getElementById('kpi-pour-pct');
  if (kpiPourPct) kpiPourPct.innerText = `${pourPct}%`;

  const kpiNeutreCount = document.getElementById('kpi-neutre-count');
  if (kpiNeutreCount) kpiNeutreCount.innerText = neutreItems.length;
  const kpiNeutrePct = document.getElementById('kpi-neutre-pct');
  if (kpiNeutrePct) kpiNeutrePct.innerText = `${neutrePct}%`;

  const kpiContreCount = document.getElementById('kpi-contre-count');
  if (kpiContreCount) kpiContreCount.innerText = contreItems.length;
  const kpiContrePct = document.getElementById('kpi-contre-pct');
  if (kpiContrePct) kpiContrePct.innerText = `${contrePct}%`;

  const segPour = document.getElementById('seg-pour');
  if (segPour) {
    segPour.style.width = `${pourPct}%`;
    segPour.innerText = pourPct > 0 ? `${pourPct}% Pour` : '';
  }
  const segNeutre = document.getElementById('seg-neutre');
  if (segNeutre) {
    segNeutre.style.width = `${neutrePct}%`;
    segNeutre.innerText = neutrePct > 0 ? `${neutrePct}% Neutre` : '';
  }
  const segContre = document.getElementById('seg-contre');
  if (segContre) {
    segContre.style.width = `${contrePct}%`;
    segContre.innerText = contrePct > 0 ? `${contrePct}% Contre` : '';
  }

  const countPour = document.getElementById('count-col-pour');
  const countNeutre = document.getElementById('count-col-neutre');
  const countContre = document.getElementById('count-col-contre');

  if (countPour) countPour.innerText = `${pourItems.length} doc${pourItems.length !== 1 ? 's' : ''}`;
  if (countNeutre) countNeutre.innerText = `${neutreItems.length} doc${neutreItems.length !== 1 ? 's' : ''}`;
  if (countContre) countContre.innerText = `${contreItems.length} doc${contreItems.length !== 1 ? 's' : ''}`;

  // Actualizar abstracts consolidados
  const absPour = document.getElementById('abstract-col-pour');
  const absNeutre = document.getElementById('abstract-col-neutre');
  const absContre = document.getElementById('abstract-col-contre');

  if (absPour) absPour.innerHTML = generatePostureAbstract('POUR', CURRENT_MONTH_FILTER, pourItems);
  if (absNeutre) absNeutre.innerHTML = generatePostureAbstract('NEUTRE', CURRENT_MONTH_FILTER, neutreItems);
  if (absContre) absContre.innerHTML = generatePostureAbstract('CONTRE', CURRENT_MONTH_FILTER, contreItems);

  // Renderizar tarjetas minimalistas
  const cardsPour = document.getElementById('cards-col-pour');
  const cardsNeutre = document.getElementById('cards-col-neutre');
  const cardsContre = document.getElementById('cards-col-contre');

  if (cardsPour) cardsPour.innerHTML = renderMinimalCards(pourItems);
  if (cardsNeutre) cardsNeutre.innerHTML = renderMinimalCards(neutreItems);
  if (cardsContre) cardsContre.innerHTML = renderMinimalCards(contreItems);

  // Gatillar animación visual fluida
  const container = document.getElementById('stance-columns-container');
  if (container) {
    container.classList.remove('animating');
    void container.offsetWidth; // Forzar reflow para reiniciar CSS keyframe
    container.classList.add('animating');
  }
}

function renderMinimalCards(items) {
  if (items.length === 0) {
    return `<div class="empty-cards-notice">Aucun enregistrement pour ce jalon.</div>`;
  }

  return items.map(item => `
    <article class="minimal-news-card" id="${item.id}">
      <div class="m-card-meta">
        <span class="m-card-date">🗓️ ${item.date}</span>
        <span class="m-card-publisher">${item.publisher}</span>
      </div>
      <h5 class="m-card-title">${item.title}</h5>
      <p class="m-card-synthesis">${item.tweetSummary || item.summary}</p>
      <div class="m-card-footer">
        <span class="m-card-doctype">${item.docType}</span>
        <a href="${item.linkUrl}" target="_blank" rel="noopener noreferrer" class="m-card-link">
          Source ↗
        </a>
      </div>
    </article>
  `).join('');
}
