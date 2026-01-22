<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 12/01/2026
 * @lastUpdate : 19/01/2026
 */

namespace App\Controller;

use App\Entity\Livre;
use App\Entity\Mouvement;
use App\Repository\LivreRepository;
use App\Repository\MouvementRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/mouvement')]
class MouvementController extends AbstractController
{
    #[Route('/', name:'app_mouvement_index')]
    public function index(MouvementRepository $mouvements) : Response
    {
        return $this->render('mouvement/index.html.twig', [
            'mouvements' => $mouvements->findBy([], ['dateHeure' => 'DESC']),
        ]);
    }
    #[Route('/debut/{action}', name: 'app_mouvement_debut', defaults: ['action' => null])]
    public function debut(?string $action, Request $request): Response
    {
        // Si c'est une requête AJAX, on ne renvoie que le fragment Twig
        if ($request->isXmlHttpRequest()) {
            return $this->render('mouvement/_modal_debut.html.twig', [
                'selection_defaut' => $action
            ]);
        }

        // Sinon, on renvoie la page complète habituelle 
        return $this->render('mouvement/debut.html.twig', [
            'selection_defaut' => $action
        ]);
    }

    #[Route('/show/{id<\d+>}', name: 'app_mouvement_show')]
    public function show(Mouvement $mouvement, Request $request): Response
    {
        // Si c'est une requête AJAX, on ne renvoie que le fragment Twig
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

    #[Route('/verification', name: 'app_mouvement_verification', methods: ['POST'])]
    public function verificationIsbn(Request $requete, LivreRepository $depotLivre): Response
    {
        $isbnRecu = $requete->request->get('isbn');
        $typeAction = $requete->request->get('type_action'); 

        $livre = $depotLivre->findOneBy(['isbn' => $isbnRecu]);

        /// Cas SORTIE (true)
        if ($typeAction === 'true') {
            if (!$livre) {
                $this->addFlash('error', 'Livre inconnu. Impossible de sortir un livre absent de l\'inventaire.');
                return $this->redirectToRoute('app_mouvement_debut', ['action' => 'true']);
            }
        
            return $this->redirectToRoute('app_mouvement_confirmation', [
                'id' => $livre->getId(),
                'type' => 'true' 
            ]);
        } 
        // Cas ENTRÉE (false)
        else {
            if ($livre) {
                return $this->redirectToRoute('app_mouvement_confirmation', [
                    'id' => $livre->getId(),
                    'type' => 'false'
                ]);
            } 
            else {
                return $this->redirectToRoute('app_livre_google_check', [
                    'isbn' => $isbnRecu,
                    'origine' => 'mouvement_entree'
                ]);
            }
        }
    }

    #[Route('/confirmation/{id}/{type}', name: 'app_mouvement_confirmation', methods: ['GET'])]
    public function confirmation(Livre $livre, string $type): Response 
    {
        return $this->render('mouvement/confirmation.html.twig', [
            'livre' => $livre,
            'estSortie' => ($type === 'true') 
        ]);
    }

    #[Route('/finaliser/{id}', name: 'app_mouvement_finaliser', methods: ['POST'])]
    public function finaliserMouvement(
        Livre $livre, 
        Request $requete, 
        EntityManagerInterface $gestionnaireEntite
    ): Response {
        $nomPrenom = $requete->request->get('nomPrenom');
        
        $typeRaw = $requete->request->get('type_action'); 
        $estUneSortie = ($typeRaw === 'true' || $typeRaw === 1);

        $mouvement = new Mouvement();
        $mouvement->setLivre($livre); 
        $mouvement->setNomPrenom($nomPrenom);
        $mouvement->setType($estUneSortie); 
        $mouvement->setDateHeure(new \DateTime());

        $stockActuel = $livre->getNbStock();

        if ($estUneSortie) { 
            // CAS SORTIE (Retrait)
            if ($stockActuel > 0) {
                $livre->setNbStock($stockActuel - 1);
            } else {
                $livre->setNbStock(0);
                $this->addFlash('warning', 'Le stock était déjà à 0.');
            }
        } else {
            // CAS ENTRÉE (Depot)
            $livre->setNbStock($stockActuel + 1);
        }

        $gestionnaireEntite->persist($mouvement);
        $gestionnaireEntite->persist($livre);
        $gestionnaireEntite->flush();

        $this->addFlash('success', 'Mouvement enregistré avec succès !');

        return $this->redirectToRoute('home_index');
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
}