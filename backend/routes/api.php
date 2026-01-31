<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AssociationController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\AuthzController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\RegionController;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    Route::get('{provider}/redirect', [SocialAuthController::class, 'redirect']);
    Route::get('{provider}/callback', [SocialAuthController::class, 'callback']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class);

    // Association by slug (must be before apiResource)
    Route::get('associations/by-slug/{slug}', [AssociationController::class, 'bySlug']);
    Route::apiResource('associations', AssociationController::class);

    // Authorization query endpoint
    Route::post('authz/query', [AuthzController::class, 'query']);
    Route::apiResource('tournaments', TournamentController::class);
});

// Media endpoints (sin autenticación por ahora)
Route::get('media', [MediaController::class, 'index']);
Route::post('media/upload-fake', [MediaController::class, 'uploadFake']);
Route::post('media/upload', [MediaController::class, 'upload']);

// Games endpoints (sin autenticación por ahora)
Route::get('games', [GameController::class, 'index']);
Route::post('games', [GameController::class, 'store']);
Route::get('games/{game}', [GameController::class, 'show']);
Route::get('games/{game}/associations', [GameController::class, 'associations']);
Route::put('games/{game}', [GameController::class, 'update']);
Route::patch('games/{game}', [GameController::class, 'update']);

// Countries and Regions endpoints (sin autenticación)
Route::get('countries', [CountryController::class, 'index']);
Route::get('countries/{id}', [CountryController::class, 'show']);
Route::get('regions', [RegionController::class, 'index']);
Route::get('regions/{id}', [RegionController::class, 'show']);
