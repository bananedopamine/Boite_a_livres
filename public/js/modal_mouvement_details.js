/**
 * @fileName : modal_mouvement_details.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1.0
 * @dateCreate : 09/02/2026
 * @lastUpdate : 11/02/2026 (ajout de l'entête)
 * @description : Gestion de la modale de détails des mouvements
 * @dependencies : fonctions.js (loadToMouvementModal)
 */

// ==========================================
// GESTION DES CLICS SUR LES TRIGGERS
// ==========================================

/**
 * Intercepte les clics sur les éléments avec la classe .mouvement-modal-trigger
 * et charge le contenu dans la modale de mouvement
 */
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.mouvement-modal-trigger');
    if (trigger) {
        e.preventDefault();
        loadToMouvementModal(trigger.href);
    }
});

// ==========================================
// GESTION DES FORMULAIRES
// ==========================================

/**
 * Intercepte la soumission des formulaires DANS la modale de mouvement
 */
document.addEventListener('submit', async (e) => {
    const content = document.getElementById('mouvement-modal-content');
    
    // Sécurité : on ne traite que les formulaires à l'intérieur de la modale
    if (!content || !content.contains(e.target)) return;

    const modal = document.getElementById('mouvement-modal');
    const form = e.target;
    
    e.preventDefault();
    
    const formData = new FormData(form);

    // Ajout manuel du bouton submitter
    if (e.submitter && e.submitter.name) {
        formData.append(e.submitter.name, e.submitter.value);
    }

    const actionUrl = form.getAttribute('action') || window.location.href;

    try {
        const response = await fetch(actionUrl, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (response.ok) {
            try {
                const result = await response.json();
                if (result.success) {
                    modal.close();
                    window.location.reload(); 
                    return;
                }
            } catch (jsonErr) {
                modal.close();
                window.location.reload();
            }
        } else if (response.status === 422) {
            // Erreur de validation
            content.innerHTML = await response.text();
        }
    } catch (err) {
        console.error("Erreur lors de l'envoi Mouvement :", err);
    }
});
