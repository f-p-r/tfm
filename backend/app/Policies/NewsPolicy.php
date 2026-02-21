<?php

namespace App\Policies;

use App\Models\News;
use App\Models\User;
use App\Services\AuthorizationService;

class NewsPolicy
{
    /**
     * Crear noticias: requiere permiso 'news.edit' en el scope de la noticia
     */
    public function create(User $user, int $scopeType, ?int $scopeId = null): bool
    {
        $authService = app(AuthorizationService::class);

        return $authService->userHasPermissionInScope(
            $user,
            'news.edit',
            $scopeType,
            $scopeId
        );
    }

    /**
     * Actualizar noticias: requiere permiso 'news.edit' en el scope de la noticia
     */
    public function update(User $user, News $news): bool
    {
        $authService = app(AuthorizationService::class);

        return $authService->userHasPermissionInScope(
            $user,
            'news.edit',
            $news->scope_type,
            $news->scope_id
        );
    }

    /**
     * Eliminar noticias: requiere permiso 'news.edit' en el scope de la noticia
     */
    public function delete(User $user, News $news): bool
    {
        $authService = app(AuthorizationService::class);

        return $authService->userHasPermissionInScope(
            $user,
            'news.edit',
            $news->scope_type,
            $news->scope_id
        );
    }
}
