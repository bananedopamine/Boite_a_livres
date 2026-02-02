<?php

namespace App\Controller;

use App\Entity\Livre;
use App\Form\LivreType;
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
        $isbn = $request->query->get('isbn', '');
        $auteur = $request->query->get('auteur', '');
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
                'description' => $livre->getDescription()
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

    #region verification 

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
            return $this->json([
                'statut' => 'google',
                'donnees' => [
                    'isbn'        => $isbn,
                    'titre'       => $info['title'] ?? '',
                    'auteur'      => isset($info['authors']) ? implode(', ', $info['authors']) : '',
                    'description' => $info['description'] ?? '',
                    'image'       => $info['imageLinks']['thumbnail'] ?? ''
                ]
            ]);
        }

        // 3. Cas où le livre n'est nulle part
        return $this->json([
            'statut' => 'inconnu', 
            'isbn' => $isbn
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
        if (!$this->session->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_login');
        }

        $form = $this->createForm(LivreType::class, $livre);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            $this->addFlash('success', 'Le livre a été mis à jour avec succès.');
            return $this->redirectToRoute('app_livre_index', [], Response::HTTP_SEE_OTHER);
        }

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
}
