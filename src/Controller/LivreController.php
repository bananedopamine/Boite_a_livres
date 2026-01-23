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

    #region défaut index, show, search

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

    #endregion

    #region gestion_livre verification, new, edit, delete

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
        $livre->setNom($requete->query->get('titre'));
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

        return $this->render('livre/edit.html.twig', [
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

        if ($this->isCsrfTokenValid('delete'.$livre->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($livre);
            $entityManager->flush();
            $this->addFlash('success', 'Le livre a été supprimé.');
        }

        return $this->redirectToRoute('app_livre_index', [], Response::HTTP_SEE_OTHER);
    }

    #endregion
}