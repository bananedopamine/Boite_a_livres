/**
 * DÉTECTION ET ADAPTATION AUTOMATIQUE DES MODALES AVEC TABLEAUX
 * @author : Solution Claude
 * @version : 1.0
 * @date : 09/02/2026
 * 
 * Ce script détecte automatiquement quand un tableau est chargé dans la modale
 * et applique les styles appropriés pour un affichage optimal
 * 
 * INSTALLATION :
 * Ajoutez cette ligne dans votre fichier base.html.twig avant la fermeture </body> :
 * <script src="{{ asset('js/modal_tableau_auto_resize.js') }}"></script>
 */

(function() {
    'use strict';
    
    /**
     * Détecte si le contenu de la modale contient un tableau
     * @param {HTMLElement} container - Le conteneur à vérifier
     * @returns {boolean} - True si un tableau est présent
     */
    function contientTableau(container) {
        if (!container) return false;
        
        // Vérifier la présence d'un tableau
        const tableaux = container.querySelectorAll('table');
        return tableaux.length > 0;
    }
    
    /**
     * Adapte la taille de la modale en fonction de son contenu
     * @param {HTMLElement} modale - La modale à adapter
     * @param {HTMLElement} contenu - Le contenu de la modale
     */
    function adapterTailleModale(modale, contenu) {
        if (!modale || !contenu) return;
        
        // Vérifier si le contenu contient un tableau
        if (contientTableau(contenu)) {
            console.log('📊 Tableau détecté dans la modale - Application des styles adaptés');
            modale.classList.add('modale-tableau');
            
            // Vérifier si le contenu nécessite un scroll horizontal
            setTimeout(() => {
                if (contenu.scrollWidth > contenu.clientWidth) {
                    contenu.classList.add('has-horizontal-scroll');
                    console.log('↔️ Scroll horizontal activé');
                } else {
                    contenu.classList.remove('has-horizontal-scroll');
                }
            }, 100);
        } else {
            modale.classList.remove('modale-tableau');
            contenu.classList.remove('has-horizontal-scroll');
        }
    }
    
    /**
     * Nettoie les classes quand la modale se ferme
     * @param {HTMLElement} modale - La modale à nettoyer
     * @param {HTMLElement} contenu - Le contenu de la modale
     */
    function nettoyerClasses(modale, contenu) {
        if (modale) {
            modale.classList.remove('modale-tableau');
        }
        if (contenu) {
            contenu.classList.remove('has-horizontal-scroll');
        }
    }
    
    /**
     * Initialise les observateurs et événements
     */
    function initialiser() {
        const modale = document.getElementById('modale_principale');
        const contenu = document.getElementById('contenu_modale');
        
        if (!modale || !contenu) {
            console.warn('⚠️ Modale ou contenu_modale non trouvé - Auto-resize désactivé');
            return;
        }
        
        // Observer les changements de contenu dans la modale
        const observer = new MutationObserver(function(mutations) {
            // Vérifier si du nouveau contenu a été ajouté
            let contenuModifie = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    contenuModifie = true;
                }
            });
            
            if (contenuModifie) {
                // Petit délai pour s'assurer que le DOM est stable
                setTimeout(() => {
                    adapterTailleModale(modale, contenu);
                }, 50);
            }
        });
        
        // Observer le contenu de la modale
        observer.observe(contenu, {
            childList: true,
            subtree: true
        });
        
        // Écouter l'ouverture de la modale
        modale.addEventListener('open', function() {
            adapterTailleModale(modale, contenu);
        });
        
        // Observer l'attribut "open" pour détecter l'ouverture
        const modalObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'open') {
                    if (modale.hasAttribute('open')) {
                        setTimeout(() => {
                            adapterTailleModale(modale, contenu);
                        }, 50);
                    } else {
                        // Nettoyer quand la modale se ferme
                        nettoyerClasses(modale, contenu);
                    }
                }
            });
        });
        
        modalObserver.observe(modale, { attributes: true });
        
        // Écouter la fermeture de la modale
        modale.addEventListener('close', function() {
            nettoyerClasses(modale, contenu);
        });
        
        // Réévaluer la taille lors du redimensionnement de la fenêtre
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (modale.hasAttribute('open')) {
                    adapterTailleModale(modale, contenu);
                }
            }, 200);
        });
        
        console.log('✅ Auto-resize des modales avec tableaux initialisé');
    }
    
    // Initialiser au chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiser);
    } else {
        // Le DOM est déjà chargé
        initialiser();
    }
    
})();