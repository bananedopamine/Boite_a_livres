/**
 * home_mouvement_handler.js
 * Gestion complète du flux d'entrée/sortie de livres depuis la page d'accueil
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 1.2
 * @date 09/02/2026
 * 
 * Dépendances: fonctions.js (chargerModale, fermerModale, autoFocus, escapeHtml)
*/

// ==========================================
// VARIABLES GLOBALES
// ==========================================
const modalePrincipale = document.getElementById('modale_principale');
let typeActionActuel = 'false'; // Garde en mémoire si c'est Entrée ou Sortie

// ==========================================
// UTILITAIRE : Cloner un template HTML5
// ==========================================

/**
 * Clone un template HTML5 et retourne le fragment + le conteneur racine.
 * Lève une erreur explicite si le template est introuvable.
 *
 * @param {string} templateId - ID du <template> dans le DOM
 * @returns {{ fragment: DocumentFragment, root: Element }}
 */
function clonerTemplate(templateId) {
    const tpl = document.getElementById(templateId);
    if (!tpl) {
        throw new Error(`Template introuvable : #${templateId}`);
    }
    const fragment = tpl.content.cloneNode(true);
    // Premier enfant réel du fragment (ignore les nœuds texte)
    const root = fragment.firstElementChild;
    return { fragment, root };
}

/**
 * Vide le contenu de la modale et y insère un fragment de template.
 *
 * @param {DocumentFragment} fragment
 */
function afficherDansModale(fragment) {
    const contenu = document.getElementById('contenu_modale');
    contenu.innerHTML = '';
    contenu.appendChild(fragment);
}

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

    try {
        await chargerModale(url);

        const inputIsbn = document.getElementById('isbnInput');
        const formScan  = document.getElementById('form_scan');

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
    console.log('🔍 Vérification ISBN:', isbn);

    try {
        const reponse      = await fetch(`/livre/api/verif-isbn/${isbn}`);
        const contentType  = reponse.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            const resultat = await reponse.json();

            console.log('📊 Résultat vérification:', resultat);

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
 * Affiche le formulaire de choix : créer manuellement ou rescanner
 *
 * @param {string} isbn - ISBN du livre introuvable
 */
function afficherOptionsCreation(isbn) {
    const { fragment } = clonerTemplate('modal-livre-introuvable-template');

    // Injecter l'ISBN dans le texte
    fragment.querySelector('[data-slot="isbn"]').textContent = isbn;

    // Attacher les événements sur les boutons (data-action)
    fragment.querySelector('[data-action="creer"]')
        .addEventListener('click', () => afficherFormulaireCreationRapide(isbn));

    fragment.querySelector('[data-action="rescanner"]')
        .addEventListener('click', () => ouvrirScan(typeActionActuel));

    fragment.querySelector('[data-action="annuler"]')
        .addEventListener('click', () => fermerModale());

    afficherDansModale(fragment);
}

// ==========================================
// FORMULAIRE DE CRÉATION RAPIDE
// ==========================================

/**
 * Affiche le formulaire de création rapide (titre, auteur, genre)
 *
 * @param {string} isbn - ISBN du livre à créer
 */
function afficherFormulaireCreationRapide(isbn) {
    const { fragment } = clonerTemplate('modal-creation-rapide-template');

    // Afficher l'ISBN en clair
    fragment.querySelector('[data-slot="isbn"]').textContent = isbn;

    // Remplir le champ caché (transporté jusqu'au submit handler)
    fragment.querySelector('[data-slot="isbn-hidden"]').value = isbn;

    // Bouton Retour → revenir aux options de création
    fragment.querySelector('[data-action="retour"]')
        .addEventListener('click', () => afficherOptionsCreation(isbn));

    // Bouton Réessayer → rouvrir le scan
    fragment.querySelector('[data-action="rescanner"]')
        .addEventListener('click', () => ouvrirScan(typeActionActuel));

    // Soumettre le formulaire
    fragment.querySelector('#form-quick-create')
        .addEventListener('submit', (e) => soumettreCreationRapide(e, isbn));

    afficherDansModale(fragment);

    autoFocus('quick-titre');
}

/**
 * Soumet le formulaire de création rapide
 *
 * @param {Event}  event - Événement de soumission
 * @param {string} isbn  - ISBN du livre
 */
async function soumettreCreationRapide(event, isbn) {
    event.preventDefault();

    const form  = event.target;
    const titre = form.titre.value;
    const auteur = form.auteur.value;
    const genre  = form.genre.value;

    const formData = new FormData();
    formData.append('isbn',   isbn);
    formData.append('titre',  titre);
    formData.append('auteur', auteur);
    formData.append('genre',  genre);

    console.log('📝 Soumission création rapide:', { isbn, titre, auteur, genre });

    try {
        const reponse = await fetch('/livre/creation-manuel', {
            method: 'POST',
            body: formData
        });

        const data = await reponse.json();

        if (data.success) {
            // Afficher le message de succès transitoire (template #modal-creation-succes-template)
            const { fragment } = clonerTemplate('modal-creation-succes-template');
            afficherDansModale(fragment);

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
 * Affiche l'étape finale (résumé livre + formulaire Nom/Prénom)
 *
 * @param {number} livreId - ID du livre
 */
async function ouvrirConfirmation(livreId) {
    const url = `/mouvement/confirmation/${livreId}?type_action=${typeActionActuel}`;

    console.log('✅ Ouverture confirmation pour livre ID:', livreId);

    try {
        const reponse = await fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await reponse.json();

        if (data.success) {
            const livre         = data.livre;
            const estSortie     = data.estSortie;
            const couleurAction = estSortie ? '#d9534f' : '#5cb85c';
            const labelAction   = estSortie ? 'SORTIE'  : 'ENTRÉE';
            const texteBouton   = estSortie ? "l'emprunt" : "le retour";
            const classeBouton  = estSortie ? 'btn-warning' : 'btn-success';

            const { fragment } = clonerTemplate('modal-confirmation-template');

            // Image de couverture
            const imgEl = fragment.querySelector('[data-slot="cover"]');
            if (livre.lienImg) {
                imgEl.src = livre.lienImg;
            }

            // Informations du livre
            fragment.querySelector('[data-slot="titre"]').textContent  = livre.titre;
            fragment.querySelector('[data-slot="auteur"]').textContent = livre.auteur;
            fragment.querySelector('[data-slot="isbn"]').textContent   = livre.isbn;
            fragment.querySelector('[data-slot="stock"]').textContent  = livre.stock;

            // Formulaire
            const formEl = fragment.querySelector('[data-slot="form"]');
            formEl.action = data.urlFinaliser;

            fragment.querySelector('[data-slot="type-action"]').value = String(estSortie);

            // Label action (couleur dynamique)
            const labelEl = fragment.querySelector('[data-slot="label-action"]');
            labelEl.textContent = `Action : ${labelAction}`;
            labelEl.style.color = couleurAction;

            // Bouton de validation
            const btnEl = fragment.querySelector('[data-slot="btn-submit"]');
            btnEl.textContent = `Valider ${texteBouton}`;
            btnEl.classList.add(classeBouton);

            afficherDansModale(fragment);

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
    const formulaire    = e.target;
    const contenuModale = document.getElementById('contenu_modale');

    // Vérifier si c'est un formulaire dans la modale
    if (!contenuModale || !contenuModale.contains(formulaire)) {
        return; // Pas dans la modale, laisser passer
    }

    e.preventDefault();

    const actionUrl = formulaire.action;
    const formData  = new FormData(formulaire);

    console.log('📤 Soumission formulaire:', actionUrl);

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

        const contentType = reponse.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const resultat = await reponse.json();

            console.log('📊 Résultat soumission:', resultat);

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

console.log('✅ home_mouvement_handler.js v1.2 chargé');