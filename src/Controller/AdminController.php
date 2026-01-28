<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 14/01/2026
 * @lastUpdate : 14/01/2026
 */

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\RequestStack;

#[Route('/admin')]
class AdminController extends AbstractController
{
    private $session;

    public function __construct(RequestStack $requestStack)
    {
        $this->session = $requestStack->getSession();
    }

    /**
     * Page d'accueil admin
     */
    #[Route('/', name: 'app_admin_index')]
    public function index(): Response
    {
        if (!$this->session->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_login');
        }

        return $this->render('admin/index.html.twig');
    }

    /**
     * Page de connexion admin
     */
    #[Route('/login', name: 'app_admin_login', methods: ['GET', 'POST'])]
    public function login(Request $request): Response
    {
        // Si déjà connecté, rediriger vers l'accueil admin
        if ($this->session->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_index');
        }

        $error = null;

        if ($request->isMethod('POST')) {
            $pinEntered = $request->request->get('pin');
            $pinCorrect = $_ENV['PIN_ADMIN'] ?? '0000';

            if ($pinEntered === $pinCorrect) {
                $this->session->set('admin_authenticated', true);
                $this->addFlash('success', 'Connexion administrateur réussie.');
                return $this->redirectToRoute('app_admin_index');
            } else {
                $error = 'Code PIN incorrect.';
            }
        }

        return $this->render('admin/login.html.twig', [
            'error' => $error
        ]);
    }

    /**
     * Déconnexion admin
     */
    #[Route('/logout', name: 'app_admin_logout')]
    public function logout(): Response
    {
        $this->session->remove('admin_authenticated');
        $this->addFlash('success', 'Vous avez été déconnecté.');
        return $this->redirectToRoute('home_index');
    }

    /**
     * ✅ NOUVELLE PAGE : Paramètres admin
     */
    #[Route('/settings', name: 'app_admin_settings', methods: ['GET', 'POST'])]
    public function settings(Request $request): Response
    {
        if (!$this->session->get('admin_authenticated')) {
            return $this->redirectToRoute('app_admin_login');
        }

        $error = null;
        $success = null;

        if ($request->isMethod('POST')) {
            $action = $request->request->get('action');

            if ($action === 'change_pin') {
                $currentPin = $request->request->get('current_pin');
                $newPin = $request->request->get('new_pin');
                $confirmPin = $request->request->get('confirm_pin');

                // Vérification du PIN actuel
                $pinCorrect = $_ENV['PIN_ADMIN'] ?? '0000';

                if ($currentPin !== $pinCorrect) {
                    $error = 'Le code PIN actuel est incorrect.';
                } elseif (empty($newPin) || strlen($newPin) < 4) {
                    $error = 'Le nouveau PIN doit contenir au moins 4 caractères.';
                } elseif ($newPin !== $confirmPin) {
                    $error = 'Les deux nouveaux codes PIN ne correspondent pas.';
                } else {
                    // Mise à jour du .env
                    if ($this->updateEnvFile('PIN_ADMIN', $newPin)) {
                        $success = 'Le code PIN a été modifié avec succès. Veuillez vous reconnecter.';
                        // Déconnecter l'admin pour qu'il se reconnecte avec le nouveau PIN
                        $this->session->remove('admin_authenticated');
                    } else {
                        $error = 'Erreur lors de la mise à jour du fichier .env. Vérifiez les permissions.';
                    }
                }
            }
        }

        return $this->render('admin/settings.html.twig', [
            'error' => $error,
            'success' => $success,
            'current_pin' => $_ENV['PIN_ADMIN'] ?? '0000'
        ]);
    }

    /**
     * ✅ Fonction helper pour modifier le fichier .env
     */
    private function updateEnvFile(string $key, string $value): bool
    {
        $envFile = $this->getParameter('kernel.project_dir') . '/.env';
        $envLocalFile = $this->getParameter('kernel.project_dir') . '/.env.local';

        // On privilégie .env.local s'il existe
        $targetFile = file_exists($envLocalFile) ? $envLocalFile : $envFile;

        if (!file_exists($targetFile)) {
            return false;
        }

        $content = file_get_contents($targetFile);
        $pattern = "/^{$key}=.*/m";

        if (preg_match($pattern, $content)) {
            // La clé existe, on la remplace
            $newContent = preg_replace($pattern, "{$key}={$value}", $content);
        } else {
            // La clé n'existe pas, on l'ajoute
            $newContent = $content . "\n{$key}={$value}\n";
        }

        return file_put_contents($targetFile, $newContent) !== false;
    }
}