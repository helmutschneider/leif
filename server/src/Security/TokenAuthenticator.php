<?php declare(strict_types=1);

namespace Leif\Security;

use Leif\Security\TokenUserProvider;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class TokenAuthenticator extends AbstractAuthenticator
{
    const AUTH_HEADER_NAME = 'Authorization';
    const AUTH_QUERY_NAME = 'token';

    private TokenUserProvider $userProvider;

    public function __construct(TokenUserProvider $userProvider)
    {
        $this->userProvider = $userProvider;
    }

    public function supports(Request $request): ?bool
    {
        return $request->query->has(static::AUTH_QUERY_NAME)
            || $request->headers->has(static::AUTH_HEADER_NAME);
    }

    public function authenticate(Request $request): Passport
    {
        $token = $request->query->get(static::AUTH_QUERY_NAME, '')
            ?: $request->headers->get(static::AUTH_HEADER_NAME, '');
        $loader = [$this->userProvider, 'loadUserByApiToken'];

        return new SelfValidatingPassport(new UserBadge($token, $loader));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        $data = [
            'message' => $exception->getMessageKey(),
        ];

        return new JsonResponse($data, Response::HTTP_UNAUTHORIZED);
    }
}
