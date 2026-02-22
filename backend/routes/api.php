<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AssociationController;
use App\Http\Controllers\AssociationMemberStatusController;
use App\Http\Controllers\UserAssociationController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\AuthzController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\InternalLinksController;
use App\Http\Controllers\AdminPagesController;
use App\Http\Controllers\AdminOwnerHomePageController;
use App\Http\Controllers\AdminSiteParamsController;
use App\Http\Controllers\PublicPagesController;
use App\Http\Controllers\PublicSiteParamsController;
use App\Http\Controllers\RoleGrantController;
use App\Http\Controllers\ContactInfoController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\UserEventController;
use App\Http\Controllers\NewsController;

// Ping endpoint (no DB, for diagnostics)
Route::get('ping', function () {
    return response()->json(['ok' => true]);
})->middleware(['perf', 'throttle:api']);

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    Route::get('{provider}/redirect', [SocialAuthController::class, 'redirect']);
    Route::get('{provider}/callback', [SocialAuthController::class, 'callback']);
});

// Public Association endpoints (sin autenticación)
Route::get('associations', [AssociationController::class, 'index']);
Route::get('associations/by-slug/{slug}', [AssociationController::class, 'bySlug']);
Route::get('associations/{association}', [AssociationController::class, 'show']);

// User registration (sin autenticación)
Route::post('users', [UserController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    // User management (require auth)
    Route::get('users', [UserController::class, 'index']);
    Route::get('users/{user}', [UserController::class, 'show']);
    Route::put('users/{user}', [UserController::class, 'update']);
    Route::patch('users/{user}', [UserController::class, 'update']);
    Route::delete('users/{user}', [UserController::class, 'destroy']);

    // Association write operations (require auth)
    Route::post('associations', [AssociationController::class, 'store']);
    Route::put('associations/{association}', [AssociationController::class, 'update']);
    Route::patch('associations/{association}', [AssociationController::class, 'update']);
    Route::delete('associations/{association}', [AssociationController::class, 'destroy']);

    // Association Member Statuses
    Route::apiResource('association-member-statuses', AssociationMemberStatusController::class);

    // User Associations (memberships)
    Route::apiResource('user-associations', UserAssociationController::class);

    // Role Grants (require admin permission)
    Route::apiResource('role-grants', RoleGrantController::class);

    // Authorization query endpoint
    Route::post('authz/query', [AuthzController::class, 'query'])
        ->middleware('perf');
    Route::apiResource('tournaments', TournamentController::class);

    // Internal Links Resolver
    Route::get('internal-links/resolve', [InternalLinksController::class, 'resolve']);

    Route::prefix('admin')->middleware(['perf', 'log-admin-pages-errors'])->group(function () {
        Route::get('pages', [AdminPagesController::class, 'indexByOwner']);
        Route::get('pages/{page}', [AdminPagesController::class, 'show']);
        Route::post('pages', [AdminPagesController::class, 'store']);
        Route::patch('pages/{page}', [AdminPagesController::class, 'update']);
        Route::delete('pages/{page}', [AdminPagesController::class, 'destroy']);

        Route::get('owners/home-page', [AdminOwnerHomePageController::class, 'get']);
        Route::put('owners/home-page', [AdminOwnerHomePageController::class, 'set']);

        Route::post('site-params/{id}', [AdminSiteParamsController::class, 'upsert']);
    });
});

// Media endpoints (sin autenticación por ahora)
Route::get('media', [MediaController::class, 'index']);
Route::post('media/upload-fake', [MediaController::class, 'uploadFake']);
Route::post('media/upload', [MediaController::class, 'upload']);

// Games endpoints (sin autenticación por ahora)
Route::get('games', [GameController::class, 'index']);
Route::post('games', [GameController::class, 'store']);
Route::get('games/by-slug/{slug}', [GameController::class, 'bySlug']);
Route::get('games/{game}', [GameController::class, 'show']);
Route::get('games/{game}/associations', [GameController::class, 'associations']);
Route::put('games/{game}', [GameController::class, 'update']);
Route::patch('games/{game}', [GameController::class, 'update']);

// Countries and Regions endpoints (sin autenticación)
Route::get('countries', [CountryController::class, 'index']);
Route::get('countries/{id}', [CountryController::class, 'show']);
Route::get('regions', [RegionController::class, 'index']);
Route::get('regions/{id}', [RegionController::class, 'show']);

// Public Pages endpoints (sin autenticación)
Route::get('pages/home', [PublicPagesController::class, 'home']);
Route::get('pages/by-owner-slug', [PublicPagesController::class, 'byOwnerSlug']);
Route::get('pages/list-by-owner', [PublicPagesController::class, 'listByOwner']);
Route::get('pages/{page}', [PublicPagesController::class, 'show']);

// Public Site Params endpoints (sin autenticación)
Route::get('site-params/{id}', [PublicSiteParamsController::class, 'show']);

// News endpoints
Route::get('news', [NewsController::class, 'index']);
Route::get('news/{news}', [NewsController::class, 'show']);
Route::post('news', [NewsController::class, 'store'])->middleware('auth:sanctum');
Route::put('news/{news}', [NewsController::class, 'update'])->middleware('auth:sanctum');
Route::patch('news/{news}', [NewsController::class, 'update'])->middleware('auth:sanctum');
Route::delete('news/{news}', [NewsController::class, 'destroy'])->middleware('auth:sanctum');

// Contact Info endpoints
Route::get('contact-info', [ContactInfoController::class, 'index']);
Route::get('contact-info/{contactInfo}', [ContactInfoController::class, 'show']);
Route::post('contact-info', [ContactInfoController::class, 'store'])->middleware('auth:sanctum');
Route::put('contact-info/{contactInfo}', [ContactInfoController::class, 'update'])->middleware('auth:sanctum');
Route::patch('contact-info/{contactInfo}', [ContactInfoController::class, 'update'])->middleware('auth:sanctum');
Route::delete('contact-info/{contactInfo}', [ContactInfoController::class, 'destroy'])->middleware('auth:sanctum');

// Events endpoints
Route::get('events', [EventController::class, 'index']);
Route::get('events/{event}', [EventController::class, 'show']);
Route::post('events', [EventController::class, 'store'])->middleware('auth:sanctum');
Route::put('events/{event}', [EventController::class, 'update'])->middleware('auth:sanctum');
Route::patch('events/{event}', [EventController::class, 'update'])->middleware('auth:sanctum');
Route::delete('events/{event}', [EventController::class, 'destroy'])->middleware('auth:sanctum');
// User-Event (asistencias) endpoints — todos requieren autenticación
Route::middleware('auth:sanctum')->group(function () {
    Route::get('user-events', [UserEventController::class, 'index']);
    Route::get('user-events/{userEvent}', [UserEventController::class, 'show']);
    Route::post('user-events', [UserEventController::class, 'store']);
    Route::put('user-events/{userEvent}', [UserEventController::class, 'update']);
    Route::patch('user-events/{userEvent}', [UserEventController::class, 'update']);
    Route::delete('user-events/{userEvent}', [UserEventController::class, 'destroy']);
});
