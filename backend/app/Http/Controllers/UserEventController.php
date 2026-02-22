<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserEventRequest;
use App\Http\Requests\UpdateUserEventRequest;
use App\Models\Event;
use App\Models\EventAttendanceStatusType;
use App\Models\RoleGrant;
use App\Models\User;
use App\Models\UserEvent;
use App\Services\AuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserEventController extends Controller
{
    public function __construct(protected AuthorizationService $authzService)
    {
    }

    /**
     * Listar asistencias a eventos.
     * Requiere autenticación. Permite filtrar por evento, usuario y estado.
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserEvent::query()->with(['user', 'event', 'statusType']);

        if ($request->has('event_id')) {
            $query->where('event_id', $request->input('event_id'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $attendances = $query->orderByDesc('status_date')->get()
            ->map(fn(UserEvent $ue) => $this->mapUserEvent($ue));

        return response()->json($attendances);
    }

    /**
     * Crear una solicitud de asistencia a un evento.
     * Cualquier usuario autenticado puede solicitar asistencia.
     * El estado se fuerza automáticamente a PENDIENTE (1).
     */
    public function store(StoreUserEventRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Verificar que no exista ya una asistencia para este usuario y evento
        $exists = UserEvent::where('user_id', $data['user_id'])
            ->where('event_id', $data['event_id'])
            ->exists();

        if ($exists) {
            return response()->json(
                ['message' => 'Ya existe una solicitud de asistencia para este usuario y evento.'],
                409
            );
        }

        // El estado siempre se crea como PENDIENTE, independientemente de lo enviado
        $userEvent = UserEvent::create([
            'user_id'  => $data['user_id'],
            'event_id' => $data['event_id'],
            'status'   => EventAttendanceStatusType::PENDING,
            // status_date se asigna automáticamente en el booted() del modelo
        ]);

        return response()->json(
            $this->mapUserEvent($userEvent->load(['user', 'event', 'statusType'])),
            201
        );
    }

    /**
     * Obtener el detalle de una asistencia.
     */
    public function show(UserEvent $userEvent): JsonResponse
    {
        return response()->json(
            $this->mapUserEvent($userEvent->load(['user', 'event', 'statusType']))
        );
    }

    /**
     * Actualizar el estado de una asistencia (aprobar / rechazar).
     * Requiere permiso events.edit en el scope del evento asociado.
     */
    public function update(UpdateUserEventRequest $request, UserEvent $userEvent): JsonResponse
    {
        $event = $userEvent->event ?? Event::findOrFail($userEvent->event_id);

        $this->checkPermissions(
            $request->user(),
            'events.edit',
            $event->scope_type,
            $event->scope_id
        );

        // status_date se actualiza automáticamente en el booted() del modelo
        $userEvent->update(['status' => $request->validated()['status']]);

        return response()->json(
            $this->mapUserEvent($userEvent->refresh()->load(['user', 'event', 'statusType']))
        );
    }

    /**
     * Eliminar una asistencia.
     * Requiere permiso events.edit en el scope del evento asociado.
     */
    public function destroy(Request $request, UserEvent $userEvent): JsonResponse
    {
        $event = $userEvent->event ?? Event::findOrFail($userEvent->event_id);

        $this->checkPermissions(
            $request->user(),
            'events.edit',
            $event->scope_type,
            $event->scope_id
        );

        $userEvent->delete();

        return response()->json(null, 204);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Comprobar permisos según scope del evento.
     */
    protected function checkPermissions(User $user, string $permission, int $scopeType, ?int $scopeId): void
    {
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

            abort(403, "No tienes permisos para gestionar asistencias a eventos {$scopeName}");
        }
    }

    /**
     * Mapear UserEvent a array de respuesta.
     */
    private function mapUserEvent(UserEvent $userEvent): array
    {
        return [
            'id'         => $userEvent->id,
            'userId'     => $userEvent->user_id,
            'eventId'    => $userEvent->event_id,
            'status'     => $userEvent->status,
            'statusDate' => $userEvent->status_date?->toISOString(),
            'createdAt'  => $userEvent->created_at?->toISOString(),
            'updatedAt'  => $userEvent->updated_at?->toISOString(),
            'user'       => $userEvent->user ? [
                'id'       => $userEvent->user->id,
                'username' => $userEvent->user->username,
                'name'     => $userEvent->user->name,
                'email'    => $userEvent->user->email,
            ] : null,
            'event'      => $userEvent->event ? [
                'id'    => $userEvent->event->id,
                'title' => $userEvent->event->title,
                'slug'  => $userEvent->event->slug,
            ] : null,
            'statusType' => $userEvent->statusType ? [
                'id'   => $userEvent->statusType->id,
                'name' => $userEvent->statusType->name,
            ] : null,
        ];
    }
}
