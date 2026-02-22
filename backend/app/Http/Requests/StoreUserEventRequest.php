<?php

namespace App\Http\Requests;

use App\Models\EventAttendanceStatusType;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserEventRequest extends FormRequest
{
    /**
     * La autorización se gestiona en el controlador.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para la creación de una solicitud de asistencia a evento.
     * El status se fuerza siempre a PENDIENTE (1); no es enviable por el cliente.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id'  => ['required', 'integer', 'exists:users,id'],
            'event_id' => [
                'required',
                'integer',
                'exists:events,id',
                function ($attribute, $value, $fail) {
                    $event = \App\Models\Event::find($value);

                    if (!$event) {
                        return; // ya cubierto por exists:events,id
                    }

                    if (!$event->active) {
                        $fail('El evento no está activo.');
                    }

                    if (!$event->registration_open) {
                        $fail('El evento no tiene la inscripción abierta.');
                    }
                },
            ],
        ];
    }

    /**
     * Mensajes de error personalizados.
     */
    public function messages(): array
    {
        return [
            'user_id.required'  => 'El usuario es obligatorio.',
            'user_id.exists'    => 'El usuario especificado no existe.',
            'event_id.required' => 'El evento es obligatorio.',
            'event_id.exists'   => 'El evento especificado no existe.',
        ];
    }
}
