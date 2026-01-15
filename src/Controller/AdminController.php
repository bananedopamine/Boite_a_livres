<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 14/01/2026
 * @lastUpdate : 14/01/2026
 */

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use App\Repository\MouvementRepository;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/admin')]
class AdminController extends AbstractController
{

    #[Route('/', name:'app_admin_index')]
    public function index(MouvementRepository $mouvements, RequestStack $requestStack) : Response 
    {
        if (!$requestStack->getSession()->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_login');
        }

        return $this->render('admin/index.html.twig', [
            'mouvements' => $mouvements->findAll(),
        ]);
    }

    
}