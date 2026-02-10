/**
 * home_mouvement_handler.js
 * Gestion complète du flux d'entrée/sortie de livres depuis la page d'accueil
 * 
 * @author Dufour Marc (marc.dufour@stjosup.com)
 * @version 1.3
 * @date 10/02/2026
 * 
 * Dépendances: fonctions.js (chargerModale, fermerModale, autoFocus, escapeHtml)
*/

// ==========================================
// VARIABLES GLOBALES
// ==========================================
const modalePrincipale = document.getElementById('modale_principale');
let typeActionActuel = 'false'; // Garde en mémoire si c'est Entrée ou Sortie
let verificationEnCours = false; // Protection anti-spam pour la vérification ISBN

// ==========================================
// UTILITAIRES DE TEMPLATE
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
// UTILITAIRE D'ATTENTE DOM
// ==========================================

/**
 * Attend qu'un élément apparaisse dans le DOM
 * Utilise un MutationObserver pour être notifié dès que l'élément est ajouté
 * 
 * @param {string} selector - Sélecteur CSS de l'élément à attendre
 * @param {HTMLElement} container - Conteneur dans lequel chercher (défaut: document)
 * @param {number} timeout - Timeout en ms (défaut: 5000)
 * @returns {Promise<HTMLElement>}
 */
function attendreElement(selector, container = document, timeout = 5000) {
    return new Promise((resolve, reject) => {
        // Vérifier si l'élément existe déjà
        const element = container.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        // Créer un observer pour détecter l'ajout de l'élément
        const observer = new MutationObserver((mutations) => {
            const element = container.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        // Observer les changements dans le container
        observer.observe(container, {
            childList: true,
            subtree: true
        });

        // Timeout
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout : élément "${selector}" non trouvé après ${timeout}ms`));
        }, timeout);
    });
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

    // Construction de l'URL
    let baseUrl = '/mouvement/debut';

    // Vérifier si les routes sont définies dans window.ROUTES    
    if (typeof window.ROUTES !== 'undefined' && window.ROUTES.mouvementDebut) {
        baseUrl = window.ROUTES.mouvementDebut;
    }

    const url = baseUrl + "?action=" + action;

    console.log('🔍 Ouverture scan - URL:', url, 'Action:', action);

    try {
        // Charger la modale
        await chargerModale(url);
        console.log('✅ Modale chargée (HTML reçu)');

        // ⭐ NOUVEAU : Attendre que les éléments soient vraiment dans le DOM
        const contenuModale = document.getElementById('contenu_modale');
        
        try {
            // Attendre que le formulaire soit présent dans le DOM
            const formScan = await attendreElement('#form_scan', contenuModale, 3000);
            const inputIsbn = await attendreElement('#isbnInput', contenuModale, 3000);

            console.log('✅ Éléments trouvés:', {
                formScan: formScan ? '✓' : '✗',
                inputIsbn: inputIsbn ? '✓' : '✗'
            });

            // Initialiser le formulaire de scan
            initialiserFormulaireScan(formScan, inputIsbn);

        } catch (erreurAttente) {
            console.error('❌ Erreur d\'attente des éléments:', erreurAttente);
            console.log('🔍 Contenu actuel de la modale:', contenuModale?.innerHTML);
            
            // Afficher les formulaires disponibles pour débugger
            const formulairesDisponibles = Array.from(contenuModale.querySelectorAll('form'))
                .map(f => ({ id: f.id || 'sans-id', classes: f.className }));
            console.log('🔍 Formulaires disponibles:', formulairesDisponibles);
            
            alert('Erreur : le formulaire de scan n\'a pas pu être chargé. Veuillez réessayer.');
        }

    } catch (erreur) {
        console.error("❌ Erreur lors de l'ouverture du scan :", erreur);
        alert("Impossible de charger la fenêtre de scan.");
    }
}

/**
 * Initialise les événements du formulaire de scan
 * 
 * @param {HTMLFormElement} formScan - Le formulaire de scan
 * @param {HTMLInputElement} inputIsbn - L'input ISBN
 */
function initialiserFormulaireScan(formScan, inputIsbn) {
    console.log('🎯 Initialisation du formulaire de scan');

    // Focus automatique sur le champ ISBN
    if (inputIsbn) {
        setTimeout(() => {
            inputIsbn.focus();
            console.log('✅ Focus mis sur le champ ISBN');
        }, 100);

        // // Détection automatique (Scanner)
        // // Dès qu'un ISBN de 10 ou 13 caractères est détecté, on le vérifie
        // inputIsbn.addEventListener('input', function(e) {
        //     const isbn = e.target.value.trim();
        //     console.log('📝 Saisie ISBN:', isbn, 'Longueur:', isbn.length);
            
        //     if (isbn.length === 10 || isbn.length === 13) {
                console.log("✅ ISBN détecté par saisie/scan :", isbn);
                verifierIsbn(isbn);
            // }
        // });
    }

    // ⚠️ PAS de gestionnaire submit ici !
    // Le formulaire est géré par le gestionnaire global (document.addEventListener('submit'))
    // Voir ligne ~330+

    console.log('✅ Formulaire de scan initialisé');
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
    // Protection anti-spam : empêcher les appels multiples
    if (verificationEnCours) {
        console.warn('⏳ Vérification déjà en cours, requête ignorée');
        return;
    }

    verificationEnCours = true;
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
    } finally {
        // Réinitialiser le flag après un court délai
        setTimeout(() => {
            verificationEnCours = false;
        }, 500);
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
        await chargerModale(url);
        
        if (!modalePrincipale.open) {
            modalePrincipale.showModal();
        }
        
        // Focus automatique sur le champ nom/prénom
        autoFocus('nomPrenom');
        
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

    console.log('📋 Submit event détecté sur:', formulaire.id || formulaire.className || 'formulaire sans ID');

    // Vérifier si c'est un formulaire dans la modale
    if (!contenuModale || !contenuModale.contains(formulaire)) {
        console.log('➡️ Formulaire hors modale, laisser passer');
        return; // Pas dans la modale, laisser passer
    }

    // ⚠️ CRITIQUE : Empêcher la soumission normale IMMÉDIATEMENT
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🛑 Soumission interceptée (preventDefault appelé)');
    console.log('📝 Formulaire intercepté dans la modale');

    const actionUrl = formulaire.action || window.location.href;
    const formData  = new FormData(formulaire);

    console.log('📤 Soumission formulaire:', actionUrl);

    // CAS A : Soumission du SCAN ISBN
    // Vérifier si c'est le formulaire de scan en cherchant #isbnInput
    const isbnInput = formulaire.querySelector('#isbnInput');
    
    if (formulaire.id === 'form_scan' || isbnInput || actionUrl.includes('debut')) {
        console.log('🔍 Détection formulaire de SCAN ISBN');
        const isbn = isbnInput?.value.trim();
        if (isbn) {
            console.log('📖 ISBN saisi:', isbn);
            verifierIsbn(isbn);
        } else {
            console.warn('⚠️ ISBN vide');
            alert('Veuillez scanner ou saisir un ISBN');
        }
        return; // Important : sortir de la fonction
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
}, true); // ⚠️ IMPORTANT : true = capture phase (s'exécute AVANT les gestionnaires normaux)

console.log('✅ home_mouvement_handler.js v1.3 chargé');