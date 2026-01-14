<?php

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

        if ($request->getSession()->get('admin_authenticated')) {
            return $this->redirectToRoute('home_index');
        }

        if ($request->isMethod('POST')) {
            $pinSaisi = $request->request->get('_pin');
            $pinAttendu = $_ENV['PIN_ADMIN'];

            if ($pinSaisi === $pinAttendu) {
                $request->getSession()->set('admin_authenticated', true);
                $this->addFlash('success', 'Connexion admin réussie.');
                return $this->redirectToRoute('home_index');
            }

            $this->addFlash('error', 'Code PIN incorrect.');
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