/**
 * PRJ-OBS-IVRY-VITRY-V1 — Motor de Dispersión y Rosa de Vientos
 * Autoridad Técnica: Director de Desarrollo (DD) — IN2TECHMX
 * Implementador: ADS-1 (Core & Algoritmia)
 * Sistema de Referencia: EPSG:4326 (WGS84) / Conforme con Directiva INSPIRE
 */

// Coordenadas oficiales: 48° 47' 30" N, 2° 25' 0" E (Vitry-sur-Seine / Val-de-Marne)
const UVE_ORIGIN = {
  name: 'Installation Énergétique / UVE (Vitry / Ivry)',
  latitude: 48.791667, // 48° 47' 30" N
  longitude: 2.416667, // 2° 25' 00" E
  stackHeightMeters: 100,
  commune: 'Vitry-sur-Seine',
  postalCode: '94400'
};

// Catálogo de equipamientos sensibles georreferenciados en Ivry-sur-Seine y Vitry-sur-Seine
const SENSITIVE_FACILITIES = [
  {
    id: 'fac_ivry_01',
    name: 'École élémentaire Albert Einstein',
    commune: 'Ivry-sur-Seine',
    type: 'PRIMARY_SCHOOL',
    latitude: 48.8180,
    longitude: 2.3850
  },
  {
    id: 'fac_ivry_02',
    name: 'Collège Molière',
    commune: 'Ivry-sur-Seine',
    type: 'MIDDLE_SCHOOL',
    latitude: 48.8145,
    longitude: 2.3890
  },
  {
    id: 'fac_ivry_03',
    name: 'École élémentaire Henri Barbusse',
    commune: 'Ivry-sur-Seine',
    type: 'PRIMARY_SCHOOL',
    latitude: 48.8210,
    longitude: 2.3780
  },
  {
    id: 'fac_ivry_04',
    name: 'École maternelle Dulcie September',
    commune: 'Ivry-sur-Seine',
    type: 'KINDERGARTEN',
    latitude: 48.8160,
    longitude: 2.3940
  },
  {
    id: 'fac_ivry_05',
    name: 'Complexe Sportif des Épinettes',
    commune: 'Ivry-sur-Seine',
    type: 'SPORTS_COMPLEX',
    latitude: 48.8195,
    longitude: 2.3710
  },
  {
    id: 'fac_vitry_01',
    name: 'Collège Adolphe Chérioux',
    commune: 'Vitry-sur-Seine',
    type: 'MIDDLE_SCHOOL',
    latitude: 48.7980,
    longitude: 2.3750
  },
  {
    id: 'fac_vitry_02',
    name: 'École élémentaire Paul Langevin',
    commune: 'Vitry-sur-Seine',
    type: 'PRIMARY_SCHOOL',
    latitude: 48.8020,
    longitude: 2.3920
  },
  {
    id: 'fac_vitry_03',
    name: 'Lycée Jean Macé',
    commune: 'Vitry-sur-Seine',
    type: 'HIGH_SCHOOL',
    latitude: 48.7910,
    longitude: 2.3880
  },
  {
    id: 'fac_vitry_04',
    name: 'EHPAD La Seigneurie (Résidence seniors)',
    commune: 'Vitry-sur-Seine',
    type: 'NURSING_HOME',
    latitude: 48.7930,
    longitude: 2.3950
  },
  {
    id: 'fac_vitry_05',
    name: 'École élémentaire Montesquieu',
    commune: 'Vitry-sur-Seine (Port à l\'Anglais)',
    type: 'PRIMARY_SCHOOL',
    latitude: 48.8023,
    longitude: 2.4043
  },
  {
    id: 'fac_vitry_06',
    name: 'École maternelle Pauline Kergomard',
    commune: 'Vitry-sur-Seine (Paul Froment)',
    type: 'KINDERGARTEN',
    latitude: 48.7856,
    longitude: 2.3939
  },
  {
    id: 'fac_vitry_07',
    name: 'École élémentaire Marcel Cachin',
    commune: 'Vitry-sur-Seine',
    type: 'PRIMARY_SCHOOL',
    latitude: 48.7970,
    longitude: 2.3802
  },
  {
    id: 'fac_charenton_01',
    name: 'École élémentaire Aristide Briand',
    commune: 'Charenton-le-Pont',
    type: 'PRIMARY_SCHOOL',
    latitude: 48.8275,
    longitude: 2.4080
  }
];

// ====================================================================
// ANILLOS DE AFECTACIÓN CONCÉNTRICOS POR PROXIMIDAD (ISO-DISTANCIAS)
// ====================================================================
const AFFECTATION_RINGS = [
  {
    id: 'ring_500m',
    name: 'Zone 1 : Exposition Immédiate (0 – 500 m)',
    radiusMeters: 500,
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.20,
    dashArray: null,
    weight: 2,
    estPopulation: 8500,
    riskLevel: 'Nuisances Aiguës / Immédiates',
    description: 'Périmètre riverain direct de l\'installation UVE (Les Ardoines, Port-à-l\'Anglais, berges fluviales). Exposition aux odeurs directes de plastique/déchets, bruit industriel et retombées immédiates de suies lors des démarrages de fours.'
  },
  {
    id: 'ring_1500m',
    name: 'Zone 2 : Proximité & Vigilance Scolaire (500 m – 1.5 km)',
    radiusMeters: 1500,
    color: '#f97316',
    fillColor: '#f97316',
    fillOpacity: 0.14,
    dashArray: '5, 5',
    weight: 2,
    estPopulation: 48500,
    riskLevel: 'Vigilance Renforcée (Écoles & EHPAD)',
    description: 'Zone de forte densité scolaire et d\'équipements de santé (Collège Molière, Écoles Langevin et Barbusse, Lycée Jean Macé, EHPAD La Seigneurie). Vigilance accrue sur les dioxines (PCDD/F) et métaux lourds.'
  },
  {
    id: 'ring_3000m',
    name: 'Zone 3 : Influence Atmosphérique Fluviale (1.5 km – 3.0 km)',
    radiusMeters: 3000,
    color: '#eab308',
    fillColor: '#eab308',
    fillOpacity: 0.08,
    dashArray: '7, 6',
    weight: 1.5,
    estPopulation: 142000,
    riskLevel: 'Influence Atmosphérique Péri-urbaine',
    description: 'Bassin fluvial de la vallée de la Seine (Ivry-Centre, Vitry-Plateau, Alfortville, Charenton-le-Pont). Canalisation dynamique des panaches lors d\'épisodes de vents dominants de Sud-Ouest.'
  },
  {
    id: 'ring_5000m',
    name: 'Zone 4 : Surveillance Épidémiologique ARS (3.0 km – 5.0 km)',
    radiusMeters: 5000,
    color: '#38bdf8',
    fillColor: '#38bdf8',
    fillOpacity: 0.04,
    dashArray: '9, 8',
    weight: 1.5,
    estPopulation: 315000,
    riskLevel: 'Périmètre Régional de Biosurveillance',
    description: 'Zone d\'évaluation épidémiologique régionale ARS / Santé Publique France et études de cohorte (Paris 13e, Maisons-Alfort, Choisy-le-Roi, Kremlin-Bicêtre).'
  }
];

// Bloques IRIS censales de referencia (INSEE) con población y límites poligonales para coropletas
const CENSUS_IRIS_BLOCKS = [
  {
    irisCode: '940410101',
    name: 'Ivry-Port Nord',
    commune: 'Ivry-sur-Seine',
    postalCode: '94200',
    estPopulation: 4900,
    areaKm2: 0.28,
    densityHabKm2: 17500,
    under5Pct: 8.2,
    over65Pct: 11.4,
    lat: 48.8220,
    lon: 2.3910,
    distFromUveKm: 3.9,
    polygon: [
      [48.8180, 2.3860],
      [48.8260, 2.3960],
      [48.8220, 2.4040],
      [48.8140, 2.3940]
    ]
  },
  {
    irisCode: '940410102',
    name: 'Ivry-Port Sud',
    commune: 'Ivry-sur-Seine',
    postalCode: '94200',
    estPopulation: 5400,
    areaKm2: 0.35,
    densityHabKm2: 15400,
    under5Pct: 7.9,
    over65Pct: 12.1,
    lat: 48.8150,
    lon: 2.3930,
    distFromUveKm: 3.1,
    polygon: [
      [48.8100, 2.3850],
      [48.8180, 2.3950],
      [48.8130, 2.4040],
      [48.8050, 2.3940]
    ]
  },
  {
    irisCode: '940410201',
    name: 'Ivry-Centre Ville',
    commune: 'Ivry-sur-Seine',
    postalCode: '94200',
    estPopulation: 8200,
    areaKm2: 0.38,
    densityHabKm2: 21500,
    under5Pct: 6.8,
    over65Pct: 13.5,
    lat: 48.8130,
    lon: 2.3830,
    distFromUveKm: 3.4,
    polygon: [
      [48.8080, 2.3750],
      [48.8170, 2.3850],
      [48.8110, 2.3940],
      [48.8020, 2.3840]
    ]
  },
  {
    irisCode: '940410301',
    name: 'Ivry-Monmousseau / Vérollot',
    commune: 'Ivry-sur-Seine',
    postalCode: '94200',
    estPopulation: 5800,
    areaKm2: 0.31,
    densityHabKm2: 18700,
    under5Pct: 7.6,
    over65Pct: 12.8,
    lat: 48.8060,
    lon: 2.3750,
    distFromUveKm: 3.5,
    polygon: [
      [48.8010, 2.3650],
      [48.8100, 2.3760],
      [48.8050, 2.3850],
      [48.7960, 2.3740]
    ]
  },
  {
    irisCode: '940810101',
    name: 'Vitry-Port / Ardoines Nord',
    commune: 'Vitry-sur-Seine',
    postalCode: '94400',
    estPopulation: 3600,
    areaKm2: 0.44,
    densityHabKm2: 8180,
    under5Pct: 9.1,
    over65Pct: 9.8,
    lat: 48.8050,
    lon: 2.3980,
    distFromUveKm: 2.0,
    polygon: [
      [48.7990, 2.3950],
      [48.8070, 2.4040],
      [48.8010, 2.4140],
      [48.7930, 2.4050]
    ]
  },
  {
    irisCode: '940810102',
    name: 'Vitry-Plateau Ouest / Chérioux',
    commune: 'Vitry-sur-Seine',
    postalCode: '94400',
    estPopulation: 6100,
    areaKm2: 0.52,
    densityHabKm2: 11730,
    under5Pct: 7.4,
    over65Pct: 14.2,
    lat: 48.7990,
    lon: 2.3800,
    distFromUveKm: 2.9,
    polygon: [
      [48.7930, 2.3680],
      [48.8020, 2.3790],
      [48.7960, 2.3890],
      [48.7880, 2.3770]
    ]
  },
  {
    irisCode: '940810201',
    name: 'Vitry-Les Ardoines Gare',
    commune: 'Vitry-sur-Seine',
    postalCode: '94400',
    estPopulation: 4200,
    areaKm2: 0.48,
    densityHabKm2: 8750,
    under5Pct: 8.8,
    over65Pct: 10.1,
    lat: 48.7917,
    lon: 2.4167,
    distFromUveKm: 0.2,
    polygon: [
      [48.7880, 2.4100],
      [48.7960, 2.4180],
      [48.7900, 2.4260],
      [48.7830, 2.4180]
    ]
  },
  {
    irisCode: '940810301',
    name: 'Vitry-Paul Froment / Berges',
    commune: 'Vitry-sur-Seine',
    postalCode: '94400',
    estPopulation: 4100,
    areaKm2: 0.41,
    densityHabKm2: 10000,
    under5Pct: 8.3,
    over65Pct: 11.2,
    lat: 48.7820,
    lon: 2.4050,
    distFromUveKm: 1.4,
    polygon: [
      [48.7770, 2.3980],
      [48.7850, 2.4080],
      [48.7800, 2.4180],
      [48.7720, 2.4080]
    ]
  },
  {
    irisCode: '940180101',
    name: 'Charenton-Bercy Seine',
    commune: 'Charenton-le-Pont',
    postalCode: '94220',
    estPopulation: 6800,
    areaKm2: 0.35,
    densityHabKm2: 19400,
    under5Pct: 6.2,
    over65Pct: 15.1,
    lat: 48.8260,
    lon: 2.4050,
    distFromUveKm: 3.9,
    polygon: [
      [48.8210, 2.3980],
      [48.8300, 2.4100],
      [48.8250, 2.4190],
      [48.8160, 2.4070]
    ]
  },
  {
    irisCode: '940020101',
    name: 'Alfortville-Nord / Seine',
    commune: 'Alfortville',
    postalCode: '94140',
    estPopulation: 6400,
    areaKm2: 0.38,
    densityHabKm2: 16840,
    under5Pct: 7.7,
    over65Pct: 12.0,
    lat: 48.8020,
    lon: 2.4260,
    distFromUveKm: 1.3,
    polygon: [
      [48.7970, 2.4200],
      [48.8060, 2.4280],
      [48.8010, 2.4370],
      [48.7920, 2.4290]
    ]
  },
  {
    irisCode: '751130101',
    name: 'Paris 13e - Masséna / Olympiades',
    commune: 'Paris (13e Arr.)',
    postalCode: '75013',
    estPopulation: 9800,
    areaKm2: 0.36,
    densityHabKm2: 27200,
    under5Pct: 5.8,
    over65Pct: 16.4,
    lat: 48.8240,
    lon: 2.3750,
    distFromUveKm: 4.8,
    polygon: [
      [48.8190, 2.3650],
      [48.8290, 2.3780],
      [48.8230, 2.3890],
      [48.8130, 2.3760]
    ]
  },
  {
    irisCode: '940220101',
    name: 'Choisy-Nord Les Gondoles',
    commune: 'Choisy-le-Roi',
    postalCode: '94600',
    estPopulation: 4600,
    areaKm2: 0.40,
    densityHabKm2: 11500,
    under5Pct: 8.5,
    over65Pct: 10.7,
    lat: 48.7740,
    lon: 2.4180,
    distFromUveKm: 2.0,
    polygon: [
      [48.7690, 2.4100],
      [48.7780, 2.4200],
      [48.7720, 2.4300],
      [48.7630, 2.4200]
    ]
  }
];

/**
 * Determina en qué anillo concéntrico de afectación cae un punto geográfico
 * @param {number} lat - Latitud
 * @param {number} lon - Longitud
 * @returns {object|null} Anillo de afectación correspondiente
 */
function classifyPointInRing(lat, lon) {
  const distKm = haversineDistanceKm(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, lat, lon);
  const distMeters = distKm * 1000;
  for (const ring of AFFECTATION_RINGS) {
    if (distMeters <= ring.radiusMeters) {
      return {
        ringId: ring.id,
        ringName: ring.name,
        distanceMeters: Math.round(distMeters),
        distanceKm: Number(distKm.toFixed(2)),
        color: ring.color,
        riskLevel: ring.riskLevel
      };
    }
  }
  return {
    ringId: 'out_of_bounds',
    ringName: 'Hors périmètre de surveillance ( > 5 km )',
    distanceMeters: Math.round(distMeters),
    distanceKm: Number(distKm.toFixed(2)),
    color: '#64748b',
    riskLevel: 'Influence Régionale Négligeable'
  };
}

/**
 * Calcula la síntesis demográfica agregada de los anillos de proximidad
 */
function calculateRingDemographics() {
  return AFFECTATION_RINGS.map(ring => {
    const irisInRing = CENSUS_IRIS_BLOCKS.filter(i => {
      const d = haversineDistanceKm(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, i.lat, i.lon) * 1000;
      return d <= ring.radiusMeters;
    });
    const facilitiesInRing = SENSITIVE_FACILITIES.filter(f => {
      const d = haversineDistanceKm(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, f.latitude, f.longitude) * 1000;
      return d <= ring.radiusMeters;
    });
    return {
      ...ring,
      censusTractsCount: irisInRing.length,
      sensitiveFacilitiesCount: facilitiesInRing.length
    };
  });
}

/**
 * Convierte grados a radianes
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Convierte radianes a grados
 */
function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Calcula la distancia ortodrómica (Haversine) en kilómetros entre dos coordenadas WGS84
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula el azimut inicial (bearing) en grados (0° a 360°) desde el origen hacia el destino
 */
function calculateBearingDegrees(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = 
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Calcula un punto de destino a partir de origen, distancia (km) y rumbo (grados)
 */
function destinationPoint(lat, lon, distanceKm, bearingDeg) {
  const R = 6371;
  const d = distanceKm / R;
  const brng = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [toDeg(lon2), toDeg(lat2)]; // Formato GeoJSON: [lon, lat]
}

/**
 * Genera el penacho indicativo de dispersión atmosférica a sotavento
 * @param {number} windOriginDeg - Dirección de donde procede el viento (0° = N, 90° = E, 180° = S, 225° = SW)
 * @param {number} windSpeedKmH - Velocidad del viento en km/h
 * @returns {object} IndicativePlumeGeoJSONDTO
 */
function generateDispersionPlume(windOriginDeg = 225, windSpeedKmH = 15) {
  const speed = Math.max(1, Number(windSpeedKmH) || 15);
  const originDeg = (Number(windOriginDeg) % 360 + 360) % 360;

  // Dirección hacia donde viaja el penacho (a sotavento / downwind)
  const downwindAzimuth = (originDeg + 180) % 360;

  // Apertura angular del cono: vientos más fuertes generan penachos más estrechos
  const apertureAngle = Math.max(20, Math.min(65, 60 - (1.2 * speed)));
  
  // Alcance radial del cono: proporcional a la velocidad del viento (máx 3.5 km)
  const plumeLengthKm = Math.min(3.5, Math.max(0.8, 0.8 + (0.12 * speed)));

  // Construcción del polígono cónico en WGS84
  const numArcPoints = 16;
  const polygonCoordinates = [];

  // Vértice 1: Chimenea UVE
  polygonCoordinates.push([UVE_ORIGIN.longitude, UVE_ORIGIN.latitude]);

  const halfAperture = apertureAngle / 2;
  const startAngle = (downwindAzimuth - halfAperture + 360) % 360;
  const step = apertureAngle / numArcPoints;

  // Arco exterior del cono
  for (let i = 0; i <= numArcPoints; i++) {
    const angle = (startAngle + (i * step)) % 360;
    const pt = destinationPoint(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, plumeLengthKm, angle);
    polygonCoordinates.push(pt);
  }

  // Cierre del polígono en la chimenea
  polygonCoordinates.push([UVE_ORIGIN.longitude, UVE_ORIGIN.latitude]);

  // Detección de equipamientos sensibles dentro del penacho
  const facilitiesInside = [];
  for (const fac of SENSITIVE_FACILITIES) {
    const dist = haversineDistanceKm(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, fac.latitude, fac.longitude);
    if (dist <= plumeLengthKm) {
      const bearing = calculateBearingDegrees(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, fac.latitude, fac.longitude);
      // Calcular diferencia angular mínima respecto al rumbo central
      let diff = Math.abs(bearing - downwindAzimuth);
      if (diff > 180) diff = 360 - diff;

      if (diff <= (apertureAngle / 2) + 2.0) { // Margen de borde de 2°
        facilitiesInside.push({
          ...fac,
          distanceFromChimneyMeters: Math.round(dist * 1000),
          bearingDegrees: Math.round(bearing)
        });
      }
    }
  }

  // Detección de bloques IRIS bajo el penacho
  const irisUnderPlume = [];
  let totalExposedPop = 0;
  for (const iris of CENSUS_IRIS_BLOCKS) {
    const dist = haversineDistanceKm(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, iris.lat, iris.lon);
    if (dist <= plumeLengthKm) {
      let diff = Math.abs(calculateBearingDegrees(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, iris.lat, iris.lon) - downwindAzimuth);
      if (diff > 180) diff = 360 - diff;
      if (diff <= (apertureAngle / 2) + 4.0) {
        irisUnderPlume.push(iris);
        totalExposedPop += iris.estPopulation;
      }
    }
  }

  return {
    type: 'FeatureCollection',
    properties: {
      simulationTimestamp: new Date().toISOString(),
      plantName: UVE_ORIGIN.name,
      originCoordinates: [UVE_ORIGIN.longitude, UVE_ORIGIN.latitude],
      windOriginDegrees: originDeg,
      windSpeedKmH: speed,
      downwindBearingDegrees: downwindAzimuth,
      coneApertureDegrees: Math.round(apertureAngle),
      plumeLengthKm: Number(plumeLengthKm.toFixed(2)),
      exposedPopulationEstimate: totalExposedPop,
      facilitiesInsideCount: facilitiesInside.length,
      scientificDisclaimer: 'Modelo geométrico indicativo de dispersión a sotavento. No constituye un mapa oficial de salud pública ni evaluación causal.'
    },
    features: [
      {
        type: 'Feature',
        properties: {
          layerName: 'Penacho Indicativo de Dispersión',
          exposureLevel: 'INDICATIVE_DOWNWIND_CONE'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoordinates]
        }
      }
    ],
    facilitiesInside,
    irisUnderPlume
  };
}

// Exportación dual
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UVE_ORIGIN,
    SENSITIVE_FACILITIES,
    CENSUS_IRIS_BLOCKS,
    AFFECTATION_RINGS,
    haversineDistanceKm,
    calculateBearingDegrees,
    destinationPoint,
    generateDispersionPlume,
    classifyPointInRing,
    calculateRingDemographics
  };
}
