<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $users = User::orderBy('created_at', 'desc')->get();

        return UserResource::collection($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            // Hash de la contraseña
            $validated['password'] = Hash::make($validated['password']);

            $user = User::create($validated);

            return response()->json([
                'errors' => false,
                'data' => new UserResource($user),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'errors' => true,
                'errorsList' => [
                    'id' => 'Error al crear el usuario: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'errors' => false,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        try {
            $validated = $request->validated();

            // Hash de la contraseña si se proporciona
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'errors' => false,
                'data' => new UserResource($user->fresh()),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'errors' => true,
                'errorsList' => [
                    'id' => 'Error al actualizar el usuario: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        try {
            $user->delete();

            return response()->json([
                'errors' => false,
                'message' => 'Usuario eliminado correctamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'errors' => true,
                'errorsList' => [
                    'id' => 'Error al eliminar el usuario: ' . $e->getMessage(),
                ],
            ], 500);
        }
    }
}

