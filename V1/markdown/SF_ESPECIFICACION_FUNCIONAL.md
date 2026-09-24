# ESPECIFICACIÓN FUNCIONAL Y TÉCNICA (FS / FT)
## Observatorio de Gobernanza Ambiental Urbana y Percepción Pública: Ivry-sur-Seine / Vitry-sur-Seine (Val-de-Marne)

| Metadato | Valor |
| :--- | :--- |
| **Código de Proyecto** | `PRJ-OBS-IVRY-VITRY-V1` |
| **Autoridad Técnica** | Director de Desarrollo (DD) — IN2TECHMX |
| **Fecha** | Septiembre 2026 |
| **Versión** | `0.9.0` (SemVer) |
| **Estado** | **BORRADOR REVISADO Y ENRIQUECIDO** — Pendiente de validación jurídica final y firma de fuentes |

---

# PARTE I — REQUISITOS Y MARCO ESTRATÉGICO

## 1. CONTEXTO Y OBJETO
El observatorio tiene por objeto la **vigilancia continua, auditoría sociopolítica y modelado geoespacial** de la interacción entre la gobernanza territorial, las infraestructuras industriales de tratamiento y valorización de residuos, y las comunidades urbanas circundantes.

El caso de estudio prioritario es la **Unidad de Valorización Energética (UVE) de Ivry/París XIII**, bajo la tutela del sindicato intermunicipal **SYCTOM**, y su cohabitación con las poblaciones y equipamientos sensibles de **Ivry-sur-Seine** y **Vitry-sur-Seine** (departamento de Val-de-Marne, región Île-de-France).

---

## 2. OBJETIVOS ESTRATÉGICOS
- **O1. Auditoría de Procesos Institucionales:** Documentar, indexar y auditar la trazabilidad de los procesos de decisión pública (*enquêtes publiques*, actas de consejos municipales de Ivry, Vitry y París, acuerdos de la Métropole du Grand Paris y resoluciones del SYCTOM).
- **O2. Medición de Percepción Ciudadana:** Capturar, cuantificar y cartografiar el sentimiento comunitario, la evolución de los riesgos percibidos (salud, olores, ruido, depreciación inmobiliaria) y la confianza institucional.
- **O3. Correlación Espacio-Temporal y Epidemiología Ambiental:** Cruzar datos censales demográficos (INSEE IRIS), mediciones ambientales continuas (Airparif) y registros de dispersión atmosférica con límites metodológicos formalmente declarados.
- **O4. Benchmarking y Extrapolación de Políticas Comparadas:** Proveer un repositorio analítico comparativo con otras UVE europeas y francesas (Isséane en Issy-les-Moulineaux, Éverré en Fos-sur-Mer, y la UVE de Créteil) para extraer lecciones de gobernanza y cohabitación.
- **O5. Plataforma de Acceso Abierto y BI Agéntico:** Disponer los datos y análisis para investigadores, responsables de políticas públicas y colectivos ciudadanos a través de una interfaz pública de 5 pestañas y un asistente conversacional fundado en datos certificados.

---

## 3. MARCO ANALÍTICO DOCTORAL (4 EJES)

```
                 ┌──────────────────────────────────────────┐
                 │   OBSERVATORIO AMBIENTAL URBANO          │
                 └────────────────────┬─────────────────────┘
      ┌──────────────┬─────────────┴──────────┬──────────────┐
      ▼              ▼                        ▼              ▼
┌────────────┐ ┌─────────────┐        ┌─────────────┐ ┌─────────────┐
│ 1. SOCIOL. │ │ 2. PERCEP-  │        │ 3. EPIDEMIO-│ │ 4. POLÍTICAS│
│ POLÍTICA Y │ │ CIÓN COMU-  │        │ LOGÍA ESPA- │ │ PÚBLICAS    │
│ GOBERNANZA │ │ NITARIA     │        │ CIAL Y AMB. │ │ COMPARADAS  │
└────────────┘ └─────────────┘        └─────────────┘ └─────────────┘
```

### Eje 1 — Sociología Política y Dinámicas Institucionales
- **Alcance:** Auditoría sistemática de los expedientes de *enquêtes publiques*, actas de consejos municipales (Ivry-sur-Seine, Vitry-sur-Seine, París), decisiones de la Métropole du Grand Paris y del SYCTOM.
- **Mapa de Actores:** Colectivos vecinales y ecologistas (p. ej. *3R — Réduire, Réutiliser, Recycler*), sindicatos de trabajadores de la planta, operadores técnicos industriales, autoridades sanitarias (ARS Île-de-France) y grupos de presión económicos.
- **Meta Analítica:** Cuantificar asimetrías de información, grados de transparencia documental, cronología de litigios contencioso-administrativos y ciclos de concertación/ruptura.

### Eje 2 — Percepción Comunitaria e Impacto Social
- **Alcance:** Seguimiento de la evolución de las narrativas sociales: transición empírica del marco NIMBY (*Not In My Back Yard*) hacia el marco contemporáneo de **Justicia Ambiental** y análisis de desigualdades ambientales en la primera corona de la periferia parisina.
- **Variables Monitorizadas:** Nivel de confianza en las instituciones públicas y operadores, percepción subjetiva de riesgos de morbilidad, episodios de olores nauseabundos, impacto sonoro por tráfico de camiones pesados y alteración de actividades escolares, deportivas y recreativas al aire libre.

### Eje 3 — Epidemiología Espacial y Ambiental
- **Alcance:** Modelado geoespacial multicapa que integra:
  - **Bloques censales INSEE (IRIS):** Densidad poblacional, porcentaje de menores de 5 años y mayores de 65 años, índices de vulnerabilidad social (FDep).
  - **Calidad del aire de referencia (Airparif):** Series horarias y promedios anuales de $NO_2$, $PM_{2.5}$ y $PM_{10}$.
  - **Dioxinas y Furanos (PCDD/F):** Monitoreo semestral y campañas de biomonitorización en suelos y huevos de gallinero (fuentes a consolidar: operador, SYCTOM, ARS).
  - **Dinámica atmosférica local:** Rosa de vientos dominante en el Valle del Sena (sector Suroeste $\rightarrow$ Noreste, sujeto a validación con Météo-France París-Montsouris/Orly), rugosidad del dosel urbano y efecto de confinamiento topográfico.
  - **Equipamientos sensibles:** Catastro georreferenciado de escuelas infantiles, colegios, guarderías, residencias de mayores y complejos deportivos en radios de 0 a 3 km.

### Eje 4 — Políticas Públicas Comparadas
- **Alcance:** Benchmarking sistemático con unidades de valorización de referencia:
  - *Issy-les-Moulineaux (Isséane):* Planta con integración arquitectónica subterránea de alta renta y diseño urbanístico avanzado.
  - *Fos-sur-Mer (Éverré):* Estudio de controversias históricas de salud, movilización sindical y litigios judiciales.
  - *Créteil (Val-de-Marne):* Caso vecino en el mismo departamento con procesos de modernización técnica y cohabitación industrial-urbana.
- **Protocolo de Verificación:** Los operadores contractuales vigentes, tecnologías exactas de tratamiento de gases y resoluciones prefectorales se verificarán con fuentes primarias antes de su publicación definitiva.

---

## 4. PRINCIPIOS RECTORES Y SALVEDADES CIENTÍFICAS
1. **Neutralidad y Trazabilidad Absoluta:** Toda cifra, polígono o indicador publicado incluye de forma ineludible su fuente primaria, fecha de captura y metodología de cálculo.
2. **Prudencia Científica y Control de Falacia Ecológica:**
   - La correlación espacial **no implica causalidad epidemiológica**.
   - Los contornos de dispersión son **estrictamente indicativos** y modelos computacionales de exposición potencial; bajo ninguna circunstancia constituyen un dictamen o diagnóstico sanitario oficial.
   - Todo mapa y gráfico incluye un descargo de responsabilidad visible (*disclaimer* metodológico).
3. **Privacidad desde el Diseño (Privacy by Design - RGPD):** Seudonimización irreversible en el punto de ingesta, agregación espacial mínima a nivel de celda/IRIS y prohibición absoluta de almacenar identificadores directos (nombres, cuentas, IPs).
4. **Supervisión Humana Obligatoria (HITL):** Ninguna alerta clasificada como de urgencia crítica o anomalía de emisiones se difunde públicamente sin validación y visto bueno humano.
5. **Soberanía Tecnológica Europea:** Preferencia estricta por regiones de la Unión Europea (París / Francia) y proveedores que garanticen inmunidad frente a normativas extraterritoriales (evaluación de OVHcloud, Scaleway frente a nubes hiperescalares con Cláusulas Contractuales Tipo).

---

## 5. RESTRICCIONES NORMATIVAS Y LEGALES
- **RGPD (Reglamento UE 2016/679):**
  - Base jurídica explícita: Interés público e investigación científica (Art. 6.1.e/f).
  - Tratamiento de datos de salud: Categoría especial (Art. 9.2.j), limitado a agregaciones epidemiológicas sin datos individualizados.
  - Análisis de Impacto relativo a la Protección de Datos (AIPD / PIA) previo a producción.
- **HDS (Hébergement de Données de Santé):** Obligatorio en caso de almacenar registros sanitarios primarios en Fase 2.
- **SecNumCloud (ANSSI):** Marco objetivo de soberanía para infraestructuras en nube gubernamentales.
- **Reglamento Europeo de IA (EU AI Act):** Clasificación del sistema bajo el marco de riesgo; auditoría de explicabilidad, no discriminación y supervisión humana del clasificador.
- **Directrices CNIL de Web Scraping:** Recolección en redes sociales limitada a APIs públicas oficiales y feeds RSS abiertos, respetando términos de servicio y excluyendo datos sensibles.
- *(Nota de gobernanza: Se elimina de forma definitiva cualquier referencia a HIPAA por ser norma estadounidense no aplicable).*

---

## 6. ALCANCE DEL PROYECTO (MATRIZ IN/OUT V1)

| Dentro del Alcance (V1) | Fuera del Alcance (Exclusiones V1) |
| :--- | :--- |
| Ingesta de sensores Airparif y Open Data oficial | Emisión de alertas sanitarias vinculantes o de emergencia médica |
| Ingesta de encuestas ciudadanas con filtro antispam | Identificación de ciudadanos o geolocalización de domicilios particulares |
| Clasificador ligero de sentimiento (<70ms) | Modelado fluidodinámico tridimensional (CFD) de micro-turbulencias |
| Capa GIS con rosa de vientos y contornos indicativos | Diagnóstico clínico individualizado de dolencias |
| Biblioteca de políticas comparadas (Issy, Fos, Créteil) | Acceso a historiales clínicos o expedientes médicos individuales |
| Asistente conversacional RAG fundamentado con citas | Publicación de publicaciones de redes sin agregación previa |

---

# PARTE II — ESPECIFICACIÓN FUNCIONAL Y TÉCNICA

## 7. ARQUITECTURA DE DATOS DUAL: FAST DATA vs. BIG DATA

```
┌──────────────────────────────────────────────────────────────────┐
│                       INGESTA DE DATOS                           │
└───────────────────────┬──────────────────────┬───────────────────┘
                        ▼                      ▼
          ┌───────────────────────┐  ┌───────────────────────┐
          │ FAST DATA (streaming) │  │ BIG DATA (histórico)  │
          │ Velocidad y respuesta │  │ Escala y profundidad  │
          └──────────┬────────────┘  └───────────┬───────────┘
                     ▼                           ▼
     • Publicaciones públicas (RSS,     • Dispersión atmosférica
       API oficiales)                   • Registros de salud
     • Encuestas en línea               • Bloques censales INSEE
     • Prensa local (RSS)               • Rasters DEM topográficos
     • Sensores Airparif
                     ▼                           ▼
     ┌───────────────────────────┐   ┌───────────────────────────┐
     │ Clasificador ligero       │   │ S3 / MinIO + Parquet      │
     │ (< 70 ms por decisión)    │   │ + PostGIS / DuckDB / Athena│
     └───────────────────────────┘   └───────────────────────────┘
```

### Componente 1: Fast Data Pipeline (Tiempo Real)
- **Frecuencia:** Ingesta continua por streaming / webhook; refresco de panel cada minuto o por evento.
- **Entidades:** Lecturas de sensores de monitoreo de contaminantes (Airparif), quejas ciudadanas directas, noticias locales vía RSS.
- **Motor de Micro-Decisión (<70ms):** 
  - Clasificación probabilística ultrarrápida.
  - Salida: Puntuación de sentimiento continuo `[-1.0, +1.0]`, categorización temática (`HEALTH`, `ODOR`, `NOISE`, `GOVERNANCE`, `TRAFFIC`, `PROPERTY_VALUE`), y bandera binaria de urgencia (`urgencyFlag`).

### Componente 2: Big Data Lakehouse (Histórico y Territorial)
- **Almacenamiento:** Objetos en Apache Parquet particionados por año/mes/día y codificación geoespacial (H3 / Geohash-7).
- **Herramientas de Consulta:** PostGIS para operaciones vectoriales inmediatas y DuckDB/Athena para analítica sobre grandes volúmenes históricos.
- **Conjuntos de Datos:** Microdatos censales INSEE por IRIS, topografía LiDAR / DEM IGN del Valle del Sena, series históricas de contaminantes (2015-2026).

---

## 8. CANALIZACIONES DE INGESTA Y PROCESAMIENTO
1. **Redes Sociales y Sentimiento:** Ingesta a través de endpoints autorizados, filtrado por lexemas («incinérateur Ivry», «polluants Vitry», «SYCTOM»). Seudonimización con sal criptográfica previa a la persistencia.
2. **Encuestas Ciudadanas y Bucle Generador-Evaluador:** Formularios validados por un evaluador heurístico que detecta patrones sintéticos o spam, asegurando que solo testimonios legítimos de los distritos 94200, 94400 y adyacentes sean computados.
3. **Fusión Espacial y Rosa de Vientos:** Superposición vectorial del centroide de la UVE (48.8235° N, 2.3920° E) con la rosa de vientos horaria (azimut y velocidad) para generar conos de influencia a sotavento (*downwind plume*), intersectados con los IRIS de Ivry y Vitry.

---

## 9. CAPA DE BI AGÉNTICO Y ANALÍTICA CONVERSACIONAL

```
User Query: "¿Cuál es la tendencia de quejas a < 1.5 km de la planta según vientos dominantes?"
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │ Orquestador BI Agéntico │
                       │ (Claude / Gemini Core)  │
                       └────────────┬────────────┘
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
       ┌──────────────────────────┐   ┌──────────────────────────┐
       │ SQL / PostGIS Tool       │   │ Vector RAG Knowledge Base│
       │ Consulta determinista    │   │ Informes de políticas,   │
       │ espacio-temporal         │   │ decretos, actas SYCTOM   │
       └─────────────┬────────────┘   └─────────────┬────────────┘
                     │                              │
                     └──────────────┬───────────────┘
                                    ▼
                 ┌─────────────────────────────────────┐
                 │ Síntesis Unificada con Citas Reales │
                 └─────────────────────────────────────┘
```

- **Capa Semántica Formal:** Diccionario centralizado de métricas de negocio para impedir que el LLM invente definiciones de riesgo o fórmulas de calidad del aire.
- **Tool Espacial Determinista:** Generación de sentencias SQL seguras validadas mediante AST (Abstract Syntax Tree), restringidas a lectura.
- **RAG Vectorial:** Indexación semántica de decretos prefectorales, dictámenes de la ARS y actas de comisiones de seguimiento de la UVE.

---

## 10. ARQUITECTURA DE LA PLATAFORMA WEB PÚBLICA (5 PESTAÑAS)

| Pestaña | Denominación | Contenido y Módulos |
| :---: | :--- | :--- |
| **1** | **Panel Ejecutivo y Señales en Tiempo Real** | Indicadores KPI macro, índice ATMO de calidad del aire del día, polaridad social agregada de las últimas 24h, avisos normativos vigentes y estado operativo del observatorio. |
| **2** | **Mapa Espacial Interactivo (Observatorio GIS)** | Visor Leaflet/Mapbox con capas: polígono de la UVE, rejilla demográfica INSEE IRIS, rosa de vientos en tiempo real, pluma indicativa de dispersión, estaciones Airparif y equipamientos sensibles (escuelas, guarderías, polideportivos). |
| **3** | **Centro de Sentimiento y Opinión Pública** | Gráficas de evolución temporal, desglose temático (Olor, Salud, Ruido, Gobernanza, Tráfico, Propiedad), resultados agregados de encuestas ciudadanas y mapas de calor de testimonios seudonimizados. |
| **4** | **Biblioteca de Políticas Comparadas (RAG)** | Repositorio documental con fichas comparativas de Issy-les-Moulineaux, Fos-sur-Mer y Créteil, normativas de emisiones y descarga de estudios científicos. |
| **5** | **Pregúntale al Observatorio (AI Assistant)** | Asistente conversacional gobernado por la capa semántica, con citas directas a las fuentes del observatorio y abstención explícita ante preguntas fuera del alcance. |

---

## 11. MATRIZ DE REQUISITOS FUNCIONALES (RF)

| ID | Requisito Funcional | Prioridad | Criterio de Verificación |
| :--- | :--- | :---: | :--- |
| **RF-01** | Ingesta de mediciones horarias de calidad del aire Airparif. | **Alta** | Ingesta de $NO_2$, $PM_{10}$, $PM_{2.5}$ con timestamp verificado. |
| **RF-02** | Clasificación de texto (sentimiento, tema, urgencia) en < 70 ms. | **Alta** | Latencia p95 < 70 ms en suite de tests de rendimiento. |
| **RF-03** | Seudonimización irreversible en la ingesta antes de persistencia. | **Alta** | Cero presencia de PII (nombres, IPs, emails) en almacenamiento. |
| **RF-04** | Escalamiento de alertas críticas a flujo Human-in-the-Loop (HITL). | **Alta** | Eventos con `urgencyFlag = true` bloqueados hasta aprobación humana. |
| **RF-05** | Renderizado del visor GIS con capas multicapa y rosa de vientos. | **Alta** | Cartografía interactiva con cono de viento y filtros de radio 0-3km. |
| **RF-06** | Consultas en lenguaje natural con citas verificables a fuentes. | **Media** | Toda respuesta del asistente incluye metadato de fuente y fecha. |
| **RF-07** | Recepción y validación antispam de encuestas ciudadanas. | **Media** | Filtro heurístico de consistencia de códigos postales (94200/94400). |
| **RF-08** | Consulta y descarga de fichas y literatura de políticas comparadas. | **Media** | Repositorio documental estructurado con metadatos de autor y año. |
| **RF-09** | Cartelería visible de aviso indicativo y prudencia epidemiológica. | **Alta** | Banner y etiquetas permanentes en mapas aclarando la ausencia de diagnóstico sanitario oficial. |
| **RF-10** | Trazabilidad y registro inmutable de decisiones probabilísticas. | **Media** | Log de auditoría con hash, score, modelo y nonce. |

---

## 12. REQUISITOS NO FUNCIONALES Y SEGURIDAD (RNF)
- **RNF-01 (Latencia):** Clasificación de micro-decisiones < 70 ms (p95).
- **RNF-02 (Disponibilidad):** Plataforma web accesible 99.5% en Fase 1 y 99.9% en Fase 2.
- **RNF-03 (Seguridad en Tránsito):** TLS 1.3 forzado en todos los endpoints públicos; mTLS en la ingesta de sensores industriales.
- **RNF-04 (Protección de Secretos):** Cero claves de API o credenciales en el código fuente frontend; comunicación vía webhooks seguros y variables de entorno aisladas.
- **RNF-05 (Cumplimiento Europeo):** RGPD, evaluación de impacto de algoritmos conforme al EU AI Act, y arquitectura preparada para HDS y SecNumCloud en Fase 2.

---

## 13. ESTRATEGIA DE DESPLIEGUE POR FASES Y SOBERANÍA

### Fase 1: Bootstrap & MVP (Bajo Coste, Verificación Rápida)
- **Hosting Web:** GitHub Pages / CDN estático.
- **Repositorio de Código:** GitHub.
- **Base de Datos Espacial:** Supabase (PostgreSQL 15 + PostGIS) en región UE (París o Fráncfort).
- **Orquestación:** n8n autoalojado en VPS ligero en Europa (Hetzner / OVHcloud).
- **Coste Operativo:** \$5 – \$15 USD / mes.

### Fase 2: Escala de Producción Soberana (Grado Gubernamental)
- **Hosting Web:** AWS CloudFront + S3 (región `eu-west-3` París) o alternativa europea soberana (**Scaleway / OVHcloud**).
- **Base de Datos y Data Lake:** Cluster PostGIS gestionado de alta disponibilidad acoplado a S3 Object Storage en formato Apache Parquet, indexado con Glue / Athena o DuckDB distribuido.
- **Motor de Inferencia:** Microservicio containerizado K8s con inferencia local ONNX Runtime / NPU, complementado con modelos frontera soberanos vía VPC aislada.

---

## 14. ARQUITECTURA DE DESPLIEGUE DE CINCO CAPAS (GRADO GUBERNAMENTAL)

```
┌───────────────────────────────────────────────────────────────────┐
│ 1. INGESTA Y FRONTERA: Kafka / Kinesis + API Gateway mTLS         │
├───────────────────────────────────────────────────────────────────┤
│ 2. DECISIÓN ULTRARRÁPIDA (SISTEMA 1): Contenedores ONNX / WASM    │
├───────────────────────────────────────────────────────────────────┤
│ 3. ORQUESTACIÓN Y RAZONAMIENTO (SISTEMA 2): n8n / LangChain + LLM │
├───────────────────────────────────────────────────────────────────┤
│ 4. DATOS Y GOBIERNO SEMÁNTICO: Lakehouse Parquet + PostGIS + RAG  │
├───────────────────────────────────────────────────────────────────┤
│ 5. AUDITORÍA, SEGURIDAD Y HITL: Supervisión humana + Log Inmutable│
└───────────────────────────────────────────────────────────────────┘
```

---

## 15. GESTIÓN DE RIESGOS Y MATRIZ DE MITIGACIÓN

| Riesgo Detectado | Nivel | Estrategia de Mitigación Obligatoria |
| :--- | :---: | :--- |
| **Incumplimiento de términos o RGPD en recolección web** | Alto | Uso exclusivo de APIs oficiales y fuentes públicas, base jurídica Art. 6 RGPD y realización previa de AIPD. |
| **Interpretación sanitaria errónea de los mapas** | Crítico | Señalética permanente de aviso indicativo; validación periódica con epidemiólogos; prohibición de diagnósticos clínicos. |
| **Sesgo muestral en redes sociales (falta de representatividad)** | Medio | Ponderación conjunta con encuestas ciudadanas presenciales/web y declaración formal de limitaciones estadísticas. |
| **Dependencia tecnológica de proveedores extra-comunitarios** | Medio | Despliegue en regiones de la UE, cláusulas contractuales tipo y plan de contingencia hacia proveedores europeos (OVH/Scaleway). |
| **Alucinaciones o distorsión en el asistente conversacional** | Alto | Anclaje en Capa Semántica estricta, prompts de no-invención, citas textuales obligatorias a documentos del observatorio. |

---

## 16. GLOSARIO DE TÉRMINOS TÉCNICOS
- **UVE (Unité de Valorisation Énergétique):** Planta industrial de incineración de residuos sólidos urbanos con recuperación de energía eléctrica y térmica para redes de calefacción urbana.
- **SYCTOM (Syndicat métropolitain d'incinération des ordures ménagères):** Sindicato público metropolitano responsable del tratamiento y valorización de los residuos de París y 81 comunas de Île-de-France.
- **IRIS (Ilôts Regroupés pour l'Information Statistique):** Unidad territorial básica del censo demográfico francés definida por el INSEE (habitualmente entre 1.800 y 5.000 residentes).
- **HITL (Human-in-the-Loop):** Protocolo de supervisión y arbitraje humano interpuesto previo a la confirmación de salidas algorítmicas sensibles o de alto impacto.
- **RAG (Retrieval-Augmented Generation):** Técnica de inteligencia artificial que combina modelos lingüísticos con recuperación determinista de documentos indexados en una base de datos vectorial.
- **Jev / Laya:** Módulo de decisión ultrarrápida (Sistema 1). Compuesto por **Jev** (enrutador probabilístico de micro-latencia basado en embeddings compactos) y **Laya** (clasificador supervisado destilado en formato ONNX/WASM para categorización de sentimiento y detección de urgencias en textos en francés sobre calidad ambiental).
- **MAUP (Modifiable Areal Unit Problem):** Sesgo estadístico en análisis geoespacial donde los resultados varían según la escala y agregación de las unidades zonales (mitigado mediante análisis multiescalar IRIS y cuadrículas regulares).
