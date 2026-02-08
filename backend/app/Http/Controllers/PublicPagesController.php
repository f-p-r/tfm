<?php

namespace App\Http\Controllers;

use App\Enums\ScopeType;
use App\Http\Requests\PublicByOwnerSlugRequest;
use App\Http\Requests\PublicHomePageRequest;
use App\Models\Association;
use App\Models\Game;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PublicPagesController extends Controller
{
    public function home(PublicHomePageRequest $request): JsonResponse
    {
        $ownerType = $request->getOwnerType();
        $ownerSlug = $request->getOwnerSlug();

        if (! $this->isSupportedOwnerType($ownerType)) {
            // TODO: soportar otros ownerType (news, event, ...)
            return response()->json(['message' => 'Owner type no soportado.'], 501);
        }

        // For GLOBAL ownerType, ownerId is always 0
        if ($ownerType === (string)ScopeType::GLOBAL->value) {
            $ownerId = 0;
            $homePageId = null;
            // TODO: implement logic to get homePageId for GLOBAL scope
            if (! $homePageId) {
                return response()->json(['message' => 'Home page not found.'], 404);
            }

            $page = Page::query()
                ->where('id', $homePageId)
                ->where('owner_type', $ownerType)
                ->where('owner_id', $ownerId)
                ->where('published', true)
                ->first();

            if (! $page) {
                return response()->json(['message' => 'Page not found.'], 404);
            }

            return response()->json($this->mapPage($page));
        }

        $owner = $this->resolveOwnerBySlug($ownerType, $ownerSlug);

        if (! $owner) {
            return response()->json(['message' => 'Owner not found.'], 404);
        }

        if (! $owner->homePageId) {
            return response()->json(['message' => 'Home page not found.'], 404);
        }

        $page = Page::query()
            ->where('id', $owner->homePageId)
            ->where('owner_type', $ownerType)
            ->where('owner_id', $owner->id)
            ->where('published', true)
            ->first();

        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        return response()->json($this->mapPage($page));
    }

    public function byOwnerSlug(PublicByOwnerSlugRequest $request): JsonResponse
    {
        $ownerType = $request->getOwnerType();
        $ownerSlug = $request->getOwnerSlug();
        $pageSlug = $request->getPageSlug();

        if (! $this->isSupportedOwnerType($ownerType)) {
            // TODO: soportar otros ownerType (news, event, ...)
            return response()->json(['message' => 'Owner type no soportado.'], 501);
        }

        // For GLOBAL ownerType, ownerId is always 0
        if ($ownerType === (string)ScopeType::GLOBAL->value) {
            $ownerId = 0;

            $page = Page::query()
                ->where('owner_type', $ownerType)
                ->where('owner_id', $ownerId)
                ->where('slug', $pageSlug)
                ->where('published', true)
                ->first();

            if (! $page) {
                return response()->json(['message' => 'Page not found.'], 404);
            }

            return response()->json($this->mapPage($page));
        }

        $owner = $this->resolveOwnerBySlug($ownerType, $ownerSlug);

        if (! $owner) {
            return response()->json(['message' => 'Owner not found.'], 404);
        }

        $page = Page::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $owner->id)
            ->where('slug', $pageSlug)
            ->where('published', true)
            ->first();

        if (! $page) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        return response()->json($this->mapPage($page));
    }

    public function show(Page $page): JsonResponse
    {
        // Solo mostrar páginas publicadas en endpoints públicos
        if (!$page->published) {
            return response()->json(['message' => 'Page not found.'], 404);
        }

        return response()->json($this->mapPage($page));
    }

    private function resolveOwnerBySlug(string $ownerType, string $ownerSlug): Association|Game|null
    {
        if ($ownerType === (string)ScopeType::ASSOCIATION->value) {
            return Association::query()->where('slug', $ownerSlug)->first();
        }

        if ($ownerType === (string)ScopeType::GAME->value) {
            return Game::query()->where('slug', $ownerSlug)->first();
        }

        return null;
    }

    private function isSupportedOwnerType(string $ownerType): bool
    {
        return in_array($ownerType, [
            (string)ScopeType::GLOBAL->value,
            (string)ScopeType::ASSOCIATION->value,
            (string)ScopeType::GAME->value,
        ], true);
    }

    private function mapPage(Page $page): array
    {
        return [
            'id' => $page->id,
            'ownerType' => $page->owner_type,
            'ownerId' => $page->owner_id,
            'slug' => $page->slug,
            'title' => $page->title,
            'publishedAt' => $page->published_at?->toISOString(),
            'content' => $page->content,
            'updatedAt' => $page->updated_at?->toISOString(),
        ];
    }
}
