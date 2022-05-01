<?php declare(strict_types=1);

namespace Leif;

use Symfony\Component\HttpKernel\Event\ResponseEvent;

final class ResponseListener
{
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function onKernelResponse(ResponseEvent $event)
    {
        $headers = $event->getResponse()->headers;

        foreach ($this->data as $key => $value) {
            $headers->set("X-$key", (string) $value);
        }
    }
}
