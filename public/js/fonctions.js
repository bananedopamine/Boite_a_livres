/**
 * fonctions.js
 * Fichier contenant les fonctions JavaScript réutilisables dans l'application
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 1.0
 * @date 06/02/2026
 */

/**
 * Fonction globale pour ouvrir la modale et charger du contenu
 * Utilisée dans toute l'application pour afficher des modales avec contenu AJAX
 * 
 * @param {string} url - URL à charger dans la modale
 * @returns {Promise<void>}
 */
async function chargerModale(url) {
    const modale = document.getElementById('modale_principale');
    const contenu = document.getElementById('contenu_modale');

    try {
        const reponse = await fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const html = await reponse.text();
        contenu.innerHTML = html;

        if (!modale.open) {
            modale.showModal();
        }
    } catch (erreur) {
        console.error("Erreur de chargement modale :", erreur);
    }
}

/**
 * Ferme la modale principale
 */
function fermerModale() {
    const modale = document.getElementById('modale_principale');
    if (modale) {
        modale.close();
        document.body.classList.remove('modal-open');
    }
}

/**
 * Ouvre la modale de description complète d'un livre
 * 
 * @param {string} description - Texte complet de la description
 */
function openDescriptionModal(description) {
    const modal = document.getElementById('description-modal');
    const content = document.getElementById('description-content');
    
    content.textContent = description || 'Aucune description disponible.';
    modal.showModal();
}

/**
 * Ferme la modale de description
 */
function closeDescriptionModal() {
    const modal = document.getElementById('description-modal');
    if (modal) {
        modal.close();
    }
}

/**
 * Initialise les boutons "Voir plus" pour les descriptions
 * Attache les événements click sur tous les boutons avec la classe .btn-voir-plus
 */
function initVoirPlusButtons() {
    document.querySelectorAll('.btn-voir-plus').forEach(button => {
        button.addEventListener('click', function() {
            const description = this.dataset.fullDescription;
            openDescriptionModal(description);
        });
    });
    console.log('initVoirPlusButtons: ' + document.querySelectorAll('.btn-voir-plus').length + ' bouton(s) initialisé(s)');
}

/**
 * Gère l'interception et la soumission des formulaires dans la modale
 * Soumet les formulaires en AJAX et recharge la page en cas de succès
 */
function initFormulairesModale() {
    document.addEventListener('submit', async (e) => {
        const content = document.getElementById('contenu_modale');
        if (!content || !content.contains(e.target)) return;

        const modal = document.getElementById('modale_principale');
        const form = e.target;
        
        e.preventDefault();
        const formData = new FormData(form);

        if (e.submitter && e.submitter.name) {
            formData.append(e.submitter.name, e.submitter.value);
        }

        const actionUrl = form.getAttribute('action') || window.location.href;

        try {
            const response = await fetch(actionUrl, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.ok) {
                try {
                    const result = await response.json();
                    if (result.success) {
                        fermerModale();
                        window.location.reload(); 
                        return;
                    }
                } catch (jsonErr) {
                    fermerModale();
                    window.location.reload();
                }
            } else if (response.status === 422) {
                content.innerHTML = await response.text();
                // Réinitialiser les boutons "Voir plus" après rechargement du contenu
                setTimeout(function() {
                    initVoirPlusButtons();
                }, 100);
            }
        } catch (err) {
            console.error("Erreur lors de l'envoi du formulaire:", err);
        }
    });
}

/**
 * Configure un MutationObserver pour détecter les changements dans la modale
 * Réinitialise les boutons "Voir plus" quand du nouveau contenu est chargé
 */
function initObservateurModale() {
    const contenuModale = document.getElementById('contenu_modale');
    
    if (contenuModale) {
        console.log('MutationObserver: Attaché à #contenu_modale');
        
        const observer = new MutationObserver(function(mutations) {
            const voirPlusButtons = document.querySelectorAll('.btn-voir-plus');
            if (voirPlusButtons.length > 0) {
                console.log('MutationObserver: Détection de ' + voirPlusButtons.length + ' bouton(s) "Voir plus"');
                setTimeout(function() {
                    initVoirPlusButtons();
                }, 100);
            }
        });
        
        observer.observe(contenuModale, { 
            childList: true, 
            subtree: true 
        });
    } else {
        console.error('ERREUR: #contenu_modale n\'existe pas !');
    }
}

/**
 * Initialise la fermeture de modale sur clic à l'extérieur
 * 
 * @param {string} modalId - ID de la modale à configurer
 */
function initFermetureClicExterieur(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.close();
            }
        });
        console.log(`Event listener: Fermeture sur clic extérieur attaché à #${modalId}`);
    }
}
