<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssociationMemberStatusRequest extends FormRequest
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
            'association_id' => 'required|exists:associations,id',
            'type' => 'required|exists:association_member_status_types,id',
            'order' => 'required|integer',
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('association_member_statuses', 'name')
                    ->where('association_id', $this->input('association_id')),
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
            'association_id.required' => 'La asociación es obligatoria.',
            'association_id.exists' => 'La asociación seleccionada no existe.',
            'type.required' => 'El tipo de estado es obligatorio.',
            'type.exists' => 'El tipo de estado seleccionado no existe.',
            'order.required' => 'El orden es obligatorio.',
            'order.integer' => 'El orden debe ser un número entero.',
            'name.required' => 'El nombre es obligatorio.',
            'name.unique' => 'Ya existe un estado con este nombre para esta asociación.',
        ];
    }
}
