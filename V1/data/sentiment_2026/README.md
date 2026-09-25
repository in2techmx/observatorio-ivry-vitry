# Base de Données Git-as-a-Database : Sentiment Citoyen 2026
**Projet :** PRJ-OBS-IVRY-VITRY-V1 (Observatoire de Gouvernance Environnementale Ivry / Vitry)  
**Autorité Technique :** Director de Desarrollo (DD) — IN2TECHMX  
**Couverture Temporelle :** Janvier 2026 à Septembre 2026 (80 publications consolidées)  
**Moteur d'Inférence :** Laya Engine v1.0.0-fr (< 70ms, HMAC-SHA256 avec nonce persisté)  
**Répartition des Sources :** 53 Mastodon / Fediverse &bull; 18 Bluesky &bull; 9 Débats Citoyens / CSS  

---

## 📁 Architecture des Données et Partitions

Cette base de données applique strictement le standard **Git-as-a-Database** avec partitionnement modulaire par réseau social et consolidé unifié :

```text
V1/data/sentiment_2026/
├── README.md                      # 📖 Ce document d'architecture et spécification des schémas
├── summary_annual_2026.json       # 📊 Index annuel léger pour la trajectoire temporelle (80 posts)
│
├── mastodon/                      # 🐘 Partition Fediverse / Mastodon (53 posts réels récupérés)
│   ├── summary.json               # Métriques globales du réseau
│   └── 2026-01.json ... 2026-09.json
│
├── bluesky/                       # 🦋 Partition Bluesky (18 posts)
│   ├── summary.json
│   └── 2026-01.json ... 2026-09.json
│
├── debats_citoyens/               # 🏛️ Partition Débats Citoyens (9 posts)
│   ├── summary.json
│   └── 2026-01.json ... 2026-09.json
│
└── consolidated/                  # 🌐 Partition Consolidée Multi-Réseaux pour le Dashboard (80 posts)
    └── 2026-01.json ... 2026-09.json
```

---

## 📋 Spécification du Schéma JSON (PostDTO v1.0.0)

Chaque publication stockée dans les fichiers mensuels respecte le contrat d'interface strict :

| Champ | Type | Obligatoire | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | Oui | Identifiant unique déterministe (ex. `masto_harv_202605_01`) |
| `monthKey` | String | Oui | Format AAAA-MM (ex. `2026-06`) |
| `network` | String | Oui | `mastodon`, `bluesky` ou `debats_citoyens` |
| `date` | String (ISO 8601) | Oui | Horodatage de publication |
| `author` | String | Oui | Nom d'affichage ou organisation |
| `handle` | String | Oui | Identifiant de profil social (ex. `@collectif3r@piaille.fr`) |
| `url` | String | Oui | Lien permanent vérifiable vers la source |
| `content` | String | Oui | Texte intégral de la publication en français |
| `plainText` | String | Oui | Texte nettoyé sans balises HTML |
| `laya.sentimentScore` | Number | Oui | Score de polarité entre -1.000 (Très négatif) et +1.000 (Très positif) |
| `laya.sentimentLabel` | String | Oui | `POSITIVE`, `NEUTRAL`, `NEGATIVE`, `STRONGLY_NEGATIVE` ou `STRONGLY_POSITIVE` |
| `laya.primaryCategory` | String | Oui | `ODOR`, `HEALTH`, `NOISE`, `GOVERNANCE`, `TRAFFIC`, `PROPERTY_VALUE` ou `UNCLASSIFIED` |
| `laya.urgencyFlag` | Boolean | Oui | `true` en cas d'alerte critique / détresse respiratoire |
| `laya.processingTimeMs` | Integer | Oui | Latence d'inférence (toujours < 70 ms) |
| `laya.nonce` | String | Oui | Sel cryptographique aléatoire persisté pour re-vérification |
| `laya.auditSignature` | String | Oui | Empreinte cryptographique HMAC-SHA256 scellant le diagnostic |

---

## 🔒 Conformité RGPD et Auditabilité
1. **Pas de Données Personnelles Sensibles (PII) :** Seuls les comptes publics associatifs, institutionnels ou pseudonymisés sont enregistrés.
2. **Céro Cajas Negras :** Tous les calculs de polarité et signatures sont vérifiables par les suites de tests automatisés (Gate 1) et par `verifyAuditSignature(record)` (Gate 3).
