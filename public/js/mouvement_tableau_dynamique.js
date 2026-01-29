/**
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 2.1
 * @lastUpdate : 29/01/2026 (Support filtres Tri et Type)
 * @description : Gestion du tableau dynamique des mouvements avec AJAX
 */

// Variables globales
let critereRecherche = {
    isbn: '',
    auteur: '',
    user: '',
    type: '',   // Nouveau : filtre entrée/sortie
    tri: 'DESC' // Nouveau : ordre décroissant par défaut
};

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Charger tous les mouvements au démarrage
    chargerMouvements();

    // Gérer la soumission du formulaire de recherche
    const formRecherche = document.getElementById('form-recherche-mouvements');
    if (formRecherche) {
        formRecherche.addEventListener('submit', function(e) {
            e.preventDefault();
            // Mise à jour des critères et lancement de la recherche
            majCriteres();
            chargerMouvements();
        });
    }

    // Gestion des listes déroulantes (Tri et Type)
    // On lance la recherche immédiatement au changement (pas besoin de bouton valider)
    const selectType = document.getElementById('select-type');
    const selectTri = document.getElementById('select-tri');

    if (selectType) {
        selectType.addEventListener('change', function() {
            majCriteres();
            chargerMouvements();
        });
    }

    if (selectTri) {
        selectTri.addEventListener('change', function() {
            majCriteres();
            chargerMouvements();
        });
    }

    // Bouton Effacer
    const btnEffacer = document.getElementById('btn-effacer');
    if (btnEffacer) {
        btnEffacer.addEventListener('click', function() {
            // Réinitialiser le formulaire
            document.getElementById('form-recherche-mouvements').reset();
            
            // Réinitialiser l'objet de critères
            critereRecherche = { 
                isbn: '', 
                auteur: '', 
                user: '', 
                type: '', 
                tri: 'DESC' 
            };
            
            // Recharger tous les mouvements
            chargerMouvements();
        });
    }

    // Recherche en temps réel sur les champs texte
    const isbnInput = document.getElementById('isbn');
    const auteurInput = document.getElementById('auteur');
    const userInput = document.getElementById('user');
    
    if (isbnInput) {
        isbnInput.addEventListener('input', debounce(rechercherEnTempsReel, 500));
    }
    if (auteurInput) {
        auteurInput.addEventListener('input', debounce(rechercherEnTempsReel, 500));
    }
    if (userInput) {
        userInput.addEventListener('input', debounce(rechercherEnTempsReel, 500));
    }
});

/**
 * Met à jour l'objet critereRecherche depuis les champs du DOM
 */
function majCriteres() {
    critereRecherche.isbn = document.getElementById('isbn').value.trim();
    critereRecherche.auteur = document.getElementById('auteur').value.trim();
    critereRecherche.user = document.getElementById('user').value.trim();
    
    // Nouveaux champs (si présents dans le DOM)
    const elType = document.getElementById('select-type');
    const elTri = document.getElementById('select-tri');
    
    if (elType) critereRecherche.type = elType.value;
    if (elTri) critereRecherche.tri = elTri.value;
}

/**
 * Fonction principale : charge les mouvements via AJAX
 */
async function chargerMouvements() {
    // Afficher l'indicateur de chargement
    afficherChargement(true);

    try {
        // Construction de l'URL avec les paramètres de recherche
        const params = new URLSearchParams();
        if (critereRecherche.isbn) params.append('isbn', critereRecherche.isbn);
        if (critereRecherche.auteur) params.append('auteur', critereRecherche.auteur);
        if (critereRecherche.user) params.append('user', critereRecherche.user);
        
        // Ajout des nouveaux paramètres URL
        if (critereRecherche.type) params.append('type', critereRecherche.type);
        if (critereRecherche.tri) params.append('sort', critereRecherche.tri);

        // Récupérer l'URL de base depuis l'attribut data
        const urlBase = document.getElementById('zone-tableau-mouvement').dataset.apiUrl;
        const url = urlBase + '?' + params.toString();

        // Appel AJAX
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            afficherMouvements(data.mouvements, data.isAdmin);
            
            // Mettre à jour le compteur
            document.getElementById('nombre-mouvements').textContent = data.total;
        } else {
            afficherErreur('Erreur lors du chargement des mouvements.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        afficherErreur('Une erreur est survenue lors du chargement.');
    } finally {
        afficherChargement(false);
    }
}

/**
 * Affiche les mouvements dans le tableau
 */
function afficherMouvements(mouvements, isAdmin) {
    const tbody = document.getElementById('tbody-mouvements');
    tbody.innerHTML = ''; // Vider le tableau

    if (mouvements.length === 0) {
        // Aucun mouvement trouvé
        afficherMessageVide();
        return;
    }

    // Afficher le tableau et le compteur
    document.getElementById('conteneur-tableau-mouvement').style.display = 'block';
    document.getElementById('compteur-resultats-mouvement').style.display = 'block';
    document.getElementById('message-erreur-mouvement').style.display = 'none';

    // Récupérer l'URL template pour les liens
    const livreUrlTemplate = document.getElementById('zone-tableau-mouvement').dataset.livreShowUrl;

    // Générer les lignes du tableau
    mouvements.forEach(mouvement => {
        const tr = document.createElement('tr');
        
        // ====================================
        // Colonne ISBN (avec lien modal ou "Livre supprimé")
        // ====================================
        const tdIsbn = document.createElement('td');
        if (mouvement.livre) {
            const linkIsbn = document.createElement('a');
            linkIsbn.href = '#';
            linkIsbn.className = 'modal-trigger-livre';
            linkIsbn.dataset.livreId = mouvement.livre.id;
            linkIsbn.textContent = mouvement.livre.isbn;
            tdIsbn.appendChild(linkIsbn);
        } else {
            const spanSuppr = document.createElement('span');
            spanSuppr.className = 'text-danger';
            spanSuppr.textContent = 'Livre supprimé';
            tdIsbn.appendChild(spanSuppr);
        }
        tr.appendChild(tdIsbn);

        // ====================================
        // Colonne Titre
        // ====================================
        const tdTitre = document.createElement('td');
        if (mouvement.livre) {
            tdTitre.textContent = mouvement.livre.nom;
        } else {
            const spanSuppr = document.createElement('span');
            spanSuppr.className = 'text-danger';
            spanSuppr.textContent = 'Livre supprimé';
            tdTitre.appendChild(spanSuppr);
        }
        tr.appendChild(tdTitre);

        // ====================================
        // Colonne Auteur
        // ====================================
        const tdAuteur = document.createElement('td');
        if (mouvement.livre) {
            tdAuteur.textContent = mouvement.livre.auteur;
        } else {
            const spanSuppr = document.createElement('span');
            spanSuppr.className = 'text-danger';
            spanSuppr.textContent = 'Livre supprimé';
            tdAuteur.appendChild(spanSuppr);
        }
        tr.appendChild(tdAuteur);

        // ====================================
        // Colonne Type (Badge Entrée/Sortie)
        // ====================================
        const tdType = document.createElement('td');
        const badgeType = document.createElement('span');
        badgeType.className = 'badge';
        // Note: l'API renvoie souvent un booléen ou '1'/'0' pour le type
        if (mouvement.type || mouvement.type == '1') {
            tdType.classList.add('bg-danger');
            badgeType.textContent = 'Sortie';
        } else {
            tdType.classList.add('bg-success');
            badgeType.textContent = 'Entrée';
        }
        tdType.appendChild(badgeType);
        tr.appendChild(tdType);

        // ====================================
        // Colonne Date/Heure
        // ====================================
        const tdDate = document.createElement('td');
        tdDate.textContent = mouvement.dateHeure;
        tr.appendChild(tdDate);

        // ====================================
        // Colonne Utilisateur
        // ====================================
        const tdUser = document.createElement('td');
        tdUser.textContent = mouvement.nomPrenom || '';
        tr.appendChild(tdUser);

        tbody.appendChild(tr);
    });

    // Attacher les événements pour les modales de livres
    attacherEvenementsModales();
}

/**
 * Attache les événements pour ouvrir les modales de livres
 */
function attacherEvenementsModales() {
    const livreUrlTemplate = document.getElementById('zone-tableau-mouvement').dataset.livreShowUrl;

    document.querySelectorAll('.modal-trigger-livre').forEach(lien => {
        lien.addEventListener('click', (e) => {
            e.preventDefault();
            const livreId = lien.dataset.livreId;
            const url = livreUrlTemplate.replace('__ID__', livreId);
            
            if (typeof chargerModale === 'function') {
                chargerModale(url);
            } else {
                console.error('La fonction chargerModale() n\'est pas définie');
            }
        });
    });
}

/**
 * Affiche un message quand aucun mouvement n'est trouvé
 */
function afficherMessageVide() {
    document.getElementById('conteneur-tableau-mouvement').style.display = 'none';
    document.getElementById('compteur-resultats-mouvement').style.display = 'none';
    
    const messageErreur = document.getElementById('message-erreur-mouvement');
    const texteErreur = document.getElementById('texte-erreur-mouvement');
    
    // Construction du message de feedback
    let criteres = [];
    if (critereRecherche.isbn) criteres.push(`ISBN: ${critereRecherche.isbn}`);
    if (critereRecherche.auteur) criteres.push(`Auteur: ${critereRecherche.auteur}`);
    if (critereRecherche.user) criteres.push(`Personne: ${critereRecherche.user}`);
    
    // Ajout feedback visuel pour les nouveaux filtres
    if (critereRecherche.type === 'entree') criteres.push(`Type: Entrées`);
    if (critereRecherche.type === 'sortie') criteres.push(`Type: Sorties`);
    
    if (criteres.length > 0) {
        texteErreur.innerHTML = `
            <strong>Aucun mouvement trouvé</strong> avec les critères : ${criteres.join(' - ')}
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('btn-effacer').click()">
                    Voir tout l'historique
                </button>
            </div>
        `;
    } else {
        texteErreur.innerHTML = '<strong>Aucun mouvement</strong> n\'est enregistré dans l\'historique.';
    }
    
    messageErreur.style.display = 'block';
}

/**
 * Affiche un message d'erreur
 */
function afficherErreur(message) {
    document.getElementById('conteneur-tableau-mouvement').style.display = 'none';
    document.getElementById('compteur-resultats-mouvement').style.display = 'none';
    
    const messageErreur = document.getElementById('message-erreur-mouvement');
    const texteErreur = document.getElementById('texte-erreur-mouvement');
    texteErreur.innerHTML = `<strong>Erreur :</strong> ${message}`;
    messageErreur.style.display = 'block';
}

/**
 * Affiche/cache l'indicateur de chargement
 */
function afficherChargement(afficher) {
    const loading = document.getElementById('loading-indicator-mouvement');
    if (loading) {
        if (afficher) {
            loading.style.display = 'block';
            document.getElementById('conteneur-tableau-mouvement').style.display = 'none';
            document.getElementById('message-erreur-mouvement').style.display = 'none';
        } else {
            loading.style.display = 'none';
        }
    }
}

/**
 * Recherche en temps réel (déclenchée par debounce)
 */
function rechercherEnTempsReel() {
    majCriteres();
    chargerMouvements();
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
