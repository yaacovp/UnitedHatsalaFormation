       // Données du contenu - Chargement depuis JSON
        let content = {};
        
        // États globaux (progression, préférences, session)
        // ⚠️ Important : ces variables doivent être définies avant tout appel
        // pour éviter les erreurs JavaScript qui peuvent bloquer le rendu,
        // en particulier sur mobile / PWA.
        let readSections = new Set();
        let sessionStartTime = Date.now();
        let preferences = {
            fontSize: 16,
            accentColor: '#2563eb',
            dyslexicMode: false
        };
        
        // Fonction pour charger le contenu
        async function loadContent() {
            try {
                const response = await fetch('data/content.json');
                content = await response.json();
                buildSearchIndex();
                loadAllSections('intro');
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
            initFlashResultModal();
            initProgressTracking();
            initQuickReview();
            initPrintModal();
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
                        subtitle: subsection.subtitle || '',
                        text: subsection.text || '',
                        list: subsection.list ? subsection.list.join(' ') : '',
                        details: subsection.details || '',
                        extra: [
                            subsection.mnemonic ? subsection.mnemonic.items.join(' ') : '',
                            subsection.analogy || '',
                            subsection.example || ''
                        ].join(' ')
                    });
                });
            });
        }

        function escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function highlightText(text, query) {
            if (!text || !query) return text || '';
            const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
            return text.replace(regex, '<mark class="search-highlight">$1</mark>');
        }

        function getSmartSnippet(text, query) {
            if (!text) return '';
            const idx = text.toLowerCase().indexOf(query.toLowerCase());
            if (idx === -1) return text.substring(0, 110) + (text.length > 110 ? '…' : '');
            const start = Math.max(0, idx - 45);
            const end = Math.min(text.length, idx + query.length + 75);
            let snippet = text.substring(start, end);
            if (start > 0) snippet = '…' + snippet;
            if (end < text.length) snippet += '…';
            return snippet;
        }

        let _searchDebounce = null;

        // Recherche avec scoring et debounce
        function performSearch(query) {
            clearTimeout(_searchDebounce);
            const container = document.getElementById('searchResults');

            if (!query.trim()) {
                container.innerHTML = '';
                return;
            }

            _searchDebounce = setTimeout(() => {
                const q = query.trim().toLowerCase();

                const scored = searchIndex.map(item => {
                    let score = 0;
                    const sub = item.subtitle.toLowerCase();
                    const txt = item.text.toLowerCase();
                    const lst = item.list.toLowerCase();
                    const ttl = item.title.toLowerCase();

                    if (sub.startsWith(q))   score += 14;
                    else if (sub.includes(q)) score += 9;
                    if (ttl.includes(q))      score += 6;
                    if (txt.includes(q))      score += 4;
                    if (lst.includes(q))      score += 3;
                    if ((item.details + item.extra).toLowerCase().includes(q)) score += 1;

                    return { ...item, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 8);

                displaySearchResults(scored, query.trim());
            }, 250);
        }

        function displaySearchResults(results, query) {
            const container = document.getElementById('searchResults');

            if (results.length === 0) {
                container.innerHTML = `
                    <div class="search-empty">
                        <div class="search-empty-icon">🔍</div>
                        <div class="search-empty-text">Aucun résultat pour <strong>"${query}"</strong></div>
                        <div class="search-empty-hint">Essaie un autre mot ou consulte le menu</div>
                    </div>`;
                return;
            }

            container.innerHTML = results.map(result => {
                const snippetSrc = result.text || result.list || result.details || '';
                const snippet = getSmartSnippet(snippetSrc, query);
                return `
                    <div class="search-result" onclick="loadSection('${result.section}')">
                        <div class="search-result-title">${highlightText(result.subtitle, query)}</div>
                        <div class="search-result-path">${result.title}</div>
                        ${snippet ? `<div class="search-result-snippet">${highlightText(snippet, query)}</div>` : ''}
                    </div>`;
            }).join('');
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
                        ${subsection.type === 'mnemonic' ? `
                            <div class="info-box mnemonic">
                                <div class="info-box-title">🔑 ${subsection.subtitle}</div>
                                ${subsection.text ? `<p>${subsection.text}</p>` : ''}
                                ${subsection.list ? `<ul>${subsection.list.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
                            </div>
                        ` : subsection.type ? `
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
                        ${subsection.mnemonic ? `
                            <div class="info-box mnemonic">
                                <div class="info-box-title">🔑 ${subsection.mnemonic.title}</div>
                                <ul>${subsection.mnemonic.items.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                        ` : ''}
                        ${subsection.analogy ? `
                            <div class="analogy-box">
                                <div class="analogy-title">💡 Analogie</div>
                                <p>${subsection.analogy}</p>
                            </div>
                        ` : ''}
                        ${subsection.example ? `
                            <div class="example-box">
                                <div class="example-title">📌 Exemple concret</div>
                                <p>${subsection.example}</p>
                            </div>
                        ` : ''}
                        ${subsection.details ? `
                            <div class="accordion-toggle" onclick="toggleAccordion(this)">
                                <span>📖 Voir l'explication complète</span>
                                <span class="accordion-arrow">▼</span>
                            </div>
                            <div class="accordion-content">
                                <p>${subsection.details}</p>
                                ${subsection.details_list ? `<ul class="content-list">${subsection.details_list.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
                            </div>
                        ` : ''}
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

        function getSectionOrder() {
            return Array.from(document.querySelectorAll('[data-section]')).map(el => el.dataset.section);
        }

        function handleSwipe() {
            // Ne pas interférer quand les flashcards sont ouvertes
            const fc = document.getElementById('flashcards-section');
            if (fc && fc.style.display !== 'none') return;

            const sidebar = document.getElementById('sidebar');
            const swipeDist = touchEndX - touchStartX;

            // Swipe depuis le bord gauche → ouvrir le menu
            if (touchStartX < 30 && swipeDist > 50) {
                sidebar.classList.add('active');
                document.getElementById('overlay').classList.add('active');
                return;
            }

            // Si le menu est ouvert, swipe gauche le ferme
            if (sidebar.classList.contains('active')) {
                if (swipeDist < -50) {
                    sidebar.classList.remove('active');
                    document.getElementById('overlay').classList.remove('active');
                }
                return;
            }

            // Navigation entre sections (menu fermé, swipe ≥80px, pas depuis le bord gauche)
            if (touchStartX >= 30 && Math.abs(swipeDist) >= 80) {
                const sectionOrder = getSectionOrder();
                const idx = sectionOrder.indexOf(currentSection);
                if (swipeDist < 0 && idx < sectionOrder.length - 1) {
                    loadSection(sectionOrder[idx + 1]);
                } else if (swipeDist > 0 && idx > 0) {
                    loadSection(sectionOrder[idx - 1]);
                }
            }
        }


// ========================================
// FLASHCARDS - VERSION COMPLÈTE
// ========================================

let cards = [];
let filteredCards = [];
let idx = 0;
let stats = { easy: 0, medium: 0, hard: 0 };
let isFlipped = false;
let currentFilter = 'all';

// Charger les flashcards
async function loadFlashcards() {
    try {
        const res = await fetch('data/flashcards.json');
        const data = await res.json();
        cards = data.flashcards;
        
        // Charger progression depuis localStorage
        loadProgress();
        
        filteredCards = [...cards];
        console.log('✅ Flashcards chargées:', cards.length);
    } catch (err) {
        console.error('❌ Erreur:', err);
        alert('Erreur de chargement des flashcards');
    }
}

// Charger la progression
function loadProgress() {
    try {
        const saved = localStorage.getItem('flashcardProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            
            stats = { easy: 0, medium: 0, hard: 0 };
            
            cards.forEach(card => {
                if (progress[card.id]) {
                    card.difficulty = progress[card.id];
                    
                    if (card.difficulty === 1) stats.easy++;
                    else if (card.difficulty === 2) stats.medium++;
                    else if (card.difficulty === 3) stats.hard++;
                }
            });
        }
    } catch (err) {
        console.error('Erreur chargement progression:', err);
    }
}

// Sauvegarder la progression
function saveProgress() {
    try {
        const progress = {};
        cards.forEach(card => {
            if (card.difficulty) {
                progress[card.id] = card.difficulty;
            }
        });
        localStorage.setItem('flashcardProgress', JSON.stringify(progress));
    } catch (err) {
        console.error('Erreur sauvegarde progression:', err);
    }
}

function initFlashcardMode() {
    // Bouton header (desktop)
    const headerBtn = document.getElementById('flashcardsHeaderBtn');
    if (headerBtn) {
        headerBtn.addEventListener('click', openFlashcards);
    }
    
    // Bottom nav (mobile)
    const navBtn = document.getElementById('navFlashcards');
    if (navBtn) {
        navBtn.addEventListener('click', openFlashcards);
    }
    
    // Bouton home
    const homeBtn = document.getElementById('navHome');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            hideFlashcardsSection();
            document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
            homeBtn.classList.add('active');
        });
    }
    
    // Gestionnaire unifié : tap pour flip + swipe horizontal pour noter
    const cardWrapper = document.getElementById('fc-card-wrapper');
    if (cardWrapper) {
        let startX = 0, startY = 0, hasMoved = false, lastTouch = 0;

        cardWrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            hasMoved = false;
        }, { passive: true });

        cardWrapper.addEventListener('touchmove', (e) => {
            const dx = Math.abs(e.touches[0].clientX - startX);
            const dy = Math.abs(e.touches[0].clientY - startY);
            if (dx > 10 || dy > 10) hasMoved = true;
        }, { passive: true });

        cardWrapper.addEventListener('touchend', (e) => {
            lastTouch = Date.now();

            // Laisser les boutons gérer leur propre clic (sans preventDefault)
            if (e.target.closest('button')) return;

            // Bloquer le clic synthétique uniquement pour les zones hors bouton
            e.preventDefault();

            if (!hasMoved) {
                flipCard();
                return;
            }

            // Swipe horizontal → noter (seulement quand le verso est visible)
            const dist = e.changedTouches[0].clientX - startX;
            if (Math.abs(dist) > 50 && isFlipped) {
                dist > 0 ? rate(1) : rate(3);
            }
        }, { passive: false });

        // Desktop : clic souris (le guard timestamp évite le doublon post-touch)
        cardWrapper.addEventListener('click', (e) => {
            if (Date.now() - lastTouch < 500) return;
            if (e.target.closest('button')) return;
            flipCard();
        });
    }
}


// Filtrer les cartes par section
function filterCards(section) {
    currentFilter = section;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.fc-filter-btn').forEach(btn => {
        btn.style.background = 'var(--bg-card)';
        btn.style.color = 'var(--text-primary)';
        btn.style.border = '2px solid var(--border)';
    });
    
    const activeBtn = document.getElementById(`filter-${section}`);
    if (activeBtn) {
        activeBtn.style.background = 'var(--primary)';
        activeBtn.style.color = 'white';
        activeBtn.style.border = 'none';
    }
    
    // Filtrer les cartes
    if (section === 'all') {
        filteredCards = [...cards];
    } else {
        filteredCards = cards.filter(card => card.section.startsWith(section));
    }
    
    idx = 0;
    showCard();
}

// Ouvrir les flashcards
function openFlashcards() {
    if (cards.length === 0) {
        alert('⏳ Chargement en cours...');
        return;
    }
    
    document.getElementById('contentArea').style.display = 'none';
    document.getElementById('flashcards-section').style.display = 'block';
    
    // Mettre à jour bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
    const navBtn = document.getElementById('navFlashcards');
    if (navBtn) navBtn.classList.add('active');
    
    // Afficher première carte
    idx = 0;
    updateStats();
    showCard();
}

// Fermer les flashcards
function hideFlashcardsSection() {
    document.getElementById('flashcards-section').style.display = 'none';
    const contentArea = document.getElementById('contentArea');
    contentArea.style.display = 'block';
    
    if (!contentArea.innerHTML || contentArea.innerHTML.trim() === '') {
        loadAllSections();
    }
}

// Afficher une carte
function showCard() {
    if (idx < 0 || idx >= filteredCards.length) return;
    
    const card = filteredCards[idx];
    
    // Réinitialiser le flip (retour face question)
    isFlipped = false;
    const cardEl = document.getElementById('fc-card');
    if (cardEl) {
        cardEl.classList.remove('flipped');
    }
    
    // Afficher question + réponse
    const questionEl = document.getElementById('fc-question');
    const answerEl = document.getElementById('fc-answer');
    
    if (questionEl) questionEl.textContent = card.question;
    if (answerEl) answerEl.innerHTML = card.answer;
    
    // Compteur
    const counterEl = document.getElementById('fc-counter');
    if (counterEl) counterEl.textContent = `${idx + 1} / ${filteredCards.length}`;
    
    // Barre de progression
    const progressEl = document.getElementById('fc-progress');
    if (progressEl) {
        const pct = ((idx + 1) / filteredCards.length) * 100;
        progressEl.style.width = pct + '%';
    }
}

// Retourner la carte (flip 3D)
function flipCard() {
    isFlipped = !isFlipped;
    const cardEl = document.getElementById('fc-card');
    
    if (cardEl) {
        if (isFlipped) {
            cardEl.classList.add('flipped');
        } else {
            cardEl.classList.remove('flipped');
        }
    }
}

// Noter la difficulté
function rate(difficulty) {
    const card = filteredCards[idx];
    
    // Retirer ancienne difficulté des stats
    if (card.difficulty === 1) stats.easy--;
    else if (card.difficulty === 2) stats.medium--;
    else if (card.difficulty === 3) stats.hard--;
    
    // Ajouter nouvelle difficulté
    card.difficulty = difficulty;
    if (difficulty === 1) stats.easy++;
    else if (difficulty === 2) stats.medium++;
    else if (difficulty === 3) stats.hard++;
    
    updateStats();
    saveProgress();
    
    // Passer à la suivante
    if (idx < filteredCards.length - 1) {
        idx++;
        setTimeout(showCard, 200);
    } else {
        setTimeout(() => showFlashResult(), 200);
    }
}

// Modal résultats de session
function showFlashResult() {
    document.getElementById('fr-easy').textContent   = stats.easy;
    document.getElementById('fr-medium').textContent = stats.medium;
    document.getElementById('fr-hard').textContent   = stats.hard;
    document.getElementById('flashResultModal').classList.add('active');
}

function initFlashResultModal() {
    const modal   = document.getElementById('flashResultModal');
    const close   = () => modal.classList.remove('active');

    document.getElementById('closeFlashResult').addEventListener('click', close);
    document.getElementById('flashResultClose').addEventListener('click', close);
    document.getElementById('flashResultOverlay').addEventListener('click', close);

    document.getElementById('flashResultRestart').addEventListener('click', () => {
        close();
        idx = 0;
        showCard();
    });
}

// Mettre à jour les stats
function updateStats() {
    document.getElementById('fc-stat-easy').textContent = stats.easy;
    document.getElementById('fc-stat-medium').textContent = stats.medium;
    document.getElementById('fc-stat-hard').textContent = stats.hard;
}

// Carte précédente
function previousCard() {
    if (idx > 0) {
        idx--;
        showCard();
    }
}

// Carte suivante
function nextCard() {
    if (idx < filteredCards.length - 1) {
        idx++;
        showCard();
    }
}

// Passer la carte
function skipCard() {
    nextCard();
}

// Mélanger les cartes
function shuffle() {
    for (let i = filteredCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredCards[i], filteredCards[j]] = [filteredCards[j], filteredCards[i]];
    }
    idx = 0;
    showCard();
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

        // ========================================
        // TOAST
        // ========================================

        let _toastTimer = null;
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            clearTimeout(_toastTimer);
            _toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
        }

        function toggleSectionRead(sectionKey) {
            if (readSections.has(sectionKey)) {
                readSections.delete(sectionKey);
                showToast('Section marquée comme non lue');
            } else {
                readSections.add(sectionKey);
                showToast('✓ Section marquée comme lue !');
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
            document.getElementById('printReview').addEventListener('click', () => {
                modal.classList.remove('active');
                openPrintModal();
                const qrCheck = document.getElementById('print-quickreview');
                if (qrCheck) { qrCheck.checked = true; syncSelectAll(); }
            });
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
        // MODAL IMPRESSION
        // ========================================

        function initPrintModal() {
            const modal = document.getElementById('printModal');
            const overlay = document.getElementById('printOverlay');
            const closeBtn = document.getElementById('closePrint');

            document.getElementById('printBtn').addEventListener('click', openPrintModal);
            document.getElementById('printBtnSidebar').addEventListener('click', () => { closeSidebar(); openPrintModal(); });

            document.getElementById('printSelectAll').addEventListener('change', (e) => {
                document.querySelectorAll('.print-option').forEach(cb => { cb.checked = e.target.checked; });
            });

            document.querySelectorAll('.print-option').forEach(cb => {
                cb.addEventListener('change', syncSelectAll);
            });

            document.getElementById('doPrint').addEventListener('click', executePrint);

            const closeModal = () => modal.classList.remove('active');
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);
        }

        function syncSelectAll() {
            const all = document.querySelectorAll('.print-option');
            const checked = document.querySelectorAll('.print-option:checked');
            const selectAll = document.getElementById('printSelectAll');
            selectAll.checked = all.length === checked.length;
            selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
        }

        function openPrintModal() {
            document.getElementById('printModal').classList.add('active');
        }

        function executePrint() {
            const selections = [...document.querySelectorAll('.print-option:checked')].map(cb => cb.value);
            if (selections.length === 0) {
                alert('Sélectionne au moins un élément à imprimer.');
                return;
            }
            document.getElementById('printModal').classList.remove('active');
            document.getElementById('printContainer').innerHTML = buildPrintHTML(selections);
            setTimeout(() => window.print(), 150);
        }

        function buildPrintHTML(selections) {
            const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
            let html = `<div class="print-doc-title"><h1>🚑 PSE1/PSE2 — United Hatzalah Révisions</h1><p>Imprimé le ${now}</p></div>`;

            const sectionOrder = ['intro', 'biologie', 'nerveux', 'respiratoire', 'cardio', 'bilan', 'traitement', 'urgences'];

            if (selections.includes('quickreview')) html += buildQuickReviewPrint();
            sectionOrder.forEach(key => {
                if (selections.includes(key) && content[key]) html += buildSectionPrint(key);
            });
            if (selections.includes('flashcards')) html += buildFlashcardsPrint();

            return html;
        }

        function buildQuickReviewPrint() {
            let html = '<div class="print-section">';
            html += '<div class="print-section-title">⚡ Révision Rapide — Points critiques</div>';
            Object.keys(content).forEach(key => {
                content[key].sections.forEach(sub => {
                    if (sub.type === 'warning' || sub.type === 'danger') {
                        html += buildPrintBox(sub.type, sub.subtitle, sub.text, sub.list);
                    }
                });
            });
            html += '</div>';
            return html;
        }

        function buildSectionPrint(key) {
            const section = content[key];
            let html = '<div class="print-section">';
            html += `<div class="print-section-title">${section.title}</div>`;
            section.sections.forEach(sub => {
                if (sub.subtitle) html += `<div class="print-subsection-title">${sub.subtitle}</div>`;
                if (sub.type === 'mnemonic') {
                    html += buildPrintBox('mnemonic', `🔑 ${sub.subtitle}`, sub.text, sub.list);
                } else if (sub.type) {
                    const icon = sub.type === 'warning' ? '⚠️' : sub.type === 'danger' ? '🚨' : '✅';
                    html += buildPrintBox(sub.type, `${icon} ${sub.subtitle || ''}`, sub.text, sub.list);
                } else {
                    if (sub.text) html += `<p class="print-text">${sub.text}</p>`;
                    if (sub.list) html += `<ul class="print-list">${sub.list.map(i => `<li>${i}</li>`).join('')}</ul>`;
                    if (sub.examples) html += `<ul class="print-list">${sub.examples.map(i => `<li>${i}</li>`).join('')}</ul>`;
                }
                if (sub.mnemonic) html += buildPrintBox('mnemonic', `🔑 ${sub.mnemonic.title}`, null, sub.mnemonic.items);
                if (sub.analogy) html += buildPrintBox('analogy', '💡 Analogie', sub.analogy, null);
                if (sub.example) html += buildPrintBox('example', '📌 Exemple concret', sub.example, null);
                if (sub.details) {
                    html += `<p class="print-text"><em>${sub.details}</em></p>`;
                    if (sub.details_list) html += `<ul class="print-list">${sub.details_list.map(i => `<li>${i}</li>`).join('')}</ul>`;
                }
            });
            html += '</div>';
            return html;
        }

        function buildPrintBox(type, title, text, list) {
            let html = `<div class="print-box ${type}">`;
            if (title) html += `<div class="print-box-title">${title}</div>`;
            if (text) html += `<p>${text}</p>`;
            if (list && list.length) html += `<ul class="print-list">${list.map(i => `<li>${i}</li>`).join('')}</ul>`;
            html += '</div>';
            return html;
        }

        function buildFlashcardsPrint() {
            let html = '<div class="print-section">';
            html += '<div class="print-section-title">🎴 Flashcards</div>';
            html += '<div class="print-cards-grid">';
            cards.forEach(card => {
                const answer = card.answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                html += `<div class="print-card"><div class="print-card-q">Q : ${card.question}</div><div class="print-card-a">R : ${answer}</div></div>`;
            });
            html += '</div></div>';
            return html;
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

        // Accordéon : afficher/masquer le contenu détaillé
        function toggleAccordion(toggleEl) {
            const content = toggleEl.nextElementSibling;
            const isOpen = content.classList.contains('open');

            content.classList.toggle('open', !isOpen);
            toggleEl.classList.toggle('open', !isOpen);

            const arrow = toggleEl.querySelector('.accordion-arrow');
            if (arrow) arrow.textContent = isOpen ? '▼' : '▲';

            const label = toggleEl.querySelector('span:first-child');
            if (label) label.textContent = isOpen ? '📖 Voir l\'explication complète' : '📕 Masquer';
        }