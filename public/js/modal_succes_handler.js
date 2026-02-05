/**
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1.0
 * @dateCreate : 02/02/2026
 * @description : Gestionnaire de la modale de succès après opération d'entrée/sortie
 */

let timerSucces = null;
let countdownSucces = 8;

/**
 * Affiche la modale de succès avec les informations de l'opération
 * @param {Object} data - Données de l'opération (livre, type, utilisateur, stock)
 */
function afficherModaleSucces(data) {
    const modale = document.getElementById('modale_succes');
    if (!modale) {
        console.error('Modale de succès non trouvée');
        return;
    }

    // Remplir les informations
    const typeActionElement = document.getElementById('succes-type-action');
    const nomPrenomElement = document.getElementById('succes-nom-prenom');
    const titreLivreElement = document.getElementById('succes-titre-livre');
    const isbnLivreElement = document.getElementById('succes-isbn-livre');
    const nouveauStockElement = document.getElementById('succes-nouveau-stock');
    
    // Type d'action (Entrée ou Sortie)
    const estSortie = data.type === 'true' || data.type === true;
    if (typeActionElement) {
        typeActionElement.textContent = estSortie ? "L'emprunt" : "Le depôt";
        typeActionElement.className = estSortie ? 'action-sortie' : 'action-entree';
    }
    
    // Nom de la personne
    if (nomPrenomElement) {
        nomPrenomElement.textContent = data.nomPrenom || 'Utilisateur';
    }
    
    // Informations du livre
    if (titreLivreElement) {
        titreLivreElement.textContent = data.livre?.titre || 'Titre inconnu';
    }
    
    if (isbnLivreElement) {
        isbnLivreElement.textContent = data.livre?.isbn || 'ISBN inconnu';
    }
    
    // Stock avec badge coloré
    if (nouveauStockElement) {
        nouveauStockElement.textContent = data.livre?.stock !== undefined ? data.livre.stock : '?';
        
        // Déterminer la couleur du badge selon le stock
        nouveauStockElement.className = 'badge';
        if (data.livre?.stock > 5) {
            nouveauStockElement.classList.add('bg-success');
        } else if (data.livre?.stock > 0) {
            nouveauStockElement.classList.add('bg-warning');
        } else {
            nouveauStockElement.classList.add('bg-danger');
        }
    }

    // Réinitialiser le countdown
    countdownSucces = 8;
    updateCountdown();

    // Bloquer le scroll du body
    document.body.classList.add('modal-succes-open');

    // Ouvrir la modale
    modale.showModal();

    // Démarrer le timer
    demarrerTimerSucces();
}

/**
 * Met à jour l'affichage du countdown
 */
function updateCountdown() {
    const countdownElement = document.getElementById('timer-countdown');
    if (countdownElement) {
        countdownElement.textContent = countdownSucces;
    }
}

/**
 * Démarre le timer de fermeture automatique
 */
function demarrerTimerSucces() {
    // Nettoyer l'ancien timer si existant
    if (timerSucces) {
        clearInterval(timerSucces);
    }
    // Créer un nouveau timer
    timerSucces = setInterval(() => {
        countdownSucces--;
        updateCountdown();
        if (countdownSucces <= 0) {
            clearInterval(timerSucces);
            fermerModaleSucces();
        }
    }, 1000);
}

/**
 * Arrête le timer
 */
function arreterTimerSucces() {
    if (timerSucces) {
        clearInterval(timerSucces);
        timerSucces = null;
    }
}

/**
 * Ferme la modale de succès
 */
function fermerModaleSucces() {
    const modale = document.getElementById('modale_succes');
    if (!modale) return;

    // Arrêter le timer
    arreterTimerSucces();

    // Ajouter classe d'animation de fermeture
    modale.classList.add('closing');

    // Attendre la fin de l'animation
    setTimeout(() => {
        modale.close();
        modale.classList.remove('closing');
        document.body.classList.remove('modal-succes-open');
        
        // Recharger la page pour mettre à jour les tableaux
        window.location.reload();
    }, 300);
}

/**
 * Initialisation des événements de la modale
 */
document.addEventListener('DOMContentLoaded', function() {
    const modale = document.getElementById('modale_succes');
    
    if (modale) {
        // Quand la modale se ferme (par Escape ou backdrop)
        modale.addEventListener('close', function() {
            arreterTimerSucces();
            document.body.classList.remove('modal-succes-open');
        });

        // Observer les changements d'attribut "open"
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'open') {
                    if (!modale.hasAttribute('open')) {
                        arreterTimerSucces();
                        document.body.classList.remove('modal-succes-open');
                    }
                }
            });
        });
        
        observer.observe(modale, { attributes: true });

        // Empêcher la fermeture en cliquant sur le backdrop
        // (on veut forcer l'utilisateur à voir le message)
        modale.addEventListener('click', function(event) {
            // Ne rien faire - on garde la modale ouverte
            event.stopPropagation();
        });
    }
});

// Export des fonctions pour utilisation globale
window.afficherModaleSucces = afficherModaleSucces;
window.fermerModaleSucces = fermerModaleSucces;
window.arreterTimerSucces = arreterTimerSucces;
