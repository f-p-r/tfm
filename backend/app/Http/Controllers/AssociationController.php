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
        $query = Association::query()->with(['games', 'country', 'region', 'owner'])->where('slug', $slug);

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

        $associations = $query->with(['games', 'country', 'region', 'owner'])->get();
        return response()->json($associations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:associations,name',
            'shortname' => 'nullable|string|max:20',
            'slug' => ['required', 'string', 'unique:associations,slug', new CanonicalSlug()],
            'description' => 'nullable|string',
            'country_id' => 'nullable|exists:countries,id',
            'region_id' => [
                'nullable',
                'exists:regions,id',
                'required_with:country_id',
                function ($attribute, $value, $fail) use ($request) {
                    if ($value && $request->input('country_id')) {
                        $region = \App\Models\Region::find($value);
                        if ($region && $region->country_id !== $request->input('country_id')) {
                            $fail('La región no pertenece al país seleccionado.');
                        }
                    }
                },
            ],
            'web' => 'nullable|url|max:2048',
            'external_url' => 'nullable|url|max:2048',
            'disabled' => 'boolean',
            'management' => 'nullable|boolean',
            'province' => 'nullable|string|max:255',
            'homePageId' => 'nullable|integer|exists:pages,id',
            'owner_id' => 'nullable|integer|exists:users,id',
            'game_ids' => 'sometimes|array',
            'game_ids.*' => 'integer|exists:games,id',
        ]);

        // Si se informa region, country debe estar informado
        if (isset($validated['region_id']) && !isset($validated['country_id'])) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['country_id' => ['El país es obligatorio cuando se especifica una región.']]
            ], 422);
        }

        $association = Association::create([
            'name' => $validated['name'],
            'shortname' => $validated['shortname'] ?? null,
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'country_id' => $validated['country_id'] ?? null,
            'region_id' => $validated['region_id'] ?? null,
            'web' => $validated['web'] ?? null,
            'external_url' => $validated['external_url'] ?? null,
            'disabled' => $validated['disabled'] ?? false,
            'management' => $validated['management'] ?? null,
            'province' => $validated['province'] ?? null,
            'homePageId' => $validated['homePageId'] ?? null,
            'owner_id' => $validated['owner_id'] ?? null,
        ]);

        // Sync games if provided
        if (isset($validated['game_ids'])) {
            $association->games()->sync($validated['game_ids']);
        }

        $association->load('games', 'country', 'region', 'owner');
        return response()->json($association, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Association $association): JsonResponse
    {
        $association->load('games', 'country', 'region', 'owner');
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
            'shortname' => 'nullable|string|max:20',
            'slug' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('associations')->ignore($association->id),
                new CanonicalSlug()
            ],
            'description' => 'nullable|string',
            'country_id' => 'nullable|exists:countries,id',
            'region_id' => [
                'nullable',
                'exists:regions,id',
                function ($attribute, $value, $fail) use ($request, $association) {
                    if ($value) {
                        $countryId = $request->input('country_id', $association->country_id);
                        if (!$countryId) {
                            $fail('El país es obligatorio cuando se especifica una región.');
                            return;
                        }
                        $region = \App\Models\Region::find($value);
                        if ($region && $region->country_id !== $countryId) {
                            $fail('La región no pertenece al país seleccionado.');
                        }
                    }
                },
            ],
            'web' => 'nullable|url|max:2048',
            'external_url' => 'nullable|url|max:2048',
            'disabled' => 'boolean',
            'management' => 'nullable|boolean',
            'province' => 'nullable|string|max:255',
            'homePageId' => 'nullable|integer|exists:pages,id',
            'owner_id' => 'nullable|integer|exists:users,id',
            'game_ids' => 'sometimes|array',
            'game_ids.*' => 'integer|exists:games,id',
        ]);

        // Update association attributes
        $association->update([
            'name' => $validated['name'] ?? $association->name,
            'shortname' => $validated['shortname'] ?? $association->shortname,
            'slug' => $validated['slug'] ?? $association->slug,
            'description' => $validated['description'] ?? $association->description,
            'country_id' => $validated['country_id'] ?? $association->country_id,
            'region_id' => $validated['region_id'] ?? $association->region_id,
            'web' => $validated['web'] ?? $association->web,
            'external_url' => $validated['external_url'] ?? $association->external_url,
            'disabled' => $validated['disabled'] ?? $association->disabled,
            'management' => $validated['management'] ?? $association->management,
            'province' => $validated['province'] ?? $association->province,
            'homePageId' => $validated['homePageId'] ?? $association->homePageId,
            'owner_id' => $validated['owner_id'] ?? $association->owner_id,
        ]);

        // Sync games if provided
        if (isset($validated['game_ids'])) {
            $association->games()->sync($validated['game_ids']);
        }

        $association->load('games', 'country', 'region', 'owner');
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
