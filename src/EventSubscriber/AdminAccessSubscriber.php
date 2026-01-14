<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\RouterInterface;

class AdminAccessSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private RequestStack $requestStack,
        private RouterInterface $router
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $route = $request->attributes->get('_route');

        if ($route === 'app_admin_login' || $route === 'app_livre_index' || $route === 'app_livre_show' || $route === 'app_livre_search' || $route === 'app_livre_new') {
            return;
        }

        if (str_starts_with($route, 'app_livre_')) {
            $session = $this->requestStack->getSession();
            if (!$session->get('admin_authenticated')) {
                $event->setResponse(new RedirectResponse($this->router->generate('app_admin_login')));
            }
        }
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => 'onKernelRequest'];
    }
}