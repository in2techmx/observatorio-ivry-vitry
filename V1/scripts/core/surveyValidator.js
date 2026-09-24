/**
 * PRJ-OBS-IVRY-VITRY-V1 — Validador Heurístico de Encuestas Ciudadanas
 * Autoridad Técnica: Director de Desarrollo (DD) — IN2TECHMX
 * Implementador: ADS-1 (Core & Algoritmia)
 * Cumplimiento: RGPD Art. 32 (Seudonimización Irreversible), Filtro Anti-Spam
 */

const crypto = typeof require !== 'undefined' ? require('crypto') : null;

const VALID_POSTAL_CODES = {
  CORE: ['94200', '94400'], // Ivry-sur-Seine y Vitry-sur-Seine
  PERIPHERAL: ['75013', '94220', '94140', '94800'] // París 13, Charenton, Alfortville, Villejuif
};

// Genera una sal criptográfica diaria determinista para el borrado de identificadores
function getDailySalt() {
  const today = new Date().toISOString().slice(0, 10);
  return `SALT_RGPD_${today}_IN2TECH_IVRY`;
}

/**
 * Seudonimiza irreversiblemente un identificador técnico (IP, sesión)
 */
function anonymizeIdentifier(identifier) {
  if (!identifier) return 'anon_' + Math.random().toString(36).substring(2, 10);
  const input = `${identifier}|${getDailySalt()}`;
  if (crypto && crypto.createHash) {
    return 'usr_' + crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return 'usr_' + Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Sanitiza texto ciudadano para purgar correos, teléfonos y números de calle
 */
function sanitizeCitizenComment(comment) {
  if (!comment || typeof comment !== 'string') return '';
  return comment
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    .replace(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g, '[PHONE_REDACTED]')
    .replace(/\b\d{1,4}\s+(?:rue|avenue|boulevard|allée|impasse|quai|chemin)\b/gi, '[ADDRESS_REDACTED]')
    .slice(0, 1000); // Límite defensivo de longitud
}

/**
 * Evalúa y valida un envío de encuesta ciudadana
 * @param {object} submissionData 
 * @returns {object} ValidatedSurveyDTO
 */
function validateCitizenSurvey(submissionData = {}) {
  const errors = [];
  const warnings = [];

  const rawPostal = String(submissionData.postalCode || '').trim();
  const postalMatch = rawPostal.match(/\b\d{5}\b/);
  const postalCode = postalMatch ? postalMatch[0] : '';

  // 1. Verificación de Código Postal
  let isTargetPostal = false;
  if (VALID_POSTAL_CODES.CORE.includes(postalCode)) {
    isTargetPostal = true;
  } else if (VALID_POSTAL_CODES.PERIPHERAL.includes(postalCode)) {
    warnings.push('Código postal periférico al área prioritaria de Ivry/Vitry.');
  } else {
    errors.push(`Código postal no autorizado o fuera del ámbito de estudio (${postalCode || 'Vacío'}).`);
  }

  // 2. Filtro Anti-Spam Heurístico
  const rawComment = String(submissionData.freeComment || '').trim();
  let isSpam = false;

  if (rawComment.length > 0) {
    // Detección de caracteres repetidos sospechosos (ej. "aaaaaaaaa", "111111111")
    if (/(.)\1{6,}/.test(rawComment)) {
      isSpam = true;
      errors.push('Comentario rechazado: patrón de repetición sintética detectado.');
    }
    // Detección de URLs o enlaces no permitidos
    if (/https?:\/\/|www\./i.test(rawComment)) {
      isSpam = true;
      errors.push('Comentario rechazado: prohibida la inclusión de enlaces o URLs.');
    }
    // Detección de texto excesivamente corto o vacío de significado
    if (rawComment.length < 5 && rawComment.length > 0) {
      warnings.push('Comentario de brevedad extrema.');
    }
  }

  // 3. Normalización de Variables
  const healthScore = Math.max(1, Math.min(5, parseInt(submissionData.perceivedHealthImpactScore, 10) || 1));
  const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY', 'NEVER'];
  const odorFreq = validFrequencies.includes(submissionData.perceivedOdorFrequency) 
    ? submissionData.perceivedOdorFrequency 
    : 'RARELY';

  const validSymptoms = ['RESPIRATORY', 'EYE_IRRITATION', 'HEADACHE', 'SLEEP_DISTURBANCE', 'NONE'];
  const symptoms = Array.isArray(submissionData.reportedSymptoms)
    ? submissionData.reportedSymptoms.filter(s => validSymptoms.includes(s))
    : ['NONE'];

  // 4. Determinación de Estado
  let validationStatus = 'VALIDATED';
  let rejectionReason = null;

  if (errors.length > 0) {
    validationStatus = 'REJECTED';
    rejectionReason = errors.join(' ');
  } else if (warnings.length > 0) {
    validationStatus = 'FLAGGED_REVIEW';
  }

  const cleanComment = sanitizeCitizenComment(rawComment);
  const pseudonym = anonymizeIdentifier(submissionData.ipOrSessionId || ('sess_' + Date.now()));

  // Zona censal estimada según código postal
  let anonymizedIrisZone = '94041-IVRY-GLOBAL';
  if (postalCode === '94400') anonymizedIrisZone = '94081-VITRY-GLOBAL';
  else if (postalCode === '75013') anonymizedIrisZone = '75113-PARIS13-PERIPH';
  else if (postalCode === '94220') anonymizedIrisZone = '94018-CHARENTON-PERIPH';

  return {
    submissionId: submissionData.submissionId || ('sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
    submittedAt: new Date().toISOString(),
    postalCode: postalCode || 'N/A',
    isTargetPostal,
    residenceDurationYears: Math.max(0, parseInt(submissionData.residenceDurationYears, 10) || 0),
    neighborhood: submissionData.neighborhood ? String(submissionData.neighborhood).slice(0, 50) : 'Non spécifié',
    perceivedOdorFrequency: odorFreq,
    perceivedHealthImpactScore: healthScore,
    reportedSymptoms: symptoms.length > 0 ? symptoms : ['NONE'],
    sanitizedComment: cleanComment,
    authorPseudonym: pseudonym,
    anonymizedIrisZone,
    validationStatus,
    rejectionReason,
    evaluationMetrics: {
      isSpam,
      isInTargetPostalCode: isTargetPostal,
      coherenceScore: errors.length === 0 ? (warnings.length === 0 ? 1.0 : 0.75) : 0.0
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VALID_POSTAL_CODES,
    validateCitizenSurvey,
    sanitizeCitizenComment,
    anonymizeIdentifier
  };
}
