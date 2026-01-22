<?php

namespace App\Controller;

use App\Entity\Mouvement;
use App\Repository\LivreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/mouvement')]
class MouvementController extends AbstractController
{
    /**
     * Retourne le formulaire de scan ISBN (fragment HTML pour modale).
     * Interagit avec : _modal_debut.html.twig
     */
    #[Route('/debut-fragment', name: 'app_mouvement_debut_fragment')]
    public function debutFragment(Request $requete): Response
    {
        // 'action' contient "true" (Sortie) ou "false" (Entrée)
        $actionMouvement = $requete->query->get('action'); 

        return $this->render('mouvement/_modal_debut.html.twig', [
            'selection_defaut' => $actionMouvement
        ]);
    }

    /**
     * Retourne le formulaire de confirmation (fragment HTML pour modale).
     * Interagit avec : _modal_confirmation.html.twig
     */
    #[Route('/confirmation-fragment/{id<\d+>}', name: 'app_mouvement_confirmation_fragment')]
    public function confirmationFragment(int $id, Request $requete, LivreRepository $livreRepo): Response
    {
        $livre = $livreRepo->find($id);
        $estUneSortie = $requete->query->get('type_action') === 'true';

        return $this->render('mouvement/_modal_confirmation.html.twig', [
            'livre'     => $livre,
            'estSortie' => $estUneSortie
        ]);
    }

    /**
     * Enregistre le mouvement final et met à jour le stock du livre.
     * Interagit avec : Le formulaire de confirmation en AJAX.
     */
    #[Route('/finaliser/{id<\d+>}', name: 'app_mouvement_finaliser', methods: ['POST'])]
    public function finaliser(int $id, Request $requete, LivreRepository $livreRepo, EntityManagerInterface $em): Response
    {
        $livre          = $livreRepo->find($id);
        $typeSortie     = $requete->request->get('type_action') === 'true';
        $nomUtilisateur = $requete->request->get('nomPrenom');

        // Création de l'entité Mouvement
        $mouvement = new Mouvement();
        $mouvement->setLivre($livre);
        $mouvement->setNomPrenom($nomUtilisateur);
        $mouvement->setDateHeure(new \DateTimeImmutable());
        $mouvement->setType($typeSortie);

        // Mise à jour logique du stock
        if ($typeSortie) {
            $livre->setNbStock($livre->getNbStock() - 1);
        } else {
            $livre->setNbStock($livre->getNbStock() + 1);
        }

        $em->persist($mouvement);
        $em->flush();

        return $this->json(['success' => true]);
    }
}