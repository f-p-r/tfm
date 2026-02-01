<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminPageIndexRequest;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Models\Association;
use App\Models\Game;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class AdminPagesController extends Controller
{
    public function indexByOwner(AdminPageIndexRequest $request): JsonResponse
    {
        $ownerType = $request->getOwnerType();
        $ownerId = $request->getOwnerId();

        $pages = Page::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (Page $page) {
                return [
                    'id' => $page->id,
                    'slug' => $page->slug,
                    'title' => $page->title,
                    'published' => $page->published,
                    'updatedAt' => $page->updated_at?->toISOString(),
                    'publishedAt' => $page->published_at?->toISOString(),
                ];
            });

        return response()->json($pages);
    }

    public function show(Page $page): JsonResponse
    {
        return response()->json($this->mapPage($page));
    }

    public function store(StorePageRequest $request): JsonResponse
    {
        $data = $request->validated();

        $publishedAt = $data['publishedAt'] ?? null;
        if ($data['published'] && $publishedAt === null) {
            $publishedAt = now();
        }

        $page = Page::create([
            'owner_type' => $data['ownerType'],
            'owner_id' => $data['ownerId'],
            'slug' => $data['slug'],
            'title' => $data['title'],
            'published' => $data['published'],
            'published_at' => $publishedAt,
            'content' => $data['content'],
        ]);

        return response()->json($this->mapPage($page), 201);
    }

    public function update(UpdatePageRequest $request, Page $page): JsonResponse
    {
        $data = $request->validated();

        $published = array_key_exists('published', $data) ? $data['published'] : $page->published;
        $publishedAt = array_key_exists('publishedAt', $data) ? $data['publishedAt'] : $page->published_at;

        if ($published && $publishedAt === null) {
            $publishedAt = now();
        }

        $page->update([
            'slug' => $data['slug'] ?? $page->slug,
            'title' => $data['title'] ?? $page->title,
            'published' => $published,
            'published_at' => $publishedAt,
            'content' => $data['content'] ?? $page->content,
        ]);

        return response()->json($this->mapPage($page->refresh()));
    }

    public function destroy(Page $page): JsonResponse
    {
        $this->clearOwnerHomePageIfNeeded($page);
        $page->delete();

        return response()->json(null, 204);
    }

    private function clearOwnerHomePageIfNeeded(Page $page): void
    {
        if ($page->owner_type === '2') {
            $owner = Association::find($page->owner_id);
            if ($owner && $owner->homePageId === $page->id) {
                $owner->update(['homePageId' => null]);
            }
            return;
        }

        if ($page->owner_type === '3') {
            $owner = Game::find($page->owner_id);
            if ($owner && $owner->homePageId === $page->id) {
                $owner->update(['homePageId' => null]);
            }
        }
    }

    private function mapPage(Page $page): array
    {
        return [
            'id' => $page->id,
            'ownerType' => $page->owner_type,
            'ownerId' => $page->owner_id,
            'slug' => $page->slug,
            'title' => $page->title,
            'published' => $page->published,
            'publishedAt' => $page->published_at?->toISOString(),
            'content' => $page->content,
            'createdAt' => $page->created_at?->toISOString(),
            'updatedAt' => $page->updated_at?->toISOString(),
        ];
    }
}
