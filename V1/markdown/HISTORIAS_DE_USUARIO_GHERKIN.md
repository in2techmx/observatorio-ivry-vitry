# HISTORIAS DE USUARIO CON CRITERIOS GHERKIN — PRJ-OBS-IVRY-VITRY-V1

**Autoridad Técnica:** Director de Desarrollo (DD) — IN2TECHMX  
**Versión:** `0.9.0` (SemVer)  
**Marco de Aceptación:** BDD / Gherkin Determinista  

---

### US-01: Ingesta y Clasificación de Sentimiento en Micro-Decisiones (RF-02, RF-03)
**Como** Analista del Observatorio Urbano,  
**Quiero** procesar eventos de texto en francés mediante el modelo «Laya» en menos de 70 ms,  
**Para** clasificar polaridad, temática y urgencia con trazabilidad inmutable y sin almacenar datos sensibles (RGPD).

- **Criterio de Aceptación 1 (Rendimiento < 70 ms y Esquema de Decisión):**
  - **GIVEN** un texto de entrada en francés ("Fortes odeurs de brûlé près du quai d'Ivry ce soir, enfants incommodés").
  - **WHEN** el clasificador «Laya» procesa el payload.
  - **THEN** la inferencia se completa en menos de 70 ms en el 95% de los casos (p95), el puntaje continuo se ubica entre -1.00 y +1.00, la categoría asignada es `ODOR` o `HEALTH`, y el registro incluye un HMAC de auditoría inmutable.

- **Criterio de Aceptación 2 (Seudonimización Rigurosa en la Ingesta):**
  - **GIVEN** un evento que contiene nombre de autor, identificador de usuario o dirección IP.
  - **WHEN** entra en la canalización de ingesta.
  - **THEN** los identificadores directos se sustituyen por un hash seudónimo irreversible con sal criptográfica diaria, y las coordenadas se redondean al centroide del bloque IRIS censal.

---

### US-02: Escalamiento Human-in-the-Loop (HITL) para Alertas Críticas (RF-04)
**Como** Responsable de Supervisión y Ética del Observatorio,  
**Quiero** que cualquier reporte clasificado con urgencia crítica quede retenido en cola de revisión,  
**Para** evitar la divulgación de falsas alarmas de emisiones o emergencias sin verificación humana previa.

- **Criterio de Aceptación 1 (Retención de Urgencia Crítica):**
  - **GIVEN** un texto clasificado con `urgencyFlag = true`.
  - **WHEN** el evento ingresa al pipeline de publicación pública.
  - **THEN** el sistema retiene el estado en `PENDING_HUMAN_REVIEW` y no se muestra en el panel ejecutivo público ni en las alertas web hasta la firma de un revisor autorizado.

---

### US-03: Mapeo GIS Multicapa con Rosa de Vientos y Prudencia Científica (RF-05, RF-09)
**Como** Investigador en Epidemiología Ambiental o Ciudadano de Ivry/Vitry,  
**Quiero** visualizar en el mapa espacial interactivo el cono teórico de dispersión del penacho junto con la población y escuelas expuestas,  
**Para** comprender la distribución espacial indicativa manteniendo visible el descargo de responsabilidad metodológica.

- **Criterio de Aceptación 1 (Proyección Geométrica de Cono de Viento):**
  - **GIVEN** datos de Météo-France con viento a 220° (Suroeste) a 18 km/h.
  - **WHEN** se activa la capa de dispersión en el visor GIS.
  - **THEN** se dibuja un cono geométrico orientado a 40° (Noreste) a sotavento de la chimenea de la UVE, coloreando los bloques IRIS y contabilizando los centros escolares dentro del cono.

- **Criterio de Aceptación 2 (Aviso Indicativo Obligatorio en Interfaz):**
  - **GIVEN** cualquier visualización del mapa espacial o gráfica de dispersión.
  - **WHEN** el usuario interactúa con la capa de contaminantes.
  - **THEN** la interfaz muestra permanentemente un aviso explícito: *"Modelo indicativo de dispersión atmosférica. No constituye un diagnóstico de salud pública oficial ni evaluación causal."*

---

### US-04: Ingesta de Encuestas y Filtrado Antispam Ciudadano (RF-07)
**Como** Gestor de Participación Ciudadana,  
**Quiero** recibir cuestionarios vecinales mediante webhook con filtrado generador-evaluador,  
**Para** procesar testimonios comunitarios auténticos de Ivry (94200) y Vitry (94400) descartando envíos automatizados o maliciosos.

- **Criterio de Aceptación 1 (Filtro Antispam y Coherencia Territorial):**
  - **GIVEN** una encuesta enviada desde el formulario público.
  - **WHEN** el código postal ingresado es 94200 o 94400 y el contenido responde a preguntas sobre molestias de olor y ruido con coherencia sintáctica.
  - **THEN** el evaluador le asigna estado `VALIDATED`, la agrega a las métricas de la Pestaña 3 y almacena el resultado sin vincular datos nominativos.

---

### US-05: Asistente Conversacional RAG con Citas Obligatorias (RF-06, RF-10)
**Como** Decisor Político o Investigador,  
**Quiero** realizar preguntas en lenguaje natural sobre las actas del SYCTOM o niveles de contaminantes,  
**Para** recibir síntesis fundamentadas con citas verificables (autor, año, sección) evitando cualquier tipo de alucinación.

- **Criterio de Aceptación 1 (Cita Textual Verificable):**
  - **GIVEN** la pregunta: "¿Qué acuerdos de modernización y reducción de capacidad se adoptaron para la planta de Ivry?".
  - **WHEN** el asistente conversacional procesa la consulta.
  - **THEN** la respuesta cita textualmente el acuerdo de la comisión de seguimiento del SYCTOM con fecha y enlace al documento oficial, o se abstiene explícitamente si la información no consta en el corpus verificado.

---

### US-06: Seguimiento Multicanal de Noticias y Publicaciones (Gubernamentales, Públicas, Independientes, Académicas, Internacionales)
**Como** Investigador, Periodista o Ciudadano de Ivry/Vitry,  
**Quiero** acceder a una sección interactiva de seguimiento estructurado de noticias y expedientes clasificados en 5 canales,  
**Para** contrastar las decisiones oficiales del Estado con la cobertura de prensa, las investigaciones independientes de colectivos vecinales, la evidencia científica epidemiológica y la jurisprudencia europea.

- **Criterio de Aceptación 1 (Filtrado Dinámico por Canal y Búsqueda por Texto):**
  - **GIVEN** la Pestaña 6 "Veille & Actualités Multicanales" abierta en el navegador.
  - **WHEN** el usuario selecciona cualquiera de las píldoras de filtro (Gouvernemental, Médias FR, Indépendant, Académique, International) o introduce un término en el buscador (ej. "dioxine" o "recours").
  - **THEN** el tablero filtra y renderiza de forma reactiva en menos de 100 ms las tarjetas correspondientes, mostrando para cada una el medio emisor, la fecha, el resumen fáctico, las etiquetas temáticas y el sello de verificación de fuente.

