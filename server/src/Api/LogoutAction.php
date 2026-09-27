<?php declare(strict_types=1);

namespace Leif\Api;

use Symfony\Component\HttpFoundation\RedirectResponse;

class LogoutAction
{
    public function __invoke()
    {
        $res = new RedirectResponse('/login');
        $res->headers->clearCookie('token');
        return $res;
    }
}
