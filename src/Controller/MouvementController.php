<?php

namespace App\Controller;

use App\Entity\Livre;
use App\Entity\Mouvement;
use App\Repository\MouvementRepository;
use App\Repository\LivreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;


#[Route('/mouvement')]
class MouvementController extends AbstractController
{
    #region Gestion_mouvement index, show, search

    #[Route('/', name:'app_mouvement_index')]
    public function index(MouvementRepository $mouvements) : Response
    {
        return $this->render('mouvement/index.html.twig', [
            'mouvements' => $mouvements->findBy([], ['dateHeure' => 'DESC']),
        ]);
    }

    #[Route('/show/{id<\d+>}', name: 'app_mouvement_show')]
    public function show(Mouvement $mouvement, Request $request): Response
    {
        // Si c'est une requête AJAX, on ne renvoie que le  Twig
        if ($request->isXmlHttpRequest()) {
            return $this->render('mouvement/_mouvement_details.html.twig', [
                'mouvement' => $mouvement,
            ]);
        }

        // Sinon, on renvoie la page complète habituelle 
        return $this->render('mouvement/show.html.twig', [
            'mouvement' => $mouvement,
        ]);
    }

    #[Route('/recherche', name: 'app_mouvement_search', methods: ['GET'])]
    public function search(Request $request, MouvementRepository $mouvementRepository): Response
    {
        $isbn = $request->query->get('isbn');
        $auteur = $request->query->get('auteur');
        $user = $request->query->get('user');
        $direction = $request->query->get('sort', 'DESC');

        $qb = $mouvementRepository->createQueryBuilder('m')
            ->leftJoin('m.livre', 'l')
            ->addSelect('l');

        if (!empty($isbn)) {
            $qb->andWhere('l.isbn LIKE :isbn')
               ->setParameter('isbn', '%' . $isbn . '%');
        }

        if (!empty($auteur)) {
            $qb->andWhere('l.auteur LIKE :auteur')
               ->setParameter('auteur', '%' . $auteur . '%');
        }

        // Recherche sur le nom de la personne ayant fait le mouvement
        if (!empty($user)) {
            $qb->andWhere('m.nomPrenom LIKE :user')
               ->setParameter('user', '%' . $user . '%');
        }

        $mouvements = $qb->orderBy('m.dateHeure', $direction)
                         ->getQuery()
                         ->getResult();
        
        return $this->render('mouvement/index.html.twig', [
            'mouvements' => $mouvements,
            'last_isbn' => $isbn,
            'last_auteur' => $auteur,
            'last_user' => $user, 
            'current_sort' => $direction,
        ]);
    }

    #endregion

    #region Modal debut, confirmation, finaliser

    /**
     * Retourne le formulaire de scan ISBN ( HTML pour modale).
     * Interagit avec : _modal_debut.html.twig
     */
    #[Route('/debut', name: 'app_mouvement_debut')]
    public function debut(Request $requete): Response
    {
        // 'action' contient "true" (Sortie) ou "false" (Entrée)
        $actionMouvement = $requete->query->get('action'); 

        return $this->render('mouvement/_modal_debut.html.twig', [
            'selection_defaut' => $actionMouvement
        ]);
    }

    /**
     * Retourne le formulaire de confirmation ( HTML pour modale).
     * Interagit avec : _modal_confirmation.html.twig
     */
    #[Route('/confirmation/{id<\d+>}', name: 'app_mouvement_confirmation')]
    public function confirmation(int $id, Request $requete, LivreRepository $livreRepo): Response
    {
        $livre = $livreRepo->find($id);
        
        if (!$livre) {
            return $this->json(['success' => false, 'message' => 'Livre non trouvé'], 404);
        }
    
        $estUneSortie = $requete->query->get('type_action') === 'true';
    
        return $this->json([
            'success'   => true,
            'livre' => [
                'id'      => $livre->getId(),
                'titre'   => $livre->getNom(),
                'auteur'  => $livre->getAuteur(),
                'isbn'    => $livre->getIsbn(),
                'stock'   => $livre->getNbStock(),
                'lienImg' => $livre->getLienImg(),
            ],
            'estSortie'    => $estUneSortie,
            'urlFinaliser' => $this->generateUrl('app_mouvement_finaliser', ['id' => $livre->getId()])
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
        $mouvement->setDateHeure(new \DateTime());
        $mouvement->setType($typeSortie);

        // Mise à jour logique du stock
        if ($typeSortie) {
            $livre->setNbStock($livre->getNbStock() - 1);
        } else {
            $livre->setNbStock($livre->getNbStock() + 1);
        }

        if (!$livre->isActif()){
            $livre->setActif(true);
        }

        $em->persist($mouvement);
        $em->flush();

        return $this->json(['success' => true]);
    }

    #endregion
}