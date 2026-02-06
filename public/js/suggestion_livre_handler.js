/**
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1.1
 * @dateCreate : 06/02/2026
 * @lastUpdate : 07/02/2026
 * @description : Gestionnaire de suggestion de livres aléatoires
 * 
 * CORRECTIONS v1.1 :
 * - Fix : Le bouton "Emprunter" retourne maintenant sur la modal de scan ISBN
 * - Fix : La modale de fin de tour s'affiche correctement à chaque tour complet
 */

// Variables globales pour la suggestion
let indexLivreSuggestion = 0;
let listeLivresSuggestion = [];
let timerResetSuggestion = null;

/**
 * Initialise la suggestion de livres
 * Charge la liste des livres disponibles
 */
async function initialiserSuggestion() {
    try {
        // Appel à l'API pour récupérer tous les livres actifs avec stock > 0
        const response = await fetch('/livre/api/liste?statut=actif&stock_min=1');
        const data = await response.json();
        
        if (data.success && data.livres && data.livres.length > 0) {
            // Trier par ID pour avoir un ordre cohérent
            listeLivresSuggestion = data.livres.sort((a, b) => a.id - b.id);
            indexLivreSuggestion = 0; // IMPORTANT : Reset à 0 au début
            
            // Afficher le premier livre
            afficherLivreSuggestion();
        } else {
            afficherModalePasLivres();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des livres:', error);
        afficherModalePasLivres();
    }
}

/**
 * Affiche le livre actuel dans la modale de suggestion
 */
function afficherLivreSuggestion() {
    // FIX : Vérifier si on a atteint la fin AVANT d'afficher
    if (indexLivreSuggestion >= listeLivresSuggestion.length) {
        // Fin de liste
        afficherModaleFinListe();
        return;
    }
    
    const livre = listeLivresSuggestion[indexLivreSuggestion];
    const modale = document.getElementById('modale_principale');
    const contenu = document.getElementById('contenu_modale');
    
    // Construire le HTML de la modale de suggestion
    contenu.innerHTML = `
        <div class="suggestion-livre-container">
            <h3>Suggestion de livre</h3>
            <p class="suggestion-subtitle">Laissez-nous vous proposer une lecture !</p>
            
            <div class="suggestion-livre-card">
                ${livre.lienImg ? 
                    `<img src="${livre.lienImg}" alt="Couverture" class="suggestion-cover" onerror="this.src='/extras/images/unknown_book.jpg'">` : 
                    `<img src="/extras/images/unknown_book.jpg" alt="Couverture" class="suggestion-cover">`
                }
                
                <div class="suggestion-details">
                    <h4 class="suggestion-titre">${livre.titre}</h4>
                    <p class="suggestion-auteur"><strong>Auteur :</strong> ${livre.auteur || 'Non renseigné'}</p>
                    ${livre.genre ? `<p class="suggestion-genre"><span class="badge bg-info">${livre.genre}</span></p>` : ''}
                    <p class="suggestion-isbn"><strong>ISBN :</strong> ${livre.isbn}</p>
                    <p class="suggestion-stock"><strong>Stock disponible :</strong> <span class="badge">${livre.stock}</span></p>
                </div>
            </div>
            
            <div class="suggestion-actions">
                <button type="button" class="btn btn-success btn-suggestion" onclick="emprunterLivreSuggestion('${livre.isbn}')">
                    ✓ Emprunter ce livre
                </button>
                <button type="button" class="btn btn-secondary btn-suggestion" onclick="suggererAutreLivre()">
                    → Suggérer un autre
                </button>
                <button type="button" class="btn btn-light btn-suggestion" onclick="fermerSuggestion()">
                    ✕ Fermer
                </button>
            </div>
            
            <div class="suggestion-compteur">
                Livre ${indexLivreSuggestion + 1} sur ${listeLivresSuggestion.length}
            </div>
        </div>
    `;
    
    // Bloquer le scroll du body et ouvrir la modale
    document.body.classList.add('modal-open');
    if (!modale.open) {
        modale.showModal();
    }
    
    // Démarrer le timer de reset (30 secondes d'inactivité)
    demarrerTimerResetSuggestion();
}

/**
 * Passe au livre suivant dans la suggestion
 */
function suggererAutreLivre() {
    // Annuler le timer de reset
    annulerTimerResetSuggestion();
    
    // Incrémenter l'index
    indexLivreSuggestion++;
    
    // Afficher le livre suivant (ou la modale de fin)
    afficherLivreSuggestion();
}

/**
 * FIX : Lance le processus d'emprunt pour le livre suggéré
 * MODIFICATION : On retourne maintenant sur la modal de scan ISBN au lieu d'aller directement à la confirmation
 */
function emprunterLivreSuggestion(isbn) {
    console.log('[Suggestion] Emprunt du livre ISBN:', isbn);
    
    // Annuler le timer de reset
    annulerTimerResetSuggestion();
    
    // NE PAS réinitialiser complètement - garder la position pour reprendre après
    // indexLivreSuggestion et listeLivresSuggestion restent intacts
    
    // Fermer la modale de suggestion
    const modale = document.getElementById('modale_principale');
    modale.close();
    document.body.classList.remove('modal-open');
    
    // FIX : Au lieu d'appeler directement verifierIsbn(), on retourne sur la modal de scan
    // avec l'ISBN pré-rempli et on définit le type d'action sur 'true' (sortie)
    
    // 1. Définir le type d'action comme sortie (emprunt)
    if (typeof typeActionActuel !== 'undefined') {
        typeActionActuel = 'true';
    } else {
        window.typeActionActuel = 'true';
    }
    
    // 2. Ouvrir la modal de scan
    if (typeof ouvrirScan === 'function') {
        // Petit délai pour éviter les conflits de fermeture/ouverture
        setTimeout(() => {
            ouvrirScan('true').then(() => {
                // Une fois la modal ouverte, pré-remplir l'ISBN
                const inputIsbn = document.getElementById('isbnInput');
                if (inputIsbn) {
                    inputIsbn.value = isbn;
                    inputIsbn.focus();
                    
                    // Optionnel : Déclencher automatiquement la vérification après 500ms
                    // pour que l'utilisateur puisse voir ce qui se passe
                    setTimeout(() => {
                        if (typeof verifierIsbn === 'function') {
                            verifierIsbn(isbn);
                        }
                    }, 500);
                }
            });
        }, 200);
    } else {
        console.error('La fonction ouvrirScan() n\'est pas définie');
        alert('Erreur lors du lancement de l\'emprunt');
    }
}

/**
 * Ferme la suggestion et réinitialise
 */
function fermerSuggestion() {
    // Annuler le timer de reset
    annulerTimerResetSuggestion();
    
    // Réinitialiser complètement l'index et la liste
    indexLivreSuggestion = 0;
    listeLivresSuggestion = [];
    
    // Fermer la modale
    const modale = document.getElementById('modale_principale');
    if (modale) {
        modale.close();
        document.body.classList.remove('modal-open');
    }
}

/**
 * FIX : Affiche la modale de fin de liste
 * Le problème était que cette fonction ne s'appelait que si indexLivreSuggestion >= length
 * mais l'index n'était jamais réinitialisé correctement
 */
function afficherModaleFinListe() {
    const modale = document.getElementById('modale_principale');
    const contenu = document.getElementById('contenu_modale');
    
    contenu.innerHTML = `
        <div class="suggestion-fin-container">
            <h3>Fin de la liste</h3>
            <p>Vous avez parcouru tous les livres disponibles !</p>
            <p class="suggestion-fin-message">Nous avons actuellement <strong>${listeLivresSuggestion.length}</strong> livre(s) en stock.</p>
            
            <div class="suggestion-fin-actions">
                <button type="button" class="btn btn-primary" onclick="recommencerSuggestion()">
                    Recommencer depuis le début
                </button>
                <button type="button" class="btn btn-secondary" onclick="fermerSuggestion()">
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    // Annuler le timer de reset
    annulerTimerResetSuggestion();
    
    // Bloquer le scroll du body et ouvrir la modale
    document.body.classList.add('modal-open');
    if (!modale.open) {
        modale.showModal();
    }
}

/**
 * Affiche la modale quand aucun livre n'est disponible
 */
function afficherModalePasLivres() {
    const modale = document.getElementById('modale_principale');
    const contenu = document.getElementById('contenu_modale');
    
    contenu.innerHTML = `
        <div class="suggestion-fin-container">
            <h3>Aucun livre disponible</h3>
            <p>Désolé, il n'y a actuellement aucun livre en stock à suggérer.</p>
            <p class="suggestion-fin-message">Revenez plus tard ou consultez la bibliothèque pour voir tous les livres.</p>
            
            <div class="suggestion-fin-actions">
                <button type="button" class="btn btn-primary" onclick="fermerSuggestion()">
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    // Bloquer le scroll du body et ouvrir la modale
    document.body.classList.add('modal-open');
    if (!modale.open) {
        modale.showModal();
    }
}

/**
 * Recommence la suggestion depuis le début
 */
function recommencerSuggestion() {
    // FIX : Reset explicite de l'index à 0
    indexLivreSuggestion = 0;
    console.log('[Suggestion] Recommencer - Index réinitialisé à 0');
    
    // Afficher le premier livre
    afficherLivreSuggestion();
}

/**
 * Démarre le timer de reset automatique (30 secondes)
 */
function demarrerTimerResetSuggestion() {
    // Annuler l'ancien timer s'il existe
    annulerTimerResetSuggestion();
    
    // Créer un nouveau timer (30 secondes)
    timerResetSuggestion = setTimeout(() => {
        console.log('[Suggestion] Timer expiré - Réinitialisation automatique');
        indexLivreSuggestion = 0;
        listeLivresSuggestion = [];
        
        // Fermer la modale si elle est encore ouverte
        const modale = document.getElementById('modale_principale');
        if (modale && modale.open) {
            // Vérifier si on est bien dans une suggestion
            const contenu = document.getElementById('contenu_modale');
            if (contenu && (contenu.innerHTML.includes('suggestion-livre-container') || 
                           contenu.innerHTML.includes('suggestion-fin-container'))) {
                modale.close();
                document.body.classList.remove('modal-open');
            }
        }
    }, 30000); // 30 secondes
}

/**
 * Annule le timer de reset
 */
function annulerTimerResetSuggestion() {
    if (timerResetSuggestion) {
        clearTimeout(timerResetSuggestion);
        timerResetSuggestion = null;
    }
}

/**
 * FIX : Détecte la fermeture de la modale pour réinitialiser
 */
document.addEventListener('DOMContentLoaded', function() {
    const modale = document.getElementById('modale_principale');
    
    if (modale) {
        // Observer la fermeture de la modale
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'open') {
                    if (!modale.hasAttribute('open')) {
                        // La modale est fermée
                        // Vérifier si on était en mode suggestion
                        const contenu = document.getElementById('contenu_modale');
                        if (contenu && (contenu.innerHTML.includes('suggestion-livre-container') ||
                                       contenu.innerHTML.includes('suggestion-fin-container'))) {
                            console.log('[Suggestion] Modale fermée - Réinitialisation');
                            annulerTimerResetSuggestion();
                            // FIX : Reset complet uniquement si la modale est fermée par l'utilisateur
                            indexLivreSuggestion = 0;
                            listeLivresSuggestion = [];
                        }
                    }
                }
            });
        });
        
        observer.observe(modale, { attributes: true });
    }
});

// Export des fonctions pour utilisation globale
window.initialiserSuggestion = initialiserSuggestion;
window.afficherLivreSuggestion = afficherLivreSuggestion;
window.suggererAutreLivre = suggererAutreLivre;
window.emprunterLivreSuggestion = emprunterLivreSuggestion;
window.fermerSuggestion = fermerSuggestion;
window.recommencerSuggestion = recommencerSuggestion;