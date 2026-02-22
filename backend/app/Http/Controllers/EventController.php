<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Models\RoleGrant;
use App\Models\User;
use App\Models\UserEvent;
use App\Services\AuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    public function __construct(protected AuthorizationService $authzService)
    {
    }

    /**
     * Listar eventos.
     * Endpoint público: por defecto devuelve únicamente eventos publicados y activos.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::query()->with(['creator', 'game', 'country', 'region']);

        // --- Filtros de scope ---
        if ($request->has('scope_type')) {
            $query->where('scope_type', $request->input('scope_type'));
        }

        if ($request->has('scope_id')) {
            $query->where('scope_id', $request->input('scope_id'));
        }

        if ($request->has('game_id')) {
            $query->where('game_id', $request->input('game_id'));
        }

        // --- Filtros de estado ---
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->has('registration_open')) {
            $query->where('registration_open', $request->boolean('registration_open'));
        }

        // --- Filtro de rango de fechas ---
        if ($request->has('from')) {
            $query->where('starts_at', '>=', $request->input('from'));
        }

        if ($request->has('to')) {
            $query->where('starts_at', '<=', $request->input('to'));
        }

        // --- Visibilidad de no publicados ---
        if ($request->boolean('include_unpublished')) {
            if (!$request->user()) {
                $query->where('published', true);
            } else {
                $user = $request->user();
                $roleGrants = $user->roleGrants()->with('role.permissions')->get();

                $hasGlobal = false;
                $allowedAssociations = [];
                $allowedGames = [];

                foreach ($roleGrants as $grant) {
                    $hasPermission = $grant->role->permissions->contains('name', 'events.edit');

                    if ($hasPermission) {
                        if ($grant->scope_type === RoleGrant::SCOPE_GLOBAL) {
                            $hasGlobal = true;
                            break;
                        } elseif ($grant->scope_type === RoleGrant::SCOPE_ASSOCIATION) {
                            $allowedAssociations[] = $grant->scope_id;
                        } elseif ($grant->scope_type === RoleGrant::SCOPE_GAME) {
                            $allowedGames[] = $grant->scope_id;
                        }
                    }
                }

                if (!$hasGlobal) {
                    $query->where(function ($q) use ($allowedAssociations, $allowedGames) {
                        $q->where('published', true)
                            ->orWhere(function ($q2) use ($allowedAssociations, $allowedGames) {
                                $q2->where('published', false)
                                    ->where(function ($q3) use ($allowedAssociations, $allowedGames) {
                                        if (!empty($allowedAssociations)) {
                                            $q3->orWhere(function ($q4) use ($allowedAssociations) {
                                                $q4->where('scope_type', Event::SCOPE_ASSOCIATION)
                                                    ->whereIn('scope_id', $allowedAssociations);
                                            });
                                        }
                                        if (!empty($allowedGames)) {
                                            $q3->orWhere(function ($q4) use ($allowedGames) {
                                                $q4->where('scope_type', Event::SCOPE_GAME)
                                                    ->whereIn('scope_id', $allowedGames);
                                            });
                                        }
                                    });
                            });
                    });
                }
            }
        } else {
            $query->where('published', true);
        }

        // Orden: más próximos primero
        $eventCollection = $query->orderBy('starts_at')->get();

        // Cargar asistencias del usuario autenticado en una sola consulta
        $myAttendances = [];
        if ($request->user()) {
            $eventIds = $eventCollection->pluck('id')->all();
            $myAttendances = UserEvent::where('user_id', $request->user()->id)
                ->whereIn('event_id', $eventIds)
                ->with('statusType')
                ->get()
                ->keyBy('event_id')
                ->all();
        }

        $events = $eventCollection->map(
            fn(Event $event) => $this->mapEventSummary($event, $myAttendances[$event->id] ?? null)
        );

        return response()->json($events);
    }

    /**
     * Crear un nuevo evento.
     */
    public function store(StoreEventRequest $request): JsonResponse
    {
        $data = $request->validated();

        $this->checkPermissions(
            $request->user(),
            'events.edit',
            $data['scope_type'],
            $data['scope_id'] ?? null
        );

        // Auto-asignar published_at si se publica y no se especifica
        $publishedAt = $data['published_at'] ?? null;
        if ($data['published'] && $publishedAt === null) {
            $publishedAt = now();
        }

        $event = Event::create([
            'scope_type'        => $data['scope_type'],
            'scope_id'          => $data['scope_id'] ?? null,
            'game_id'           => $data['game_id'] ?? null,
            'slug'              => $data['slug'],
            'title'             => $data['title'],
            'text'              => $data['text'],
            'content'           => $data['content'] ?? null,
            'starts_at'         => $data['starts_at'],
            'ends_at'           => $data['ends_at'] ?? null,
            'country_code'      => $data['country_code'] ?? null,
            'region_id'         => $data['region_id'] ?? null,
            'province_name'     => $data['province_name'] ?? null,
            'municipality_name' => $data['municipality_name'] ?? null,
            'postal_code'       => $data['postal_code'] ?? null,
            'street_name'       => $data['street_name'] ?? null,
            'street_number'     => $data['street_number'] ?? null,
            'active'            => $data['active'] ?? true,
            'registration_open' => $data['registration_open'] ?? false,
            'published'         => $data['published'],
            'published_at'      => $publishedAt,
            'created_by'        => $request->user()->id,
        ]);

        return response()->json(
            $this->mapEvent($event->load(['creator', 'game', 'country', 'region'])),
            201
        );
    }

    /**
     * Obtener el detalle de un evento.
     */
    public function show(Event $event): JsonResponse
    {
        // Los eventos no publicados solo son visibles con permiso
        if (!$event->published) {
            if (!Auth::check()) {
                return response()->json(['message' => 'Evento no encontrado'], 404);
            }

            try {
                $this->checkPermissions(
                    Auth::user(),
                    'events.edit',
                    $event->scope_type,
                    $event->scope_id
                );
            } catch (\Exception $e) {
                return response()->json(['message' => 'Evento no encontrado'], 404);
            }
        }

        $myAttendance = Auth::id()
            ? UserEvent::where('user_id', Auth::id())
                ->where('event_id', $event->id)
                ->with('statusType')
                ->first()
            : null;

        return response()->json(
            $this->mapEvent($event->load(['creator', 'game', 'country', 'region']), $myAttendance)
        );
    }

    /**
     * Actualizar un evento.
     * scope_type y scope_id no son modificables.
     */
    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $this->checkPermissions(
            $request->user(),
            'events.edit',
            $event->scope_type,
            $event->scope_id
        );

        $data = $request->validated();

        $published   = array_key_exists('published', $data) ? $data['published'] : $event->published;
        $publishedAt = array_key_exists('published_at', $data) ? $data['published_at'] : $event->published_at;

        if ($published && $publishedAt === null) {
            $publishedAt = now();
        }

        $event->update([
            'game_id'           => array_key_exists('game_id', $data) ? $data['game_id'] : $event->game_id,
            'slug'              => $data['slug'] ?? $event->slug,
            'title'             => $data['title'] ?? $event->title,
            'text'              => $data['text'] ?? $event->text,
            'content'           => array_key_exists('content', $data) ? $data['content'] : $event->content,
            'starts_at'         => $data['starts_at'] ?? $event->starts_at,
            'ends_at'           => array_key_exists('ends_at', $data) ? $data['ends_at'] : $event->ends_at,
            'country_code'      => array_key_exists('country_code', $data) ? $data['country_code'] : $event->country_code,
            'region_id'         => array_key_exists('region_id', $data) ? $data['region_id'] : $event->region_id,
            'province_name'     => array_key_exists('province_name', $data) ? $data['province_name'] : $event->province_name,
            'municipality_name' => array_key_exists('municipality_name', $data) ? $data['municipality_name'] : $event->municipality_name,
            'postal_code'       => array_key_exists('postal_code', $data) ? $data['postal_code'] : $event->postal_code,
            'street_name'       => array_key_exists('street_name', $data) ? $data['street_name'] : $event->street_name,
            'street_number'     => array_key_exists('street_number', $data) ? $data['street_number'] : $event->street_number,
            'active'            => $data['active'] ?? $event->active,
            'registration_open' => $data['registration_open'] ?? $event->registration_open,
            'published'         => $published,
            'published_at'      => $publishedAt,
        ]);

        return response()->json(
            $this->mapEvent($event->refresh()->load(['creator', 'game', 'country', 'region']))
        );
    }

    /**
     * Eliminar un evento.
     */
    public function destroy(Request $request, Event $event): JsonResponse
    {
        $this->checkPermissions(
            $request->user(),
            'events.edit',
            $event->scope_type,
            $event->scope_id
        );

        $event->delete();

        return response()->json(null, 204);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Comprobar permisos según scope.
     */
    protected function checkPermissions(User $user, string $permission, int $scopeType, ?int $scopeId): void
    {
        if (!$user) {
            abort(401, 'No autenticado');
        }

        $hasPermission = $this->authzService->userHasPermissionInScope(
            $user,
            $permission,
            $scopeType,
            $scopeId
        );

        if (!$hasPermission) {
            $scopeName = match ($scopeType) {
                RoleGrant::SCOPE_GLOBAL      => 'global',
                RoleGrant::SCOPE_ASSOCIATION => 'de esta asociación',
                RoleGrant::SCOPE_GAME        => 'de este juego',
                default                      => 'de este scope',
            };

            abort(403, "No tienes permisos para gestionar eventos {$scopeName}");
        }
    }

    /**
     * Construir el objeto myAttendance para la respuesta.
     */
    private function mapMyAttendance(?UserEvent $userEvent): ?array
    {
        if (!$userEvent) {
            return null;
        }

        return [
            'id'         => $userEvent->id,
            'status'     => $userEvent->status,
            'statusDate' => $userEvent->status_date?->toISOString(),
            'statusType' => $userEvent->statusType ? [
                'id'   => $userEvent->statusType->id,
                'name' => $userEvent->statusType->name,
            ] : null,
        ];
    }

    /**
     * Mapear Event a respuesta de listado (sin content, con hasContent).
     */
    private function mapEventSummary(Event $event, ?UserEvent $myAttendance = null): array
    {
        return [
            'id'               => $event->id,
            'scopeType'        => $event->scope_type,
            'scopeId'          => $event->scope_id,
            'gameId'           => $event->game_id,
            'slug'             => $event->slug,
            'title'            => $event->title,
            'text'             => $event->text,
            'hasContent'       => $event->content !== null && !empty($event->content['segments'] ?? []),
            'startsAt'         => $event->starts_at?->toISOString(),
            'endsAt'           => $event->ends_at?->toISOString(),
            // Dirección
            'countryCode'      => $event->country_code,
            'country'          => $event->country ? [
                'id'   => $event->country->id,
                'name' => $event->country->name,
            ] : null,
            'regionId'         => $event->region_id,
            'region'           => $event->region ? [
                'id'   => $event->region->id,
                'name' => $event->region->name,
            ] : null,
            'provinceName'     => $event->province_name,
            'municipalityName' => $event->municipality_name,
            'postalCode'       => $event->postal_code,
            'streetName'       => $event->street_name,
            'streetNumber'     => $event->street_number,
            // Estado
            'active'           => $event->active,
            'registrationOpen' => $event->registration_open,
            // Publicación
            'published'        => $event->published,
            'publishedAt'      => $event->published_at?->toISOString(),
            // Auditoría
            'createdBy'        => $event->created_by,
            'createdAt'        => $event->created_at?->toISOString(),
            'updatedAt'        => $event->updated_at?->toISOString(),
            // Relaciones
            'creator'          => $event->creator ? [
                'id'       => $event->creator->id,
                'username' => $event->creator->username,
                'name'     => $event->creator->name,
            ] : null,
            'game'         => $event->game ? [
                'id'   => $event->game->id,
                'name' => $event->game->name,
                'slug' => $event->game->slug,
            ] : null,
            'myAttendance' => $this->mapMyAttendance($myAttendance),
        ];
    }

    /**
     * Mapear Event a respuesta de detalle (con content completo).
     */
    private function mapEvent(Event $event, ?UserEvent $myAttendance = null): array
    {
        return [
            'id'               => $event->id,
            'scopeType'        => $event->scope_type,
            'scopeId'          => $event->scope_id,
            'gameId'           => $event->game_id,
            'slug'             => $event->slug,
            'title'            => $event->title,
            'text'             => $event->text,
            'content'          => $event->content,
            'startsAt'         => $event->starts_at?->toISOString(),
            'endsAt'           => $event->ends_at?->toISOString(),
            // Dirección
            'countryCode'      => $event->country_code,
            'country'          => $event->country ? [
                'id'   => $event->country->id,
                'name' => $event->country->name,
            ] : null,
            'regionId'         => $event->region_id,
            'region'           => $event->region ? [
                'id'   => $event->region->id,
                'name' => $event->region->name,
            ] : null,
            'provinceName'     => $event->province_name,
            'municipalityName' => $event->municipality_name,
            'postalCode'       => $event->postal_code,
            'streetName'       => $event->street_name,
            'streetNumber'     => $event->street_number,
            // Estado
            'active'           => $event->active,
            'registrationOpen' => $event->registration_open,
            // Publicación
            'published'        => $event->published,
            'publishedAt'      => $event->published_at?->toISOString(),
            // Auditoría
            'createdBy'        => $event->created_by,
            'createdAt'        => $event->created_at?->toISOString(),
            'updatedAt'        => $event->updated_at?->toISOString(),
            // Relaciones
            'creator'          => $event->creator ? [
                'id'       => $event->creator->id,
                'username' => $event->creator->username,
                'name'     => $event->creator->name,
            ] : null,
            'game'         => $event->game ? [
                'id'   => $event->game->id,
                'name' => $event->game->name,
                'slug' => $event->game->slug,
            ] : null,
            'myAttendance' => $this->mapMyAttendance($myAttendance),
        ];
    }
}
