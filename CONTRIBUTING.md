# Guide de Contribution

## Prérequis

- Node.js 18+
- npm 8+

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/ai-spreadsheet-processor.git
cd ai-spreadsheet-processor
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez l'application en mode développement :
```bash
npm run dev
```

## Tests

L'application utilise Vitest pour les tests. Pour exécuter les tests :

```bash
# Exécuter les tests
npm test

# Exécuter les tests avec couverture
npm run test:coverage

# Exécuter les tests avec l'interface utilisateur
npm run test:ui
```

## Structure des Tests

Les tests sont organisés par composant/module dans le dossier `src/__tests__/` :

- `App.test.tsx` : Tests du composant principal
- `Grid.test.tsx` : Tests de la grille de données et des fonctionnalités de suppression
- `ApiConfigModal.test.tsx` : Tests de la configuration API
- `Settings.test.tsx` : Tests des paramètres
- `store.test.ts` : Tests du store Zustand
- `fileProcessors.test.ts` : Tests des processeurs de fichiers
- `apiProcessor.test.ts` : Tests du processeur API
- `FilterModal.test.tsx` : Tests des filtres intelligents

## Conventions de Code

1. **TypeScript** : Utilisez TypeScript pour tout nouveau code
2. **Tests** : Chaque nouvelle fonctionnalité doit être accompagnée de tests
3. **Composants** : Suivez une approche fonctionnelle avec des hooks React
4. **Style** : Utilisez Tailwind CSS pour le style
5. **État** : Gérez l'état global avec Zustand

## Fonctionnalités Principales

### Gestion des Données
- Import/Export de fichiers (CSV, Excel, Word, PDF)
- Import/Export via API
- Filtres intelligents par type de données
- Suppression de lignes et colonnes
- Historique des modifications (Undo/Redo)

### Traitement IA
- Support de multiples modèles d'IA
- Traitement par colonne
- Formats de réponse configurables
- Structure de réponse personnalisable

### Interface Utilisateur
- Interface de tableur interactive
- Thème clair/sombre
- Support multilingue (FR/EN)
- Filtres intelligents
- Gestion des limites de taux d'API

## Processus de Contribution

1. Créez une branche pour votre fonctionnalité
2. Développez et testez votre code
3. Assurez-vous que tous les tests passent
4. Soumettez une Pull Request

## Bonnes Pratiques

- Écrivez des tests unitaires et d'intégration
- Documentez les nouvelles fonctionnalités
- Suivez les conventions de nommage existantes
- Optimisez les performances quand possible