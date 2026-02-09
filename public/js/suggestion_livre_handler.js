/**
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 2.0
 * @dateCreate : 06/02/2026
 * @lastUpdate : 09/02/2026
 * @description : Gestionnaire de suggestion de livres aléatoires
 * 
 * MODIFICATIONS v2.0 :
 * - Extraction de tout le HTML dans des templates HTML5
 * - Utilisation de templates au lieu de innerHTML
 * - Code plus maintenable et séparation HTML/JS
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
    // Vérifier si on a atteint la fin AVANT d'afficher
    if (indexLivreSuggestion >= listeLivresSuggestion.length) {
        afficherModaleFinListe();
        return;
    }
    
    const livre = listeLivresSuggestion[indexLivreSuggestion];
    const modale = document.getElementById('modale_principale');
    const contenu = document.getElementById('contenu_modale');
    
    // ✅ UTILISATION DU TEMPLATE au lieu de innerHTML
    const template = document.getElementById('suggestion-card-template');
    
    if (!template) {
        console.error('❌ Template suggestion-card-template non trouvé !');
        console.error('Assurez-vous d\'avoir inclus _templates_suggestion.html.twig dans votre page');
        return;
    }
    
    // Cloner le template
    const clone = template.content.cloneNode(true);
    
    // Remplir les données du livre
    // Image de couverture
    const cover = clone.querySelector('[data-slot="cover"]');
    if (cover && livre.lienImg) {
        cover.src = livre.lienImg;
        cover.alt = `Couverture de ${livre.titre}`;
    }
    
    // Titre
    const titre = clone.querySelector('[data-slot="titre"]');
    if (titre) titre.textContent = livre.titre;
    
    // Auteur
    const auteur = clone.querySelector('[data-slot="auteur"]');
    if (auteur) auteur.textContent = livre.auteur || 'Non renseigné';
    
    // Genre (si présent)
    if (livre.genre) {
        const genreContainer = clone.querySelector('[data-slot="genre-container"]');
        const genreBadge = clone.querySelector('[data-slot="genre"]');
        if (genreContainer) genreContainer.style.display = '';
        if (genreBadge) genreBadge.textContent = livre.genre;
    }
    
    // ISBN
    const isbn = clone.querySelector('[data-slot="isbn"]');
    if (isbn) isbn.textContent = livre.isbn;
    
    // Stock
    const stock = clone.querySelector('[data-slot="stock"]');
    if (stock) stock.textContent = livre.stock;
    
    // Compteur
    const indexActuel = clone.querySelector('[data-slot="index-actuel"]');
    const total = clone.querySelector('[data-slot="total"]');
    if (indexActuel) indexActuel.textContent = indexLivreSuggestion + 1;
    if (total) total.textContent = listeLivresSuggestion.length;
    
    // Attacher les événements aux boutons
    const btnEmprunter = clone.querySelector('[data-action="emprunter"]');
    const btnSuivant = clone.querySelector('[data-action="suivant"]');
    const btnFermer = clone.querySelector('[data-action="fermer"]');
    
    if (btnEmprunter) {
        btnEmprunter.addEventListener('click', () => emprunterLivreSuggestion(livre.isbn));
    }
    if (btnSuivant) {
        btnSuivant.addEventListener('click', suggererAutreLivre);
    }
    if (btnFermer) {
        btnFermer.addEventListener('click', fermerSuggestion);
    }
    
    // Vider le contenu et insérer le clone
    contenu.innerHTML = '';
    contenu.appendChild(clone);
    
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
 * Affiche la modale de fin de liste
 */
function afficherModaleFinListe() {
    const modale = document.getElementById('modale_principale');
    const contenu = document.getElementById('contenu_modale');
    
    // ✅ UTILISATION DU TEMPLATE au lieu de innerHTML
    const template = document.getElementById('suggestion-fin-template');
    
    if (!template) {
        console.error('❌ Template suggestion-fin-template non trouvé !');
        return;
    }
    
    const clone = template.content.cloneNode(true);
    
    // Remplir le nombre total de livres
    const totalLivres = clone.querySelector('[data-slot="total-livres"]');
    if (totalLivres) {
        totalLivres.textContent = listeLivresSuggestion.length;
    }
    
    // Attacher les événements
    const btnRecommencer = clone.querySelector('[data-action="recommencer"]');
    const btnFermer = clone.querySelector('[data-action="fermer"]');
    
    if (btnRecommencer) {
        btnRecommencer.addEventListener('click', recommencerSuggestion);
    }
    if (btnFermer) {
        btnFermer.addEventListener('click', fermerSuggestion);
    }
    
    // Vider et insérer
    contenu.innerHTML = '';
    contenu.appendChild(clone);
    
    // Annuler le timer et ouvrir la modale
    annulerTimerResetSuggestion();
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
    
    // ✅ UTILISATION DU TEMPLATE au lieu de innerHTML
    const template = document.getElementById('suggestion-vide-template');
    
    if (!template) {
        console.error('❌ Template suggestion-vide-template non trouvé !');
        return;
    }
    
    const clone = template.content.cloneNode(true);
    
    // Attacher l'événement au bouton fermer
    const btnFermer = clone.querySelector('[data-action="fermer"]');
    if (btnFermer) {
        btnFermer.addEventListener('click', fermerSuggestion);
    }
    
    // Vider et insérer
    contenu.innerHTML = '';
    contenu.appendChild(clone);
    
    // Ouvrir la modale
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