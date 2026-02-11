/**
 * @fileName : settings_validation.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1.0
 * @dateCreate : 09/02/2026
 * @lastUpdate : 11/02/2026 (ajout de l'entête)
 * @description : Validation côté client pour les paramètres admin
 */

// ==========================================
// VALIDATION DU FORMULAIRE PIN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action*="settings"]');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            const newPin = document.getElementById('new_pin');
            const confirmPin = document.getElementById('confirm_pin');
            
            if (!newPin || !confirmPin) {
                return; // Les champs n'existent pas, on laisse passer
            }

            if (newPin.value !== confirmPin.value) {
                e.preventDefault();
                alert('Les deux codes PIN ne correspondent pas !');
                confirmPin.focus();
                return false;
            }
        });
    }
});
