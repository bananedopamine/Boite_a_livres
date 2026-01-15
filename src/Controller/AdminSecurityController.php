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

class AdminSecurityController extends AbstractController
{
    private $session;

    public function __construct(RequestStack $requestStack)
    {
        $this->session = $requestStack->getSession();
    }

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
                return $this->redirectToRoute('app_livre_index');
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

    #[Route('/admin/logout', name: 'app_admin_logout')]
    public function logout(): Response
    {
        $this->session->remove('admin_authenticated'); // On nettoie la session
        return $this->redirectToRoute('home_index');
    }
}