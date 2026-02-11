<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 13/01/2026
 * @lastUpdate : 11/02/2026
 */

namespace App\Controller;

use App\Entity\Livre;
use App\Form\LivreType;
use App\Service\ExportService;
use App\Repository\LivreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

#[Route('/livre')]
class LivreController extends AbstractController
{

    private $session;

    public function __construct(RequestStack $requestStack)
    {
        $this->session = $requestStack->getSession();
    }

    #region défaut index, show, search, liste
    #[Route('/', name: 'app_livre_index', methods: ['GET'])]
    public function index(Request $request, LivreRepository $livreRepository): Response
    {
        return $this->render('livre/index.html.twig', [
            'livres' => $livreRepository->findAll(),
            'last_isbn' => $request->query->get('isbn'),
            'last_auteur' => $request->query->get('auteur'),
        ]);
    }

    #[Route('/{id<\d+>}', name: 'app_livre_show', methods: ['GET'])]
    public function show(Livre $livre, Request $request): Response
    {
        // Si c'est une requête AJAX, on ne renvoie que le fragment Twig
        if ($request->isXmlHttpRequest()) {
            return $this->render('livre/_livre_details.html.twig', [
                'livre' => $livre
            ]);
        }

        // Sinon, on renvoie la page complète habituelle 
        return $this->render('livre/show.html.twig', [
            'livre' => $livre,
        ]);
    }

    #[Route('/recherche', name: 'app_livre_search', methods: ['GET'])]
    public function search(Request $request, LivreRepository $livreRepository): Response
    {
        $isbn = $request->query->get('isbn'); 
        $auteur = $request->query->get('auteur'); 

        $qb = $livreRepository->createQueryBuilder('l');

        if (!empty($isbn)) {
            $qb->andWhere('l.isbn LIKE :isbnVal')
               ->setParameter('isbnVal', '%' . $isbn . '%');
        }
        if (!empty($auteur)) {
            $qb->andWhere('l.auteur LIKE :auteurVal')
               ->setParameter('auteurVal', '%' . $auteur . '%');
        }

        $livres = $qb->orderBy('l.isbn', 'ASC')
                     ->getQuery()
                     ->getResult();

        return $this->render('livre/index.html.twig', [
            'livres' => $livres,
            'last_isbn' => $isbn,
            'last_auteur' => $auteur
        ]);
    }

    /**
     * API : Retourne la liste des livres en JSON pour le tableau dynamique
     * Interagit avec : Le JavaScript de la page livre/index.html.twig
     */
    #[Route('/api/liste', name: 'app_livre_api_liste', methods: ['GET'])]
    public function apiListe(Request $request, LivreRepository $livreRepository): JsonResponse
    {
        // Récupération de tous les paramètres
        $isbn = $request->query->get('isbn', '');
        $auteur = $request->query->get('auteur', '');
        $titre = $request->query->get('titre', '');
        $statut = $request->query->get('statut', ''); // 'actif', 'inactif', ou ''
        $stockMin = $request->query->get('stock_min', 0);
        $stockMax = $request->query->get('stock_max', 9999);
        $isAdmin = $this->session->get('admin_authenticated', false);

        // Construction de la requête
        $qb = $livreRepository->createQueryBuilder('l');

        // Filtres de recherche
        if (!empty($isbn)) {
            $qb->andWhere('l.isbn LIKE :isbnVal')
            ->setParameter('isbnVal', '%' . $isbn . '%');
        }
        if (!empty($auteur)) {
            $qb->andWhere('l.auteur LIKE :auteurVal')
            ->setParameter('auteurVal', '%' . $auteur . '%');
        }
        if (!empty($titre)) {
            $qb->andWhere('l.titre LIKE :titreVal')
            ->setParameter('titreVal', '%' . $titre . '%');
        }

        // Filtre par statut actif/inactif/aucun filtres (Admin uniquement)
        if ($isAdmin && !empty($statut)) {
            if ($statut === 'actif') {
                $qb->andWhere('l.actif = :actif')
                ->setParameter('actif', true);
            } elseif ($statut === 'inactif') {
                $qb->andWhere('l.actif = :actif')
                ->setParameter('actif', false);
            }
        }

        // Filtre par plage de stock
        if ($stockMin > 0) {
            $qb->andWhere('l.NbStock >= :stockMin')
            ->setParameter('stockMin', $stockMin);
        }
        if ($stockMax < 9999) {
            $qb->andWhere('l.NbStock <= :stockMax')
            ->setParameter('stockMax', $stockMax);
        }

        // Si pas admin, afficher seulement les livres en stock
        if (!$isAdmin) {
            $qb->andWhere('l.NbStock > 0');
        }

        $livres = $qb->orderBy('l.isbn', 'ASC')
                    ->getQuery()
                    ->getResult();

        // Transformation en tableau pour JSON
        $data = [];
        foreach ($livres as $livre) {
            $data[] = [
                'id' => $livre->getId(),
                'isbn' => $livre->getIsbn(),
                'titre' => $livre->gettitre(),
                'auteur' => $livre->getAuteur(),
                'stock' => $livre->getNbStock(),
                'actif' => $livre->isActif(),
                'lienImg' => $livre->getLienImg(),
                'description' => $livre->getDescription(),
                'genre' => $livre->getGenre()
            ];
        }

        return $this->json([
            'success' => true,
            'livres' => $data,
            'total' => count($data),
            'isAdmin' => $isAdmin
        ]);
    }

    #endregion

    #region verification verifISBN, livre404

    /**
     * API : Vérifie l'existence d'un livre (BDD locale puis Google Books).
     * Interagit avec : Le script JavaScript de la page d'accueil (index.html.twig).
     */
    #[Route('/api/verif-isbn/{isbn}', name: 'app_livre_verif', methods: ['GET'])]
    public function verifierIsbn(string $isbn, LivreRepository $livreRepository, HttpClientInterface $clientHttp): JsonResponse
    {
        // 1. Recherche dans notre base de données locale
        $livreExistant = $livreRepository->findOneBy(['isbn' => $isbn]);

        if ($livreExistant) {
            return $this->json([
                'statut' => 'existe',
                'id'     => $livreExistant->getId()
            ]);
        }

        // 2. Recherche sur l'API Google Books si absent de la BDD
        try {
            $reponse = $clientHttp->request('GET', 'https://www.googleapis.com/books/v1/volumes?q=isbn:' . $isbn);
            $donnees = $reponse->toArray();
        } catch (\Exception $e) {
            $donnees = [];
        }

        // Si Google trouve le livre
        if (isset($donnees['items']) && $donnees['totalItems'] > 0) {
            $info = $donnees['items'][0]['volumeInfo'];
            
            // Récupération du genre (categories)
            $genre = '';
            if (isset($info['categories']) && is_array($info['categories']) && count($info['categories']) > 0) {
                // Prend la première catégorie ou joint toutes les catégories
                $genre = implode(', ', $info['categories']);
            }
            
            return $this->json([
                'statut' => 'google',
                'donnees' => [
                    'isbn'        => $isbn,
                    'titre'       => $info['title'] ?? '',
                    'auteur'      => isset($info['authors']) ? implode(', ', $info['authors']) : '',
                    'description' => $info['description'] ?? '',
                    'image'       => $info['imageLinks']['thumbnail'] ?? '',
                    'genre'       => $genre
                ]
            ]);
        }

        // 3. Cas où le livre n'est nulle part
        return $this->json([
            'statut' => 'inconnu', 
            'isbn' => $isbn
        ]);
    }

    /**
     * Affiche la modale "livre introuvable"
     * Interagit avec : Le JavaScript de la page d'accueil
     */
    #[Route('/modal-not-found/{isbn}', name: 'app_livre_modal_not_found', methods: ['GET'])]
    public function modalNotFound(string $isbn, Request $request): Response
    {
        $typeAction = $request->query->get('typeAction', 'false');
        
        return $this->render('livre/_modal_livre_not_found.html.twig', [
            'isbn' => $isbn,
            'typeAction' => $typeAction
        ]);
    }
    
    #endregion

    #region création new, newManuel 

    /**
     * Création rapide d'un livre avec ISBN et titre uniquement
     * Interagit avec : _modal_livre_creation_manuel.html.twig
     */
    #[Route('/creation-rapide', name: 'app_livre_creation_manuel', methods: ['POST'])]
    public function newManuel(Request $request, EntityManagerInterface $em, LivreRepository $livreRepository): JsonResponse
    {
        $isbn = $request->request->get('isbn');
        $titre = $request->request->get('titre');
        $auteur = $request->request->get('auteur', '');
        $genre = $request->request->get('genre', '');

        // Validation
        if (empty($isbn) || empty($titre)) {
            return $this->json([
                'success' => false,
                'message' => 'L\'ISBN et le titre sont obligatoires'
            ], 400);
        }

        // Vérifier que l'ISBN n'existe pas déjà 
        $existant = $livreRepository->findOneBy(['isbn' => $isbn]);
        if ($existant) {
            return $this->json([
                'success' => false,
                'message' => 'Un livre avec cet ISBN existe déjà'
            ], 400);
        }

        // Créer le livre avec les valeurs par défaut
        $livre = new Livre();
        $livre->setIsbn($isbn);
        $livre->settitre($titre);
        $livre->setAuteur($auteur ?: 'Auteur inconnu'); // Valeur par défaut si vide
        $livre->setDescription(''); // Valeur par défaut
        $livre->setLienImg(null); // Optionnel
        $livre->setGenre($genre ?: 'non référencer'); // Genre optionnel
        $livre->setNbStock(0);
        $livre->setActif(true);

        try {
            $em->persist($livre);
            $em->flush();

            return $this->json([
                'success' => true,
                'id' => $livre->getId(),
                'message' => 'Livre créé avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la création : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retourne le formulaire de création de livre (fragment HTML pour modale).
     * Interagit avec : _modal_new.html.twig et le script JS principal.
     */
    #[Route('/nouveau', name: 'app_livre_new', methods: ['GET', 'POST'])]
    public function new(Request $requete, EntityManagerInterface $em): Response
    {
        $livre = new Livre();

        // On pré-remplit l'objet Livre avec les données reçues en GET (provenant de l'API Google)
        $livre->setIsbn($requete->query->get('isbn'));
        $livre->settitre($requete->query->get('titre'));
        $livre->setAuteur($requete->query->get('auteur'));
        $livre->setDescription($requete->query->get('description'));
        $livre->setLienImg($requete->query->get('image'));
        $livre->setGenre($requete->query->get('genre')); // Ajout du genre
        $livre->setNbStock(0); // Initialisation du stock

        $formulaire = $this->createForm(LivreType::class, $livre);
        $formulaire->handleRequest($requete);

        if ($formulaire->isSubmitted() && $formulaire->isValid()) {
            $em->persist($livre);
            $em->flush();

            // Réponse JSON pour indiquer au JS que la création est réussie
            return $this->json([
                'success' => true,
                'id'      => $livre->getId()
            ]);
        }

        // Retourne uniquement le fragment Twig pour l'affichage en modale
        return $this->render('livre/_modal_livre_new.html.twig', [
            'form' => $formulaire->createView(),
        ], new Response(null, $formulaire->isSubmitted() ? 422 : 200));
    }

    #endregion 

    #region gestion edit, delete

    #[Route('/{id}/edit', name: 'app_livre_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Livre $livre, EntityManagerInterface $entityManager): Response
    {
        // Vérification admin
        if (!$this->session->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_login');
        }

        $form = $this->createForm(LivreType::class, $livre);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            // Si c'est une requête AJAX, retourner JSON
            if ($request->isXmlHttpRequest()) {
                return $this->json([
                    'success' => true,
                    'message' => 'Le livre a été mis à jour avec succès.'
                ]);
            }

            // Sinon, redirection classique
            $this->addFlash('success', 'Le livre a été mis à jour avec succès.');
            return $this->redirectToRoute('app_livre_index', [], Response::HTTP_SEE_OTHER);
        }

        // Si le formulaire a des erreurs et c'est AJAX, retourner le HTML avec status 422
        if ($form->isSubmitted() && !$form->isValid() && $request->isXmlHttpRequest()) {
            return $this->render('livre/_modal_edit.html.twig', [
                'livre' => $livre,
                'form' => $form,
            ], new Response(null, 422));
        }

        // Retourner le template (qui gérera lui-même AJAX vs page complète)
        return $this->render('livre/_modal_edit.html.twig', [
            'livre' => $livre,
            'form' => $form,
        ]);
    }


    #[Route('/{id}/delete', name: 'app_livre_delete')]
    public function delete(Request $request, Livre $livre, EntityManagerInterface $entityManager): Response
    {
        if (!$this->session->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_login');
        }
        $livre->setActif(false);

        $entityManager->persist($livre);
        $entityManager->flush();


        return $this->redirectToRoute('app_livre_index', [], Response::HTTP_SEE_OTHER);
    }

    #endregion

    #region Excel export

    /**
     * Export des livres en Excel (filtrés selon les critères de recherche)
     */
    #[Route('/export', name: 'app_livre_export', methods: ['GET'])]
    public function export(Request $request, LivreRepository $livreRepository, ExportService $exportService): Response
    {
        // Récupération de tous les paramètres
        $isbn = $request->query->get('isbn', '');
        $auteur = $request->query->get('auteur', '');
        $titre = $request->query->get('titre', '');
        $statut = $request->query->get('statut', '');
        $stockMin = $request->query->get('stock_min', 0);
        $stockMax = $request->query->get('stock_max', 9999);
        $isAdmin = $this->session->get('admin_authenticated', false);

        // Construction de la requête (même logique que apiListe)
        $qb = $livreRepository->createQueryBuilder('l');

        // Filtres de recherche
        if (!empty($isbn)) {
            $qb->andWhere('l.isbn LIKE :isbnVal')
            ->setParameter('isbnVal', '%' . $isbn . '%');
        }
        if (!empty($auteur)) {
            $qb->andWhere('l.auteur LIKE :auteurVal')
            ->setParameter('auteurVal', '%' . $auteur . '%');
        }
        if (!empty($titre)) {
            $qb->andWhere('l.titre LIKE :titreVal')
            ->setParameter('titreVal', '%' . $titre . '%');
        }

        // Filtre par statut actif/inactif/aucun filtres (admin uniquement)
        if ($isAdmin && !empty($statut)) {
            if ($statut === 'actif') {
                $qb->andWhere('l.actif = :actif')
                ->setParameter('actif', true);
            } elseif ($statut === 'inactif') {
                $qb->andWhere('l.actif = :actif')
                ->setParameter('actif', false);
            }
        }

        // Filtre par plage de stock
        if ($stockMin > 0) {
            $qb->andWhere('l.NbStock >= :stockMin')
            ->setParameter('stockMin', $stockMin);
        }
        if ($stockMax < 9999) {
            $qb->andWhere('l.NbStock <= :stockMax')
            ->setParameter('stockMax', $stockMax);
        }

        // Si pas admin, afficher seulement les livres en stock
        if (!$isAdmin) {
            $qb->andWhere('l.NbStock > 0');
        }

        $livres = $qb->orderBy('l.isbn', 'ASC')
                    ->getQuery()
                    ->getResult();

        // Générer le fichier Excel
        $filepath = $exportService->exportLivres($livres, $isAdmin);

        // Préparer la réponse de téléchargement
        $response = new BinaryFileResponse($filepath);
        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');


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
