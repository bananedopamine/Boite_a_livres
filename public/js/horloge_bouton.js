/**
 * @fileName : horloge_bouton.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 2.1
 * @dateCreate : 06/02/2026
 * @lastUpdate : 11/02/2026
 * @description : Script pour afficher une horloge (Format: hh:mm) sur le bouton Admin
 * 
 */

// Fonction pour mettre à jour l'horloge
function mettreAJourHorloge() {
    const maintenant = new Date();
    const heures = String(maintenant.getHours()).padStart(2, '0');
    const minutes = String(maintenant.getMinutes()).padStart(2, '0');
    const heureFormatee = heures + ':' + minutes;
    
    // Sélectionner le bouton Admin par son ID
    const bouton = document.getElementById('btn-horloge');
    
    if (bouton) {
        bouton.textContent = heureFormatee;
        console.log('Horloge mise à jour:', heureFormatee);
    } else {
        console.error('Bouton #btn-horloge non trouvé !');
    }
}

// Démarrer l'horloge au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script horloge chargé');
    
    // Vérifier que le bouton existe
    const bouton = document.getElementById('btn-horloge');
    
    if (bouton) {
        console.log('Bouton horloge trouvé:', bouton);
        
        // Afficher l'heure immédiatement
        mettreAJourHorloge();
        
        // Mettre à jour l'heure toutes les secondes
        setInterval(mettreAJourHorloge, 1000);
    } else {
        console.error('ERREUR: Le bouton #btn-horloge n\'a pas été trouvé !');
        console.log('Vérifiez que le bouton Admin a bien l\'attribut id="btn-horloge"');
    }
});