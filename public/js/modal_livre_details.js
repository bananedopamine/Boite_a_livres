/**
 * modal_livre_details.js
 * Gestion de la modale de détails des livres et de la modale de description
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 1.0
 * @date 06/02/2026
 * 
 * Dépendances: fonctions.js (chargerModale, openDescriptionModal, closeDescriptionModal, 
 *              initVoirPlusButtons, initObservateurModale, initFermetureClicExterieur, 
 *              initFormulairesModale)
 */

document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // INITIALISATION DE L'OBSERVATEUR
    // ==========================================
    if (typeof initObservateurModale === 'function') {
        initObservateurModale();
    }
    
    // ==========================================
    // FERMETURE SUR CLIC EXTÉRIEUR
    // ==========================================
    if (typeof initFermetureClicExterieur === 'function') {
        initFermetureClicExterieur('description-modal');
    }
    
    // ==========================================
    // INITIALISATION DES FORMULAIRES
    // ==========================================
    if (typeof initFormulairesModale === 'function') {
        initFormulairesModale();
    }
});
