<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 13/01/2026
 * @lastUpdate : 11/02/2026
 */

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

    /**
     * Page principale listant tous les mouvements (entrées/sorties).
     *
     * APPELÉE PAR :
     *   - Navigateur (GET /mouvement/)
     *   - Liens de navigation dans les templates Twig (menu, boutons retour)
     *
     * APPELLE / REND :
     *   - Twig : mouvement/index.html.twig
     *     └── Ce template charge un JS qui appelle apiListe() en fetch() AJAX
     *         pour remplir le tableau dynamiquement
     *   - Repository : MouvementRepository::findBy([], ['dateHeure' => 'DESC'])
     */
    #[Route('/', name:'app_mouvement_index')]
    public function index(MouvementRepository $mouvements) : Response
    {
        return $this->render('mouvement/index.html.twig', [
            'mouvements' => $mouvements->findBy([], ['dateHeure' => 'DESC']),
        ]);
    }

    /**
     * Affiche le détail d'un mouvement (page complète ou fragment AJAX).
     *
     * APPELÉE PAR :
     *   - Navigateur (GET /mouvement/show/{id}) — affichage de la page complète
     *   - JS de mouvement/index.html.twig       — requête AJAX (XmlHttpRequest) pour charger la modale de détail
     *
     * APPELLE / REND :
     *   - Si requête AJAX   → Twig : mouvement/_mouvement_details.html.twig  (fragment HTML)
     *   - Si requête normale → Twig : mouvement/show.html.twig                (page complète)
     */
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

    /**
     * Recherche filtrée de mouvements (par ISBN, auteur et/ou utilisateur).
     *
     * APPELÉE PAR :
     *   - Navigateur (GET /mouvement/recherche?isbn=...&auteur=...&user=...&sort=...)
     *   - Formulaire de recherche dans mouvement/index.html.twig (soumission classique sans JS)
     *
     * APPELLE / REND :
     *   - Twig : mouvement/index.html.twig (même template que index(), avec les résultats filtrés)
     *   - Repository : MouvementRepository::createQueryBuilder() avec jointure sur Livre
     */
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
     * API JSON : Retourne la liste des mouvements filtrés pour le tableau dynamique.
     *
     * APPELÉE PAR :
     *   - JS de mouvement/index.html.twig → fetch('/mouvement/api/liste?isbn=...&auteur=...&user=...&type=...&sort=...')
     *     lors du chargement de la page et à chaque changement de filtre
     *
     * APPELLE / REND :
     *   - Repository : MouvementRepository::createQueryBuilder() avec jointure sur Livre
     *   - Session : vérifie 'admin_authenticated' (retourné dans la réponse pour que le JS
     *     adapte l'affichage : boutons admin, colonnes supplémentaires, etc.)
     *   - Retourne : JsonResponse { success, mouvements[], total, isAdmin }
     *     Chaque entrée contient : id, dateHeure, nomPrenom, type, livre{id, isbn, titre, auteur}
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
     * Retourne le formulaire de scan ISBN (fragment HTML pour modale).
     * Point d'entrée du tunnel de création d'un mouvement.
     *
     * APPELÉE PAR :
     *   - JS de home/index.html.twig ou mouvement/index.html.twig
     *     → fetch('/mouvement/debut?action=true') (Sortie)
     *     → fetch('/mouvement/debut?action=false') (Entrée)
     *     Déclenché au clic sur les boutons "Entrée" / "Sortie"
     *
     * APPELLE / REND :
     *   - Twig : mouvement/_modal_debut.html.twig
     *     └── Ce fragment affiche le champ de scan ISBN
     *         et soumet vers confirmation() via JS
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
     * Retourne le formulaire de confirmation du mouvement (fragment HTML pour modale).
     * Deuxième étape du tunnel : affiche le livre trouvé et demande le nom de l'utilisateur.
     *
     * APPELÉE PAR :
     *   - JS de mouvement/_modal_debut.html.twig
     *     → fetch('/mouvement/confirmation/{id}?type_action=true|false')
     *     après qu'un ISBN a été scanné et qu'un livre a été identifié (via LivreController::verifierIsbn())
     *
     * APPELLE / REND :
     *   - Repository : LivreRepository::find($id)
     *   - Twig : mouvement/_modal_confirmation.html.twig
     *     └── Ce fragment affiche les infos du livre et un champ "Nom / Prénom"
     *         puis soumet vers finaliser() via AJAX POST
     *   - Retourne JSON 404 si le livre n'existe pas
     */
    #[Route('/confirmation/{id<\d+>}', name: 'app_mouvement_confirmation')]
    public function confirmation(int $id, Request $requete, LivreRepository $livreRepo): Response
    {
        $livre = $livreRepo->find($id);
        
        if (!$livre) {
            return $this->json(['success' => false, 'message' => 'Livre non trouvé'], 404);
        }
    
        $estUneSortie = $requete->query->get('type_action') === 'true';
    
        // Renvoyer le template HTML directement
        return $this->render('mouvement/_modal_confirmation.html.twig', [
            'livre' => $livre,
            'estSortie' => $estUneSortie
        ]);
    }

    /**
     * Enregistre le mouvement en base et met à jour le stock du livre.
     * Troisième et dernière étape du tunnel.
     *
     * APPELÉE PAR :
     *   - JS de mouvement/_modal_confirmation.html.twig
     *     → fetch POST '/mouvement/finaliser/{id}' avec body : { type_action, nomPrenom }
     *     à la soumission du formulaire de confirmation
     *
     * APPELLE / REND :
     *   - Repository : LivreRepository::find($id)
     *   - Entity : new Mouvement() → setLivre, setNomPrenom, setDateHeure, setType
     *   - Entity : Livre::setNbStock() — décrémente si Sortie, incrémente si Entrée
     *   - Entity : Livre::setActif(true) — réactive automatiquement un livre inactif à l'entrée
     *   - EntityManagerInterface::persist() + flush()
     *   - Retourne : JsonResponse { success, livre{id, titre, auteur, isbn, stock}, type, nomPrenom }
     *     → Le JS utilise cette réponse pour afficher le récapitulatif et rafraîchir le tableau
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
     * Génère et télécharge un fichier Excel des mouvements filtrés.
     *
     * APPELÉE PAR :
     *   - Navigateur (GET /mouvement/export?isbn=...&auteur=...&user=...&type=...&sort=...)
     *   - Bouton "Exporter" dans mouvement/index.html.twig (JS construit l'URL avec les filtres actifs)
     *
     * APPELLE / REND :
     *   - Repository : MouvementRepository::createQueryBuilder() (même logique de filtres que apiListe())
     *   - Service : ExportService::exportMouvements($mouvements)
     *     → génère le fichier .xlsx et retourne son chemin
     *   - Retourne : BinaryFileResponse (téléchargement du fichier)
     *     → Le fichier est supprimé du serveur après envoi (deleteFileAfterSend)
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
