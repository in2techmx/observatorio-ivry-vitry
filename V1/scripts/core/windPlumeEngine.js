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

// Bloques IRIS censales de referencia (INSEE) con población vulnerable estimada
const CENSUS_IRIS_BLOCKS = [
  { irisCode: '940410101', name: 'Ivry-Port Nord', commune: 'Ivry-sur-Seine', estPopulation: 4200, under5Pct: 8.2, lat: 48.8220, lon: 2.3910 },
  { irisCode: '940410102', name: 'Ivry-Port Sud', commune: 'Ivry-sur-Seine', estPopulation: 3850, under5Pct: 7.9, lat: 48.8150, lon: 2.3930 },
  { irisCode: '940410201', name: 'Ivry-Centre Ville', commune: 'Ivry-sur-Seine', estPopulation: 5100, under5Pct: 6.8, lat: 48.8130, lon: 2.3830 },
  { irisCode: '940810101', name: 'Vitry-Port / Ardoines Nord', commune: 'Vitry-sur-Seine', estPopulation: 3400, under5Pct: 9.1, lat: 48.8050, lon: 2.3980 },
  { irisCode: '940810102', name: 'Vitry-Plateau Ouest', commune: 'Vitry-sur-Seine', estPopulation: 4900, under5Pct: 7.4, lat: 48.7990, lon: 2.3800 },
  { irisCode: '940180101', name: 'Charenton-Bercy Seine', commune: 'Charenton-le-Pont', estPopulation: 4600, under5Pct: 6.2, lat: 48.8260, lon: 2.4050 }
];

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
    haversineDistanceKm,
    calculateBearingDegrees,
    destinationPoint,
    generateDispersionPlume
  };
}
