/**
 * fonctions.js
 * Fichier contenant toutes les fonctions JavaScript réutilisables dans l'application
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 3.0
 * @date 09/02/2026
 */

// ==========================================
// GESTION DES MODALES PRINCIPALES
// ==========================================

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

// ==========================================
// GESTION DES MODALES SPÉCIFIQUES
// ==========================================

/**
 * Charge du contenu dans la modale de mouvement
 * 
 * @param {string} url - URL à charger
 * @returns {Promise<void>}
 */
async function loadToMouvementModal(url) {
    const modal = document.getElementById('mouvement-modal');
    const content = document.getElementById('mouvement-modal-content');
    
    try {
        const response = await fetch(url, {
           headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const html = await response.text();
        content.innerHTML = html;
        
        if (modal && !modal.open) {
            modal.showModal();
        }
    } catch (err) {
        console.error('Erreur de chargement Mouvement :', err);
    }
}

/**
 * Ouvre la modale de filtres
 */
function ouvrirModaleFiltres() {
    const modale = document.getElementById('modale_filtres');
    if (modale) {
        modale.showModal();
    }
}

/**
 * Ferme la modale de filtres
 */
function fermerModaleFiltres() {
    const modale = document.getElementById('modale_filtres');
    if (modale) {
        modale.close();
    }
}

// ==========================================
// GESTION DES DESCRIPTIONS
// ==========================================

/**
 * Ouvre la modale de description complète d'un livre
 * 
 * @param {string} description - Texte complet de la description
 */
function openDescriptionModal(description) {
    const modal = document.getElementById('description-modal');
    const content = document.getElementById('description-content');
    
    if (modal && content) {
        content.textContent = description || 'Aucune description disponible.';
        modal.showModal();
    }
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
}

// ==========================================
// GESTION DES FORMULAIRES
// ==========================================

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
                setTimeout(function() {
                    initVoirPlusButtons();
                }, 100);
            }
        } catch (err) {
            console.error("Erreur lors de l'envoi du formulaire:", err);
        }
    });
}

// ==========================================
// OBSERVERS ET ÉVÉNEMENTS
// ==========================================

/**
 * Configure un MutationObserver pour détecter les changements dans la modale
 */
function initObservateurModale() {
    const contenuModale = document.getElementById('contenu_modale');
    
    if (contenuModale) {
        
        const observer = new MutationObserver(function(mutations) {
            const voirPlusButtons = document.querySelectorAll('.btn-voir-plus');
            if (voirPlusButtons.length > 0) {
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
    }
}

// ==========================================
// GESTION DES FOCUS
// ==========================================

/**
 * Met le focus sur un élément après un court délai
 * Utilisé pour les inputs dans les modales
 * 
 * @param {string} elementId - ID de l'élément à focus
 * @param {number} delay - Délai en ms (défaut: 100)
 */
function autoFocus(elementId, delay = 100) {
    setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
            element.focus();
        }
    }, delay);
}

// ==========================================
// FILTRES
// ==========================================

/**
 * Réinitialise tous les filtres
 */
function reinitialiserFiltres() {
    const form = document.getElementById('form-filtres');
    if (form) {
        form.reset();
        if (typeof appliquerFiltres === 'function') {
            appliquerFiltres();
        }
    }
}

/**
 * Met à jour le badge du compteur de filtres actifs
 * 
 * @param {number} count - Nombre de filtres actifs
 */
function updateFilterBadge(count) {
    const badges = document.querySelectorAll('#filter-count-badge, .filter-count-badge');
    badges.forEach(badge => {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

/**
 * Compte le nombre de filtres actifs dans un formulaire
 * 
 * @returns {number} - Nombre de filtres actifs
 */
function compterFiltresActifs() {
    const form = document.getElementById('form-filtres');
    if (!form) return 0;
    
    let count = 0;
    const inputs = form.querySelectorAll('input[type="text"], input[type="number"], select');
    
    inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
            count++;
        }
    });
    
    return count;
}

// ==========================================
// UTILITAIRES D'AFFICHAGE
// ==========================================

/**
 * Affiche un message d'erreur
 * 
 * @param {string} message - Message à afficher
 * @param {string} containerId - ID du conteneur d'erreur
 */
function afficherErreur(message, containerId = 'message-erreur') {
    const container = document.getElementById(containerId);
    const textContainer = document.getElementById('texte-' + containerId);
    
    if (container && textContainer) {
        textContainer.textContent = message;
        container.style.display = 'block';
    } else {
        console.error('Conteneur d\'erreur non trouvé:', containerId);
    }
}

/**
 * Masque le message d'erreur
 * 
 * @param {string} containerId - ID du conteneur d'erreur
 */
function masquerErreur(containerId = 'message-erreur') {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Affiche/masque un indicateur de chargement
 * 
 * @param {boolean} show - true pour afficher, false pour masquer
 * @param {string} loaderId - ID de l'indicateur de chargement
 */
function toggleLoading(show, loaderId = 'loading-indicator') {
    const loader = document.getElementById(loaderId);
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

// ==========================================
// UTILITAIRES DE FORMATAGE
// ==========================================

/**
 * Formatte une date au format français
 * 
 * @param {Date|string} date - Date à formater
 * @returns {string} - Date formatée (JJ/MM/AAAA HH:MM)
 */
function formatDateFr(date) {
    const d = new Date(date);
    const jour = String(d.getDate()).padStart(2, '0');
    const mois = String(d.getMonth() + 1).padStart(2, '0');
    const annee = d.getFullYear();
    const heures = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${jour}/${mois}/${annee} ${heures}:${minutes}`;
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 * 
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Débounce une fonction (évite les appels trop fréquents)
 * 
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Délai en millisecondes
 * @returns {Function} - Fonction debouncée
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}