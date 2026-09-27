<?php declare(strict_types=1);

namespace Leif\Security;

use Override;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authorization\AccessDeniedHandlerInterface;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

class EntryPoint implements AuthenticationEntryPointInterface
{
    #[Override]
    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        if ($request->getContentTypeFormat() === 'json') {
            return new Response('', Response::HTTP_UNAUTHORIZED);
        }

        return new RedirectResponse('/login');
    }
}
