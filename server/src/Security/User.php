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
        return $this->row['user_id'];
    }

    public function getOrganizationId(): int
    {
        return $this->row['organization_id'];
    }

    public function getUserIdentifier(): string
    {
        return $this->row['username'];
    }

    public function getRoles(): array
    {
        $roles = explode(',', $this->row['role']);

        return [
            'ROLE_USER',
            ...$roles,
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

    public function eraseCredentials(): void
    {
    }

    public function getUsername(): string
    {
        return $this->row['username'];
    }
}
