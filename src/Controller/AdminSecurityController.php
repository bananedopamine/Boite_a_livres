<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 14/01/2026
 * @lastUpdate : 14/01/2026
 */

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur gérant l'authentification administrateur via code PIN.
 *
 * ATTENTION : Ce contrôleur définit les routes 'app_admin_login' et 'app_admin_logout',
 * qui sont également déclarées dans AdminController.php.
 * AdminSecurityController est la version active (gestion des tentatives, redirection vers home_index).
 * AdminController::login() et AdminController::logout() sont en doublon et doivent être supprimés
 * ou fusionnés pour éviter un conflit de routes Symfony.
 */
class AdminSecurityController extends AbstractController
{
    private $session;

    public function __construct(RequestStack $requestStack)
    {
        $this->session = $requestStack->getSession();
    }

    /**
     * Affiche et traite le formulaire de connexion administrateur (PIN).
     *
     * APPELÉE PAR :
     *   - Navigateur (GET /admin/login) — affichage du formulaire
     *   - Navigateur (POST /admin/login) — soumission du formulaire
     *   - AdminController::index()    → redirectToRoute('app_admin_login') (si non authentifié)
     *   - AdminController::settings() → redirectToRoute('app_admin_login') (si non authentifié)
     *   - LivreController::edit()     → redirectToRoute('app_admin_login') (si non authentifié)
     *   - LivreController::delete()   → redirectToRoute('app_admin_login') (si non authentifié)
     *
     * APPELLE / REND :
     *   - Twig : admin/login.html.twig
     *   - En cas de succès (POST) : redirectToRoute('home_index') → HomeController::index()
     *   - En cas de trop de tentatives (3) : redirectToRoute('home_index') → HomeController::index()
     *   - Lit la variable d'environnement : $_ENV['PIN_ADMIN']
     */
    #[Route('/admin/login', name: 'app_admin_login')]
    public function login(Request $request): Response
    {
        if ($this->session->get('admin_authenticated')) {
            return $this->redirectToRoute('home_index');
        }

        if ($request->isMethod('POST')) {
            $pinSaisi = $request->request->get('_pin');
            $pinAttendu = $_ENV['PIN_ADMIN'];

            if ($pinSaisi === $pinAttendu) {
                $this->session->remove('login_attempts');
                $this->session->set('admin_authenticated', true);
                
                $this->addFlash('success', 'Connexion admin réussie.');
                return $this->redirectToRoute('home_index');
            }

            $tentatives = $this->session->get('login_attempts', 0) + 1;
            $this->session->set('login_attempts', $tentatives);

            if ($tentatives >= 3) {
                $this->session->remove('login_attempts');
                $this->addFlash('error', 'Trop de tentatives infructueuses (3/3). Retour à l\'accueil.');
                return $this->redirectToRoute('home_index');
            }

            // Message d'erreur classique avec décompte
            $essaisRestants = 3 - $tentatives;
            $this->addFlash('error', "Code PIN incorrect. Il vous reste $essaisRestants essai(s).");
        }

        return $this->render('admin/login.html.twig');
    }

    /**
     * Déconnecte l'administrateur et redirige vers l'accueil.
     *
     * APPELÉE PAR :
     *   - Navigateur (GET /admin/logout)
     *   - Lien de déconnexion présent dans les templates admin (admin/index.html.twig, etc.)
     *
     * APPELLE / REND :
     *   - redirectToRoute('home_index') → HomeController::index()
     *   - Supprime la clé 'admin_authenticated' de la session
     */
    #[Route('/admin/logout', name: 'app_admin_logout')]
    public function logout(): Response
    {
        $this->session->remove('admin_authenticated'); // On nettoie la session
        return $this->redirectToRoute('home_index');
    }
}
