/**
 * @fileName : livre_tableau_dynamique.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 3.0
 * @dateCreate : 28/01/2026
 * @lastUpdate : 09/02/2026 (Extraction HTML dans templates)
 * @description : Gestion du tableau dynamique des livres avec AJAX
 */


// Variables globales
let critereRecherche = {
    isbn: '',
    auteur: '',
    titre: '',
    statut: '',
    stockMin: '',
    stockMax: ''
};

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Charger tous les livres au démarrage
    chargerLivres();

    // Gérer la soumission du formulaire de recherche (si présent dans la page principale)
    const formRecherche = document.getElementById('form-recherche-livres');
    if (formRecherche) {
        formRecherche.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Récupérer les critères de base
            critereRecherche.isbn = document.getElementById('isbn')?.value.trim() || '';
            critereRecherche.auteur = document.getElementById('auteur')?.value.trim() || '';
            
            // Charger les livres avec les critères
            chargerLivres();
        });
    }

    // Bouton Effacer
    const btnEffacer = document.getElementById('btn-effacer');
    if (btnEffacer) {
        btnEffacer.addEventListener('click', function() {
            // Réinitialiser le formulaire
            if (formRecherche) formRecherche.reset();
            
            // Réinitialiser l'objet critereRecherche complet
            critereRecherche = { 
                isbn: '', 
                auteur: '', 
                titre: '',
                statut: '',
                stockMin: '',
                stockMax: ''
            };

            // Réinitialiser aussi les champs de la modale s'ils existent
            const inputsModale = [
                {id: 'filter-isbn', value: ''},
                {id: 'filter-auteur', value: ''},
                {id: 'filter-titre', value: ''},
                {id: 'filter-statut-actif', value: ''},
                {id: 'stockMin-input', value: ''},
                {id: 'stockMax-input', value: ''}
            ];
            
            inputsModale.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) el.value = item.value;
            });
            
            // Recharger tous les livres
            chargerLivres();
        });
    }

    // Bouton Export Excel
    const btnExport = document.getElementById('btn-export-livres');
    if (btnExport) {
        btnExport.addEventListener('click', function() {
            exporterLivres();
        });
    }
});

/**
 * Fonction appelée par modal_filtres_handler.js pour mettre à jour les critères
 */
function majCriteres() {
    critereRecherche.isbn = document.getElementById('filter-isbn')?.value.trim() || '';
    critereRecherche.auteur = document.getElementById('filter-auteur')?.value.trim() || '';
    critereRecherche.titre = document.getElementById('filter-titre')?.value.trim() || '';
    critereRecherche.statut = document.getElementById('filter-statut-actif')?.value || '';
    critereRecherche.stockMin = document.getElementById('stockMin-input')?.value.trim() || '';
    critereRecherche.stockMax = document.getElementById('stockMax-input')?.value.trim() || '';
}

/**
 * Fonction principale : charge les livres via AJAX
 */
async function chargerLivres() {
    // Afficher l'indicateur de chargement
    afficherChargement(true);

    try {
        // Construction de l'URL avec les paramètres de recherche
        const params = new URLSearchParams();
        
        // Ajouter TOUS les filtres avec les bons noms de paramètres
        if (critereRecherche.isbn) params.append('isbn', critereRecherche.isbn);
        if (critereRecherche.auteur) params.append('auteur', critereRecherche.auteur);
        if (critereRecherche.titre) params.append('titre', critereRecherche.titre);
        if (critereRecherche.statut) params.append('statut', critereRecherche.statut);
        
        // CORRECTION : Utiliser stock_min et stock_max (avec underscore) et ne pas envoyer si vide
        if (critereRecherche.stockMin !== '') {
            params.append('stock_min', critereRecherche.stockMin);
        }
        if (critereRecherche.stockMax !== '') {
            params.append('stock_max', critereRecherche.stockMax);
        }

        // Récupérer l'URL de base depuis l'attribut data
        const urlBase = document.getElementById('zone-tableau').dataset.apiUrl;
        const url = urlBase + '?' + params.toString();

        // Appel AJAX
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            afficherLivres(data.livres, data.isAdmin);
            
            // Mettre à jour le compteur
            document.getElementById('nombre-livres').textContent = data.total;
        } else {
            afficherErreur('Erreur lors du chargement des livres.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        afficherErreur('Une erreur est survenue lors du chargement.');
    } finally {
        afficherChargement(false);
    }
}


/**
 * Affiche les livres dans le tableau
 * utilise createLivreRowFromTemplate() au lieu de createElement()
 */
function afficherLivres(livres, isAdmin) {
    const tbody = document.getElementById('tbody-livres');
    tbody.innerHTML = '';

    const colonneActif = document.getElementById('colonne-actif');
    if (colonneActif) {
        colonneActif.style.display = isAdmin ? '' : 'none';
    }

    if (livres.length === 0) {
        afficherMessageVide();
        return;
    }

    document.getElementById('conteneur-tableau').style.display = 'block';
    document.getElementById('message-erreur').style.display = 'none';

    const urlTemplate = document.getElementById('zone-tableau').dataset.showUrl;

    // Utilisation du template au lieu de createElement()
    livres.forEach(livre => {
        // Vérifier que la fonction est disponible
        if (typeof createLivreRowFromTemplate !== 'function') {
            console.error(' createLivreRowFromTemplate() non disponible !');
            console.error('Vérifiez que template_helpers.js est bien chargé');
            console.error('Et que _templates_livre.html.twig est inclus dans la page');
            return;
        }
        
        const fragment = createLivreRowFromTemplate(livre, isAdmin, urlTemplate);
        
        if (fragment) {
            tbody.appendChild(fragment);
        } else {
            console.warn(' Impossible de créer la ligne pour le livre:', livre);
        }
    });

    // Attacher les événements pour les modales
    attacherEvenementsModales();
}

/**
 * Nouvelle fonction pour déléguer l'ouverture à chargerModale (modal_handler.js)
 */
function attacherEvenementsModales() {
    document.querySelectorAll('.modal-trigger-livre').forEach(lien => {
        lien.addEventListener('click', (e) => {
            e.preventDefault();
            const url = lien.dataset.url;
            
            if (typeof chargerModale === 'function') {
                chargerModale(url);
            } else {
                console.error('La fonction chargerModale() n\'est pas définie (modal_handler.js manquant ?)');
            }
        });
    });
}

/**
 * Affiche un message quand aucun livre n'est trouvé
 */
function afficherMessageVide() {
    document.getElementById('conteneur-tableau').style.display = 'none';
    
    const messageErreur = document.getElementById('message-erreur');
    const texteErreur = document.getElementById('texte-erreur');
    
    // Afficher tous les critères actifs
    let criteres = [];
    if (critereRecherche.isbn) criteres.push(`ISBN: ${critereRecherche.isbn}`);
    if (critereRecherche.auteur) criteres.push(`Auteur: ${critereRecherche.auteur}`);
    if (critereRecherche.titre) criteres.push(`Titre: ${critereRecherche.titre}`);
    if (critereRecherche.statut) {
        const statutLabel = critereRecherche.statut === 'actif' ? 'Actif' : 'Inactif';
        criteres.push(`Statut: ${statutLabel}`);
    }
    if (critereRecherche.stockMin !== '' || critereRecherche.stockMax !== '') {
        const min = critereRecherche.stockMin || '0';
        const max = critereRecherche.stockMax || '∞';
        criteres.push(`Stock: ${min} - ${max}`);
    }
    
    if (criteres.length > 0) {
        texteErreur.innerHTML = `
            <strong>Aucun livre trouvé</strong> avec les critères : ${criteres.join(' - ')}
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-secondary" onclick="reinitialiserFiltres()">
                    Voir tous les livres
                </button>
            </div>
        `;
    } else {
        texteErreur.innerHTML = '<strong>Aucun livre</strong> n\'est actuellement disponible en stock.';
    }
    
    messageErreur.style.display = 'block';
}

/**
 * Affiche un message d'erreur
 */
function afficherErreur(message) {
    document.getElementById('conteneur-tableau').style.display = 'none';
    
    const messageErreur = document.getElementById('message-erreur');
    const texteErreur = document.getElementById('texte-erreur');
    texteErreur.innerHTML = `<strong>Erreur :</strong> ${message}`;
    messageErreur.style.display = 'block';
}

/**
 * Affiche/cache l'indicateur de chargement
 */
function afficherChargement(afficher) {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        if (afficher) {
            loading.style.display = 'block';
            document.getElementById('conteneur-tableau').style.display = 'none';
            document.getElementById('message-erreur').style.display = 'none';
        } else {
            loading.style.display = 'none';
        }
    }
}

/**
 * Recherche en temps réel (optionnel)
 */
function rechercherEnTempsReel() {
    critereRecherche.isbn = document.getElementById('isbn').value.trim();
    critereRecherche.auteur = document.getElementById('auteur').value.trim();
    chargerLivres();
}

/**
 * Fonction de debounce pour éviter trop d'appels API
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

/**
 * Exporte les livres actuellement affichés en Excel
 */
function exporterLivres() {
    // Construire l'URL avec TOUS les paramètres de recherche
    const params = new URLSearchParams();
    if (critereRecherche.isbn) params.append('isbn', critereRecherche.isbn);
    if (critereRecherche.auteur) params.append('auteur', critereRecherche.auteur);
    if (critereRecherche.titre) params.append('titre', critereRecherche.titre);
    if (critereRecherche.statut) params.append('statut', critereRecherche.statut);
    
    // Utiliser stock_min et stock_max
    if (critereRecherche.stockMin !== '') {
        params.append('stock_min', critereRecherche.stockMin);
    }
    if (critereRecherche.stockMax !== '') {
        params.append('stock_max', critereRecherche.stockMax);
    }

    // Récupérer l'URL d'export depuis l'attribut data
    const urlBase = document.getElementById('zone-tableau').dataset.exportUrl;
    const url = urlBase + '?' + params.toString();

    // Télécharger le fichier
    window.location.href = url;
}