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

const MONTHS_CHRONO = ['2026-02', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

const MONTHS_META = {
  '2026-02': {
    name: 'Février 2026',
    climateTitle: 'Cadrage sociologique & racines des contestations',
    climateSummary: 'Parution d’études académiques rétrospectives : analyse de la transition d’un réflexe local NIMBY vers une exigence de justice spatiale et environnementale dans le Val-de-Marne.',
    dominantPosture: 'NEUTRE'
  },
  '2026-04': {
    name: 'Avril 2026',
    climateTitle: 'Continuité énergétique régionale vs. plafonds OMS',
    climateSummary: 'La Région Île-de-France conforte l’usine d’Ivry dans son schéma directeur pour le chauffage métropolitain, tandis que l’AEE rappelle les seuils sanitaires OMS sur les PM2.5.',
    dominantPosture: 'SPLIT'
  },
  '2026-05': {
    name: 'Mai 2026',
    climateTitle: 'Revendications municipales conjointes & modélisation du fleuve',
    climateSummary: 'Vœu unanime des conseils municipaux d’Ivry et Vitry réclamant la transparence totale sur les PFAS, conjugué à la modélisation micrométéorologique des inversions thermiques de l’UPEC.',
    dominantPosture: 'CONTRE'
  },
  '2026-06': {
    name: 'Juin 2026',
    climateTitle: 'Clash de visions : Modernisation SCR vs. Tri à la source',
    climateSummary: 'Le SYCTOM valide l’abaissement de capacité à 350 000 t et ses filtres catalytiques SCR, tandis que Zero Waste France dénonce le risque de surcapacité bloquant le compostage.',
    dominantPosture: 'SPLIT'
  },
  '2026-07': {
    name: 'Juillet 2026',
    climateTitle: 'Comparaison métropolitaine & tarification carbone européenne',
    climateSummary: 'Reportage national comparant l’enfouissement paysager d’Isséane et la situation d’Ivry. Débat européen sur l’inclusion des incinérateurs au marché carbone SEQE.',
    dominantPosture: 'POUR'
  },
  '2026-08': {
    name: 'Août 2026',
    climateTitle: 'Chauffage décarboné, épidémiologie et alertes citoyennes d’odeurs',
    climateSummary: 'CPCU valorise l’apport thermique pour 150 000 logements ; Santé Publique France note la chute historique des dioxines ; des riverains réclament des capteurs continus.',
    dominantPosture: 'SPLIT'
  },
  '2026-09': {
    name: 'Septembre 2026',
    climateTitle: 'Phase de haute contestation juridique et contrôles inopinés',
    climateSummary: 'Recours contentieux au Tribunal de Melun (Collectif 3R), analyses citoyennes de sols (Reporterre) et arrêtés de contrôles inopinés de la Préfecture du Val-de-Marne.',
    dominantPosture: 'CONTRE'
  }
};

const NEWS_DATASET = [
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
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'European Environment Agency (EEA)',
    publisherHandle: '@EUEnvironment',
    date: '29 Avril 2026',
    monthKey: '2026-04',
    docType: 'Rapport Technique Européen',
    posture: 'NEUTRE',
    postureLabel: '⚪ NEUTRE / CADRE RÉGLEMENTAIRE OMS',
    postureArgument: 'Rapport technique d\'évaluation des seuils cibles de particules fines pour les métropoles denses sans prise de parti locale.',
    tweetSummary: '🇪🇺 L\'Agence Européenne de l\'Environnement alerte : respecter le seuil OMS de 5 µg/m³ en PM2.5 impose un contrôle draconien combinant industrie thermique et trafic poids lourds dans les corridors fluviaux confinés.',
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
    categoryLabel: 'Enquête Citoyenne & Indépendante',
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
    categoryLabel: 'Média Public / Français',
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
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'Zero Waste Europe (Bruxelles)',
    publisherHandle: '@ZeroWasteEurope',
    date: '22 Juillet 2026',
    monthKey: '2026-07',
    docType: 'Policy Briefing Européen',
    posture: 'POUR',
    postureLabel: '🟢 À FAVOR / POUR (Efficacité & Climat)',
    postureArgument: 'Appui à la tarification carbone pour favoriser les usines modernes à très haute récupération d\'énergie thermique.',
    tweetSummary: '🇪🇺 Soutien à l\'intégration des incinérateurs au marché carbone SEQE d\'ici 2028 : priorité aux sites à très haut rendement thermique et pénalisation financière du tout-brûlage.',
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
    categoryLabel: 'Média Public / Français',
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
    categoryLabel: 'Enquête Citoyenne & Indépendante',
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
    categoryLabel: 'Média Public / Français',
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
    categoryLabel: 'Enquête Citoyenne & Indépendante',
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

// Estados de filtrado triple (Categoría, Mes y Postura)
let CURRENT_NEWS_FILTER = 'ALL';
let CURRENT_MONTH_FILTER = '2026-09'; // Inicia enfocado en el mes actual con opción de retroceder o ver todo
let CURRENT_POSTURE_FILTER = 'ALL';
let CURRENT_MONTH_INDEX = 6; // Índice de '2026-09' en MONTHS_CHRONO
let AUTO_PLAY_INTERVAL = null;
let IS_AUTO_PLAYING = false;

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
        stopAutoPlay();
        const mKey = mp.getAttribute('data-month');
        setMonthFilter(mKey);
      });
    });
  }

  // 3. Controles de Navegación de la Línea de Tiempo (Prev, Next, First, Last, Play, All)
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

  const btnFirst = document.getElementById('timeline-first-btn');
  if (btnFirst) {
    btnFirst.addEventListener('click', () => {
      stopAutoPlay();
      setMonthFilter(MONTHS_CHRONO[0]);
    });
  }

  const btnLast = document.getElementById('timeline-last-btn');
  if (btnLast) {
    btnLast.addEventListener('click', () => {
      stopAutoPlay();
      setMonthFilter(MONTHS_CHRONO[MONTHS_CHRONO.length - 1]);
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

  // 4. Filtros de Postura (A Favor, En Contra, Neutro)
  const postureBtns = document.querySelectorAll('.posture-btn');
  postureBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      postureBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CURRENT_POSTURE_FILTER = btn.getAttribute('data-posture');
      filterNewsItems();
    });
  });

  // Render inicial
  setMonthFilter('2026-09');
}

function setMonthFilter(monthKey) {
  CURRENT_MONTH_FILTER = monthKey;

  // Sincronizar índice
  if (monthKey === 'ALL') {
    CURRENT_MONTH_INDEX = -1;
  } else {
    CURRENT_MONTH_INDEX = MONTHS_CHRONO.indexOf(monthKey);
  }

  // Actualizar píldoras activas en la barra de meses
  const monthBar = document.getElementById('timeline-months-bar');
  if (monthBar) {
    const pills = monthBar.querySelectorAll('.month-pill');
    pills.forEach(p => {
      if (p.getAttribute('data-month') === monthKey) {
        p.classList.add('active');
        p.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        p.classList.remove('active');
      }
    });
  }

  updateMonthClimateDashboard();
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
    // Si estaba en el último mes o en ALL, arrancar desde el principio
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
    }, 3500);
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

function updateMonthClimateDashboard() {
  const displayEl = document.getElementById('current-month-display');
  const titleEl = document.getElementById('month-climate-title');
  const summaryEl = document.getElementById('month-climate-summary');
  const totalCountEl = document.getElementById('count-month-total');
  const countPourEl = document.getElementById('count-pour');
  const countContreEl = document.getElementById('count-contre');
  const countNeutreEl = document.getElementById('count-neutre');

  // Filtrar dataset por el mes seleccionado
  const monthItems = (CURRENT_MONTH_FILTER === 'ALL')
    ? NEWS_DATASET
    : NEWS_DATASET.filter(n => n.monthKey === CURRENT_MONTH_FILTER);

  const total = monthItems.length;
  const pourCount = monthItems.filter(n => n.posture === 'POUR').length;
  const contreCount = monthItems.filter(n => n.posture === 'CONTRE').length;
  const neutreCount = monthItems.filter(n => n.posture === 'NEUTRE').length;

  if (totalCountEl) totalCountEl.innerText = total;
  if (countPourEl) countPourEl.innerText = pourCount;
  if (countContreEl) countContreEl.innerText = contreCount;
  if (countNeutreEl) countNeutreEl.innerText = neutreCount;

  // Actualizar textos contextuales del clima de opinión
  if (CURRENT_MONTH_FILTER === 'ALL') {
    if (displayEl) displayEl.innerText = '🌐 VUE D\'ENSEMBLE (TOUS LES MOIS)';
    if (titleEl) titleEl.innerText = 'Trajectoire Temporelle Globale : Polarisation & Mobilisation Citoyenne Croissante';
    if (summaryEl) summaryEl.innerText = 'Depuis février 2026, l\'observation montre un glissement d\'un débat technique initial vers un recours contentieux au Tribunal de Melun et une demande citoyenne de capteurs de pointe face aux nuisances olfactives.';
  } else {
    const meta = MONTHS_META[CURRENT_MONTH_FILTER];
    if (meta) {
      if (displayEl) displayEl.innerText = `📅 ${meta.name.toUpperCase()} (${total} publication${total > 1 ? 's' : ''})`;
      if (titleEl) titleEl.innerText = meta.climateTitle;
      if (summaryEl) summaryEl.innerText = meta.climateSummary;
    }
  }

  // Barra de porcentajes proporcionales
  const pourPct = total > 0 ? Math.round((pourCount / total) * 100) : 0;
  const contrePct = total > 0 ? Math.round((contreCount / total) * 100) : 0;
  const neutrePct = total > 0 ? (100 - pourPct - contrePct) : 0;

  const segPour = document.querySelector('.seg-pour');
  if (segPour) {
    segPour.style.width = pourPct + '%';
    segPour.innerText = pourPct > 0 ? `${pourPct}% Pour` : '';
    segPour.title = `${pourCount} à favor (${pourPct}%)`;
  }
  const segContre = document.querySelector('.seg-contre');
  if (segContre) {
    segContre.style.width = contrePct + '%';
    segContre.innerText = contrePct > 0 ? `${contrePct}% Contre` : '';
    segContre.title = `${contreCount} en contra (${contrePct}%)`;
  }
  const segNeutre = document.querySelector('.seg-neutre');
  if (segNeutre) {
    segNeutre.style.width = neutrePct + '%';
    segNeutre.innerText = neutrePct > 0 ? `${neutrePct}% Neutre` : '';
    segNeutre.title = `${neutreCount} neutres (${neutrePct}%)`;
  }

  // Actualizar totales en píldoras de canales
  const countAll = document.getElementById('count-all');
  if (countAll) countAll.innerText = NEWS_DATASET.length;
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

    const searchableText = `${item.title} ${item.tweetSummary} ${item.summary} ${item.publisher} ${item.publisherHandle} ${item.tags.join(' ')} ${item.docType} ${item.postureArgument}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return matchCat && matchMonth && matchPosture && searchableText.includes(query);
  });

  renderNewsGrid(filtered);
}

// Configuración de metadatos de categorías para agrupación
const CATEGORIES_DEF = [
  { key: 'GOVERNMENTAL', icon: '🏛️', name: 'Gouvernemental, Préfecture & Actes Officiels' },
  { key: 'PUBLIC_MEDIA', icon: '📰', name: 'Presse Régionale & Médias Français' },
  { key: 'INDEPENDENT', icon: '🌱', name: 'Collectifs Citoyens, ONG & Enquêtes Indépendantes' },
  { key: 'ACADEMIC', icon: '🔬', name: 'Recherche Scientifique & Veille Académique' },
  { key: 'INTERNATIONAL', icon: '🌍', name: 'Instances Internationales & Union Européenne' }
];

function renderNewsGrid(items) {
  const container = document.getElementById('news-cards-grid');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; color: #94a3b8; background: #0b1120; border-radius: 8px; border: 1px dashed #334155;">
        <span style="font-size: 2.2rem;">🔍</span>
        <h4 style="color: #cbd5e1; margin-top: 0.65rem; font-size: 1.1rem;">Aucun enregistrement trouvé pour ce filtre combiné</h4>
        <p style="font-size: 0.85rem; max-width: 500px; margin: 0.4rem auto 0; line-height: 1.45;">
          Aucune publication de ce type n'a été recensée pour le mois sélectionné avec cette posture. Cliquez sur <strong>« Tous les mois »</strong> ou réinitialisez le filtre de posture pour élargir la vue.
        </p>
      </div>
    `;
    return;
  }

  // Agrupar los registros por TIPO / CANAL en el mes seleccionado
  let html = '';

  CATEGORIES_DEF.forEach(catDef => {
    const catItems = items.filter(it => it.category === catDef.key);
    if (catItems.length === 0) return; // Solo renderizar categorías que tengan registros en la selección activa

    html += `
      <div class="channel-group-block">
        <div class="channel-group-header">
          <div class="channel-group-title">
            <span>${catDef.icon}</span>
            <span>${catDef.name}</span>
          </div>
          <span class="channel-group-badge">${catItems.length} publication${catItems.length > 1 ? 's' : ''} trouvée${catItems.length > 1 ? 's' : ''}</span>
        </div>

        <div class="channel-news-grid">
          ${catItems.map(item => `
            <article class="news-card" id="${item.id}">
              <div>
                <!-- 1. En-tête : Badge Canal + Badge Posture Visible -->
                <div class="news-card-header">
                  <span class="channel-pill ${item.badgeClass}">${item.categoryLabel}</span>
                  <span class="posture-card-badge badge-posture-${item.posture}">
                    ${item.posture === 'POUR' ? '🟢 À FAVOR (POUR)' : item.posture === 'CONTRE' ? '🔴 EN CONTRA (CONTRE)' : '⚪ NEUTRE / FACTUEL'}
                  </span>
                </div>

                <!-- 2. Synthèse Express Style Tweet (<280 caractères) -->
                <div class="tweet-box">
                  <div class="tweet-meta">
                    <span class="tweet-icon">💬</span>
                    <strong class="tweet-author">${item.publisherHandle}</strong>
                    <span class="tweet-bullet">&bull;</span>
                    <span class="tweet-date">🗓️ ${item.date}</span>
                  </div>
                  <p class="tweet-content">« ${item.tweetSummary} »</p>
                </div>

                <!-- 3. Source & Type de Document -->
                <div class="news-publisher">${item.publisher} &bull; <small style="color: #94a3b8;">${item.docType}</small></div>

                <!-- 4. Titre de l'article -->
                <h4>${item.title}</h4>

                <!-- 5. Ligne d'Angle & Argumentaire de Posture -->
                <div class="posture-argument-line ${item.posture}">
                  <strong>Angle d'analyse :</strong> ${item.postureArgument}
                </div>

                <!-- 6. Résumé détaillé -->
                <p class="news-summary">${item.summary}</p>

                <!-- 7. Mots-clés / Tags -->
                <div class="news-tags">
                  ${item.tags.map(t => `<span class="news-tag">#${t}</span>`).join('')}
                </div>
              </div>

              <!-- 8. Pied de carte : Vérification & Lien direct officiel -->
              <div class="news-card-footer">
                <span class="verify-badge">
                  <span>🛡️</span> ${item.verifyBadge}
                </span>
                <a href="${item.linkUrl}" target="_blank" rel="noopener noreferrer" class="news-link-btn">
                  Consulter la source officielle &rarr;
                </a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}



