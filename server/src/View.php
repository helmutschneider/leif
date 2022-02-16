<?php declare(strict_types=1);

namespace Leif;

final class View
{
    private string $path;

    public function __construct(string $path)
    {
        $this->path = $path;
    }

    public function renderChild(string $path, array $parameters = []): string
    {
        return (new static($path))->render($parameters);
    }

    public function render(array $parameters = []): string
    {
        ob_start();
        extract($parameters, EXTR_SKIP);
        require $this->path;
        return ob_get_clean();
    }
}
