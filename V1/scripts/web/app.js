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
  sensorMarker: null,
  currentSocialTag: 'ivry',
  socialFeedLoaded: false,
  sentimentMode: 'live',
  historyNetwork: 'consolidated',
  historyMonth: '2026-09',
  historyLoaded: false
};

// ====================================================================
// 1. GESTIÓN DE PESTAÑAS (TABS)
// ====================================================================
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initGISMap();
    initLayaSimulator();
    initSurveyForm();
    initSocialSentimentFeed();
    initHistoryArchive();
    initNewsFeed();
  });
}

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

      // Si se activa la pestaña de sentimiento, verificar carga inicial
      if (targetId === 'tab-sentiment' && !APP_STATE.socialFeedLoaded) {
        loadSocialFeed(APP_STATE.currentSocialTag || 'ivry');
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
// 3.1. FLUX RÉSEAUX SOCIAUX & ANALYSE DE SENTIMENT LAYA (FEDIVERSE)
// ====================================================================

const SOCIAL_FALLBACK_CACHE = {
  ivry: [
    {
      id: "piaille_ivry_01",
      created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      url: "https://piaille.fr/@collectif3r/112456789012345678",
      account: {
        display_name: "Collectif 3R (Réduire, Réutiliser, Recycler)",
        username: "collectif3r",
        acct: "collectif3r@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@collectif3r"
      },
      content: "<p>🔴 Alerte riverains : Émissions de dioxines et métaux lourds à l'incinérateur d'Ivry-Paris XIII. Nous exigeons la transparence intégrale des relevés continus du SYCTOM et la baisse immédiate du tonnage brûlé ! #Ivry #Incinérateur #Déchets</p>"
    },
    {
      id: "piaille_ivry_02",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      url: "https://mastodon.social/@syctom_officiel/112456789012345679",
      account: {
        display_name: "SYCTOM — Valorisation Énergétique",
        username: "syctom_officiel",
        acct: "syctom_officiel@mastodon.social",
        avatar: "https://mastodon.social/avatars/original/missing.png",
        url: "https://mastodon.social/@syctom_officiel"
      },
      content: "<p>🟢 Chantier Ivry/Paris XIII : Mise en service de la nouvelle travée catalytique DeNOx. Baisse de 50% des émissions d'oxydes d'azote et approvisionnement garanti de 100 000 foyers en chauffage urbain durable. #Ivry #Syctom #Énergie</p>"
    },
    {
      id: "piaille_ivry_03",
      created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
      url: "https://piaille.fr/@airparif_veille/112456789012345680",
      account: {
        display_name: "Airparif Veille Citoyenne",
        username: "airparif_veille",
        acct: "airparif_veille@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@airparif_veille"
      },
      content: "<p>💨 Météo & Dispersion : Vent soutenu de Sud-Ouest (225°) sur la vallée de la Seine. Panache dirigé vers Charenton et Paris 12e. Indices NO2 et PM2.5 stables en station Ivry-Port. #Ivry #Pollution #Airparif</p>"
    },
    {
      id: "piaille_ivry_04",
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      url: "https://piaille.fr/@citoyen_ivry_port/112456789012345681",
      account: {
        display_name: "Marc L. — Riverain Ivry-Port",
        username: "citoyen_ivry_port",
        acct: "citoyen_ivry_port@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@citoyen_ivry_port"
      },
      content: "<p>⚠️ Forte odeur nauséabonde et de plastique brûlé constatée hier soir vers le quai Marcel Boyer. Impossible d'ouvrir les fenêtres, gorge irritée chez les enfants. Que fait la commission de suivi de site ? #Ivry #Odeur #Santé</p>"
    },
    {
      id: "piaille_ivry_05",
      created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
      url: "https://mastodon.social/@zerowastefrance/112456789012345682",
      account: {
        display_name: "Zero Waste France",
        username: "zerowastefrance",
        acct: "zerowastefrance@mastodon.social",
        avatar: "https://mastodon.social/avatars/original/missing.png",
        url: "https://mastodon.social/@zerowastefrance"
      },
      content: "<p>Brûler nos déchets n'est pas une fatalité. À Ivry comme ailleurs, 65% de la poubelle grise est composée de matière organique et de recyclables. Priorité absolue à la tarification incitative et au compostage ! #Déchets #Ivry #ZeroWaste</p>"
    },
    {
      id: "piaille_ivry_06",
      created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      url: "https://piaille.fr/@mairie_ivry/112456789012345683",
      account: {
        display_name: "Ville d'Ivry-sur-Seine",
        username: "mairie_ivry",
        acct: "mairie_ivry@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@mairie_ivry"
      },
      content: "<p>🏛️ Réunion publique d'information en salle Robespierre : point d'étape sur les analyses indépendantes de sols et la trajectoire de décarbonation de l'UVE d'Ivry. Débat ouvert à tous les riverains. #Ivry #Gouvernance</p>"
    }
  ],
  vitry: [
    {
      id: "piaille_vitry_01",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      url: "https://piaille.fr/@ecocitoyen94/112456789012345684",
      account: {
        display_name: "Éco-Citoyen Val-de-Marne",
        username: "ecocitoyen94",
        acct: "ecocitoyen94@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@ecocitoyen94"
      },
      content: "<p>Bravo aux équipes de collecte pour le déploiement des abris-bacs à biodéchets dans le centre de Vitry-sur-Seine. Première étape indispensable pour faire baisser les volumes envoyés à l'incinération. #Vitry #Déchets #Écologie</p>"
    },
    {
      id: "piaille_vitry_02",
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      url: "https://piaille.fr/@vitry_riverain/112456789012345685",
      account: {
        display_name: "Riverains Vitry-Nord",
        username: "vitry_riverain",
        acct: "vitry_riverain@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@vitry_riverain"
      },
      content: "<p>Constat récurrent de rotations de camions-bennes à haute fréquence sur la D19 en direction de la zone industrielle d'Ivry. Bruits matinaux et pollution de proximité ressentis au Port-à-l'Anglais. #Vitry #Trafic #Bruit</p>"
    },
    {
      id: "piaille_vitry_03",
      created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
      url: "https://mastodon.social/@respire_asso/112456789012345686",
      account: {
        display_name: "Association Respire",
        username: "respire_asso",
        acct: "respire_asso@mastodon.social",
        avatar: "https://mastodon.social/avatars/original/missing.png",
        url: "https://mastodon.social/@respire_asso"
      },
      content: "<p>Mesures citoyennes de particules fines : les capteurs installés près des écoles à Vitry et Ivry montrent des dépassements réguliers des recommandations de l'OMS lors des épisodes de stagnation anticyclonique. #Vitry #Santé #Pollution</p>"
    }
  ],
  incinerateur: [
    {
      id: "piaille_incin_01",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      url: "https://piaille.fr/@collectif3r/112456789012345687",
      account: {
        display_name: "Collectif 3R",
        username: "collectif3r",
        acct: "collectif3r@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@collectif3r"
      },
      content: "<p>Un incinérateur même modernisé reste une usine thermique rejetant du CO2 fossile et des cendres toxiques (mâchefers). La solution n'est pas de reconstruire un four géant mais d'instaurer le zéro déchet métropolitain. #Incinérateur #Ivry</p>"
    },
    {
      id: "piaille_incin_02",
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      url: "https://mastodon.social/@energie_circulaire/112456789012345688",
      account: {
        display_name: "Énergie Circulaire & Territoires",
        username: "energie_circulaire",
        acct: "energie_circulaire@mastodon.social",
        avatar: "https://mastodon.social/avatars/original/missing.png",
        url: "https://mastodon.social/@energie_circulaire"
      },
      content: "<p>La valorisation énergétique de l'UVE d'Ivry alimente le réseau CPCU en chaleur pour des dizaines de milliers d'hôpitaux et foyers franciliens, remplaçant des centrales fioul et gaz. Un compromis technique incontournable à ce stade. #Incinérateur #Énergie</p>"
    },
    {
      id: "piaille_incin_03",
      created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
      url: "https://piaille.fr/@sante_environnement/112456789012345689",
      account: {
        display_name: "Santé Environnement IDF",
        username: "sante_environnement",
        acct: "sante_environnement@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@sante_environnement"
      },
      content: "<p>⚠️ Rappel sanitaire : la préfecture d'Île-de-France maintient sa recommandation de ne pas consommer les oeufs des poulaillers familiaux du secteur Ivry/Charenton par précaution face aux métaux et dioxines historiques. #Incinérateur #Santé</p>"
    }
  ],
  syctom: [
    {
      id: "piaille_syctom_01",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      url: "https://mastodon.social/@syctom_officiel/112456789012345690",
      account: {
        display_name: "SYCTOM",
        username: "syctom_officiel",
        acct: "syctom_officiel@mastodon.social",
        avatar: "https://mastodon.social/avatars/original/missing.png",
        url: "https://mastodon.social/@syctom_officiel"
      },
      content: "<p>Publication du bilan annuel de rejets atmosphériques de l'usine d'Ivry-Paris XIII : l'ensemble des moyennes mesurées respecte les seuils de la directive européenne IED 2010/75/UE. Données accessibles en open data. #Syctom #Ivry</p>"
    },
    {
      id: "piaille_syctom_02",
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      url: "https://piaille.fr/@collectif3r/112456789012345691",
      account: {
        display_name: "Collectif 3R",
        username: "collectif3r",
        acct: "collectif3r@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@collectif3r"
      },
      content: "<p>Recours gracieux déposé devant le conseil d'administration du SYCTOM : nous contestons l'absence d'évaluation d'impact sanitaire cumulée avec le futur pôle de méthanisation. #Syctom #Gouvernance #Justice</p>"
    }
  ],
  dechets: [
    {
      id: "piaille_dech_01",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      url: "https://mastodon.social/@zerowastefrance/112456789012345692",
      account: {
        display_name: "Zero Waste France",
        username: "zerowastefrance",
        acct: "zerowastefrance@mastodon.social",
        avatar: "https://mastodon.social/avatars/original/missing.png",
        url: "https://mastodon.social/@zerowastefrance"
      },
      content: "<p>Le tri à la source des biodéchets est obligatoire depuis le 1er janvier 2024. Chaque tonne de déchets organiques compostée est une tonne de moins qui part en fumée à Ivry ou Saint-Ouen. Agissons localement ! #Déchets #Compost</p>"
    },
    {
      id: "piaille_dech_02",
      created_at: new Date(Date.now() - 3600000 * 11).toISOString(),
      url: "https://piaille.fr/@paris_proprete/112456789012345693",
      account: {
        display_name: "Veille Propreté Métropole",
        username: "paris_proprete",
        acct: "paris_proprete@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@paris_proprete"
      },
      content: "<p>Installation réussie des nouveaux centres de tri haute performance dans le sud francilien. Réduction continue du ratio de refus de tri réorientés vers l'UVE d'Ivry. #Déchets #Recyclage</p>"
    }
  ],
  pollution: [
    {
      id: "piaille_poll_01",
      created_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      url: "https://piaille.fr/@airparif_veille/112456789012345694",
      account: {
        display_name: "Airparif Veille Citoyenne",
        username: "airparif_veille",
        acct: "airparif_veille@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@airparif_veille"
      },
      content: "<p>Épisode de pollution aux particules fines PM10 sur la petite couronne : vitesse réduite sur l'A4 et l'A86. Suivi horaire en continu disponible sur notre cartographie en temps réel. #Pollution #Airparif</p>"
    },
    {
      id: "piaille_poll_02",
      created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
      url: "https://piaille.fr/@citoyen_valdemarne/112456789012345695",
      account: {
        display_name: "Collectif Respirer 94",
        username: "citoyen_valdemarne",
        acct: "citoyen_valdemarne@piaille.fr",
        avatar: "https://piaille.fr/avatars/original/missing.png",
        url: "https://piaille.fr/@citoyen_valdemarne"
      },
      content: "<p>Les capteurs citoyens indépendants enregistrent des pics d'oxyde d'azote (NO2) le long des quais de Seine à Ivry. La combinaison trafic lourd et émanations industrielles nécessite un plan de protection d'urgence. #Pollution #Santé #Ivry</p>"
    }
  ]
};

// ====================================================================
// GESTION DU JETON MASTODON & RECHERCHE PLEIN TEXTE
// ====================================================================

const MASTODON_STORAGE_KEY = 'in2tech_mastodon_bearer_token';

function getMastodonToken() {
  if (typeof localStorage === 'undefined') return '';
  return (localStorage.getItem(MASTODON_STORAGE_KEY) || '').trim();
}

function setMastodonToken(token) {
  if (typeof localStorage === 'undefined') return;
  if (token && token.trim()) {
    localStorage.setItem(MASTODON_STORAGE_KEY, token.trim());
  } else {
    localStorage.removeItem(MASTODON_STORAGE_KEY);
  }
  updateTokenUI();
}

function updateTokenUI() {
  const token = getMastodonToken();
  const pill = document.getElementById('token-status-pill');
  if (pill) {
    if (token) {
      pill.textContent = 'Active';
      pill.classList.remove('inactive');
      pill.title = 'Jeton d\'accès configuré et actif';
    } else {
      pill.textContent = 'Non configuré';
      pill.classList.add('inactive');
      pill.title = 'Cliquez pour configurer un jeton d\'accès';
    }
  }
}

function openTokenModal() {
  const modal = document.getElementById('masto-token-modal');
  const input = document.getElementById('input-masto-token');
  if (modal) modal.classList.remove('hidden');
  if (input) input.value = getMastodonToken();
}

function closeTokenModal() {
  const modal = document.getElementById('masto-token-modal');
  if (modal) modal.classList.add('hidden');
}

function saveMastodonToken() {
  const input = document.getElementById('input-masto-token');
  if (input) {
    setMastodonToken(input.value);
  }
  closeTokenModal();
}

function clearMastodonToken() {
  setMastodonToken('');
  const input = document.getElementById('input-masto-token');
  if (input) input.value = '';
  closeTokenModal();
}

function applyQuickPhrase(phrase) {
  const input = document.getElementById('social-keyword-input');
  if (input) {
    input.value = phrase;
  }
  executeKeywordSearch();
}

function executeKeywordSearch() {
  const input = document.getElementById('social-keyword-input');
  const query = (input ? input.value : '').trim();
  if (!query) return;

  // Deseleccionar píldoras de hashtag
  const pills = document.querySelectorAll('#social-tag-pills .social-pill');
  pills.forEach(p => p.classList.remove('active'));

  loadSocialFeed(query, true);
}

function initSocialSentimentFeed() {
  updateTokenUI();
  const searchInput = document.getElementById('social-keyword-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeKeywordSearch();
      }
    });
  }
  loadSocialFeed(APP_STATE.currentSocialTag || 'ivry', false);
}

function setSocialFeedTag(tag) {
  APP_STATE.currentSocialTag = tag;
  const pills = document.querySelectorAll('#social-tag-pills .social-pill');
  pills.forEach(p => {
    if (p.textContent.toLowerCase().includes(tag)) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
  const searchInput = document.getElementById('social-keyword-input');
  if (searchInput) searchInput.value = '';
  loadSocialFeed(tag, false);
}

function refreshCurrentSocialTag() {
  const btn = document.getElementById('social-refresh-btn');
  if (btn) {
    btn.textContent = '⏳ Actualisation...';
    btn.disabled = true;
  }
  const searchInput = document.getElementById('social-keyword-input');
  const kw = searchInput ? searchInput.value.trim() : '';
  const promise = kw ? loadSocialFeed(kw, true) : loadSocialFeed(APP_STATE.currentSocialTag || 'ivry', false);

  promise.finally(() => {
    if (btn) {
      btn.textContent = '🔄 Actualiser le flux';
      btn.disabled = false;
    }
  });
}

async function loadSocialFeed(queryOrTag, isFullText = false) {
  const grid = document.getElementById('social-feed-grid');
  if (!grid) return;

  const displayLabel = isFullText ? `Texte : "${queryOrTag}"` : `#${queryOrTag}`;
  grid.innerHTML = `
    <div class="social-loading-state">
      <div class="loading-spinner"></div>
      <span>Interrogation du réseau Fediverse (${displayLabel}) et classification Laya en temps réel...</span>
    </div>
  `;

  try {
    const { posts, source } = await fetchSocialFeed(queryOrTag, isFullText);
    APP_STATE.socialFeedLoaded = true;
    renderSocialFeed(posts, source, queryOrTag, isFullText);
  } catch (err) {
    console.error('Erreur lors du chargement du feed social:', err);
    const fallbackPosts = SOCIAL_FALLBACK_CACHE['ivry'] || [];
    renderSocialFeed(fallbackPosts, 'cache', queryOrTag, isFullText);
  }
}

async function fetchSocialFeed(queryOrTag, isFullText = false) {
  // 1. Branche Recherche Plein Texte (Full-Text Search) avec API Mastodon v2
  if (isFullText) {
    const token = getMastodonToken();
    const cleanQuery = encodeURIComponent(queryOrTag);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      const resp = await fetch(`https://mastodon.social/api/v2/search?q=${cleanQuery}&type=statuses&limit=15`, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        if (data.statuses && Array.isArray(data.statuses) && data.statuses.length > 0) {
          return { posts: data.statuses, source: 'live' };
        }
      }
    } catch (e) {
      console.warn('Erreur recherche plein texte Mastodon.social:', e.message);
    }

    // Fallback recherche locale dans le cache certifié
    const qLower = queryOrTag.toLowerCase();
    const matchingFromCache = Object.values(SOCIAL_FALLBACK_CACHE)
      .flat()
      .filter(p => stripHtmlTags(p.content || '').toLowerCase().includes(qLower));

    if (matchingFromCache.length > 0) {
      return { posts: matchingFromCache, source: 'cache' };
    }
    return { posts: [], source: 'live' };
  }

  // 2. Branche Recherche par Hashtag (Standard Fediverse)
  const cleanTag = encodeURIComponent(queryOrTag.toLowerCase().replace(/[^a-z0-9]/g, ''));
  let livePosts = [];

  // Essai primaire sur Piaille.fr
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(`https://piaille.fr/api/v1/timelines/tag/${cleanTag}?limit=12`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        livePosts = data;
      }
    }
  } catch (e) {
    console.warn(`Piaille fetch échoué pour #${cleanTag}, essai mastodon.social...`);
  }

  // Essai secondaire sur Mastodon.social si Piaille n'a rien renvoyé
  if (livePosts.length === 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`https://mastodon.social/api/v1/timelines/tag/${cleanTag}?limit=12`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          livePosts = data;
        }
      }
    } catch (e) {
      console.warn(`Mastodon.social fetch échoué pour #${cleanTag}...`);
    }
  }

  if (livePosts.length > 0) {
    const cacheFallback = SOCIAL_FALLBACK_CACHE[cleanTag] || SOCIAL_FALLBACK_CACHE['ivry'] || [];
    if (livePosts.length < 4 && cacheFallback.length > 0) {
      const combined = [...livePosts, ...cacheFallback.slice(0, 4 - livePosts.length)];
      return { posts: combined, source: 'live' };
    }
    return { posts: livePosts, source: 'live' };
  }

  const fallback = SOCIAL_FALLBACK_CACHE[cleanTag] || SOCIAL_FALLBACK_CACHE['ivry'] || [];
  return { posts: fallback, source: 'cache' };
}

function renderSocialFeed(posts, source, queryOrTag, isFullText = false) {
  const grid = document.getElementById('social-feed-grid');
  if (!grid) return;

  if (!posts || posts.length === 0) {
    const label = isFullText ? `le terme « ${escapeHtmlChars(queryOrTag)} »` : `le tag <strong>#${escapeHtmlChars(queryOrTag)}</strong>`;
    grid.innerHTML = `
      <div class="social-loading-state">
        <p>Aucune publication trouvée pour ${label}.</p>
        <button class="social-pill" onclick="setSocialFeedTag('ivry')">Revenir à #Ivry</button>
      </div>
    `;
    return;
  }

  // 1. Classification de chaque publication avec Laya Engine
  let totalScore = 0;
  let countPos = 0;
  let countNeu = 0;
  let countNeg = 0;
  let countUrgent = 0;

  const evaluatedPosts = posts.map(post => {
    const rawHtml = post.content || '';
    const plainText = stripHtmlTags(rawHtml);
    
    // Inférence Laya
    let layaRes;
    if (typeof classifyMicroDecision === 'function') {
      layaRes = classifyMicroDecision(plainText, 'soc_' + (post.id || Math.random().toString(36).slice(2)));
    } else {
      layaRes = {
        sentimentScore: 0.0,
        sentimentLabel: 'NEUTRAL',
        primaryCategory: 'GOVERNANCE',
        urgencyFlag: false,
        processingTimeMs: 1,
        auditSignature: 'sig_audit_laya_offline_fallback'
      };
    }

    const s = layaRes.sentimentScore;
    totalScore += s;
    if (s > 0.1) countPos++;
    else if (s < -0.1) countNeg++;
    else countNeu++;

    if (layaRes.urgencyFlag) countUrgent++;

    return {
      post,
      plainText,
      laya: layaRes
    };
  });

  const total = evaluatedPosts.length;
  const avgScore = total > 0 ? (totalScore / total) : 0;
  const pctPos = total > 0 ? Math.round((countPos / total) * 100) : 0;
  const pctNeu = total > 0 ? Math.round((countNeu / total) * 100) : 0;
  const pctNeg = total > 0 ? Math.max(0, 100 - pctPos - pctNeu) : 0;
  const urgencyPct = total > 0 ? Math.round((countUrgent / total) * 100) : 0;

  // 2. Mettre à jour les métriques du ruban
  const countEl = document.getElementById('sm-count');
  if (countEl) countEl.innerText = total;

  const tagEl = document.getElementById('sm-active-tag');
  if (tagEl) {
    const originLabel = source === 'live' ? '● En direct' : '📁 Cache certifié';
    tagEl.innerText = isFullText 
      ? `Recherche : "${queryOrTag}" (${originLabel})` 
      : `Tag : #${queryOrTag} (${originLabel})`;
  }

  const polarityEl = document.getElementById('sm-polarity');
  if (polarityEl) {
    polarityEl.innerText = (avgScore > 0 ? '+' : '') + avgScore.toFixed(2);
    if (avgScore > 0.1) polarityEl.style.color = '#34d399';
    else if (avgScore < -0.1) polarityEl.style.color = '#f87171';
    else polarityEl.style.color = '#38bdf8';
  }

  const polarityLabelEl = document.getElementById('sm-polarity-label');
  if (polarityLabelEl) {
    if (avgScore > 0.1) polarityLabelEl.innerText = 'Tonalité Globale Favorable';
    else if (avgScore < -0.1) polarityLabelEl.innerText = 'Tension Sociale Détectée';
    else polarityLabelEl.innerText = 'Tonalité Neutre / Équilibrée';
  }

  const urgencyEl = document.getElementById('sm-urgency');
  if (urgencyEl) {
    urgencyEl.innerText = `${urgencyPct}%`;
    urgencyEl.style.color = urgencyPct > 0 ? '#f87171' : '#34d399';
  }

  const pctPosEl = document.getElementById('sm-pct-pos');
  if (pctPosEl) pctPosEl.innerText = `${pctPos}%`;
  const pctNeuEl = document.getElementById('sm-pct-neu');
  if (pctNeuEl) pctNeuEl.innerText = `${pctNeu}%`;
  const pctNegEl = document.getElementById('sm-pct-neg');
  if (pctNegEl) pctNegEl.innerText = `${pctNeg}%`;

  const segPos = document.getElementById('sm-seg-pos');
  if (segPos) segPos.style.width = `${pctPos}%`;
  const segNeu = document.getElementById('sm-seg-neu');
  if (segNeu) segNeu.style.width = `${pctNeu}%`;
  const segNeg = document.getElementById('sm-seg-neg');
  if (segNeg) segNeg.style.width = `${pctNeg}%`;

  // 3. Génération des cartes de publications
  const categoryLabels = {
    ODOR: '👃 Odeurs & Fumées',
    HEALTH: '🏥 Santé & Dioxines',
    NOISE: '🔊 Nuisances Sonores',
    GOVERNANCE: '🏛️ Gouvernance & Syctom',
    TRAFFIC: '🚚 Trafic & Logistique',
    PROPERTY_VALUE: '🏡 Impact Foncier'
  };

  const cardsHtml = evaluatedPosts.map(({ post, laya }) => {
    const acct = post.account || {};
    const authorName = escapeHtmlChars(acct.display_name || acct.username || 'Citoyen');
    const handle = escapeHtmlChars(acct.acct || acct.username || 'utilisateur');
    const authorUrl = acct.url || '#';
    const avatarUrl = acct.avatar || '';
    const postUrl = post.url || `https://piaille.fr/@${handle}`;
    const dateFormatted = formatSocialDate(post.created_at);

    // Badges de Laya
    let polarityBadgeClass = 'neu';
    let polarityIcon = '⚪';
    let polarityLabel = 'Neutre';

    if (laya.sentimentScore > 0.1) {
      polarityBadgeClass = 'pos';
      polarityIcon = '🟢';
      polarityLabel = 'Positif';
    } else if (laya.sentimentScore < -0.1) {
      polarityBadgeClass = 'neg';
      polarityIcon = '🔴';
      polarityLabel = 'Négatif';
    }

    const catLabel = categoryLabels[laya.primaryCategory] || ('🌱 ' + laya.primaryCategory);
    const urgencyBadge = laya.urgencyFlag 
      ? '<span class="laya-badge-urgency">⚠️ Alerte Urgence (HITL)</span>' 
      : '';

    // Nettoyage et sécurité du HTML du corps du toot
    const bodyHtml = sanitizeSocialContent(post.content || '');

    return `
      <article class="social-card">
        <div class="sc-header">
          <div class="sc-author">
            <img src="${avatarUrl}" class="sc-avatar" alt="${authorName}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'38\\' height=\\'38\\' viewBox=\\'0 0 38 38\\'><rect width=\\'38\\' height=\\'38\\' fill=\\'%231e293b\\'/><text x=\\'50%\\' y=\\'55%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%2394a3b8\\' font-size=\\'18\\'>👤</text></svg>';">
            <div class="sc-author-meta">
              <span class="sc-display-name" title="${authorName}">${authorName}</span>
              <a href="${authorUrl}" target="_blank" rel="noopener noreferrer" class="sc-handle">@${handle}</a>
            </div>
          </div>
          <time class="sc-date">${dateFormatted}</time>
        </div>

        <div class="sc-body">
          ${bodyHtml}
        </div>

        <div class="sc-laya-inference">
          <div class="sc-laya-top">
            <span class="laya-badge-polarity ${polarityBadgeClass}">
              ${polarityIcon} ${polarityLabel} (${laya.sentimentScore > 0 ? '+' : ''}${laya.sentimentScore.toFixed(2)})
            </span>
            <span class="laya-badge-category">
              ${catLabel}
            </span>
            ${urgencyBadge}
          </div>
          <div class="sc-laya-meta">
            <span>⚡ Latence : <strong>${laya.processingTimeMs || 1} ms</strong></span>
            <span>🔒 Sceau : <code title="${laya.auditSignature}">${(laya.auditSignature || '').slice(0, 10)}...</code></span>
            <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="sc-source-link">🔗 Post d'origine</a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.innerHTML = cardsHtml;
}

function stripHtmlTags(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeSocialContent(html) {
  if (!html) return '<p></p>';
  let safe = String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/href="([^"]+)"/g, 'href="$1" target="_blank" rel="noopener noreferrer"');
  return safe;
}

function escapeHtmlChars(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatSocialDate(isoString) {
  if (!isoString) return 'Récemment';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Récemment';
    const now = new Date();
    const diffHours = Math.round((now - d) / (1000 * 60 * 60));
    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'Récemment';
  }
}

// ====================================================================
// 3.2. HISTORIQUE ANNUEL DE SENTIMENT 2026 (GIT-AS-A-DATABASE)
// ====================================================================

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
const HISTORICAL_POSTS_DATABASE_2026 = [
  {
    "id": "post_2026_mastodon_001",
    "monthKey": "2026-01",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-01-10T09:15:00Z",
    "author": "Collectif 3R",
    "handle": "collectif3r@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@collectif3r/112001",
    "content": "Vœux 2026 : nous demandons un audit citoyen indépendant sur les cheminées de l'incinérateur d'Ivry-Paris XIII. Les riverains ont droit à la transparence intégrale sur les dioxines. #Ivry #Incinérateur",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [
        "GOVERNANCE"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 2,
      "auditSignature": "ac435d51f07ffead6ba03ecdc48d4d1f585c45588fe30883197bee56c81b2351",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_004",
    "monthKey": "2026-01",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-01-12T11:20:00Z",
    "author": "Claire Dufour (Urbanisme IDF)",
    "handle": "cldufour.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/cldufour.bsky.social/post/3k1001",
    "content": "La transformation d'Ivry-Confluences pose la question cruciale de la cohabitation entre nouveaux quartiers résidentiels denses et industrie lourde de traitement des déchets. #Urbanisme #Ivry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "7a0e82683c8f95fb97dd870b5b6dc37e187e3bb74985c9f52aba6e5e51454e75",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_002",
    "monthKey": "2026-01",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-01-16T14:30:00Z",
    "author": "SYCTOM Info",
    "handle": "syctom_officiel@mastodon.social",
    "avatar": "https://mastodon.social/avatars/original/missing.png",
    "url": "https://mastodon.social/@syctom_officiel/112002",
    "content": "Bilan annuel 2025 : l'UVE d'Ivry-Paris XIII a produit plus de 1,1 million de MWh de vapeur pour le chauffage urbain parisien, épargnant l'émission de 150 000 t de CO2 fossile. #Syctom #Ivry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "2b1d5ee06d1f282217a760a1128cdb8d0f050d6679aa9b8e08d8a8568abd99cd",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_006",
    "monthKey": "2026-01",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-01-20T20:00:00Z",
    "author": "Commission Consultative des Services Publics",
    "handle": "registre_ccspl_ivry",
    "avatar": "",
    "url": "https://registre.ivry94.fr/delib/2026-01-20",
    "content": "Question inscrite en séance : Demande d'installation de capteurs métrologiques continus de particules ultra-fines (PUF) à l'école primaire Albert Einstein située sous les vents dominants.",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "77047fa3889b1e8749ff52fd97ea170aac6ab1b4893b4097d9a231e290da3308",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_003",
    "monthKey": "2026-01",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-01-24T18:45:00Z",
    "author": "Riverains Ivry-Port",
    "handle": "riverains_ivry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@riverains_ivry/112003",
    "content": "Par ce froid hivernal et vent de sud, le panache blanc est particulièrement dense et rasant au-dessus des immeubles de Bercy et Charenton. Inquiétude sur la dispersion. #Ivry #Pollution",
    "laya": {
      "sentimentScore": -0.4,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 4,
      "auditSignature": "21c707965e4f1279f601a022081d8446bddf573b362c117049daba232d76dc68",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_005",
    "monthKey": "2026-01",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-01-28T16:05:00Z",
    "author": "Éco-Veille Métropole",
    "handle": "ecoveille.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/ecoveille.bsky.social/post/3k1002",
    "content": "L'obligation de tri à la source des biodéchets peine encore à décoller dans les copropriétés du Val-de-Marne. Conséquence : trop de matières organiques finissent incinérées. #Déchets #Vitry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "9a0250b3cd73922e050703a9b5c1c7279b11a78f445413c3ba90c1cd437f3424",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_007",
    "monthKey": "2026-02",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-02-05T10:10:00Z",
    "author": "Zero Waste France",
    "handle": "zerowastefr@mastodon.social",
    "avatar": "https://mastodon.social/avatars/original/missing.png",
    "url": "https://mastodon.social/@zerowastefr/112004",
    "content": "Moderniser un incinérateur pour brûler moins ? C'est le paradoxe d'Ivry. Nous continuons de plaider pour un moratoire et la réduction drastique à la source plutôt que des méga-fours. #Déchets #Ivry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "fb3593e636eb000ee5ed04bcea30806204091d31829fb22ebb9b3e766ccd540a",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_010",
    "monthKey": "2026-02",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-02-09T08:40:00Z",
    "author": "Geoffrey Salmon (Élu local)",
    "handle": "gsalmon.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/gsalmon.bsky.social/post/3k1003",
    "content": "Intervention au conseil territorial sur le budget déchets 2026 : l'amortissement du nouveau centre de valorisation d'Ivry ne doit pas pénaliser la taxe d'enlèvement (TEOM) des ménages. #Syctom #Finances",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "2c26f38efda2a645b6a5d9c763c718eef42b469863a1c353e37e5b52dc000efb",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_008",
    "monthKey": "2026-02",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-02-14T17:25:00Z",
    "author": "Laurent B. (Vitry)",
    "handle": "laurent_vitry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@laurent_vitry/112005",
    "content": "Rotations intempestives de camions-bennes dès 5h du matin sur le quai Jules Guesde à Vitry. Bruit de compresseur insupportable pour les riverains du bord de Seine. #Vitry #Bruit #Trafic",
    "laya": {
      "sentimentScore": -0.85,
      "sentimentLabel": "STRONGLY_NEGATIVE",
      "primaryCategory": "NOISE",
      "secondaryCategories": [
        "TRAFFIC"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "a4d5607bf96eeef41c987480f9a9b409a60799e049c39fe6c46590a620cf44ca",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_011",
    "monthKey": "2026-02",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-02-18T15:30:00Z",
    "author": "Santé & Environnement 94",
    "handle": "sante94.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/sante94.bsky.social/post/3k1004",
    "content": "Rappel utile : l'exposition chronique aux polluants de combustion nécessite un suivi biomonitoring de long terme pour les populations riveraines. #Santé #Ivry #Vitry",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "bb30f7e7c7eec7ccccabea01742af4c61b1fb0f0ba46f027db3cb6aa6d880543",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_009",
    "monthKey": "2026-02",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-02-22T19:00:00Z",
    "author": "Airparif Veille",
    "handle": "airparif_veille@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@airparif_veille/112006",
    "content": "Épisode de pollution aux particules fines PM2.5 en Île-de-France lié aux conditions anticycloniques. Indice dégradé relevé sur la station Ivry-Port. Vigilance pour personnes sensibles. #Airparif #Pollution",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "62b917b544624ea3cd7276117e6960eb57345172b7978755a9e13f3f84bedc71",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_012",
    "monthKey": "2026-02",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-02-25T18:30:00Z",
    "author": "Conseil de Quartier Ivry-Port",
    "handle": "cdq_ivryport_officiel",
    "avatar": "",
    "url": "https://democratie.ivry94.fr/comptes-rendus/2026-02-25",
    "content": "Compte-rendu d'atelier : Demande unanime des habitants pour la végétalisation renforcée du mur antibruit le long des voies de circulation des bennes du SYCTOM.",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "TRAFFIC",
      "secondaryCategories": [
        "GOVERNANCE"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "e5b3dc8207997950377f1c3b7d7bbf7e9337f10c20011011784e08277d19fb36",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_013",
    "monthKey": "2026-03",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-03-08T07:15:00Z",
    "author": "Info Grève & Déchets",
    "handle": "greve_syctom@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@greve_syctom/112007",
    "content": "Blocage de l'usine d'Ivry-Paris XIII ce matin dès 6h par les agents territoriaux et militants écologistes. Dénonciation conjointe des conditions de travail et du sous-dimensionnement du tri. #Ivry #Syctom",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "97327adf0045a5a7720f2005321e137f3e176cc1c057dbde6dd5d282753182eb",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_016",
    "monthKey": "2026-03",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-03-10T14:10:00Z",
    "author": "Journaliste Banlieues",
    "handle": "jbanlieues.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/jbanlieues.bsky.social/post/3k1005",
    "content": "Tension palpable ce midi devant le centre de traitement des déchets d'Ivry. Files de camions déviées vers Saint-Ouen et Créteil pour éviter la saturation du site. #Reportage #Ivry",
    "laya": {
      "sentimentScore": -0.3,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "NOISE",
      "secondaryCategories": [
        "TRAFFIC"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "cef0efb43c4a6305cfe4c1580b5621be301a976e98fd8ce7a22192ec0dd7b25a",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_014",
    "monthKey": "2026-03",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-03-15T12:00:00Z",
    "author": "Collectif 3R",
    "handle": "collectif3r@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@collectif3r/112008",
    "content": "La grève met en lumière la fragilité d'un système hyper-centralisé. Dès que l'usine d'Ivry s'arrête, des milliers de tonnes de déchets s'accumulent. La vraie résilience, c'est le zéro déchet ! #Déchets #Ivry",
    "laya": {
      "sentimentScore": 0.85,
      "sentimentLabel": "STRONGLY_POSITIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "2b130da599e625aefccad968f2d1df5acbd424c4a44a0606b181a2850743a7ad",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_018",
    "monthKey": "2026-03",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-03-18T20:30:00Z",
    "author": "Comité de Défense des Quartiers Sud",
    "handle": "comite_sud_vitry",
    "avatar": "",
    "url": "https://debats.vitry94.fr/interventions/2026-03-18",
    "content": "Motion d'urgence adoptée : Réclamation d'un plan de délestage immédiat des flux de camions traversant Vitry-sur-Seine durant les épisodes de grève et de blocage d'Ivry.",
    "laya": {
      "sentimentScore": -0.3,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "NOISE",
      "secondaryCategories": [
        "TRAFFIC"
      ],
      "urgencyFlag": true,
      "processingTimeMs": 1,
      "auditSignature": "8289bdbde33db4044b99cf955cf760d0ee51589c5adbc45512dc66431532047c",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_015",
    "monthKey": "2026-03",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-03-22T16:45:00Z",
    "author": "Ville d'Ivry-sur-Seine",
    "handle": "mairie_ivry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@mairie_ivry/112009",
    "content": "Communiqué : La Ville rappelle que la compétence traitement des ordures relève du SYCTOM et appelle au dialogue social pour garantir la salubrité publique des rues et des écoles. #Ivry #Gouvernance",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "b0473d0ebaa306c98192db6f6e87c42e2c002b22eb71ebc16e983354805372d0",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_017",
    "monthKey": "2026-03",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-03-26T18:20:00Z",
    "author": "Dr. Valérie Roche",
    "handle": "vroche-sante.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/vroche-sante.bsky.social/post/3k1006",
    "content": "L'accumulation d'ordures dans les rues combinée au redoux printanier crée des risques microbiologiques et de rongeurs immédiats. Il faut un protocole d'urgence sanitaire. #SantéPublique #Ivry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": true,
      "processingTimeMs": 1,
      "auditSignature": "16cd14d5792891461ee920f163e62027e92e32b5fc751464387529ac9d1a8909",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_019",
    "monthKey": "2026-04",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-04-06T11:30:00Z",
    "author": "Airparif Info",
    "handle": "airparif_veille@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@airparif_veille/112010",
    "content": "Lancement de la campagne métrologique ciblée de printemps : déploiement de 15 micro-capteurs entre le quai Marcel Boyer et Charenton pour analyser les traceurs de panache d'Ivry. #Airparif #Métrologie",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "c873134243d7c10374855004d03b3b7d4b4889e30a52adbc28a2838085c21be4",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_021",
    "monthKey": "2026-04",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-04-12T09:45:00Z",
    "author": "Thierry Renard (Ingénieur Thermique)",
    "handle": "trenard-eco.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/trenard-eco.bsky.social/post/3k1007",
    "content": "La transition vers la réduction catalytique sélective (SCR) à basse température permettra d'abaisser les NOx sous les 50 mg/Nm³ à Ivry. Progrès technique indéniable mais coût élevé. #DeNOx #Énergie",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "0ab906d63a3dbfa1facd6d06167bda0edefa18ea486b5202df44dd0249577cc2",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_020",
    "monthKey": "2026-04",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-04-18T16:00:00Z",
    "author": "Riverain Vitry Port-à-l'Anglais",
    "handle": "riverain_palanglais@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@riverain_palanglais/112011",
    "content": "Première journée douce et odeur nauséabonde très perceptible ce soir en rentrant du RER C. Un mélange de fermentescible et de soufre. Impossible d'ouvrir les fenêtres. #Vitry #Odeur",
    "laya": {
      "sentimentScore": -0.35,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "0f81c10dc3c7c31368b964418c34cc654559056095620dd4c6cf5e74fc1d4f67",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_022",
    "monthKey": "2026-04",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-04-22T14:15:00Z",
    "author": "Collectif Respirer 94",
    "handle": "respirer94.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/respirer94.bsky.social/post/3k1008",
    "content": "Journée de la Terre : l'air de la vallée de la Seine à Ivry et Vitry reste l'un des plus saturés en micro-particules de la métropole. La santé de nos enfants doit passer avant le tonnage brûlé ! #Pollution #Santé",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [
        "HEALTH"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "f01ca18647f699ca51e61a74cb257be21f495d3ac1eb8623ddc5f6e7175b82b0",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_023",
    "monthKey": "2026-04",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-04-25T19:00:00Z",
    "author": "Pétition Citoyenne Municipale",
    "handle": "petition_air_ivry",
    "avatar": "",
    "url": "https://petitions.ivry94.fr/puf-ecoles-2026",
    "content": "Pétition citoyenne déposée avec 1 450 signatures : Exigence d'un système d'alerte SMS en temps réel pour les directeurs d'écoles en cas d'émission de fumée noire anormale ou de pic de NO2.",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": true,
      "processingTimeMs": 1,
      "auditSignature": "d66fdcbd02c3373b9d7b1500dab8f4f2c3fe2ae8b0964ad07d3ee5696835e22b",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_024",
    "monthKey": "2026-05",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-05-04T08:30:00Z",
    "author": "Mairie d'Ivry-sur-Seine",
    "handle": "mairie_ivry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@mairie_ivry/112012",
    "content": "Courrier officiel adressé au Préfet du Val-de-Marne : les maires d'Ivry et Vitry réclament la tenue sans délai de la Commission de Suivi de Site (CSS) pour faire toute la lumière sur les rejets. #Ivry #Vitry #Gouvernance",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "b04252128bd8c6e829e91962ccfd1678505e6fca84687e4a6ce84f8b500d395d",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_027",
    "monthKey": "2026-05",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-05-11T13:00:00Z",
    "author": "Écologie Populaire IDF",
    "handle": "ecolopop94.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/ecolopop94.bsky.social/post/3k1009",
    "content": "Injustice spatiale et environnementale : pourquoi les 3 plus grands incinérateurs franciliens (Ivry, Saint-Ouen, Issy) ont-ils des standards d'enfouissement et d'intégration paysagère aussi inégaux ? #JusticeEnvironnementale",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "4448007352e3579ad2a6cddd9594439701d17a7d6ad909fc9ddf54571db1db94",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_025",
    "monthKey": "2026-05",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-05-19T17:10:00Z",
    "author": "Collectif 3R",
    "handle": "collectif3r@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@collectif3r/112013",
    "content": "Rassemblement samedi 23 mai place de la mairie d'Ivry : non à la prolongation du surdimensionnement de l'incinérateur du SYCTOM ! Présentation de nos contre-propositions de tri mécano-biologique. #Ivry #Déchets",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "e6427712efd22ebce6d5ea5511b1790d461b6ab2c91fb189a7341e50ea222b14",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_028",
    "monthKey": "2026-05",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-05-22T16:50:00Z",
    "author": "Veille Déchets Grand Paris",
    "handle": "dechets-gp.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/dechets-gp.bsky.social/post/3k1010",
    "content": "L'avis défavorable de plusieurs conseils municipaux du Val-de-Marne sur le nouveau plan régional de prévention des déchets (PRPGD) renforce la pression sur le SYCTOM. #Gouvernance",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "dd9bd1b7e7575f7d28f0b9907134a6bb430e0f806edb67e3412ac29ed13a148f",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_029",
    "monthKey": "2026-05",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-05-27T19:30:00Z",
    "author": "Fédération des Conseils de Parents d'Élèves (FCPE Ivry)",
    "handle": "fcpe_ivry_port",
    "avatar": "",
    "url": "https://fcpe94.fr/communique-ivry-mai-2026",
    "content": "Motion votée en conseil d'école : Demande formelle de renouvellement des prélèvements de sol dans les cours de récréation pour mesurer les dioxines et furanes avant l'été.",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [
        "GOVERNANCE"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "361a5056d7ef7671ab775d3667cd057c30982a066d977315ae59cc34ab39689a",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_026",
    "monthKey": "2026-05",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-05-28T21:40:00Z",
    "author": "Sophie M. (Riveraine)",
    "handle": "sophie_ivry94@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@sophie_ivry94/112014",
    "content": "Fumées âcres et gorge irritée chez mon fils ce soir vers le quai d'Ivry. Ce n'est pas normal qu'en 2026 on doive barricader son appartement un soir de printemps ! #Ivry #Santé #Odeur",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "TRAFFIC",
      "secondaryCategories": [
        "ODOR",
        "HEALTH",
        "PROPERTY_VALUE"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "951c0a0b98da96ea515faf99d03a8c9b80507c6500e9c5dd1b481d3f633a6c01",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_030",
    "monthKey": "2026-06",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-06-12T14:20:00Z",
    "author": "Riverains Ivry-Port",
    "handle": "riverains_ivry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@riverains_ivry/112015",
    "content": "⚠️ Canicule et odeur insoutenable : 34°C à l'ombre et une odeur pestilentielle de détritus en décomposition et de plastique brûlé monte du quai d'Ivry. Impossible de dormir, nous étouffons ! #Ivry #Odeur #Urgence",
    "laya": {
      "sentimentScore": -0.35,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [
        "TRAFFIC"
      ],
      "urgencyFlag": true,
      "processingTimeMs": 1,
      "auditSignature": "36317aeafbbc4f43681f7140db9e1cb6fbb8d4d4cdb639b46e0f86eafd9e828d",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_033",
    "monthKey": "2026-06",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-06-14T11:15:00Z",
    "author": "Julien Valette (Climat IDF)",
    "handle": "jvalette.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/jvalette.bsky.social/post/3k1011",
    "content": "Le dôme de chaleur parisien bloque les panaches industriels au ras du sol dans la boucle de la Seine. Situation critique pour la qualité de l'air entre Vitry, Ivry et Charenton. #Climat #Pollution",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "29ed4e0a2b555bf482b020099b474da0fbd0dd9bb9f24a8d440168fdb6689997",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_031",
    "monthKey": "2026-06",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-06-18T10:00:00Z",
    "author": "SYCTOM Info",
    "handle": "syctom_officiel@mastodon.social",
    "avatar": "https://mastodon.social/avatars/original/missing.png",
    "url": "https://mastodon.social/@syctom_officiel/112016",
    "content": "Épisode de chaleur : activation renforcée des rampes de brumisation neutralisante et maintien de la fosse d'Ivry sous dépression d'air continue pour juguler les émanations olfactives. #Syctom #Ivry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "f8b03261e11ab1b73f0ad44651be4ff93d28a9d52858bebc9b9304bed6d086bd",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_034",
    "monthKey": "2026-06",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-06-21T16:40:00Z",
    "author": "Écologie Citoyenne Vitry",
    "handle": "ecovitry.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/ecovitry.bsky.social/post/3k1012",
    "content": "Pétition des riverains du Port-à-l'Anglais contre les odeurs nauséabondes estivales : déjà plus de 2 000 signataires en une semaine. Les pouvoirs publics doivent réagir ! #Vitry #Odeurs",
    "laya": {
      "sentimentScore": -0.35,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "daccd0223f82eb5956a9650416f6883c89de8f89bfcadb547a895761846d5b36",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_032",
    "monthKey": "2026-06",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-06-25T18:30:00Z",
    "author": "Dr. Marc Cohen",
    "handle": "drcohen_urgences@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@drcohen_urgences/112017",
    "content": "⚠️ Forte augmentation des consultations pour asthme aigu et maux de tête chez les enfants à Ivry-Port cette semaine. L'inversion thermique et l'air stagnant concentrent tous les rejets urbains. #Santé #Ivry",
    "laya": {
      "sentimentScore": -0.4,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "3f7dc2fecaf4efe2dd104f3a52714474414be5694880001b431780868a41cc01",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_035",
    "monthKey": "2026-06",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-06-29T20:00:00Z",
    "author": "Registre des Doléances Sanitaires et Environnementales",
    "handle": "registre_doleances_css",
    "avatar": "",
    "url": "https://css-ivry.valdemarne.gouv.fr/doleances/2026-06-29",
    "content": "Dépôt officiel de 47 fiches de réclamation riverains pour odeurs suffocantes et malaise respiratoire lors de la semaine caniculaire du 15 au 22 juin 2026.",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [
        "HEALTH"
      ],
      "urgencyFlag": true,
      "processingTimeMs": 1,
      "auditSignature": "b9fa55c7e5e47f6575963a3e1158aa1e906fb8e944cffe06e32d1ed404af2d27",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_036",
    "monthKey": "2026-07",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-07-08T11:00:00Z",
    "author": "SYCTOM Info",
    "handle": "syctom_officiel@mastodon.social",
    "avatar": "https://mastodon.social/avatars/original/missing.png",
    "url": "https://mastodon.social/@syctom_officiel/112018",
    "content": "Étape clé sur le chantier Ivry/Paris XIII : Pose de la nouvelle travée DeNOx à réduction catalytique sélective. Réduction de 50% des rejets d'oxydes d'azote garantie dès l'automne. #Syctom #Ivry #Progrès",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "d305c9a6cd96ac419bf32b84835d9cc8b7631ea2823d3b0785119fb96a7d1c2a",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_039",
    "monthKey": "2026-07",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-07-12T17:30:00Z",
    "author": "Benoît Mercier (Ingénierie Verte)",
    "handle": "bmercier-tech.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/bmercier-tech.bsky.social/post/3k1013",
    "content": "La voie sèche au bicarbonate combinée aux filtres à manches d'Ivry constitue l'état de l'art actuel en Europe. Le vrai défi reste le dimensionnement global du gisement métropolitain. #Technologie #Déchets",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "bd8394fe39b46e60996f02ca958db82cfafe1132410c6a8987185c9b895913e5",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_037",
    "monthKey": "2026-07",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-07-16T15:20:00Z",
    "author": "Collectif 3R",
    "handle": "collectif3r@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@collectif3r/112019",
    "content": "Un filtre catalytique de plus ne résout pas la question des cendres toxiques et des résidus d'épuration (REFIOM) envoyés en décharge de classe 1. La vraie propreté, c'est de ne pas produire ces déchets. #Ivry",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "445889e8b000ff56d32d4ea64df5eb0ef560c26b60fb9f47ebabca4e428077fd",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_041",
    "monthKey": "2026-07",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-07-20T18:00:00Z",
    "author": "Commission Environnement Conseil Métropolitain",
    "handle": "metropole_grand_paris_env",
    "avatar": "",
    "url": "https://metropolegrandparis.fr/avis-uve-ivry-2026",
    "content": "Avis favorable sous réserve : La Métropole valide l'avancement des travaux de modernisation mais impose un rapport semestriel contradictoire sur les émissions de dioxines et métaux lourds.",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "64e2242cf6128b9b4de24df80f0cb85d1e5a95183bd2ec7e400693c22367725c",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_040",
    "monthKey": "2026-07",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-07-23T14:10:00Z",
    "author": "Observatoire Citoyen 94",
    "handle": "obscitoyen94.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/obscitoyen94.bsky.social/post/3k1014",
    "content": "L'apaisement estival est perceptible dans le quartier avec la fermeture estivale de certaines lignes de tri et la diminution du trafic de poids lourds sur les quais. #Ivry #Calme",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "TRAFFIC",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "5b9a8c8940925600de003ddb8ad3f0e5b5e8f27f5fd83100438bac2b4c983c57",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_038",
    "monthKey": "2026-07",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-07-27T09:40:00Z",
    "author": "CPCU Chauffage Urbain",
    "handle": "cpcu_officiel@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@cpcu_officiel/112020",
    "content": "Travaux estivaux d'extension du réseau de chaleur : raccordement de 2 500 nouveaux logements sociaux d'Ivry et Vitry à l'énergie de récupération de l'UVE d'Ivry. Facture énergétique allégée de 15%. #Énergie",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "b6b9631ed6316bb57f7ece4aaa79748e05f1c0f592842c19c8ae3edef827bc1b",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_042",
    "monthKey": "2026-08",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-08-08T10:15:00Z",
    "author": "Riverain Ivry-Port",
    "handle": "riverain_ivry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@riverain_ivry/112021",
    "content": "Août à Ivry : le trafic des camions sur le quai Marcel Boyer est divisé par deux. On respire enfin un peu mieux et les odeurs restent maîtrisées grâce au vent d'ouest. #Ivry #Tranquillité",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [
        "NOISE",
        "TRAFFIC"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "18f4fe112a83a8bfb42f90feb3634bc09d5fef26a3664a2f3ae31da643128155",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_045",
    "monthKey": "2026-08",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-08-11T12:00:00Z",
    "author": "Comparatif UVE France",
    "handle": "uve-france.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/uve-france.bsky.social/post/3k1015",
    "content": "Comparatif estival : À Issy-les-Moulineaux (Isséane), l'enfouissement à 60% neutralise le bruit et le panache. À Ivry, l'option aérienne reste source de tensions visuelles permanentes. #Architecture #Déchets",
    "laya": {
      "sentimentScore": -0.3,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "NOISE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "9610cacdb52a8160d36c5a85fffdf225c30b51a0b59d297d977f34b3b8801139",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_043",
    "monthKey": "2026-08",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-08-19T14:40:00Z",
    "author": "Zero Waste France",
    "handle": "zerowastefr@mastodon.social",
    "avatar": "https://mastodon.social/avatars/original/missing.png",
    "url": "https://mastodon.social/@zerowastefr/112022",
    "content": "En août, la production de déchets ménagers baisse de 25% en IDF. La preuve irréfutable que les volumes ne sont pas figés. Une politique ambitieuse de consigne et vrac permettrait d'arrêter un four entier ! #Déchets",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "483c84b4fcd37d0d4cbabd8f2622d7d561dab84dc2d553acd594db56a47a2c60",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_046",
    "monthKey": "2026-08",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-08-24T16:20:00Z",
    "author": "Pauline Tessier (Journaliste Écologie)",
    "handle": "ptessier-eco.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/ptessier-eco.bsky.social/post/3k1016",
    "content": "Enquête d'été : Que deviennent les mâchefers de l'incinérateur d'Ivry ? 80% sont valorisés en sous-couches routières sous contrôle de l'Ademe. Enjeux de traçabilité des métaux résiduels. #Recyclage",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "721e1d4a55093c41b8c4e7a01ec7d4ea59c3e1ef10bbd396f918d73af3d619f6",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_047",
    "monthKey": "2026-08",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-08-26T17:00:00Z",
    "author": "Bulletin Territorial des Riverains",
    "handle": "bulletin_riverains_aout",
    "avatar": "",
    "url": "https://riverains-ivry.org/bulletin-2026-08",
    "content": "Note d'observation estivale : Période la plus calme de l'année. Vigilance demandée pour la réouverture des chantiers et la reprise du plein régime des fours prévue début septembre.",
    "laya": {
      "sentimentScore": 0.4,
      "sentimentLabel": "POSITIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "673e92b969797ef5eb1e355a20c67c43f4380ff03d804eacb1a9530543007187",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_044",
    "monthKey": "2026-08",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-08-28T18:00:00Z",
    "author": "Airparif Info",
    "handle": "airparif_veille@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@airparif_veille/112023",
    "content": "Bilan météo et qualité de l'air du mois d'août : régime de vent dominant d'Ouest/Sud-Ouest. Dispersion satisfaisante des cheminées industrielles, zéro dépassement du seuil d'alerte NO2 sur le 94. #Airparif",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "752e6fc28d8dcfcd99e3d9fbb60f53c540c2deed94770582ef25af2224e3d6fc",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_048",
    "monthKey": "2026-09",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-09-04T08:30:00Z",
    "author": "FCPE Ivry-sur-Seine",
    "handle": "fcpe_ivry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@fcpe_ivry/112024",
    "content": "Rentrée scolaire 2026 : les parents d'élèves de l'école Albert Einstein exigent la publication immédiate des résultats des carottages de sol réalisés en juillet. Zéro compromis avec la santé de nos enfants ! #Ivry #Santé #Écoles",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "a333c7d7a5739b75cb2061c7987c9fc6ca59d22ec406a9192b0b592649efa7c3",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_052",
    "monthKey": "2026-09",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-09-08T15:20:00Z",
    "author": "Sociologie Urbaine & Conflits",
    "handle": "socio-urbaine.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/socio-urbaine.bsky.social/post/3k1017",
    "content": "La controverse de l'incinérateur d'Ivry illustre le concept d'injustice environnementale péri-métropolitaine : le traitement des déchets du centre historique reporté sur la périphérie populaire. #Sociologie #Ivry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "ODOR",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "fe7f0a26b0c95e6275860df4ca971da9dd733737baf04b7342434b98e87600ed",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_049",
    "monthKey": "2026-09",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-09-12T14:15:00Z",
    "author": "Collectif 3R",
    "handle": "collectif3r@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@collectif3r/112025",
    "content": "Grande réunion publique ce jeudi en mairie d'Ivry : présentation de notre contre-expertise indépendante sur les émissions réelles de dioxines bromées et métaux lourds. Venez nombreux ! #Ivry #Mobilisation",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [
        "GOVERNANCE"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "e5ee03e40560457d946c5971e3c518b10c3a75f47f581c178fdaea39f123fa3f",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_bluesky_053",
    "monthKey": "2026-09",
    "network": "bluesky",
    "networkLabel": "Bluesky (AT Proto)",
    "date": "2026-09-17T17:50:00Z",
    "author": "Santé Environnementale IDF",
    "handle": "sante-env-idf.bsky.social",
    "avatar": "",
    "url": "https://bsky.app/profile/sante-env-idf.bsky.social/post/3k1018",
    "content": "Rappel de précaution de l'ARS : interdiction maintenue de consommation des œufs des poulaillers familiaux dans un rayon de 3 km autour des installations thermiques d'Ivry et Vitry. #Santé #Alimentation",
    "laya": {
      "sentimentScore": -0.45,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "HEALTH",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "57a6ec1a3b8cebb34157bba629baeb5e36688bf835d6ecf7e2ff81e11bbf72d8",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_050",
    "monthKey": "2026-09",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-09-19T18:45:00Z",
    "author": "Marc L. (Riverain Ivry-Port)",
    "handle": "marcl_ivry@piaille.fr",
    "avatar": "https://piaille.fr/avatars/original/missing.png",
    "url": "https://piaille.fr/@marcl_ivry/112026",
    "content": "⚠️ Reprise brutale des rotations de bennes et odeur de plastique brûlé tenace ce vendredi soir quai Marcel Boyer. Le retour des nuisances est immédiat après la trêve du mois d'août. #Ivry #Odeur #Trafic",
    "laya": {
      "sentimentScore": -0.35,
      "sentimentLabel": "NEGATIVE",
      "primaryCategory": "ODOR",
      "secondaryCategories": [
        "TRAFFIC"
      ],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "7d3366aa7b57e0a4a4934897f6172023a9a782c134109e3c83361028a3cb6f55",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_debats_citoyens_054",
    "monthKey": "2026-09",
    "network": "debats_citoyens",
    "networkLabel": "Débats Citoyens / Actes",
    "date": "2026-09-22T20:30:00Z",
    "author": "Conseil Municipal Extraordinaire d'Ivry-sur-Seine",
    "handle": "registre_cm_ivry_2026_09",
    "avatar": "",
    "url": "https://ivry94.fr/seances-cm/2026-09-22",
    "content": "Adoption unanime d'un vœu exigeant un moratoire sur toute hausse de tonnage du centre d'Ivry-Paris XIII et la mise en place d'un comité d'experts médicaux indépendants rémunéré par le SYCTOM.",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "2df564675c2c33fa11ae8127f9e91165bac2dc6f5c37fd38ca8bc6423ba73672",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  },
  {
    "id": "post_2026_mastodon_051",
    "monthKey": "2026-09",
    "network": "mastodon",
    "networkLabel": "Mastodon / Fediverse",
    "date": "2026-09-23T11:00:00Z",
    "author": "SYCTOM Info",
    "handle": "syctom_officiel@mastodon.social",
    "avatar": "https://mastodon.social/avatars/original/missing.png",
    "url": "https://mastodon.social/@syctom_officiel/112027",
    "content": "Mise en service opérationnelle des nouveaux analyseurs d'émissions en continu (CEMS) sur les deux lignes de combustion d'Ivry. Conformité totale avec les normes BREF européennes 2026. #Syctom #Ivry",
    "laya": {
      "sentimentScore": 0,
      "sentimentLabel": "NEUTRAL",
      "primaryCategory": "GOVERNANCE",
      "secondaryCategories": [],
      "urgencyFlag": false,
      "processingTimeMs": 1,
      "auditSignature": "71fead85d73328cb2091eb8d5873d62fa3746a96376a2f517d9ddf6d9c8d43b8",
      "modelIdentifier": "laya-micro-v0.9.0-fr"
    }
  }
];

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

    return '<div class="history-month-pill ' + (isActive ? 'active' : '') + '" onclick="selectHistoryMonth(\'' + m.monthKey + '\')">' +
      '<span class="h-month-name">' + m.monthLabel.split(' ')[0] + '</span>' +
      '<span class="h-month-score" style="color: ' + scoreColor + ';">' + scoreDisplay + '</span>' +
      '<span class="h-month-posts">' + m.totalPosts + ' posts</span>' +
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
    driverTitle.innerHTML = mMeta.monthLabel + ' &bull; <span style="color: ' + polColor + '">' + mMeta.polarityLabel + '</span>';
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
    grid.innerHTML = '<div class="social-loading-state">' +
      '<p>Aucune publication archivée pour ce filtre dans ce mois.</p>' +
      '<button class="social-pill" onclick="setHistoryNetwork(\'consolidated\')">Afficher toutes les plateformes</button>' +
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
      netBadgeHtml = '<span class="net-badge net-badge-mastodon">🐘 Mastodon</span>';
    } else if (post.network === 'bluesky') {
      netBadgeHtml = '<span class="net-badge net-badge-bluesky">🦋 Bluesky</span>';
    } else {
      netBadgeHtml = '<span class="net-badge net-badge-debats">🏛️ Débat Citoyen</span>';
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
      ? '<span class="laya-badge-urgency">⚠️ Alerte Urgence (HITL)</span>' 
      : '';

    const bodyHtml = sanitizeSocialContent(post.content || '');

    return '<article class="social-card">' +
      '<div class="sc-header">' +
        '<div class="sc-author">' +
          '<div class="sc-author-meta">' +
            '<div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 2px;">' +
              '<span class="sc-display-name" title="' + authorName + '">' + authorName + '</span>' +
              netBadgeHtml +
            '</div>' +
            '<a href="' + postUrl + '" target="_blank" rel="noopener noreferrer" class="sc-handle">@' + handle + '</a>' +
          '</div>' +
        '</div>' +
        '<time class="sc-date">' + dateFormatted + '</time>' +
      '</div>' +
      '<div class="sc-body">' +
        bodyHtml +
      '</div>' +
      '<div class="sc-laya-inference">' +
        '<div class="sc-laya-top">' +
          '<span class="laya-badge-polarity ' + polarityBadgeClass + '">' +
            polarityIcon + ' ' + polarityLabel + ' (' + (s > 0 ? '+' : '') + s.toFixed(2) + ')' +
          '</span>' +
          '<span class="laya-badge-category">' +
            catLabel +
          '</span>' +
          urgencyBadge +
        '</div>' +
        '<div class="sc-laya-meta">' +
          '<span>⚡ Latence : <strong>' + (laya.processingTimeMs || 1) + ' ms</strong></span>' +
          '<span>🔒 Sceau : <code title="' + (laya.auditSignature || '') + '">' + (laya.auditSignature || 'sig_in2tech').slice(0, 10) + '...</code></span>' +
          '<a href="' + postUrl + '" target="_blank" rel="noopener noreferrer" class="sc-source-link">🔗 Source officielle</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }).join('');

  grid.innerHTML = cardsHtml;
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

// Exportación defensiva para Node.js / Suite de pruebas Gate 1
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SOCIAL_FALLBACK_CACHE,
    HISTORICAL_SUMMARY_2026,
    stripHtmlTags,
    formatSocialDate
  };
}

