<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use App\Repository\MouvementRepository;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Attribute\Route;

class AdminController extends AbstractController
{

    #[Route('/admin', name:'app_admin_index')]
    public function index(MouvementRepository $mouvements, RequestStack $requestStack) : Response 
    {
        if (!$requestStack->getSession()->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_login');
        }

        return $this->render('mouvement/index.html.twig', [
            'mouvements' => $mouvements->findAll(),
        ]);
    }

    
}