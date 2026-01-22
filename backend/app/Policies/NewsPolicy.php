<?php

namespace App\Policies;

use App\Models\News;
use App\Models\User;
use App\Services\AuthorizationService;

class NewsPolicy
{
    /**
     * Crear noticias: requiere permiso 'news.create' en el scope de la noticia
     */
    public function create(User $user, ?int $associationId = null, ?int $gameId = null): bool
    {
        $authService = app(AuthorizationService::class);
        $scope = $authService->getScopeForContent($associationId, $gameId);

        return $authService->userHasPermissionInScope(
            $user,
            'news.create',
            $scope['scope_type'],
            $scope['scope_id']
        );
    }

    /**
     * Actualizar noticias: requiere permiso 'news.update' en el scope de la noticia
     */
    public function update(User $user, News $news): bool
    {
        $authService = app(AuthorizationService::class);
        $scope = $authService->getScopeForContent($news->association_id, $news->game_id);

        return $authService->userHasPermissionInScope(
            $user,
            'news.update',
            $scope['scope_type'],
            $scope['scope_id']
        );
    }

    /**
     * Publicar noticias: requiere permiso 'news.publish' en el scope de la noticia
     */
    public function publish(User $user, News $news): bool
    {
        $authService = app(AuthorizationService::class);
        $scope = $authService->getScopeForContent($news->association_id, $news->game_id);

        return $authService->userHasPermissionInScope(
            $user,
            'news.publish',
            $scope['scope_type'],
            $scope['scope_id']
        );
    }
}
