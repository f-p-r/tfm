<?php

namespace App\Http\Requests;

use App\Models\EventAttendanceStatusType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserEventRequest extends FormRequest
{
    /**
     * La autorización se gestiona en el controlador.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para la actualización de asistencia.
     * Solo se permite modificar el estado. user_id y event_id son inmutables.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id'  => ['prohibited'],
            'event_id' => ['prohibited'],
            'status'   => [
                'required',
                'integer',
                Rule::in(array_column(EventAttendanceStatusType::all()->toArray(), 'id')),
            ],
        ];
    }

    /**
     * Mensajes de error personalizados.
     */
    public function messages(): array
    {
        return [
            'user_id.prohibited'  => 'No se permite cambiar el usuario de una asistencia.',
            'event_id.prohibited' => 'No se permite cambiar el evento de una asistencia.',
            'status.required'     => 'El estado es obligatorio.',
            'status.in'           => 'El estado especificado no es válido.',
        ];
    }
}
