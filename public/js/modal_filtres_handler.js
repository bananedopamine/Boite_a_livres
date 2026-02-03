/**
 * @author : Dufour Marc
 * @version : 1.0
 * @description : Gestionnaire de modale de filtres pour les tableaux
 */

/* ===================================
   GESTION DE LA MODALE DE FILTRES
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
    if (typeof chargerLivres === 'function') {
        chargerLivres();
    } else if (typeof chargerMouvements === 'function') {
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
        Object.keys(critereRecherche).forEach(key => {
            if (key === 'tri') {
                critereRecherche[key] = 'DESC'; // Valeur par défaut pour le tri
            } else {
                critereRecherche[key] = '';
            }
        });
    }
    
    // Recharger les données
    if (typeof chargerLivres === 'function') {
        chargerLivres();
    } else if (typeof chargerMouvements === 'function') {
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
        if (user !== undefined) critereRecherche.user = user;
        if (type !== undefined) critereRecherche.type = type;
        if (tri !== undefined) critereRecherche.tri = tri;
    }
}

/**
 * Affiche les filtres actuellement actifs sous forme de badges
 */
function afficherFiltresActifs() {
    const container = document.getElementById('active-filters-container');
    if (!container) return;
    
    container.innerHTML = '';
    let count = 0;
    
    if (typeof critereRecherche !== 'undefined') {
        // ISBN
        if (critereRecherche.isbn) {
            container.innerHTML += createFilterTag('ISBN', critereRecherche.isbn, 'isbn');
            count++;
        }
        
        // Auteur
        if (critereRecherche.auteur) {
            container.innerHTML += createFilterTag('Auteur', critereRecherche.auteur, 'auteur');
            count++;
        }
        
        // Utilisateur (pour mouvements)
        if (critereRecherche.user) {
            container.innerHTML += createFilterTag('Personne', critereRecherche.user, 'user');
            count++;
        }
        
        // Type (pour mouvements)
        if (critereRecherche.type) {
            const typeLabel = critereRecherche.type === 'entree' ? 'Entrées' : 'Sorties';
            container.innerHTML += createFilterTag('Type', typeLabel, 'type');
            count++;
        }
        
        // Tri (ne compte pas comme filtre actif mais on peut l'afficher)
        if (critereRecherche.tri && critereRecherche.tri !== 'DESC') {
            const triLabel = critereRecherche.tri === 'ASC' ? 'Croissant' : 'Décroissant';
            container.innerHTML += createFilterTag('Tri', triLabel, 'tri');
        }
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
 * Crée un badge de filtre actif
 */
function createFilterTag(label, value, key) {
    return `
        <span class="filter-tag">
            <strong>${label}:</strong> ${value}
            <button onclick="supprimerFiltre('${key}')" title="Supprimer ce filtre">×</button>
        </span>
    `;
}

/**
 * Supprime un filtre spécifique
 */
function supprimerFiltre(key) {
    if (typeof critereRecherche !== 'undefined') {
        if (key === 'tri') {
            critereRecherche[key] = 'DESC';
        } else {
            critereRecherche[key] = '';
        }
        
        // Mettre à jour le champ correspondant dans le formulaire
        const inputId = 'filter-' + key;
        const input = document.getElementById(inputId);
        if (input) {
            if (input.tagName === 'SELECT') {
                input.value = key === 'tri' ? 'DESC' : '';
            } else {
                input.value = '';
            }
        }
    }
    
    // Recharger les données
    if (typeof chargerLivres === 'function') {
        chargerLivres();
    } else if (typeof chargerMouvements === 'function') {
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
    if (isbnInput && critereRecherche.isbn) {
        isbnInput.value = critereRecherche.isbn;
    }
    
    // Auteur
    const auteurInput = document.getElementById('filter-auteur');
    if (auteurInput && critereRecherche.auteur) {
        auteurInput.value = critereRecherche.auteur;
    }
    
    // Utilisateur
    const userInput = document.getElementById('filter-user');
    if (userInput && critereRecherche.user) {
        userInput.value = critereRecherche.user;
    }
    
    // Type
    const typeSelect = document.getElementById('filter-type');
    if (typeSelect && critereRecherche.type) {
        typeSelect.value = critereRecherche.type;
    }
    
    // Tri
    const triSelect = document.getElementById('filter-tri');
    if (triSelect && critereRecherche.tri) {
        triSelect.value = critereRecherche.tri;
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
