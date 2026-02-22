<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNewsRequest;
use App\Http\Requests\UpdateNewsRequest;
use App\Models\News;
use App\Models\RoleGrant;
use App\Models\User;
use App\Services\AuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NewsController extends Controller
{
    public function __construct(protected AuthorizationService $authzService)
    {
    }

    /**
     * Display a listing of news.
     * Public endpoint - shows only published news by default.
     */
    public function index(Request $request): JsonResponse
    {
        $query = News::query()->with(['creator', 'game']);

        // Filter by scope
        if ($request->has('scope_type')) {
            $query->where('scope_type', $request->input('scope_type'));
        }

        if ($request->has('scope_id')) {
            $query->where('scope_id', $request->input('scope_id'));
        }

        if ($request->has('game_id')) {
            $query->where('game_id', $request->input('game_id'));
        }

        // Handle unpublished news
        if ($request->boolean('include_unpublished')) {
            // Include unpublished requires authentication AND permissions
            if (!$request->user()) {
                // Not authenticated, only show published
                $query->where('published', true);
            } else {
                // Authenticated: filter by news.edit permissions per scope
                // Get all scopes where user has news.edit permission
                $user = $request->user();
                $roleGrants = $user->roleGrants()->with('role.permissions')->get();

                $hasGlobal = false;
                $allowedAssociations = [];
                $allowedGames = [];

                foreach ($roleGrants as $grant) {
                    $hasPermission = $grant->role->permissions->contains('name', 'news.edit');

                    if ($hasPermission) {
                        if ($grant->scope_type === RoleGrant::SCOPE_GLOBAL) {
                            $hasGlobal = true;
                            break; // Global permission = see all
                        } elseif ($grant->scope_type === RoleGrant::SCOPE_ASSOCIATION) {
                            $allowedAssociations[] = $grant->scope_id;
                        } elseif ($grant->scope_type === RoleGrant::SCOPE_GAME) {
                            $allowedGames[] = $grant->scope_id;
                        }
                    }
                }

                if (!$hasGlobal) {
                    // Filter: published OR (unpublished AND in allowed scope)
                    $query->where(function ($q) use ($allowedAssociations, $allowedGames) {
                        $q->where('published', true)
                            ->orWhere(function ($q2) use ($allowedAssociations, $allowedGames) {
                                $q2->where('published', false)
                                    ->where(function ($q3) use ($allowedAssociations, $allowedGames) {
                                        if (!empty($allowedAssociations)) {
                                            $q3->orWhere(function ($q4) use ($allowedAssociations) {
                                                $q4->where('scope_type', News::SCOPE_ASSOCIATION)
                                                    ->whereIn('scope_id', $allowedAssociations);
                                            });
                                        }
                                        if (!empty($allowedGames)) {
                                            $q3->orWhere(function ($q4) use ($allowedGames) {
                                                $q4->where('scope_type', News::SCOPE_GAME)
                                                    ->whereIn('scope_id', $allowedGames);
                                            });
                                        }
                                    });
                            });
                    });
                }
                // If hasGlobal, no additional filter needed (see all published + unpublished)
            }
        } else {
            // By default, only show published
            $query->where('published', true);
        }

        // Order by published_at desc, then created_at desc
        $news = $query->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (News $item) {
                return $this->mapNewsSummary($item);
            });

        return response()->json($news);
    }

    /**
     * Store a newly created news.
     */
    public function store(StoreNewsRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Check permissions
        $this->checkPermissions(
            $request->user(),
            'news.edit',
            $data['scope_type'],
            $data['scope_id'] ?? null
        );

        // Auto-set published_at if published
        $publishedAt = $data['published_at'] ?? null;
        if ($data['published'] && $publishedAt === null) {
            $publishedAt = now();
        }

        // Create news
        $news = News::create([
            'scope_type' => $data['scope_type'],
            'scope_id' => $data['scope_id'] ?? null,
            'game_id' => $data['game_id'] ?? null,
            'slug' => $data['slug'],
            'title' => $data['title'],
            'text' => $data['text'],
            'content' => $data['content'] ?? null,
            'published' => $data['published'],
            'published_at' => $publishedAt,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($this->mapNews($news->load(['creator', 'game'])), 201);
    }

    /**
     * Display the specified news.
     */
    public function show(News $news): JsonResponse
    {
        // If not published, verify authentication
        if (!$news->published) {
            if (!Auth::check()) {
                return response()->json(['message' => 'Noticia no encontrada'], 404);
            }

            // Check if user has permission to view unpublished news
            try {
                $this->checkPermissions(
                    Auth::user(),
                    'news.edit',
                    $news->scope_type,
                    $news->scope_id
                );
            } catch (\Exception $e) {
                return response()->json(['message' => 'Noticia no encontrada'], 404);
            }
        }

        return response()->json($this->mapNews($news->load(['creator', 'game'])));
    }

    /**
     * Update the specified news.
     */
    public function update(UpdateNewsRequest $request, News $news): JsonResponse
    {
        // Check permissions
        $this->checkPermissions(
            $request->user(),
            'news.edit',
            $news->scope_type,
            $news->scope_id
        );

        $data = $request->validated();

        // Handle published_at
        $published = array_key_exists('published', $data) ? $data['published'] : $news->published;
        $publishedAt = array_key_exists('published_at', $data) ? $data['published_at'] : $news->published_at;

        if ($published && $publishedAt === null) {
            $publishedAt = now();
        }

        // Update news (scope_type and scope_id are not updateable)
        $news->update([
            'game_id' => $data['game_id'] ?? $news->game_id,
            'slug' => $data['slug'] ?? $news->slug,
            'title' => $data['title'] ?? $news->title,
            'text' => $data['text'] ?? $news->text,
            'content' => array_key_exists('content', $data) ? $data['content'] : $news->content,
            'published' => $published,
            'published_at' => $publishedAt,
        ]);

        return response()->json($this->mapNews($news->refresh()->load(['creator', 'game'])));
    }

    /**
     * Remove the specified news.
     */
    public function destroy(Request $request, News $news): JsonResponse
    {
        // Check permissions
        $this->checkPermissions(
            $request->user(),
            'news.edit',
            $news->scope_type,
            $news->scope_id
        );

        $news->delete();

        return response()->json(null, 204);
    }

    /**
     * Check permissions based on scope.
     */
    protected function checkPermissions(User $user, string $permission, int $scopeType, ?int $scopeId): void
    {
        if (!$user) {
            abort(401, 'No autenticado');
        }

        $hasPermission = $this->authzService->userHasPermissionInScope(
            $user,
            $permission,
            $scopeType,
            $scopeId
        );

        if (!$hasPermission) {
            $scopeName = match ($scopeType) {
                RoleGrant::SCOPE_GLOBAL => 'global',
                RoleGrant::SCOPE_ASSOCIATION => 'de esta asociación',
                RoleGrant::SCOPE_GAME => 'de este juego',
                default => 'de este scope',
            };

            abort(403, "No tienes permisos para gestionar noticias {$scopeName}");
        }
    }

    /**
     * Map News model to summary response (for listings, without content).
     */
    private function mapNewsSummary(News $news): array
    {
        return [
            'id' => $news->id,
            'scopeType' => $news->scope_type,
            'scopeId' => $news->scope_id,
            'gameId' => $news->game_id,
            'slug' => $news->slug,
            'title' => $news->title,
            'text' => $news->text,
            'hasContent' => $news->content !== null && !empty($news->content['segments'] ?? []),
            'published' => $news->published,
            'publishedAt' => $news->published_at?->toISOString(),
            'createdBy' => $news->created_by,
            'createdAt' => $news->created_at?->toISOString(),
            'updatedAt' => $news->updated_at?->toISOString(),
            'creator' => $news->creator ? [
                'id' => $news->creator->id,
                'username' => $news->creator->username,
                'name' => $news->creator->name,
            ] : null,
            'game' => $news->game ? [
                'id' => $news->game->id,
                'name' => $news->game->name,
                'slug' => $news->game->slug,
            ] : null,
        ];
    }

    /**
     * Map News model to full response (for detail, with content).
     */
    private function mapNews(News $news): array
    {
        return [
            'id' => $news->id,
            'scopeType' => $news->scope_type,
            'scopeId' => $news->scope_id,
            'gameId' => $news->game_id,
            'slug' => $news->slug,
            'title' => $news->title,
            'text' => $news->text,
            'content' => $news->content,
            'published' => $news->published,
            'publishedAt' => $news->published_at?->toISOString(),
            'createdBy' => $news->created_by,
            'createdAt' => $news->created_at?->toISOString(),
            'updatedAt' => $news->updated_at?->toISOString(),
            'creator' => $news->creator ? [
                'id' => $news->creator->id,
                'username' => $news->creator->username,
                'name' => $news->creator->name,
            ] : null,
            'game' => $news->game ? [
                'id' => $news->game->id,
                'name' => $news->game->name,
                'slug' => $news->game->slug,
            ] : null,
        ];
    }
}
