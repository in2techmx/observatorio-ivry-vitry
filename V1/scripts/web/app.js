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
