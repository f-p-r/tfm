<?php

namespace App\Http\Requests;

use App\Enums\ScopeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AuthzQueryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'scopeType' => ['required', 'integer', Rule::in(ScopeType::values())],
            'scopeIds' => ['required', 'array'],
            'scopeIds.*' => ['integer', 'min:1'],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
            'breakdown' => ['required', 'boolean'],
        ];
    }

    public function getScopeType(): int
    {
        return $this->input('scopeType');
    }

    public function getScopeIds(): array
    {
        return $this->input('scopeIds', []);
    }

    public function getPermissions(): array
    {
        return $this->input('permissions', []);
    }

    public function getBreakdown(): bool
    {
        return $this->boolean('breakdown');
    }
}
