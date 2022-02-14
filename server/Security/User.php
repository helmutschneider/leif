<?php declare(strict_types=1);

namespace Leif\Security;

use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    private array $row;

    public function __construct(array $row)
    {
        $this->row = $row;
    }

    public function getId(): int
    {
        return (int) $this->row['user_id'];
    }

    public function getUserIdentifier(): string
    {
        return $this->row['username'];
    }

    public function getRoles(): array
    {
        return [
            'ROLE_USER',
        ];
    }

    public function getPassword(): ?string
    {
        return $this->row['password_hash'];
    }

    public function getSalt(): ?string
    {
        return null;
    }

    public function eraseCredentials()
    {
    }

    public function getUsername(): string
    {
        return $this->row['username'];
    }
}
