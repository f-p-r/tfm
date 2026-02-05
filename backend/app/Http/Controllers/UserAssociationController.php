<?php

namespace App\Http\Controllers;

use App\Models\UserAssociation;
use App\Http\Requests\StoreUserAssociationRequest;
use App\Http\Requests\UpdateUserAssociationRequest;
use App\Http\Resources\UserAssociationResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserAssociationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserAssociation::query()->with(['user', 'association', 'status.statusType']);

        // Filter by user_id if provided
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by association_id if provided
        if ($request->has('association_id')) {
            $query->where('association_id', $request->input('association_id'));
        }

        // Filter by status_id if provided
        if ($request->has('status_id')) {
            $query->where('status_id', $request->input('status_id'));
        }

        $memberships = $query->orderBy('joined_at', 'desc')->get();

        return response()->json(UserAssociationResource::collection($memberships));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserAssociationRequest $request): JsonResponse
    {
        $membership = UserAssociation::create($request->validated());
        $membership->load(['user', 'association', 'status.statusType']);

        return response()->json(new UserAssociationResource($membership), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(UserAssociation $userAssociation): JsonResponse
    {
        $userAssociation->load(['user', 'association', 'status.statusType']);
        return response()->json(new UserAssociationResource($userAssociation));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserAssociationRequest $request, UserAssociation $userAssociation): JsonResponse
    {
        $userAssociation->update($request->validated());
        $userAssociation->load(['user', 'association', 'status.statusType']);

        return response()->json(new UserAssociationResource($userAssociation));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UserAssociation $userAssociation): JsonResponse
    {
        $userAssociation->delete();
        return response()->json(null, 204);
    }
}
