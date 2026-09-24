# CONTRATOS E INTERFACES (DTOs / SCHEMAS) — PRJ-OBS-IVRY-VITRY-V1

**Autoridad Técnica:** Director de Desarrollo (DD) — IN2TECHMX  
**Versión:** `0.9.0` (SemVer)  
**Principio:** Definición estricta de contratos antes de la implementación modular. Cero cajas negras.

---

## 1. MÓDULO FAST DATA & MICRO-DECISIONES («JEV / LAYA»)

### 1.1 Ingesta de Evento Social o Señal Ciudadana
```typescript
export type SocialSource = 'OFFICIAL_API_X' | 'PUBLIC_RSS_LOCAL' | 'CITIZEN_DIRECT_WEBHOOK';

export interface FastDataEventDTO {
  id: string; // UUID v4 determinista
  source: SocialSource;
  timestamp: string; // ISO 8601 UTC
  rawText: string;
  authorPseudonymId: string; // SHA-256 unidireccional con sal diaria (RGPD Art. 32)
  approximateLocation?: {
    latitude: number;
    longitude: number;
    irisCode?: string; // Código censal INSEE IRIS (9 dígitos)
    commune: 'Ivry-sur-Seine' | 'Vitry-sur-Seine' | 'Paris-13' | 'Charenton-le-Pont' | 'Other';
  };
  metadata?: Record<string, unknown>;
}
```

### 1.2 Salida de Micro-Decisión del Clasificador «Laya» (<70ms)
```typescript
export type ThematicCategory = 
  | 'ODOR' 
  | 'HEALTH' 
  | 'NOISE' 
  | 'GOVERNANCE' 
  | 'TRAFFIC' 
  | 'PROPERTY_VALUE';

export interface MicroDecisionResultDTO {
  eventId: string;
  sentimentScore: number; // Intervalo continuo [-1.00, +1.00]
  sentimentLabel: 'STRONGLY_NEGATIVE' | 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE' | 'STRONGLY_POSITIVE';
  primaryCategory: ThematicCategory;
  secondaryCategories: ThematicCategory[];
  urgencyFlag: boolean; // true si reporta picos de humo anómalos o síntomas agudos
  urgencyConfidence: number; // [0.00, 1.00]
  processingTimeMs: number; // Latencia auditada (< 70 ms)
  modelIdentifier: string; // ej. "laya-onnx-v0.9.1-fr"
  timestamp: string; // ISO 8601 UTC
  auditSignature: string; // HMAC-SHA256(eventId + score + model + nonce)
  scientificDisclaimer: string; // Advertencia obligatoria: "Clasificación probabilística con fines indicativos."
}
```

---

## 2. MÓDULO DE EPIDEMIOLOGÍA ESPACIAL & SENSORES AIRPARIF

### 2.1 Lectura de Sensor / Estación de Monitoreo
```typescript
export interface AirQualitySensorReadingDTO {
  readingId: string;
  stationId: string;
  stationName: string; // ej. "Ivry-Port", "Vitry-sur-Seine"
  latitude: number;
  longitude: number;
  distanceToUveKm: number;
  timestamp: string; // ISO 8601 UTC
  pollutants: {
    no2_ug_m3: number;
    pm10_ug_m3: number;
    pm25_ug_m3: number;
    so2_ug_m3?: number;
    co_mg_m3?: number;
    dioxin_pcdd_f_teq_indicative?: number; // Fuente verificada requerida
  };
  airQualityIndexAtmo: 'BON' | 'MOYEN' | 'DEGRADE' | 'MAUVAIS' | 'TRES_MAUVAIS' | 'EXTREMEMENT_MAUVAIS';
  windVector: {
    speedKmH: number;
    directionDegrees: number; // 0° = Norte, 90° = Este, 180° = Sur, 270° = Oeste
    windOriginSector: 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE' | 'S';
  };
  sourceMetadata: {
    provider: 'Airparif' | 'Météo-France';
    license: 'Licence Ouverte v2.0';
    isCertifiedOfficial: boolean;
  };
}
```

### 2.2 Penacho de Dispersión Indicativo (INSPIRE Compliant)
```typescript
export interface IndicativePlumeGeoJSONDTO {
  type: 'FeatureCollection';
  properties: {
    simulationTimestamp: string;
    sourcePlant: 'UVE Ivry-Paris XIII (SYCTOM)';
    coordinatesOrigin: [number, number]; // [2.3920, 48.8235]
    windConditions: {
      speedKmH: number;
      azimuthDeg: number;
      directionLabel: string;
    };
    disclaimer: 'Modelo indicativo geométrico de dispersión atmosférica. No constituye un diagnóstico de salud pública.';
  };
  features: Array<{
    type: 'Feature';
    properties: {
      exposureZone: 'IMMEDIATE_ZONE_1_5KM' | 'EXTENDED_ZONE_3_0KM';
      bearingDegrees: number;
    };
    geometry: {
      type: 'Polygon';
      coordinates: number[][][]; // Coordenadas WGS84
    };
  }>;
}
```

---

## 3. MÓDULO DE ENCUESTAS CIUDADANAS (VALIDACIÓN ANTI-SPAM)

```typescript
export interface CitizenSurveySubmissionDTO {
  submissionId: string;
  submittedAt: string;
  postalCode: '94200' | '94400' | string;
  residenceDurationYears: number;
  neighborhood: string;
  perceivedOdorFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'RARELY' | 'NEVER';
  perceivedHealthImpactScore: number; // 1 a 5
  reportedSymptoms: Array<'RESPIRATORY' | 'EYE_IRRITATION' | 'HEADACHE' | 'SLEEP_DISTURBANCE' | 'NONE'>;
  freeComment: string;
}

export interface ValidatedSurveyDTO extends CitizenSurveySubmissionDTO {
  validationStatus: 'VALIDATED' | 'REJECTED' | 'FLAGGED_REVIEW';
  evaluationMetrics: {
    isSpam: boolean;
    isInTargetPostalCode: boolean;
    heuristicCoherenceScore: number; // [0.0, 1.0]
  };
  anonymizedIrisZone: string;
  validatedAt: string;
}
```

---

## 4. MÓDULO AGENTIC BI CON CITAS OBLIGATORIAS

```typescript
export interface AgenticBIQueryRequestDTO {
  sessionId: string;
  query: string; // ej. "¿Cuál es la tendencia de quejas a < 1.5 km de la planta según vientos dominantes?"
  userRole: 'CITIZEN' | 'RESEARCHER' | 'POLICY_MAKER';
  spatialFilterRadiusKm?: number;
  timeRangeDays?: number;
}

export interface AgenticBIResponseDTO {
  sessionId: string;
  originalQuery: string;
  semanticInterpretation: {
    targetMetric: string;
    spatialScope: string;
    temporalScope: string;
    windConditionFilter?: string;
  };
  generatedSqlQuery?: string;
  quantitativeResults: {
    recordCount: number;
    meanMetricValue: number;
    timeDistribution: Array<{ date: string; value: number }>;
  };
  ragEvidenceCitations: Array<{
    documentTitle: string;
    sourcePublisher: string; // ej. "SYCTOM", "ARS Île-de-France", "Airparif"
    publicationDate: string;
    sectionOrPage: string;
    relevantQuote: string;
    uriOrDoi?: string;
  }>;
  synthesizedAnswerMarkdown: string;
  confidenceScore: number;
  scientificDisclaimer: string; // "Las correlaciones mostradas son de carácter indicativo conforme a la especificación v0.9.0."
}
```

---

## 5. MÓDULO DE VEILLE MULTICANALE & SEGUIMIENTO DOCUMENTAL

```typescript
export type NewsStreamCategory = 
  | 'GOVERNMENTAL'    // Préfecture 94, RAA, SYCTOM, Mairies, DREAL
  | 'PUBLIC_MEDIA'    // Le Parisien, Citoyens.com, France 3, Presse Nationale
  | 'INDEPENDENT'     // Collectif 3R, Reporterre, Zero Waste France, Blogs
  | 'ACADEMIC'        // Inserm, Santé Publique France, UPEC, CNRS, Thèses
  | 'INTERNATIONAL';  // CJUE, Zero Waste Europe, EEA, OMS

export interface NewsItemDTO {
  id: string; // UUID o slug
  category: NewsStreamCategory;
  categoryLabel: string;
  badgeClass: string;
  publisher: string;
  date: string; // Fecha de publicación oficial
  docType: 'Arrêté Préfectoral' | 'Délibération' | 'Article de Presse' | 'Enquête' | 'Étude Scientifique' | 'Arrêt Européen';
  title: string;
  summary: string;
  tags: string[];
  verifyBadge: string; // ej. "Source Officielle Actée", "Revue à Comité de Lecture", "Média Agréé"
  linkUrl: string; // Enlace a la fuente primaria o expediente
}
```

