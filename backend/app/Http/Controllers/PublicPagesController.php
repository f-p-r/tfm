<?php

namespace App\Http\Controllers;

use App\Enums\ScopeType;
use App\Http\Requests\PublicByOwnerSlugRequest;
use App\Http\Requests\PublicHomePageRequest;
use App\Models\Association;
use App\Models\Game;
use App\Models\Page;
use App\Models\SiteParam;
use Illuminate\Http\JsonResponse;

class PublicPagesController extends Controller
{
    /**
     * Obtiene la página home de un owner específico.
     * La página home se determina por el campo homePageId del owner.
     *
     * @param PublicHomePageRequest $request
     * @return JsonResponse
     */
    public function home(PublicHomePageRequest $request): JsonResponse
    {
        $ownerType = $request->getOwnerType();
        $ownerSlug = $request->getOwnerSlug();

        if (! $this->isSupportedOwnerType($ownerType)) {
            // TODO: soportar otros ownerType (news, event, ...)
            return response()->json(['message' => 'Owner type no soportado.'], 501);
        }

        // Para el ownerType GLOBAL, el ownerId es siempre 0
        if ($ownerType === (string)ScopeType::GLOBAL->value) {
            $ownerId    = 0;
            $param      = SiteParam::find('homepage');
            $homePageId = $param ? (int)$param->value : null;
            if (! $homePageId) {
                return response()->json(['message' => 'Página de inicio no encontrada.'], 404);
            }

            $page = Page::query()
                ->where('id', $homePageId)
                ->where('owner_type', $ownerType)
                ->where('owner_id', $ownerId)
                ->where('published', true)
                ->first();

            if (! $page) {
                return response()->json(['message' => 'Página no encontrada.'], 404);
            }

            return response()->json($this->mapPage($page));
        }

        $owner = $this->resolveOwnerBySlug($ownerType, $ownerSlug);

        if (! $owner) {
            return response()->json(['message' => 'Propietario no encontrado.'], 404);
        }

        if (! $owner->homePageId) {
            return response()->json(['message' => 'Página de inicio no encontrada.'], 404);
        }

        // Buscar la página configurada como home
        $page = Page::query()
            ->where('id', $owner->homePageId)
            ->where('owner_type', $ownerType)
            ->where('owner_id', $owner->id)
            ->where('published', true)
            ->first();

        if (! $page) {
            return response()->json(['message' => 'Página no encontrada.'], 404);
        }

        return response()->json($this->mapPage($page));
    }

    /**
     * Obtiene una página específica por el slug del owner y el slug de la página.
     * Solo devuelve páginas publicadas.
     *
     * @param PublicByOwnerSlugRequest $request
     * @return JsonResponse
     */
    public function byOwnerSlug(PublicByOwnerSlugRequest $request): JsonResponse
    {
        $ownerType = $request->getOwnerType();
        $ownerSlug = $request->getOwnerSlug();
        $pageSlug = $request->getPageSlug();

        if (! $this->isSupportedOwnerType($ownerType)) {
            // TODO: soportar otros ownerType (news, event, ...)
            return response()->json(['message' => 'Owner type no soportado.'], 501);
        }

        // Para el ownerType GLOBAL, el ownerId es siempre 0
        if ($ownerType === (string)ScopeType::GLOBAL->value) {
            $ownerId = 0;

            $page = Page::query()
                ->where('owner_type', $ownerType)
                ->where('owner_id', $ownerId)
                ->where('slug', $pageSlug)
                ->where('published', true)
                ->first();

            if (! $page) {
                return response()->json(['message' => 'Página no encontrada.'], 404);
            }

            return response()->json($this->mapPage($page));
        }

        $owner = $this->resolveOwnerBySlug($ownerType, $ownerSlug);

        if (! $owner) {
            return response()->json(['message' => 'Propietario no encontrado.'], 404);
        }

        // Buscar la página por su slug
        $page = Page::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $owner->id)
            ->where('slug', $pageSlug)
            ->where('published', true)
            ->first();

        if (! $page) {
            return response()->json(['message' => 'Página no encontrada.'], 404);
        }

        return response()->json($this->mapPage($page));
    }

    /**
     * Devuelve el listado de páginas publicadas de un owner (id, slug, título).
     * No requiere autenticación.
     *
     * @param \Illuminate\Http\Request $request  Parámetros: ownerType, ownerSlug
     * @return JsonResponse
     */
    public function listByOwner(\Illuminate\Http\Request $request): JsonResponse
    {
        $ownerType = $request->input('ownerType');
        $ownerSlug = $request->input('ownerSlug');

        if (! $ownerType || ! $ownerSlug) {
            return response()->json(['message' => 'Los parámetros ownerType y ownerSlug son obligatorios.'], 422);
        }

        if (! $this->isSupportedOwnerType($ownerType)) {
            return response()->json(['message' => 'Owner type no soportado.'], 501);
        }

        if ($ownerType === (string)ScopeType::GLOBAL->value) {
            $ownerId    = 0;
            $param      = SiteParam::find('homepage');
            $homePageId = $param ? (int)$param->value : null;
        } else {
            $owner = $this->resolveOwnerBySlug($ownerType, $ownerSlug);

            if (! $owner) {
                return response()->json(['message' => 'Propietario no encontrado.'], 404);
            }

            $ownerId    = $owner->id;
            $homePageId = $owner->homePageId ?? null;
        }

        $pages = Page::query()
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->where('published', true)
            ->orderBy('title')
            ->get()
            ->map(fn(Page $page) => [
                'id'    => $page->id,
                'slug'  => $page->slug,
                'title' => $page->title,
                'home'  => $homePageId !== null && $page->id === $homePageId,
            ]);

        return response()->json($pages);
    }

    /**
     * Muestra una página específica por su ID.
     * Solo devuelve páginas publicadas.
     *
     * @param Page $page
     * @return JsonResponse
     */
    public function show(Page $page): JsonResponse
    {
        // Solo mostrar páginas publicadas en endpoints públicos
        if (!$page->published) {
            return response()->json(['message' => 'Página no encontrada.'], 404);
        }

        return response()->json($this->mapPage($page));
    }

    /**
     * Resuelve el owner (Association o Game) a partir de su tipo y slug.
     *
     * @param string $ownerType Tipo de owner (ASSOCIATION o GAME)
     * @param string $ownerSlug Slug del owner
     * @return Association|Game|null El owner encontrado o null
     */
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

    /**
     * Verifica si el tipo de owner es soportado por el sistema.
     *
     * @param string $ownerType Tipo de owner a verificar
     * @return bool True si el tipo es soportado
     */
    private function isSupportedOwnerType(string $ownerType): bool
    {
        return in_array($ownerType, [
            (string)ScopeType::GLOBAL->value,
            (string)ScopeType::ASSOCIATION->value,
            (string)ScopeType::GAME->value,
        ], true);
    }

    /**
     * Mapea una página a su representación para la API pública.
     * Excluye campos sensibles y solo incluye información necesaria.
     *
     * @param Page $page Página a mapear
     * @return array Representación de la página para la API
     */
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
