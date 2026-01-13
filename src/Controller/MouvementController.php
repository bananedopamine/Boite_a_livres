<?php

namespace App\Controller;

use App\Entity\Livre;
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
    #[Route('/debut/{action}', name: 'app_mouvement_debut', defaults: ['action' => null])]
    public function debut(?string $action): Response
    {
        // 'false' pour entrée, 'true' pour sortie
        return $this->render('mouvement/debut.html.twig', [
            'selection_defaut' => $action
        ]);
    }

    #[Route('/verification', name: 'app_mouvement_verification', methods: ['POST'])]
    public function verificationIsbn(Request $requete, LivreRepository $depotLivre): Response
    {
        $isbnRecu = $requete->request->get('isbn'); 
        // On récupère la valeur. Si c'est vide, on met 'false' par défaut
        $typeAction = $requete->request->get('type_action'); 

        // On cherche le livre par son ISBN
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
            } else {
                // Si le livre n'existe pas encore, on doit le créer avant de faire l'entrée
                return $this->redirectToRoute('app_livre_new', [
                    'isbn_pre_rempli' => $isbnRecu,
                    'origine' => 'mouvement_entree'
                ]);
            }
        }
    }

    #[Route('/confirmation/{id}/{type}', name: 'app_mouvement_confirmation', methods: ['GET'])]
    public function confirmation(Livre $livre, string $type): Response // On force le type string
    {
        return $this->render('mouvement/confirmation.html.twig', [
            'livre' => $livre,
            // On crée un vrai booléen pour Twig en comparant la chaîne
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
        
        // On récupère la valeur et on s'assure de tester la chaîne 'true'
        $typeRaw = $requete->request->get('type_action'); 
        $estUneSortie = ($typeRaw === 'true' || $typeRaw === 1);

        $mouvement = new Mouvement();
        $mouvement->setLivre($livre); 
        $mouvement->setNomPrenom($nomPrenom);
        $mouvement->setType($estUneSortie); // Stocke true pour sortie, false pour entrée
        $mouvement->setDateHeure(new \DateTime());

        $stockActuel = $livre->getNbStock();

        if ($estUneSortie) { 
            // CAS SORTIE (Emprunt)
            if ($stockActuel > 0) {
                $livre->setNbStock($stockActuel - 1);
            } else {
                $livre->setNbStock(0);
                $this->addFlash('warning', 'Le stock était déjà à 0.');
            }
        } else {
            // CAS ENTRÉE (Retour)
            $livre->setNbStock($stockActuel + 1);
        }

        $gestionnaireEntite->persist($mouvement);
        $gestionnaireEntite->persist($livre);
        $gestionnaireEntite->flush();

        $this->addFlash('success', 'Mouvement enregistré avec succès !');

        return $this->redirectToRoute('home_index');
    }
}