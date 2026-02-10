/**
 * modal_debut_handler.js
 * Gestion du focus automatique sur le champ ISBN dans la modale de début
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 1.0
 * @date 09/02/2026
 * 
 * Dépendances: fonctions.js (autoFocus)
 */

// ==========================================
// FOCUS AUTOMATIQUE
// ==========================================

/**
 * Observer pour détecter l'ajout du formulaire de scan dans le DOM
 * et mettre le focus automatiquement sur le champ ISBN
 */
document.addEventListener('DOMContentLoaded', function() {
    const contenuModale = document.getElementById('contenu_modale');
    
    if (contenuModale) {
        const observer = new MutationObserver(function(mutations) {
            const isbnInput = document.getElementById('isbnInput');
            if (isbnInput && !isbnInput.dataset.focused) {
                isbnInput.dataset.focused = 'true';
                autoFocus('isbnInput');
            }
        });
        
        observer.observe(contenuModale, { 
            childList: true, 
            subtree: true 
        });
    }
});