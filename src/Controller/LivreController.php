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

#[Route('/livre')]
class LivreController extends AbstractController
{
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
        return $this->render('livre/_modal_new.html.twig', [
            'form' => $formulaire->createView(),
        ], new Response(null, $formulaire->isSubmitted() ? 422 : 200));
    }
}