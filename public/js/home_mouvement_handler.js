/**
 * home_mouvement_handler.js
 * Gestion complète du flux d'entrée/sortie de livres depuis la page d'accueil
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 1.1
 * @date 09/02/2026
 * 
 * Dépendances: fonctions.js (chargerModale, fermerModale, autoFocus, escapeHtml)
 * 
 * CORRECTIONS v1.1:
 * - Fix : Construction correcte de l'URL pour la route Symfony
 * - Fix : Ajout de logs de débogage
 * - Fix : Meilleure gestion des erreurs
 */

// ==========================================
// VARIABLES GLOBALES
// ==========================================
const modalePrincipale = document.getElementById('modale_principale');
let typeActionActuel = 'false'; // Garde en mémoire si c'est Entrée ou Sortie

// ==========================================
// FONCTION PRINCIPALE : OUVERTURE DU SCAN
// ==========================================

/**
 * Ouvre la première modale (le scan ISBN)
 * Et active la détection automatique pour le scanner
 * 
 * @param {string} action - 'true' pour sortie, 'false' pour entrée
 */
async function ouvrirScan(action) {
    typeActionActuel = action;

    // Construction de l'URL - CORRIGÉ
    // Le template Twig doit définir window.ROUTES.mouvementDebut ou on utilise le fallback
    let baseUrl = '/mouvement/';
    
    // Vérifier si les routes sont définies dans window.ROUTES
    if (typeof window.ROUTES !== 'undefined' && window.ROUTES.mouvementDebut) {
        baseUrl = window.ROUTES.mouvementDebut;
    }
    
    const url = baseUrl + "?action=" + action;
    
    console.log('🔍 Ouverture scan - URL:', url, 'Action:', action); // Debug
    
    try {
        await chargerModale(url);
        
        console.log('✅ Modale chargée'); // Debug

        const inputIsbn = document.getElementById('isbnInput');
        const formScan = document.getElementById('form_scan');

        if (inputIsbn) {
            autoFocus('isbnInput');

            // ÉCOUTEUR 1 : Détection automatique (Scanner)
            inputIsbn.addEventListener('input', function(e) {
                const isbn = e.target.value.trim();
                if (isbn.length === 10 || isbn.length === 13) {
                    console.log("ISBN détecté par saisie/scan :", isbn);
                    verifierIsbn(isbn);
                }
            });
        } else {
            console.warn('⚠️ Input ISBN non trouvé dans la modale');
        }

        if (formScan) {
            // ÉCOUTEUR 2 : Validation manuelle
            formScan.addEventListener('submit', function(e) {
                e.preventDefault();
                const isbn = inputIsbn.value.trim();
                if (isbn) {
                    verifierIsbn(isbn);
                }
            });
        } else {
            console.warn('⚠️ Formulaire de scan non trouvé dans la modale');
        }

    } catch (erreur) {
        console.error("❌ Erreur lors de l'ouverture du scan :", erreur);
        alert("Impossible de charger la fenêtre de scan.");
    }
}

// ==========================================
// VÉRIFICATION ISBN
// ==========================================

/**
 * Logique de vérification ISBN (Appel API)
 * 
 * @param {string} isbn - ISBN à vérifier
 */
async function verifierIsbn(isbn) {
    console.log('🔍 Vérification ISBN:', isbn); // Debug
    
    try {
        const reponse = await fetch(`/livre/api/verif-isbn/${isbn}`);
        const contentType = reponse.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            const resultat = await reponse.json();

            console.log('📊 Résultat vérification:', resultat); // Debug

            if (resultat.statut === 'existe') {
                ouvrirConfirmation(resultat.id);
            } else if (resultat.statut === 'google') {
                ouvrirFormulaireNouveau(resultat.donnees);
            } else if (resultat.statut === 'inconnu') {
                console.log('📕 Livre introuvable, ISBN:', resultat.isbn);
                afficherOptionsCreation(resultat.isbn);
            } else {
                console.error('⚠️ Statut inconnu reçu:', resultat.statut);
            }
        } else {
            const html = await reponse.text();
            document.getElementById('contenu_modale').innerHTML = html;
        }
    } catch (erreur) {
        console.error("❌ Erreur lors de la vérification ISBN :", erreur);
        alert("Erreur lors de la vérification de l'ISBN. Veuillez réessayer.");
    }
}

// ==========================================
// OPTIONS DE CRÉATION
// ==========================================

/**
 * Affiche le formulaire de choix : API Google ou Saisie Manuelle
 * 
 * @param {string} isbn - ISBN du livre introuvable
 */
function afficherOptionsCreation(isbn) {
    const safeIsbn = escapeHtml(isbn);
    
    document.getElementById('contenu_modale').innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h3 style="color: #d9534f; margin-bottom: 20px;">Livre Introuvable</h3>
            <p style="margin-bottom: 25px;">
                L'ISBN <strong>${safeIsbn}</strong> n'a pas été trouvé dans notre base de données ni sur l'API Google Books.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; max-width: 400px; margin: 0 auto;">
                <button 
                    class="btn btn-primary" 
                    onclick="afficherFormulaireCreationRapide('${safeIsbn}')"
                    style="width: 100%; padding: 15px; font-size: 1rem;">
                    Créer le livre manuellement
                </button>
                
                <button 
                    class="btn btn-secondary" 
                    onclick="ouvrirScan('${typeActionActuel}')"
                    style="width: 100%; padding: 15px; font-size: 1rem;">
                    Rescanner un autre livre
                </button>
                
                <button 
                    class="btn btn-light" 
                    onclick="fermerModale()"
                    style="width: 100%; padding: 12px; font-size: 0.95rem;">
                    ✕ Annuler
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// FORMULAIRE DE CRÉATION RAPIDE
// ==========================================

/**
 * Affiche le formulaire de création rapide
 * 
 * @param {string} isbn - ISBN du livre à créer
 */
function afficherFormulaireCreationRapide(isbn) {
    const safeIsbn = escapeHtml(isbn);
    
    document.getElementById('contenu_modale').innerHTML = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 20px;">Création rapide de livre</h3>
            <p style="color: var(--text-light); margin-bottom: 20px;">
                ISBN : <strong>${safeIsbn}</strong>
            </p>
            
            <form id="form-quick-create" onsubmit="soumettreCreationRapide(event, '${safeIsbn}')">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label for="titre" style="display: block; margin-bottom: 5px; font-weight: bold;">
                        Titre du livre *
                    </label>
                    <input 
                        type="text" 
                        id="titre" 
                        name="titre" 
                        class="form-control" 
                        required
                        placeholder="Entrez le titre du livre"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                        autofocus
                    >
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="auteur" style="display: block; margin-bottom: 5px; font-weight: bold;">
                        Auteur (optionnel)
                    </label>
                    <input 
                        type="text" 
                        id="auteur" 
                        name="auteur" 
                        class="form-control" 
                        placeholder="Nom de l'auteur"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                    >
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="genre" style="display: block; margin-bottom: 5px; font-weight: bold;">
                        Genre (optionnel)
                    </label>
                    <input 
                        type="text" 
                        id="genre" 
                        name="genre" 
                        class="form-control" 
                        placeholder="Roman, Essai, Manga..."
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                    >
                </div>

                <div class="modal-actions" style="display: flex; justify-content: space-between; gap: 10px;">
                    <button type="button" class="btn btn-secondary" onclick="afficherOptionsCreation('${safeIsbn}')" style="flex: 1;">
                        ← Retour
                    </button>
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        Créer le livre
                    </button>
                    <button type="button" class="btn" onclick="ouvrirScan('${typeActionActuel}')">Réessayer</button>
                </div>
            </form>
        </div>
    `;
    
    autoFocus('titre');
}

/**
 * Soumet le formulaire de création rapide
 * 
 * @param {Event} event - Événement de soumission
 * @param {string} isbn - ISBN du livre
 */
async function soumettreCreationRapide(event, isbn) {
    event.preventDefault();
    
    const form = event.target;
    const titre = form.titre.value;
    const auteur = form.auteur.value;
    const genre = form.genre.value;
    
    const formData = new FormData();
    formData.append('isbn', isbn);
    formData.append('titre', titre);
    formData.append('auteur', auteur);
    formData.append('genre', genre);
    
    console.log('📝 Soumission création rapide:', { isbn, titre, auteur, genre }); // Debug
    
    try {
        const reponse = await fetch('/livre/creation-manuel', {
            method: 'POST',
            body: formData
        });
        
        const data = await reponse.json();
        
        if (data.success) {
            document.getElementById('contenu_modale').innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; color: #5cb85c;">✓</div>
                    <h3 style="color: #5cb85c;">Livre créé avec succès !</h3>
                    <p>Passage à l'étape de confirmation...</p>
                </div>
            `;
            
            setTimeout(() => {
                ouvrirConfirmation(data.id);
            }, 1000);
        } else {
            alert(data.message || 'Erreur lors de la création du livre');
        }
    } catch (erreur) {
        console.error('❌ Erreur:', erreur);
        alert('Une erreur est survenue lors de la création du livre');
    }
}

// ==========================================
// FORMULAIRE NOUVEAU LIVRE (GOOGLE)
// ==========================================

/**
 * Affiche le formulaire de création de livre avec données Google
 * 
 * @param {Object} donnees - Données du livre depuis Google Books
 */
function ouvrirFormulaireNouveau(donnees) {
    const params = new URLSearchParams(donnees).toString();
    
    let baseUrl = '/livre/new';
    if (typeof window.ROUTES !== 'undefined' && window.ROUTES.livreNew) {
        baseUrl = window.ROUTES.livreNew;
    }
    
    const url = baseUrl + "?" + params;
    chargerModale(url);
}

// ==========================================
// CONFIRMATION FINALE
// ==========================================

/**
 * Affiche l'étape finale (Nom/Prénom)
 * 
 * @param {number} livreId - ID du livre
 */
async function ouvrirConfirmation(livreId) {
    const url = `/mouvement/confirmation/${livreId}?type_action=${typeActionActuel}`;
    
    console.log('✅ Ouverture confirmation pour livre ID:', livreId); // Debug
    
    try {
        const reponse = await fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await reponse.json();

        if (data.success) {
            const livre = data.livre;
            const couleurAction = data.estSortie ? '#d9534f' : '#5cb85c';
            const labelAction = data.estSortie ? 'SORTIE' : 'ENTRÉE';
            const texteBouton = data.estSortie ? "l'emprunt" : "le retour";
            const classeBouton = data.estSortie ? 'btn-warning' : 'btn-success';

            document.getElementById('contenu_modale').innerHTML = `
                <h3>Étape Finale : Confirmation</h3>
                <div class="book-summary-box" autocomplete="off">
                    ${livre.lienImg ? `<img src="${livre.lienImg}" alt="Couverture" class="img-cover-thumb" onerror="this.src='/extras/images/unknown_book.jpg'">` : `<img src="/extras/images/unknown_book.jpg" alt="Couverture" class="img-cover-thumb">`}
                    <div>
                        <strong>Titre :</strong> ${escapeHtml(livre.titre)} <br>
                        <strong>Auteur :</strong> ${escapeHtml(livre.auteur)} <br>
                        <strong>ISBN :</strong> ${escapeHtml(livre.isbn)} <br>
                        <strong>Stock actuel :</strong> ${livre.stock}
                    </div>
                </div>

                <form action="${data.urlFinaliser}" method="post">
                    <input type="hidden" name="type_action" value="${data.estSortie}">

                    <div class="form-group-modal">
                        <label for="nomPrenom">Votre Nom et Prénom :</label>
                        <input type="text" id="nomPrenom" name="nomPrenom" 
                            placeholder="Qui effectue l'opération ?" required autofocus class="input-full" autocomplete="off">
                    </div>

                    <div class="modal-actions-between">
                        <p style="margin: 0; color: ${couleurAction}; font-weight: bold;">
                            Action : ${labelAction}
                        </p>
                        <button type="submit" class="btn ${classeBouton}">
                            Valider ${texteBouton}
                        </button>
                    </div>
                </form>
            `;

            if (!modalePrincipale.open) {
                modalePrincipale.showModal();
            }
            autoFocus('nomPrenom');
        }
    } catch (erreur) {
        console.error("❌ Erreur lors de la récupération de la confirmation :", erreur);
        alert("Impossible de charger la confirmation. Veuillez réessayer.");
    }
}

// ==========================================
// GESTIONNAIRE DE SOUMISSION GLOBAL
// ==========================================

document.addEventListener('submit', async (e) => {
    const formulaire = e.target;
    
    // Vérifier si c'est un formulaire dans la modale
    const contenuModale = document.getElementById('contenu_modale');
    if (!contenuModale || !contenuModale.contains(formulaire)) {
        return; // Pas dans la modale, laisser passer
    }
    
    e.preventDefault();
    
    const actionUrl = formulaire.action;
    const formData = new FormData(formulaire);

    console.log('📤 Soumission formulaire:', actionUrl); // Debug

    // CAS A : Soumission du SCAN ISBN
    if (actionUrl.includes('verification') || formulaire.querySelector('#isbnInput')) {
        const isbn = formulaire.querySelector('#isbnInput').value;
        verifierIsbn(isbn);
        return;
    }

    // CAS B : Soumission du NOUVEAU LIVRE ou CONFIRMATION
    try {
        const reponse = await fetch(actionUrl, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const contentType = await reponse.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const resultat = await reponse.json();
            
            console.log('📊 Résultat soumission:', resultat); // Debug
            
            if (resultat.success) {
                if (resultat.id) {
                    ouvrirConfirmation(resultat.id);
                } else if (resultat.livre && resultat.nomPrenom) {
                    modalePrincipale.close();
                    afficherModaleSucces(resultat);
                } else {
                    modalePrincipale.close();
                    window.location.reload();
                }
            }
        } else {
            const html = await reponse.text();
            document.getElementById('contenu_modale').innerHTML = html;
            
            const successElement = document.querySelector('[data-success="true"]');
            if (successElement && successElement.dataset.livreId) {
                setTimeout(() => {
                    ouvrirConfirmation(successElement.dataset.livreId);
                }, 1000);
            }
        }
    } catch (erreur) {
        console.error("❌ Erreur soumission formulaire:", erreur);
        alert("Une erreur est survenue. Veuillez réessayer.");
    }
});

console.log('✅ home_mouvement_handler.js v1.1 chargé');