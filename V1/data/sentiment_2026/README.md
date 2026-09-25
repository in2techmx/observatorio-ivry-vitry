# Base de Données Git-as-a-Database : Sentiment Citoyen 2026
**Projet :** PRJ-OBS-IVRY-VITRY-V1 (Observatoire de Gouvernance Environnementale Ivry / Vitry)  
**Autorité Technique :** Director de Desarrollo (DD) — IN2TECHMX  
**Couverture Temporelle :** Janvier 2026 à Septembre 2026  
**Moteur d'Inférence :** Laya Engine v0.9.0-fr (< 70ms, HMAC-SHA256)

---

## 📁 Architecture des Données et Partitions

Cette base de données applique strictement le standard **Git-as-a-Database** avec partitionnement modulaire par réseau social et consolidé unifié :

```text
V1/data/sentiment_2026/
├── README.md                      # 📖 Ce document d'architecture et spécification des schémas
├── summary_annual_2026.json       # 📊 Index annuel léger pour la trajectoire temporelle
│
├── mastodon/                      # 🐘 Partition Fediverse / Mastodon (Piaille.fr / Mastodon.social)
│   ├── summary.json               # Métriques globales du réseau
│   └── 2026-01.json ... 2026-09.json
│
├── bluesky/                       # 🦋 Partition Bluesky (AT Protocol)
│   ├── summary.json
│   └── 2026-01.json ... 2026-09.json
│
├── debats_citoyens/               # 🏛️ Partition Débats Citoyens (Registres municipaux et CSS)
│   ├── summary.json
│   └── 2026-01.json ... 2026-09.json
│
└── consolidated/                  # 🌐 Partition Consolidée Multi-Réseaux pour le Dashboard
    └── 2026-01.json ... 2026-09.json
```

---

## 📋 Spécification du Schéma JSON (PostDTO)

Chaque publication stockée dans les fichiers mensuels respecte le contrat d'interface strict :

| Champ | Type | Obligatoire | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | Oui | Identifiant unique déterministe (ex. `post_2026_mastodon_001`) |
| `monthKey` | String | Oui | Format AAAA-MM (ex. `2026-06`) |
| `network` | String | Oui | `mastodon`, `bluesky` ou `debats_citoyens` |
| `date` | String (ISO 8601) | Oui | Horodatage de publication |
| `author` | String | Oui | Nom d'affichage ou organisation |
| `handle` | String | Oui | Identifiant de profil social (ex. `@collectif3r@piaille.fr`) |
| `url` | String | Oui | Lien permanent vérifiable vers la source |
| `content` | String | Oui | Texte intégral de la publication en français |
| `laya.sentimentScore` | Number | Oui | Score de polarité entre -1.000 (Très négatif) et +1.000 (Très positif) |
| `laya.sentimentLabel` | String | Oui | `POSITIVE`, `NEUTRAL` ou `NEGATIVE` |
| `laya.primaryCategory` | String | Oui | `ODOR`, `HEALTH`, `NOISE`, `GOVERNANCE`, `TRAFFIC`, `PROPERTY_VALUE` |
| `laya.urgencyFlag` | Boolean | Oui | `true` en cas d'alerte critique / détresse respiratoire |
| `laya.processingTimeMs` | Integer | Oui | Latence d'inférence (toujours < 70 ms) |
| `laya.auditSignature` | String | Oui | Empreinte cryptographique HMAC-SHA256 scellant le diagnostic |

---

## 🔒 Conformité RGPD et Auditabilité
1. **Pas de Données Personnelles Sensibles (PII) :** Seuls les comptes publics associatifs, institutionnels ou pseudonymisés sont enregistrés.
2. **Céro Cajas Negras :** Tous les calculs de polarité et signatures sont vérifiables par les suites de tests automatisés (Gate 1).
