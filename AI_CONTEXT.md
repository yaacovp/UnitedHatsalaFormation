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
│   ├── content.json       # Contenu des cours (JSON structuré)
│   └── flashcards.json    # Données des flashcards pour révision
└── images/
    └── schemas/
        ├── icon-192.png   # Icône PWA 192x192
        ├── icon-512.png   # Icône PWA 512x512
        └── *.jpg/svg      # Schémas anatomiques
```

---

## 🏗️ Architecture technique

### Stack
- **Frontend pur** : HTML5 + CSS3 + JavaScript Vanilla (ES6+)
- **Hébergement** : GitHub Pages (statique)
- **PWA** : Service Worker + Manifest
- **Responsive** : Mobile-first (320px minimum)
- **Stockage local** : localStorage pour progression, favoris, et flashcards

### Fichiers séparés
- `index.html` : Structure HTML uniquement
- `style.css` : Tous les styles (incluant animations)
- `script.js` : Toute la logique JavaScript
- `data/content.json` : Contenu des cours au format JSON
- `data/flashcards.json` : Questions/réponses pour flashcards

### Pas de dépendances externes
- Pas de frameworks (React, Vue, etc.)
- Pas de bibliothèques CDN
- Tout est en JavaScript vanilla

---

## 🎨 Fonctionnalités principales

### 1. Navigation
- **Menu latéral** (sidebar) avec sections/sous-sections
- **Scroll continu** : toutes les sections chargées, navigation fluide
- **Mise à jour automatique** : section active suit le scroll (IntersectionObserver)
- **Languette flottante** sur mobile pour ouvrir le menu
- **Swipe gestures** : glisser pour ouvrir/fermer le menu
- **Bottom navigation** (mobile) : Accueil, Recherche, Sections, Flashcards, Progression
- **Breadcrumb** : fil d'Ariane qui suit le scroll

### 2. Recherche
- **Barre de recherche** fixe en haut
- **Recherche instantanée** dans tout le contenu (côté client)
- **Highlight** des résultats
- **Affichage de la source** (dans quelle section)
- **Scroll automatique** vers le résultat sélectionné

### 3. Cycle cardiaque interactif
- **Navigation par étapes** avec boutons Précédent/Suivant
- **Deux circulations** : Pulmonaire 🫁 et Systémique 🌍
- **Boucle continue** : fin pulmonaire → début systémique → fin systémique → début pulmonaire
- **Couleurs selon oxygénation** :
  - 🔵 Bleu = sang pauvre en O₂
  - 🔴 Rouge = sang riche en O₂
  - Dégradés continus aux étapes de transition (échanges gazeux)

#### Logique des dégradés du cycle

**Circulation Pulmonaire (Bleu → Rouge) :**
- Étapes 1-3 : Bleu pur
- Étape 4 : Dégradé progressif bleu → violet → rouge
  - Bouton Précédent : 50% bleu pur | 50% début dégradé
  - Bouton Suivant : 50% fin dégradé | 50% rouge pur
- Étape 5 : Rouge pur

**Circulation Systémique (Rouge → Bleu) :**
- Étapes 1-3 : Rouge pur
- Étape 4 : Dégradé progressif rouge → violet → bleu
  - Bouton Précédent : 50% rouge pur | 50% début dégradé
  - Bouton Suivant : 50% fin dégradé | 50% bleu pur
- Étape 5 : Bleu pur

### 4. Mode Flashcards 🆕
- **Carte recto/verso** avec animation de retournement
- **Swipe tactile** : gauche (difficile), droite (facile)
- **Système de notation** : Facile / Moyen / Difficile
- **Algorithme de répétition espacée** :
  - Cartes "difficiles" reviennent plus souvent
  - Cartes "faciles" espacées dans le temps
- **Compteur de progression** : X/Y cartes vues
- **Sauvegarde de l'état** : localStorage (niveau de difficulté par carte)
- **Mode aléatoire** : ordre de présentation mélangé
- **Filtrage par section** : réviser uniquement une thématique

### 5. Progression de lecture 🆕
- **Checkbox sur chaque section** : marquer comme lue
- **Barre de progression globale** : pourcentage de complétion
- **Badge visuel dans le menu** :
  - 🟢 Section lue
  - ⚪ Section non lue
- **Sauvegarde persistante** : localStorage
- **Panel de gestion** :
  - "Tout marquer comme lu"
  - "Tout réinitialiser"
  - Statistiques : X/Y sections complétées
- **Indicateur visuel en temps réel** : badge de progression dans le header

### 6. Mode Révision Rapide 🆕
- **Affichage condensé** : uniquement les points critiques
- **Filtrage intelligent** :
  - Info-boxes warning (⚠️ jaune)
  - Info-boxes danger (🚨 rouge)
  - Highlights du cycle cardiaque (💡)
- **Génération automatique** de fiche de révision
- **Impression optimisée** : CSS @media print
- **Navigation rapide** : liens vers sections complètes
- **Export possible** : copie dans le presse-papier

### 7. Affichage du contenu
- **Toutes les sections en une page** : scroll continu
- **Animations au scroll** : fade-in progressif des sections (IntersectionObserver)
- **Markdown vers HTML** (via JSON structuré)
- **Emojis préservés**
- **Info-boxes colorées** : warning (jaune), danger (rouge), success (vert)
- **Typographie hiérarchisée** : titres, sous-titres, paragraphes, listes

### 8. Images et schémas
- **Lightbox** : clic sur image → zoom plein écran (fond blanc)
- **Lazy loading** : chargement différé (attribut `loading="lazy"`)
- **Fallback** : placeholder si image manquante
- **Support SVG** : images vectorielles
- **Compression** : images optimisées (TinyPNG recommandé)

### 9. PWA (Progressive Web App)
- **Installable** : ajout à l'écran d'accueil
- **Offline-first** : fonctionne sans internet après premier chargement
- **Service Worker** : cache automatique des ressources
- **Manifest** : configuration PWA (nom, icônes, thème)
- **Install prompt** : bannière d'installation personnalisée

### 10. Thème sombre/clair
- **Toggle** : bouton pour basculer (🌙/☀️)
- **Persistance** : sauvegarde dans localStorage
- **CSS Variables** : gestion centralisée des couleurs
- **Adaptation automatique** : respect des préférences système

### 11. Personnalisation 🆕
- **Taille de police** : réglable A- / A / A+
  - Boutons dans le header
  - 3 niveaux : 14px / 16px (défaut) / 18px
  - Sauvegarde localStorage
- **Couleur d'accentuation** : 5 choix (bleu, vert, violet, orange, rose)
  - Modifie `--primary` globalement
  - Affecte boutons, liens, highlights
- **Mode haute lisibilité** : police dyslexia-friendly
  - Police OpenDyslexic (chargée si activée)
  - Espacement augmenté
  - Contrastes renforcés

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

### Format flashcards (data/flashcards.json)
```json
{
  "flashcards": [
    {
      "id": "card_001",
      "section": "nerveux",
      "question": "Quel est le rôle du diaphragme ?",
      "answer": "Principal muscle respiratoire qui se contracte lors de l'inspiration pour augmenter le volume thoracique.",
      "difficulty": 0
    }
  ]
}
```

**Champs :**
- `id` : identifiant unique
- `section` : clé de section (pour filtrage)
- `question` : texte recto
- `answer` : texte verso (peut contenir HTML)
- `difficulty` : 0 (nouveau), 1 (facile), 2 (moyen), 3 (difficile)

---

## 🎨 Conventions de style CSS

### Variables CSS
```css
:root {
  --primary: #2563eb;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --shadow: rgba(0, 0, 0, 0.1);
  
  /* Nouvelles variables pour personnalisation */
  --font-size-base: 16px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-family-dyslexic: "OpenDyslexic", sans-serif;
}

[data-theme="dark"] {
  --bg-main: #0f172a;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --border: #334155;
  --shadow: rgba(0, 0, 0, 0.3);
}
```

### Classes importantes

**Navigation :**
- `.sidebar` : menu latéral
- `.sidebar-tab` : languette flottante
- `.nav-item` : élément de menu principal
- `.nav-item.active` : section actuellement visible (bordure bleue)
- `.nav-sub-item` : sous-élément de menu
- `.progress-badge` : badge de progression (ex: 7/14)

**Contenu :**
- `.content-card` : carte de contenu
- `.section-content` : section individuelle (avec data-section)
- `.section-title` : titre principal
- `.section-subtitle` : sous-titre
- `.info-box.warning|danger|success` : boîtes colorées
- `.fade-in` : animation d'apparition au scroll

**Cycle cardiaque :**
- `.cycle-container` : conteneur global
- `.cycle-tab` : onglets pulmonaire/systémique
- `.cycle-content` : zone d'affichage étape
- `.step-number.blue|red|gradient-*` : numéro étape coloré
- `.step-highlight.blue|red|gradient-*` : highlight coloré
- `.cycle-nav-btn.gradient-prev-pulm|gradient-next-pulm` : boutons avec dégradé continu

**Flashcards 🆕 :**
- `.flashcard-container` : conteneur principal
- `.flashcard` : carte (avec .flipped pour retournement)
- `.flashcard-front` : face recto
- `.flashcard-back` : face verso
- `.difficulty-buttons` : boutons Facile/Moyen/Difficile
- `.flashcard-progress` : compteur de progression

**Progression 🆕 :**
- `.progress-panel` : panneau de gestion
- `.progress-bar` : barre de progression visuelle
- `.section-checkbox` : checkbox "section lue"
- `.progress-stats` : statistiques de lecture

**Mode révision rapide 🆕 :**
- `.quick-review-container` : conteneur du mode
- `.critical-point` : point clé extrait
- `.quick-review-nav` : navigation vers sections complètes

---

## 🔧 Fonctions JavaScript principales

### Chargement et navigation
- `loadContent()` : charge data/content.json via fetch
- `loadAllSections()` : affiche toutes les sections en une page
- `observeSections()` : IntersectionObserver pour suivre le scroll
- `updateActiveMenuItem(sectionKey)` : met à jour le menu selon la section visible
- `buildSearchIndex()` : construit l'index de recherche

### Recherche
- `performSearch(query)` : recherche dans l'index
- `displaySearchResults(results, query)` : affiche résultats
- `highlightText(text, query)` : surligne le texte

### Cycle cardiaque
- `generateCycleHTML(cycleData)` : génère le HTML du cycle
- `initCycleListeners()` : initialise les événements
- `navigateCycle(direction)` : navigue entre étapes (+1 ou -1)
- `renderCycleStep()` : affiche l'étape courante avec dégradés continus
- `updateActiveCycleTab()` : met à jour l'onglet actif

### Flashcards 🆕
- `loadFlashcards()` : charge data/flashcards.json
- `initFlashcardMode()` : initialise le mode flashcards
- `showFlashcard(index)` : affiche une carte
- `flipCard()` : retourne la carte (animation 3D)
- `rateCard(difficulty)` : enregistre la difficulté (1=facile, 2=moyen, 3=difficile)
- `shuffleFlashcards()` : mélange l'ordre des cartes
- `getNextCard()` : algorithme de répétition espacée
- `saveFlashcardProgress()` : sauvegarde dans localStorage

### Progression de lecture 🆕
- `initProgressTracking()` : initialise le système de progression
- `toggleSectionRead(sectionKey)` : marque/démarque section comme lue
- `updateProgressBar()` : met à jour la barre de progression
- `getCompletionPercentage()` : calcule le pourcentage (ex: 50%)
- `saveProgress()` : sauvegarde dans localStorage (`readSections`)
- `loadProgress()` : charge depuis localStorage
- `resetProgress()` : réinitialise tout
- `markAllAsRead()` : marque toutes les sections comme lues

### Mode révision rapide 🆕
- `generateQuickReview()` : extrait les points critiques
- `collectCriticalPoints()` : parcourt content.json pour extraire info-boxes warning/danger
- `displayQuickReview()` : affiche la fiche de révision
- `printQuickReview()` : lance l'impression
- `copyQuickReview()` : copie dans le presse-papier

### Images
- `generateImageHTML(imageData)` : génère HTML image
- `openLightbox(src)` : ouvre image en plein écran
- `initImageListeners()` : événements lightbox

### Personnalisation 🆕
- `changeFontSize(direction)` : A- / A / A+ (±2px)
- `changeAccentColor(color)` : modifie --primary
- `toggleDyslexicMode()` : active police OpenDyslexic
- `savePreferences()` : sauvegarde dans localStorage
- `loadPreferences()` : charge au démarrage

### Animations 🆕
- `observeAnimations()` : IntersectionObserver pour fade-in au scroll
- `animateProgressBar(percentage)` : animation de remplissage
- `smoothScrollTo(element)` : scroll fluide amélioré

### Interface
- `toggleSidebar()` : ouvre/ferme le menu
- `closeSidebar()` : ferme le menu
- `toggleSearch()` : ouvre/ferme la recherche
- `closeSearch()` : ferme la recherche
- `toggleTheme()` : bascule thème clair/sombre
- `handleSwipe()` : gestion des swipes tactiles

### État global
```javascript
let content = {};                    // Contenu chargé depuis JSON
let flashcards = [];                 // Flashcards chargées
let currentSection = 'intro';        // Section visible actuellement
let searchIndex = [];                // Index de recherche
let currentCycleStep = 0;            // Étape cycle actuelle
let currentCycleType = 'pulmonaire'; // Type de circulation
let currentFlashcardIndex = 0;       // Index carte actuelle
let readSections = new Set();        // Sections lues (localStorage)
let preferences = {                  // Préférences utilisateur
  fontSize: 16,
  accentColor: '#2563eb',
  dyslexicMode: false
};
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

### Incrémentation du Service Worker
Après chaque déploiement, incrémenter `CACHE_NAME` dans `sw.js` :
```javascript
const CACHE_NAME = 'pse-v3'; // Incrémenter à chaque mise à jour
```

---

## 📱 Compatibilité

### Navigateurs supportés
- ✅ Chrome/Edge 90+ (desktop + mobile)
- ✅ Firefox 88+ (desktop + mobile)
- ✅ Safari 14+ (desktop + iOS)
- ✅ Samsung Internet 14+

### Résolutions
- ✅ Mobile : 320px minimum
- ✅ Tablet : 768px et +
- ✅ Desktop : 1024px et +

### Fonctionnalités PWA
- ✅ Android : Installation complète
- ⚠️ iOS : Installation partielle (pas de Service Worker complet)

### Performances
- ⚡ Lighthouse Score cible : 90+
- ⚡ First Contentful Paint : < 1.5s
- ⚡ Time to Interactive : < 3s
- ⚡ Lazy loading actif sur toutes les images
- ⚡ Animations optimisées (GPU-accelerated)

---

## ⚠️ Points d'attention

### Sécurité et limitations
- **Pas de backend** : tout est côté client
- **GitHub Pages** : pas de PHP, Node.js, bases de données
- **CORS** : nécessite serveur HTTP local pour développement
- **Service Worker** : fonctionne uniquement en HTTPS (GitHub Pages OK)
- **localStorage** : limite de 5-10 MB par origine

### Performance
- **Images** : compresser avec TinyPNG avant upload
- **Lazy loading** : actif sur toutes les images
- **Cache** : Service Worker cache automatiquement les ressources
- **Animations** : utiliser `transform` et `opacity` (GPU)
- **IntersectionObserver** : utilisé pour optimiser le scroll

### localStorage (clés utilisées)
```javascript
'theme'                 // 'light' | 'dark'
'readSections'          // JSON array des sections lues
'flashcardProgress'     // JSON object { card_id: difficulty }
'fontSize'              // 14 | 16 | 18
'accentColor'           // hex color
'dyslexicMode'          // true | false
```

---

## 🐛 Debugging courant

### Le contenu ne s'affiche pas
1. Ouvrir la console (F12)
2. Vérifier que `content` est chargé : `console.log(content)`
3. Vérifier le fetch de `data/content.json` (onglet Network)
4. **Solution CORS** : lancer serveur HTTP local (`python -m http.server 8000`)

### Le menu ne suit pas le scroll
1. Vérifier que `observeSections()` est appelé
2. Console : vérifier les erreurs IntersectionObserver
3. Vérifier que chaque section a `data-section="..."`

### Les flashcards ne se chargent pas
1. Vérifier que `data/flashcards.json` existe
2. Console : `console.log(flashcards)`
3. Vérifier la structure JSON (validateur : jsonlint.com)

### La progression ne se sauvegarde pas
1. Console : `localStorage.getItem('readSections')`
2. Vérifier que localStorage n'est pas bloqué (navigation privée)
3. Vérifier les erreurs dans `saveProgress()`

### Les animations ne fonctionnent pas
1. Vérifier le support de `IntersectionObserver` (caniuse.com)
2. Console : vérifier les erreurs
3. Tester sur un navigateur récent

### Service Worker ne met pas à jour le cache
1. Incrémenter `CACHE_NAME` dans `sw.js` (ex: `pse-v2` → `pse-v3`)
2. Vider le cache navigateur (Ctrl+Shift+Delete)
3. Recharger avec Ctrl+F5
4. DevTools → Application → Service Workers → "Unregister" puis recharger

---

## 🎯 Tâches courantes

### Ajouter une nouvelle section
1. Éditer `data/content.json`
2. Ajouter une entrée avec la structure requise
3. Ajouter un élément dans la sidebar du HTML (respecter l'ordre)
4. Mettre à jour `orderedKeys` dans `loadAllSections()` si nécessaire
5. Push sur GitHub → déploiement automatique

### Ajouter des flashcards
1. Éditer `data/flashcards.json`
2. Ajouter des objets avec `id`, `section`, `question`, `answer`
3. Respecter le format JSON (validation recommandée)
4. Push sur GitHub

### Ajouter une image
1. Compresser l'image (TinyPNG : https://tinypng.com/)
2. Placer dans `images/schemas/`
3. Référencer dans le JSON : `"src": "images/schemas/nom.jpg"`
4. Ajouter dans `sw.js` pour cache offline (optionnel)
5. Push sur GitHub

### Changer les couleurs du thème
1. Éditer les variables CSS dans `:root` (style.css)
2. Éditer `[data-theme="dark"]` pour le mode sombre
3. Tester les contrastes (accessibilité)

### Modifier les dégradés du cycle cardiaque
1. Éditer les classes `.gradient-prev-pulm`, `.gradient-next-pulm`, etc. dans `style.css`
2. Ajuster les pourcentages et couleurs intermédiaires
3. Tester visuellement l'étape 4 des deux circulations

---

## 📚 Ressources utiles

- **GitHub Pages Docs** : https://docs.github.com/pages
- **PWA Guide** : https://web.dev/progressive-web-apps/
- **Service Worker** : https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API
- **IntersectionObserver** : https://developer.mozilla.org/fr/docs/Web/API/Intersection_Observer_API
- **localStorage** : https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage
- **Compression images** : https://tinypng.com/
- **Validation JSON** : https://jsonlint.com/
- **Test accessibilité** : https://wave.webaim.org/

---

## 💡 Fonctionnalités implémentées

- ✅ Navigation scroll continu avec mise à jour automatique du menu
- ✅ Cycle cardiaque interactif avec dégradés continus
- ✅ Recherche instantanée
- ✅ Thème sombre/clair
- ✅ PWA avec installation
- ✅ Lightbox pour images
- ✅ **Mode flashcards avec répétition espacée**
- ✅ **Progression de lecture avec sauvegarde**
- ✅ **Mode révision rapide (points critiques)**
- ✅ **Animations au scroll (fade-in)**
- ✅ **Personnalisation (taille police, couleur, dyslexie)**
- ✅ **Performance optimisée (lazy loading, animations GPU)**

---

## 👨‍💻 Informations de contact

**Projet** : Application de révision PSE1/PSE2  
**Auteur** : Yaacov - Santé Plus  
**Repository** : https://github.com/yaacovp/UnitedHatsalaFormation  
**Site** : https://yaacovp.github.io/UnitedHatsalaFormation/
