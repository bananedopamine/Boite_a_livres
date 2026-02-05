<?php

namespace App\Controller;

use App\Entity\Livre;
use App\Entity\Mouvement;
use App\Service\ExportService;
use App\Repository\MouvementRepository;
use App\Repository\LivreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;


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

    /**
     * API : Retourne la liste des mouvements en JSON pour le tableau dynamique
     * Interagit avec : Le JavaScript mouvement_tableau_dynamique.js
     */
    #[Route('/api/liste', name: 'app_mouvement_api_liste')]
    public function apiListe(Request $request, MouvementRepository $mouvementRepository): JsonResponse
    {

        $session = $request->getSession();
        $isAdmin = $session->get('admin_authenticated', false);
        // 1. On crée le constructeur de requête directement ici
        $qb = $mouvementRepository->createQueryBuilder('m')
            ->leftJoin('m.livre', 'l')
            ->addSelect('l'); // On joint les livres pour chercher dedans

        // 2. Gestion des filtres textuels (ISBN, Auteur, User)
        // On vérifie si chaque champ est rempli, et on ajoute la condition "WHERE"
        if ($isbn = $request->query->get('isbn')) {
            $qb->andWhere('l.isbn LIKE :isbn')
               ->setParameter('isbn', '%' . $isbn . '%');
        }

        if ($auteur = $request->query->get('auteur')) {
            $qb->andWhere('l.auteur LIKE :auteur')
               ->setParameter('auteur', '%' . $auteur . '%');
        }

        if ($user = $request->query->get('user')) {
            $qb->andWhere('m.nomPrenom LIKE :user')
               ->setParameter('user', '%' . $user . '%');
        }

        // 3. Gestion du filtre TYPE (Entrée / Sortie)
        $type = $request->query->get('type');
        if ($type) {
            // "sortie" = true (1), "entree" = false (0)
            $isSortie = ($type === 'sortie');
            
            // Correction ici : m.Type avec une MAJUSCULE
            $qb->andWhere('m.Type = :leType') 
               ->setParameter('leType', $isSortie);
        }
        
        // 4. Gestion du TRI (Date croissante / décroissante)
        $sort = $request->query->get('sort', 'DESC');
        $direction = strtoupper($sort) === 'ASC' ? 'ASC' : 'DESC';
        
        // Correction ici aussi par sécurité : m.dateHeure (vérifiez la majuscule sur dateHeure si ça plante aussi)
        $qb->orderBy('m.dateHeure', $direction);

        // 5. Exécution de la requête
        $mouvements = $qb->getQuery()->getResult();

        // 6. Construction de la réponse JSON
        $data = [];
        foreach ($mouvements as $mvt) {
            $livre = $mvt->getLivre();
            
            $data[] = [
                'id' => $mvt->getId(),
                'dateHeure' => $mvt->getDateHeure()->format('d/m/Y H:i'),
                'nomPrenom' => $mvt->getNomPrenom(),
                'type' => $mvt->isType(), // ou $mvt->getType() selon votre entité
                'livre' => $livre ? [
                    'id' => $livre->getId(),
                    'isbn' => $livre->getIsbn(),
                    'titre' => $livre->gettitre(),
                    'auteur' => $livre->getAuteur(),
                ] : null
            ];
        }

        return new JsonResponse([
            'success' => true,
            'mouvements' => $data,
            'total' => count($data),
            'isAdmin' => $isAdmin,
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
                'titre'   => $livre->gettitre(),
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
        if ($typeSortie ) {
            if ($livre->getnbStock() > 0){
                $livre->setNbStock($livre->getNbStock() - 1);
            }
            else{
                $livre->setNbStock(0);
            }
        } else {
            $livre->setNbStock($livre->getNbStock() + 1);
        }

        if (!$livre->isActif()){
            $livre->setActif(true);
        }

        $em->persist($mouvement);
        $em->flush();

        return $this->json([
            'success' => true,
            'livre' => [
                'id' => $livre->getId(),
                'titre' => $livre->gettitre(),
                'auteur' => $livre->getAuteur(),
                'isbn' => $livre->getIsbn(),
                'stock' => $livre->getNbStock()
            ],
            'type' => $typeSortie ? 'true' : 'false',
            'nomPrenom' => $nomUtilisateur
        ]);
    }

    #endregion

    #region Excel export

    /**
     * Export des mouvements en Excel (filtrés selon les critères de recherche)
     */
    #[Route('/export', name: 'app_mouvement_export', methods: ['GET'])]
    public function export(Request $request, MouvementRepository $mouvementRepository, ExportService $exportService): Response
    {
        $isbn = $request->query->get('isbn', '');
        $auteur = $request->query->get('auteur', '');
        $user = $request->query->get('user', '');
        $type = $request->query->get('type', '');
        $sort = $request->query->get('sort', 'DESC');

        // Construction de la requête (même logique que apiListe)
        $qb = $mouvementRepository->createQueryBuilder('m')
            ->leftJoin('m.livre', 'l');

        // Filtres de recherche
        if (!empty($isbn)) {
            $qb->andWhere('l.isbn LIKE :isbnVal')
            ->setParameter('isbnVal', '%' . $isbn . '%');
        }
        if (!empty($auteur)) {
            $qb->andWhere('l.auteur LIKE :auteurVal')
            ->setParameter('auteurVal', '%' . $auteur . '%');
        }
        if (!empty($user)) {
            $qb->andWhere('m.nomPrenom LIKE :userVal')
            ->setParameter('userVal', '%' . $user . '%');
        }
        
        // Filtre par type
        if ($type === 'entree') {
            $qb->andWhere('m.Type = 0');
        } elseif ($type === 'sortie') {
            $qb->andWhere('m.Type = 1');
        }

        // Tri
        $direction = ($sort === 'ASC') ? 'ASC' : 'DESC';
        $mouvements = $qb->orderBy('m.dateHeure', $direction)
                        ->getQuery()
                        ->getResult();

        // Générer le fichier Excel
        $filepath = $exportService->exportMouvements($mouvements);

        // Préparer la réponse de téléchargement
        $response = new BinaryFileResponse($filepath);
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            basename($filepath)
        );

        // Supprimer le fichier après téléchargement
        $response->deleteFileAfterSend(true);

        return $response;
    }

    #endregion 
}