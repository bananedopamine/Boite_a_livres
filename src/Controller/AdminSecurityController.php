<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class AdminSecurityController extends AbstractController
{
    #[Route('/admin/login', name: 'app_admin_login')]
    public function login(Request $request): Response
    {
        if ($request->getSession()->get('admin_authenticated')) {
            return $this->redirectToRoute('app_livre_index');
        }

        if ($request->isMethod('POST')) {
            $pinSaisi = $request->request->get('_pin');
            $pinAttendu = $_ENV['PIN_ADMIN'];

            if ($pinSaisi === $pinAttendu) {
                $request->getSession()->set('admin_authenticated', true);
                $this->addFlash('success', 'Connexion admin réussie.');
                return $this->redirectToRoute('app_livre_index');
            }

            $this->addFlash('error', 'Code PIN incorrect.');
        }

        return $this->render('admin/login.html.twig');
    }

    #[Route('/admin/logout', name: 'app_admin_logout')]
    public function logout(Request $request): Response
    {
        $request->getSession()->remove('admin_authenticated');
        return $this->redirectToRoute('app_mouvement_debut');
    }
}