/**
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 3.2
 * @description : Gestionnaire de filtres - Version Inputs Numériques sans sliders
 */

let filtresActifs = {
    isbn: '',
    auteur: '',
    titre: '',
    statut: '',
    stockMin: 0,
    stockMax: 100
};

let stockMaxGlobal = 100; 

document.addEventListener('DOMContentLoaded', function() {
    initialiserControlesStock();
    chargerStockMaximum();
});

/**
 * Gère la logique de collision entre Min et Max
 */
function initialiserControlesStock() {
    const inputMin = document.getElementById('stockMin');
    const inputMax = document.getElementById('stockMax');

    if (!inputMin || !inputMax) return;

    inputMin.addEventListener('change', function() {
        let val = parseInt(this.value) || 0;
        let maxVal = parseInt(inputMax.value) || stockMaxGlobal;

        // Condition 1 : Pas en dessous de 0
        if (val < 0) val = 0;
        // Condition 2 : Pas au dessus du maximum actuel
        if (val > maxVal) val = maxVal;

        this.value = val;
    });

    inputMax.addEventListener('change', function() {
        let val = parseInt(this.value) || stockMaxGlobal;
        let minVal = parseInt(inputMin.value) || 0;

        // Condition 1 : Pas au dessus du stock réel de la BDD
        if (val > stockMaxGlobal) val = stockMaxGlobal;
        // Condition 2 : Pas en dessous du minimum actuel
        if (val < minVal) val = minVal;

        this.value = val;
    });
}

/**
 * Récupère dynamiquement le plus gros stock en BDD pour brider le champ "Max"
 */
async function chargerStockMaximum() {
    const zoneTableau = document.getElementById('zone-tableau');
    if (!zoneTableau) return;
    
    const urlBase = zoneTableau.dataset.apiUrl;

    try {
        const response = await fetch(urlBase);
        const data = await response.json();

        if (data.success && data.livres && data.livres.length > 0) {
            stockMaxGlobal = Math.max(...data.livres.map(livre => livre.stock || 0));
            
            const inputMax = document.getElementById('stockMax');
            const inputMin = document.getElementById('stockMin');
            
            inputMax.max = stockMaxGlobal;
            inputMin.max = stockMaxGlobal;
            
            // Initialisation par défaut au max réel
            inputMax.value = stockMaxGlobal;
            filtresActifs.stockMax = stockMaxGlobal;
        }
    } catch (error) {
        console.error('Erreur API Stock:', error);
    }
}

function ouvrirModaleFiltres() {
    const modale = document.getElementById('modale_filtres');
    if (!modale) return;

    document.getElementById('filter-isbn').value = filtresActifs.isbn;
    document.getElementById('filter-auteur').value = filtresActifs.auteur;
    document.getElementById('filter-titre').value = filtresActifs.titre;
    
    const sel = document.getElementById('filter-statut-actif');
    if (sel) sel.value = filtresActifs.statut;

    document.getElementById('stockMin').value = filtresActifs.stockMin;
    document.getElementById('stockMax').value = filtresActifs.stockMax;

    modale.showModal();
}

function appliquerFiltres() {
    filtresActifs.isbn = document.getElementById('filter-isbn').value.trim();
    filtresActifs.auteur = document.getElementById('filter-auteur').value.trim();
    filtresActifs.titre = document.getElementById('filter-titre').value.trim();
    
    const sel = document.getElementById('filter-statut-actif');
    filtresActifs.statut = sel ? sel.value : '';

    filtresActifs.stockMin = parseInt(document.getElementById('stockMin').value) || 0;
    filtresActifs.stockMax = parseInt(document.getElementById('stockMax').value) || stockMaxGlobal;

    afficherFiltresActifs();

    // Envoi vers le tableau dynamique
    if (typeof window.appliquerFiltresAvances === 'function') {
        window.appliquerFiltresAvances(filtresActifs);
    }
    
    fermerModaleFiltres();
}

function reinitialiserFiltres() {
    filtresActifs = {
        isbn: '', auteur: '', titre: '', statut: '',
        stockMin: 0,
        stockMax: stockMaxGlobal
    };

    document.getElementById('form-filtres').reset();
    document.getElementById('stockMin').value = 0;
    document.getElementById('stockMax').value = stockMaxGlobal;

    afficherFiltresActifs();

    if (typeof window.appliquerFiltresAvances === 'function') {
        window.appliquerFiltresAvances(filtresActifs);
    }
}

function fermerModaleFiltres() {
    const modale = document.getElementById('modale_filtres');
    if (modale) modale.close();
}

/**
 * Gestion des badges sous le bouton "Filtres"
 */
function afficherFiltresActifs() {
    const container = document.getElementById('active-filters-container');
    if (!container) return;

    container.innerHTML = '';
    let nb = 0;

    const createBadge = (txt, key) => {
        const span = document.createElement('span');
        span.className = 'filter-badge';
        span.innerHTML = `${txt} <button onclick="retirerFiltre('${key}')">✕</button>`;
        container.appendChild(span);
        nb++;
    };

    if (filtresActifs.isbn) createBadge(`ISBN: ${filtresActifs.isbn}`, 'isbn');
    if (filtresActifs.auteur) createBadge(`Auteur: ${filtresActifs.auteur}`, 'auteur');
    if (filtresActifs.titre) createBadge(`Titre: ${filtresActifs.titre}`, 'titre');
    if (filtresActifs.statut) createBadge(`Statut: ${filtresActifs.statut}`, 'statut');
    
    if (filtresActifs.stockMin > 0 || filtresActifs.stockMax < stockMaxGlobal) {
        createBadge(`Stock: ${filtresActifs.stockMin}-${filtresActifs.stockMax}`, 'stock');
    }

    const badgeNum = document.getElementById('filter-count-badge');
    if (badgeNum) {
        badgeNum.textContent = nb;
        badgeNum.style.display = nb > 0 ? 'inline-block' : 'none';
    }
}

function retirerFiltre(key) {
    if (key === 'stock') {
        filtresActifs.stockMin = 0;
        filtresActifs.stockMax = stockMaxGlobal;
    } else {
        filtresActifs[key] = '';
    }
    afficherFiltresActifs();
    if (typeof window.appliquerFiltresAvances === 'function') {
        window.appliquerFiltresAvances(filtresActifs);
    }
}

window.ouvrirModaleFiltres = ouvrirModaleFiltres;
window.fermerModaleFiltres = fermerModaleFiltres;
window.appliquerFiltres = appliquerFiltres;
window.reinitialiserFiltres = reinitialiserFiltres;
window.retirerFiltre = retirerFiltre;