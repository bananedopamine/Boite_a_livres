/**
 * @fileName : base_initialization.js
 * @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1.0
 * @dateCreate : 06/02/2026
 * @lastUpdate : 11/02/2026 (ajout de l'entête)
 * @description : Scripts d'initialisation pour la page de base (base.html.twig), gère les messages flash et le menu déroulant admin
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // GESTION DES MESSAGES FLASH
    // ==========================================
    const notices = document.querySelectorAll('.flash-message');

    notices.forEach((notice) => {
        setTimeout(() => {
            notice.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
            notice.style.opacity = "0";
            notice.style.transform = "translateY(-20px)"; 

            setTimeout(() => {
                notice.remove();
            }, 800);
        }, 5000);
    });

    // ==========================================
    // GESTION DU MENU DÉROULANT ADMIN
    // ==========================================
    const dropdownBtn = document.getElementById('adminDropdown');
    const dropdownMenu = document.getElementById('adminMenu');

    if (dropdownBtn && dropdownMenu) {
        // Toggle au clic sur le bouton
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Fermer si on clique n'importe où ailleurs sur la page
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });
    }
});
