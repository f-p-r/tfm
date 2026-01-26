<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AssociationController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\MediaController;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    Route::get('{provider}/redirect', [SocialAuthController::class, 'redirect']);
    Route::get('{provider}/callback', [SocialAuthController::class, 'callback']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('associations', AssociationController::class);
    Route::apiResource('tournaments', TournamentController::class);
});

// Media endpoints (sin autenticación por ahora)
Route::get('media', [MediaController::class, 'index']);
Route::post('media/upload-fake', [MediaController::class, 'uploadFake']);
Route::post('media/upload', [MediaController::class, 'upload']);
