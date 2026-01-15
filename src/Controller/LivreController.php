<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 12/01/2026
 * @lastUpdate : 12/01/2026
 */

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;

use App\Repository\LivreRepository;
use App\Entity\Livre;
use App\Entity\Category;
use App\Form\LivreType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/livre')]
class LivreController extends AbstractController
{
    private $session;

    public function __construct(RequestStack $requestStack)
    {
        $this->session = $requestStack->getSession();
    }


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
    public function show(Livre $livre): Response
    {
        return $this->render('livre/show.html.twig', [
            'livre' => $livre,
        ]);
    }

    #[Route('/new', name: 'app_livre_new')]
    public function new(Request $requete, EntityManagerInterface $gestionnaireEntite): Response
    {
        $livre = new Livre();
        
        // 1. Récupération des paramètres depuis l'URL (envoyés par checkGoogleBooks)
        $isbnPreRempli        = $requete->query->get('isbn_pre_rempli');
        $titrePreRempli       = $requete->query->get('titre_pre_rempli');
        $auteurPreRempli      = $requete->query->get('auteur_pre_rempli');
        $descriptionPreRemplie = $requete->query->get('description_pre_remplie');
        $imagePreRemplie      = $requete->query->get('image_pre_remplie');

        if ($isbnPreRempli) {
            $livre->setISBN($isbnPreRempli);
            $livre->setNbStock(1);
        }
        
        if ($titrePreRempli) {
            $livre->setNom($titrePreRempli);
        }
        
        if ($auteurPreRempli) {
            $livre->setAuteur($auteurPreRempli);
        }

        if ($descriptionPreRemplie) {
            $livre->setDescription($descriptionPreRemplie);
        }

        if ($imagePreRemplie) {
            $livre->setLienImg($imagePreRemplie); 
        }
        

        $formulaire = $this->createForm(LivreType::class, $livre);
        $formulaire->handleRequest($requete);

        if ($formulaire->isSubmitted() && $formulaire->isValid()) {
            if ($livre->getNbStock() === null) {
                $livre->setNbStock(1);
            }

            $gestionnaireEntite->persist($livre);
            $gestionnaireEntite->flush();
        
            $origine = $requete->query->get('origine');
            if ($origine === 'mouvement_entree') {
                return $this->redirectToRoute('app_mouvement_confirmation', [
                    'id' => $livre->getId(),
                    'type' => 'false' 
                ]);
            }

            return $this->redirectToRoute('app_livre_index');
        }

        return $this->render('livre/new.html.twig', [
            'livre' => $livre,
            'form' => $formulaire,
            // 'image_url' => $imagePreRemplie,
        ]);
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

    #[Route('/{id}/delete', name: 'app_livre_delete', methods: ['POST'])]
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

    #[Route('/check-google/{isbn}', name: 'app_livre_google_check')]
    public function checkGoogleBooks(string $isbn, HttpClientInterface $httpClient): Response
    {
        try {
            $response = $httpClient->request(
                'GET',
                'https://www.googleapis.com/books/v1/volumes?q=isbn:' . $isbn
            );
            $data = $response->toArray();
        } catch (\Exception $e) {
            $data = [];
        }

        if (!isset($data['items']) || $data['totalItems'] === 0) {
            $this->addFlash('warning', 'Livre inconnu sur Google Books. Création manuelle.');
            return $this->redirectToRoute('app_livre_new', [
                'isbn_pre_rempli' => $isbn
            ]);
        }

        $info = $data['items'][0]['volumeInfo'];
        $this->addFlash('success', 'Livre trouvé sur Google !');

        return $this->redirectToRoute('app_livre_new', [
            'isbn_pre_rempli'         => $isbn,
            'titre_pre_rempli'        => $info['title'] ?? '',
            'auteur_pre_rempli'       => isset($info['authors']) ? implode(', ', $info['authors']) : '',
            'description_pre_remplie' => $info['description'] ?? '',
            'image_pre_remplie'       => $info['imageLinks']['thumbnail'] ?? '',
            'origine'                 => 'mouvement_entree' 
        ]);
    }
}