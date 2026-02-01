<?php

namespace App\Http\Controllers;

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

    private function resolveOwnerBySlug(string $ownerType, string $ownerSlug): Association|Game|null
    {
        if ($ownerType === '2') {
            return Association::query()->where('slug', $ownerSlug)->first();
        }

        if ($ownerType === '3') {
            return Game::query()->where('slug', $ownerSlug)->first();
        }

        return null;
    }

    private function isSupportedOwnerType(string $ownerType): bool
    {
        return in_array($ownerType, ['2', '3'], true);
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
