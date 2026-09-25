/**
 * PRJ-OBS-IVRY-VITRY-V1 — Motor de Micro-Decisión «Laya» (Sistema 1)
 * Autoridad Técnica: Director de Desarrollo (DD) — IN2TECHMX
 * Implementador: ADS-1 (Core & Algoritmia)
 * Cumplimiento: Latencia < 70ms, Cero Cajas Negras, Firma de Auditoría HMAC-SHA256
 *
 * CHANGELOG v1.0.0 (revisión profesional sobre v0.9.0-fr):
 *  [SEGURIDAD]     La clave HMAC ya NO tiene un valor hardcodeado utilizable en
 *                  producción. Si NODE_ENV=production y no existe
 *                  LAYA_AUDIT_SECRET, el módulo lanza un error en vez de firmar
 *                  con una clave públicamente visible en el código fuente.
 *  [AUDITORÍA]     El `nonce` usado para firmar ahora se incluye en el DTO de
 *                  salida (antes se generaba, se usaba para firmar, y se
 *                  descartaba — haciendo imposible re-verificar la firma más
 *                  tarde). Se añade verifyAuditSignature().
 *  [PRECISIÓN]     Manejo de negación ("pas de mauvaise odeur" ya no puntúa
 *                  como negativo).
 *  [PRECISIÓN]     Intensificadores/atenuadores ("très", "peu") escalan la
 *                  magnitud del sentimiento.
 *  [PRECISIÓN]     Se retira "fort" como palabra suelta de valencia (demasiado
 *                  polisémica en francés) y se reemplaza por frases específicas.
 *  [PRECISIÓN]     Léxico expandido con conjugaciones/variantes frecuentes.
 *  [PRECISIÓN]     Soporte de emojis comunes en redes sociales.
 *  [PRECISIÓN]     Fix de tokenización: las contracciones ("l'odeur", "j'ai")
 *                  ya no quedaban pegadas al apóstrofo, impidiendo el match.
 *  [ROBUSTEZ]      Ya no hay clasificación forzada a ODOR por defecto cuando no
 *                  hay ninguna señal — ahora es UNCLASSIFIED y transparente.
 *  [ROBUSTEZ]      Empates de categoría se marcan explícitamente en vez de
 *                  resolverse en silencio por orden de objeto.
 *  [ROBUSTEZ]      Validación de entrada: input inválido devuelve un resultado
 *                  estructurado (isValid:false) en lugar de arriesgar una
 *                  excepción no controlada aguas abajo.
 *  [OBSERVABILIDAD] Flag latencySlaBreached si se supera el umbral configurado.
 *  [OBSERVABILIDAD] categoryConfidence y sentimentMatchCount para trazabilidad.
 */

'use strict';

const _cryptoLaya = typeof require !== 'undefined' ? require('crypto') : null;

const MODEL_IDENTIFIER = 'laya-micro-v1.0.0-fr';

// ---------------------------------------------------------------------------
// CONFIGURACIÓN (antes: números mágicos dispersos por el código)
// ---------------------------------------------------------------------------
const CONFIG = {
  LATENCY_SLA_MS: 70,
  NEGATION_WINDOW: 3,        // nº de tokens hacia atrás en los que se busca negación
  INTENSIFIER_UP_FACTOR: 1.4,
  INTENSIFIER_DOWN_FACTOR: 0.5,
  NEGATION_FLIP_FACTOR: 0.7, // al negar, se invierte y se atenúa (no se invierte 1:1)
  SENTIMENT_SQUASH_DIVISOR: 1.5, // controla qué tan rápido satura tanh()
  SENTIMENT_THRESHOLDS: {
    STRONGLY_NEGATIVE: -0.60,
    NEGATIVE: -0.15,
    POSITIVE: 0.15,
    STRONGLY_POSITIVE: 0.60
  }
};

// ---------------------------------------------------------------------------
// SEGURIDAD DE LA CLAVE DE AUDITORÍA
// ---------------------------------------------------------------------------
function getAuditSecret() {
  const envKey = typeof process !== 'undefined' && process.env && process.env.LAYA_AUDIT_SECRET;
  if (envKey) return envKey;

  const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error(
      '[LAYA][SEGURIDAD] LAYA_AUDIT_SECRET no está configurada en producción. ' +
      'Abortando para evitar firmas de auditoría falsificables.'
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[LAYA][SEGURIDAD] Usando clave de auditoría de DESARROLLO por defecto. ' +
    'Esta clave es pública (está en el código fuente) y NUNCA debe usarse en producción.'
  );
  return 'DEV_ONLY_INSECURE_DEFAULT_KEY_DO_NOT_USE_IN_PROD';
}

// ---------------------------------------------------------------------------
// UTILIDAD LÉXICA: genera variantes de género/número sin repetir cada forma a mano
// ---------------------------------------------------------------------------
function expand(base, suffixes) {
  return suffixes.map((s) => base + s);
}

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ---------------------------------------------------------------------------
// DICCIONARIOS LÉXICOS (expandidos)
// ---------------------------------------------------------------------------
const LEXICON = {
  CATEGORIES: {
    ODOR: [
      'odeur', 'odeurs', 'puer', 'puanteur', 'nauseabond', 'nauseabonde',
      'soufre', 'brule', 'plastique brule', 'enfumer', 'empester', 'empeste',
      'empestent', 'empestait', 'respirer mal', 'puant', 'puante', 'puants',
      'fumees', 'pestilentiel', 'pestilentielle',
      ...expand('pue', ['', 's', 'nt', 'ait', 'aient', 'ra'])
    ],
    HEALTH: [
      'sante', 'toxique', 'toxiques', 'toux', 'gorge', 'respiratoire',
      'asthme', 'cancer', 'nausee', 'nausees', 'maux de tete',
      'yeux qui piquent', 'dioxine', 'dioxines', 'furannes', 'ars',
      'malade', 'malades', 'incommode', 'intoxication', 'danger',
      'enfants malades',
      ...expand('incommod', ['e', 'es', 'ee', 'ees', 'ent', 'ait']),
      ...expand('suffoqu', ['e', 'es', 'ent', 'ait', 'er']),
      ...expand('touss', ['e', 'es', 'ent', 'ait', 'er'])
    ],
    NOISE: [
      'bruit', 'bruits', 'vacarme', 'camions', 'compresseur', 'turbines',
      'grondement', 'nuit', 'vibration', 'vibrations', 'decibels',
      'tapage', 'moteur'
    ],
    GOVERNANCE: [
      'syctom', 'mairie', 'conseil', 'enquete publique', 'arrete',
      'prefet', 'opacite', 'transparence', 'association', '3r',
      'deliberation', 'concertation', 'elus', 'lettre ouverte', 'recours',
      'tribunal', 'justice'
    ],
    TRAFFIC: [
      'camions', 'circulation', 'embouteillage', 'bennes', 'quai d ivry',
      'd19', 'boulevard', 'rond-point', 'rotations', 'poids lourds',
      'stationnement'
    ],
    PROPERTY_VALUE: [
      'immobilier', 'decote', 'vente', 'maison', 'appartement', 'loyer',
      'valeur', 'invendable', 'patrimoine', 'depreciation', 'acheteurs'
    ]
  },

  // Palabras sueltas de valencia. "fort" se retiró deliberadamente: es
  // demasiado polisémico en francés como palabra aislada ("fort sympathique",
  // "fort soutien"). Se cubre en su lugar vía PHRASES más abajo.
  VALENCE: {
    STRONGLY_NEGATIVE: [
      'insupportable', 'affreux', 'affreuse', 'honteux', 'honteuse',
      'scandaleux', 'scandaleuse', 'catastrophe', 'invivable', 'suffoquer',
      'empoisonnement', 'danger mortel', 'inadmissible', 'cauchemar',
      'horrible', 'horribles'
    ],
    NEGATIVE: [
      'mauvais', 'mauvaise', 'mauvaises', 'probleme', 'problemes',
      'plainte', 'plaintes', 'genant', 'genante', 'desagreable', 'souci',
      'soucis', 'inquiet', 'inquiete', 'inquietant', 'inquietante',
      'inconfort', 'bizarre', 'suspect', 'suspecte'
    ],
    POSITIVE: [
      'amelioration', 'mieux', 'acceptable', 'baisse', 'propre',
      'rassurant', 'rassurante', 'calme', 'normal', 'normale',
      'filtre efficace', 'travaux utiles', 'progres'
    ],
    STRONGLY_POSITIVE: [
      'excellent', 'excellente', 'parfaitement maitrise',
      'parfaitement maitrisee', 'exemplaire', 'tres propre',
      'zero dechet', 'succes remarquable', 'haute qualite'
    ],
    // Frases (no palabras sueltas) — más precisas que una sola palabra ambigua.
    PHRASES_NEGATIVE: [
      'odeur forte', 'ca sent fort', 'sent tres fort', 'ca pue fort',
      'odeur tres forte'
    ]
  },

  URGENCY_KEYWORDS: [
    'fumee noire', 'epaisse fumee', 'flammes', 'explosion', 'panique',
    'odeur anormale tres forte', 'evacuation', 'urgence', 'pompiers',
    'suffoque', 'malaise', 'crise d asthme soudaine', 'secours'
  ],

  NEGATION_WORDS: new Set(['ne', 'pas', 'jamais', 'aucun', 'aucune', 'rien', 'sans', 'non', 'ni']),
  INTENSIFIERS_UP: new Set(['tres', 'vraiment', 'extremement', 'totalement', 'completement', 'horriblement']),
  INTENSIFIERS_DOWN: new Set(['peu', 'legerement']),

  // Señal débil adicional típica de redes sociales.
  EMOJI_SENTIMENT: {
    '😡': -0.85, '🤬': -0.9, '😠': -0.6, '🤢': -0.6, '🤮': -0.75,
    '😷': -0.2, '👍': 0.4, '✅': 0.4, '😊': 0.4, '🙂': 0.3, '👏': 0.5
  },
  EMOJI_CATEGORY: {
    '🤢': 'HEALTH', '🤮': 'HEALTH', '😷': 'HEALTH',
    '🚛': 'TRAFFIC', '🚚': 'TRAFFIC'
  }
};

// Precomputar versiones sin acento de cada set/lista para no repetir el cálculo
// en cada llamada de clasificación (importante para el SLA de <70ms).
function buildNormalizedLexicon(lex) {
  const norm = { CATEGORIES: {}, VALENCE: {}, URGENCY_KEYWORDS: [] };
  for (const [cat, words] of Object.entries(lex.CATEGORIES)) {
    norm.CATEGORIES[cat] = words.map(stripAccents);
  }
  for (const [key, words] of Object.entries(lex.VALENCE)) {
    norm.VALENCE[key] = words.map(stripAccents);
  }
  norm.URGENCY_KEYWORDS = lex.URGENCY_KEYWORDS.map(stripAccents);
  return norm;
}
const NORM_LEXICON = buildNormalizedLexicon(LEXICON);
const NEGATION_WORDS_NORM = new Set([...LEXICON.NEGATION_WORDS].map(stripAccents));
const INTENSIFIERS_UP_NORM = new Set([...LEXICON.INTENSIFIERS_UP].map(stripAccents));
const INTENSIFIERS_DOWN_NORM = new Set([...LEXICON.INTENSIFIERS_DOWN].map(stripAccents));

/**
 * Normaliza y tokeniza texto en francés.
 * Fix v1.0.0: separa apóstrofos (rectos ' y curvos ’) ANTES de tokenizar, para
 * que "l'odeur" produzca el token "odeur" en vez de "l'odeur" (que nunca
 * matcheaba nada en el léxico).
 */
function tokenizeFrenchText(text) {
  if (!text || typeof text !== 'string') return [];
  return stripAccents(text.toLowerCase())
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function extractEmojis(rawText) {
  if (!rawText) return [];
  // Rango básico de emoji (suficiente para los casos curados en EMOJI_SENTIMENT).
  const matches = rawText.match(/\p{Extended_Pictographic}/gu);
  return matches || [];
}

/**
 * Firma HMAC-SHA256 del registro para el audit trail.
 */
function generateAuditSignature(eventId, score, category, modelId, timestamp, nonce) {
  const payload = `${eventId}|${score.toFixed(4)}|${category}|${modelId}|${timestamp}|${nonce}`;
  const secret = getAuditSecret();
  if (_cryptoLaya && _cryptoLaya.createHmac) {
    return _cryptoLaya.createHmac('sha256', secret).update(payload).digest('hex');
  }
  // Fallback determinista SOLO para entornos sin módulo crypto nativo (navegador).
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return 'audit_sig_' + Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Re-verifica que la firma de un registro previamente emitido sea auténtica.
 * Requiere que el registro conserve `nonce` (antes se descartaba — ver CHANGELOG).
 * Usa comparación de tiempo constante cuando el runtime lo permite.
 */
function verifyAuditSignature(record) {
  if (!record || !record.nonce) return false;
  const expected = generateAuditSignature(
    record.eventId, record.sentimentScore, record.primaryCategory,
    record.modelIdentifier, record.timestamp, record.nonce
  );
  const given = record.auditSignature || '';
  if (_cryptoLaya && _cryptoLaya.timingSafeEqual) {
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    if (a.length !== b.length) return false;
    return _cryptoLaya.timingSafeEqual(a, b);
  }
  return expected === given;
}

/**
 * Puntúa categorías temáticas. Los empates ya no se resuelven en silencio.
 */
function scoreCategories(tokens, normalizedRaw, emojis) {
  const scores = { ODOR: 0, HEALTH: 0, NOISE: 0, GOVERNANCE: 0, TRAFFIC: 0, PROPERTY_VALUE: 0 };

  for (const [cat, keywords] of Object.entries(NORM_LEXICON.CATEGORIES)) {
    for (const kw of keywords) {
      if (kw.includes(' ')) {
        if (normalizedRaw.includes(kw)) scores[cat] += 2.5;
      } else if (tokens.includes(kw)) {
        scores[cat] += 1.0;
      }
    }
  }

  for (const emoji of emojis) {
    const cat = LEXICON.EMOJI_CATEGORY[emoji];
    if (cat) scores[cat] += 0.5;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];
  const secondScore = sorted[1] ? sorted[1][1] : 0;
  const totalSignal = sorted.reduce((s, c) => s + c[1], 0);

  const primaryCategory = topScore > 0 ? sorted[0][0] : 'UNCLASSIFIED';
  const ambiguousCategory = topScore > 0 && topScore === secondScore;
  const secondaryCategories = sorted.slice(1).filter((c) => c[1] > 0).map((c) => c[0]);
  const categoryConfidence = totalSignal > 0 ? Number((topScore / totalSignal).toFixed(2)) : 0;

  return { primaryCategory, secondaryCategories, ambiguousCategory, categoryConfidence, raw: scores };
}

/**
 * Puntúa sentimiento con manejo de negación e intensificadores.
 * A diferencia de v0.9.0 (que promediaba), aquí se usa una suma acotada por
 * tanh(): quejas repetidas dentro del mismo mensaje pesan más, sin que el
 * score pierda sus límites [-1, 1].
 */
function scoreSentimentTokens(tokens) {
  let rawScore = 0;
  let matches = 0;
  const W = CONFIG.NEGATION_WINDOW;

  const valenceOf = (tok) => {
    if (NORM_LEXICON.VALENCE.STRONGLY_NEGATIVE.includes(tok)) return -0.85;
    if (NORM_LEXICON.VALENCE.NEGATIVE.includes(tok)) return -0.40;
    if (NORM_LEXICON.VALENCE.POSITIVE.includes(tok)) return 0.40;
    if (NORM_LEXICON.VALENCE.STRONGLY_POSITIVE.includes(tok)) return 0.85;
    return 0;
  };

  tokens.forEach((tok, i) => {
    let v = valenceOf(tok);
    if (v === 0) return;

    const preceding = tokens.slice(Math.max(0, i - W), i);
    const negated = preceding.some((t) => NEGATION_WORDS_NORM.has(t));
    if (negated) v = -v * CONFIG.NEGATION_FLIP_FACTOR;

    const prev = tokens[i - 1];
    if (prev && INTENSIFIERS_UP_NORM.has(prev)) v *= CONFIG.INTENSIFIER_UP_FACTOR;
    if (prev && INTENSIFIERS_DOWN_NORM.has(prev)) v *= CONFIG.INTENSIFIER_DOWN_FACTOR;

    rawScore += v;
    matches++;
  });

  return { rawScore, matches };
}

function scorePhrasesAndEmojis(normalizedRaw, emojis) {
  let rawScore = 0;
  let matches = 0;
  for (const phrase of NORM_LEXICON.VALENCE.PHRASES_NEGATIVE) {
    if (normalizedRaw.includes(phrase)) {
      rawScore -= 0.5;
      matches++;
    }
  }
  for (const emoji of emojis) {
    if (emoji in LEXICON.EMOJI_SENTIMENT) {
      rawScore += LEXICON.EMOJI_SENTIMENT[emoji];
      matches++;
    }
  }
  return { rawScore, matches };
}

function labelFromScore(score) {
  const t = CONFIG.SENTIMENT_THRESHOLDS;
  if (score <= t.STRONGLY_NEGATIVE) return 'STRONGLY_NEGATIVE';
  if (score < t.NEGATIVE) return 'NEGATIVE';
  if (score <= t.POSITIVE) return 'NEUTRAL';
  if (score < t.STRONGLY_POSITIVE) return 'POSITIVE';
  return 'STRONGLY_POSITIVE';
}

/**
 * Clasificador Laya de Micro-Decisión (<70ms objetivo)
 * @param {string} text - Texto en francés a clasificar
 * @param {string} [eventId]
 * @returns {object} MicroDecisionResultDTO
 */
function classifyMicroDecision(text, eventId = null) {
  const startTime = Date.now();
  const id = eventId || ('evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
  const timestamp = new Date().toISOString();
  const nonce = Math.random().toString(36).substring(2, 10);

  if (typeof text !== 'string' || text.trim().length === 0) {
    const processingTimeMs = Math.max(1, Date.now() - startTime);
    const auditSignature = generateAuditSignature(id, 0, 'UNCLASSIFIED', MODEL_IDENTIFIER, timestamp, nonce);
    return {
      eventId: id, isValid: false, error: 'INVALID_INPUT',
      sentimentScore: 0, sentimentLabel: 'NEUTRAL',
      primaryCategory: 'UNCLASSIFIED', secondaryCategories: [], ambiguousCategory: false,
      categoryConfidence: 0, sentimentMatchCount: 0,
      urgencyFlag: false, urgencyConfidence: 0,
      processingTimeMs, latencySlaBreached: processingTimeMs > CONFIG.LATENCY_SLA_MS,
      modelIdentifier: MODEL_IDENTIFIER, timestamp, nonce, auditSignature,
      scientificDisclaimer: 'Clasificación algorítmica probabilística con fines estrictamente indicativos. No constituye un diagnóstico de salud pública.'
    };
  }

  const rawText = text;
  const normalizedRaw = stripAccents(rawText.toLowerCase());
  const tokens = tokenizeFrenchText(rawText);
  const emojis = extractEmojis(rawText);

  const catResult = scoreCategories(tokens, normalizedRaw, emojis);
  const wordSentiment = scoreSentimentTokens(tokens);
  const phraseEmojiSentiment = scorePhrasesAndEmojis(normalizedRaw, emojis);

  const totalMatches = wordSentiment.matches + phraseEmojiSentiment.matches;
  const totalRawScore = wordSentiment.rawScore + phraseEmojiSentiment.rawScore;

  let sentimentScore;
  if (totalMatches === 0) {
    // Sin palabras afectivas explícitas: se infiere polaridad leve por categoría,
    // igual que en v0.9.0, pero ya no se fuerza una categoría inexistente.
    if (catResult.primaryCategory === 'HEALTH') sentimentScore = -0.45;
    else if (catResult.primaryCategory === 'ODOR') sentimentScore = -0.35;
    else if (catResult.primaryCategory === 'NOISE') sentimentScore = -0.30;
    else sentimentScore = 0.0;
  } else {
    sentimentScore = Math.tanh(totalRawScore / CONFIG.SENTIMENT_SQUASH_DIVISOR);
  }
  sentimentScore = Number(Math.max(-1, Math.min(1, sentimentScore)).toFixed(3));
  const sentimentLabel = labelFromScore(sentimentScore);

  let urgencyHits = 0;
  for (const kw of NORM_LEXICON.URGENCY_KEYWORDS) {
    if (normalizedRaw.includes(kw)) urgencyHits++;
  }
  const urgencyFlag = urgencyHits > 0;
  const urgencyConfidence = urgencyFlag ? Number(Math.min(0.98, 0.60 + urgencyHits * 0.15).toFixed(2)) : 0;

  const processingTimeMs = Math.max(1, Date.now() - startTime);
  const auditSignature = generateAuditSignature(id, sentimentScore, catResult.primaryCategory, MODEL_IDENTIFIER, timestamp, nonce);

  return {
    eventId: id,
    isValid: true,
    sentimentScore,
    sentimentLabel,
    primaryCategory: catResult.primaryCategory,
    secondaryCategories: catResult.secondaryCategories,
    ambiguousCategory: catResult.ambiguousCategory,
    categoryConfidence: catResult.categoryConfidence,
    sentimentMatchCount: totalMatches,
    urgencyFlag,
    urgencyConfidence,
    processingTimeMs,
    latencySlaBreached: processingTimeMs > CONFIG.LATENCY_SLA_MS,
    modelIdentifier: MODEL_IDENTIFIER,
    timestamp,
    nonce,
    auditSignature,
    scientificDisclaimer: 'Clasificación algorítmica probabilística con fines estrictamente indicativos. No constituye un diagnóstico de salud pública.'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    classifyMicroDecision,
    verifyAuditSignature,
    tokenizeFrenchText,
    MODEL_IDENTIFIER,
    LEXICON,
    CONFIG
  };
}

if (typeof window !== 'undefined') {
  window.classifyMicroDecision = classifyMicroDecision;
  window.verifyAuditSignature = verifyAuditSignature;
  window.tokenizeFrenchText = tokenizeFrenchText;
  window.MODEL_IDENTIFIER = MODEL_IDENTIFIER;
  window.LEXICON = LEXICON;
  window.CONFIG = CONFIG;
}
