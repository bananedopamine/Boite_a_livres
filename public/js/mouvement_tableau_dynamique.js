/**
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 3.0
 * @lastUpdate : 09/02/2026 (Extraction HTML dans templates)
 * @description : Gestion du tableau dynamique des mouvements avec AJAX
 * 
 * MODIFICATIONS v3.0 :
 * - Extraction de la génération HTML dans template HTML5
 * - Utilisation de createMouvementRowFromTemplate() de template_helpers.js
 * - Code plus propre et maintenable
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

    // Bouton Export Excel
    const btnExport = document.getElementById('btn-export-mouvements');
    if (btnExport) {
        btnExport.addEventListener('click', function() {
            exporterMouvements();
        });
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
 * ✅ UTILISE MAINTENANT createMouvementRowFromTemplate() au lieu de createElement()
 */
function afficherMouvements(mouvements, isAdmin) {
    const tbody = document.getElementById('tbody-mouvements');
    tbody.innerHTML = '';

    if (mouvements.length === 0) {
        afficherMessageVide();
        return;
    }

    document.getElementById('conteneur-tableau-mouvement').style.display = 'block';
    document.getElementById('message-erreur-mouvement').style.display = 'none';

    const livreUrlTemplate = document.getElementById('zone-tableau-mouvement').dataset.livreShowUrl;

    // ✅ NOUVELLE APPROCHE : Utilisation du template au lieu de createElement()
    mouvements.forEach(mouvement => {
        // Vérifier que la fonction est disponible
        if (typeof createMouvementRowFromTemplate !== 'function') {
            console.error('❌ createMouvementRowFromTemplate() non disponible !');
            console.error('Vérifiez que template_helpers.js est bien chargé');
            console.error('Et que _templates_mouvement.html.twig est inclus dans la page');
            return;
        }
        
        const fragment = createMouvementRowFromTemplate(mouvement, livreUrlTemplate);
        
        if (fragment) {
            tbody.appendChild(fragment);
        } else {
            console.warn('⚠️ Impossible de créer la ligne pour le mouvement:', mouvement);
        }
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

/**
 * Exporte les mouvements actuellement affichés en Excel
 */
function exporterMouvements() {
    // Construire l'URL avec les mêmes paramètres que la recherche actuelle
    const params = new URLSearchParams();
    if (critereRecherche.isbn) params.append('isbn', critereRecherche.isbn);
    if (critereRecherche.auteur) params.append('auteur', critereRecherche.auteur);
    if (critereRecherche.user) params.append('user', critereRecherche.user);
    if (critereRecherche.type) params.append('type', critereRecherche.type);
    if (critereRecherche.tri) params.append('sort', critereRecherche.tri);

    // Récupérer l'URL d'export depuis l'attribut data
    const urlBase = document.getElementById('zone-tableau-mouvement').dataset.exportUrl;
    const url = urlBase + '?' + params.toString();

    // Télécharger le fichier
    window.location.href = url;
}
