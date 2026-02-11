/**
 * @fileName : modal_livre_not_found.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1.0
 * @dateCreate : 06/02/2026
 * @lastUpdate : 11/02/2026 (ajout de l'entête)
 * @description : Gestion de la modale "Livre introuvable", contient les fonctions pour gérer les actions de la modale 404
 */


/**
 * Ouvre la modale de création rapide avec l'ISBN prérempli
 * 
 * @param {string} isbn - ISBN du livre à créer
 */
function ouvrirCreationRapide(isbn) {
    // Cette fonction doit être implémentée selon votre logique métier
    // Elle charge la modale de création rapide avec l'ISBN fourni
    const url = `/livre/creation-rapide?isbn=${isbn}`;
    
    if (typeof chargerModale === 'function') {
        chargerModale(url);
    } else {
        console.error('Fonction chargerModale non disponible');
    }
}

/**
 * Réouvre la modale de scan pour réessayer
 * 
 * @param {string} typeAction - Type d'action (entrée/sortie)
 */
function ouvrirScan(typeAction) {
    // Cette fonction doit être implémentée selon votre logique métier
    // Elle réouvre l'interface de scan
    const url = `/mouvement/debut?action=${typeAction}`;
    
    if (typeof chargerModale === 'function') {
        chargerModale(url);
    } else {
        console.error('Fonction chargerModale non disponible');
    }
}
