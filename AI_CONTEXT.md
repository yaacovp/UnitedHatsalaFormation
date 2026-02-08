# 📋 AI_CONTEXT.md - Application de Révision PSE1/PSE2

## 🎯 Vue d'ensemble du projet

Application web Progressive Web App (PWA) pour réviser les formations de secourisme PSE1/PSE2. Optimisée mobile-first pour consultation sur smartphone, déployée sur GitHub Pages.

**URL de production :** `https://yaacovp.github.io/UnitedHatsalaFormation/`

---

## 📁 Structure du projet

```
UnitedHatsalaFormation/
├── index.html              # Page principale
├── style.css              # Styles CSS
├── script.js              # JavaScript (logique app)
├── manifest.json          # Configuration PWA
├── sw.js                  # Service Worker (cache offline)
├── README.md              # Documentation projet
├── data/
│   └── content.json       # Contenu des cours (JSON structuré)
└── images/
    └── schemas/
        ├── icon-192.png   # Icône PWA 192x192
        ├── icon-512.png   # Icône PWA 512x512
        └── cycle-cardiaque.svg  # Schéma du cycle cardiaque (Base64 dans JSON)
```

---

## 🏗️ Architecture technique

### Stack
- **Frontend pur** : HTML5 + CSS3 + JavaScript Vanilla (ES6+)
- **Hébergement** : GitHub Pages (statique)
- **PWA** : Service Worker + Manifest
- **Responsive** : Mobile-first (320px minimum)

### Fichiers séparés
- `index.html` : Structure HTML uniquement
- `style.css` : Tous les styles
- `script.js` : Toute la logique JavaScript
- `data/content.json` : Contenu des cours au format JSON

### Pas de dépendances externes
- Pas de frameworks (React, Vue, etc.)
- Pas de bibliothèques CDN
- Tout est en JavaScript vanilla

---

## 🎨 Fonctionnalités principales

### 1. Navigation
- **Menu latéral** (sidebar) avec sections/sous-sections
- **Languette flottante** sur mobile pour ouvrir le menu
- **Swipe gestures** : glisser pour ouvrir/fermer le menu
- **Bottom navigation** (mobile) : Accueil, Recherche, Sections
- **Breadcrumb** : fil d'Ariane pour se repérer

### 2. Recherche
- **Barre de recherche** fixe en haut
- **Recherche instantanée** dans tout le contenu (côté client)
- **Highlight** des résultats
- **Affichage de la source** (dans quelle section)

### 3. Cycle cardiaque interactif
- **Navigation par étapes** avec boutons Précédent/Suivant
- **Deux circulations** : Pulmonaire 🫁 et Systémique 🌍
- **Boucle continue** : fin pulmonaire → début systémique → fin systémique → début pulmonaire
- **Couleurs selon oxygénation** :
  - 🔵 Bleu = sang pauvre en O₂
  - 🔴 Rouge = sang riche en O₂
  - Dégradés aux étapes de transition (échanges gazeux)

#### Logique des couleurs du cycle

**Circulation Pulmonaire :**
- Étapes 1-3 : 🔵 Bleu (sang désoxygéné)
- Étape 4 : 🔵➡️🔴 Dégradé 50/50 (échanges gazeux aux poumons)
- Étape 5 : 🔴 Rouge (sang oxygéné)

**Circulation Systémique :**
- Étapes 1-3 : 🔴 Rouge (sang oxygéné)
- Étape 4 : 🔴➡️🔵 Dégradé 50/50 (échanges gazeux aux cellules)
- Étape 5 : 🔵 Bleu (sang désoxygéné)

**Éléments colorés :**
- Numéro d'étape (cercle)
- Highlight (info-box)
- Bouton Précédent
- Bouton Suivant

**Dégradés des boutons (étape 4) :**
- Bouton Précédent : 50% couleur pure | 50% dégradé
- Bouton Suivant : 50% dégradé | 50% couleur pure

### 4. Affichage du contenu
- **Markdown vers HTML** (via JSON structuré)
- **Emojis préservés**
- **Info-boxes colorées** : warning (jaune), danger (rouge), success (vert)
- **Typographie hiérarchisée** : titres, sous-titres, paragraphes, listes

### 5. Images et schémas
- **Lightbox** : clic sur image → zoom plein écran
- **Lazy loading** : chargement différé
- **Fallback** : placeholder si image manquante
- **Support SVG** : images vectorielles
- **Base64** : images encodées dans le JSON pour mode offline

### 6. PWA (Progressive Web App)
- **Installable** : ajout à l'écran d'accueil
- **Offline-first** : fonctionne sans internet après premier chargement
- **Service Worker** : cache automatique des ressources
- **Manifest** : configuration PWA (nom, icônes, thème)

### 7. Thème sombre/clair
- **Toggle** : bouton pour basculer
- **Persistance** : sauvegarde dans localStorage
- **CSS Variables** : gestion centralisée des couleurs

---

## 📊 Format du contenu (data/content.json)

### Structure générale

```json
{
  "section-key": {
    "title": "🔵 Titre de la section",
    "emoji": "🔵",
    "sections": [
      {
        "subtitle": "Sous-titre",
        "text": "Texte explicatif",
        "type": "warning|danger|success",
        "list": ["Point 1", "Point 2"],
        "examples": ["Exemple 1"],
        "cycle": { /* Cycle cardiaque */ },
        "image": { /* Données image */ }
      }
    ]
  }
}
```

### Types de sections

1. **Section texte simple**
```json
{
  "subtitle": "Titre",
  "text": "Contenu texte",
  "list": ["Item 1", "Item 2"]
}
```

2. **Info-box (warning/danger/success)**
```json
{
  "subtitle": "Attention",
  "type": "warning",
  "text": "Message important",
  "list": ["Point 1", "Point 2"]
}
```

3. **Cycle cardiaque interactif**
```json
{
  "subtitle": "Les deux circulations complètes",
  "cycle": {
    "pulmonaire": [
      {
        "title": "Titre étape",
        "description": "Description <strong>HTML autorisé</strong>",
        "highlight": "💡 Point important à retenir"
      }
    ],
    "systemique": [ /* même structure */ ],
    "image": {
      "src": "data:image/svg+xml;base64,..." ,
      "alt": "Description image",
      "caption": "Légende"
    }
  }
}
```

4. **Image standalone**
```json
{
  "subtitle": "Schéma anatomique",
  "image": {
    "src": "images/schemas/schema.svg",
    "alt": "Description",
    "caption": "Légende"
  }
}
```

---

## 🎨 Conventions de style CSS

### Variables CSS
```css
:root {
  --primary: #2563eb;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;
  --bg-main, --bg-card, --text-primary, etc.
}
```

### Classes importantes

**Navigation :**
- `.sidebar` : menu latéral
- `.sidebar-tab` : languette flottante
- `.nav-item` : élément de menu principal
- `.nav-sub-item` : sous-élément de menu

**Contenu :**
- `.content-card` : carte de contenu
- `.section-title` : titre principal
- `.section-subtitle` : sous-titre
- `.info-box.warning|danger|success` : boîtes colorées

**Cycle cardiaque :**
- `.cycle-container` : conteneur global
- `.cycle-tab` : onglets pulmonaire/systémique
- `.cycle-content` : zone d'affichage étape
- `.step-number.blue|red|gradient-blue-red|gradient-red-blue` : numéro étape
- `.step-highlight.blue|red|gradient-blue-red|gradient-red-blue` : highlight
- `.cycle-nav-btn.blue|red|gradient-*` : boutons navigation

**Couleurs du cycle :**
- `.blue` : #3b82f6
- `.red` : #ef4444
- `.gradient-blue-red` : linear-gradient(90deg, bleu → rouge)
- `.gradient-red-blue` : linear-gradient(90deg, rouge → bleu)
- `.gradient-prev-pulm` : 50% bleu | 50% vers rouge
- `.gradient-next-pulm` : 50% depuis bleu | 50% rouge
- `.gradient-prev-syst` : 50% rouge | 50% vers bleu
- `.gradient-next-syst` : 50% depuis rouge | 50% bleu

---

## 🔧 Fonctions JavaScript principales

### Chargement et navigation
- `loadContent()` : charge data/content.json via fetch
- `loadSection(sectionKey)` : affiche une section
- `buildSearchIndex()` : construit l'index de recherche

### Recherche
- `performSearch(query)` : recherche dans l'index
- `displaySearchResults(results, query)` : affiche résultats
- `highlightText(text, query)` : surligne le texte

### Cycle cardiaque
- `generateCycleHTML(cycleData)` : génère le HTML du cycle
- `initCycleListeners()` : initialise les événements
- `navigateCycle(direction)` : navigue entre étapes (+1 ou -1)
- `renderCycleStep()` : affiche l'étape courante
- `updateActiveCycleTab()` : met à jour l'onglet actif

### Images
- `generateImageHTML(imageData)` : génère HTML image
- `openLightbox(src)` : ouvre image en plein écran
- `initImageListeners()` : événements lightbox

### Interface
- `toggleSidebar()` : ouvre/ferme le menu
- `toggleSearch()` : ouvre/ferme la recherche
- `toggleTheme()` : bascule thème clair/sombre
- `handleSwipe()` : gestion des swipes tactiles

### État global
```javascript
let content = {};           // Contenu chargé depuis JSON
let currentSection = 'intro'; // Section affichée
let searchIndex = [];       // Index de recherche
let currentCycleStep = 0;   // Étape cycle actuelle
let currentCycleType = 'pulmonaire'; // Type de circulation
```

---

## 🚀 Déploiement GitHub Pages

### Configuration actuelle
- **Branche** : main
- **Dossier** : / (root)
- **URL** : `https://yaacovp.github.io/UnitedHatsalaFormation/`

### Mise à jour du site
```bash
git add .
git commit -m "Description des changements"
git push origin main
# Attendre 1-2 minutes → site mis à jour automatiquement
```

---

## 📱 Compatibilité

### Navigateurs supportés
- ✅ Chrome/Edge (desktop + mobile)
- ✅ Firefox (desktop + mobile)
- ✅ Safari (desktop + iOS)
- ✅ Samsung Internet

### Résolutions
- ✅ Mobile : 320px minimum
- ✅ Tablet : 768px et +
- ✅ Desktop : 1024px et +

### Fonctionnalités PWA
- ✅ Android : Installation complète
- ⚠️ iOS : Installation partielle (pas de Service Worker complet)

---

## ⚠️ Points d'attention

### Sécurité et limitations
- **Pas de backend** : tout est côté client
- **GitHub Pages** : pas de PHP, Node.js, bases de données
- **CORS** : les fichiers doivent être sur le même domaine
- **Service Worker** : fonctionne uniquement en HTTPS (GitHub Pages OK)

### Performance
- **Images** : utiliser Base64 pour SVG dans JSON (mode offline)
- **Lazy loading** : actif sur toutes les images
- **Cache** : Service Worker cache automatiquement les ressources

### Fichier tout-en-un (offline.html)
- **Usage** : partage à quelqu'un sans internet
- **Format** : 1 seul fichier HTML avec CSS et JS inline
- **Contenu** : JSON intégré directement dans le script
- **Limitations** : 
  - Pas de Service Worker
  - Pas de PWA
  - iOS : nécessite app "Documents by Readdle"
  - Android : fonctionne directement avec Chrome

---

## 🐛 Debugging courant

### Le contenu ne s'affiche pas
1. Ouvrir la console (F12)
2. Vérifier que `content` est chargé : `console.log(content)`
3. Vérifier le fetch de `data/content.json` (onglet Network)

### Le cycle cardiaque ne fonctionne pas
1. Vérifier que la section contient `"cycle": { ... }`
2. Vérifier que `initCycleListeners()` est appelé
3. Console : erreurs dans `renderCycleStep()`

### Les couleurs du cycle sont incorrectes
1. Vérifier `currentCycleStep` (0-4) et `currentCycleType` (pulmonaire/systemique)
2. Vérifier la logique dans `renderCycleStep()` (lignes ~1320-1360)
3. Vérifier les classes CSS appliquées

### Les images ne s'affichent pas
1. **Chemin relatif** : vérifier `images/schemas/...`
2. **Base64** : vérifier que la chaîne commence par `data:image/...`
3. **Lightbox** : vérifier que `openLightbox()` est appelé

### Service Worker ne met pas à jour le cache
1. Incrémenter `CACHE_NAME` dans `sw.js` (ex: `pse-v1` → `pse-v2`)
2. Vider le cache navigateur (Ctrl+Shift+Delete)
3. Recharger avec Ctrl+F5

---

## 🎯 Tâches courantes

### Ajouter une nouvelle section
1. Éditer `data/content.json`
2. Ajouter une entrée avec la structure requise
3. Ajouter un élément dans la sidebar du HTML
4. Push sur GitHub → déploiement automatique

### Modifier le cycle cardiaque
1. Éditer la section `"cycle"` dans `data/content.json`
2. Les couleurs sont gérées automatiquement par `renderCycleStep()`

### Ajouter une image
1. **Option 1** : Ajouter dans `images/schemas/`
2. **Option 2** : Convertir en Base64 (https://base64.guru/)
3. Référencer dans le JSON avec `"src": "chemin ou data:image/..."`

### Changer les couleurs du thème
1. Éditer les variables CSS dans `:root` (style.css)
2. Éditer `[data-theme="dark"]` pour le mode sombre

---

## 📚 Ressources utiles

- **GitHub Pages Docs** : https://docs.github.com/pages
- **PWA Guide** : https://web.dev/progressive-web-apps/
- **Service Worker** : https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API
- **Base64 Encoder** : https://www.base64-image.de/

---

## 💡 Améliorations futures possibles

- [ ] Export section en PDF
- [ ] Favoris/bookmarks (localStorage)
- [ ] Progression de lecture (cocher sections vues)
- [ ] Quiz interactifs
- [ ] Animations SVG pour le cycle cardiaque
- [ ] Mode audio (lecture vocale)
- [ ] Partage de sections (liens directs)
- [ ] Statistiques de révision

---

## 👨‍💻 Informations de contact

**Projet** : Application de révision PSE1/PSE2  
**Auteur** : Yaacov - Santé Plus  
**Repository** : https://github.com/yaacovp/UnitedHatsalaFormation  
**Site** : https://yaacovp.github.io/UnitedHatsalaFormation/

---

*Dernière mise à jour : Février 2026*