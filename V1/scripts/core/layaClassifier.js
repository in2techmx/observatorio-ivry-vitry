/**
 * PRJ-OBS-IVRY-VITRY-V1 — Motor de Micro-Decisión «Laya» (Sistema 1)
 * Autoridad Técnica: Director de Desarrollo (DD) — IN2TECHMX
 * Implementador: ADS-1 (Core & Algoritmia)
 * Cumplimiento: Latencia < 70ms, Cero Cajas Negras, Firma de Auditoría HMAC-SHA256
 */

const _cryptoLaya = typeof require !== 'undefined' ? require('crypto') : null;

// Clave de firma interna del observatorio para sellado de auditoría (HMAC)
const AUDIT_SECRET_KEY = (typeof process !== 'undefined' && process.env && process.env.LAYA_AUDIT_SECRET) || 'IN2TECH_IVRY_VITRY_AUDIT_SALT_2026';
const MODEL_IDENTIFIER = 'laya-micro-v0.9.0-fr';

// Diccionarios léxicos semánticos especializados en la problemática ambiental de Ivry/Vitry
const LEXICON = {
  CATEGORIES: {
    ODOR: [
      'odeur', 'odeurs', 'puer', 'puanteur', 'nauséabond', 'soufre', 'brûlé', 
      'plastique brûlé', 'enfumer', 'empester', 'respirer mal', 'puant', 'fumées', 'pestilentiel'
    ],
    HEALTH: [
      'santé', 'toxique', 'toux', 'gorge', 'respiratoire', 'asthme', 'cancer', 
      'nausée', 'maux de tête', 'yeux qui piquent', 'dioxine', 'dioxines', 'furannes', 
      'ars', 'malade', 'incommodé', 'intoxication', 'danger', 'enfants malades'
    ],
    NOISE: [
      'bruit', 'bruits', 'vacarme', 'camions', 'compresseur', 'turbines', 
      'grondement', 'nuit', 'vibration', 'décibels', 'tapage', 'moteur'
    ],
    GOVERNANCE: [
      'syctom', 'mairie', 'conseil', 'enquête publique', 'arrêté', 'préfet', 
      'opacité', 'transparence', 'association', '3r', 'délibération', 'concertation', 
      'élus', 'lettre ouverte', 'recours', 'tribunal', 'justice'
    ],
    TRAFFIC: [
      'camions', 'circulation', 'embouteillage', 'bennes', 'quai d\'ivry', 
      'd19', 'boulevard', 'rond-point', 'rotations', 'poids lourds', 'stationnement'
    ],
    PROPERTY_VALUE: [
      'immobilier', 'décote', 'vente', 'maison', 'appartement', 'loyer', 
      'valeur', 'invendable', 'patrimoine', 'dépréciation', 'acheteurs'
    ]
  },
  VALENCE: {
    STRONGLY_NEGATIVE: [
      'insupportable', 'affreux', 'honteux', 'scandaleux', 'catastrophe', 
      'invivable', 'suffoquer', 'empoisonnement', 'danger mortel', 'inadmissible', 'cauchemar'
    ],
    NEGATIVE: [
      'mauvais', 'problème', 'plainte', 'gênant', 'désagréable', 'souci', 
      'fort', 'inquiet', 'inquiétant', 'inconfort', 'bizarre', 'suspect'
    ],
    POSITIVE: [
      'amélioration', 'mieux', 'acceptable', 'baisse', 'propre', 'rassurant', 
      'calme', 'normal', 'filtre efficace', 'travaux utiles', 'progrès'
    ],
    STRONGLY_POSITIVE: [
      'excellent', 'parfaitement maîtrisé', 'exemplaire', 'très propre', 
      'zéro déchet', 'succès remarquable', 'haute qualité'
    ]
  },
  URGENCY_KEYWORDS: [
    'fumée noire', 'épaisse fumée', 'flammes', 'explosion', 'panique', 
    'odeur anormale très forte', 'évacuation', 'urgence', 'pompiers', 
    'suffoque', 'malaise', 'crise d\'asthme soudaine', 'secours'
  ]
};

/**
 * Normaliza y tokeniza texto en francés
 * @param {string} text 
 * @returns {string[]}
 */
function tokenizeFrenchText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos para robustez léxica
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Genera la firma criptográfica HMAC-SHA256 del registro para el audit trail
 */
function generateAuditSignature(eventId, score, category, modelId, timestamp, nonce) {
  const payload = `${eventId}|${score.toFixed(4)}|${category}|${modelId}|${timestamp}|${nonce}`;
  if (_cryptoLaya && _cryptoLaya.createHmac) {
    return _cryptoLaya.createHmac('sha256', AUDIT_SECRET_KEY).update(payload).digest('hex');
  }
  // Fallback determinista en navegadores / entornos sin módulo crypto nativo
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) - hash) + payload.charCodeAt(i);
    hash |= 0;
  }
  return 'audit_sig_' + Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Clasificador Laya de Micro-Decisión (<70ms)
 * @param {string} text - Texto en francés a clasificar
 * @param {string} [eventId] - Identificador único de evento (opcional)
 * @returns {object} MicroDecisionResultDTO
 */
function classifyMicroDecision(text, eventId = null) {
  const startTime = Date.now();
  const id = eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
  const rawText = String(text || '');
  const tokens = tokenizeFrenchText(rawText);
  const normalizedRaw = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Detección de Categorías Temáticas
  const categoryScores = {
    ODOR: 0,
    HEALTH: 0,
    NOISE: 0,
    GOVERNANCE: 0,
    TRAFFIC: 0,
    PROPERTY_VALUE: 0
  };

  for (const [cat, keywords] of Object.entries(LEXICON.CATEGORIES)) {
    for (const kw of keywords) {
      const cleanKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (cleanKw.includes(' ')) {
        if (normalizedRaw.includes(cleanKw)) {
          categoryScores[cat] += 2.5; // Mayor peso a n-gramas
        }
      } else {
        if (tokens.includes(cleanKw)) {
          categoryScores[cat] += 1.0;
        }
      }
    }
  }

  // Ordenar categorías por puntuación
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1]);
  
  const primaryCategory = sortedCategories[0][1] > 0 ? sortedCategories[0][0] : 'ODOR';
  const secondaryCategories = sortedCategories
    .slice(1)
    .filter(c => c[1] > 0)
    .map(c => c[0]);

  // 2. Cálculo Continuo de Sentimiento [-1.00, +1.00]
  let sentimentScore = 0.0;
  let matchesCount = 0;

  for (const word of LEXICON.VALENCE.STRONGLY_NEGATIVE) {
    if (normalizedRaw.includes(word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      sentimentScore -= 0.85;
      matchesCount++;
    }
  }
  for (const word of LEXICON.VALENCE.NEGATIVE) {
    if (normalizedRaw.includes(word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      sentimentScore -= 0.40;
      matchesCount++;
    }
  }
  for (const word of LEXICON.VALENCE.POSITIVE) {
    if (normalizedRaw.includes(word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      sentimentScore += 0.40;
      matchesCount++;
    }
  }
  for (const word of LEXICON.VALENCE.STRONGLY_POSITIVE) {
    if (normalizedRaw.includes(word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      sentimentScore += 0.85;
      matchesCount++;
    }
  }

  // Si no hay palabras afectivas directas pero hay quejas de olor/salud, es inherentemente negativo
  if (matchesCount === 0) {
    if (categoryScores.HEALTH > 0) sentimentScore = -0.45;
    else if (categoryScores.ODOR > 0) sentimentScore = -0.35;
    else if (categoryScores.NOISE > 0) sentimentScore = -0.30;
    else sentimentScore = 0.0;
  } else {
    // Normalizar al rango [-1.0, 1.0]
    sentimentScore = Math.max(-1.0, Math.min(1.0, sentimentScore / (matchesCount || 1)));
  }

  // Label categórico
  let sentimentLabel = 'NEUTRAL';
  if (sentimentScore <= -0.60) sentimentLabel = 'STRONGLY_NEGATIVE';
  else if (sentimentScore < -0.15) sentimentLabel = 'NEGATIVE';
  else if (sentimentScore <= 0.15) sentimentLabel = 'NEUTRAL';
  else if (sentimentScore < 0.60) sentimentLabel = 'POSITIVE';
  else sentimentLabel = 'STRONGLY_POSITIVE';

  // 3. Detección de Urgencia Crítica (Urgencia Flag)
  let urgencyFlag = false;
  let urgencyConfidence = 0.0;
  let urgencyHits = 0;

  for (const kw of LEXICON.URGENCY_KEYWORDS) {
    if (normalizedRaw.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
      urgencyHits++;
    }
  }

  if (urgencyHits > 0) {
    urgencyFlag = true;
    urgencyConfidence = Math.min(0.98, 0.60 + (urgencyHits * 0.15));
  }

  const processingTimeMs = Math.max(1, Date.now() - startTime);
  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(2, 10);
  const auditSignature = generateAuditSignature(id, sentimentScore, primaryCategory, MODEL_IDENTIFIER, timestamp, nonce);

  return {
    eventId: id,
    sentimentScore: Number(sentimentScore.toFixed(3)),
    sentimentLabel,
    primaryCategory,
    secondaryCategories,
    urgencyFlag,
    urgencyConfidence: Number(urgencyConfidence.toFixed(2)),
    processingTimeMs,
    modelIdentifier: MODEL_IDENTIFIER,
    timestamp,
    auditSignature,
    scientificDisclaimer: 'Clasificación algorítmica probabilística con fines estrictamente indicativos. No constituye un diagnóstico de salud pública.'
  };
}

// Exportación compatible CommonJS y Navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    classifyMicroDecision,
    tokenizeFrenchText,
    MODEL_IDENTIFIER,
    LEXICON
  };
}
