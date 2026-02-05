<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserAssociationRequest extends FormRequest
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
        $membershipId = $this->route('user_association');
        $currentMembership = $membershipId instanceof \App\Models\UserAssociation
            ? $membershipId
            : \App\Models\UserAssociation::find($membershipId);

        return [
            'user_id' => [
                'sometimes',
                'exists:users,id',
                Rule::unique('user_association', 'user_id')
                    ->where('association_id', $this->input('association_id') ?? $currentMembership?->association_id)
                    ->ignore($membershipId),
            ],
            'association_id' => 'sometimes|exists:associations,id',
            'association_user_id' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('user_association', 'association_user_id')
                    ->where('association_id', $this->input('association_id') ?? $currentMembership?->association_id)
                    ->ignore($membershipId),
            ],
            'joined_at' => 'nullable|date',
            'status_id' => [
                'nullable',
                'exists:association_member_statuses,id',
                function ($attribute, $value, $fail) use ($currentMembership) {
                    if ($value) {
                        $associationId = $this->input('association_id') ?? $currentMembership?->association_id;
                        if ($associationId) {
                            $status = \App\Models\AssociationMemberStatus::find($value);
                            if ($status && $status->association_id !== (int)$associationId) {
                                $fail('El estado seleccionado no pertenece a la asociación especificada.');
                            }
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
            'user_id.exists' => 'El usuario seleccionado no existe.',
            'user_id.unique' => 'El usuario ya es miembro de esta asociación.',
            'association_id.exists' => 'La asociación seleccionada no existe.',
            'association_user_id.unique' => 'Este identificador de usuario ya está en uso en esta asociación.',
            'joined_at.date' => 'La fecha de ingreso no es válida.',
            'status_id.exists' => 'El estado seleccionado no existe.',
        ];
    }
}
