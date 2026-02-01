<?php

namespace App\Http\Controllers;

use App\Http\Requests\OwnerHomePageGetRequest;
use App\Http\Requests\OwnerHomePageSetRequest;
use App\Models\Association;
use App\Models\Game;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class AdminOwnerHomePageController extends Controller
{
    public function get(OwnerHomePageGetRequest $request): JsonResponse
    {
        $ownerType = $request->getOwnerType();
        $ownerId = $request->getOwnerId();

        if (! $this->isSupportedOwnerType($ownerType)) {
            return response()->json([
                'message' => 'Owner type no soportado.',
                'errors' => ['ownerType' => ['Owner type no soportado.']],
            ], 422);
        }

        $owner = $this->resolveOwner($ownerType, $ownerId);

        if (! $owner) {
            return response()->json(['message' => 'Owner not found.'], 404);
        }

        return response()->json([
            'homePageId' => $owner->homePageId,
        ]);
    }

    public function set(OwnerHomePageSetRequest $request): JsonResponse
    {
        $ownerType = $request->getOwnerType();
        $ownerId = $request->getOwnerId();
        $homePageId = $request->getHomePageId();

        if (! $this->isSupportedOwnerType($ownerType)) {
            return response()->json([
                'message' => 'Owner type no soportado.',
                'errors' => ['ownerType' => ['Owner type no soportado.']],
            ], 422);
        }

        $owner = $this->resolveOwner($ownerType, $ownerId);

        if (! $owner) {
            return response()->json(['message' => 'Owner not found.'], 404);
        }

        if ($homePageId !== null) {
            $exists = Page::query()
                ->where('id', $homePageId)
                ->where('owner_type', $ownerType)
                ->where('owner_id', $ownerId)
                ->exists();

            if (! $exists) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => [
                        'homePageId' => ['La Page no existe o no pertenece al owner.'],
                    ],
                ], 422);
            }
        }

        $owner->update(['homePageId' => $homePageId]);

        return response()->json([
            'homePageId' => $owner->homePageId,
        ]);
    }

    private function resolveOwner(string $ownerType, int $ownerId): Association|Game|null
    {
        if ($ownerType === '2') {
            return Association::find($ownerId);
        }

        if ($ownerType === '3') {
            return Game::find($ownerId);
        }

        return null;
    }

    private function isSupportedOwnerType(string $ownerType): bool
    {
        return in_array($ownerType, ['2', '3'], true);
    }
}
