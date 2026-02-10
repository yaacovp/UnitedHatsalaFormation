       // Données du contenu - Chargement depuis JSON
        let content = {};
        
        // Fonction pour charger le contenu
        async function loadContent() {
            try {
                const response = await fetch('data/content.json');
                content = await response.json();
                buildSearchIndex();
                loadAllSections('intro');
                
                // ← AJOUTER CES LIGNES APRÈS loadAllSections
                initScrollAnimations(); // Pour les animations
                updateMenuBadges(); // Pour les badges de progression
                
            } catch (error) {
                console.error('Erreur chargement contenu:', error);
                // Fallback avec contenu minimal si le JSON ne charge pas
                content = {
                    intro: {
                        title: "📌 Introduction au secourisme",
                        emoji: "📌",
                        sections: [{
                            subtitle: "Chargement...",
                            text: "Le contenu est en cours de chargement. Si ce message persiste, vérifiez que le fichier data/content.json existe."
                        }]
                    }
                };
                loadAllSections('intro');
            }
        }

        // État de l'app
        let currentSection = 'intro';
        let searchIndex = [];
        let currentCycleStep = 0;
        let currentCycleType = 'pulmonaire';

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            initTheme();
            loadContent(); // Charge le JSON
            loadFlashcards();
            initEventListeners();

            initFlashcardMode();
            initProgressTracking();
            initQuickReview();
            initCustomization();
            initScrollAnimations();
            checkScrollTop();
            
            // PWA install prompt
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                document.getElementById('installPrompt').classList.add('show');
            });

            document.getElementById('installBtn').addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    deferredPrompt = null;
                    document.getElementById('installPrompt').classList.remove('show');
                }
            });
        });

        // Gestion du thème
        function initTheme() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        }

        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        }

        function updateThemeIcon(theme) {
            document.getElementById('themeBtn').textContent = theme === 'light' ? '🌙' : '☀️';
        }

        // Construction de l'index de recherche
        function buildSearchIndex() {
            searchIndex = [];
            Object.keys(content).forEach(key => {
                const section = content[key];
                section.sections.forEach(subsection => {
                    searchIndex.push({
                        section: key,
                        title: section.title,
                        subtitle: subsection.subtitle,
                        text: subsection.text || '',
                        list: subsection.list ? subsection.list.join(' ') : ''
                    });
                });
            });
        }

        // Recherche
        function performSearch(query) {
            if (!query.trim()) {
                document.getElementById('searchResults').innerHTML = '';
                return;
            }

            const results = searchIndex.filter(item => {
                const searchText = `${item.title} ${item.subtitle} ${item.text} ${item.list}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            }).slice(0, 10);

            displaySearchResults(results, query);
        }

        function displaySearchResults(results, query) {
            const container = document.getElementById('searchResults');
            
            if (results.length === 0) {
                container.innerHTML = '<div class="search-result">Aucun résultat trouvé</div>';
                return;
            }

            container.innerHTML = results.map(result => `
                <div class="search-result" onclick="loadSection('${result.section}')">
                    <div class="search-result-title">${result.subtitle}</div>
                    <div class="search-result-path">${result.title}</div>
                    <div class="search-result-snippet">${highlightText(result.text.substring(0, 100), query)}...</div>
                </div>
            `).join('');
        }

        function highlightText(text, query) {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        }

// Chargement d'une section individuelle (utilisé par la recherche)
        function loadSection(sectionKey) {
            const section = content[sectionKey];
            if (!section) {
                console.error('Section non trouvée:', sectionKey);
                return;
            }

            currentSection = sectionKey;
            
            // Scroll vers la section au lieu de la recharger
            const sectionElement = document.getElementById(`section-${sectionKey}`);
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Fermeture menu et recherche
            closeSidebar();
            closeSearch();
        }


        // Charger toutes les sections à la fois
        function loadAllSections() {
            if (!content || Object.keys(content).length === 0) {
                document.getElementById('contentArea').innerHTML = '<div class="content-card"><p>Chargement du contenu...</p></div>';
                return;
            }

            let html = '';
            
            // Parcourir toutes les sections
            Object.keys(content).forEach(sectionKey => {
                const section = content[sectionKey];
                
                html += `<div class="content-card section-content" id="section-${sectionKey}" data-section="${sectionKey}">`;
                html += `<h1 class="section-title">${section.title}</h1>`;

                if (section.sections && section.sections.length > 0) {
                    html += section.sections.map(subsection => `
                        <h2 class="section-subtitle">${subsection.subtitle || ''}</h2>
                        ${subsection.cycle ? generateCycleHTML(subsection.cycle) : ''}
                        ${subsection.image ? generateImageHTML(subsection.image) : ''}
                        ${subsection.type ? `
                            <div class="info-box ${subsection.type}">
                                <div class="info-box-title">
                                    ${subsection.type === 'warning' ? '⚠️' : subsection.type === 'danger' ? '🚨' : '✅'}
                                    ${subsection.subtitle || ''}
                                </div>
                                ${subsection.text ? `<p>${subsection.text}</p>` : ''}
                                ${subsection.list ? `<ul>${subsection.list.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
                            </div>
                        ` : `
                            ${subsection.text ? `<p class="content-text">${subsection.text}</p>` : ''}
                            ${subsection.list ? `<ul class="content-list">${subsection.list.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
                            ${subsection.examples ? `<ul class="content-list">${subsection.examples.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
                        `}
                    `).join('');
                }

                html += '</div>';
            });

            document.getElementById('contentArea').innerHTML = html;

            // Initialiser tous les listeners
            initCycleListeners();
            initImageListeners();

            // Démarrer l'observation du scroll
            observeSections();
        }

        // Observer les sections visibles pendant le scroll
        function observeSections() {
            const options = {
                root: null,
                rootMargin: '-20% 0px -70% 0px', // Section active = dans les 20-30% du haut de l'écran
                threshold: 0
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionKey = entry.target.getAttribute('data-section');
                        updateActiveMenuItem(sectionKey);
                        currentSection = sectionKey;
                        
                        // Mettre à jour le breadcrumb
                        const section = content[sectionKey];
                        if (section) {
                            const breadcrumbText = section.title.replace(/^[^\s]+\s/, ''); // Enlève l'emoji
                            document.getElementById('breadcrumb').innerHTML = `
                                <span>🏠 Accueil</span>
                                <span>›</span>
                                <span>${section.emoji} ${breadcrumbText}</span>
                            `;
                        }
                    }
                });
            }, options);

            // Observer toutes les sections
            document.querySelectorAll('.section-content').forEach(section => {
                observer.observe(section);
            });
        }

        // Mettre à jour l'élément actif dans le menu
        function updateActiveMenuItem(sectionKey) {
            // Retirer tous les "active"
            document.querySelectorAll('.nav-item, .nav-sub-item').forEach(item => {
                item.classList.remove('active');
            });

            // Ajouter "active" à la section courante
            const activeItem = document.querySelector(`.nav-item[data-section="${sectionKey}"], .nav-sub-item[data-section="${sectionKey}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }

        // Event listeners
        function initEventListeners() {
            // Menu
            document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
            document.getElementById('navMenu').addEventListener('click', toggleSidebar);
            document.getElementById('overlay').addEventListener('click', closeSidebar);

            // Recherche
            document.getElementById('searchBtn').addEventListener('click', toggleSearch);
            document.getElementById('navSearch').addEventListener('click', toggleSearch);
            document.getElementById('searchInput').addEventListener('input', (e) => {
                performSearch(e.target.value);
            });

            // Thème
            document.getElementById('themeBtn').addEventListener('click', toggleTheme);

            // Navigation sections - Scroll vers section
            document.querySelectorAll('.nav-item, .nav-sub-item').forEach(item => {
                item.addEventListener('click', () => {
                    const section = item.getAttribute('data-section');
                    
                    // Scroll vers la section
                    const sectionElement = document.getElementById(`section-${section}`);
                    if (sectionElement) {
                        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    
                    // Fermer le menu sur mobile
                    if (window.innerWidth <= 768) {
                        closeSidebar();
                    }
                });
            });

            // Accueil - Scroll vers le haut
            document.getElementById('navHome').addEventListener('click', () => {
                // Scroll vers le haut (première section)
                const firstSection = document.querySelector('.section-content');
                if (firstSection) {
                    firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                
                // Mettre à jour la bottom nav
                document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
                document.getElementById('navHome').classList.add('active');
            });

            // Scroll to top
            document.getElementById('scrollTop').addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // Languette sidebar
            document.getElementById('sidebarTab')?.addEventListener('click', toggleSidebar);

            window.addEventListener('scroll', checkScrollTop);
        }

        // Génération HTML du cycle cardiaque
        function generateCycleHTML(cycleData) {
            const pulmonaireSteps = cycleData.pulmonaire || [];
            const systemiqueSteps = cycleData.systemique || [];
            
            return `
                <div class="cycle-container">
                    <div class="cycle-tabs">
                        <button class="cycle-tab pulmonaire active" data-cycle="pulmonaire">
                            🫁 Circulation Pulmonaire (${pulmonaireSteps.length} étapes)
                        </button>
                        <button class="cycle-tab systemique" data-cycle="systemique">
                            🌍 Circulation Systémique (${systemiqueSteps.length} étapes)
                        </button>
                    </div>
                    
                    <div class="cycle-content">
                        <div id="cycle-steps-container"></div>
                        
                        <div class="cycle-navigation">
                            <button class="cycle-nav-btn" id="cycle-prev">← Précédent</button>
                            <button class="cycle-nav-btn" id="cycle-next">Suivant →</button>
                        </div>
                        
                        <div class="cycle-progress" id="cycle-progress"></div>
                    </div>
                    
                    ${cycleData.image ? `
                        <div class="image-container" onclick="openLightbox('${cycleData.image.src}')">
                            <img src="${cycleData.image.src}" alt="${cycleData.image.alt}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=image-placeholder>📸 Image : ${cycleData.image.alt}<br><small>Placez votre image dans images/schemas/</small></div>'">
                            <p class="image-caption">${cycleData.image.caption}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Génération HTML des images
        function generateImageHTML(imageData) {
            return `
                <div class="image-container" onclick="openLightbox('${imageData.src}')">
                    <img src="${imageData.src}" alt="${imageData.alt}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=image-placeholder>📸 Image : ${imageData.alt}<br><small class=upload-hint>Placez votre image dans images/schemas/</small></div>'">
                    <p class="image-caption">${imageData.caption}</p>
                </div>
            `;
        }

        // Initialiser les listeners du cycle
        function initCycleListeners() {
            const tabs = document.querySelectorAll('.cycle-tab');
            const prevBtn = document.getElementById('cycle-prev');
            const nextBtn = document.getElementById('cycle-next');
            
            if (!tabs.length) return;
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    currentCycleType = tab.dataset.cycle;
                    currentCycleStep = 0;
                    renderCycleStep();
                });
            });
            
            if (prevBtn) prevBtn.addEventListener('click', () => navigateCycle(-1));
            if (nextBtn) nextBtn.addEventListener('click', () => navigateCycle(1));
            
            renderCycleStep();
        }

        // Naviguer dans le cycle (avec boucle automatique)
        function navigateCycle(direction) {
            const section = content[currentSection];
            if (!section) return;
            
            const cycleData = section.sections.find(s => s.cycle);
            if (!cycleData) return;
            
            const currentSteps = cycleData.cycle[currentCycleType] || [];
            currentCycleStep += direction;
            
            // Gérer les changements de circulation
            if (currentCycleStep < 0) {
                // Retour en arrière
                if (currentCycleType === 'pulmonaire') {
                    // Depuis pulmonaire → fin de systémique
                    currentCycleType = 'systemique';
                    currentCycleStep = (cycleData.cycle.systemique?.length || 1) - 1;
                    updateActiveCycleTab();
                } else if (currentCycleType === 'systemique') {
                    // Depuis systémique → fin de pulmonaire
                    currentCycleType = 'pulmonaire';
                    currentCycleStep = (cycleData.cycle.pulmonaire?.length || 1) - 1;
                    updateActiveCycleTab();
                }
            } else if (currentCycleStep >= currentSteps.length) {
                // Avancer
                if (currentCycleType === 'pulmonaire') {
                    // Depuis pulmonaire → début de systémique
                    currentCycleType = 'systemique';
                    currentCycleStep = 0;
                    updateActiveCycleTab();
                } else if (currentCycleType === 'systemique') {
                    // Depuis systémique → début de pulmonaire
                    currentCycleType = 'pulmonaire';
                    currentCycleStep = 0;
                    updateActiveCycleTab();
                }
            }
            
            renderCycleStep();
        }

        // Mettre à jour l'onglet actif visuellement
        function updateActiveCycleTab() {
            const tabs = document.querySelectorAll('.cycle-tab');
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.cycle === currentCycleType) {
                    tab.classList.add('active');
                }
            });
        }

        // Afficher l'étape courante
        function renderCycleStep() {
            const section = content[currentSection];
            if (!section) return;
            
            const cycleData = section.sections.find(s => s.cycle);
            if (!cycleData) return;
            
            const steps = cycleData.cycle[currentCycleType] || [];
            const step = steps[currentCycleStep];
            
            if (!step) return;
            
            const container = document.getElementById('cycle-steps-container');
            const prevBtn = document.getElementById('cycle-prev');
            const nextBtn = document.getElementById('cycle-next');
            const progress = document.getElementById('cycle-progress');
            
            if (!container) return;
            
            // Déterminer la couleur selon l'étape et la circulation
            let stepClass = '';
            let highlightClass = '';
            let prevBtnClass = 'cycle-nav-btn';
            let nextBtnClass = 'cycle-nav-btn';
            
            if (currentCycleType === 'pulmonaire') {
                if (currentCycleStep >= 0 && currentCycleStep <= 2) {
                    // Étapes 1-3 : Bleu (sang pauvre en O₂)
                    stepClass = 'blue';
                    highlightClass = 'blue';
                    prevBtnClass += ' blue';
                    nextBtnClass += ' blue';
                } else if (currentCycleStep === 3) {
                    // Étape 4 : Dégradé bleu → rouge (échanges gazeux)
                    stepClass = 'gradient-blue-red';
                    highlightClass = 'gradient-blue-red';
                    prevBtnClass += ' gradient-prev-pulm'; // 75% bleu + 25% vers rouge
                    nextBtnClass += ' gradient-next-pulm'; // 25% bleu + 75% rouge
                } else if (currentCycleStep === 4) {
                    // Étape 5 : Rouge (sang riche en O₂)
                    stepClass = 'red';
                    highlightClass = 'red';
                    prevBtnClass += ' gradient-prev'; // Dégradé complet bleu → rouge
                    nextBtnClass += ' red';
                }
            } else if (currentCycleType === 'systemique') {
                if (currentCycleStep >= 0 && currentCycleStep <= 2) {
                    // Étapes 1-3 : Rouge (sang riche en O₂)
                    stepClass = 'red';
                    highlightClass = 'red';
                    prevBtnClass += ' red';
                    nextBtnClass += ' red';
                } else if (currentCycleStep === 3) {
                    // Étape 4 : Dégradé rouge → bleu (échanges gazeux)
                    stepClass = 'gradient-red-blue';
                    highlightClass = 'gradient-red-blue';
                    prevBtnClass += ' gradient-prev-syst'; // 75% rouge + 25% vers bleu
                    nextBtnClass += ' gradient-next-syst'; // 25% rouge + 75% bleu
                } else if (currentCycleStep === 4) {
                    // Étape 5 : Bleu (sang pauvre en O₂)
                    stepClass = 'blue';
                    highlightClass = 'blue';
                    prevBtnClass += ' gradient-prev-rb'; // Dégradé complet rouge → bleu
                    nextBtnClass += ' blue';
                }
            }

            container.innerHTML = `
                <div class="cycle-step active">
                    <div class="step-header">
                        <div class="step-number ${stepClass}">${currentCycleStep + 1}</div>
                        <div class="step-title">${step.title}</div>
                    </div>
                    <div class="step-description">${step.description}</div>
                    ${step.highlight ? `<div class="step-highlight ${highlightClass}">${step.highlight}</div>` : ''}
                </div>
            `;

            if (prevBtn) {
                prevBtn.disabled = false;
                prevBtn.className = prevBtnClass;
                if (currentCycleStep === 0 && currentCycleType === 'pulmonaire') {
                    prevBtn.innerHTML = '← Fin Systémique';
                } else {
                    prevBtn.innerHTML = '← Précédent';
                }
            }

            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.className = nextBtnClass;
                
                if (currentCycleStep === steps.length - 1) {
                    if (currentCycleType === 'pulmonaire') {
                        nextBtn.innerHTML = 'Systémique 🌍 →';
                    } else {
                        nextBtn.innerHTML = '♻️ Recommencer →';
                    }
                } else {
                    nextBtn.innerHTML = 'Suivant →';
                }
            }
            
            if (progress) progress.textContent = `Étape ${currentCycleStep + 1} sur ${steps.length}`;
        }


        // Ouvrir le lightbox
        function openLightbox(src) {
            const lightbox = document.getElementById('lightbox');
            const img = document.getElementById('lightboxImg');
            if (lightbox && img) {
                img.src = src;
                lightbox.classList.add('active');
            }
        }

        // Initialiser les listeners d'images
        function initImageListeners() {
            const lightbox = document.getElementById('lightbox');
            const closeBtn = document.getElementById('lightboxClose');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    lightbox.classList.remove('active');
                });
            }
            
            if (lightbox) {
                lightbox.addEventListener('click', (e) => {
                    if (e.target === lightbox) {
                        lightbox.classList.remove('active');
                    }
                });
            }
        }

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('overlay').classList.toggle('active');
        }

        function closeSidebar() {
            document.getElementById('sidebar').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
        }

        function toggleSearch() {
            const searchBar = document.getElementById('searchBar');
            const isActive = searchBar.classList.toggle('active');
            if (isActive) {
                document.getElementById('searchInput').focus();
            } else {
                document.getElementById('searchInput').value = '';
                document.getElementById('searchResults').innerHTML = '';
            }
        }

        function closeSearch() {
            document.getElementById('searchBar').classList.remove('active');
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResults').innerHTML = '';
        }

        function checkScrollTop() {
            const btn = document.getElementById('scrollTop');
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }

        // Swipe pour ouvrir/fermer le menu
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const sidebar = document.getElementById('sidebar');
            const swipeThreshold = 50;
            
            // Swipe de gauche à droite (ouvrir)
            if (touchStartX < 30 && touchEndX - touchStartX > swipeThreshold) {
                sidebar.classList.add('active');
                document.getElementById('overlay').classList.add('active');
            }
            
            // Swipe de droite à gauche (fermer)
            if (touchEndX - touchStartX < -swipeThreshold) {
                sidebar.classList.remove('active');
                document.getElementById('overlay').classList.remove('active');
            }
        }


        let flashcards = [];
        let currentFlashcardIndex = 0;
        let flashcardStats = { easy: 0, medium: 0, hard: 0 };
        let filteredFlashcards = [];
        let readSections = new Set();
        let preferences = {
            fontSize: 16,
            accentColor: '#2563eb',
            dyslexicMode: false
        };
        let sessionStartTime = Date.now();

        // ========================================
        // CHARGEMENT DES FLASHCARDS
        // ========================================

        async function loadFlashcards() {
            try {
                const response = await fetch('data/flashcards.json');
                const data = await response.json();
                flashcards = data.flashcards;
                
                // Charger la progression depuis localStorage
                const saved = localStorage.getItem('flashcardProgress');
                if (saved) {
                    const progress = JSON.parse(saved);
                    flashcards.forEach(card => {
                        if (progress[card.id] !== undefined) {
                            card.difficulty = progress[card.id];
                        }
                    });
                }
                
                filteredFlashcards = [...flashcards];
                console.log('Flashcards chargées :', flashcards.length);
            } catch (error) {
                console.error('Erreur chargement flashcards:', error);
            }
        }

        // ========================================
        // MODE FLASHCARDS
        // ========================================

        function initFlashcardMode() {
            const modal = document.getElementById('flashcardModal');
            const overlay = document.getElementById('flashcardOverlay');
            const closeBtn = document.getElementById('closeFlashcards');
            const navBtn = document.getElementById('navFlashcards');
            const headerBtn = document.getElementById('flashcardsHeaderBtn');
            
            // Ouvrir modal
            navBtn.addEventListener('click', () => {
                if (flashcards.length === 0) {
                    alert('Aucune flashcard disponible. Vérifiez data/flashcards.json');
                    return;
                }
                modal.classList.add('active');
                shuffleFlashcards();
                showFlashcard(0);
            });

            if (headerBtn) {
                headerBtn.addEventListener('click', () => {
                    if (flashcards.length === 0) {
                        alert('Aucune flashcard disponible. Vérifiez data/flashcards.json');
                        return;
                    }
                    modal.classList.add('active');
                    shuffleFlashcards();
                    showFlashcard(0);
                });
            }
            
            // Fermer modal
            const closeModal = () => modal.classList.remove('active');
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);
            
            // Filtrage par section
            document.getElementById('flashcardSection').addEventListener('change', (e) => {
                const section = e.target.value;
                if (section === 'all') {
                    filteredFlashcards = [...flashcards];
                } else {
                    filteredFlashcards = flashcards.filter(card => card.section === section);
                }
                shuffleFlashcards();
                showFlashcard(0);
            });
            
            // Mélanger
            document.getElementById('shuffleFlashcards').addEventListener('click', () => {
                shuffleFlashcards();
                showFlashcard(0);
            });
            
            // Retourner la carte
            document.getElementById('flipToBack').addEventListener('click', flipCard);
            document.getElementById('flashcard').addEventListener('click', (e) => {
                if (e.target.closest('.difficulty-buttons') || e.target.closest('.flashcard-flip-btn')) return;
                flipCard();
            });
            
            // Boutons de difficulté
            document.querySelectorAll('.btn-difficulty').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const difficulty = parseInt(e.target.dataset.difficulty);
                    rateCard(difficulty);
                });
            });
            
            // Navigation
            document.getElementById('prevFlashcard').addEventListener('click', () => {
                if (currentFlashcardIndex > 0) {
                    showFlashcard(currentFlashcardIndex - 1);
                }
            });
            
            document.getElementById('nextFlashcard').addEventListener('click', () => {
                if (currentFlashcardIndex < filteredFlashcards.length - 1) {
                    showFlashcard(currentFlashcardIndex + 1);
                }
            });
            
            document.getElementById('skipFlashcard').addEventListener('click', () => {
                if (currentFlashcardIndex < filteredFlashcards.length - 1) {
                    showFlashcard(currentFlashcardIndex + 1);
                }
            });
            
            // Swipe gestures
            let touchStartX = 0;
            let touchEndX = 0;
            
            const flashcardElement = document.getElementById('flashcard');
            flashcardElement.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });
            
            flashcardElement.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleFlashcardSwipe();
            });
            
            function handleFlashcardSwipe() {
                const swipeThreshold = 50;
                const diff = touchEndX - touchStartX;
                
                if (Math.abs(diff) > swipeThreshold) {
                    if (document.getElementById('flashcard').classList.contains('flipped')) {
                        // Sur le verso, swipe = noter
                        if (diff > 0) {
                            rateCard(1); // Swipe droite = facile
                        } else {
                            rateCard(3); // Swipe gauche = difficile
                        }
                    }
                }
            }
        }

        function shuffleFlashcards() {
            for (let i = filteredFlashcards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredFlashcards[i], filteredFlashcards[j]] = [filteredFlashcards[j], filteredFlashcards[i]];
            }
        }

        function showFlashcard(index) {
            if (index < 0 || index >= filteredFlashcards.length) return;
            
            currentFlashcardIndex = index;
            const card = filteredFlashcards[index];

            document.getElementById('flashcardQuestion').textContent = card.question;
            document.getElementById('flashcardAnswer').innerHTML = card.answer;
            document.getElementById('flashcardCounter').textContent = `${index + 1} / ${filteredFlashcards.length}`;

            // Reset flip
            document.getElementById('flashcard').classList.remove('flipped');

            // Progress bar
            const progress = ((index + 1) / filteredFlashcards.length) * 100;
            document.getElementById('flashcardProgressBar').style.width = `${progress}%`;

            // Désactiver boutons si limites
            document.getElementById('prevFlashcard').disabled = index === 0;
            document.getElementById('nextFlashcard').disabled = index === filteredFlashcards.length - 1;
            document.getElementById('skipFlashcard').disabled = index === filteredFlashcards.length - 1;
        }

        function flipCard() {
            document.getElementById('flashcard').classList.toggle('flipped');
        }

        function rateCard(difficulty) {
            const card = filteredFlashcards[currentFlashcardIndex];
            card.difficulty = difficulty;
            
            // Mettre à jour stats
            if (difficulty === 1) flashcardStats.easy++;
            else if (difficulty === 2) flashcardStats.medium++;
            else if (difficulty === 3) flashcardStats.hard++;

            document.getElementById('easyCount').textContent = flashcardStats.easy;
            document.getElementById('mediumCount').textContent = flashcardStats.medium;
            document.getElementById('hardCount').textContent = flashcardStats.hard;

            // Sauvegarder
            saveFlashcardProgress();

            // Passer à la suivante
            if (currentFlashcardIndex < filteredFlashcards.length - 1) {
                setTimeout(() => showFlashcard(currentFlashcardIndex + 1), 300);
            } else {
                // Fin du deck
                alert(`🎉 Bravo ! Vous avez terminé toutes les flashcards !\n\n😊 Faciles : ${flashcardStats.easy}\n😐 Moyennes : ${flashcardStats.medium}\n😓 Difficiles : ${flashcardStats.hard}`);
            }
        }

        function saveFlashcardProgress() {
            const progress = {};
            flashcards.forEach(card => {
                progress[card.id] = card.difficulty;
            });
            localStorage.setItem('flashcardProgress', JSON.stringify(progress));
        }

        // ========================================
        // PROGRESSION DE LECTURE
        // ========================================

        function initProgressTracking() {
            loadProgress();
            
            const modal = document.getElementById('progressModal');
            const overlay = document.getElementById('progressOverlay');
            const closeBtn = document.getElementById('closeProgress');
            const navBtn = document.getElementById('navProgress');
            const headerBtn = document.getElementById('progressHeaderBtn');

            // Ouvrir modal
            navBtn.addEventListener('click', () => {
                modal.classList.add('active');
                displayProgressPanel();
            });

                if (headerBtn) {
                    headerBtn.addEventListener('click', () => {
                        modal.classList.add('active');
                        displayProgressPanel();
                    });
                }

            // Fermer modal
            const closeModal = () => modal.classList.remove('active');
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);

            // Actions
            document.getElementById('markAllRead').addEventListener('click', markAllAsRead);
            document.getElementById('resetProgress').addEventListener('click', resetProgress);

            // Ajouter checkboxes dans le menu
            updateMenuBadges();
        }

        function loadProgress() {
            const saved = localStorage.getItem('readSections');
            if (saved) {
                readSections = new Set(JSON.parse(saved));
            }
            
            // Charger temps passé
            const savedTime = localStorage.getItem('sessionTime');
            if (savedTime) {
                sessionStartTime = Date.now() - parseInt(savedTime);
            }
        }

        function saveProgress() {
            localStorage.setItem('readSections', JSON.stringify([...readSections]));
            
            // Sauvegarder temps
            const timeSpent = Date.now() - sessionStartTime;
            localStorage.setItem('sessionTime', timeSpent.toString());
        }

        function toggleSectionRead(sectionKey) {
            if (readSections.has(sectionKey)) {
                readSections.delete(sectionKey);
            } else {
                readSections.add(sectionKey);
            }
            saveProgress();
            updateMenuBadges();
            updateProgressBar();
        }

        function updateMenuBadges() {
            document.querySelectorAll('.nav-item, .nav-sub-item').forEach(item => {
                const sectionKey = item.dataset.section;
                if (!sectionKey) return;
                
                // Retirer ancien badge
                const oldBadge = item.querySelector('.section-read-badge');
                if (oldBadge) oldBadge.remove();
                
                // Ajouter nouveau badge
                const badge = document.createElement('span');
                badge.className = 'section-read-badge';
                badge.textContent = readSections.has(sectionKey) ? '🟢' : '⚪';
                badge.style.cursor = 'pointer';
                badge.title = readSections.has(sectionKey) ? 'Marquer comme non lu' : 'Marquer comme lu';
                
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleSectionRead(sectionKey);
                });
                
                item.appendChild(badge);
            });
        }

        function updateProgressBar() {
            const totalSections = Object.keys(content).length;
            const readCount = readSections.size;
            const percentage = Math.round((readCount / totalSections) * 100);
            
            // Mettre à jour dans le panel de progression
            const progressBar = document.getElementById('progressBarLarge');
            const progressPercentage = document.getElementById('progressPercentage');
            const sectionsRead = document.getElementById('sectionsRead');

            if (progressBar) progressBar.style.width = `${percentage}%`;
            if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
            if (sectionsRead) sectionsRead.textContent = `${readCount}/${totalSections}`;
        }

        function displayProgressPanel() {
            updateProgressBar();
            
            // Temps passé
            const timeSpent = Math.round((Date.now() - sessionStartTime) / 60000);
            document.getElementById('timeSpent').textContent = `${timeSpent} min`;

            // Jours consécutifs (simulé)
            document.getElementById('streakDays').textContent = '0';

            // Liste des sections
            const checklistContent = document.getElementById('sectionsChecklistContent');
            checklistContent.innerHTML = '';

            Object.keys(content).forEach(sectionKey => {
                const section = content[sectionKey];
                const isRead = readSections.has(sectionKey);
                
                const item = document.createElement('div');
                item.className = `section-check-item ${isRead ? 'completed' : ''}`;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = isRead;
                checkbox.className = 'section-checkbox-input';
                checkbox.id = `check-${sectionKey}`;
                
                checkbox.addEventListener('change', () => {
                    toggleSectionRead(sectionKey);
                    displayProgressPanel();
                });
                
                const label = document.createElement('label');
                label.className = 'section-check-label';
                label.htmlFor = `check-${sectionKey}`;
                label.textContent = section.title;
                
                item.appendChild(checkbox);
                item.appendChild(label);
                checklistContent.appendChild(item);
            });
        }

        function markAllAsRead() {
            if (confirm('Marquer toutes les sections comme lues ?')) {
                Object.keys(content).forEach(key => readSections.add(key));
                saveProgress();
                updateMenuBadges();
                displayProgressPanel();
            }
        }

        function resetProgress() {
            if (confirm('⚠️ Réinitialiser toute la progression ? Cette action est irréversible.')) {
                readSections.clear();
                localStorage.removeItem('readSections');
                localStorage.removeItem('sessionTime');
                sessionStartTime = Date.now();
                updateMenuBadges();
                displayProgressPanel();
            }
        }

        // ========================================
        // MODE RÉVISION RAPIDE
        // ========================================

        function initQuickReview() {
            const modal = document.getElementById('quickReviewModal');
            const overlay = document.getElementById('quickReviewOverlay');
            const closeBtn = document.getElementById('closeQuickReview');
            const openBtn = document.getElementById('quickReviewBtn');
            
            // Ouvrir modal
            openBtn.addEventListener('click', () => {
                modal.classList.add('active');
                generateQuickReview();
            });

            // Fermer modal
            const closeModal = () => modal.classList.remove('active');
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);

            // Actions
            document.getElementById('printReview').addEventListener('click', () => window.print());
            document.getElementById('copyReview').addEventListener('click', copyQuickReview);
        }

        function generateQuickReview() {
            const criticalPoints = [];
            
            Object.keys(content).forEach(sectionKey => {
                const section = content[sectionKey];
                
                section.sections.forEach(subsection => {
                    // Extraire info-boxes warning/danger
                    if (subsection.type === 'warning' || subsection.type === 'danger') {
                        criticalPoints.push({
                            section: section.title,
                            type: subsection.type,
                            subtitle: subsection.subtitle,
                            text: subsection.text,
                            list: subsection.list || []
                        });
                    }
                    
                    // Extraire highlights du cycle cardiaque
                    if (subsection.cycle) {
                        ['pulmonaire', 'systemique'].forEach(cycleType => {
                            const steps = subsection.cycle[cycleType] || [];
                            steps.forEach(step => {
                                if (step.highlight) {
                                    criticalPoints.push({
                                        section: section.title,
                                        type: 'success',
                                        subtitle: step.title,
                                        text: step.highlight,
                                        list: []
                                    });
                                }
                            });
                        });
                    }
                });
            });

            displayQuickReview(criticalPoints);
        }

        function displayQuickReview(points) {
            const container = document.getElementById('quickReviewContent');
            container.innerHTML = '';
            
            if (points.length === 0) {
                container.innerHTML = '<p>Aucun point critique trouvé.</p>';
                return;
            }

            points.forEach(point => {
                const div = document.createElement('div');
                div.className = `critical-point ${point.type}`;
                
                const sectionLabel = document.createElement('div');
                sectionLabel.className = 'critical-point-section';
                sectionLabel.textContent = point.section;
                
                const textDiv = document.createElement('div');
                textDiv.className = 'critical-point-text';
                
                let html = `<strong>${point.subtitle}</strong><br>`;
                if (point.text) html += point.text;
                if (point.list.length > 0) {
                    html += '<ul>';
                    point.list.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += '</ul>';
                }
                
                textDiv.innerHTML = html;
                
                div.appendChild(sectionLabel);
                div.appendChild(textDiv);
                container.appendChild(div);
            });
        }

        function copyQuickReview() {
            const content = document.getElementById('quickReviewContent').innerText;
            navigator.clipboard.writeText(content).then(() => {
                alert('📋 Contenu copié dans le presse-papier !');
            }).catch(err => {
                console.error('Erreur copie:', err);
            });
        }

        // ========================================
        // PERSONNALISATION
        // ========================================

        function initCustomization() {
            loadPreferences();
            
            const modal = document.getElementById('customizeModal');
            const overlay = document.getElementById('customizeOverlay');
            const closeBtn = document.getElementById('closeCustomize');
            const openBtn = document.getElementById('fontSizeBtn');

            // Ouvrir modal
            openBtn.addEventListener('click', () => {
                modal.classList.add('active');
            });

            // Fermer modal
            const closeModal = () => modal.classList.remove('active');
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);

            // Taille de police
            document.getElementById('fontSizeDecrease').addEventListener('click', () => changeFontSize(-2));
            document.getElementById('fontSizeIncrease').addEventListener('click', () => changeFontSize(2));

            // Couleur d'accentuation
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const color = e.target.dataset.color;
                    changeAccentColor(color);
                    
                    document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });

            // Mode dyslexie
            document.getElementById('dyslexicModeToggle').addEventListener('change', (e) => {
                toggleDyslexicMode(e.target.checked);
            });
        }

        function loadPreferences() {
            const saved = localStorage.getItem('preferences');
            if (saved) {
                preferences = JSON.parse(saved);
            }
            
            // Appliquer
            document.documentElement.style.setProperty('--font-size-base', `${preferences.fontSize}px`);
            document.documentElement.style.setProperty('--primary', preferences.accentColor);
            document.getElementById('fontSizeDisplay').textContent = `${preferences.fontSize}px`;

            if (preferences.dyslexicMode) {
                document.body.classList.add('dyslexic-mode');
                document.getElementById('dyslexicModeToggle').checked = true;
            }

            // Sélectionner la couleur active
            document.querySelectorAll('.color-option').forEach(btn => {
                if (btn.dataset.color === preferences.accentColor) {
                    btn.classList.add('active');
                }
            });
        }

        function savePreferences() {
            localStorage.setItem('preferences', JSON.stringify(preferences));
        }

        function changeFontSize(delta) {
            preferences.fontSize = Math.max(14, Math.min(20, preferences.fontSize + delta));
            document.documentElement.style.setProperty('--font-size-base', `${preferences.fontSize}px`);
            document.getElementById('fontSizeDisplay').textContent = `${preferences.fontSize}px`;
            savePreferences();
        }

        function changeAccentColor(color) {
            preferences.accentColor = color;
            document.documentElement.style.setProperty('--primary', color);
            savePreferences();
        }

        function toggleDyslexicMode(enabled) {
            preferences.dyslexicMode = enabled;
            if (enabled) {
                document.body.classList.add('dyslexic-mode');
                // Charger la police OpenDyslexic si pas déjà fait
                if (!document.getElementById('dyslexic-font')) {
                    const link = document.createElement('link');
                    link.id = 'dyslexic-font';
                    link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);
                }
            } else {
                document.body.classList.remove('dyslexic-mode');
            }
            savePreferences();
        }

        // ========================================
        // ANIMATIONS AU SCROLL
        // ========================================

        function initScrollAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            });
            
            document.querySelectorAll('.section-content').forEach(section => {
                observer.observe(section);
            });
        }