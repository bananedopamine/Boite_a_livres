<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 12/01/2026
 * @lastUpdate : 12/01/2026
 */

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
    /**
     * Page d'accueil de l'application.
     *
     * APPELÉE PAR :
     *   - Navigateur (GET /)
     *   - AdminController::logout()       → redirectToRoute('home_index')
     *   - AdminSecurityController::login()  → redirectToRoute('home_index') (après succès ou trop de tentatives)
     *   - AdminSecurityController::logout() → redirectToRoute('home_index')
     *
     * APPELLE / REND :
     *   - Twig : home/index.html.twig
     *     └── Ce template contient le JS qui déclenche le scan ISBN
     *         et appelle LivreController::verifierIsbn() via fetch() JS
     */
    #[Route('/', name: 'home_index')]
    public function index() : Response
    {
        return $this->render('home/index.html.twig');
    }
}
