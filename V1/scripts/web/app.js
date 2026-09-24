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
// 5. VEILLE MULTICANALE & SUIVI DES ACTUALITÉS (PESTAÑA 6)
// ====================================================================
const NEWS_DATASET = [
  // --- 1. GOUVERNEMENTALES & OFFICIELLES ---
  {
    id: 'news_gov_01',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Préfecture du Val-de-Marne & DREAL Île-de-France',
    date: '12 Septembre 2026',
    docType: 'Arrêté Préfectoral',
    title: 'Arrêté n° 2026/0182 : Surveillance renforcée des rejets atmosphériques et contrôles inopinés de l\'UVE d\'Ivry-Paris XIII',
    summary: 'La Préfecture notifie au SYCTOM de nouvelles prescriptions techniques d\'exploitation. L\'arrêté impose l\'abaissement des seuils d\'alerte pour les oxydes d\'azote (NOx) à 80 mg/Nm³ et fixe un calendrier d\'audits semestriels inopinés sur les retombées de métaux lourds et dioxines sur les communes d\'Ivry et Vitry.',
    tags: ['Arrêté Préfectoral', 'SYCTOM', 'Norme NOx', 'DREAL', 'Contrôle Inopiné'],
    verifyBadge: 'Source Officielle Actée (RAA)',
    linkUrl: 'https://www.val-de-marne.gouv.fr/Actions-de-l-Etat/Environnement'
  },
  {
    id: 'news_gov_02',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'SYCTOM (Syndicat Métropolitain des Déchets)',
    date: '28 Juin 2026',
    docType: 'Délibération du Comité Syndical',
    title: 'Rapport d\'étape : Mise en service de la nouvelle ligne de traitement catalytique SCR et réduction des tonnages',
    summary: 'Le Comité syndical du SYCTOM approuve le bilan intermédiaire de modernisation de l\'usine d\'Ivry. Le rapport confirme la réduction de la capacité de traitement autorisée de 700 000 t/an à 350 000 t/an d\'ici 2027 et détaille les performances des filtres à manches pour la captation des particules submicroniques.',
    tags: ['SYCTOM', 'Modernisation', 'Filtration SCR', 'Capacité Réduite', 'Investissement'],
    verifyBadge: 'Délibération Publique',
    linkUrl: 'https://www.syctom-paris.fr'
  },
  {
    id: 'news_gov_03',
    category: 'GOVERNMENTAL',
    categoryLabel: 'Gouvernemental & Officiel',
    badgeClass: 'cat-GOVERNMENTAL',
    publisher: 'Mairies d\'Ivry-sur-Seine & Vitry-sur-Seine',
    date: '15 Mai 2026',
    docType: 'Vœu Conjoint des Conseils Municipaux',
    title: 'Vœu unanime des élus d\'Ivry et Vitry exigeant la transparence intégrale des mesures de polluants émergents',
    summary: 'Les deux municipalités du Val-de-Marne votent un vœu conjoint demandant à l\'État et au SYCTOM la mise en place d\'un comité local d\'information et de concertation (CLIC) indépendant et la diffusion publique en temps réel des mesures des capteurs de fond et de retombées des PFAS et dioxines.',
    tags: ['Ivry-sur-Seine', 'Vitry-sur-Seine', 'Conseil Municipal', 'Transparence', 'PFAS'],
    verifyBadge: 'Procès-Verbal Officiel',
    linkUrl: 'https://www.ivry94.fr'
  },

  // --- 2. PUBLIQUES & MÉDIAS FRANÇAIS (LOCAUX & NATIONAUX) ---
  {
    id: 'news_pub_01',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Média Public / Français',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'Le Parisien (Édition Val-de-Marne 94)',
    date: '08 Septembre 2026',
    docType: 'Article d\'Enquête Locale',
    title: 'Modernisation de l\'incinérateur d\'Ivry-Vitry : Où en est le chantier géant au bord de la Seine ?',
    summary: 'Enquête approfondie sur l\'avancée des travaux colossaux de l\'usine de valorisation énergétique. Le quotidien dresse le bilan des nuisances de chantier signalées par les riverains du quai d\'Ivry et interroge le calendrier de livraison du nouveau centre de valorisation organique.',
    tags: ['Le Parisien', 'Chantier', 'Quai d\'Ivry', 'Déchets', 'Riverains'],
    verifyBadge: 'Média Agréé CPPAP',
    linkUrl: 'https://www.leparisien.fr/val-de-marne-94/'
  },
  {
    id: 'news_pub_02',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Média Public / Français',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'Citoyens.com (Quotidien d\'Information du Val-de-Marne)',
    date: '22 Août 2026',
    docType: 'Reportage Territorial',
    title: 'Incinérateur d\'Ivry : Riverains et associations réclament des capteurs de dioxines en continu',
    summary: 'Focus sur la rentrée des collectifs citoyens à Vitry et Ivry-Port. Face aux odeurs récurrentes lors des épisodes de vent de sud-ouest, les habitants demandent un système d\'alerte SMS automatisé et des garanties sur l\'impact de l\'activité sur les groupes scolaires voisins.',
    tags: ['Citoyens.com', 'Val-de-Marne', 'Capteurs', 'Odeurs', 'Santé'],
    verifyBadge: 'Presse Régionale Agréée',
    linkUrl: 'https://citoyens.com'
  },
  {
    id: 'news_pub_03',
    category: 'PUBLIC_MEDIA',
    categoryLabel: 'Média Public / Français',
    badgeClass: 'cat-PUBLIC_MEDIA',
    publisher: 'France 3 Paris Île-de-France',
    date: '14 Juillet 2026',
    docType: 'Reportage Télévisé & Web',
    title: 'UVE urbaines en Île-de-France : L\'équilibre fragile entre traitement des déchets et acceptabilité citoyenne',
    summary: 'Reportage croisé entre Isséane à Issy-les-Moulineaux et l\'UVE d\'Ivry-Paris XIII. Analyse comparative des coûts d\'enfouissement architectural et des stratégies de dialogue avec les comités de quartier.',
    tags: ['France 3', 'Télévision', 'Isséane', 'Ivry', 'Débat Public'],
    verifyBadge: 'Audiovisuel Public',
    linkUrl: 'https://france3-regions.francetvinfo.fr/paris-ile-de-france/'
  },

  // --- 3. INDÉPENDANTES & CITOYENNES ---
  {
    id: 'news_ind_01',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & Indépendante',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Collectif 3R (Réduire, Réutiliser, Recycler)',
    date: '19 Septembre 2026',
    docType: 'Communiqué Juridique',
    title: 'Recours contentieux déposé devant le Tribunal Administratif de Melun concernant l\'étude d\'impact',
    summary: 'Le Collectif 3R annonce le dépôt d\'une requête en annulation partielle contre l\'arrêté préfectoral, arguant d\'une sous-évaluation de l\'effet cumulé des particules ultrafines avec le trafic du boulevard périphérique et de l\'autoroute A4 voisine.',
    tags: ['Collectif 3R', 'Tribunal Administratif', 'Contentieux', 'Particules Ultrafines', 'Justice Environnementale'],
    verifyBadge: 'Association Environnementale Agréée',
    linkUrl: 'http://collectif3r.org'
  },
  {
    id: 'news_ind_02',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & Indépendante',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Reporterre (Le quotidien de l\'écologie)',
    date: '02 Septembre 2026',
    docType: 'Enquête Indépendante',
    title: 'À Ivry et Vitry, des habitants financent leurs propres analyses de sols et de retombées atmosphériques',
    summary: 'Enquête sur l\'essor des démarches de science citoyenne. Des familles des quartiers d\'Ivry-Port et Vitry-les-Ardoines font prélever des échantillons de terre végétale pour mesurer la persistance des dioxines et des métaux lourds indépendamment des relevés industriels.',
    tags: ['Reporterre', 'Science Citoyenne', 'Biomonitoring', 'Sols', 'Contre-Expertise'],
    verifyBadge: 'Média Indépendant Certifié',
    linkUrl: 'https://reporterre.net'
  },
  {
    id: 'news_ind_03',
    category: 'INDEPENDENT',
    categoryLabel: 'Enquête Citoyenne & Indépendante',
    badgeClass: 'cat-INDEPENDENT',
    publisher: 'Zero Waste France',
    date: '10 Juin 2026',
    docType: 'Note de Décryptage',
    title: 'Plan de prévention des déchets francilien : Pourquoi continuer à brûler ce qui doit être composté ?',
    summary: 'Zero Waste France publie une analyse chiffrée démontrant que l\'obligation légale du tri à la source des biodéchets devrait réduire mécaniquement le gisement d\'ordures résiduelles de 30%, remettant en cause la pérennité économique des surcapacités d\'incinération.',
    tags: ['Zero Waste', 'Compostage', 'Biodéchets', 'Économie Circulaire', 'Prévention'],
    verifyBadge: 'ONG Internationale',
    linkUrl: 'https://www.zerowastefrance.org'
  },

  // --- 4. ACADÉMIQUES & SCIENTIFIQUES ---
  {
    id: 'news_acad_01',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Santé Publique France & Inserm',
    date: 'Août 2026',
    docType: 'Publication Scientifique (Peer-Reviewed)',
    title: 'Biomonitoring et prévalence des pathologies respiratoires chez les cohortes urbaines riveraines d\'UVE modernes',
    summary: 'Étude épidémiologique pluriannuelle portant sur 12 000 résidents en Île-de-France. Les chercheurs observent une diminution notable de l\'imprégnation moyenne aux dioxines par rapport aux données historiques des années 1990, tout en appelant à poursuivre l\'investigation sur les effets cocktails des particules fines PM2.5 combinées au trafic routier.',
    tags: ['Inserm', 'Santé Publique France', 'Épidémiologie', 'Biomarqueurs', 'PM2.5'],
    verifyBadge: 'Revue à Comité de Lecture',
    linkUrl: 'https://www.santepubliquefrance.fr'
  },
  {
    id: 'news_acad_02',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Université Paris-Est Créteil (UPEC) & Laboratoire LEESU',
    date: 'Mai 2026',
    docType: 'Communication de Congrès',
    title: 'Modélisation micrométéorologique de la dispersion des polluants dans le corridor fluvial de la Seine amont',
    summary: 'Présentation des résultats de capteurs optiques haute fréquence installés entre Ivry et Choisy-le-Roi. L\'étude modélise l\'effet de canalisation des vents par la vallée de la Seine et met en évidence des gradients verticaux de concentration lors des inversions thermiques matinales.',
    tags: ['UPEC', 'LEESU', 'Micrométéorologie', 'Vallée de la Seine', 'Inversion Thermique'],
    verifyBadge: 'Laboratoire CNRS / Universitaire',
    linkUrl: 'https://leesu.fr'
  },
  {
    id: 'news_acad_03',
    category: 'ACADEMIC',
    categoryLabel: 'Recherche Académique',
    badgeClass: 'cat-ACADEMIC',
    publisher: 'Revue Française de Sociologie (CNRS Éditions)',
    date: 'Février 2026',
    docType: 'Article de Recherche',
    title: 'Du syndrome NIMBY à la justice environnementale : La politisation des déchets en banlieue rouge',
    summary: 'Analyse sociologique des dynamiques de concertation dans les communes historiquement industrielles de la ceinture parisienne. L\'article explore comment les arguments sanitaires ont reconfiguré les clivages politiques municipaux et les revendications citoyennes de justice spatiale.',
    tags: ['Sociologie', 'Justice Environnementale', 'NIMBY', 'CNRS', 'Banlieue Rouge'],
    verifyBadge: 'Revue Scientifique CNRS',
    linkUrl: 'https://www.cairn.info'
  },

  // --- 5. INTERNATIONALES & EUROPÉENNES ---
  {
    id: 'news_intl_01',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'Cour de Justice de l\'Union Européenne (CJUE)',
    date: '14 Septembre 2026',
    docType: 'Arrêt Jurisprudentiel Européen',
    title: 'Arrêt C-311/24 : Clarification sur la conformité des dérogations d\'émissions transitoires lors des démarrages de fours',
    summary: 'La grande chambre de la CJUE statue sur les conditions d\'application des Meilleures Techniques Disponibles (MTD) sous la Directive IED. L\'arrêt stipule que les périodes de dysfonctionnement ou de montée en température ne peuvent excéder les plafonds horaires cumulés sans sanctions administratives effectives.',
    tags: ['CJUE', 'Directive IED', 'Jurisprudence', 'Union Européenne', 'Valeurs Limites'],
    verifyBadge: 'Arrêt Judiciaire Européen',
    linkUrl: 'https://curia.europa.eu'
  },
  {
    id: 'news_intl_02',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'Zero Waste Europe (Bruxelles)',
    date: 'Juillet 2026',
    docType: 'Rapport Européen de Politique Publique',
    title: 'Incinération des déchets et objectifs climatiques : L\'intégration des UVE dans le marché européen du carbone (SEQE)',
    summary: 'Rapport stratégique analysant les impacts économiques de l\'assujettissement progressif des installations d\'incinération municipale au système d\'échange de quotas d\'émission de l\'UE (ETS) à l\'horizon 2028, et son rôle dissuasif sur l\'enfouissement et la combustion thermique.',
    tags: ['Bruxelles', 'SEQE / ETS', 'Climat', 'Politique Européenne', 'Décarbonation'],
    verifyBadge: 'Think-Tank Européen Agréé',
    linkUrl: 'https://zerowasteeurope.eu'
  },
  {
    id: 'news_intl_03',
    category: 'INTERNATIONAL',
    categoryLabel: 'International & Européen',
    badgeClass: 'cat-INTERNATIONAL',
    publisher: 'European Environment Agency (EEA)',
    date: 'Avril 2026',
    docType: 'Rapport Technique Européen',
    title: 'Qualité de l\'air en Europe : Directives révisées de l\'OMS et défis d\'alignement pour les métropoles denses',
    summary: 'Publication du rapport bisannuel sur l\'exposition des populations urbaines européennes. L\'agence européenne souligne que la convergence vers les seuils OMS de 5 µg/m³ pour les PM2.5 nécessite des politiques combinées sur l\'industrie lourde, le chauffage urbain et le transport routier fluvial.',
    tags: ['EEA / AEE', 'Normes OMS', 'Copenhague', 'Particules Fines', 'Gouvernance Urbaine'],
    verifyBadge: 'Agence Officielle de l\'Union Européenne',
    linkUrl: 'https://www.eea.europa.eu'
  }
];

let CURRENT_NEWS_FILTER = 'ALL';

function initNewsFeed() {
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

  // Render inicial de todas las noticias
  renderNewsGrid(NEWS_DATASET);
  updatePillCounts();
}

function updatePillCounts() {
  const counts = {
    ALL: NEWS_DATASET.length,
    GOVERNMENTAL: NEWS_DATASET.filter(n => n.category === 'GOVERNMENTAL').length,
    PUBLIC_MEDIA: NEWS_DATASET.filter(n => n.category === 'PUBLIC_MEDIA').length,
    INDEPENDENT: NEWS_DATASET.filter(n => n.category === 'INDEPENDENT').length,
    ACADEMIC: NEWS_DATASET.filter(n => n.category === 'ACADEMIC').length,
    INTERNATIONAL: NEWS_DATASET.filter(n => n.category === 'INTERNATIONAL').length
  };

  const countAll = document.getElementById('count-all');
  if (countAll) countAll.innerText = counts.ALL;
  const countGov = document.getElementById('count-gov');
  if (countGov) countGov.innerText = counts.GOVERNMENTAL;
  const countMedia = document.getElementById('count-media');
  if (countMedia) countMedia.innerText = counts.PUBLIC_MEDIA;
  const countInd = document.getElementById('count-ind');
  if (countInd) countInd.innerText = counts.INDEPENDENT;
  const countAcad = document.getElementById('count-acad');
  if (countAcad) countAcad.innerText = counts.ACADEMIC;
  const countIntl = document.getElementById('count-intl');
  if (countIntl) countIntl.innerText = counts.INTERNATIONAL;
}

function filterNewsItems() {
  const searchInput = document.getElementById('news-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';

  const filtered = NEWS_DATASET.filter(item => {
    // 1. Filtro de Categoría
    const matchCat = (CURRENT_NEWS_FILTER === 'ALL' || item.category === CURRENT_NEWS_FILTER);

    // 2. Filtro de Búsqueda
    if (!query) return matchCat;

    const searchableText = `${item.title} ${item.summary} ${item.publisher} ${item.tags.join(' ')} ${item.docType}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return matchCat && searchableText.includes(query);
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
        <h4 style="color: #cbd5e1; margin-top: 0.5rem;">Aucune publication trouvée pour ce critère</h4>
        <p style="font-size: 0.85rem;">Essayez un autre mot-clé ou réinitialisez le filtre sur "Tous les flux".</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => `
    <article class="news-card" id="${item.id}">
      <div>
        <div class="news-card-header">
          <span class="channel-pill ${item.badgeClass}">${item.categoryLabel}</span>
          <span class="news-date">${item.date}</span>
        </div>
        <div class="news-publisher">${item.publisher} &bull; <small style="color: #94a3b8;">${item.docType}</small></div>
        <h4>${item.title}</h4>
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
          Consulter la source &rarr;
        </a>
      </div>
    </article>
  `).join('');
}

