<?php

return [
    'accepted' => 'El campo :attribute debe ser aceptado.',
    'array' => 'El campo :attribute debe ser un arreglo.',
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'date' => 'El campo :attribute no es una fecha válida.',
    'integer' => 'El campo :attribute debe ser un número entero.',
    'in' => 'El campo :attribute es inválido.',
    'required' => 'El campo :attribute es obligatorio.',
    'required_with' => 'El campo :attribute es obligatorio cuando :values está presente.',
    'string' => 'El campo :attribute debe ser una cadena de texto.',
    'unique' => 'El :attribute ya está en uso.',

    'custom' => [
        'slug' => [
            'unique' => 'El slug ya está en uso.',
        ],
        'content.segments' => [
            'required' => 'El campo content.segments es obligatorio.',
        ],
    ],

    'attributes' => [
        'slug' => 'slug',
        'content.segments' => 'segmentos de contenido',
    ],
];
