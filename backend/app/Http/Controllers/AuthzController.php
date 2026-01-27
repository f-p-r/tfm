<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthzQueryRequest;
use App\Services\AuthzService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthzController extends Controller
{
    public function __construct(
        private AuthzService $authzService
    ) {}

    /**
     * Query user permissions for a specific scope.
     */
    public function query(Request $request): JsonResponse
    {
        // Log raw request data for debugging
        Log::info('AuthzController::query - Raw request', [
            'all' => $request->all(),
            'json' => $request->json()->all(),
            'content' => $request->getContent(),
            'content_type' => $request->header('Content-Type'),
            'user_id' => $request->user()?->id,
        ]);

        // Validate manually to capture errors
        $validator = validator($request->all(), [
            'scopeType' => ['required', 'integer', 'in:1,2,3'],
            'scopeIds' => ['present', 'array'],
            'scopeIds.*' => ['integer', 'min:1'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string'],
            'breakdown' => ['required', 'boolean'],
        ]);

        if ($validator->fails()) {
            Log::error('AuthzController::query - Validation failed', [
                'errors' => $validator->errors()->toArray(),
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        $result = $this->authzService->queryPermissions(
            $user,
            $request->input('scopeType'),
            $request->input('scopeIds', []),
            $request->input('permissions', []),
            $request->boolean('breakdown')
        );

        return response()->json($result);
    }
}
