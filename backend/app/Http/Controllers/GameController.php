<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Rules\CanonicalSlug;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Game::query();

        // By default, only show enabled games (disabled=false)
        if (!$request->has('include_disabled')) {
            $query->where('disabled', false);
        }

        $games = $query->get();
        return response()->json($games);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:games,name',
            'slug' => ['required', 'string', 'unique:games,slug', new CanonicalSlug()],
            'team_size' => 'required|integer|min:1',
            'disabled' => 'boolean',
        ]);

        $game = Game::create($validated);
        return response()->json($game, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Game $game): JsonResponse
    {
        return response()->json($game);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('games')->ignore($game->id)
            ],
            'slug' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('games')->ignore($game->id),
                new CanonicalSlug()
            ],
            'team_size' => 'sometimes|required|integer|min:1',
            'disabled' => 'boolean',
        ]);

        $game->update($validated);
        return response()->json($game);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game): JsonResponse
    {
        $game->delete();
        return response()->json(null, 204);
    }
}
