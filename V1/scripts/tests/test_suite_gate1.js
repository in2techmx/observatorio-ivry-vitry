/**
 * PRJ-OBS-IVRY-VITRY-V1 — Suite de Pruebas Automatizadas Deterministas (Gate 1)
 * Autoridad Técnica: Director de Desarrollo (DD) — IN2TECHMX
 * Verificación: 100% Determinista, Cero Mocks Ficticios, Cero Cajas Negras
 */

const assert = require('assert');
const { classifyMicroDecision, MODEL_IDENTIFIER } = require('../core/layaClassifier');
const { 
  UVE_ORIGIN, 
  generateDispersionPlume, 
  haversineDistanceKm, 
  calculateBearingDegrees,
  SENSITIVE_FACILITIES 
} = require('../core/windPlumeEngine');
const { validateCitizenSurvey, sanitizeCitizenComment } = require('../core/surveyValidator');

console.log('================================================================');
console.log('EJECUCIÓN DE SUITE DE PRUEBAS DETERMINISTAS (GATE 1 — PRJ-OBS-IVRY-VITRY-V1)');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// ====================================================================
// BLOQUE 1: PRUEBAS DEL MOTOR DE MICRO-DECISIÓN «LAYA» (RF-02, RF-03)
// ====================================================================
console.log('--- 1. Pruebas de Clasificador Laya (<70ms y Determinismo) ---');

runTest('Laya clasifica correctamente quejas de olores con sentimiento negativo', () => {
  const text = "Horrible odeur de plastique brûlé ce matin près de la cheminée du SYCTOM à Ivry, c'est insupportable.";
  const res = classifyMicroDecision(text);

  assert.strictEqual(res.primaryCategory, 'ODOR', 'La categoría primaria debe ser ODOR');
  assert.ok(res.sentimentScore <= -0.50, `El puntaje de sentimiento debe ser fuertemente negativo (obtenido: ${res.sentimentScore})`);
  assert.strictEqual(res.sentimentLabel, 'STRONGLY_NEGATIVE', 'El label debe ser STRONGLY_NEGATIVE');
  assert.ok(res.auditSignature && res.auditSignature.length >= 16, 'Debe incluir firma de auditoría HMAC');
  assert.ok(res.scientificDisclaimer.includes('indicativos'), 'Debe incluir el disclaimer científico');
});

runTest('Laya clasifica alertas de salud y detecta bandera de urgencia crítica', () => {
  const text = "Épaisse fumée noire qui sort de l'incinérateur d'Ivry, enfants qui suffoquent et malaise respiratoire soudain !";
  const res = classifyMicroDecision(text);

  assert.strictEqual(res.primaryCategory, 'HEALTH', 'La categoría debe ser HEALTH');
  assert.strictEqual(res.urgencyFlag, true, 'Debe activar la bandera de urgencia crítica');
  assert.ok(res.urgencyConfidence >= 0.70, 'La confianza de urgencia debe ser alta');
});

runTest('Laya cumple con la latencia estricta < 70 ms en el 100% de las iteraciones', () => {
  const testTexts = [
    "Conseil municipal d'Ivry sur Seine concernant la convention du Syctom et les recours associatifs.",
    "Bruit assourdissant des camions poubelles sur le quai d'Ivry toute la nuit.",
    "Rien à signaler aujourd'hui, filtres semblent fonctionner correctement.",
    "Impact fort sur la valeur de notre appartement à Vitry à cause des rejets de l'usine."
  ];

  const latencies = [];
  for (let i = 0; i < 20; i++) {
    const text = testTexts[i % testTexts.length];
    const res = classifyMicroDecision(text);
    latencies.push(res.processingTimeMs);
    assert.ok(res.processingTimeMs < 70, `Latencia excedida: ${res.processingTimeMs} ms`);
  }

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  console.log(`       [Métrica Laya] Latencia media observada: ${avgLatency.toFixed(2)} ms (p95: ${Math.max(...latencies)} ms)`);
});

// ====================================================================
// BLOQUE 2: PRUEBAS DEL MOTOR DE DISPERSIÓN Y ROSA DE VIENTOS (RF-05, RF-09)
// ====================================================================
console.log('\n--- 2. Pruebas de Algoritmia Espacial y Cono de Vientos ---');

runTest('Cálculo trigonométrico preciso de distancias y azimut desde instalación en Vitry (48° 47\' 30" N, 2° 25\' 0" E)', () => {
  const montesquieu = SENSITIVE_FACILITIES.find(f => f.name.includes('Montesquieu'));
  assert.ok(montesquieu, 'École Montesquieu debe estar en el catálogo oficial');

  const dist = haversineDistanceKm(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, montesquieu.latitude, montesquieu.longitude);
  assert.ok(dist >= 1.2 && dist <= 1.8, `Distancia a École Montesquieu esperada ~1.5 km (calculada: ${dist.toFixed(2)} km)`);

  const bearing = calculateBearingDegrees(UVE_ORIGIN.latitude, UVE_ORIGIN.longitude, montesquieu.latitude, montesquieu.longitude);
  assert.ok(bearing >= 310 && bearing <= 335, `Rumbo esperado hacia el noroeste (calculado: ${bearing.toFixed(1)}°)`);
});

runTest('Generación de penacho a sotavento con viento Suroeste (225° -> Cono a 45° Noreste)', () => {
  const windOrigin = 225; // Viento del Suroeste
  const windSpeed = 20; // 20 km/h
  const plume = generateDispersionPlume(windOrigin, windSpeed);

  assert.strictEqual(plume.type, 'FeatureCollection', 'Debe ser GeoJSON FeatureCollection');
  assert.strictEqual(plume.properties.downwindBearingDegrees, 45, 'El rumbo a sotavento debe ser 45° (Noreste)');
  assert.ok(plume.properties.plumeLengthKm >= 2.0, `La longitud del penacho debe ser >= 2.0 km para 20 km/h (calculada: ${plume.properties.plumeLengthKm} km)`);
  assert.ok(plume.features[0].geometry.coordinates[0].length >= 10, 'El cono debe tener suficientes vértices poligonales');
  assert.ok(plume.properties.scientificDisclaimer.includes('indicativo'), 'Debe incorporar la salvedad científica indicativa');
});

runTest('Detección determinista de escuelas intersectadas según orientación del viento', () => {
  // Viento del Este (90°) -> Sotavento hacia el Oeste (270°) -> Debe alcanzar EHPAD La Seigneurie y Lycée Jean Macé en Vitry
  const plumeWest = generateDispersionPlume(90, 25);
  assert.ok(plumeWest.properties.facilitiesInsideCount > 0, 'Debe detectar centros sensibles al oeste de la instalación');
  
  const hasVitryFacility = plumeWest.facilitiesInside.some(f => f.name.includes('Seigneurie') || f.name.includes('Jean Macé') || f.name.includes('Montesquieu'));
  assert.ok(hasVitryFacility, 'Debe incluir al menos un centro sensible de Vitry-sur-Seine al oeste');
});

// ====================================================================
// BLOQUE 3: PRUEBAS DEL VALIDADOR DE ENCUESTAS CIUDADANAS (RF-03, RF-07)
// ====================================================================
console.log('\n--- 3. Pruebas de Validación de Encuestas y RGPD ---');

runTest('Aceptación de encuestas válidas de Ivry-sur-Seine (94200) y Vitry-sur-Seine (94400)', () => {
  const validSubmissionIvry = {
    postalCode: '94200',
    residenceDurationYears: 5,
    neighborhood: 'Ivry-Port',
    perceivedOdorFrequency: 'DAILY',
    perceivedHealthImpactScore: 4,
    reportedSymptoms: ['RESPIRATORY', 'HEADACHE'],
    freeComment: 'Odeurs quotidiennes particulièrement en soirée au quai Jean Compagnon.',
    ipOrSessionId: '192.168.1.45'
  };

  const res = validateCitizenSurvey(validSubmissionIvry);
  assert.strictEqual(res.validationStatus, 'VALIDATED', 'Debe validar la encuesta de Ivry');
  assert.strictEqual(res.isTargetPostal, true, 'Debe ser código postal objetivo');
  assert.ok(res.authorPseudonym.startsWith('usr_'), 'El autor debe ser un pseudónimo seudónimo');
  assert.ok(!res.authorPseudonym.includes('192.168'), 'La IP jamás debe almacenarse en el pseudónimo');
});

runTest('Rechazo automático de código postal fuera de la zona de estudio', () => {
  const invalidSubmission = {
    postalCode: '69001', // Lyon
    freeComment: 'Je donne mon avis depuis Lyon.'
  };

  const res = validateCitizenSurvey(invalidSubmission);
  assert.strictEqual(res.validationStatus, 'REJECTED', 'Debe rechazar envíos fuera de la zona');
  assert.strictEqual(res.evaluationMetrics.isInTargetPostalCode, false);
});

runTest('Filtro antispam detecta repetición artificial de caracteres y enlaces URLs', () => {
  const spamSubmission = {
    postalCode: '94200',
    freeComment: 'Visitez notre site https://spam-promo.com pour gagner un cadeau aaaaaaaaaaaaaa'
  };

  const res = validateCitizenSurvey(spamSubmission);
  assert.strictEqual(res.validationStatus, 'REJECTED', 'Debe rechazar spam con URLs y repetición');
  assert.strictEqual(res.evaluationMetrics.isSpam, true, 'Bandera de spam debe ser true');
});

runTest('Sanitización RGPD purga correos electrónicos, teléfonos y direcciones exactas', () => {
  const dirtyComment = "Contactez-moi au 06 12 34 56 78 ou par mail jean.dupont@test.fr habitant au 14 rue Victor Hugo.";
  const clean = sanitizeCitizenComment(dirtyComment);

  assert.ok(!clean.includes('06 12 34 56 78'), 'El teléfono debe ser eliminado');
  assert.ok(!clean.includes('jean.dupont@test.fr'), 'El email debe ser eliminado');
  assert.ok(clean.includes('[EMAIL_REDACTED]'), 'Debe contener la etiqueta de redacción');
  assert.ok(clean.includes('[PHONE_REDACTED]'), 'Debe contener la etiqueta de teléfono');
});

// ====================================================================
// BLOQUE 4: PRUEBAS DE INGESTIÓN Y ANÁLISIS DE REDES SOCIALES (FEDIVERSE)
// ====================================================================
console.log('\n--- 4. Pruebas de Ingestión y Análisis de Sentimiento Social (Fediverse) ---');

const { SOCIAL_FALLBACK_CACHE, stripHtmlTags } = require('../web/app.js');

runTest('Integridad y cobertura del catálogo de contingencia social para hashtags objetivo', () => {
  assert.ok(SOCIAL_FALLBACK_CACHE, 'El catálogo de publicaciones de contingencia debe existir');
  const requiredTags = ['ivry', 'vitry', 'incinerateur', 'syctom', 'dechets', 'pollution'];
  
  for (const tag of requiredTags) {
    const list = SOCIAL_FALLBACK_CACHE[tag];
    assert.ok(Array.isArray(list) && list.length >= 2, `El tag #${tag} debe tener al menos 2 publicaciones verificadas`);
    for (const post of list) {
      assert.ok(post.id, 'Cada post debe tener ID');
      assert.ok(post.content, 'Cada post debe tener contenido');
      assert.ok(post.account && post.account.display_name, 'Cada post debe tener autor');
      assert.ok(post.url, 'Cada post debe tener enlace fuente');
    }
  }
});

runTest('Inferencia Laya sobre toots de redes sociales y cálculo determinista de polaridad', () => {
  const ivryPosts = SOCIAL_FALLBACK_CACHE.ivry;
  assert.ok(ivryPosts.length > 0);

  let totalScore = 0;
  let classifiedCount = 0;

  for (const post of ivryPosts) {
    const plain = stripHtmlTags(post.content);
    assert.ok(!plain.includes('<p>') && !plain.includes('</p>'), 'El texto plano debe estar limpio de etiquetas HTML');
    const res = classifyMicroDecision(plain, 'test_' + post.id);
    assert.ok(typeof res.sentimentScore === 'number', 'Debe generar score numérico');
    assert.ok(['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(res.sentimentLabel), 'Label debe ser válido');
    assert.ok(res.auditSignature && res.auditSignature.length >= 16, 'Debe incluir firma de auditoría');
    assert.ok(res.processingTimeMs < 70, 'La latencia debe ser inferior a 70ms');
    totalScore += res.sentimentScore;
    classifiedCount++;
  }

  const avg = totalScore / classifiedCount;
  assert.ok(!isNaN(avg) && avg >= -1 && avg <= 1, 'El promedio de polaridad debe estar en [-1, 1]');
});

// ====================================================================
// RESUMEN FINAL DE GATE 1
// ====================================================================
console.log('\n================================================================');
console.log(`DICTAMEN GATE 1: ${passedTests}/${totalTests} PRUEBAS EN VERDE`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('VEREDICTO: GATE 1 SUPERADO EXITOSAMENTE (100% Determinista)');
  process.exit(0);
} else {
  console.error('VEREDICTO: GATE 1 FALLIDO');
  process.exit(1);
}
