/**
 * template_helpers.js
 * Fonctions d'aide pour manipuler les templates HTML5
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 1.0
 * @date 09/02/2026
 * 
 * Intégration avec le projet existant :
 * - S'intègre avec fonctions.js (escapeHtml, debounce)
 * - Compatible avec modal_handler.js
 * - Fonctionne avec les tableaux dynamiques existants
 */

/**
 * Crée un badge de filtre à partir du template HTML5
 * 
 * @param {string} label - Label du filtre (ex: "ISBN", "Auteur")
 * @param {string} value - Valeur du filtre
 * @param {string} key - Clé pour suppression
 * @returns {DocumentFragment|string} Fragment HTML ou string en fallback
 */
function createFilterTagFromTemplate(label, value, key) {
    const template = document.getElementById('filter-tag-template');
    
    // Fallback si template non disponible
    if (!template) {
        console.warn('Template filter-tag-template non trouvé, utilisation du fallback');
        return createFilterTagFallback(label, value, key);
    }
    
    const clone = template.content.cloneNode(true);
    
    // Remplir les données
    const labelElement = clone.querySelector('[data-slot="label"]');
    if (labelElement) {
        labelElement.textContent = label + ':';
    }
    
    const valueElement = clone.querySelector('[data-slot="value"]');
    if (valueElement) {
        valueElement.textContent = value;
    }
    
    // Configurer le bouton de suppression
    const button = clone.querySelector('[data-action="remove"]');
    if (button) {
        button.dataset.key = key;
        button.setAttribute('aria-label', `Supprimer le filtre ${label}`);
        
        // Attacher l'événement
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof supprimerFiltre === 'function') {
                supprimerFiltre(key);
            } else {
                console.error('Fonction supprimerFiltre non définie');
            }
        });
    }
    
    return clone;
}

/**
 * Fallback : Crée un badge en HTML brut si template non disponible
 */
function createFilterTagFallback(label, value, key) {
    // Utiliser escapeHtml de fonctions.js si disponible
    const escape = typeof escapeHtml === 'function' ? escapeHtml : (t) => t;
    
    return `
        <span class="filter-tag">
            <strong>${escape(label)}:</strong> ${escape(value)}
            <button type="button" 
                    onclick="supprimerFiltre('${escape(key)}')" 
                    class="filter-tag-remove"
                    title="Supprimer ce filtre">
                ×
            </button>
        </span>
    `;
}

/**
 * Ajoute un badge au conteneur (gère Fragment et string)
 * 
 * @param {HTMLElement} container - Conteneur parent
 * @param {DocumentFragment|string} badge - Badge à ajouter
 */
function appendFilterBadge(container, badge) {
    if (badge instanceof DocumentFragment || badge instanceof Node) {
        container.appendChild(badge);
    } else if (typeof badge === 'string') {
        container.innerHTML += badge;
    } else {
        console.error('Type de badge non supporté:', typeof badge);
    }
}

/**
 * Crée une ligne de tableau livre à partir du template
 * 
 * @param {object} livre - Données du livre
 * @param {boolean} isAdmin - Afficher colonne admin
 * @param {string} urlTemplate - Template d'URL avec __ID__
 * @returns {DocumentFragment|null}
 */
function createLivreRowFromTemplate(livre, isAdmin, urlTemplate) {
    const template = document.getElementById('livre-row-template');
    
    if (!template) {
        console.error('Template livre-row-template non trouvé');
        return null;
    }
    
    const clone = template.content.cloneNode(true);
    const tr = clone.querySelector('tr');
    
    // URL pour ce livre
    const urlDetail = urlTemplate.replace('__ID__', livre.id);
    tr.dataset.url = urlDetail;
    
    // Remplir ISBN
    const isbnCell = tr.querySelector('[data-slot="isbn"]');
    if (isbnCell) {
        isbnCell.textContent = livre.isbn;
    }
    
    // Remplir Titre
    const titreCell = tr.querySelector('[data-slot="titre"]');
    if (titreCell) {
        titreCell.textContent = livre.titre;
    }
    
    // Remplir Auteur
    const auteurCell = tr.querySelector('[data-slot="auteur"]');
    if (auteurCell) {
        auteurCell.textContent = livre.auteur;
    }
    
    // Genre avec badge
    const genreCell = tr.querySelector('[data-slot="genre"]');
    if (genreCell) {
        const badgeGenre = document.createElement('span');
        badgeGenre.className = 'badge bg-info';
        badgeGenre.style.fontSize = '0.85em';
        badgeGenre.textContent = livre.genre || 'genre non référencé';
        genreCell.innerHTML = '';
        genreCell.appendChild(badgeGenre);
    }
    
    // Stock avec couleur
    const stockCell = tr.querySelector('[data-slot="stock"]');
    if (stockCell) {
        stockCell.className = livre.stock > 0 ? 'bg-success' : 'bg-danger';
        const badgeStock = document.createElement('span');
        badgeStock.className = 'badge';
        badgeStock.textContent = livre.stock;
        stockCell.innerHTML = '';
        stockCell.appendChild(badgeStock);
    }
    
    // Colonne Actif (admin)
    const actifCell = tr.querySelector('[data-slot="actif"]');
    if (actifCell && isAdmin) {
        actifCell.style.display = '';
        actifCell.className = livre.actif ? 'bg-success' : 'bg-secondary';
        const badgeActif = document.createElement('span');
        badgeActif.className = 'badge';
        badgeActif.textContent = livre.actif ? 'Actif' : 'Inactif';
        actifCell.innerHTML = '';
        actifCell.appendChild(badgeActif);
    } else if (actifCell) {
        actifCell.remove();
    }
    
    return clone;
}

/**
 * Crée une ligne de tableau mouvement à partir du template
 * 
 * @param {object} mouvement - Données du mouvement
 * @param {string} livreUrlTemplate - Template URL livre (non utilisé ici mais gardé pour compatibilité)
 * @returns {DocumentFragment|null}
 */
function createMouvementRowFromTemplate(mouvement, livreUrlTemplate) {
    const template = document.getElementById('mouvement-row-template');
    
    if (!template) {
        console.error('Template mouvement-row-template non trouvé');
        return null;
    }
    
    const clone = template.content.cloneNode(true);
    const tr = clone.querySelector('tr');
    
    // ISBN
    const isbnCell = tr.querySelector('[data-slot="isbn"]');
    if (isbnCell) {
        if (mouvement.livre) {
            const linkIsbn = document.createElement('a');
            linkIsbn.href = '#';
            linkIsbn.className = 'modal-trigger-livre';
            linkIsbn.dataset.livreId = mouvement.livre.id;
            linkIsbn.textContent = mouvement.livre.isbn;
            isbnCell.innerHTML = '';
            isbnCell.appendChild(linkIsbn);
        } else {
            isbnCell.innerHTML = '<span class="text-danger">Livre supprimé</span>';
        }
    }
    
    // Titre
    const titreCell = tr.querySelector('[data-slot="titre"]');
    if (titreCell) {
        titreCell.textContent = mouvement.livre ? mouvement.livre.titre : 'Livre supprimé';
        if (!mouvement.livre) {
            titreCell.className = 'text-danger';
        }
    }
    
    // Auteur
    const auteurCell = tr.querySelector('[data-slot="auteur"]');
    if (auteurCell) {
        auteurCell.textContent = mouvement.livre ? mouvement.livre.auteur : 'Livre supprimé';
        if (!mouvement.livre) {
            auteurCell.className = 'text-danger';
        }
    }
    
    // Type (Entrée/Sortie)
    const typeCell = tr.querySelector('[data-slot="type"]');
    if (typeCell) {
        const badgeType = document.createElement('span');
        badgeType.className = 'badge';
        if (mouvement.type || mouvement.type == '1') {
            typeCell.classList.add('bg-danger');
            badgeType.textContent = 'Sortie';
        } else {
            typeCell.classList.add('bg-success');
            badgeType.textContent = 'Entrée';
        }
        typeCell.innerHTML = '';
        typeCell.appendChild(badgeType);
    }
    
    // Date
    const dateCell = tr.querySelector('[data-slot="date"]');
    if (dateCell) {
        dateCell.textContent = mouvement.dateHeure;
    }
    
    // Utilisateur
    const userCell = tr.querySelector('[data-slot="user"]');
    if (userCell) {
        userCell.textContent = mouvement.nomPrenom || '';
    }
    
    return clone;
}

// Export global
window.createFilterTagFromTemplate = createFilterTagFromTemplate;
window.createFilterTagFallback = createFilterTagFallback;
window.appendFilterBadge = appendFilterBadge;
window.createLivreRowFromTemplate = createLivreRowFromTemplate;
window.createMouvementRowFromTemplate = createMouvementRowFromTemplate;
