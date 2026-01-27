<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthzQueryRequest;
use App\Services\AuthzService;
use Illuminate\Http\JsonResponse;

class AuthzController extends Controller
{
    public function __construct(
        private AuthzService $authzService
    ) {}

    /**
     * Query user permissions for a specific scope.
     */
    public function query(AuthzQueryRequest $request): JsonResponse
    {
        $user = $request->user();

        $result = $this->authzService->queryPermissions(
            $user,
            $request->getScopeType(),
            $request->getScopeIds(),
            $request->getPermissions(),
            $request->getBreakdown()
        );

        return response()->json($result);
    }
}
