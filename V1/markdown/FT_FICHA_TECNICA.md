# FICHA TÉCNICA (FT) DE ARQUITECTURA Y ESPECIFICACIONES
## Observatorio de Gobernanza Ambiental Urbana y Percepción Pública: Ivry-sur-Seine / Vitry-sur-Seine (Val-de-Marne)

| Atributo | Especificación Técnica |
| :--- | :--- |
| **Identificador del Proyecto** | `PRJ-OBS-IVRY-VITRY-V1` |
| **Versión** | `0.9.0` |
| **Sistema de Coordenadas de Referencia (CRS)** | **EPSG:4326** (WGS84 para GeoJSON y Web GIS) / **EPSG:2154** (RGF93 / Lambert-93 para métricas espaciales oficiales en Francia) |
| **Punto Focal de Emisión / Observatorio** | Latitud: `48° 47' 30" N` (`48.79167° N`), Longitud: `2° 25' 0" E` (`2.41667° E`) &bull; Sector Les Ardoines / Seine, Vitry-sur-Seine (94400, Val-de-Marne). Altura de chimenea: `100 m`. |
| **Radio de Influencia Prioritario** | Corona de 0 a 1.5 km (Impacto Inmediato) y 1.5 a 3.0 km (Zona de Dispersión Extendida en Vitry/Ivry). |

---

## 1. CATÁLOGO DE FUENTES DE DATOS PRIMARIAS

| Fuente Primaria | Proveedor Oficial | Protocolo / Formato | Frecuencia de Actualización | Base Jurídica / Licencia |
| :--- | :--- | :--- | :--- | :--- |
| **Calidad del Aire** ($NO_2, PM_{10}, PM_{2.5}$) | Airparif (Association Agréée de Surveillance de la Qualité de l'Air) | REST API JSON / CSV | Horaria | Open Data / Licence Ouverte v2.0 |
| **Meteorología y Vientos** (Velocidad, Azimut) | Météo-France (Estaciones París-Montsouris y Orly) | API Synop / GeoJSON | Horaria | Open Data Météo-France |
| **Demografía y Población Vulnerable** | INSEE (Recensement de la Population par IRIS) | Shapefile / GeoPackage / Parquet | Anual | Licence Ouverte (Etalab) |
| **Equipamientos Sensibles** (Escuelas, Guarderías) | Ministère de l'Éducation Nationale (DEPP) / Ville d'Ivry / Ville de Vitry | GeoJSON / CSV | Semestral | Open Data Gouv.fr |
| **Informes y Datos de Emisiones UVE** | SYCTOM / DREAL Île-de-France | PDF / Open Data SYCTOM | Semestral / Anual | Consulta pública legal |
| **Percepción y Testimonios Ciudadanos** | Plataforma Web del Observatorio (Formulario Webhook) | HTTPS / JSON seudonimizado | En tiempo real | RGPD Art. 6.1.e (Misión pública) |

---

## 2. ESPECIFICACIÓN DEL MOTOR DE MICRO-DECISIÓN «JEV / LAYA»

El módulo **Jev / Laya** constituye el motor de decisión ultrarrápida (Sistema 1) del observatorio:
- **Jev (Router Probabilístico):** Módulo de enrutamiento basado en embeddings densos de baja dimensión (MiniLM-L6 o similar cuantizado en INT8). Determina en <15 ms si el texto entrante está vinculado a cuestiones de la UVE, medio ambiente urbano o si es spam/ruido irrelevante.
- **Laya (Clasificador Ligero Distilado):** Clasificador multietiqueta empaquetado en formato **ONNX Runtime (ejecución en CPU local o WASM)**.
  - **Latencia Objetivo:** Media 28 ms, Percentil 95 (p95) < 70 ms.
  - **Consumo de Memoria:** < 180 MB en ejecución.
  - **Salidas Cuantitativas:**
    1. `sentiment_score`: Flotante continuo entre `-1.00` y `+1.00`.
    2. `thematic_category`: Un valor de `[ODOR, HEALTH, NOISE, GOVERNANCE, TRAFFIC, PROPERTY_VALUE]`.
    3. `urgency_flag`: Booleano determinista (`true` si detecta picos de humo anómalo, alarma por combustión o síntomas respiratorios agudos masivos).
    4. `confidence`: Flotante entre `0.00` y `1.00`.

---

## 3. ARQUITECTURA CRIPTOGRÁFICA Y DE AUDITORÍA (AUDIT TRAIL)

Para garantizar la inmutabilidad de cada inferencia y asegurar que no existan decisiones opacas ni manipulaciones posteriores:
- Cada inferencia genera un registro de auditoría estructurado:
  $$\text{AuditSignature} = \text{HMAC-SHA256}(\text{TextHash} \parallel \text{Timestamp} \parallel \text{ModelVersion} \parallel \text{Score} \parallel \text{Nonce}, \text{SecretKey})$$
- Estructura de almacenamiento:
  - `event_hash`: Hash SHA-256 del texto previa seudonimización.
  - `model_signature`: Cadena que identifica versión del modelo (ej. `laya-onnx-v0.9.1-fr`).
  - `timestamp_iso`: Marca de tiempo UTC estricta.
  - `verdict`: JSON serializado con score, categorías y urgencia.
  - `audit_hmac`: Firma criptográfica que previene la alteración retrospectiva del registro.

---

## 4. ESPECIFICACIONES DE CAPAS GIS E INTEROPERABILIDAD (INSPIRE)

Siguiendo las directrices de la Directiva Europea **INSPIRE (2007/2/EC)** para infraestructuras de información espacial:
- **Capa 1 (Instalación Industrial):** Polígono georreferenciado de la parcela UVE Ivry-Paris XIII y vector puntual de la chimenea.
- **Capa 2 (Penacho de Dispersión Indicativo):** Geometría de polígono radial proyectado a partir de la velocidad ($v$ en km/h) y dirección ($\theta$ en grados) del viento:
  $$\text{Ángulo Central} = (\theta + 180^\circ) \pmod{360^\circ}$$
  $$\text{Apertura Angular del Cono} = \max(20^\circ, 60^\circ - 1.5 \times v)$$
  $$\text{Longitud del Cono} = \min(3.5 \text{ km}, 0.8 + 0.15 \times v)$$
- **Capa 3 (Mallas Demográficas INSEE IRIS):** Polígonos de celdas con métricas de población infantil ($\le 5$ años), personas mayores ($\ge 65$ años) y densidad poblacional por hectárea.
- **Capa 4 (Estaciones de Monitoreo Airparif):** Sensores de monitoreo con estado de semáforo ATMO en tiempo real.
- **Capa 5 (Puntos de Interés Críticos):** Escuelas primarias, maternales y colegios en Ivry y Vitry con cálculo automático de distancia geodésica a la UVE.

---

## 5. MATRIZ DE REQUISITOS DE RENDIMIENTO Y SERVICE LEVEL AGREEMENT (SLA)

| Parámetro | Fase 1 (MVP) | Fase 2 (Producción Soberana) |
| :--- | :--- | :--- |
| **Tiempo de carga inicial del Portal Web** | < 1.8 segundos | < 0.9 segundos (vía Edge CDN en París) |
| **Latencia de respuesta del Clasificador** | p95 < 70 ms | p95 < 45 ms |
| **Latencia de consultas espaciales GIS** | < 350 ms | < 120 ms (PostGIS indexado con R-Tree GiST) |
| **Latencia de respuesta del Asistente RAG** | < 3.5 segundos | < 2.0 segundos |
| **Frecuencia de sincronización Airparif** | 60 minutos | 15 minutos |
| **RPO (Recovery Point Objective)** | 24 horas | < 1 hora |
| **RTO (Recovery Time Objective)** | 4 horas | < 15 minutos |
