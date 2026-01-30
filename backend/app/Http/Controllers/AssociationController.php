<?php

namespace App\Http\Controllers;

use App\Models\Association;
use App\Rules\CanonicalSlug;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class AssociationController extends Controller
{
    /**
     * Get an association by slug.
     */
    public function bySlug(string $slug, Request $request): JsonResponse
    {
        $query = Association::query()->with('games')->where('slug', $slug);
        
        if (!$request->boolean('include_disabled')) {
            $query->where('disabled', false);
        }
        
        $association = $query->firstOrFail();
        return response()->json($association);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Association::query();

        // By default, only show enabled associations (disabled=false)
        if (!$request->has('include_disabled')) {
            $query->where('disabled', false);
        }

        $associations = $query->with('games')->get();
        return response()->json($associations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:associations,name',
            'slug' => ['required', 'string', 'unique:associations,slug', new CanonicalSlug()],
            'disabled' => 'boolean',
            'game_ids' => 'sometimes|array',
            'game_ids.*' => 'integer|exists:games,id',
        ]);

        $association = Association::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'disabled' => $validated['disabled'] ?? false,
        ]);

        // Sync games if provided
        if (isset($validated['game_ids'])) {
            $association->games()->sync($validated['game_ids']);
        }

        $association->load('games');
        return response()->json($association, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Association $association): JsonResponse
    {
        $association->load('games');
        return response()->json($association);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Association $association): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('associations')->ignore($association->id)
            ],
            'slug' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('associations')->ignore($association->id),
                new CanonicalSlug()
            ],
            'disabled' => 'boolean',
            'game_ids' => 'sometimes|array',
            'game_ids.*' => 'integer|exists:games,id',
        ]);

        // Update association attributes
        $association->update([
            'name' => $validated['name'] ?? $association->name,
            'slug' => $validated['slug'] ?? $association->slug,
            'disabled' => $validated['disabled'] ?? $association->disabled,
        ]);

        // Sync games if provided
        if (isset($validated['game_ids'])) {
            $association->games()->sync($validated['game_ids']);
        }

        $association->load('games');
        return response()->json($association);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Association $association): JsonResponse
    {
        $association->delete();
        return response()->json(null, 204);
    }
}
