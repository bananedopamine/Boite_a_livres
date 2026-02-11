/**
 * @fileName : modal_handler.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 3.0
 * @dateCreate : 28/01/2026
 * @lastUpdate : 11/02/2026 (ajout de l'entête)
 * @description : Gestion unifiée des modales avec fix scroll et interception des boutons
 */


/* ===================================
   FONCTIONS PRINCIPALES
   ================================== */

/**
 * Fonction principale pour charger une modale via AJAX
 * @param {string} url - L'URL à charger dans la modale
 */
function chargerModale(url) {
    // Bloquer le scroll du body
    document.body.classList.add('modal-open');
    
    fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.text())
    .then(html => {
        document.getElementById('contenu_modale').innerHTML = html;
        const modal = document.getElementById('modale_principale');
        if (modal && !modal.open) {
            modal.showModal();
        }
        
        // Attacher automatiquement les événements aux boutons Modifier
        attacherEvenementBoutonModifier();
    })
    .catch(error => {
        console.error('Erreur lors du chargement de la modale:', error);
        document.body.classList.remove('modal-open');
    });
}

/**
 * Fonction pour fermer proprement la modale
 */
function fermerModale() {
    const modal = document.getElementById('modale_principale');
    if (modal) {
        modal.close();
        document.body.classList.remove('modal-open');
    }
}

/**
 * Attache un événement click au bouton Modifier pour ouvrir une modale AJAX
 * Cette fonction intercepte les clics sur les boutons "Modifier" et les transforme en appels AJAX
 */
function attacherEvenementBoutonModifier() {
    // Chercher tous les liens/boutons "Modifier" dans la modale
    const boutonsModifier = document.querySelectorAll(
        '#contenu_modale a[href*="/edit"], ' +
        '#contenu_modale button[data-modal-url*="/edit"]'
    );
    
    boutonsModifier.forEach(bouton => {
        // Vérifier si l'événement n'est pas déjà attaché
        if (!bouton.dataset.modalHandlerAttached) {
            bouton.dataset.modalHandlerAttached = 'true';
            
            bouton.addEventListener('click', function(e) {
                e.preventDefault();

                const url = this.href || this.dataset.modalUrl;
                
                // Utiliser la fonction chargerModale
                if (typeof chargerModale === 'function') {
                    chargerModale(url);
                } else {
                    console.error('La fonction chargerModale() n\'est pas définie');
                }
            });
        }
    });
}

/* ===================================
   INITIALISATION AU CHARGEMENT
   ================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    /* ---------------------------------
       GESTION DE LA MODALE PRINCIPALE
       --------------------------------- */
    const modal = document.getElementById('modale_principale');
    
    if (modal) {
        // Événement : Quand on ouvre la modale
        modal.addEventListener('open', function() {
            document.body.classList.add('modal-open');
        });
        
        // Événement : Quand on ferme la modale
        modal.addEventListener('close', function() {
            document.body.classList.remove('modal-open');
        });
        
        // Observer les changements d'attribut "open"
        const modalObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'open') {
                    if (modal.hasAttribute('open')) {
                        document.body.classList.add('modal-open');
                    } else {
                        document.body.classList.remove('modal-open');
                    }
                }
            });
        });
        
        modalObserver.observe(modal, { attributes: true });
        
        // Fermeture en cliquant sur le backdrop (zone noire autour de la modale)
        modal.addEventListener('click', function(event) {
            const rect = modal.getBoundingClientRect();
            const isInDialog = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );
            
            if (!isInDialog) {
                modal.close();
                document.body.classList.remove('modal-open');
            }
        });
    }
    
    /* ---------------------------------
       GESTION DU CONTENU DE LA MODALE
       --------------------------------- */
    const contenuModale = document.getElementById('contenu_modale');
    
    if (contenuModale) {
        // ✅ NOUVEAU : Observer les changements de contenu pour attacher automatiquement les événements
        const contentObserver = new MutationObserver(function(mutations) {
            // Vérifier si du nouveau contenu a été ajouté
            let hasNewContent = false;
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    hasNewContent = true;
                }
            });
            
            // Si du nouveau contenu a été ajouté, attacher les événements
            if (hasNewContent) {
                // Petit délai pour s'assurer que le DOM est stable
                setTimeout(function() {
                    attacherEvenementBoutonModifier();
                }, 50);
            }
        });
        
        // Observer les changements dans le contenu de la modale
        contentObserver.observe(contenuModale, { 
            childList: true, 
            subtree: true 
        });
        
        // Empêcher le scroll du body quand on scroll dans la modale
        contenuModale.addEventListener('wheel', function(e) {
            const isScrollable = contenuModale.scrollHeight > contenuModale.clientHeight;
            
            // Si le contenu n'est pas scrollable, empêcher le scroll
            if (!isScrollable) {
                e.preventDefault();
                return;
            }
            
            const isAtTop = contenuModale.scrollTop === 0;
            const isAtBottom = contenuModale.scrollTop + contenuModale.clientHeight >= contenuModale.scrollHeight;
            
            // Empêcher le scroll du body si on est en haut et qu'on scroll vers le haut
            // ou si on est en bas et qu'on scroll vers le bas
            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                e.preventDefault();
            }
        }, { passive: false });
    }
});

/* ===================================
   EXPORT GLOBAL
   ================================== */

// Rendre les fonctions accessibles globalement
window.chargerModale = chargerModale;
window.fermerModale = fermerModale;
window.attacherEvenementBoutonModifier = attacherEvenementBoutonModifier;
