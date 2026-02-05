<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserAssociationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'exists:users,id',
                Rule::unique('user_association', 'user_id')
                    ->where('association_id', $this->input('association_id')),
            ],
            'association_id' => 'required|exists:associations,id',
            'association_user_id' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('user_association', 'association_user_id')
                    ->where('association_id', $this->input('association_id')),
            ],
            'joined_at' => 'nullable|date',
            'status_id' => [
                'nullable',
                'exists:association_member_statuses,id',
                function ($attribute, $value, $fail) {
                    if ($value && $this->input('association_id')) {
                        $status = \App\Models\AssociationMemberStatus::find($value);
                        if ($status && $status->association_id !== (int)$this->input('association_id')) {
                            $fail('El estado seleccionado no pertenece a la asociación especificada.');
                        }
                    }
                },
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'El usuario es obligatorio.',
            'user_id.exists' => 'El usuario seleccionado no existe.',
            'user_id.unique' => 'El usuario ya es miembro de esta asociación.',
            'association_id.required' => 'La asociación es obligatoria.',
            'association_id.exists' => 'La asociación seleccionada no existe.',
            'association_user_id.unique' => 'Este identificador de usuario ya está en uso en esta asociación.',
            'joined_at.date' => 'La fecha de ingreso no es válida.',
            'status_id.exists' => 'El estado seleccionado no existe.',
        ];
    }
}
