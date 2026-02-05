<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssociationMemberStatusRequest extends FormRequest
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
        $statusId = $this->route('association_member_status');

        return [
            'association_id' => 'sometimes|exists:associations,id',
            'type' => 'sometimes|exists:association_member_status_types,id',
            'order' => 'sometimes|integer',
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('association_member_statuses', 'name')
                    ->where('association_id', $this->input('association_id') ?? $this->route('association_member_status')->association_id)
                    ->ignore($statusId),
            ],
            'description' => 'nullable|string',
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
            'association_id.exists' => 'La asociación seleccionada no existe.',
            'type.exists' => 'El tipo de estado seleccionado no existe.',
            'order.integer' => 'El orden debe ser un número entero.',
            'name.unique' => 'Ya existe un estado con este nombre para esta asociación.',
        ];
    }
}
