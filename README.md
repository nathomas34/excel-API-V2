# AI Spreadsheet Processor

Une application web moderne pour traiter des données tabulaires avec plusieurs modèles d'IA (Gemini Pro, ChatGPT, Mistral).

## 🌟 Fonctionnalités

### Traitement IA
- Support de multiples modèles d'IA :
  - Google Gemini Pro
  - OpenAI ChatGPT (GPT-3.5 Turbo et GPT-4)
  - Mistral AI (Tiny, Small, Medium)
- Traitement par colonne avec des prompts personnalisés
- Formats de réponse configurables :
  - Texte
  - JSON
  - HTML
  - CSV
- Structure de réponse personnalisable :
  - Titre
  - Description
  - Mots-clés
  - Catégories
  - Résumé
  - Analyse
  - Champs personnalisés

### Import/Export de Données
- Import de fichiers :
  - CSV
  - Excel/OpenOffice
  - Word
  - PDF
- Import depuis des API REST :
  - Configuration des endpoints
  - Mapping des champs
  - Stockage local des configurations
- Export vers différents formats :
  - CSV
  - Excel
  - API (JSON/CSV)
- Export API configurable :
  - Méthode (POST/PUT)
  - En-têtes personnalisés
  - Format des données (JSON/CSV)
  - Clé d'enveloppe des données

### Interface Utilisateur
- Interface de tableur interactive
- Thème clair/sombre
- Support multilingue (FR/EN)
- Gestion des limites de taux d'API
- Interface responsive

## 🚀 Démarrage Rapide

### Utilisation avec Docker

```bash
# Construire l'image
docker build -t ai-spreadsheet-processor .

# Lancer le conteneur
docker run -p 3000:3000 ai-spreadsheet-processor
```

L'application sera disponible sur `http://localhost:3000`

### Développement Local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser la version de production
npm run preview
```

## 🔑 Configuration

### Configuration des Modèles IA

1. Obtenir les clés API nécessaires :
   - Google Gemini : [Google AI Studio](https://makersuite.google.com/app/apikey)
   - OpenAI : [OpenAI Platform](https://platform.openai.com/api-keys)
   - Mistral AI : [Mistral Console](https://console.mistral.ai/api-keys/)

2. Configurer l'application :
   - Ouvrez les paramètres (icône ⚙️)
   - Sélectionnez votre fournisseur d'IA préféré
   - Collez la clé API correspondante
   - Ajustez les autres paramètres selon vos besoins

### Configuration des API

#### Import API
1. Cliquez sur le bouton "API" dans la barre d'outils
2. Configurez :
   - URL de l'API
   - Méthode (GET, POST, PUT, DELETE)
   - En-têtes personnalisés
   - Corps de la requête (pour POST/PUT)
   - Chemin des données dans la réponse
   - Mapping des champs

#### Export API
1. Cliquez sur "API" puis "Export API"
2. Configurez :
   - URL d'export
   - Méthode (POST/PUT)
   - En-têtes personnalisés
   - Format des données (JSON/CSV)
   - Clé d'enveloppe des données (optionnel)

## 📝 Guide d'Utilisation

### Structure des Données
- Chaque colonne peut avoir un prompt IA personnalisé
- Les données sont traitées ligne par ligne
- Les résultats sont générés dans la même colonne

### Import de Données
- **Fichiers** : Utilisez le bouton 📤 pour importer :
  - Fichiers CSV
  - Fichiers Excel/OpenOffice (.xlsx, .xls, .ods)
  - Documents Word (.docx, .doc)
  - Fichiers PDF
- **API** : Utilisez le bouton "API" pour :
  - Configurer l'URL de l'API
  - Définir les en-têtes et paramètres
  - Mapper les champs de réponse

### Export de Données
- **Fichiers** : Exportez vos données avec le bouton 📥 en :
  - CSV
  - Excel
- **API** : Utilisez le bouton "Export API" pour :
  - Export rapide vers l'API configurée
  - Configuration des paramètres d'export
  - Choix du format (JSON/CSV)

### Prompts IA
1. Cliquez sur l'en-tête d'une colonne
2. Entrez votre prompt dans le champ "Enter prompt..."
3. Utilisez le bouton ▶️ pour traiter la colonne

### Paramètres de l'IA
- **Température** : Contrôle la créativité (0-2)
- **Tokens Max** : Limite la longueur des réponses
- **Format de Réponse** : Texte, JSON, HTML, CSV
- **Structure** : Personnalisez les champs de réponse

### Limites de Taux
- Configuration par minute dans les paramètres
- File d'attente automatique si la limite est atteinte
- Reprise automatique après la période de limitation

## ⚙️ Configuration Avancée

### Paramètres du Modèle
- **Température** : Contrôle la créativité (0-2)
- **Tokens Max** : Limite la longueur des réponses
- **Délai de Traitement** : Pause entre les requêtes

### Sécurité
- Stockage local des clés API
- Filtrage du contenu inapproprié
- Politiques de sécurité intégrées

## 🛠️ Architecture Technique

### Frontend
- React 18 avec TypeScript
- Zustand pour la gestion d'état
- Tailwind CSS pour le style
- Lucide React pour les icônes

### Intégrations IA
- Google Gemini Pro via API REST
- OpenAI ChatGPT via SDK officiel
- Mistral AI via SDK officiel

### Traitement de Fichiers
- XLSX pour Excel/OpenOffice
- Mammoth pour Word
- PDF.js pour PDF
- Papa Parse pour CSV

### Conteneurisation
- Image de base Node.js
- Build en plusieurs étapes
- Configuration optimisée pour la production

### Performance
- Build optimisé Vite
- Gestion efficace des états
- Mise en cache des traductions

## 📦 Structure du Projet

```
.
├── src/
│   ├── components/     # Composants React
│   ├── hooks/         # Hooks personnalisés
│   ├── i18n/          # Traductions
│   ├── store/         # Gestion d'état Zustand
│   ├── types/         # Types TypeScript
│   └── utils/         # Utilitaires
├── public/            # Assets statiques
├── Dockerfile         # Configuration Docker
└── docker-compose.yml # Configuration Docker Compose
```

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.