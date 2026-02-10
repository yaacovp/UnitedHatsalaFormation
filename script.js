       // Données du contenu - Chargement depuis JSON
        let content = {};
        
        // Fonction pour charger le contenu
        async function loadContent() {
            try {
                const response = await fetch('data/content.json');
                content = await response.json();
                buildSearchIndex();
                loadAllSections('intro');
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
            initEventListeners();
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