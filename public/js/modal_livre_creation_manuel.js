/**
 * @fileName : modal_livre_creation_manuel.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1.0
 * @dateCreate : 06/02/2026
 * @lastUpdate : 11/02/2026 (ajout de l'entête)
 * @description : Gestion du formulaire de création manuelle d'un livre
 */

/**
 * Initialise le formulaire de création rapide
 * Cette fonction est appelée lorsque le formulaire est chargé dans la modale
 */
function initFormCreationManuelle() {
    const form = document.getElementById('form-quick-create');
    
    if (!form) {
        console.warn('Formulaire #form-quick-create non trouvé');
        return;
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        fetch(this.action, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Fermer la modale
                document.getElementById('modale_principale').close();
                
                // Rediriger ou continuer le processus
                if (typeof continueMouvementProcess === 'function') {
                    continueMouvementProcess(data.id);
                } else {
                    // Afficher un message de succès
                    alert('Livre créé avec succès !');
                    location.reload();
                }
            } else {
                alert(data.message || 'Erreur lors de la création du livre');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Une erreur est survenue');
        });
    });
}

// Observer pour détecter l'ajout du formulaire dans le DOM
document.addEventListener('DOMContentLoaded', function() {
    const contenuModale = document.getElementById('contenu_modale');
    
    if (contenuModale) {
        const observer = new MutationObserver(function(mutations) {
            if (document.getElementById('form-quick-create')) {
                initFormCreationManuelle();
            }
        });
        
        observer.observe(contenuModale, { 
            childList: true, 
            subtree: true 
        });
    }
});
