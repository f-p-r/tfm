<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CanonicalSlug implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            $fail('El campo :attribute debe ser una cadena de texto.');
            return;
        }

        // Validar longitud máxima
        if (strlen($value) > 64) {
            $fail('El campo :attribute no puede tener más de 64 caracteres.');
            return;
        }

        // Validar que no esté vacío
        if (empty($value)) {
            $fail('El campo :attribute no puede estar vacío.');
            return;
        }

        // Validar que no tenga espacios
        if (preg_match('/\s/', $value)) {
            $fail('El campo :attribute no puede contener espacios.');
            return;
        }

        // Validar que sea lowercase (no mayúsculas)
        if ($value !== strtolower($value)) {
            $fail('El campo :attribute debe estar en minúsculas.');
            return;
        }

        // Validar que no tenga acentos ni diacríticos
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($normalized !== $value) {
            $fail('El campo :attribute no puede contener acentos o caracteres especiales.');
            return;
        }

        // Validar formato: solo [a-z0-9-]
        if (!preg_match('/^[a-z0-9-]+$/', $value)) {
            $fail('El campo :attribute solo puede contener letras minúsculas, números y guiones.');
            return;
        }

        // Validar que no tenga guiones repetidos
        if (preg_match('/--/', $value)) {
            $fail('El campo :attribute no puede contener guiones repetidos.');
            return;
        }

        // Validar que no comience ni termine con guion
        if (preg_match('/^-|-$/', $value)) {
            $fail('El campo :attribute no puede comenzar ni terminar con guion.');
            return;
        }
    }
}
