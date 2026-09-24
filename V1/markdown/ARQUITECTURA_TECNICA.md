# ARQUITECTURA TÉCNICA Y DE DESPLIEGUE — PRJ-OBS-IVRY-VITRY-V1

**Autoridad Técnica:** Director de Desarrollo (DD) — IN2TECHMX  
**Marco:** Fast Data Streaming + Big Data Lakehouse + Agentic BI  

---

## 1. VISTA GENERAL DE LA ARQUITECTURA

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                               CAPA 1: INGESTA Y FRONTERA (EDGE)                           │
│  • Apache Kafka / AWS Kinesis (Fast Data) • Ingesta de Sensores Airparif • API Gateway    │
└─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                              │
                                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           CAPA 2: MOTOR DE MICRO-DECISIONES                               │
│  • Clasificador Jev / Laya (<70ms) • Inferencia ONNX Runtime / WASM • Sanitización PII    │
└──────────────────────┬──────────────────────────────────────────────┬─────────────────────┘
                       │                                              │
                       ▼                                              ▼
┌───────────────────────────────────────────┐  ┌────────────────────────────────────────────┐
│      FAST DATA STORE (PostgreSQL/PostGIS) │  │    BIG DATA LAKE (Parquet + MinIO / S3)    │
│  • Lecturas en tiempo real                │  │  • Históricos decenales Airparif           │
│  • Sentimiento clasificado reciente       │  │  • Capas INSEE IRIS demográficas           │
│  • Encuestas validadas                    │  │  • Modelos Digitales de Terreno (DEM)      │
└──────────────────────┬────────────────────┘  └──────────────────────┬─────────────────────┘
                       │                                              │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                         CAPA 3: RAZONAMIENTO PROFUNDO & AGENTIC BI                        │
│  • Capa Semántica Formal (Gobernanza)  • SQL/PostGIS Generator  • Vector RAG Knowledge    │
└─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                              │
                                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                        CAPA 4 & 5: PRESENTACIÓN WEB & GOBERNANZA HITL                     │
│  • Tablero Web (5 Pestañas: Ejecutivo, GIS, Sentimiento, RAG, Chatbot)                    │
│  • Módulo Human-in-the-Loop (HITL) para alertas críticas de emisiones                     │
│  • Logging inmutable de auditoría (Score, Decision, Trace)                                │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ESTRATEGIA DE TRANSICIÓN FASE 1 (MVP) A FASE 2 (EMPRESARIAL)

| Componente | Fase 1 (Bootstrap & MVP) | Fase 2 (Escala Empresarial / Gobierno) |
| :--- | :--- | :--- |
| **Alojamiento Frontend** | GitHub Pages / Servidor estático ligero | AWS CloudFront + S3 + WAF |
| **Base de Datos Espacial** | Supabase (PostgreSQL 15 + PostGIS) | AWS RDS Aurora PostgreSQL multi-AZ |
| **Data Lake Histórico** | SQLite espacial / DuckDB Parquet local | AWS S3 Parquet + AWS Glue Catalog + Athena |
| **Orquestación ETL** | n8n en VPS ligero / Pipelines Node.js | Apache Airflow / AWS Step Functions |
| **Motor de Micro-Decisión** | Worker Node.js / Python Fast Decision | Microservicio K8s containerizado con ONNX / NPU |
| **Motor Agentic BI** | Capa semántica con API Gemini / Claude | AWS Bedrock / VPC con Ollama / vLLM soberano |
| **Coste Operativo Estimado** | ~\$5 - \$15 / mes | ~\$150 - \$600 / mes (según volumen de queries) |

---

## 3. SEGURIDAD Y PRIVACIDAD CIUDADANA (GDPR & SOC2)
1. **Anonimización Cero-Rastreo:**
   - Todo aporte ciudadano o comentario de redes sociales sufre un proceso de *hashing unidireccional con sal criptográfica diaria* para el identificador de usuario.
   - Las coordenadas geográficas nunca se persisten con una precisión mayor a un radio de 250 metros (centroide del bloque IRIS).
2. **Auditoría HITL (Human-in-the-Loop):**
   - Si el clasificador asigna `urgencyFlag = true` con una confianza inferior a 0.85, el evento entra en una cola de revisión previa antes de generar alertas visuales públicas o notificaciones institucionales.
