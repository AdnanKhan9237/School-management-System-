<?php

declare(strict_types=1);

namespace App\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface BaseRepositoryInterface
{
    public function all(): Collection;

    public function find(int|string $id): ?Model;

    public function create(array $attributes): Model;

    public function update(int|string $id, array $attributes): ?Model;

    public function delete(int|string $id): bool;
}
