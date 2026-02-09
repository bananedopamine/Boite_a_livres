/**
 * @author : Dufour Marc
 * @version : 2.0
 * @lastUpdate : 09/02/2026 (Extraction HTML dans templates)
 * @description : Gestionnaire de modale de filtres pour les MOUVEMENTS (sans filtres de stock)
 * 
 * MODIFICATIONS v2.0 :
 * - Utilisation de createFilterTagFromTemplate() au lieu de string HTML
 * - Code plus propre et maintenable
 */


/* ===================================
   GESTION DE LA MODALE DE FILTRES MOUVEMENTS
   ================================== */

/**
 * Ouvre la modale de filtres
 */
function ouvrirModaleFiltres() {
    const modal = document.getElementById('modale_filtres');
    if (modal) {
        // Bloquer le scroll du body
        document.body.classList.add('modal-open');
        modal.showModal();
    }
}

/**
 * Ferme la modale de filtres
 */
function fermerModaleFiltres() {
    const modal = document.getElementById('modale_filtres');
    if (modal) {
        modal.close();
        document.body.classList.remove('modal-open');
    }
}

/**
 * Applique les filtres et ferme la modale
 */
function appliquerFiltres() {
    // Mettre à jour les critères de recherche depuis les champs du formulaire
    if (typeof majCriteres === 'function') {
        majCriteres();
    } else {
        // Mise à jour manuelle si la fonction n'existe pas
        updateCriteresFromForm();
    }
    
    // Lancer la recherche
    if (typeof chargerMouvements === 'function') {
        chargerMouvements();
    }
    
    // Mettre à jour l'affichage des filtres actifs
    afficherFiltresActifs();
    
    // Fermer la modale
    fermerModaleFiltres();
}

/**
 * Réinitialise tous les filtres
 */
function reinitialiserFiltres() {
    // Réinitialiser le formulaire
    const form = document.getElementById('form-filtres');
    if (form) {
        form.reset();
    }
    
    // Réinitialiser l'objet critereRecherche
    if (typeof critereRecherche !== 'undefined') {
        critereRecherche.isbn = '';
        critereRecherche.auteur = '';
        critereRecherche.user = '';
        critereRecherche.type = '';
        critereRecherche.tri = 'DESC';
    }
    
    // Recharger les données
    if (typeof chargerMouvements === 'function') {
        chargerMouvements();
    }
    
    // Mettre à jour l'affichage des filtres actifs
    afficherFiltresActifs();
    
    // Fermer la modale
    fermerModaleFiltres();
}

/**
 * Mise à jour manuelle des critères depuis le formulaire
 */
function updateCriteresFromForm() {
    const isbn   = document.getElementById('filter-isbn')?.value.trim() || '';
    const auteur = document.getElementById('filter-auteur')?.value.trim() || '';
    const user   = document.getElementById('filter-user')?.value.trim() || '';
    const type   = document.getElementById('filter-type')?.value || '';
    const tri    = document.getElementById('filter-tri')?.value || 'DESC';
    
    // Mettre à jour l'objet global critereRecherche si il existe
    if (typeof critereRecherche !== 'undefined') {
        critereRecherche.isbn = isbn;
        critereRecherche.auteur = auteur;
        critereRecherche.user = user;
        critereRecherche.type = type;
        critereRecherche.tri = tri;
    }
}

/**
 * Affiche les filtres actuellement actifs sous forme de badges
 * VERSION MOUVEMENTS : Pas de filtres de stock !
 * ✅ UTILISE MAINTENANT createFilterTagFromTemplate() au lieu de string HTML
 */
function afficherFiltresActifs() {
    const container = document.getElementById('active-filters-container');
    if (!container) return;
    
    container.innerHTML = '';
    let count = 0;
    
    if (typeof critereRecherche !== 'undefined') {
        // Vérifier que la fonction est disponible
        if (typeof createFilterTagFromTemplate !== 'function') {
            console.error('❌ createFilterTagFromTemplate() non disponible !');
            console.error('Vérifiez que template_helpers.js est bien chargé');
            console.error('Et que _templates_global.html.twig est inclus dans base.html.twig');
            return;
        }
        
        // ISBN
        if (critereRecherche.isbn) {
            const badge = createFilterTagFromTemplate('ISBN', critereRecherche.isbn, 'isbn');
            appendFilterBadge(container, badge);
            count++;
        }
        
        // Auteur
        if (critereRecherche.auteur) {
            const badge = createFilterTagFromTemplate('Auteur', critereRecherche.auteur, 'auteur');
            appendFilterBadge(container, badge);
            count++;
        }
        
        // Utilisateur/Personne
        if (critereRecherche.user) {
            const badge = createFilterTagFromTemplate('Personne', critereRecherche.user, 'user');
            appendFilterBadge(container, badge);
            count++;
        }
        
        // Type (Entrée/Sortie)
        if (critereRecherche.type) {
            const typeLabel = critereRecherche.type === 'entree' ? 'Entrées' : 'Sorties';
            const badge = createFilterTagFromTemplate('Type', typeLabel, 'type');
            appendFilterBadge(container, badge);
            count++;
        }
        
        // ✅ PAS DE FILTRE STOCK ICI (contrairement au fichier livres)
    }
    
    // Mettre à jour le badge de compteur
    const badge = document.getElementById('filter-count-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Supprime un filtre spécifique
 */
function supprimerFiltre(key) {
    if (typeof critereRecherche !== 'undefined') {
        critereRecherche[key] = '';
        
        // Mettre à jour le champ correspondant dans le formulaire
        const inputIds = {
            'isbn': 'filter-isbn',
            'auteur': 'filter-auteur',
            'user': 'filter-user',
            'type': 'filter-type'
        };
        
        const inputId = inputIds[key];
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    }
    
    // Recharger les données
    if (typeof chargerMouvements === 'function') {
        chargerMouvements();
    }
    
    // Mettre à jour l'affichage
    afficherFiltresActifs();
}

/**
 * Synchronise les valeurs du formulaire avec critereRecherche au chargement
 */
function synchroniserFormulaireFiltres() {
    if (typeof critereRecherche === 'undefined') return;
    
    // ISBN
    const isbnInput = document.getElementById('filter-isbn');
    if (isbnInput) {
        isbnInput.value = critereRecherche.isbn || '';
    }
    
    // Auteur
    const auteurInput = document.getElementById('filter-auteur');
    if (auteurInput) {
        auteurInput.value = critereRecherche.auteur || '';
    }
    
    // Utilisateur
    const userInput = document.getElementById('filter-user');
    if (userInput) {
        userInput.value = critereRecherche.user || '';
    }
    
    // Type
    const typeSelect = document.getElementById('filter-type');
    if (typeSelect) {
        typeSelect.value = critereRecherche.type || '';
    }
    
    // Tri
    const triSelect = document.getElementById('filter-tri');
    if (triSelect) {
        triSelect.value = critereRecherche.tri || 'DESC';
    }
}

/* ===================================
   INITIALISATION
   ================================== */

document.addEventListener('DOMContentLoaded', function() {
    const modalFiltres = document.getElementById('modale_filtres');
    
    if (modalFiltres) {
        // Gestion de la fermeture de la modale
        modalFiltres.addEventListener('close', function() {
            document.body.classList.remove('modal-open');
        });
        
        // Observer les changements d'attribut "open"
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'open') {
                    if (modalFiltres.hasAttribute('open')) {
                        document.body.classList.add('modal-open');
                        // Synchroniser le formulaire avec les valeurs actuelles
                        synchroniserFormulaireFiltres();
                    } else {
                        document.body.classList.remove('modal-open');
                    }
                }
            });
        });
        
        observer.observe(modalFiltres, { attributes: true });
        
        // Fermeture en cliquant sur le backdrop
        modalFiltres.addEventListener('click', function(event) {
            const rect = modalFiltres.getBoundingClientRect();
            const isInDialog = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );
            
            if (!isInDialog) {
                fermerModaleFiltres();
            }
        });
    }
    
    // Gestion du formulaire de filtres
    const formFiltres = document.getElementById('form-filtres');
    if (formFiltres) {
        formFiltres.addEventListener('submit', function(e) {
            e.preventDefault();
            appliquerFiltres();
        });
    }
    
    // Afficher les filtres actifs au chargement
    afficherFiltresActifs();
});

// Export des fonctions pour utilisation globale
window.ouvrirModaleFiltres = ouvrirModaleFiltres;
window.fermerModaleFiltres = fermerModaleFiltres;
window.appliquerFiltres = appliquerFiltres;
window.reinitialiserFiltres = reinitialiserFiltres;
window.supprimerFiltre = supprimerFiltre;
window.afficherFiltresActifs = afficherFiltresActifs;
