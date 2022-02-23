<?php declare(strict_types=1);

namespace Leif;

final class ValidationResult
{
    private array $errors = [];

    public function addErrorForKey(string $key, string $message): void
    {
        if (!isset($this->errors[$key])) {
            $this->errors[$key] = [];
        }
        $this->errors[$key][] = $message;
    }

    public function getErrorsForKey(string $key): array
    {
        return $this->errors[$key] ?? [];
    }

    public function getAllErrors(): array
    {
        return $this->errors;
    }

    public function getErrorCount(): int
    {
        $num = 0;
        foreach ($this->errors as $errors) {
            $num += count($errors);
        }
        return $num;
    }

    public function isValid(): bool
    {
        return $this->errors === [];
    }
}
