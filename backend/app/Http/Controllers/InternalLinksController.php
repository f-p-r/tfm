<?php

namespace App\Http\Controllers;

use App\Models\Association;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalLinksController extends Controller
{
    /**
     * Resolve internal link from type + slug to id + title.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function resolve(Request $request): JsonResponse
    {
        // Validate required parameters
        $type = $request->query('type');
        $slug = $request->query('slug');

        if (!$type || !$slug) {
            return response()->json([
                'error' => 'invalid_request',
                'message' => 'type and slug are required'
            ], 422);
        }

        // Normalize slug
        $normalizedSlug = trim(strtolower($slug));

        // Validate type
        $validTypes = [2, '2', 3, '3', 'news', 'event', 'page'];
        if (!in_array($type, $validTypes, true)) {
            return response()->json([
                'error' => 'invalid_request',
                'message' => 'Invalid type. Valid types are: 2 (association), 3 (game), news, event, page'
            ], 422);
        }

        // Resolve based on type
        switch ($type) {
            case 2:
            case '2':
                // Association
                $association = Association::where('slug', $normalizedSlug)->first();

                if (!$association) {
                    return response()->json([
                        'error' => 'not_found',
                        'message' => 'No entity found for given type and slug'
                    ], 404);
                }

                return response()->json([
                    'type' => $type,
                    'id' => $association->id,
                    'slug' => $normalizedSlug,
                    'title' => $association->name
                ]);

            case 3:
            case '3':
                // Game
                $game = Game::where('slug', $normalizedSlug)->first();

                if (!$game) {
                    return response()->json([
                        'error' => 'not_found',
                        'message' => 'No entity found for given type and slug'
                    ], 404);
                }

                return response()->json([
                    'type' => $type,
                    'id' => $game->id,
                    'slug' => $normalizedSlug,
                    'title' => $game->name
                ]);

            case 'news':
                // TODO: Implement News resolution when model exists
                // $news = News::where('slug', $normalizedSlug)->first();
                // if (!$news) return 404
                // return ['type' => 'news', 'id' => $news->id, 'slug' => $normalizedSlug, 'title' => $news->title]
                return response()->json([
                    'error' => 'not_implemented',
                    'message' => 'News type not yet implemented'
                ], 501);

            case 'event':
                // TODO: Implement Event resolution when model exists
                // $event = Event::where('slug', $normalizedSlug)->first();
                // if (!$event) return 404
                // return ['type' => 'event', 'id' => $event->id, 'slug' => $normalizedSlug, 'title' => $event->title]
                return response()->json([
                    'error' => 'not_implemented',
                    'message' => 'Event type not yet implemented'
                ], 501);

            case 'page':
                // TODO: Implement Page resolution when model exists
                // Pages require ownerType + ownerSlug to resolve:
                // 1. Validate ownerType and ownerSlug query params
                // 2. Resolve ownerSlug -> ownerId based on ownerType
                // 3. Find Page where owner_type = ownerType AND owner_id = ownerId AND slug = normalizedSlug
                // Example endpoint: /api/internal-links/resolve?type=page&ownerType=2&ownerSlug=club-example&slug=about
                return response()->json([
                    'error' => 'not_implemented',
                    'message' => 'Page type not yet implemented (requires ownerType and ownerSlug)'
                ], 501);

            default:
                return response()->json([
                    'error' => 'invalid_request',
                    'message' => 'Invalid type'
                ], 422);
        }
    }
}
