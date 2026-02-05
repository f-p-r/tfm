<?php

namespace App\Http\Controllers;

use App\Models\AssociationMemberStatus;
use App\Http\Requests\StoreAssociationMemberStatusRequest;
use App\Http\Requests\UpdateAssociationMemberStatusRequest;
use App\Http\Resources\AssociationMemberStatusResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AssociationMemberStatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AssociationMemberStatus::query()->with(['association', 'statusType']);

        // Filter by association_id if provided
        if ($request->has('association_id')) {
            $query->where('association_id', $request->input('association_id'));
        }

        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Order by order field and then by name
        $statuses = $query->orderBy('order')->orderBy('name')->get();

        return response()->json(AssociationMemberStatusResource::collection($statuses));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssociationMemberStatusRequest $request): JsonResponse
    {
        $status = AssociationMemberStatus::create($request->validated());
        $status->load(['association', 'statusType']);

        return response()->json(new AssociationMemberStatusResource($status), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(AssociationMemberStatus $associationMemberStatus): JsonResponse
    {
        $associationMemberStatus->load(['association', 'statusType']);
        return response()->json(new AssociationMemberStatusResource($associationMemberStatus));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAssociationMemberStatusRequest $request, AssociationMemberStatus $associationMemberStatus): JsonResponse
    {
        $associationMemberStatus->update($request->validated());
        $associationMemberStatus->load(['association', 'statusType']);

        return response()->json(new AssociationMemberStatusResource($associationMemberStatus));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AssociationMemberStatus $associationMemberStatus): JsonResponse
    {
        $associationMemberStatus->delete();
        return response()->json(null, 204);
    }
}
