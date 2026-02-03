/* ===================================
   GESTION DES MODALS - FIX SCROLL
   ================================== */

/**
 * Fonction utilitaire pour charger une modale
 * (à adapter selon votre code existant)
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
    })
    .catch(error => {
        console.error('Erreur lors du chargement de la modale:', error);
        document.body.classList.remove('modal-open');
    });
}

/**
 * Observer pour détecter quand la modale est fermée
 */
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modale_principale');
    
    if (modal) {
        // Quand on ouvre la modale
        modal.addEventListener('open', function() {
            document.body.classList.add('modal-open');
        });
        
        // Quand on ferme la modale
        modal.addEventListener('close', function() {
            document.body.classList.remove('modal-open');
        });
        
        // Observer les changements d'attribut "open"
        const observer = new MutationObserver(function(mutations) {
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
        
        observer.observe(modal, { attributes: true });
        
        // Fermeture en cliquant sur le backdrop
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
});

/**
 * Empêcher le scroll du body quand on scroll dans la modale
 */
document.addEventListener('DOMContentLoaded', function() {
    const contenuModale = document.getElementById('contenu_modale');
    
    if (contenuModale) {
        contenuModale.addEventListener('wheel', function(e) {
            const isScrollable = contenuModale.scrollHeight > contenuModale.clientHeight;
            
            if (!isScrollable) {
                e.preventDefault();
                return;
            }
            
            const isAtTop = contenuModale.scrollTop === 0;
            const isAtBottom = contenuModale.scrollTop + contenuModale.clientHeight >= contenuModale.scrollHeight;
            
            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                e.preventDefault();
            }
        }, { passive: false });
    }
});

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

// Export pour utilisation globale
window.chargerModale = chargerModale;
window.fermerModale = fermerModale;
